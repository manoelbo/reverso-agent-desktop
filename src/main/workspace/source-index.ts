import { copyFile, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import type {
  SourceCheckpoint,
  SourceDocumentPayload,
  SourceFileEntry,
  SourcePreviewItem,
  SourcesIndexPayload,
  SourcesUploadResult,
} from '../../shared/workspace-sources'

const SOURCES_ROOT_CANDIDATE = path.join('sources')
const CHECKPOINT_FILE_NAME = 'source-checkpoint.json'

function toPosixRelative(value: string): string {
  return value.split(path.sep).join('/')
}

function resolveWorkspaceRoot(): string {
  if (process.env.REVERSO_WORKSPACE_ROOT) {
    return path.resolve(process.env.REVERSO_WORKSPACE_ROOT)
  }
  return process.cwd()
}

export function resolveSourcesRootPath(): string {
  const workspaceRoot = resolveWorkspaceRoot()
  return path.resolve(workspaceRoot, SOURCES_ROOT_CANDIDATE)
}

function resolveCheckpointPath(): string {
  return path.join(resolveSourcesRootPath(), CHECKPOINT_FILE_NAME)
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function ensureSourcesWorkspace(): Promise<void> {
  const sourceDir = resolveSourcesRootPath()
  const artifactsDir = path.join(sourceDir, '.artifacts')
  const checkpointPath = resolveCheckpointPath()

  await mkdir(sourceDir, { recursive: true })
  await mkdir(artifactsDir, { recursive: true })

  try {
    const checkpointStats = await stat(checkpointPath)
    if (!checkpointStats.isFile()) {
      throw new Error('source-checkpoint.json is not a file')
    }
  } catch {
    const initialCheckpoint = emptyCheckpoint(sourceDir)
    await writeFile(checkpointPath, `${JSON.stringify(initialCheckpoint, null, 2)}\n`, 'utf8')
  }
}

function inferTitleFromContent(content: string, fallback: string): string {
  const heading = content.match(/^#\s+(.+)$/m)?.[1]?.trim()
  if (heading) return heading
  return fallback
}

function inferTitleFromMetadataContent(content: string): string | null {
  const match = content.match(/^title:\s*(.+)$/im)
  if (!match) return null
  const normalized = match[1]?.trim().replace(/^["']|["']$/g, '')
  return normalized && normalized.length > 0 ? normalized : null
}

function isPlaceholderPreviewTitle(value: string): boolean {
  return value.trim().toLowerCase() === 'document preview'
}

async function inferTitleFromArtifactDir(artifactDir: string, previewPath: string, fallback: string): Promise<string> {
  const metadataPath = path.join(artifactDir, 'metadata.md')
  try {
    const metadataRaw = await readFile(metadataPath, 'utf8')
    const metadataTitle = inferTitleFromMetadataContent(metadataRaw)
    if (metadataTitle && !isPlaceholderPreviewTitle(metadataTitle)) {
      return metadataTitle
    }
  } catch {
    // Ignore missing or unreadable metadata.md
  }

  try {
    const previewRaw = await readFile(previewPath, 'utf8')
    return inferTitleFromContent(previewRaw, fallback)
  } catch {
    return fallback
  }
}

function toDocId(fileName: string, sourceStats: { size: number; mtimeMs: number }): string {
  const fileStem = fileName.replace(/\.pdf$/i, '')
  const slug = fileStem
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const hash = createHash('sha1')
    .update(`${fileName}:${sourceStats.size}:${sourceStats.mtimeMs}`)
    .digest('hex')
    .slice(0, 8)
  return `${slug || 'source'}-${hash}`
}

function emptyCheckpoint(sourceDir: string): SourceCheckpoint {
  return {
    version: 1,
    sourceDir,
    updatedAt: new Date().toISOString(),
    queueStatus: 'idle',
    files: [],
  }
}

export async function loadSourceCheckpoint(): Promise<SourceCheckpoint> {
  await ensureSourcesWorkspace()
  const sourceDir = resolveSourcesRootPath()
  const checkpointPath = resolveCheckpointPath()
  const maxAttempts = 3
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const raw = await readFile(checkpointPath, 'utf8')
      const parsed = JSON.parse(raw) as SourceCheckpoint
      return {
        ...parsed,
        sourceDir,
        files: Array.isArray(parsed.files) ? parsed.files : [],
      }
    } catch {
      if (attempt < maxAttempts) {
        await wait(40 * attempt)
        continue
      }
    }
  }
  return emptyCheckpoint(sourceDir)
}

export async function saveSourceCheckpoint(checkpoint: SourceCheckpoint): Promise<void> {
  await ensureSourcesWorkspace()
  const sourceDir = resolveSourcesRootPath()
  const checkpointPath = resolveCheckpointPath()
  const payload: SourceCheckpoint = {
    ...checkpoint,
    sourceDir,
    updatedAt: new Date().toISOString(),
  }
  await writeFile(checkpointPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
}

async function listPreviewItems(sourceRootPath: string, checkpoint: SourceCheckpoint): Promise<SourcePreviewItem[]> {
  const artifactsRoot = path.join(sourceRootPath, '.artifacts')
  let entries: { name: string; isDirectory: () => boolean }[] = []
  try {
    entries = await readdir(artifactsRoot, { withFileTypes: true })
  } catch {
    return []
  }

  const output: SourcePreviewItem[] = []
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const docId = entry.name
    const artifactDir = path.join(artifactsRoot, docId)
    const previewPath = path.join(artifactDir, 'preview.md')
    try {
      const previewStat = await stat(previewPath)
      if (!previewStat.isFile()) continue
      const fileFromCheckpoint = checkpoint.files.find((file) => file.docId === docId)
      const fallbackTitle = path.basename(fileFromCheckpoint?.originalFileName ?? `${docId}.pdf`, '.pdf') || docId
      output.push({
        docId,
        relativePath: toPosixRelative(path.relative(sourceRootPath, previewPath)),
        fileName: path.basename(fileFromCheckpoint?.originalFileName ?? `${docId}.pdf`),
        title: await inferTitleFromArtifactDir(artifactDir, previewPath, fallbackTitle),
        updatedAt: previewStat.mtime.toISOString(),
      })
    } catch {
      // Ignore broken artifact folders.
    }
  }

  output.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  return output
}

export async function buildSourcesIndex(): Promise<SourcesIndexPayload> {
  await ensureSourcesWorkspace()
  const rootPath = resolveSourcesRootPath()
  const checkpoint = await loadSourceCheckpoint()
  const previews = await listPreviewItems(rootPath, checkpoint)
  return {
    rootPath,
    generatedAt: new Date().toISOString(),
    checkpoint,
    previews,
  }
}

function assertSafeSourceRelativePath(relativePath: string): string {
  const normalized = toPosixRelative(relativePath).replace(/^\/+/, '')
  if (!normalized.endsWith('.md')) {
    throw new Error('Only markdown documents are allowed')
  }
  const segments = normalized.split('/').filter(Boolean)
  if (segments.some((segment) => segment === '..') || path.isAbsolute(normalized)) {
    throw new Error('Path traversal detected')
  }
  return normalized
}

export async function readSourceDocument(relativePath: string): Promise<SourceDocumentPayload> {
  await ensureSourcesWorkspace()
  const sourcesRootPath = resolveSourcesRootPath()
  const safeRelativePath = assertSafeSourceRelativePath(relativePath)
  const absolutePath = path.resolve(sourcesRootPath, safeRelativePath)
  const rootWithSeparator = `${toPosixRelative(path.resolve(sourcesRootPath))}/`
  const absolutePosix = toPosixRelative(path.resolve(absolutePath))
  if (!absolutePosix.startsWith(rootWithSeparator)) {
    throw new Error('Invalid source document path')
  }

  const fileStats = await stat(absolutePath)
  if (!fileStats.isFile()) {
    throw new Error('Source document is not a file')
  }

  const content = await readFile(absolutePath, 'utf8')
  const fallbackTitle = path.basename(safeRelativePath, '.md')
  const previewPathMatch = safeRelativePath.match(/^\.artifacts\/([^/]+)\/preview\.md$/)
  let resolvedTitle: string
  if (previewPathMatch?.[1]) {
    const checkpoint = await loadSourceCheckpoint()
    const fileFromCheckpoint = checkpoint.files.find((file) => file.docId === previewPathMatch[1])
    const previewFallbackTitle = path.basename(fileFromCheckpoint?.originalFileName ?? `${previewPathMatch[1]}.pdf`, '.pdf') || fallbackTitle
    resolvedTitle = await inferTitleFromArtifactDir(
      path.join(sourcesRootPath, '.artifacts', previewPathMatch[1]),
      absolutePath,
      previewFallbackTitle
    )
  } else {
    resolvedTitle = inferTitleFromContent(content, fallbackTitle)
  }

  return {
    relativePath: safeRelativePath,
    title: resolvedTitle,
    content,
    updatedAt: fileStats.mtime.toISOString(),
    sizeBytes: fileStats.size,
  }
}

export async function ingestSourceFiles(sourceFilePaths: string[]): Promise<SourcesUploadResult> {
  await ensureSourcesWorkspace()
  const rootPath = resolveSourcesRootPath()
  const artifactsRoot = path.join(rootPath, '.artifacts')
  await mkdir(artifactsRoot, { recursive: true })

  const checkpoint = await loadSourceCheckpoint()
  const byOriginalName = new Set(checkpoint.files.map((file) => file.originalFileName))
  const added: string[] = []
  const skipped: string[] = []

  for (const sourcePathRaw of sourceFilePaths) {
    const sourcePath = path.resolve(sourcePathRaw)
    const sourceName = path.basename(sourcePath)
    if (!sourceName.toLowerCase().endsWith('.pdf')) {
      skipped.push(sourceName)
      continue
    }

    if (byOriginalName.has(sourceName)) {
      skipped.push(sourceName)
      continue
    }

    try {
      const sourceStats = await stat(sourcePath)
      if (!sourceStats.isFile()) {
        skipped.push(sourceName)
        continue
      }

      const docId = toDocId(sourceName, { size: sourceStats.size, mtimeMs: sourceStats.mtimeMs })
      const destinationPath = path.join(rootPath, sourceName)
      const now = new Date().toISOString()
      const entry: SourceFileEntry = {
        docId,
        originalFileName: sourceName,
        sourcePath: destinationPath,
        fileType: 'pdf',
        artifactDir: path.join(artifactsRoot, docId),
        selected: false,
        status: 'not_processed',
        createdAt: now,
        updatedAt: now,
        queuedAt: now,
        processingMode: 'standard',
        attemptCount: 0,
      }

      // Queue entry is persisted before copy so the UI updates immediately for large files.
      checkpoint.files.push(entry)
      byOriginalName.add(sourceName)
      await saveSourceCheckpoint(checkpoint)

      try {
        await copyFile(sourcePath, destinationPath)
        checkpoint.files = checkpoint.files.map((file) =>
          file.docId === docId
            ? {
                ...file,
                updatedAt: new Date().toISOString(),
                status: 'not_processed',
                lastError: undefined,
              }
            : file
        )
        await saveSourceCheckpoint(checkpoint)
        added.push(sourceName)
      } catch (copyError) {
        const message = copyError instanceof Error ? copyError.message : 'Falha ao copiar arquivo para sources.'
        checkpoint.files = checkpoint.files.map((file) =>
          file.docId === docId
            ? {
                ...file,
                updatedAt: new Date().toISOString(),
                status: 'failed',
                lastError: message,
              }
            : file
        )
        await saveSourceCheckpoint(checkpoint)
        skipped.push(sourceName)
      }
    } catch {
      skipped.push(sourceName)
    }
  }

  return { added, skipped }
}

export async function updateSourceSelection(docIds: string[], selected: boolean): Promise<SourcesIndexPayload> {
  await ensureSourcesWorkspace()
  const checkpoint = await loadSourceCheckpoint()
  const ids = new Set(docIds)
  const now = new Date().toISOString()
  checkpoint.files = checkpoint.files.map((file) =>
    ids.has(file.docId)
      ? {
          ...file,
          selected,
          updatedAt: now,
        }
      : file
  )
  await saveSourceCheckpoint(checkpoint)
  return buildSourcesIndex()
}

export async function resetRunningSourceStatuses(reason = 'Interrupted by user'): Promise<void> {
  await ensureSourcesWorkspace()
  const checkpoint = await loadSourceCheckpoint()
  const now = new Date().toISOString()
  let hasChanges = false

  checkpoint.files = checkpoint.files.map((file) => {
    if (file.status !== 'replica_running' && file.status !== 'preview_metadata_running') {
      return file
    }

    const pausedStatus = file.status === 'replica_running' ? 'replica_paused' : 'preview_metadata_paused'
    hasChanges = true
    return {
      ...file,
      status: pausedStatus,
      updatedAt: now,
      finishedAt: now,
      lastError: reason,
    }
  })

  if (checkpoint.queueStatus !== 'idle') {
    checkpoint.queueStatus = 'idle'
    checkpoint.lastRunAt = now
    hasChanges = true
  }

  if (!hasChanges) return
  await saveSourceCheckpoint(checkpoint)
}

export function normalizeSourceRelativePath(relativePath: string): string {
  return assertSafeSourceRelativePath(relativePath)
}
