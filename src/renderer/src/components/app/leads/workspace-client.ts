import type {
  LeadChangeEvent,
  LeadDocumentPayload,
  LeadsIndexPayload,
} from '../../../../../shared/workspace-leads'

type WorkspaceApiShape = {
  workspaceLeads?: {
    listLeadsIndex?: () => Promise<LeadsIndexPayload>
    readLeadDocument?: (relativePath: string) => Promise<LeadDocumentPayload>
    subscribeLeadsChanges?: (listener: (event: LeadChangeEvent) => void) => () => void
  }
}

function getWorkspaceApi(): WorkspaceApiShape | null {
  if (typeof window === 'undefined') return null
  return (window as { api?: WorkspaceApiShape }).api ?? null
}

export function isWorkspaceLeadsApiAvailable(): boolean {
  const api = getWorkspaceApi()?.workspaceLeads
  return Boolean(api?.listLeadsIndex && api?.readLeadDocument && api?.subscribeLeadsChanges)
}

export async function listLeadsIndex(): Promise<LeadsIndexPayload | null> {
  const api = getWorkspaceApi()?.workspaceLeads
  if (!api?.listLeadsIndex) {
    return null
  }
  return api.listLeadsIndex()
}

export async function readLeadDocument(relativePath: string): Promise<LeadDocumentPayload | null> {
  const api = getWorkspaceApi()?.workspaceLeads
  if (!api?.readLeadDocument) {
    return null
  }
  return api.readLeadDocument(relativePath)
}

export function subscribeLeadsChanges(listener: (event: LeadChangeEvent) => void): () => void {
  const api = getWorkspaceApi()?.workspaceLeads
  if (!api?.subscribeLeadsChanges) {
    return () => undefined
  }
  return api.subscribeLeadsChanges(listener)
}
