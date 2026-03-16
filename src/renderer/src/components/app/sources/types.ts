import type { SourcePreviewItem, SourcesIndexPayload } from '../../../../../shared/workspace-sources'

export type SelectedSourceDocument = {
  relativePath: string
  source: 'sidebar' | 'home' | 'wikilink'
}

export type SourcesPreviewLookup = {
  byDocId: Map<string, SourcePreviewItem>
  byRelativePath: Map<string, SourcePreviewItem>
  byPdfFileKey: Map<string, SourcePreviewItem>
  byPdfStemKey: Map<string, SourcePreviewItem>
}

export function normalizeSourceFileKey(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function buildSourcesPreviewLookup(index: SourcesIndexPayload | null): SourcesPreviewLookup {
  const byDocId = new Map<string, SourcePreviewItem>()
  const byRelativePath = new Map<string, SourcePreviewItem>()
  const byPdfFileKey = new Map<string, SourcePreviewItem>()
  const byPdfStemKey = new Map<string, SourcePreviewItem>()

  const fileEntries = new Map(index?.checkpoint.files.map((entry) => [entry.docId, entry]) ?? [])

  for (const preview of index?.previews ?? []) {
    byDocId.set(preview.docId, preview)
    byRelativePath.set(preview.relativePath, preview)

    const entry = fileEntries.get(preview.docId)
    const originalFileName = entry?.originalFileName ?? preview.fileName
    const fileNameKey = normalizeSourceFileKey(originalFileName)
    if (fileNameKey.endsWith('.pdf')) {
      byPdfFileKey.set(fileNameKey, preview)
      byPdfStemKey.set(fileNameKey.replace(/\.pdf$/i, ''), preview)
    }
  }

  return { byDocId, byRelativePath, byPdfFileKey, byPdfStemKey }
}
