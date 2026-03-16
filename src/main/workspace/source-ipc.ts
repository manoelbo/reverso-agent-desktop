import { dialog, ipcMain, type BrowserWindow } from 'electron'
import {
  WORKSPACE_SOURCES_CHANNELS,
  type SourceChangeEvent,
} from '../../shared/workspace-sources'
import {
  buildSourcesIndex,
  ensureSourcesWorkspace,
  ingestSourceFiles,
  normalizeSourceRelativePath,
  readSourceDocument,
  resolveSourcesRootPath,
  updateSourceSelection,
} from './source-index'
import { createSourceWatcher } from './source-watch'

const WINDOW_EVENT_TARGET = WORKSPACE_SOURCES_CHANNELS.sourcesChanged

export async function registerSourcesIpc(mainWindow: BrowserWindow): Promise<() => void> {
  await ensureSourcesWorkspace()

  ipcMain.handle(WORKSPACE_SOURCES_CHANNELS.listSourcesIndex, async () => {
    try {
      return await buildSourcesIndex()
    } catch (error) {
      console.error('[workspace-sources] Failed to list sources index', error)
      throw error
    }
  })

  ipcMain.handle(WORKSPACE_SOURCES_CHANNELS.readSourceDocument, async (_event, rawRelativePath: string) => {
    try {
      const safeRelativePath = normalizeSourceRelativePath(rawRelativePath)
      return await readSourceDocument(safeRelativePath)
    } catch (error) {
      console.error('[workspace-sources] Failed to read source document', {
        requestedPath: rawRelativePath,
        sourceRootPath: resolveSourcesRootPath(),
        error,
      })
      throw error
    }
  })

  ipcMain.handle(WORKSPACE_SOURCES_CHANNELS.uploadSourceFiles, async (_event, sourceFilePaths: string[]) => {
    try {
      return await ingestSourceFiles(Array.isArray(sourceFilePaths) ? sourceFilePaths : [])
    } catch (error) {
      console.error('[workspace-sources] Failed to upload source files', error)
      throw error
    }
  })

  ipcMain.handle(
    WORKSPACE_SOURCES_CHANNELS.setSourceSelection,
    async (_event, docIds: string[], selected: boolean) => {
      try {
        return await updateSourceSelection(Array.isArray(docIds) ? docIds : [], Boolean(selected))
      } catch (error) {
        console.error('[workspace-sources] Failed to update source selection', error)
        throw error
      }
    }
  )

  ipcMain.handle(WORKSPACE_SOURCES_CHANNELS.pickSourceFiles, async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Selecionar PDFs para Sources',
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    })
    if (result.canceled) {
      return []
    }
    return result.filePaths
  })

  const stopWatcher = await createSourceWatcher({
    sourcesRootPath: resolveSourcesRootPath(),
    onChange: (event: SourceChangeEvent) => {
      if (mainWindow.isDestroyed()) return
      mainWindow.webContents.send(WINDOW_EVENT_TARGET, event)
    },
  })

  return () => {
    stopWatcher()
    ipcMain.removeHandler(WORKSPACE_SOURCES_CHANNELS.listSourcesIndex)
    ipcMain.removeHandler(WORKSPACE_SOURCES_CHANNELS.readSourceDocument)
    ipcMain.removeHandler(WORKSPACE_SOURCES_CHANNELS.uploadSourceFiles)
    ipcMain.removeHandler(WORKSPACE_SOURCES_CHANNELS.setSourceSelection)
    ipcMain.removeHandler(WORKSPACE_SOURCES_CHANNELS.pickSourceFiles)
  }
}
