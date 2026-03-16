import type { LeadFileItem, LeadsIndexPayload } from '../../../../../shared/workspace-leads'
import { normalizeWikiKey } from "@/components/app/dossier/types"

export type SelectedLeadDocument = {
  relativePath: string
  source: 'sidebar' | 'home' | 'wikilink' | 'graph'
}

export type LeadsLookup = {
  byRelativePath: Map<string, LeadFileItem>
  bySlug: Map<string, LeadFileItem>
  byWikiKey: Map<string, LeadFileItem[]>
}

export function buildLeadsLookup(index: LeadsIndexPayload | null): LeadsLookup {
  const byRelativePath = new Map<string, LeadFileItem>()
  const bySlug = new Map<string, LeadFileItem>()
  const byWikiKey = new Map<string, LeadFileItem[]>()

  for (const lead of index?.files ?? []) {
    byRelativePath.set(lead.relativePath, lead)
    bySlug.set(lead.slug, lead)
    const wikiCandidates = [
      lead.title,
      lead.slug,
      `lead-${lead.slug}`,
      lead.fileStem,
      lead.fileName.replace(/\.md$/i, ""),
    ]
    for (const candidate of wikiCandidates) {
      const key = normalizeWikiKey(candidate)
      if (!key) continue
      const bucket = byWikiKey.get(key)
      if (bucket) bucket.push(lead)
      else byWikiKey.set(key, [lead])
    }
  }

  return { byRelativePath, bySlug, byWikiKey }
}
