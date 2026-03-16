import type {
  InvestigationChangeEvent,
  InvestigationDocumentKind,
  InvestigationDocumentPayload,
  InvestigationIndexPayload,
} from "../../../../../shared/workspace-investigation"

type WorkspaceApiShape = {
  workspaceInvestigation?: {
    listInvestigationIndex?: () => Promise<InvestigationIndexPayload>
    readInvestigationDocument?: (
      documentKind: InvestigationDocumentKind,
      relativePath: string
    ) => Promise<InvestigationDocumentPayload>
    subscribeInvestigationChanges?: (listener: (event: InvestigationChangeEvent) => void) => () => void
  }
}

function getWorkspaceApi(): WorkspaceApiShape | null {
  if (typeof window === "undefined") return null
  return (window as { api?: WorkspaceApiShape }).api ?? null
}

export async function listInvestigationIndex(): Promise<InvestigationIndexPayload | null> {
  const api = getWorkspaceApi()?.workspaceInvestigation
  if (!api?.listInvestigationIndex) {
    return null
  }
  return api.listInvestigationIndex()
}

export async function readInvestigationDocument(
  documentKind: InvestigationDocumentKind,
  relativePath: string
): Promise<InvestigationDocumentPayload | null> {
  const api = getWorkspaceApi()?.workspaceInvestigation
  if (!api?.readInvestigationDocument) {
    return null
  }
  return api.readInvestigationDocument(documentKind, relativePath)
}

export function subscribeInvestigationChanges(listener: (event: InvestigationChangeEvent) => void): () => void {
  const api = getWorkspaceApi()?.workspaceInvestigation
  if (!api?.subscribeInvestigationChanges) {
    return () => undefined
  }
  return api.subscribeInvestigationChanges(listener)
}
