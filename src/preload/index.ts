import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  WORKSPACE_MARKDOWN_CHANNELS,
  type DossierChangeEvent,
  type WorkspaceMarkdownApi,
} from '../shared/workspace-markdown'
import {
  AGENT_CLI_CHANNELS,
  type AgentCliApi,
  type AgentCliEvent,
  type AgentCliRunRequest,
  type AgentCliRunResponse,
  type AgentCliStopRequest,
  type AgentCliStopResponse,
} from '../shared/agent-cli-ipc'
import {
  WORKSPACE_SOURCES_CHANNELS,
  type ResolveDroppedFilePathsRequest,
  type SourceChangeEvent,
  type WorkspaceSourcesApi,
} from '../shared/workspace-sources'
import {
  WORKSPACE_LEADS_CHANNELS,
  type LeadChangeEvent,
  type WorkspaceLeadsApi,
} from '../shared/workspace-leads'
import {
  WORKSPACE_INVESTIGATION_CHANNELS,
  type InvestigationChangeEvent,
  type WorkspaceInvestigationApi,
} from '../shared/workspace-investigation'

function splitTextPaths(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
}

function normalizeDroppedPath(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('file://')) {
    try {
      return path.normalize(fileURLToPath(trimmed))
    } catch {
      return null
    }
  }
  if (path.isAbsolute(trimmed)) {
    return path.normalize(trimmed)
  }
  return null
}

function resolveDroppedFilePaths(request: ResolveDroppedFilePathsRequest): string[] {
  const candidatePaths = Array.isArray(request.candidatePaths) ? request.candidatePaths : []
  const uriList = splitTextPaths(request.uriList)
  const plainText = splitTextPaths(request.plainText)
  const output = new Set<string>()
  const allCandidates = [...candidatePaths, ...uriList, ...plainText]
  for (const raw of allCandidates) {
    const normalized = normalizeDroppedPath(raw)
    if (normalized) output.add(normalized)
  }
  return Array.from(output)
}

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

const agentCliApi: AgentCliApi = {
  run: (request: AgentCliRunRequest): Promise<AgentCliRunResponse> =>
    ipcRenderer.invoke(AGENT_CLI_CHANNELS.run, request),
  stop: (request: AgentCliStopRequest): Promise<AgentCliStopResponse> =>
    ipcRenderer.invoke(AGENT_CLI_CHANNELS.stop, request),
  subscribeEvents: (listener) => {
    const channel = AGENT_CLI_CHANNELS.event
    const wrapped = (_event: unknown, payload: AgentCliEvent): void => {
      listener(payload)
    }
    ipcRenderer.on(channel, wrapped)
    return () => {
      ipcRenderer.removeListener(channel, wrapped)
    }
  },
}

const workspaceSourcesApi: WorkspaceSourcesApi = {
  listSourcesIndex: () => ipcRenderer.invoke(WORKSPACE_SOURCES_CHANNELS.listSourcesIndex),
  readSourceDocument: (relativePath) =>
    ipcRenderer.invoke(WORKSPACE_SOURCES_CHANNELS.readSourceDocument, relativePath),
  uploadSourceFiles: (sourceFilePaths) =>
    ipcRenderer.invoke(WORKSPACE_SOURCES_CHANNELS.uploadSourceFiles, sourceFilePaths),
  setSourceSelection: (docIds, selected) =>
    ipcRenderer.invoke(WORKSPACE_SOURCES_CHANNELS.setSourceSelection, docIds, selected),
  pickSourceFiles: () => ipcRenderer.invoke(WORKSPACE_SOURCES_CHANNELS.pickSourceFiles),
  resolveDroppedFilePaths: (request) => Promise.resolve(resolveDroppedFilePaths(request)),
  subscribeSourcesChanges: (listener) => {
    const channel = WORKSPACE_SOURCES_CHANNELS.sourcesChanged
    const wrapped = (_event: unknown, payload: SourceChangeEvent): void => {
      listener(payload)
    }
    ipcRenderer.on(channel, wrapped)
    return () => {
      ipcRenderer.removeListener(channel, wrapped)
    }
  },
}

const workspaceLeadsApi: WorkspaceLeadsApi = {
  listLeadsIndex: () => ipcRenderer.invoke(WORKSPACE_LEADS_CHANNELS.listLeadsIndex),
  readLeadDocument: (relativePath) => ipcRenderer.invoke(WORKSPACE_LEADS_CHANNELS.readLeadDocument, relativePath),
  subscribeLeadsChanges: (listener) => {
    const channel = WORKSPACE_LEADS_CHANNELS.leadsChanged
    const wrapped = (_event: unknown, payload: LeadChangeEvent): void => {
      listener(payload)
    }
    ipcRenderer.on(channel, wrapped)
    return () => {
      ipcRenderer.removeListener(channel, wrapped)
    }
  },
}

const workspaceInvestigationApi: WorkspaceInvestigationApi = {
  listInvestigationIndex: () => ipcRenderer.invoke(WORKSPACE_INVESTIGATION_CHANNELS.listInvestigationIndex),
  readInvestigationDocument: (documentKind, relativePath) =>
    ipcRenderer.invoke(
      WORKSPACE_INVESTIGATION_CHANNELS.readInvestigationDocument,
      documentKind,
      relativePath
    ),
  subscribeInvestigationChanges: (listener) => {
    const channel = WORKSPACE_INVESTIGATION_CHANNELS.investigationChanged
    const wrapped = (_event: unknown, payload: InvestigationChangeEvent): void => {
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
  agentCli: agentCliApi,
  workspaceSources: workspaceSourcesApi,
  workspaceLeads: workspaceLeadsApi,
  workspaceInvestigation: workspaceInvestigationApi,
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
