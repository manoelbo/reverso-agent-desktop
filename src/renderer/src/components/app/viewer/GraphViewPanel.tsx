"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from "react"
import ForceGraph2D from "react-force-graph-2d"

import type { DossierIndexPayload } from "../../../../../shared/workspace-markdown"
import type { LeadsIndexPayload } from "../../../../../shared/workspace-leads"
import type { SourcesIndexPayload } from "../../../../../shared/workspace-sources"
import type { InvestigationDocumentKind, InvestigationIndexPayload } from "../../../../../shared/workspace-investigation"
import {
  buildGraphFromWorkspace,
  createGraphBuildCache,
} from "@/components/app/graph/graph-data-adapter"
import type { GraphData, GraphNode, GraphNodeType } from "@/components/app/graph/types"
import { normalizeWikiKey, type SelectedDossierDocument } from "@/components/app/dossier/types"
import type { SelectedLeadDocument } from "@/components/app/leads/types"
import type { SelectedSourceDocument } from "@/components/app/sources/types"
import type { SelectedInvestigationDocument } from "@/components/app/investigation/types"
import { cn } from "@/lib/utils"

type GraphViewPanelProps = {
  dossierIndex: DossierIndexPayload | null
  leadsIndex: LeadsIndexPayload | null
  sourcesIndex: SourcesIndexPayload | null
  investigationIndex: InvestigationIndexPayload | null
  selectedDossierDocument: SelectedDossierDocument | null
  selectedLeadDocument: SelectedLeadDocument | null
  selectedSourceDocument: SelectedSourceDocument | null
  selectedInvestigationDocument: SelectedInvestigationDocument | null
  onOpenDossierDocument: (relativePath: string) => void
  onOpenLeadDocument: (relativePath: string) => void
  onOpenSourceDocument: (relativePath: string) => void
  onOpenInvestigationDocument: (documentKind: InvestigationDocumentKind, relativePath: string) => void
}

type GraphMode = "global" | "local"

const NODE_TYPE_ORDER: GraphNodeType[] = [
  "person",
  "group",
  "place",
  "timeline",
  "lead",
  "source",
  "allegation",
  "finding",
]

const DEFAULT_ENABLED_NODE_TYPES: GraphNodeType[] = [
  "person",
  "group",
  "place",
  "timeline",
  "lead",
  "source",
  "allegation",
  "finding",
]

const NODE_TYPE_COLORS: Record<GraphNodeType, string> = {
  person: "#10b981",
  group: "#14b8a6",
  place: "#06b6d4",
  timeline: "#f59e0b",
  lead: "#6366f1",
  source: "#f97316",
  allegation: "#ef4444",
  finding: "#8b5cf6",
}

const nodeTypeLabel: Record<GraphNodeType, string> = {
  person: "People",
  group: "Groups",
  place: "Places",
  timeline: "Timeline",
  lead: "Leads",
  source: "Sources",
  allegation: "Allegations",
  finding: "Findings",
}

const reasonLabel = {
  wikilink: "Wiki",
  evidence: "Evidence",
  allegationFinding: "Allegation→Finding",
  findingAllegation: "Finding→Allegation",
  leadReference: "Lead",
} as const

const GRAPH_PREFS_KEY = "reverso.graph-view.prefs.v1"
const GRAPH_PREFS_SCHEMA_VERSION = 2

function edgeEndpointId(endpoint: string | { id?: string } | undefined | null): string | null {
  if (!endpoint) return null
  if (typeof endpoint === "string") return endpoint
  if (typeof endpoint.id === "string") return endpoint.id
  return null
}

function toDossierGraphNodeId(relativePath: string): string {
  const segments = relativePath.split("/").filter(Boolean)
  const section = segments[0]

  if (section === "places") {
    const country = segments[1] ?? "unknown-country"
    const city = segments[2] ?? "unknown-city"
    const countryKey = normalizeWikiKey(country) || "unknown-country"
    const cityKey = normalizeWikiKey(city) || "unknown-city"
    return `dossier:places/${countryKey}/${cityKey}`
  }

  if (section === "timeline") {
    const folderYear = segments[1]
    const stem = segments.at(-1)?.replace(/\.md$/i, "") ?? ""
    const year = folderYear && /^\d{4}$/.test(folderYear) ? folderYear : stem.match(/\b(19|20)\d{2}\b/)?.[0] ?? "Unknown year"
    return `dossier:timeline/${year}`
  }

  return `dossier:${relativePath}`
}

