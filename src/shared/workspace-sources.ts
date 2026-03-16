export type SourceProcessingStatus =
  | 'not_processed'
  | 'replica_running'
  | 'preview_metadata_running'
  | 'replica_paused'
  | 'preview_metadata_paused'
  | 'done'
  | 'failed'

export type SourceProcessingMode = 'standard' | 'deep'

export type SourceFileEntry = {
  docId: string
  originalFileName: string
  sourcePath: string
  fileType: 'pdf'
  artifactDir: string
  selected: boolean
  status: SourceProcessingStatus
  createdAt: string
  updatedAt: string
  queuedAt: string | null
  processingMode: SourceProcessingMode
  attemptCount?: number
  lastAttemptAt?: string
  startedAt?: string
  finishedAt?: string
  lastError?: string
  processingSummary?: {
    totalPagesInPdf?: number
    totalChunks?: number
    usage?: {
      promptTokens?: number
      completionTokens?: number
      totalTokens?: number
    }
    model?: string
    previewModel?: string
  }
}

export type SourceCheckpoint = {
  version: number
  sourceDir: string
  updatedAt: string
  lastRunAt?: string
  queueStatus?: 'idle' | 'running'
  files: SourceFileEntry[]
}

export type SourcePreviewItem = {
  docId: string
  relativePath: string
  fileName: string
  title: string
  updatedAt: string
}

export type SourcesIndexPayload = {
  rootPath: string
  generatedAt: string
  checkpoint: SourceCheckpoint
  previews: SourcePreviewItem[]
}

export type SourceDocumentPayload = {
  relativePath: string
  title: string
  content: string
  updatedAt: string
  sizeBytes: number
}

export type SourcesUploadResult = {
  added: string[]
  skipped: string[]
}

export type ResolveDroppedFilePathsRequest = {
  candidatePaths: string[]
  uriList?: string
  plainText?: string
}

export type SourceChangeEvent =
  | {
      kind: 'checkpoint'
      timestamp: string
    }
  | {
      kind: 'artifacts'
      timestamp: string
    }
  | {
      kind: 'sources'
      timestamp: string
    }

export const WORKSPACE_SOURCES_CHANNELS = {
  listSourcesIndex: 'workspace-sources:list-sources-index',
  readSourceDocument: 'workspace-sources:read-source-document',
  uploadSourceFiles: 'workspace-sources:upload-source-files',
  setSourceSelection: 'workspace-sources:set-source-selection',
  pickSourceFiles: 'workspace-sources:pick-source-files',
  sourcesChanged: 'workspace-sources:sources-changed',
} as const

export interface WorkspaceSourcesApi {
  listSourcesIndex: () => Promise<SourcesIndexPayload>
  readSourceDocument: (relativePath: string) => Promise<SourceDocumentPayload>
  uploadSourceFiles: (sourceFilePaths: string[]) => Promise<SourcesUploadResult>
  setSourceSelection: (docIds: string[], selected: boolean) => Promise<SourcesIndexPayload>
  pickSourceFiles: () => Promise<string[]>
  resolveDroppedFilePaths: (request: ResolveDroppedFilePathsRequest) => Promise<string[]>
  subscribeSourcesChanges: (listener: (event: SourceChangeEvent) => void) => () => void
}
