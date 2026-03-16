import { existsSync, watch, type FSWatcher } from "node:fs"
import path from "node:path"
import type {
  InvestigationChangeEvent,
  InvestigationDocumentKind,
} from "../../shared/workspace-investigation"

const DEBOUNCE_MS = 220

type InvestigationWatcherOptions = {
  investigationRootPath: string
  onChange: (event: InvestigationChangeEvent) => void
}

function toPosix(value: string): string {
  return value.split(path.sep).join("/")
}

function detectDocumentKind(relativePath: string): InvestigationDocumentKind | null {
  if (relativePath.startsWith("allegations/")) return "allegation"
  if (relativePath.startsWith("findings/")) return "finding"
  return null
}

export async function createInvestigationWatcher(options: InvestigationWatcherOptions): Promise<() => void> {
  const rootPath = path.resolve(options.investigationRootPath)
  const watchers = new Map<string, FSWatcher>()
  const pendingByPath = new Map<string, ReturnType<typeof setTimeout>>()
  let isClosed = false

  const emitDebounced = (event: InvestigationChangeEvent): void => {
    const key =
      event.kind === "renamed"
        ? `renamed:${event.documentKind}:${event.oldRelativePath}:${event.newRelativePath}`
        : `${event.kind}:${event.documentKind}:${event.relativePath}`
    const existingTimer = pendingByPath.get(key)
    if (existingTimer) clearTimeout(existingTimer)
    const timer = setTimeout(() => {
      pendingByPath.delete(key)
      if (!isClosed) options.onChange(event)
    }, DEBOUNCE_MS)
    pendingByPath.set(key, timer)
  }

  const processFsEvent = (directoryPath: string, eventType: string, fileName: string): void => {
    if (!fileName || fileName.startsWith(".")) return
    if (!fileName.endsWith(".md")) return
    const absolutePath = path.join(directoryPath, fileName)
    const relativePath = toPosix(path.relative(rootPath, absolutePath))
    const documentKind = detectDocumentKind(relativePath)
    if (!documentKind) return
    const timestamp = new Date().toISOString()

    if (eventType === "change") {
      emitDebounced({ kind: "changed", documentKind, relativePath, timestamp })
      return
    }

    if (existsSync(absolutePath)) {
      emitDebounced({
        kind: "renamed",
        documentKind,
        oldRelativePath: relativePath,
        newRelativePath: relativePath,
        timestamp,
      })
      return
    }

    emitDebounced({ kind: "deleted", documentKind, relativePath, timestamp })
  }

  const attachWatcher = (targetPath: string): void => {
    if (watchers.has(targetPath) || isClosed) return
    try {
      const watcher = watch(targetPath, { recursive: true }, (eventType, fileName) => {
        if (typeof fileName !== "string") return
        processFsEvent(targetPath, eventType, fileName)
      })
      watchers.set(targetPath, watcher)
    } catch (error) {
      console.error(`[workspace-investigation] Failed to watch ${targetPath}`, error)
    }
  }

  attachWatcher(rootPath)

  return () => {
    if (isClosed) return
    isClosed = true
    for (const timer of Array.from(pendingByPath.values())) clearTimeout(timer)
    pendingByPath.clear()
    for (const watcher of Array.from(watchers.values())) watcher.close()
    watchers.clear()
  }
}
