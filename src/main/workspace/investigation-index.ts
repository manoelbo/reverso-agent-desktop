import { mkdir, readdir, readFile, stat } from "node:fs/promises"
import path from "node:path"
import type {
  AllegationFileItem,
  FindingFileItem,
  InvestigationDocumentKind,
  InvestigationDocumentPayload,
  InvestigationFileItem,
  InvestigationIndexPayload,
} from "../../shared/workspace-investigation"

const INVESTIGATION_ROOT_CANDIDATE = "investigation"
const ALLEGATIONS_DIR = "allegations"
const FINDINGS_DIR = "findings"

type FrontmatterValue = string | string[]
type FrontmatterMap = Map<string, FrontmatterValue>

function toPosixRelative(value: string): string {
  return value.split(path.sep).join("/")
}

function resolveWorkspaceRoot(): string {
  if (process.env.REVERSO_WORKSPACE_ROOT) {
    return path.resolve(process.env.REVERSO_WORKSPACE_ROOT)
  }
  return process.cwd()
}

export function resolveInvestigationRootPath(): string {
  return path.resolve(resolveWorkspaceRoot(), INVESTIGATION_ROOT_CANDIDATE)
}

export function resolveAllegationsRootPath(): string {
  return path.join(resolveInvestigationRootPath(), ALLEGATIONS_DIR)
}

export function resolveFindingsRootPath(): string {
  return path.join(resolveInvestigationRootPath(), FINDINGS_DIR)
}

export async function ensureInvestigationWorkspace(): Promise<void> {
  await mkdir(resolveAllegationsRootPath(), { recursive: true })
  await mkdir(resolveFindingsRootPath(), { recursive: true })
}

function compareStrings(a: string, b: string): number {
  return a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" })
}

