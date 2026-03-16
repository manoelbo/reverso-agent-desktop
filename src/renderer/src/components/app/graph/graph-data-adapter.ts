import type { DossierIndexPayload } from "../../../../../shared/workspace-markdown"
import type { LeadsIndexPayload } from "../../../../../shared/workspace-leads"
import type { SourcesIndexPayload } from "../../../../../shared/workspace-sources"
import type {
  AllegationFileItem,
  FindingFileItem,
  InvestigationFileItem,
  InvestigationIndexPayload,
} from "../../../../../shared/workspace-investigation"
import { normalizeWikiKey } from "@/components/app/dossier/types"
import { readDossierDocument } from "@/components/app/dossier/workspace-client"
import { readLeadDocument } from "@/components/app/leads/workspace-client"
import {
  splitPdfMentionSuffix,
  resolveSourcePreviewFromWikiValue,
} from "@/components/app/markdown/wiki-linking"
import { readSourceDocument } from "@/components/app/sources/workspace-client"
import {
  normalizeSourceFileKey,
  buildSourcesPreviewLookup,
  type SourcesPreviewLookup,
} from "@/components/app/sources/types"
import { readInvestigationDocument } from "@/components/app/investigation/workspace-client"
import type { GraphBuildCache, GraphData, GraphEdge, GraphNode, GraphNodeType } from "@/components/app/graph/types"

const WIKILINK_PATTERN = /\[\[([^[\]]+)\]\]/g

type NodeDraft = Omit<GraphNode, "mentionCount" | "degree">
type BuildNodeContext = {
  nodeById: Map<string, NodeDraft>
  aliasToNodeId: Map<string, string>
}

type BuildEdgeContext = {
  edgesById: Map<string, GraphEdge>
  mentionByNodeId: Map<string, number>
}

export type BuildGraphFromWorkspaceInput = {
  dossierIndex: DossierIndexPayload | null
  leadsIndex: LeadsIndexPayload | null
  sourcesIndex: SourcesIndexPayload | null
  investigationIndex: InvestigationIndexPayload | null
  cache?: GraphBuildCache
}

export function createGraphBuildCache(): GraphBuildCache {
  return {
    outgoingByDocumentId: new Map(),
  }
}

function pushAlias(aliasToNodeId: Map<string, string>, rawAlias: string, nodeId: string): void {
  const normalized = normalizeWikiKey(rawAlias)
  if (!normalized || aliasToNodeId.has(normalized)) return
  aliasToNodeId.set(normalized, nodeId)
}

function createNodeId(prefix: string, relativePath: string): string {
  return `${prefix}:${relativePath}`
}

function segmentFromRelativePath(relativePath: string, index: number): string | null {
  const segments = relativePath.split("/").filter(Boolean)
  return segments[index] ?? null
}

function inferTimelineYear(item: DossierIndexPayload["allFiles"][number]): string {
  const folderYear = segmentFromRelativePath(item.relativePath, 1)
  if (folderYear && /^\d{4}$/.test(folderYear)) return folderYear
  const stemYear = item.fileStem.match(/\b(19|20)\d{2}\b/)?.[0]
  if (stemYear) return stemYear
  const titleYear = item.title.match(/\b(19|20)\d{2}\b/)?.[0]
  if (titleYear) return titleYear
  return "Unknown year"
}

function projectDossierNode(item: DossierIndexPayload["allFiles"][number]): {
  nodeId: string
  label: string
  aliases: string[]
} {
  if (item.section === "places") {
    const country = segmentFromRelativePath(item.relativePath, 1) ?? "Unknown country"
    const city = segmentFromRelativePath(item.relativePath, 2) ?? item.title
    const countryKey = normalizeWikiKey(country) || "unknown-country"
    const cityKey = normalizeWikiKey(city) || normalizeWikiKey(item.fileStem) || "unknown-city"
    return {
      nodeId: createNodeId("dossier", `places/${countryKey}/${cityKey}`),
      label: city,
      aliases: [item.title, item.fileStem, item.fileName.replace(/\.md$/i, ""), city, `${city} ${country}`],
    }
  }

  if (item.section === "timeline") {
    const year = inferTimelineYear(item)
    return {
      nodeId: createNodeId("dossier", `timeline/${year}`),
      label: year,
      aliases: [item.title, item.fileStem, item.fileName.replace(/\.md$/i, ""), year],
    }
  }

  return {
    nodeId: createNodeId("dossier", item.relativePath),
    label: item.title,
    aliases: [item.title, item.fileStem, item.fileName.replace(/\.md$/i, "")],
  }
}