function toCurrentNodeId(
  selectedDossierDocument: SelectedDossierDocument | null,
  selectedLeadDocument: SelectedLeadDocument | null,
  selectedSourceDocument: SelectedSourceDocument | null,
  selectedInvestigationDocument: SelectedInvestigationDocument | null
): string | null {
  if (selectedInvestigationDocument) {
    return `${selectedInvestigationDocument.documentKind}:${selectedInvestigationDocument.relativePath}`
  }
  if (selectedLeadDocument) return `lead:${selectedLeadDocument.relativePath}`
  if (selectedSourceDocument) return `source:${selectedSourceDocument.relativePath}`
  if (selectedDossierDocument) return toDossierGraphNodeId(selectedDossierDocument.relativePath)
  return null
}

export function GraphViewPanel({
  dossierIndex,
  leadsIndex,
  sourcesIndex,
  investigationIndex,
  selectedDossierDocument,
  selectedLeadDocument,
  selectedSourceDocument,
  selectedInvestigationDocument,
  onOpenDossierDocument,
  onOpenLeadDocument,
  onOpenSourceDocument,
  onOpenInvestigationDocument,
}: GraphViewPanelProps): JSX.Element {
  const [graph, setGraph] = useState<GraphData | null>(null)
  const [searchValue, setSearchValue] = useState("")
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null)
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enabledTypes, setEnabledTypes] = useState<Set<GraphNodeType>>(new Set(DEFAULT_ENABLED_NODE_TYPES))
  const [isDarkMode, setIsDarkMode] = useState(false)
  const cacheRef = useRef(createGraphBuildCache())
  const graphRef = useRef<any>(null)
  const draggedNodeIdRef = useRef<string | null>(null)
  const ignoreClickUntilRef = useRef(0)
  const lastClickRef = useRef<{ nodeId: string; at: number } | null>(null)

  useEffect(() => {
    if (typeof document === "undefined") return
    const root = document.documentElement
    const syncTheme = (): void => {
      setIsDarkMode(root.classList.contains("dark"))
    }
    syncTheme()
    const observer = new MutationObserver(syncTheme)
    observer.observe(root, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = window.localStorage.getItem(GRAPH_PREFS_KEY)
      if (!raw) return
      const prefs = JSON.parse(raw) as {
        schemaVersion?: number
        enabledTypes?: GraphNodeType[]
      }
      if (prefs.schemaVersion !== GRAPH_PREFS_SCHEMA_VERSION) {
        setEnabledTypes(new Set(DEFAULT_ENABLED_NODE_TYPES))
        return
      }
      if (Array.isArray(prefs.enabledTypes) && prefs.enabledTypes.length) {
        const valid = prefs.enabledTypes.filter((item): item is GraphNodeType => NODE_TYPE_ORDER.includes(item))
        if (valid.length) setEnabledTypes(new Set(valid))
      }
    } catch {
      // Ignore malformed persisted preferences.
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const payload = {
      schemaVersion: GRAPH_PREFS_SCHEMA_VERSION,
      enabledTypes: Array.from(enabledTypes),
    }
    window.localStorage.setItem(GRAPH_PREFS_KEY, JSON.stringify(payload))
  }, [enabledTypes])

  useEffect(() => {
    let mounted = true
    setIsLoading(true)
    setError(null)
    void buildGraphFromWorkspace({
      dossierIndex,
      leadsIndex,
      sourcesIndex,
      investigationIndex,
      cache: cacheRef.current,
    })
      .then((payload) => {
        if (!mounted) return
        setGraph((current) => {
          if (current) {
            const prevById = new Map<string, GraphNode & { x?: number; y?: number; vx?: number; vy?: number }>()
            for (const node of current.nodes as Array<GraphNode & { x?: number; y?: number; vx?: number; vy?: number }>) {
              prevById.set(node.id, node)
            }
            for (const node of payload.nodes as Array<GraphNode & { x?: number; y?: number; vx?: number; vy?: number }>) {
              const previous = prevById.get(node.id)
              if (!previous) continue
              if (typeof previous.x === "number") node.x = previous.x
              if (typeof previous.y === "number") node.y = previous.y
              if (typeof previous.vx === "number") node.vx = previous.vx
              if (typeof previous.vy === "number") node.vy = previous.vy
            }
          }
          return payload
        })
      })
      .catch((loadError) => {
        if (!mounted) return
        setError(loadError instanceof Error ? loadError.message : "Falha ao montar grafo.")
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [dossierIndex, leadsIndex, sourcesIndex, investigationIndex])

  const currentNodeId = toCurrentNodeId(
    selectedDossierDocument,
    selectedLeadDocument,
    selectedSourceDocument,
    selectedInvestigationDocument
  )

  useEffect(() => {
    if (!currentNodeId) return
    setFocusedNodeId(currentNodeId)
  }, [currentNodeId])

  useEffect(() => {
    const fg = graphRef.current
    if (!fg || !graph) return
    fg.d3AlphaDecay?.(0.024)
    fg.d3VelocityDecay?.(0.45)
    const linkForce = fg.d3Force?.("link")
    linkForce?.distance?.(72)
    linkForce?.strength?.(0.22)
    const chargeForce = fg.d3Force?.("charge")
    chargeForce?.strength?.(-170)
  }, [graph])

  const visibleNodeIds = useMemo(() => {
    if (!graph) return new Set<string>()
    return new Set(graph.nodes.filter((node) => enabledTypes.has(node.type)).map((node) => node.id))
  }, [enabledTypes, graph])

  const filteredGraph = useMemo(() => {
    if (!graph) return null
    const nodes = graph.nodes.filter((node) => visibleNodeIds.has(node.id))
    const edges = graph.edges.filter((edge) => {
      const sourceId = edgeEndpointId(edge.source as unknown as string | { id?: string })
      const targetId = edgeEndpointId(edge.target as unknown as string | { id?: string })
      if (!sourceId || !targetId) return false
      return visibleNodeIds.has(sourceId) && visibleNodeIds.has(targetId)
    })
    return { nodes, edges }
  }, [graph, visibleNodeIds])

  const graphDataMemo = useMemo(() => {
    if (!filteredGraph) return { nodes: [] as GraphNode[], links: [] as GraphData["edges"] }
    // Keep object reference stable between unrelated state updates (e.g. hover),
    // avoiding force simulation reheats caused by new graphData object identity.
    return { nodes: filteredGraph.nodes, links: filteredGraph.edges }
  }, [filteredGraph])

  const graphTotals = useMemo(() => {
    const totalNodes = graph?.nodes.length ?? 0
    const totalEdges = graph?.edges.length ?? 0
    const visibleNodes = filteredGraph?.nodes.length ?? 0
    const visibleEdges = filteredGraph?.edges.length ?? 0
    const unresolvedEdgeEndpoints =
      graph?.edges.reduce((count, edge) => {
        const sourceId = edgeEndpointId(edge.source as unknown as string | { id?: string })
        const targetId = edgeEndpointId(edge.target as unknown as string | { id?: string })
        if (!sourceId || !targetId) return count + 1
        return count
      }, 0) ?? 0
    return { totalNodes, totalEdges, visibleNodes, visibleEdges, unresolvedEdgeEndpoints }
  }, [graph, filteredGraph])

  const hasZeroVisibleEdges = graphTotals.totalEdges > 0 && graphTotals.visibleEdges === 0

  const searchMatches = useMemo(() => {
    if (!graph || !searchValue.trim()) return []
    const query = searchValue.trim().toLowerCase()
    return graph.nodes.filter((node) => node.label.toLowerCase().includes(query)).slice(0, 20)
  }, [graph, searchValue])

  const selectedNeighbors = useMemo(() => {
    if (!graph || !focusedNodeId) return new Set<string>()
    return graph.neighborsByNodeId.get(focusedNodeId) ?? new Set<string>()
  }, [graph, focusedNodeId])

  const activeNeighbors = useMemo(() => {
    const nodeId = hoveredNodeId ?? focusedNodeId
    if (!graph || !nodeId) return new Set<string>()
    return graph.neighborsByNodeId.get(nodeId) ?? new Set<string>()
  }, [graph, hoveredNodeId, focusedNodeId])

  const focusedConnections = useMemo(() => {
    if (!graph || !focusedNodeId) return []
    return graph.edges
      .filter((edge) => {
        const sourceId = edgeEndpointId(edge.source as unknown as string | { id?: string })
        const targetId = edgeEndpointId(edge.target as unknown as string | { id?: string })
        return sourceId === focusedNodeId || targetId === focusedNodeId
      })
      .map((edge) => {
        const sourceId = edgeEndpointId(edge.source as unknown as string | { id?: string })
        const targetId = edgeEndpointId(edge.target as unknown as string | { id?: string })
        const otherNodeId = sourceId === focusedNodeId ? targetId : sourceId
        if (!otherNodeId) return null
        const otherNode = graph.nodeById.get(otherNodeId)
        if (!otherNode) return null
        return {
          edge,
          direction: sourceId === focusedNodeId ? "outgoing" : "incoming",
          node: otherNode,
        }
      })
      .filter((item): item is { edge: GraphData["edges"][number]; direction: "incoming" | "outgoing"; node: GraphNode } =>
        Boolean(item)
      )
      .sort((left, right) => right.node.mentionCount - left.node.mentionCount)
  }, [focusedNodeId, graph])

  const activeNodeId = hoveredNodeId ?? focusedNodeId

  useEffect(() => {
    const fg = graphRef.current
    if (!fg || !visibleNodeIds.size) return
    if (focusedNodeId && visibleNodeIds.has(focusedNodeId) && graph?.nodeById.get(focusedNodeId)) return
    const timer = window.setTimeout(() => {
      fg.zoomToFit?.(350, 36, (node: unknown) => visibleNodeIds.has((node as GraphNode).id))
    }, 40)
    return () => window.clearTimeout(timer)
  }, [focusedNodeId, graph, visibleNodeIds])

  const toggleType = useCallback((nodeType: GraphNodeType): void => {
    setEnabledTypes((current) => {
      const next = new Set(current)
      if (next.has(nodeType)) next.delete(nodeType)
      else next.add(nodeType)
      return next
    })
  }, [])

  const resetGraphFilters = useCallback((): void => {
    setEnabledTypes(new Set(DEFAULT_ENABLED_NODE_TYPES))
  }, [])

  const navigateFromNode = useCallback((node: GraphNode): void => {
    if (node.type === "lead") {
      onOpenLeadDocument(node.relativePath)
      return
    }
    if (node.type === "source") {
      onOpenSourceDocument(node.relativePath)
      return
    }
    if (node.type === "allegation" || node.type === "finding") {
      const documentKind: InvestigationDocumentKind = node.type === "allegation" ? "allegation" : "finding"
      onOpenInvestigationDocument(documentKind, node.relativePath)
      return
    }
    onOpenDossierDocument(node.relativePath)
  }, [onOpenDossierDocument, onOpenInvestigationDocument, onOpenLeadDocument, onOpenSourceDocument])

  const openFocusedNode = useCallback((): void => {
    if (!focusedNodeId || !graph) return
    const node = graph.nodeById.get(focusedNodeId)
    if (!node) return
    navigateFromNode(node)
  }, [focusedNodeId, graph, navigateFromNode])

  const zoomToNode = useCallback((node: GraphNode): void => {
    const fg = graphRef.current
    if (!fg) return
    const visualNode = node as GraphNode & { x?: number; y?: number }
    if (typeof visualNode.x === "number" && typeof visualNode.y === "number") {
      fg.centerAt(visualNode.x, visualNode.y, 300)
      fg.zoom(2.1, 350)
    }
  }, [])

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-background">
      <div className="border-b border-border/60 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-md border border-border px-2.5 py-1 text-xs text-foreground"
            disabled={!focusedNodeId}
            onClick={openFocusedNode}
          >
            Open selected
          </button>
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search node..."
            className="ml-auto min-w-52 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {NODE_TYPE_ORDER.map((nodeType) => (
            <button
              key={nodeType}
              type="button"
              className={cn(
                "rounded border px-2 py-1 text-[11px]",
                enabledTypes.has(nodeType)
                  ? "border-border text-foreground"
                  : "border-border/60 text-muted-foreground opacity-60"
              )}
              onClick={() => toggleType(nodeType)}
              style={{
                backgroundColor: enabledTypes.has(nodeType) ? `${NODE_TYPE_COLORS[nodeType]}22` : "transparent",
              }}
            >
              {nodeTypeLabel[nodeType]}
            </button>
          ))}
        </div>
        {searchMatches.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {searchMatches.map((node) => (
              <button
                key={node.id}
                type="button"
                className="rounded border border-border px-2 py-1 text-[11px] text-foreground"
                onClick={() => {
                  setFocusedNodeId(node.id)
                  zoomToNode(node)
                }}
              >
                {node.label}
              </button>
            ))}
          </div>
        ) : null}
        <p className="mt-2 text-[11px] text-muted-foreground">
          Hover shows connected labels. Single click opens the document.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span>
            Nodes: {graphTotals.visibleNodes}/{graphTotals.totalNodes}
          </span>
          <span>
            Edges: {graphTotals.visibleEdges}/{graphTotals.totalEdges}
          </span>
          {graphTotals.unresolvedEdgeEndpoints > 0 ? (
            <span className="text-amber-700 dark:text-amber-300">
              unresolved endpoints: {graphTotals.unresolvedEdgeEndpoints}
            </span>
          ) : null}
          {hasZeroVisibleEdges ? (
            <button
              type="button"
              className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-700 dark:text-amber-300"
              onClick={resetGraphFilters}
            >
              Zero visible edges - reset filters
            </button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex flex-1">
        <div className="relative min-h-0 flex-1">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">Building graph...</div>
          ) : null}
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm text-destructive">{error}</div>
          ) : null}
          {graph && graph.nodes.length > 0 ? (
            <ForceGraph2D
              ref={graphRef}
              graphData={graphDataMemo}
              backgroundColor="rgba(0,0,0,0)"
              enableNodeDrag={false}
              enablePointerInteraction={true}
              showPointerCursor={true}
              linkHoverPrecision={8}
              autoPauseRedraw={true}
              cooldownTicks={100}
              cooldownTime={10000}
              warmupTicks={140}
              nodePointerAreaPaint={(node, color, ctx) => {
                const graphNode = node as GraphNode & { x?: number; y?: number }
                if (typeof graphNode.x !== "number" || typeof graphNode.y !== "number") return
                const radius = 10
                ctx.beginPath()
                ctx.arc(graphNode.x, graphNode.y, radius, 0, 2 * Math.PI, false)
                ctx.fillStyle = color
                ctx.fill()
              }}
              linkWidth={(link) => {
                const edge = link as { source: GraphNode; target: GraphNode; reason: keyof typeof reasonLabel }
                const sourceId = edgeEndpointId(edge.source as unknown as string | { id?: string })
                const targetId = edgeEndpointId(edge.target as unknown as string | { id?: string })
                const isPrimary = Boolean(activeNodeId && (sourceId === activeNodeId || targetId === activeNodeId))
                if (isPrimary) return 1.8
                if (edge.reason === "evidence") return 1.05
                // Keep non-focused links always visible but subtle.
                return 0.85
              }}
              linkColor={(link) => {
                const edge = link as { source: GraphNode; target: GraphNode; reason: keyof typeof reasonLabel }
                const sourceId = edgeEndpointId(edge.source as unknown as string | { id?: string })
                const targetId = edgeEndpointId(edge.target as unknown as string | { id?: string })
                const isPrimary = Boolean(activeNodeId && (sourceId === activeNodeId || targetId === activeNodeId))
                const dimmedAlpha = isDarkMode ? "0.28" : "0.22"
                const baseAlpha = isDarkMode ? "0.9" : "0.92"
                if (activeNodeId && !isPrimary) {
                  return isDarkMode
                    ? `rgba(248,250,252,${dimmedAlpha})`
                    : `rgba(15,23,42,${dimmedAlpha})`
                }
                if (edge.reason === "evidence") return isDarkMode ? "rgba(34,197,94,0.68)" : "rgba(21,128,61,0.65)"
                if (edge.reason === "allegationFinding" || edge.reason === "findingAllegation") {
                  return isDarkMode ? "rgba(244,63,94,0.64)" : "rgba(190,24,93,0.62)"
                }
                return isDarkMode
                  ? `rgba(248,250,252,${baseAlpha})`
                  : `rgba(15,23,42,${baseAlpha})`
              }}
              nodeColor={(node) => NODE_TYPE_COLORS[(node as GraphNode).type]}
              nodeVal={(node) => {
                const graphNode = node as GraphNode
                return 4.2 + Math.min(10, graphNode.mentionCount * 0.95)
              }}
              onNodeHover={(node) => {
                const nextId = node ? (node as GraphNode).id : null
                setHoveredNodeId((current) => (current === nextId ? current : nextId))
              }}
              onNodeDrag={(node) => {
                draggedNodeIdRef.current = (node as GraphNode).id
              }}
              onNodeDragEnd={() => {
                ignoreClickUntilRef.current = Date.now() + 250
                draggedNodeIdRef.current = null
              }}
              onNodeClick={(node) => {
                const graphNode = node as GraphNode
                if (draggedNodeIdRef.current === graphNode.id) return
                if (Date.now() < ignoreClickUntilRef.current) return
                setFocusedNodeId(graphNode.id)
                lastClickRef.current = { nodeId: graphNode.id, at: Date.now() }
                navigateFromNode(graphNode)
              }}
              nodeCanvasObject={(node, ctx, globalScale) => {
                const graphNode = node as GraphNode & { x?: number; y?: number }
                if (typeof graphNode.x !== "number" || typeof graphNode.y !== "number") return

                const isFocused = graphNode.id === focusedNodeId
                const isHovered = graphNode.id === hoveredNodeId
                const isNeighbor = activeNeighbors.has(graphNode.id)
                const isDimmed =
                  Boolean(activeNodeId) &&
                  graphNode.id !== activeNodeId &&
                  !activeNeighbors.has(graphNode.id) &&
                  !isFocused
                const radius = (4.2 + Math.min(10, graphNode.mentionCount * 0.95)) * (isFocused ? 1.3 : 1)
                ctx.beginPath()
                ctx.arc(graphNode.x, graphNode.y, radius, 0, 2 * Math.PI, false)
                ctx.fillStyle = NODE_TYPE_COLORS[graphNode.type]
                ctx.globalAlpha = isDimmed ? 0.32 : 1
                ctx.fill()

                if (isFocused || isNeighbor || isHovered) {
                  ctx.beginPath()
                  ctx.arc(graphNode.x, graphNode.y, radius + 2.5, 0, 2 * Math.PI, false)
                  ctx.lineWidth = 1.2
                  ctx.strokeStyle = isFocused ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.52)"
                  ctx.stroke()
                }

                const shouldDrawLabel =
                  isHovered || isFocused || Boolean(hoveredNodeId && isNeighbor)
                if (!shouldDrawLabel) {
                  ctx.globalAlpha = 1
                  return
                }

                const label = graphNode.label
                const isActiveHoverNode = Boolean(hoveredNodeId && graphNode.id === hoveredNodeId)
                const isConnectedToHover = Boolean(hoveredNodeId && isNeighbor && !isActiveHoverNode)
                // Draw hovered-node label in a post-render pass so it always stays on top.
                if (isActiveHoverNode) {
                  ctx.globalAlpha = 1
                  return
                }
                const labelScale = isActiveHoverNode ? 1.35 : isConnectedToHover ? 0.92 : 1
                const fontSize = (12 / globalScale) * labelScale
                if (fontSize < 3.1) {
                  ctx.globalAlpha = 1
                  return
                }

                ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`
                ctx.textAlign = "left"
                ctx.textBaseline = "middle"
                const labelX = graphNode.x + radius + 2
                const labelY = graphNode.y
                const textWidth = ctx.measureText(label).width
                const padX = 4 / globalScale
                const padY = 2 / globalScale
                ctx.fillStyle = isActiveHoverNode
                  ? isDarkMode
                    ? "rgba(15,23,42,0.9)"
                    : "rgba(248,250,252,0.98)"
                  : isConnectedToHover
                    ? isDarkMode
                      ? "rgba(15,23,42,0.58)"
                      : "rgba(248,250,252,0.82)"
                    : isDarkMode
                      ? "rgba(15,23,42,0.72)"
                      : "rgba(248,250,252,0.9)"
                ctx.fillRect(labelX - padX, labelY - fontSize / 2 - padY, textWidth + padX * 2, fontSize + padY * 2)
                ctx.fillStyle = isActiveHoverNode
                  ? isDarkMode
                    ? "rgba(248,250,252,1)"
                    : "rgba(2,6,23,1)"
                  : isConnectedToHover
                    ? isDarkMode
                      ? "rgba(248,250,252,0.9)"
                      : "rgba(15,23,42,0.84)"
                    : isDarkMode
                      ? "rgba(248,250,252,0.94)"
                      : "rgba(15,23,42,0.9)"
                ctx.fillText(label, labelX, labelY)
                ctx.globalAlpha = 1
              }}
              onRenderFramePost={(ctx, globalScale) => {
                if (!hoveredNodeId || !graph) return
                const hoveredNode = graph.nodeById.get(hoveredNodeId) as (GraphNode & { x?: number; y?: number }) | undefined
                if (!hoveredNode) return
                if (typeof hoveredNode.x !== "number" || typeof hoveredNode.y !== "number") return

                const isFocused = hoveredNode.id === focusedNodeId
                const radius = (4.2 + Math.min(10, hoveredNode.mentionCount * 0.95)) * (isFocused ? 1.3 : 1)

                // Redraw hovered node on top of all elements.
                ctx.beginPath()
                ctx.arc(hoveredNode.x, hoveredNode.y, radius + 0.6, 0, 2 * Math.PI, false)
                ctx.fillStyle = NODE_TYPE_COLORS[hoveredNode.type]
                ctx.globalAlpha = 1
                ctx.fill()

                ctx.beginPath()
                ctx.arc(hoveredNode.x, hoveredNode.y, radius + 2.8, 0, 2 * Math.PI, false)
                ctx.lineWidth = 1.5
                ctx.strokeStyle = isDarkMode ? "rgba(248,250,252,0.95)" : "rgba(2,6,23,0.88)"
                ctx.stroke()

                const fontSize = (12 / globalScale) * 1.35
                if (fontSize < 3.1) {
                  ctx.globalAlpha = 1
                  return
                }

                ctx.font = `${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`
                ctx.textAlign = "left"
                ctx.textBaseline = "middle"

                const labelX = hoveredNode.x + radius + 2
                const labelY = hoveredNode.y
                const textWidth = ctx.measureText(hoveredNode.label).width
                const padX = 4 / globalScale
                const padY = 2 / globalScale

                ctx.fillStyle = isDarkMode ? "rgba(15,23,42,0.92)" : "rgba(248,250,252,0.99)"
                ctx.fillRect(labelX - padX, labelY - fontSize / 2 - padY, textWidth + padX * 2, fontSize + padY * 2)

                ctx.fillStyle = isDarkMode ? "rgba(248,250,252,1)" : "rgba(2,6,23,1)"
                ctx.fillText(hoveredNode.label, labelX, labelY)
                ctx.globalAlpha = 1
              }}
              linkCanvasObjectMode={() => "after"}
            />
          ) : !isLoading && !error ? (
            <div className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm text-muted-foreground">
              No nodes available with current filters.
            </div>
          ) : null}
        </div>
        <aside className="hidden w-80 shrink-0 border-l border-border/60 bg-card/20 p-3 lg:flex lg:flex-col">
          <div className="mb-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">Connections</div>
          {focusedNodeId && graph?.nodeById.get(focusedNodeId) ? (
            <>
              <div className="rounded-md border border-border/60 bg-background/70 px-2.5 py-2 text-xs">
                <div className="font-medium text-foreground">{graph.nodeById.get(focusedNodeId)?.label}</div>
                <div className="mt-1 text-muted-foreground">
                  {graph.nodeById.get(focusedNodeId)?.type} • {focusedConnections.length} connections
                </div>
              </div>
              <div className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto">
                {focusedConnections.map((item) => (
                  <button
                    key={item.edge.id}
                    type="button"
                    className="w-full rounded-md border border-border/60 bg-background/70 px-2 py-1.5 text-left text-xs hover:bg-muted/50"
                    onClick={() => {
                      setFocusedNodeId(item.node.id)
                      zoomToNode(item.node)
                    }}
                  >
                    <div className="truncate font-medium text-foreground">{item.node.label}</div>
                    <div className="mt-0.5 text-muted-foreground">
                      {item.direction} • {reasonLabel[item.edge.reason]} • {item.node.type}
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-md border border-dashed border-border/60 px-2.5 py-2 text-xs text-muted-foreground">
              Select a node to inspect incoming and outgoing connections.
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