function extractFrontmatter(content: string): FrontmatterMap {
  const out = new Map<string, FrontmatterValue>()
  if (!content.startsWith("---\n")) return out
  const endMarkerIndex = content.indexOf("\n---", 4)
  if (endMarkerIndex < 0) return out

  const raw = content.slice(4, endMarkerIndex).trimEnd()
  const lines = raw.split(/\r?\n/)
  let currentArrayKey: string | null = null
  let currentArray: string[] = []

  const flushArray = (): void => {
    if (!currentArrayKey) return
    out.set(currentArrayKey, [...currentArray])
    currentArrayKey = null
    currentArray = []
  }

  for (const line of lines) {
    const arrayEntry = line.match(/^\s*-\s+(.+)$/)
    if (arrayEntry && currentArrayKey) {
      currentArray.push(arrayEntry[1].trim().replace(/^["']|["']$/g, ""))
      continue
    }

    flushArray()

    const keyValue = line.match(/^([a-zA-Z0-9_]+)\s*:\s*(.*)$/)
    if (!keyValue) continue
    const key = keyValue[1].trim()
    const rawValue = keyValue[2].trim()

    if (!rawValue) {
      currentArrayKey = key
      currentArray = []
      continue
    }

    out.set(key, rawValue.replace(/^["']|["']$/g, ""))
  }

  flushArray()
  return out
}

function getFrontmatterString(frontmatter: FrontmatterMap, key: string): string | null {
  const value = frontmatter.get(key)
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function getFrontmatterArray(frontmatter: FrontmatterMap, key: string): string[] {
  const value = frontmatter.get(key)
  if (!Array.isArray(value)) return []
  return value.map((item) => item.trim()).filter(Boolean)
}

function inferTitle(content: string, fallback: string): string {
  const heading = content.match(/^#\s+(.+)$/m)?.[1]?.trim()
  if (heading) return heading
  return fallback
}

function extractEvidenceSourceIds(frontmatter: FrontmatterMap): string[] {
  const evidenceLines = getFrontmatterArray(frontmatter, "evidence")
  const output = new Set<string>()
  for (const line of evidenceLines) {
    const match = line.match(/^([a-z0-9][a-z0-9._-]*)\s+\[/i)
    if (match?.[1]) output.add(match[1])
  }
  return Array.from(output)
}

async function listPrimaryMarkdownFiles(rootPath: string, prefix: string): Promise<string[]> {
  let entries: { name: string; isFile: () => boolean }[]
  try {
    entries = await readdir(rootPath, { withFileTypes: true })
  } catch {
    return []
  }
  return entries
    .filter((entry) => entry.isFile() && entry.name.startsWith(prefix) && entry.name.endsWith(".md"))
    .map((entry) => entry.name)
    .sort(compareStrings)
}

async function buildAllegationFileItem(rootPath: string, fileName: string): Promise<AllegationFileItem> {
  const absolutePath = path.join(rootPath, fileName)
  const fileStats = await stat(absolutePath)
  const content = await readFile(absolutePath, "utf8")
  const frontmatter = extractFrontmatter(content)
  const fileStem = path.basename(fileName, ".md")
  return {
    kind: "allegation",
    relativePath: fileName,
    fileName,
    fileStem,
    id: getFrontmatterString(frontmatter, "id") ?? fileStem,
    title: inferTitle(content, fileStem),
    leadSlug: getFrontmatterString(frontmatter, "lead_slug"),
    findingIds: getFrontmatterArray(frontmatter, "finding_ids"),
    updatedAt: fileStats.mtime.toISOString(),
    sizeBytes: fileStats.size,
  }
}

async function buildFindingFileItem(rootPath: string, fileName: string): Promise<FindingFileItem> {
  const absolutePath = path.join(rootPath, fileName)
  const fileStats = await stat(absolutePath)
  const content = await readFile(absolutePath, "utf8")
  const frontmatter = extractFrontmatter(content)
  const fileStem = path.basename(fileName, ".md")
  return {
    kind: "finding",
    relativePath: fileName,
    fileName,
    fileStem,
    id: getFrontmatterString(frontmatter, "id") ?? fileStem,
    title: inferTitle(content, fileStem),
    leadSlug: getFrontmatterString(frontmatter, "lead_slug"),
    allegationIds: getFrontmatterArray(frontmatter, "allegation_ids"),
    evidenceSourceIds: extractEvidenceSourceIds(frontmatter),
    status: getFrontmatterString(frontmatter, "status"),
    updatedAt: fileStats.mtime.toISOString(),
    sizeBytes: fileStats.size,
  }
}

export async function buildInvestigationIndex(): Promise<InvestigationIndexPayload> {
  await ensureInvestigationWorkspace()
  const allegationsRootPath = resolveAllegationsRootPath()
  const findingsRootPath = resolveFindingsRootPath()

  const allegationFiles = await listPrimaryMarkdownFiles(allegationsRootPath, "allegation-")
  const findingFiles = await listPrimaryMarkdownFiles(findingsRootPath, "finding-")

  const allegations: AllegationFileItem[] = []
  const findings: FindingFileItem[] = []

  for (const fileName of allegationFiles) allegations.push(await buildAllegationFileItem(allegationsRootPath, fileName))
  for (const fileName of findingFiles) findings.push(await buildFindingFileItem(findingsRootPath, fileName))

  return {
    rootPath: resolveInvestigationRootPath(),
    generatedAt: new Date().toISOString(),
    allegations,
    findings,
  }
}

function assertSafeRelativePath(relativePath: string): string {
  const normalized = toPosixRelative(relativePath).replace(/^\/+/, "")
  if (!normalized.endsWith(".md")) {
    throw new Error("Only markdown documents are allowed")
  }
  const segments = normalized.split("/").filter(Boolean)
  if (segments.some((segment) => segment === "..") || path.isAbsolute(normalized)) {
    throw new Error("Path traversal detected")
  }
  return normalized
}

function resolveRootByKind(documentKind: InvestigationDocumentKind): string {
  return documentKind === "allegation" ? resolveAllegationsRootPath() : resolveFindingsRootPath()
}

export function normalizeInvestigationRelativePath(relativePath: string): string {
  return assertSafeRelativePath(relativePath)
}

export async function readInvestigationDocument(
  documentKind: InvestigationDocumentKind,
  relativePath: string
): Promise<InvestigationDocumentPayload> {
  await ensureInvestigationWorkspace()
  const rootPath = resolveRootByKind(documentKind)
  const safeRelativePath = assertSafeRelativePath(relativePath)
  const absolutePath = path.resolve(rootPath, safeRelativePath)
  const rootWithSeparator = `${toPosixRelative(path.resolve(rootPath))}/`
  const absolutePosix = toPosixRelative(path.resolve(absolutePath))
  if (!absolutePosix.startsWith(rootWithSeparator)) {
    throw new Error("Invalid investigation document path")
  }

  const fileStats = await stat(absolutePath)
  if (!fileStats.isFile()) {
    throw new Error("Investigation document is not a file")
  }

  const content = await readFile(absolutePath, "utf8")
  const fallbackTitle = path.basename(safeRelativePath, ".md")
  return {
    kind: documentKind,
    relativePath: safeRelativePath,
    title: inferTitle(content, fallbackTitle),
    content,
    updatedAt: fileStats.mtime.toISOString(),
    sizeBytes: fileStats.size,
  }
}

export function classifyInvestigationFileItem(item: InvestigationFileItem): InvestigationDocumentKind {
  return item.kind
}