function toEntitySequenceLabel(kind: "allegation" | "finding", rawId: string, fallback: string): string {
  const direct = rawId.match(new RegExp(`^${kind}-(\\d+)$`, "i"))?.[1]
  if (direct) {
    const prefix = kind === "allegation" ? "Allegation" : "Finding"
    return `${prefix} ${direct}`
  }
  const fallbackMatch = fallback.match(new RegExp(`^${kind}-(\\d+)$`, "i"))?.[1]
  if (fallbackMatch) {
    const prefix = kind === "allegation" ? "Allegation" : "Finding"
    return `${prefix} ${fallbackMatch}`
  }
  return kind === "allegation" ? "Allegation" : "Finding"
}

function sectionToNodeType(section: DossierIndexPayload["allFiles"][number]["section"]): GraphNodeType {
  if (section === "people") return "person"
  if (section === "groups") return "group"
  if (section === "places") return "place"
  return "timeline"
}

function parseWikiLinks(content: string): string[] {
  const values: string[] = []
  const seen = new Set<string>()
  let match = WIKILINK_PATTERN.exec(content)
  while (match) {
    const value = match[1].trim()
    if (value && !seen.has(value)) {
      values.push(value)
      seen.add(value)
    }
    match = WIKILINK_PATTERN.exec(content)
  }
  return values
}

function addNode(ctx: BuildNodeContext, node: NodeDraft, aliases: string[]): void {
  ctx.nodeById.set(node.id, node)
  for (const alias of aliases) pushAlias(ctx.aliasToNodeId, alias, node.id)
}

function addEdge(ctx: BuildEdgeContext, source: string, target: string, reason: GraphEdge["reason"]): void {
  if (source === target) return
  const edgeId = `${source}->${target}:${reason}`
  if (!ctx.edgesById.has(edgeId)) {
    ctx.edgesById.set(edgeId, { id: edgeId, source, target, reason })
  }
  ctx.mentionByNodeId.set(target, (ctx.mentionByNodeId.get(target) ?? 0) + 1)
}

function resolveWikiTargetNodeId(
  wikiValue: string,
  aliasToNodeId: Map<string, string>,
  sourcesLookup: SourcesPreviewLookup
): string | null {
  const normalized = normalizeWikiKey(wikiValue)
  const aliasMatch = aliasToNodeId.get(normalized)
  if (aliasMatch) return aliasMatch

  const sourceMatch = resolveSourcePreviewFromWikiValue(wikiValue, sourcesLookup)
  if (sourceMatch) return createNodeId("source", sourceMatch.relativePath)

  const pdfBase = splitPdfMentionSuffix(wikiValue).base
  const docIdKey = normalizeSourceFileKey(pdfBase)
  if (docIdKey) {
    const byDocId = sourcesLookup.byDocId.get(docIdKey)
    if (byDocId) return createNodeId("source", byDocId.relativePath)
  }

  return null
}

async function getOutgoingLinksForDocument(
  cache: GraphBuildCache,
  docKey: string,
  updatedAt: string,
  readContent: () => Promise<string | null>
): Promise<string[]> {
  const cached = cache.outgoingByDocumentId.get(docKey)
  if (cached && cached.updatedAt === updatedAt) return cached.outgoing
  const content = await readContent()
  if (!content) return []
  const outgoing = parseWikiLinks(content)
  cache.outgoingByDocumentId.set(docKey, { updatedAt, outgoing })
  return outgoing
}

