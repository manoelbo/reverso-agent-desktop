import type { DossierDocumentLookup } from "@/components/app/dossier/types"
import { normalizeWikiKey } from "@/components/app/dossier/types"
import type { LeadsLookup } from "@/components/app/leads/types"
import type { SourcesPreviewLookup } from "@/components/app/sources/types"
import { WIKILINK_SCHEME, resolveSourcePreviewFromWikiValue } from "@/components/app/markdown/wiki-linking"
import type { WikiLinkResolver } from "@/components/app/markdown/plugins/wiki-links"
import type { InvestigationLookup } from "@/components/app/investigation/types"

export type ParsedWikiLinkHref =
  | { kind: "dossier"; relativePath: string }
  | { kind: "source"; relativePath: string }
  | { kind: "lead"; relativePath: string }
  | { kind: "allegation"; relativePath: string }
  | { kind: "finding"; relativePath: string }
  | { kind: "self"; value: string }
  | { kind: "unresolved"; value: string }
  | { kind: "external"; href: string }

export type CreateWorkspaceWikiLinkResolverArgs = {
  dossierLookup: DossierDocumentLookup
  sourcesLookup: SourcesPreviewLookup
  currentDocumentPath: string
  leadsLookup?: LeadsLookup
  investigationLookup?: InvestigationLookup
}

export function parseWikiLinkHref(href: string): ParsedWikiLinkHref {
  if (href.startsWith(WIKILINK_SCHEME.dossier)) {
    return {
      kind: "dossier",
      relativePath: href.slice(WIKILINK_SCHEME.dossier.length),
    }
  }

  if (href.startsWith(WIKILINK_SCHEME.source)) {
    return {
      kind: "source",
      relativePath: href.slice(WIKILINK_SCHEME.source.length),
    }
  }

  if (href.startsWith(WIKILINK_SCHEME.lead)) {
    return {
      kind: "lead",
      relativePath: href.slice(WIKILINK_SCHEME.lead.length),
    }
  }

  if (href.startsWith(WIKILINK_SCHEME.allegation)) {
    return {
      kind: "allegation",
      relativePath: href.slice(WIKILINK_SCHEME.allegation.length),
    }
  }

  if (href.startsWith(WIKILINK_SCHEME.finding)) {
    return {
      kind: "finding",
      relativePath: href.slice(WIKILINK_SCHEME.finding.length),
    }
  }

  if (href.startsWith(WIKILINK_SCHEME.self)) {
    return {
      kind: "self",
      value: decodeURIComponent(href.slice(WIKILINK_SCHEME.self.length)),
    }
  }

  if (href.startsWith(WIKILINK_SCHEME.unresolved)) {
    return {
      kind: "unresolved",
      value: decodeURIComponent(href.slice(WIKILINK_SCHEME.unresolved.length)),
    }
  }

  return { kind: "external", href }
}

export function createWorkspaceWikiLinkResolver({
  dossierLookup,
  sourcesLookup,
  currentDocumentPath,
  leadsLookup,
  investigationLookup,
}: CreateWorkspaceWikiLinkResolverArgs): WikiLinkResolver {
  return (value) => {
    const key = normalizeWikiKey(value)
    const dossierMatch = dossierLookup.byWikiKey.get(key)?.[0]
    if (dossierMatch) {
      const isSelf = dossierMatch.relativePath === currentDocumentPath
      return {
        href: isSelf
          ? `${WIKILINK_SCHEME.self}${encodeURIComponent(value)}`
          : `${WIKILINK_SCHEME.dossier}${dossierMatch.relativePath}`,
        isSelf,
      }
    }

    const sourceMatch = resolveSourcePreviewFromWikiValue(value, sourcesLookup)
    if (sourceMatch) {
      const isSelf = sourceMatch.relativePath === currentDocumentPath
      return {
        href: isSelf
          ? `${WIKILINK_SCHEME.self}${encodeURIComponent(value)}`
          : `${WIKILINK_SCHEME.source}${sourceMatch.relativePath}`,
        isSelf,
      }
    }

    const leadMatch =
      leadsLookup?.bySlug.get(value.trim()) ??
      leadsLookup?.byRelativePath.get(value.trim()) ??
      leadsLookup?.byWikiKey.get(normalizeWikiKey(value))?.[0]
    if (leadMatch) {
      const isSelf = `leads/${leadMatch.relativePath}` === currentDocumentPath || leadMatch.relativePath === currentDocumentPath
      return {
        href: isSelf
          ? `${WIKILINK_SCHEME.self}${encodeURIComponent(value)}`
          : `${WIKILINK_SCHEME.lead}${leadMatch.relativePath}`,
        isSelf,
      }
    }

    const normalized = normalizeWikiKey(value)
    const investigationMatch =
      investigationLookup?.byId.get(value.trim()) ?? investigationLookup?.byWikiKey.get(normalized)?.[0]
    if (investigationMatch) {
      const scheme = investigationMatch.kind === "allegation" ? WIKILINK_SCHEME.allegation : WIKILINK_SCHEME.finding
      const currentInvestigationRelative = currentDocumentPath.replace(/^(allegations|findings)\//, "")
      const isSelf = investigationMatch.relativePath === currentInvestigationRelative
      const label = investigationMatch.title?.trim() || investigationMatch.id
      return {
        href: isSelf ? `${WIKILINK_SCHEME.self}${encodeURIComponent(value)}` : `${scheme}${investigationMatch.relativePath}`,
        isSelf,
        label,
      }
    }

    return `${WIKILINK_SCHEME.unresolved}${encodeURIComponent(value)}`
  }
}
