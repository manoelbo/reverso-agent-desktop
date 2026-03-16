import os from 'node:os'
import path from 'node:path'
import { access, mkdir, readdir } from 'node:fs/promises'

export interface LabPaths {
  projectRoot: string
  labRoot: string
  filesystemDir: string
  sourceDir: string
  sourceArtifactsDir: string
  inputDir: string
  outputDir: string
  eventsDir: string
  dossierDir: string
  dossierPeopleDir: string
  dossierGroupsDir: string
  dossierPlacesDir: string
  dossierTimelineDir: string
  investigationDir: string
  leadsDir: string
  allegationsDir: string
  findingsDir: string
  notesDir: string
  reportsDir: string
}

const LEGACY_FILESYSTEM_ENV_VARS = ['REVERSO_FILESYSTEM_DIR', 'AGENT_FILESYSTEM_DIR'] as const
const SOURCE_DIR_CANDIDATES = ['sources', 'source'] as const

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function hasPdfFiles(dir: string): Promise<boolean> {
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    return entries.some((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.pdf'))
  } catch {
    return false
  }
}

async function detectPreferredSourceDirName(filesystemRoot: string): Promise<(typeof SOURCE_DIR_CANDIDATES)[number]> {
  for (const candidate of SOURCE_DIR_CANDIDATES) {
    if (await exists(path.join(filesystemRoot, candidate))) return candidate
  }
  return 'sources'
}

async function ensureFilesystemDirs(
  filesystemRoot: string,
  sourceDirName?: (typeof SOURCE_DIR_CANDIDATES)[number]
): Promise<void> {
  const resolvedSourceDirName = sourceDirName ?? (await detectPreferredSourceDirName(filesystemRoot))
  const dirs = [
    resolvedSourceDirName,
    `${resolvedSourceDirName}/.artifacts`,
    'investigation/leads',
    'investigation/allegations',
    'investigation/findings',
    'investigation/notes',
    'dossier/people',
    'dossier/groups',
    'dossier/places',
    'dossier/timeline',
    'reports',
    'events'
  ]
  for (const dir of dirs) {
    await mkdir(path.join(filesystemRoot, dir), { recursive: true })
  }
}

function resolveFilesystemEnv(): string | undefined {
  const primary = process.env['REVERSO_FILESYSTEM']
  if (primary && primary.trim().length > 0) return primary.trim()
  for (const key of LEGACY_FILESYSTEM_ENV_VARS) {
    const value = process.env[key]
    if (value && value.trim().length > 0) return value.trim()
  }
  return undefined
}

async function detectFilesystemRoot(cwd: string): Promise<{ filesystemRoot: string; sourceDir: string }> {
  const sourceDirByName = new Map<(typeof SOURCE_DIR_CANDIDATES)[number], string>(
    SOURCE_DIR_CANDIDATES.map((dirName) => [dirName, path.join(cwd, dirName)])
  )
  const existingSourceDir = (
    await Promise.all(
      SOURCE_DIR_CANDIDATES.map(async (dirName) => {
        const abs = sourceDirByName.get(dirName)!
        return (await exists(abs)) ? abs : null
      })
    )
  ).find((value): value is string => value != null)
  const sourceDirWithPdfs = (
    await Promise.all(
      SOURCE_DIR_CANDIDATES.map(async (dirName) => {
        const abs = sourceDirByName.get(dirName)!
        return (await hasPdfFiles(abs)) ? abs : null
      })
    )
  ).find((value): value is string => value != null)
  const hasInvestigationDir = await exists(path.join(cwd, 'investigation'))
  const hasAgentMd = await exists(path.join(cwd, 'agent.md'))

  if ((existingSourceDir && hasInvestigationDir) || hasAgentMd) {
    return {
      filesystemRoot: cwd,
      sourceDir: sourceDirWithPdfs ?? existingSourceDir ?? path.join(cwd, 'sources')
    }
  }

  const hasArtifactsDir = await exists(path.join(cwd, '.artifacts'))
  const hasPdfsInCwd = await hasPdfFiles(cwd)
  const cwdBasename = path.basename(cwd).toLowerCase()
  const cwdIsSourceLikeDir = cwdBasename === 'source' || cwdBasename === 'sources'
  if ((hasArtifactsDir || hasPdfsInCwd) && cwdIsSourceLikeDir) {
    const filesystemRoot = path.resolve(cwd, '..')
    return {
      filesystemRoot,
      sourceDir: cwd
    }
  }

  if (sourceDirWithPdfs) {
    return {
      filesystemRoot: cwd,
      sourceDir: sourceDirWithPdfs
    }
  }

  if (hasPdfsInCwd) {
    return {
      filesystemRoot: cwd,
      sourceDir: cwd
    }
  }

  if (hasArtifactsDir || hasPdfsInCwd) {
    const filesystemRoot = path.resolve(cwd, '..')
    return {
      filesystemRoot,
      sourceDir: cwd
    }
  }

  if (existingSourceDir && !hasInvestigationDir) {
    return {
      filesystemRoot: cwd,
      sourceDir: existingSourceDir
    }
  }

  await ensureFilesystemDirs(cwd, 'sources')
  console.log(
    `No investigation structure found in ${cwd}. Initial structure created. Add PDFs to ${path.join(cwd, 'sources')} or directly to root.`
  )
  return {
    filesystemRoot: cwd,
    sourceDir: path.join(cwd, 'sources')
  }
}

export async function resolvePathsFromCwd(input?: {
  cwd?: string
  filesystem?: string
}): Promise<LabPaths> {
  const cwd = path.resolve(input?.cwd ?? process.cwd())
  const explicitFilesystem = input?.filesystem?.trim()
  const filesystemFromEnv = resolveFilesystemEnv()

  let filesystemDir: string
  let sourceDir: string

  if (explicitFilesystem) {
    filesystemDir = path.resolve(cwd, explicitFilesystem)
    sourceDir = path.join(filesystemDir, 'sources')
  } else if (filesystemFromEnv) {
    filesystemDir = path.resolve(cwd, filesystemFromEnv)
    sourceDir = path.join(filesystemDir, 'sources')
  } else {
    const detected = await detectFilesystemRoot(cwd)
    filesystemDir = detected.filesystemRoot
    sourceDir = detected.sourceDir
  }

  await ensureFilesystemDirs(filesystemDir, path.basename(sourceDir).toLowerCase() === 'source' ? 'source' : 'sources')
  const sourceArtifactsDir = path.join(sourceDir, '.artifacts')
  const projectRoot = filesystemDir
  const labRoot = filesystemDir
  const outputDir = filesystemDir
  const dossierDir = path.join(outputDir, 'dossier')
  const investigationDir = path.join(outputDir, 'investigation')

  return {
    projectRoot,
    labRoot,
    filesystemDir,
    sourceDir,
    sourceArtifactsDir,
    inputDir: path.join(labRoot, 'input', 'markdown_examples'),
    outputDir,
    eventsDir: path.join(outputDir, 'events'),
    dossierDir,
    dossierPeopleDir: path.join(dossierDir, 'people'),
    dossierGroupsDir: path.join(dossierDir, 'groups'),
    dossierPlacesDir: path.join(dossierDir, 'places'),
    dossierTimelineDir: path.join(dossierDir, 'timeline'),
    investigationDir,
    leadsDir: path.join(investigationDir, 'leads'),
    allegationsDir: path.join(investigationDir, 'allegations'),
    findingsDir: path.join(investigationDir, 'findings'),
    notesDir: path.join(investigationDir, 'notes'),
    reportsDir: path.join(outputDir, 'reports')
  }
}

export async function resolveLabPaths(cwd: string): Promise<LabPaths> {
  return resolvePathsFromCwd({ cwd })
}

export function getGlobalEnvPath(): string {
  return path.join(os.homedir(), '.reverso', '.env')
}

export function toRelative(projectRoot: string, absolutePath: string): string {
  return path.relative(projectRoot, absolutePath) || '.'
}