export async function buildGraphFromWorkspace(input: BuildGraphFromWorkspaceInput): Promise<GraphData> {
  const cache = input.cache ?? createGraphBuildCache()
  const sourcesLookup = buildSourcesPreviewLookup(input.sourcesIndex)
  const nodeCtx: BuildNodeContext = {
    nodeById: new Map(),
    aliasToNodeId: new Map(),
  }
  const edgeCtx: BuildEdgeContext = {
    edgesById: new Map(),
    mentionByNodeId: new Map(),
  }

  for (const item of input.dossierIndex?.allFiles ?? []) {
    const projected = projectDossierNode(item)
    if (!nodeCtx.nodeById.has(projected.nodeId)) {
      addNode(
        nodeCtx,
        {
          id: projected.nodeId,
          label: projected.label,
          type: sectionToNodeType(item.section),
          relativePath: item.relativePath,
        },
        []
      )
    }
    for (const alias of projected.aliases) pushAlias(nodeCtx.aliasToNodeId, alias, projected.nodeId)
  }

  for (const item of input.leadsIndex?.files ?? []) {
    const nodeId = createNodeId("lead", item.relativePath)
    addNode(
      nodeCtx,
      {
        id: nodeId,
        label: item.title,
        type: "lead",
        relativePath: item.relativePath,
      },
      [item.title, item.slug, item.fileStem]
    )
  }

  for (const item of input.sourcesIndex?.previews ?? []) {
    const nodeId = createNodeId("source", item.relativePath)
    addNode(
      nodeCtx,
      {
        id: nodeId,
        label: item.title,
        type: "source",
        relativePath: item.relativePath,
      },
      [item.title, item.fileName, item.fileName.replace(/\.pdf$/i, ""), item.docId]
    )
  }

  for (const item of input.investigationIndex?.allegations ?? []) {
    const nodeId = createNodeId("allegation", item.relativePath)
    addNode(
      nodeCtx,
      {
        id: nodeId,
        label: toEntitySequenceLabel("allegation", item.id, item.fileStem),
        type: "allegation",
        relativePath: item.relativePath,
        documentKind: "allegation",
      },
      [item.id, item.fileStem, item.title]
    )
  }

  for (const item of input.investigationIndex?.findings ?? []) {
    const nodeId = createNodeId("finding", item.relativePath)
    addNode(
      nodeCtx,
      {
        id: nodeId,
        label: toEntitySequenceLabel("finding", item.id, item.fileStem),
        type: "finding",
        relativePath: item.relativePath,
        documentKind: "finding",
      },
      [item.id, item.fileStem, item.title]
    )
  }

  const dossierJobs = (input.dossierIndex?.allFiles ?? []).map(async (item) => {
    const sourceNodeId = projectDossierNode(item).nodeId
    const docKey = `dossier:${item.relativePath}`
    const links = await getOutgoingLinksForDocument(cache, docKey, item.updatedAt, async () => {
      const payload = await readDossierDocument(item.relativePath)
      return payload?.content ?? null
    })
    for (const link of links) {
      const targetId = resolveWikiTargetNodeId(link, nodeCtx.aliasToNodeId, sourcesLookup)
      if (targetId) addEdge(edgeCtx, sourceNodeId, targetId, "wikilink")
    }
  })

  const leadJobs = (input.leadsIndex?.files ?? []).map(async (item) => {
    const sourceNodeId = createNodeId("lead", item.relativePath)
    const docKey = `lead:${item.relativePath}`
    const links = await getOutgoingLinksForDocument(cache, docKey, item.updatedAt, async () => {
      const payload = await readLeadDocument(item.relativePath)
      return payload?.content ?? null
    })
    for (const link of links) {
      const targetId = resolveWikiTargetNodeId(link, nodeCtx.aliasToNodeId, sourcesLookup)
      if (targetId) addEdge(edgeCtx, sourceNodeId, targetId, "wikilink")
    }
  })

  const sourceJobs = (input.sourcesIndex?.previews ?? []).map(async (item) => {
    const sourceNodeId = createNodeId("source", item.relativePath)
    const docKey = `source:${item.relativePath}`
    const links = await getOutgoingLinksForDocument(cache, docKey, item.updatedAt, async () => {
      const payload = await readSourceDocument(item.relativePath)
      return payload?.content ?? null
    })
    for (const link of links) {
      const targetId = resolveWikiTargetNodeId(link, nodeCtx.aliasToNodeId, sourcesLookup)
      if (targetId) addEdge(edgeCtx, sourceNodeId, targetId, "wikilink")
    }
  })

  const investigationItems: InvestigationFileItem[] = [
    ...(input.investigationIndex?.allegations ?? []),
    ...(input.investigationIndex?.findings ?? []),
  ]
  const investigationJobs = investigationItems.map(async (item) => {
    const sourceNodeId = createNodeId(item.kind, item.relativePath)
    const docKey = `${item.kind}:${item.relativePath}`
    const links = await getOutgoingLinksForDocument(cache, docKey, item.updatedAt, async () => {
      const payload = await readInvestigationDocument(item.kind, item.relativePath)
      return payload?.content ?? null
    })
    for (const link of links) {
      const targetId = resolveWikiTargetNodeId(link, nodeCtx.aliasToNodeId, sourcesLookup)
      if (targetId) addEdge(edgeCtx, sourceNodeId, targetId, "wikilink")
    }
  })

  const allegationItems = input.investigationIndex?.allegations ?? []
  for (const item of allegationItems) {
    const sourceNodeId = createNodeId("allegation", item.relativePath)
    const leadNodeId = resolveLeadNodeId(item, input.leadsIndex)
    if (leadNodeId) addEdge(edgeCtx, sourceNodeId, leadNodeId, "leadReference")
    for (const findingId of item.findingIds) {
      const targetNodeId = resolveInvestigationIdNodeId(input.investigationIndex, findingId)
      if (targetNodeId) addEdge(edgeCtx, sourceNodeId, targetNodeId, "allegationFinding")
    }
  }

  const findingItems = input.investigationIndex?.findings ?? []
  for (const item of findingItems) {
    const sourceNodeId = createNodeId("finding", item.relativePath)
    const leadNodeId = resolveLeadNodeId(item, input.leadsIndex)
    if (leadNodeId) addEdge(edgeCtx, sourceNodeId, leadNodeId, "leadReference")
    for (const allegationId of item.allegationIds) {
      const targetNodeId = resolveInvestigationIdNodeId(input.investigationIndex, allegationId)
      if (targetNodeId) addEdge(edgeCtx, sourceNodeId, targetNodeId, "findingAllegation")
    }
    for (const sourceId of item.evidenceSourceIds) {
      const targetNodeId = resolveSourceEvidenceNodeId(sourceId, sourcesLookup)
      if (targetNodeId) addEdge(edgeCtx, sourceNodeId, targetNodeId, "evidence")
    }
  }

  await Promise.all([...dossierJobs, ...leadJobs, ...sourceJobs, ...investigationJobs])

  const nodes: GraphNode[] = Array.from(nodeCtx.nodeById.values()).map((item) => ({
    ...item,
    mentionCount: edgeCtx.mentionByNodeId.get(item.id) ?? 0,
    degree: 0,
  }))
  const nodeById = new Map(nodes.map((node) => [node.id, node]))
  const neighborsByNodeId = new Map<string, Set<string>>()

  for (const edge of edgeCtx.edgesById.values()) {
    const source = nodeById.get(edge.source)
    const target = nodeById.get(edge.target)
    if (!source || !target) continue
    source.degree += 1
    target.degree += 1
    if (!neighborsByNodeId.has(edge.source)) neighborsByNodeId.set(edge.source, new Set())
    if (!neighborsByNodeId.has(edge.target)) neighborsByNodeId.set(edge.target, new Set())
    neighborsByNodeId.get(edge.source)?.add(edge.target)
    neighborsByNodeId.get(edge.target)?.add(edge.source)
  }

  return {
    nodes,
    edges: Array.from(edgeCtx.edgesById.values()),
    neighborsByNodeId,
    nodeById,
  }
}

function resolveLeadNodeId(
  item: AllegationFileItem | FindingFileItem,
  leadsIndex: LeadsIndexPayload | null
): string | null {
  if (!item.leadSlug) return null
  const lead = leadsIndex?.files.find((candidate) => candidate.slug === item.leadSlug)
  return lead ? createNodeId("lead", lead.relativePath) : null
}

function resolveInvestigationIdNodeId(
  index: InvestigationIndexPayload | null,
  id: string
): string | null {
  const allegation = index?.allegations.find((candidate) => candidate.id === id)
  if (allegation) return createNodeId("allegation", allegation.relativePath)
  const finding = index?.findings.find((candidate) => candidate.id === id)
  if (finding) return createNodeId("finding", finding.relativePath)
  return null
}

function resolveSourceEvidenceNodeId(sourceId: string, sourcesLookup: SourcesPreviewLookup): string | null {
  const byDocId = sourcesLookup.byDocId.get(sourceId)
  if (byDocId) return createNodeId("source", byDocId.relativePath)
  const byPdfName = sourcesLookup.byPdfFileKey.get(normalizeSourceFileKey(sourceId))
  if (byPdfName) return createNodeId("source", byPdfName.relativePath)
  return null
}
