"use client"

import type { JSX } from "react"
import type { IconSvgElement } from "@hugeicons/react"
import {
  AlertSquareIcon,
  AnchorPointIcon,
  BookCheckIcon,
  FileUploadIcon,
  MapsSearchIcon,
  PreferenceHorizontalIcon,
  RoboticIcon,
} from "@hugeicons/core-free-icons"

import { AppSidebarCollapsibleMenuItem } from "@/components/app/sidebar/AppSidebarCollapsibleMenuItem"
import { AppSidebarFooter } from "@/components/app/sidebar/AppSidebarFooter"
import { AppSidebarHeader } from "@/components/app/sidebar/AppSidebarHeader"
import { AppSidebarMenuItem } from "@/components/app/sidebar/AppSidebarMenuItem"
import { AppSidebarSection } from "@/components/app/sidebar/AppSidebarSection"
import type { DossierSection, DossierViewFilter, ShellViewId, SidebarTreeNode } from "@/components/app/sidebar/types"
import type { DossierIndexPayload, DossierSectionKey, DossierTreeNode } from "../../../../shared/workspace-markdown"
import {
  Sidebar,
  SidebarContent,
} from "@/components/ui/sidebar"

export type { ShellViewId } from "@/components/app/sidebar/types"

type AppSidebarProps = {
  activeView: ShellViewId
  dossierIndex: DossierIndexPayload | null
  onSelectView: (view: ShellViewId) => void
  onSelectDossierFilter: (filter: DossierViewFilter) => void
  onOpenDossierDocument: (relativePath: string) => void
}

const investigationItems: {
  id: ShellViewId
  label: string
  icon: IconSvgElement
}[] = [
    { id: "sources", label: "Sources", icon: FileUploadIcon },
    { id: "leads", label: "Leads", icon: MapsSearchIcon },
    { id: "findings", label: "Findings", icon: BookCheckIcon },
    { id: "allegations", label: "Allegations", icon: AlertSquareIcon },
  ]

const sectionToView: Record<DossierSectionKey, DossierSection["id"]> = {
  people: "dossier-people",
  groups: "dossier-groups",
  places: "dossier-places",
  timeline: "dossier-timeline",
}

function toSidebarNode(node: DossierTreeNode): SidebarTreeNode {
  return {
    name: node.name,
    relativePath: node.relativePath,
    files: node.files.map((file) => ({ name: file.fileName, relativePath: file.relativePath })),
    subfolders: node.subfolders.map((child) => toSidebarNode(child)),
  }
}

function buildDossierSections(index: DossierIndexPayload | null): DossierSection[] {
  if (!index) {
    return []
  }

  return (Object.keys(sectionToView) as DossierSectionKey[]).map((sectionKey) => {
    const section = index.sections[sectionKey]
    return {
      id: sectionToView[sectionKey],
      label: section.label,
      files: section.files
        .filter((file) => file.folderPath.length === 1)
        .map((file) => ({ name: file.fileName, relativePath: file.relativePath })),
      subfolders: section.tree.map((node) => toSidebarNode(node)),
    }
  })
}

export function AppSidebar({ activeView, dossierIndex, onSelectView, onSelectDossierFilter, onOpenDossierDocument }: AppSidebarProps): JSX.Element {
  const dossierSections = buildDossierSections(dossierIndex)

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border/60">
      <AppSidebarHeader />

      <SidebarContent className="gap-0">
        <AppSidebarSection label="Investigation Desk">
          {investigationItems.map((item) => (
            <AppSidebarMenuItem
              key={item.id}
              label={item.label}
              icon={item.icon}
              active={activeView === item.id}
              onClick={() => onSelectView(item.id)}
            />
          ))}
        </AppSidebarSection>

        <AppSidebarSection label="Dossier">
          <AppSidebarMenuItem
            label="Graph View"
            icon={AnchorPointIcon}
            active={activeView === "graph-view"}
            onClick={() => onSelectView("graph-view")}
          />
          {dossierSections.map((section) => (
            <AppSidebarCollapsibleMenuItem
              key={section.id}
              section={section}
              activeView={activeView}
              onSelectView={onSelectView}
              onSelectDossierFilter={onSelectDossierFilter}
              onOpenDossierDocument={onOpenDossierDocument}
            />
          ))}
        </AppSidebarSection>

        <AppSidebarSection label="Settings">
          <AppSidebarMenuItem
            label="Model"
            icon={RoboticIcon}
            active={activeView === "model"}
            onClick={() => onSelectView("model")}
          />
          <AppSidebarMenuItem
            label="Preferences"
            icon={PreferenceHorizontalIcon}
            active={activeView === "preferences"}
            onClick={() => onSelectView("preferences")}
          />
        </AppSidebarSection>
      </SidebarContent>

      <AppSidebarFooter />
    </Sidebar>
  )
}
