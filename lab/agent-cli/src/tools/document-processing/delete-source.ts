// @ts-nocheck
import path from 'node:path'
import { readdir, readFile, rm, unlink, writeFile } from 'node:fs/promises'
import {
  loadSourceCheckpoint,
  removeSourceEntries,
  upsertSourceFileEntries
} from './source-checkpoint.js'
import { scanSourceFiles, toSourceFileEntries } from './source-indexer.js'

const TEXTUAL_EXTENSIONS = new Set([
  '.md',
  '.txt',
  '.json',
  '.jsonl',
  '.yaml',
  '.yml',
  '.csv',
  '.log'
])

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function safeUnlink(filePath: string): Promise<void> {
  try {
    await unlink(filePath)
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT') throw error
  }
}

async function safeRmDir(dirPath: string): Promise<void> {
  try {
    await rm(dirPath, { recursive: true, force: true })
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT') throw error
  }
}

async function collectTextFiles(rootDir: string): Promise<string[]> {
  const files: string[] = []
  const stack = [rootDir]
  while (stack.length > 0) {
    const current = stack.pop()!
    let entries
    try {
      entries = await readdir(current, { withFileTypes: true })
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') continue
      throw error
    }
    for (const entry of entries) {
      const absolute = path.join(current, entry.name)
      if (entry.isDirectory()) {
        stack.push(absolute)
        continue
      }
      if (!entry.isFile()) continue
      if (TEXTUAL_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        files.push(absolute)
      }
    }
  }
  return files
}

async function replaceInFiles(
  filePaths: string[],
  originalName: string,
  replacement: string
): Promise<{ updatedFiles: number; replacements: number }> {
  if (filePaths.length === 0) return { updatedFiles: 0, replacements: 0 }
  const token = new RegExp(escapeRegExp(originalName), 'g')
  let updatedFiles = 0
  let replacements = 0
  for (const filePath of filePaths) {
    let content: string
    try {
      content = await readFile(filePath, 'utf8')
    } catch {
      continue
    }
    const matches = content.match(token)
    if (!matches || matches.length === 0) continue
    const next = content.replace(token, replacement)
    if (next === content) continue
    await writeFile(filePath, next, 'utf8')
    updatedFiles += 1
    replacements += matches.length
  }
  return { updatedFiles, replacements }
}

export interface DeleteSourceOptions {
  sourceDir: string
  filesystemRoot: string
  fileName: string
}

export interface DeleteSourceResult {
  sourceDeleted: boolean
  artifactsDeleted: boolean
  updatedFiles: number
  replacements: number
}

export async function runDeleteSource(options: DeleteSourceOptions): Promise<DeleteSourceResult> {
  const sourceDir = path.resolve(options.sourceDir)
  const filesystemRoot = path.resolve(options.filesystemRoot)
  const fileName = path.basename(options.fileName)

  let checkpoint = await loadSourceCheckpoint(sourceDir)
  const scanned = await scanSourceFiles(sourceDir)
  const existingByDocId = checkpoint?.files
    ? new Map(checkpoint.files.map((f) => [f.docId, f]))
    : undefined
  checkpoint = await upsertSourceFileEntries(sourceDir, toSourceFileEntries(scanned, existingByDocId))
  const entry = checkpoint.files.find((f) => f.originalFileName === fileName && f.fileType === 'pdf')
  if (!entry) {
    throw new Error(`Arquivo não encontrado em source: ${fileName}`)
  }

  await safeUnlink(entry.sourcePath)
  await safeRmDir(entry.artifactDir)
  await removeSourceEntries(sourceDir, [entry.docId])

  const candidateRoots = [
    path.join(filesystemRoot, 'dossier'),
    path.join(filesystemRoot, 'investigation'),
    path.join(filesystemRoot, 'reports'),
    path.join(filesystemRoot, 'events')
  ]
  const filesToUpdate: string[] = []
  for (const root of candidateRoots) {
    filesToUpdate.push(...(await collectTextFiles(root)))
  }
  const agentMdPath = path.join(filesystemRoot, 'agent.md')
  filesToUpdate.push(agentMdPath)

  const replaceResult = await replaceInFiles(filesToUpdate, fileName, 'deleted')
  return {
    sourceDeleted: true,
    artifactsDeleted: true,
    updatedFiles: replaceResult.updatedFiles,
    replacements: replaceResult.replacements
  }
}
