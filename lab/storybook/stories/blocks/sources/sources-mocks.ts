export type SourceProcessingStatus =
  | 'not_processed'
  | 'replica_running'
  | 'preview_metadata_running'
  | 'done'
  | 'failed'

export type SourceProcessingMode = 'standard' | 'deep'

export type SourceRow = {
  docId: string
  originalFileName: string
  fileType: string
  status: SourceProcessingStatus
  processingMode: SourceProcessingMode
  selected: boolean
  queuedAt: string | null
  updatedAt: string
  startedAt: string | null
  finishedAt: string | null
  attemptCount: number
  nextRetryAt: string | null
  lastError: string | null
  previewPath: string | null
}

export const sourcesGeneralCommands = [
  '/process-all --standard',
  '/process-all --deep',
  '/queue-status',
  '/process-queue',
  '/queue-clear',
  '/rerun-all --standard',
  '/rerun-all --deep'
] as const

export const sourcesBulkCommands = [
  '/process-selected --standard',
  '/process-selected --deep',
  '/rerun-selected --standard',
  '/rerun-selected --deep'
] as const

export const sourcesRowsMock: SourceRow[] = [
  {
    docId: 'source-01',
    originalFileName: 'bidding-contract-2024.pdf',
    fileType: 'pdf',
    status: 'done',
    processingMode: 'standard',
    selected: true,
    queuedAt: null,
    updatedAt: '2026-03-12T14:05:00.000Z',
    startedAt: '2026-03-12T14:01:00.000Z',
    finishedAt: '2026-03-12T14:05:00.000Z',
    attemptCount: 1,
    nextRetryAt: null,
    lastError: null,
    previewPath: 'source/.artifacts/source-01/preview.md'
  },
  {
    docId: 'source-02',
    originalFileName: 'budget-addendum-annex-a.pdf',
    fileType: 'pdf',
    status: 'replica_running',
    processingMode: 'deep',
    selected: true,
    queuedAt: '2026-03-12T14:08:00.000Z',
    updatedAt: '2026-03-12T14:09:00.000Z',
    startedAt: '2026-03-12T14:08:15.000Z',
    finishedAt: null,
    attemptCount: 1,
    nextRetryAt: null,
    lastError: null,
    previewPath: null
  },
  {
    docId: 'source-03',
    originalFileName: 'meeting-minutes-jan.pdf',
    fileType: 'pdf',
    status: 'preview_metadata_running',
    processingMode: 'standard',
    selected: false,
    queuedAt: '2026-03-12T14:10:00.000Z',
    updatedAt: '2026-03-12T14:12:00.000Z',
    startedAt: '2026-03-12T14:10:20.000Z',
    finishedAt: null,
    attemptCount: 2,
    nextRetryAt: null,
    lastError: null,
    previewPath: null
  },
  {
    docId: 'source-04',
    originalFileName: 'municipal-decree-scan.pdf',
    fileType: 'pdf',
    status: 'failed',
    processingMode: 'deep',
    selected: false,
    queuedAt: null,
    updatedAt: '2026-03-12T13:49:00.000Z',
    startedAt: '2026-03-12T13:45:00.000Z',
    finishedAt: '2026-03-12T13:49:00.000Z',
    attemptCount: 3,
    nextRetryAt: '2026-03-12T14:30:00.000Z',
    lastError: 'OCR provider timeout on chunk 07',
    previewPath: null
  },
  {
    docId: 'source-05',
    originalFileName: 'invoice-package-q4.pdf',
    fileType: 'pdf',
    status: 'not_processed',
    processingMode: 'standard',
    selected: false,
    queuedAt: null,
    updatedAt: '2026-03-12T13:20:00.000Z',
    startedAt: null,
    finishedAt: null,
    attemptCount: 0,
    nextRetryAt: null,
    lastError: null,
    previewPath: null
  }
]
