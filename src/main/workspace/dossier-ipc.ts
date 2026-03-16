import { ipcMain, type BrowserWindow } from 'electron'
import { mkdir } from 'node:fs/promises'
import {
  WORKSPACE_MARKDOWN_CHANNELS,
  type DossierChangeEvent,
} from '../../shared/workspace-markdown'
import {
  buildDossierIndex,
  normalizeDossierRelativePath,
  readDossierDocument,
  resolveDossierRootPath,
} from './dossier-index'
import { createDossierWatcher } from './dossier-watch'

const WINDOW_EVENT_TARGET = WORKSPACE_MARKDOWN_CHANNELS.dossierChanged

export async function registerDossierIpc(mainWindow: BrowserWindow): Promise<() => void> {
  await mkdir(resolveDossierRootPath(), { recursive: true })

  ipcMain.handle(WORKSPACE_MARKDOWN_CHANNELS.listDossierIndex, async () => {
    try {
      return await buildDossierIndex()
    } catch (error) {
      console.error('[workspace-markdown] Failed to list dossier index', error)
      throw error
    }
  })

  ipcMain.handle(WORKSPACE_MARKDOWN_CHANNELS.readDossierDocument, async (_event, rawRelativePath: string) => {
    try {
      const safeRelativePath = normalizeDossierRelativePath(rawRelativePath)
      return await readDossierDocument(safeRelativePath)
    } catch (error) {
      console.error('[workspace-markdown] Failed to read dossier document', {
        requestedPath: rawRelativePath,
        dossierRootPath: resolveDossierRootPath(),
        error,
      })
      throw error
    }
  })

  const stopWatcher = await createDossierWatcher({
    dossierRootPath: resolveDossierRootPath(),
    onChange: (event: DossierChangeEvent) => {
      if (mainWindow.isDestroyed()) return
      mainWindow.webContents.send(WINDOW_EVENT_TARGET, event)
    },
  })

  return () => {
    stopWatcher()
    ipcMain.removeHandler(WORKSPACE_MARKDOWN_CHANNELS.listDossierIndex)
    ipcMain.removeHandler(WORKSPACE_MARKDOWN_CHANNELS.readDossierDocument)
  }
}
