import type { DossierFileItem, DossierIndexPayload } from '../../../../../shared/workspace-markdown'

export type SelectedDossierDocument = {
  relativePath: string
  source: 'sidebar' | 'home' | 'wikilink'
}

export type DossierWorkspaceState = {
  index: DossierIndexPayload | null
  isLoading: boolean
  error: string | null
  stale: boolean
}

export type DossierDocumentLookup = {
  byRelativePath: Map<string, DossierFileItem>
  byWikiKey: Map<string, DossierFileItem[]>
}

function titleCaseSegment(value: string): string {
  if (!value) return ''
  if (value.length <= 3) return value.toUpperCase()
  return value[0].toUpperCase() + value.slice(1).toLowerCase()
}

export function prettifyFileStem(fileStem: string): string {
  return fileStem
    .split('-')
    .filter(Boolean)
    .map(titleCaseSegment)
    .join(' ')
}

export function toDisplayDocumentName(file: Pick<DossierFileItem, 'title' | 'fileStem'>): string {
  return file.title?.trim() || prettifyFileStem(file.fileStem)
}

export function normalizeWikiKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function buildDossierLookup(index: DossierIndexPayload | null): DossierDocumentLookup {
  const byRelativePath = new Map<string, DossierFileItem>()
  const byWikiKey = new Map<string, DossierFileItem[]>()

  if (!index) {
    return { byRelativePath, byWikiKey }
  }

  for (const file of index.allFiles) {
    byRelativePath.set(file.relativePath, file)

    const wikiCandidates = [file.title, file.fileStem, file.fileName.replace(/\.md$/i, '')]
    for (const candidate of wikiCandidates) {
      const key = normalizeWikiKey(candidate)
      if (!key) continue
      const bucket = byWikiKey.get(key)
      if (bucket) {
        bucket.push(file)
      } else {
        byWikiKey.set(key, [file])
      }
    }
  }

  return { byRelativePath, byWikiKey }
}
