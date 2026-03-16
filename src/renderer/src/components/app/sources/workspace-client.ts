import type {
  ResolveDroppedFilePathsRequest,
  SourceChangeEvent,
  SourceDocumentPayload,
  SourcesIndexPayload,
  SourcesUploadResult,
} from '../../../../../shared/workspace-sources'

type WorkspaceApiShape = {
  workspaceSources?: {
    listSourcesIndex?: () => Promise<SourcesIndexPayload>
    readSourceDocument?: (relativePath: string) => Promise<SourceDocumentPayload>
    uploadSourceFiles?: (sourceFilePaths: string[]) => Promise<SourcesUploadResult>
    setSourceSelection?: (docIds: string[], selected: boolean) => Promise<SourcesIndexPayload>
    pickSourceFiles?: () => Promise<string[]>
    resolveDroppedFilePaths?: (request: ResolveDroppedFilePathsRequest) => Promise<string[]>
    subscribeSourcesChanges?: (listener: (event: SourceChangeEvent) => void) => () => void
  }
}

function getWorkspaceApi(): WorkspaceApiShape | null {
  if (typeof window === 'undefined') return null
  return (window as { api?: WorkspaceApiShape }).api ?? null
}

export function isWorkspaceSourcesApiAvailable(): boolean {
  const api = getWorkspaceApi()?.workspaceSources
  return Boolean(
    api?.listSourcesIndex &&
      api?.readSourceDocument &&
      api?.uploadSourceFiles &&
      api?.setSourceSelection &&
      api?.pickSourceFiles &&
      api?.resolveDroppedFilePaths &&
      api?.subscribeSourcesChanges
  )
}

export async function listSourcesIndex(): Promise<SourcesIndexPayload | null> {
  const api = getWorkspaceApi()?.workspaceSources
  if (!api?.listSourcesIndex) {
    return null
  }
  return api.listSourcesIndex()
}

export async function readSourceDocument(relativePath: string): Promise<SourceDocumentPayload | null> {
  const api = getWorkspaceApi()?.workspaceSources
  if (!api?.readSourceDocument) {
    return null
  }
  return api.readSourceDocument(relativePath)
}

export async function uploadSourceFiles(sourceFilePaths: string[]): Promise<SourcesUploadResult | null> {
  const api = getWorkspaceApi()?.workspaceSources
  if (!api?.uploadSourceFiles) {
    return null
  }
  return api.uploadSourceFiles(sourceFilePaths)
}

export async function setSourceSelection(
  docIds: string[],
  selected: boolean
): Promise<SourcesIndexPayload | null> {
  const api = getWorkspaceApi()?.workspaceSources
  if (!api?.setSourceSelection) {
    return null
  }
  return api.setSourceSelection(docIds, selected)
}

export async function pickSourceFiles(): Promise<string[]> {
  const api = getWorkspaceApi()?.workspaceSources
  if (!api?.pickSourceFiles) {
    return []
  }
  return api.pickSourceFiles()
}

export async function resolveDroppedFilePaths(
  request: ResolveDroppedFilePathsRequest
): Promise<string[]> {
  const api = getWorkspaceApi()?.workspaceSources
  if (!api?.resolveDroppedFilePaths) {
    return Array.isArray(request.candidatePaths) ? request.candidatePaths : []
  }
  return api.resolveDroppedFilePaths(request)
}

export function subscribeSourcesChanges(listener: (event: SourceChangeEvent) => void): () => void {
  const api = getWorkspaceApi()?.workspaceSources
  if (!api?.subscribeSourcesChanges) {
    return () => undefined
  }
  return api.subscribeSourcesChanges(listener)
}
