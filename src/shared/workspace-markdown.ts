export type DossierSectionKey = 'people' | 'groups' | 'places' | 'timeline'

export type DossierFileItem = {
  section: DossierSectionKey
  relativePath: string
  fileName: string
  fileStem: string
  title: string
  folderPath: string[]
  updatedAt: string
  sizeBytes: number
}

export type DossierTreeNode = {
  name: string
  relativePath: string
  files: DossierFileItem[]
  subfolders: DossierTreeNode[]
}

export type DossierSectionIndex = {
  section: DossierSectionKey
  label: string
  files: DossierFileItem[]
  tree: DossierTreeNode[]
}

export type DossierIndexPayload = {
  rootPath: string
  generatedAt: string
  sections: Record<DossierSectionKey, DossierSectionIndex>
  allFiles: DossierFileItem[]
}

export type DossierDocumentPayload = {
  relativePath: string
  title: string
  content: string
  updatedAt: string
  sizeBytes: number
}

export type DossierChangeEvent =
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

export const WORKSPACE_MARKDOWN_CHANNELS = {
  listDossierIndex: 'workspace-markdown:list-dossier-index',
  readDossierDocument: 'workspace-markdown:read-dossier-document',
  dossierChanged: 'workspace-markdown:dossier-changed',
} as const

export interface WorkspaceMarkdownApi {
  listDossierIndex: () => Promise<DossierIndexPayload>
  readDossierDocument: (relativePath: string) => Promise<DossierDocumentPayload>
  subscribeDossierChanges: (listener: (event: DossierChangeEvent) => void) => () => void
}
