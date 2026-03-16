import { existsSync, watch, type FSWatcher } from 'node:fs'
import { readdir } from 'node:fs/promises'
import path from 'node:path'
import type { SourceChangeEvent } from '../../shared/workspace-sources'

const DEBOUNCE_MS = 220

type SourceWatcherOptions = {
  sourcesRootPath: string
  onChange: (event: SourceChangeEvent) => void
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
      if (!entry.isDirectory()) continue
      await walk(path.join(currentPath, entry.name))
    }
  }
  await walk(rootPath)
  return output
}

export async function createSourceWatcher(options: SourceWatcherOptions): Promise<() => void> {
  const rootPath = path.resolve(options.sourcesRootPath)
  const watchers = new Map<string, FSWatcher>()
  const pendingByKey = new Map<string, ReturnType<typeof setTimeout>>()
  let isClosed = false

  const emitDebounced = (event: SourceChangeEvent): void => {
    const key = event.kind
    const existing = pendingByKey.get(key)
    if (existing) clearTimeout(existing)
    const timer = setTimeout(() => {
      pendingByKey.delete(key)
      if (!isClosed) options.onChange(event)
    }, DEBOUNCE_MS)
    pendingByKey.set(key, timer)
  }

  const processFsEvent = (directoryPath: string, fileName: string): void => {
    if (!fileName) return
    const absolutePath = path.join(directoryPath, fileName)
    const lower = absolutePath.toLowerCase()
    if (
      fileName.startsWith('.') &&
      !lower.includes(`${path.sep}.artifacts${path.sep}`) &&
      !lower.endsWith(`${path.sep}.artifacts`)
    ) {
      return
    }
    const timestamp = new Date().toISOString()
    if (lower.endsWith('source-checkpoint.json')) {
      emitDebounced({ kind: 'checkpoint', timestamp })
      return
    }
    if (lower.includes(`${path.sep}.artifacts${path.sep}`) || lower.endsWith(`${path.sep}.artifacts`)) {
      emitDebounced({ kind: 'artifacts', timestamp })
      return
    }
    if (lower.endsWith('.pdf')) {
      emitDebounced({ kind: 'sources', timestamp })
      return
    }
    if (existsSync(absolutePath)) {
      emitDebounced({ kind: 'sources', timestamp })
    }
  }

  const watchDirectory = (directoryPath: string): void => {
    if (watchers.has(directoryPath) || isClosed) return
    try {
      const watcher = watch(directoryPath, { recursive: false }, (_eventType, fileName) => {
        if (typeof fileName !== 'string') return
        processFsEvent(directoryPath, fileName)
      })
      watchers.set(directoryPath, watcher)
    } catch (error) {
      console.error(`[workspace-sources] Failed to watch ${directoryPath}`, error)
    }
  }

  const refreshFallbackDirectoryWatchers = async (): Promise<void> => {
    const directories = await collectDirectories(rootPath)
    const nextDirectories = new Set(directories)
    for (const directoryPath of directories) watchDirectory(directoryPath)
    for (const [directoryPath, watcher] of Array.from(watchers.entries())) {
      if (!nextDirectories.has(directoryPath)) {
        watcher.close()
        watchers.delete(directoryPath)
      }
    }
  }

  try {
    const recursiveWatcher = watch(rootPath, { recursive: true }, (_eventType, fileName) => {
      if (typeof fileName !== 'string') return
      processFsEvent(rootPath, fileName)
    })
    watchers.set(rootPath, recursiveWatcher)
  } catch {
    await refreshFallbackDirectoryWatchers()
    const fallbackResyncWatcher = watch(rootPath, { recursive: false }, async () => {
      try {
        await refreshFallbackDirectoryWatchers()
      } catch (error) {
        console.error('[workspace-sources] Failed to refresh source watcher directories', error)
      }
    })
    watchers.set('__resync__', fallbackResyncWatcher)
  }

  return () => {
    if (isClosed) return
    isClosed = true
    for (const timer of Array.from(pendingByKey.values())) clearTimeout(timer)
    pendingByKey.clear()
    for (const watcher of Array.from(watchers.values())) watcher.close()
    watchers.clear()
  }
}
