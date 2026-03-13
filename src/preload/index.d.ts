import { ElectronAPI } from '@electron-toolkit/preload'
import type { WorkspaceMarkdownApi } from '../shared/workspace-markdown'

type ReversoPreloadApi = {
  workspaceMarkdown: WorkspaceMarkdownApi
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: ReversoPreloadApi
  }
}
