import { ipcMain, type BrowserWindow } from 'electron'
import {
  WORKSPACE_LEADS_CHANNELS,
  type LeadChangeEvent,
} from '../../shared/workspace-leads'
import {
  buildLeadsIndex,
  ensureLeadsWorkspace,
  normalizeLeadRelativePath,
  readLeadDocument,
  resolveLeadsRootPath,
} from './lead-index'
import { createLeadWatcher } from './lead-watch'

const WINDOW_EVENT_TARGET = WORKSPACE_LEADS_CHANNELS.leadsChanged

export async function registerLeadsIpc(mainWindow: BrowserWindow): Promise<() => void> {
  ipcMain.handle(WORKSPACE_LEADS_CHANNELS.listLeadsIndex, async () => {
    try {
      await ensureLeadsWorkspace()
      return await buildLeadsIndex()
    } catch (error) {
      console.error('[workspace-leads] Failed to list leads index', error)
      throw error
    }
  })

  ipcMain.handle(WORKSPACE_LEADS_CHANNELS.readLeadDocument, async (_event, rawRelativePath: string) => {
    try {
      await ensureLeadsWorkspace()
      const safeRelativePath = normalizeLeadRelativePath(rawRelativePath)
      return await readLeadDocument(safeRelativePath)
    } catch (error) {
      console.error('[workspace-leads] Failed to read lead document', {
        requestedPath: rawRelativePath,
        leadsRootPath: resolveLeadsRootPath(),
        error,
      })
      throw error
    }
  })

  let stopWatcher: () => void = () => undefined
  try {
    await ensureLeadsWorkspace()
    stopWatcher = await createLeadWatcher({
      leadsRootPath: resolveLeadsRootPath(),
      onChange: (event: LeadChangeEvent) => {
        if (mainWindow.isDestroyed()) return
        mainWindow.webContents.send(WINDOW_EVENT_TARGET, event)
      },
    })
  } catch (error) {
    console.error('[workspace-leads] Failed to start leads watcher', error)
  }

  return () => {
    stopWatcher()
    ipcMain.removeHandler(WORKSPACE_LEADS_CHANNELS.listLeadsIndex)
    ipcMain.removeHandler(WORKSPACE_LEADS_CHANNELS.readLeadDocument)
  }
}
