import type {
  InvestigationDocumentKind,
  InvestigationFileItem,
  InvestigationIndexPayload,
} from "../../../../../shared/workspace-investigation"
import { normalizeWikiKey } from "@/components/app/dossier/types"

export type SelectedInvestigationDocument = {
  documentKind: InvestigationDocumentKind
  relativePath: string
  source: "sidebar" | "home" | "graph" | "wikilink"
}

export type InvestigationLookup = {
  byKindAndRelativePath: Map<string, InvestigationFileItem>
  byId: Map<string, InvestigationFileItem>
  byWikiKey: Map<string, InvestigationFileItem[]>
}

export function buildInvestigationLookup(index: InvestigationIndexPayload | null): InvestigationLookup {
  const byKindAndRelativePath = new Map<string, InvestigationFileItem>()
  const byId = new Map<string, InvestigationFileItem>()
  const byWikiKey = new Map<string, InvestigationFileItem[]>()
  const items = [...(index?.allegations ?? []), ...(index?.findings ?? [])]
  for (const item of items) {
    byKindAndRelativePath.set(`${item.kind}:${item.relativePath}`, item)
    byId.set(item.id, item)
    const wikiCandidates = [item.id, item.title, item.fileStem, item.fileName.replace(/\.md$/i, "")]
    for (const candidate of wikiCandidates) {
      const key = normalizeWikiKey(candidate)
      if (!key) continue
      const bucket = byWikiKey.get(key)
      if (bucket) bucket.push(item)
      else byWikiKey.set(key, [item])
    }
  }
  return { byKindAndRelativePath, byId, byWikiKey }
}
