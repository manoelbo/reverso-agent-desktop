import type {
  DossierChangeEvent,
  DossierDocumentPayload,
  DossierIndexPayload,
} from '../../../../../shared/workspace-markdown'

type WorkspaceApiShape = {
  workspaceMarkdown?: {
    listDossierIndex?: () => Promise<DossierIndexPayload>
    readDossierDocument?: (relativePath: string) => Promise<DossierDocumentPayload>
    subscribeDossierChanges?: (listener: (event: DossierChangeEvent) => void) => () => void
  }
}

function getWorkspaceApi(): WorkspaceApiShape | null {
  if (typeof window === 'undefined') return null
  return (window as { api?: WorkspaceApiShape }).api ?? null
}

export function isWorkspaceMarkdownApiAvailable(): boolean {
  const api = getWorkspaceApi()?.workspaceMarkdown
  return Boolean(api?.listDossierIndex && api?.readDossierDocument && api?.subscribeDossierChanges)
}

export async function listDossierIndex(): Promise<DossierIndexPayload | null> {
  const api = getWorkspaceApi()?.workspaceMarkdown
  if (!api?.listDossierIndex) {
    return null
  }
  return api.listDossierIndex()
}

export async function readDossierDocument(relativePath: string): Promise<DossierDocumentPayload | null> {
  const api = getWorkspaceApi()?.workspaceMarkdown
  if (!api?.readDossierDocument) {
    return null
  }
  return api.readDossierDocument(relativePath)
}

export function subscribeDossierChanges(listener: (event: DossierChangeEvent) => void): () => void {
  const api = getWorkspaceApi()?.workspaceMarkdown
  if (!api?.subscribeDossierChanges) {
    return () => undefined
  }
  return api.subscribeDossierChanges(listener)
}
