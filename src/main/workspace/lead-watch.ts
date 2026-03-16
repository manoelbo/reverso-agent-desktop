import { existsSync, watch, type FSWatcher } from 'node:fs'
import { readdir } from 'node:fs/promises'
import path from 'node:path'
import type { LeadChangeEvent } from '../../shared/workspace-leads'

const DEBOUNCE_MS = 220
const LEAD_CHECKPOINT_FILE = 'lead-checkpoint.json'

type LeadWatcherOptions = {
  leadsRootPath: string
  onChange: (event: LeadChangeEvent) => void
}

function toPosix(value: string): string {
  return value.split(path.sep).join('/')
}

async function collectDirectories(rootPath: string): Promise<string[]> {
  const output: string[] = []

  async function walk(currentPath: string): Promise<void> {
    output.push(currentPath)
    let entries: { name: string; isDirectory: () => boolean }[]
    try {
      entries = await readdir(currentPath, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue
      await walk(path.join(currentPath, entry.name))
    }
  }

  await walk(rootPath)
  return output
}

export async function createLeadWatcher(options: LeadWatcherOptions): Promise<() => void> {
  const rootPath = path.resolve(options.leadsRootPath)
  const watchers = new Map<string, FSWatcher>()
  const pendingByPath = new Map<string, ReturnType<typeof setTimeout>>()
  let isClosed = false

  const emitDebounced = (event: LeadChangeEvent): void => {
    const key =
      event.kind === 'renamed'
        ? `renamed:${event.oldRelativePath}:${event.newRelativePath}`
        : `${event.kind}:${event.relativePath}`
    const existingTimer = pendingByPath.get(key)
    if (existingTimer) clearTimeout(existingTimer)
    const timer = setTimeout(() => {
      pendingByPath.delete(key)
      if (!isClosed) options.onChange(event)
    }, DEBOUNCE_MS)
    pendingByPath.set(key, timer)
  }

  const processFsEvent = (directoryPath: string, eventType: string, fileName: string): void => {
    if (!fileName || fileName.startsWith('.')) return
    const absolutePath = path.join(directoryPath, fileName)
    const lowerPath = absolutePath.toLowerCase()
    const isLeadMarkdown = lowerPath.endsWith('.md')
    const isLeadCheckpoint = path.basename(absolutePath) === LEAD_CHECKPOINT_FILE
    if (!isLeadMarkdown && !isLeadCheckpoint) return
    const relativePath = toPosix(path.relative(rootPath, absolutePath))
    const timestamp = new Date().toISOString()

    if (eventType === 'change') {
      emitDebounced({ kind: 'changed', relativePath, timestamp })
      return
    }

    if (existsSync(absolutePath)) {
      emitDebounced({
        kind: 'renamed',
        oldRelativePath: relativePath,
        newRelativePath: relativePath,
        timestamp,
      })
      return
    }

    emitDebounced({ kind: 'deleted', relativePath, timestamp })
  }

  const watchDirectory = (directoryPath: string): void => {
    if (watchers.has(directoryPath) || isClosed) return
    try {
      const watcher = watch(directoryPath, { recursive: false }, (eventType, fileName) => {
        if (typeof fileName !== 'string') return
        processFsEvent(directoryPath, eventType, fileName)
      })
      watchers.set(directoryPath, watcher)
    } catch (error) {
      console.error(`[workspace-leads] Failed to watch ${directoryPath}`, error)
    }
  }

  const refreshFallbackDirectoryWatchers = async (): Promise<void> => {
    const directories = await collectDirectories(rootPath)
    const nextDirectories = new Set(directories)

    for (const directoryPath of directories) {
      watchDirectory(directoryPath)
    }

    for (const [directoryPath, watcher] of Array.from(watchers.entries())) {
      if (!nextDirectories.has(directoryPath)) {
        watcher.close()
        watchers.delete(directoryPath)
      }
    }
  }

  try {
    const recursiveWatcher = watch(rootPath, { recursive: true }, (eventType, fileName) => {
      if (typeof fileName !== 'string') return
      processFsEvent(rootPath, eventType, fileName)
    })
    watchers.set(rootPath, recursiveWatcher)
  } catch {
    await refreshFallbackDirectoryWatchers()
    const fallbackResyncWatcher = watch(rootPath, { recursive: false }, async () => {
      try {
        await refreshFallbackDirectoryWatchers()
      } catch (error) {
        console.error('[workspace-leads] Failed to refresh lead watcher directories', error)
      }
    })
    watchers.set('__resync__', fallbackResyncWatcher)
  }

  return () => {
    if (isClosed) return
    isClosed = true

    for (const timer of Array.from(pendingByPath.values())) clearTimeout(timer)
    pendingByPath.clear()

    for (const watcher of Array.from(watchers.values())) watcher.close()
    watchers.clear()
  }
}
