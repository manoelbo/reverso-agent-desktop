import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import type {
  DossierDocumentPayload,
  DossierFileItem,
  DossierIndexPayload,
  DossierSectionIndex,
  DossierSectionKey,
  DossierTreeNode,
} from '../../shared/workspace-markdown'
import { resolveSourcesRootPath } from './source-index'

const DOSSIER_SECTIONS: Record<DossierSectionKey, { label: string; relativeRoot: string }> = {
  people: { label: 'People', relativeRoot: 'people' },
  groups: { label: 'Groups', relativeRoot: 'groups' },
  places: { label: 'Places', relativeRoot: 'places' },
  timeline: { label: 'Timeline', relativeRoot: 'timeline' },
}

function compareStrings(a: string, b: string): number {
  return a.localeCompare(b, 'pt-BR', { numeric: true, sensitivity: 'base' })
}

function toPosixRelative(value: string): string {
  return value.split(path.sep).join('/')
}

function inferTitleFromContent(content: string, fallback: string): string {
  const heading = content.match(/^#\s+(.+)$/m)?.[1]?.trim()
  if (heading) return heading
  return fallback
}

function prettifyFileStem(stem: string): string {
  return stem
    .split('-')
    .filter(Boolean)
    .map((part) => (part.length <= 3 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(' ')
}

function resolveWorkspaceRoot(): string {
  if (process.env.REVERSO_WORKSPACE_ROOT) {
    return path.resolve(process.env.REVERSO_WORKSPACE_ROOT)
  }
  return process.cwd()
}

export function resolveDossierRootPath(): string {
  const workspaceRoot = resolveWorkspaceRoot()
  const filesystemRoot = path.dirname(resolveSourcesRootPath())
  if (filesystemRoot) {
    return path.resolve(filesystemRoot, 'dossier')
  }
  return path.resolve(workspaceRoot, 'dossier')
}

function getSectionFromRelativePath(relativePath: string): DossierSectionKey {
  const [firstSegment] = relativePath.split('/')
  if (firstSegment === 'people') return 'people'
  if (firstSegment === 'groups') return 'groups'
  if (firstSegment === 'places') return 'places'
  return 'timeline'
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

      if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.md')) {
        continue
      }

      const relativePath = toPosixRelative(path.relative(rootDir, absoluteEntryPath))
      output.push(relativePath)
    }
  }

  await walk(rootDir)
  output.sort(compareStrings)
  return output
}

async function buildFileItem(rootPath: string, relativePath: string): Promise<DossierFileItem> {
  const absolutePath = path.join(rootPath, relativePath)
  const fileName = path.basename(relativePath)
  const fileStem = path.basename(relativePath, '.md')
  const folderPath = toPosixRelative(path.dirname(relativePath))
    .split('/')
    .filter((segment) => segment !== '.' && segment.length > 0)

  const section = getSectionFromRelativePath(relativePath)
  const stats = await stat(absolutePath)
  const raw = await readFile(absolutePath, 'utf8')

  return {
    section,
    relativePath,
    fileName,
    fileStem,
    folderPath,
    title: inferTitleFromContent(raw, prettifyFileStem(fileStem)),
    updatedAt: stats.mtime.toISOString(),
    sizeBytes: stats.size,
  }
}

function buildTree(files: DossierFileItem[], baseSegments: string[]): DossierTreeNode[] {
  const grouped = new Map<string, DossierFileItem[]>()

  for (const item of files) {
    const tail = item.folderPath.slice(baseSegments.length)
    const key = tail.length ? tail[0] : '__root__'
    const bucket = grouped.get(key)
    if (bucket) {
      bucket.push(item)
    } else {
      grouped.set(key, [item])
    }
  }

  const nodes: DossierTreeNode[] = []
  for (const [groupKey, groupFiles] of Array.from(grouped.entries())) {
    if (groupKey === '__root__') {
      continue
    }

    const nodeSegments = [...baseSegments, groupKey]
    const nodeRelativePath = nodeSegments.join('/')
    const directFiles = groupFiles
      .filter((file) => file.folderPath.length === nodeSegments.length)
      .sort((left, right) => compareStrings(left.fileName, right.fileName))
    const nestedFiles = groupFiles.filter((file) => file.folderPath.length > nodeSegments.length)
    nodes.push({
      name: groupKey,
      relativePath: nodeRelativePath,
      files: directFiles,
      subfolders: buildTree(nestedFiles, nodeSegments),
    })
  }

  nodes.sort((left, right) => compareStrings(left.name, right.name))
  return nodes
}

function buildSectionIndex(section: DossierSectionKey, files: DossierFileItem[]): DossierSectionIndex {
  const sectionRoot = DOSSIER_SECTIONS[section].relativeRoot
  const sectionFiles = files
    .filter((file) => file.section === section)
    .sort((left, right) => compareStrings(left.relativePath, right.relativePath))

  return {
    section,
    label: DOSSIER_SECTIONS[section].label,
    files: sectionFiles,
    tree: buildTree(sectionFiles, [sectionRoot]),
  }
}

export async function buildDossierIndex(): Promise<DossierIndexPayload> {
  const dossierRootPath = resolveDossierRootPath()
  const relativePaths = await listMarkdownFilesRecursively(dossierRootPath)

  const allFiles: DossierFileItem[] = []
  for (const relativePath of relativePaths) {
    const item = await buildFileItem(dossierRootPath, relativePath)
    allFiles.push(item)
  }

  allFiles.sort((left, right) => compareStrings(left.relativePath, right.relativePath))

  return {
    rootPath: dossierRootPath,
    generatedAt: new Date().toISOString(),
    allFiles,
    sections: {
      people: buildSectionIndex('people', allFiles),
      groups: buildSectionIndex('groups', allFiles),
      places: buildSectionIndex('places', allFiles),
      timeline: buildSectionIndex('timeline', allFiles),
    },
  }
}

function assertSafeDossierRelativePath(relativePath: string): string {
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

export async function readDossierDocument(relativePath: string): Promise<DossierDocumentPayload> {
  const dossierRootPath = resolveDossierRootPath()
  const safeRelativePath = assertSafeDossierRelativePath(relativePath)
  const absolutePath = path.resolve(dossierRootPath, safeRelativePath)
  const dossierRootWithSeparator = `${toPosixRelative(path.resolve(dossierRootPath))}/`
  const absolutePathPosix = toPosixRelative(path.resolve(absolutePath))

  if (!absolutePathPosix.startsWith(dossierRootWithSeparator)) {
    throw new Error('Invalid dossier path')
  }

  const stats = await stat(absolutePath)
  if (!stats.isFile()) {
    throw new Error('Dossier document is not a file')
  }

  const content = await readFile(absolutePath, 'utf8')
  return {
    relativePath: safeRelativePath,
    title: inferTitleFromContent(content, prettifyFileStem(path.basename(safeRelativePath, '.md'))),
    content,
    updatedAt: stats.mtime.toISOString(),
    sizeBytes: stats.size,
  }
}

export function normalizeDossierRelativePath(relativePath: string): string {
  return assertSafeDossierRelativePath(relativePath)
}
