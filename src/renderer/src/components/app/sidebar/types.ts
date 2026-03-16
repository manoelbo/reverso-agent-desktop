export type ShellViewId =
  | "sources"
  | "leads"
  | "findings"
  | "allegations"
  | "dossier-people"
  | "dossier-groups"
  | "dossier-places"
  | "dossier-timeline"
  | "graph-view"
  | "model"
  | "preferences"

export type SidebarTreeNode = {
  name: string
  relativePath?: string
  files?: DossierSidebarFile[]
  subfolders?: SidebarTreeNode[]
}

export type DossierSidebarFile = {
  name: string
  title?: string
  fileName?: string
  relativePath: string
}

export type DossierSection = {
  id: Extract<ShellViewId, "dossier-people" | "dossier-groups" | "dossier-places" | "dossier-timeline">
  label: string
  files?: DossierSidebarFile[]
  subfolders?: SidebarTreeNode[]
}

export type DossierViewFilter =
  | {
      view: "dossier-groups"
      category?: string
    }
  | {
      view: "dossier-places"
      country?: string
      city?: string
      neighborhood?: string
    }
  | {
      view: "dossier-timeline"
      year?: string
      month?: string
    }
