import { ipcMain, type BrowserWindow } from "electron"
import {
  WORKSPACE_INVESTIGATION_CHANNELS,
  type InvestigationChangeEvent,
  type InvestigationDocumentKind,
} from "../../shared/workspace-investigation"
import {
  buildInvestigationIndex,
  ensureInvestigationWorkspace,
  normalizeInvestigationRelativePath,
  readInvestigationDocument,
  resolveInvestigationRootPath,
} from "./investigation-index"
import { createInvestigationWatcher } from "./investigation-watch"

const WINDOW_EVENT_TARGET = WORKSPACE_INVESTIGATION_CHANNELS.investigationChanged

export async function registerInvestigationIpc(mainWindow: BrowserWindow): Promise<() => void> {
  ipcMain.handle(WORKSPACE_INVESTIGATION_CHANNELS.listInvestigationIndex, async () => {
    try {
      await ensureInvestigationWorkspace()
      return await buildInvestigationIndex()
    } catch (error) {
      console.error("[workspace-investigation] Failed to list investigation index", error)
      throw error
    }
  })

  ipcMain.handle(
    WORKSPACE_INVESTIGATION_CHANNELS.readInvestigationDocument,
    async (_event, documentKind: InvestigationDocumentKind, rawRelativePath: string) => {
      try {
        await ensureInvestigationWorkspace()
        const safeRelativePath = normalizeInvestigationRelativePath(rawRelativePath)
        return await readInvestigationDocument(documentKind, safeRelativePath)
      } catch (error) {
        console.error("[workspace-investigation] Failed to read investigation document", {
          requestedPath: rawRelativePath,
          investigationRootPath: resolveInvestigationRootPath(),
          error,
        })
        throw error
      }
    }
  )

  let stopWatcher: () => void = () => undefined
  try {
    await ensureInvestigationWorkspace()
    stopWatcher = await createInvestigationWatcher({
      investigationRootPath: resolveInvestigationRootPath(),
      onChange: (event: InvestigationChangeEvent) => {
        if (mainWindow.isDestroyed()) return
        mainWindow.webContents.send(WINDOW_EVENT_TARGET, event)
      },
    })
  } catch (error) {
    console.error("[workspace-investigation] Failed to start investigation watcher", error)
  }

  return () => {
    stopWatcher()
    ipcMain.removeHandler(WORKSPACE_INVESTIGATION_CHANNELS.listInvestigationIndex)
    ipcMain.removeHandler(WORKSPACE_INVESTIGATION_CHANNELS.readInvestigationDocument)
  }
}
