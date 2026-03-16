export type InvestigationDocumentKind = "allegation" | "finding"

export type AllegationFileItem = {
  kind: "allegation"
  relativePath: string
  fileName: string
  fileStem: string
  id: string
  title: string
  leadSlug: string | null
  findingIds: string[]
  updatedAt: string
  sizeBytes: number
}

export type FindingFileItem = {
  kind: "finding"
  relativePath: string
  fileName: string
  fileStem: string
  id: string
  title: string
  leadSlug: string | null
  allegationIds: string[]
  evidenceSourceIds: string[]
  status: string | null
  updatedAt: string
  sizeBytes: number
}

export type InvestigationFileItem = AllegationFileItem | FindingFileItem

export type InvestigationIndexPayload = {
  rootPath: string
  generatedAt: string
  allegations: AllegationFileItem[]
  findings: FindingFileItem[]
}

export type InvestigationDocumentPayload = {
  kind: InvestigationDocumentKind
  relativePath: string
  title: string
  content: string
  updatedAt: string
  sizeBytes: number
}

export type InvestigationChangeEvent =
  | {
      kind: "changed"
      documentKind: InvestigationDocumentKind
      relativePath: string
      timestamp: string
    }
  | {
      kind: "deleted"
      documentKind: InvestigationDocumentKind
      relativePath: string
      timestamp: string
    }
  | {
      kind: "renamed"
      documentKind: InvestigationDocumentKind
      oldRelativePath: string
      newRelativePath: string
      timestamp: string
    }

export const WORKSPACE_INVESTIGATION_CHANNELS = {
  listInvestigationIndex: "workspace-investigation:list-investigation-index",
  readInvestigationDocument: "workspace-investigation:read-investigation-document",
  investigationChanged: "workspace-investigation:investigation-changed",
} as const

export interface WorkspaceInvestigationApi {
  listInvestigationIndex: () => Promise<InvestigationIndexPayload>
  readInvestigationDocument: (
    documentKind: InvestigationDocumentKind,
    relativePath: string
  ) => Promise<InvestigationDocumentPayload>
  subscribeInvestigationChanges: (listener: (event: InvestigationChangeEvent) => void) => () => void
}
