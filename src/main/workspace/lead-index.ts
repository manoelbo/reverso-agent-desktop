import { mkdir, readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import type {
  LeadDocumentPayload,
  LeadFileItem,
  LeadsIndexPayload,
  LeadStatus,
  LeadTreeNode,
} from '../../shared/workspace-leads'

const LEADS_ROOT_CANDIDATE = path.join('investigation', 'leads')
const LEAD_CHECKPOINT_FILE = 'lead-checkpoint.json'

type LeadCheckpointEntry = {
  slug: string
  status: Exclude<LeadStatus, 'unknown'>
  updatedAt: string
}

function normalizeLeadSlug(value: string): string {
  const trimmed = value.trim()
  return trimmed.startsWith('lead-') ? trimmed.slice('lead-'.length) : trimmed
}

function isPrimaryLeadMarkdownFile(fileName: string): boolean {
  if (!fileName.startsWith('lead-') || !fileName.toLowerCase().endsWith('.md')) return false
  const stem = fileName.slice(0, -'.md'.length)
  return !stem.includes('.')
}

function compareStrings(a: string, b: string): number {
  return a.localeCompare(b, 'pt-BR', { numeric: true, sensitivity: 'base' })
}

function toPosixRelative(value: string): string {
  return value.split(path.sep).join('/')
}

function resolveWorkspaceRoot(): string {
  if (process.env.REVERSO_WORKSPACE_ROOT) {
    return path.resolve(process.env.REVERSO_WORKSPACE_ROOT)
  }
  return process.cwd()
}

export function resolveLeadsRootPath(): string {
  const workspaceRoot = resolveWorkspaceRoot()
  return path.resolve(workspaceRoot, LEADS_ROOT_CANDIDATE)
}

export async function ensureLeadsWorkspace(): Promise<void> {
  await mkdir(resolveLeadsRootPath(), { recursive: true })
}

async function listMarkdownFilesRecursively(rootDir: string): Promise<string[]> {
  const output: string[] = []

  async function walk(currentDir: string): Promise<void> {
    let entries: { name: string; isDirectory: () => boolean; isFile: () => boolean }[]
    try {
      entries = await readdir(currentDir, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue
      const absoluteEntryPath = path.join(currentDir, entry.name)
      if (entry.isDirectory()) {
        await walk(absoluteEntryPath)
        continue
      }
      if (!entry.isFile()) continue
      if (!isPrimaryLeadMarkdownFile(entry.name)) continue
      output.push(toPosixRelative(path.relative(rootDir, absoluteEntryPath)))
    }
  }

  await walk(rootDir)
  output.sort(compareStrings)
  return output
}

function prettifyFileStem(stem: string): string {
  return stem
    .replace(/^lead-/, '')
    .split('-')
    .filter(Boolean)
    .map((part) => (part.length <= 3 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(' ')
}

function extractFrontmatter(content: string): Record<string, string> {
  if (!content.startsWith('---\n')) return {}
  const endMarkerIndex = content.indexOf('\n---', 4)
  if (endMarkerIndex < 0) return {}
  const raw = content.slice(4, endMarkerIndex).trim()
  const result: Record<string, string> = {}

  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^([a-zA-Z0-9_]+)\s*:\s*(.+)$/)
    if (!match) continue
    const key = match[1].trim()
    const value = match[2].trim().replace(/^["']|["']$/g, '')
    result[key] = value
  }
  return result
}

function parseStatus(raw: string | undefined): LeadStatus {
  if (!raw) return 'unknown'
  const normalized = raw.trim().toLowerCase()
  if (normalized === 'planned') return 'planned'
  if (normalized === 'in_progress') return 'in_progress'
  if (normalized === 'done') return 'done'
  if (normalized === 'blocked') return 'blocked'
  return 'unknown'
}

async function readLeadCheckpoint(rootPath: string): Promise<Map<string, LeadCheckpointEntry>> {
  const checkpointPath = path.join(rootPath, LEAD_CHECKPOINT_FILE)
  try {
    const raw = await readFile(checkpointPath, 'utf8')
    const parsed = JSON.parse(raw) as { leads?: unknown[] }
    if (!Array.isArray(parsed.leads)) return new Map()
    const entries = parsed.leads
      .map((item) => {
        if (!item || typeof item !== 'object') return undefined
        const slug = typeof (item as { slug?: unknown }).slug === 'string'
          ? normalizeLeadSlug((item as { slug: string }).slug)
          : ''
        const status = parseStatus(
          typeof (item as { status?: unknown }).status === 'string'
            ? (item as { status: string }).status
            : undefined
        )
        const updatedAt = typeof (item as { updatedAt?: unknown }).updatedAt === 'string'
          ? (item as { updatedAt: string }).updatedAt
          : ''
        if (!slug || status === 'unknown' || !updatedAt) return undefined
        return { slug, status, updatedAt }
      })
      .filter((item): item is LeadCheckpointEntry => Boolean(item))
    return new Map(entries.map((item) => [normalizeLeadSlug(item.slug), item]))
  } catch {
    return new Map()
  }
}

function parseNumberOrNull(raw: string | undefined): number | null {
  if (!raw) return null
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

function inferTitleFromContent(content: string, fallback: string): string {
  const frontmatter = extractFrontmatter(content)
  const frontmatterTitle = frontmatter.title?.trim()
  if (frontmatterTitle) return frontmatterTitle
  const heading = content.match(/^#\s+(.+)$/m)?.[1]?.trim()
  if (heading) return heading
  return fallback
}

function toSlug(fileStem: string, frontmatter: Record<string, string>): string {
  const direct = frontmatter.slug?.trim()
  if (direct) return direct
  return fileStem.replace(/^lead-/, '')
}

async function buildLeadFileItem(
  rootPath: string,
  relativePath: string,
  checkpointBySlug: Map<string, LeadCheckpointEntry>
): Promise<LeadFileItem> {
  const absolutePath = path.join(rootPath, relativePath)
  const fileName = path.basename(relativePath)
  const fileStem = path.basename(relativePath, '.md')
  const folderPath = toPosixRelative(path.dirname(relativePath))
    .split('/')
    .filter((segment) => segment !== '.' && segment.length > 0)
  const fileStats = await stat(absolutePath)
  const raw = await readFile(absolutePath, 'utf8')
  const frontmatter = extractFrontmatter(raw)
  const slug = toSlug(fileStem, frontmatter)
  const checkpoint = checkpointBySlug.get(normalizeLeadSlug(slug))
  const title = inferTitleFromContent(raw, prettifyFileStem(fileStem))
  return {
    relativePath,
    fileName,
    fileStem,
    folderPath,
    slug,
    title,
    status: checkpoint?.status ?? parseStatus(frontmatter.status),
    allegationsCount: parseNumberOrNull(frontmatter.allegations_count),
    findingsCount: parseNumberOrNull(frontmatter.findings_count),
    updatedAt: checkpoint?.updatedAt || frontmatter.updated_at?.trim() || fileStats.mtime.toISOString(),
    sizeBytes: fileStats.size,
  }
}

function buildTree(files: LeadFileItem[], baseSegments: string[]): LeadTreeNode[] {
  const grouped = new Map<string, LeadFileItem[]>()

  for (const item of files) {
    const tail = item.folderPath.slice(baseSegments.length)
    const key = tail.length ? tail[0] : '__root__'
    const bucket = grouped.get(key)
    if (bucket) bucket.push(item)
    else grouped.set(key, [item])
  }

  const nodes: LeadTreeNode[] = []
  for (const [groupKey, groupFiles] of Array.from(grouped.entries())) {
    if (groupKey === '__root__') {
      const directFiles = groupFiles
        .filter((file) => file.folderPath.length === baseSegments.length)
        .sort((left, right) => compareStrings(left.fileName, right.fileName))
      const nestedFiles = groupFiles.filter((file) => file.folderPath.length > baseSegments.length)
      nodes.push({
        name: '',
        relativePath: baseSegments.join('/'),
        files: directFiles,
        subfolders: buildTree(nestedFiles, baseSegments),
      })
      continue
    }

    const nodeSegments = [...baseSegments, groupKey]
    const directFiles = groupFiles
      .filter((file) => file.folderPath.length === nodeSegments.length)
      .sort((left, right) => compareStrings(left.fileName, right.fileName))
    const nestedFiles = groupFiles.filter((file) => file.folderPath.length > nodeSegments.length)
    nodes.push({
      name: groupKey,
      relativePath: nodeSegments.join('/'),
      files: directFiles,
      subfolders: buildTree(nestedFiles, nodeSegments),
    })
  }

  nodes.sort((left, right) => compareStrings(left.name, right.name))
  if (nodes.length > 1) {
    const rootIndex = nodes.findIndex((node) => node.name === '')
    if (rootIndex > 0) {
      const [rootNode] = nodes.splice(rootIndex, 1)
      nodes.unshift(rootNode)
    }
  }
  return nodes
}

export async function buildLeadsIndex(): Promise<LeadsIndexPayload> {
  await ensureLeadsWorkspace()
  const rootPath = resolveLeadsRootPath()
  const relativePaths = await listMarkdownFilesRecursively(rootPath)
  const checkpointBySlug = await readLeadCheckpoint(rootPath)
  const files: LeadFileItem[] = []

  for (const relativePath of relativePaths) {
    files.push(await buildLeadFileItem(rootPath, relativePath, checkpointBySlug))
  }

  files.sort((left, right) => compareStrings(left.relativePath, right.relativePath))

  return {
    rootPath,
    generatedAt: new Date().toISOString(),
    files,
    tree: buildTree(files, []),
  }
}

function assertSafeLeadRelativePath(relativePath: string): string {
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

export async function readLeadDocument(relativePath: string): Promise<LeadDocumentPayload> {
  await ensureLeadsWorkspace()
  const leadsRootPath = resolveLeadsRootPath()
  const safeRelativePath = assertSafeLeadRelativePath(relativePath)
  const absolutePath = path.resolve(leadsRootPath, safeRelativePath)
  const rootWithSeparator = `${toPosixRelative(path.resolve(leadsRootPath))}/`
  const absolutePosix = toPosixRelative(path.resolve(absolutePath))

  if (!absolutePosix.startsWith(rootWithSeparator)) {
    throw new Error('Invalid lead path')
  }

  const fileStats = await stat(absolutePath)
  if (!fileStats.isFile()) {
    throw new Error('Lead document is not a file')
  }

  const content = await readFile(absolutePath, 'utf8')
  const fallbackTitle = prettifyFileStem(path.basename(safeRelativePath, '.md'))
  return {
    relativePath: safeRelativePath,
    title: inferTitleFromContent(content, fallbackTitle),
    content,
    updatedAt: fileStats.mtime.toISOString(),
    sizeBytes: fileStats.size,
  }
}

export function normalizeLeadRelativePath(relativePath: string): string {
  return assertSafeLeadRelativePath(relativePath)
}
