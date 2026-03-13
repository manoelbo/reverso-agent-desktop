import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import {
  WORKSPACE_MARKDOWN_CHANNELS,
  type DossierChangeEvent,
  type WorkspaceMarkdownApi,
} from '../shared/workspace-markdown'

// Custom APIs for renderer
const workspaceMarkdownApi: WorkspaceMarkdownApi = {
  listDossierIndex: () => ipcRenderer.invoke(WORKSPACE_MARKDOWN_CHANNELS.listDossierIndex),
  readDossierDocument: (relativePath) => ipcRenderer.invoke(WORKSPACE_MARKDOWN_CHANNELS.readDossierDocument, relativePath),
  subscribeDossierChanges: (listener) => {
    const channel = WORKSPACE_MARKDOWN_CHANNELS.dossierChanged
    const wrapped = (_event: unknown, payload: DossierChangeEvent): void => {
      listener(payload)
    }
    ipcRenderer.on(channel, wrapped)
    return () => {
      ipcRenderer.removeListener(channel, wrapped)
    }
  },
}

const api = {
  workspaceMarkdown: workspaceMarkdownApi,
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
