import { ElectronAPI } from '@electron-toolkit/preload'
import type { WorkspaceMarkdownApi } from '../shared/workspace-markdown'
import type { AgentCliApi } from '../shared/agent-cli-ipc'
import type { WorkspaceSourcesApi } from '../shared/workspace-sources'
import type { WorkspaceLeadsApi } from '../shared/workspace-leads'
import type { WorkspaceInvestigationApi } from '../shared/workspace-investigation'

type ReversoPreloadApi = {
  workspaceMarkdown: WorkspaceMarkdownApi
  agentCli: AgentCliApi
  workspaceSources: WorkspaceSourcesApi
  workspaceLeads: WorkspaceLeadsApi
  workspaceInvestigation: WorkspaceInvestigationApi
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: ReversoPreloadApi
  }
}
