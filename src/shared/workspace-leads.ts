export type LeadStatus =
  | 'planned'
  | 'in_progress'
  | 'done'
  | 'blocked'
  | 'unknown'

export type LeadFileItem = {
  relativePath: string
  fileName: string
  fileStem: string
  folderPath: string[]
  slug: string
  title: string
  status: LeadStatus
  allegationsCount: number | null
  findingsCount: number | null
  updatedAt: string
  sizeBytes: number
}

export type LeadTreeNode = {
  name: string
  relativePath: string
  files: LeadFileItem[]
  subfolders: LeadTreeNode[]
}

export type LeadsIndexPayload = {
  rootPath: string
  generatedAt: string
  files: LeadFileItem[]
  tree: LeadTreeNode[]
}

export type LeadDocumentPayload = {
  relativePath: string
  title: string
  content: string
  updatedAt: string
  sizeBytes: number
}

export type LeadChangeEvent =
  | {
      kind: 'changed'
      relativePath: string
      timestamp: string
    }
  | {
      kind: 'deleted'
      relativePath: string
      timestamp: string
    }
  | {
      kind: 'renamed'
      oldRelativePath: string
      newRelativePath: string
      timestamp: string
    }

export const WORKSPACE_LEADS_CHANNELS = {
  listLeadsIndex: 'workspace-leads:list-leads-index',
  readLeadDocument: 'workspace-leads:read-lead-document',
  leadsChanged: 'workspace-leads:leads-changed',
} as const

export interface WorkspaceLeadsApi {
  listLeadsIndex: () => Promise<LeadsIndexPayload>
  readLeadDocument: (relativePath: string) => Promise<LeadDocumentPayload>
  subscribeLeadsChanges: (listener: (event: LeadChangeEvent) => void) => () => void
}
