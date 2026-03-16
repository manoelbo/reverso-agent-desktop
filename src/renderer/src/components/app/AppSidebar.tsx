"use client"

import type { JSX } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
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
import { toDisplayDocumentName } from "@/components/app/dossier/types"
import type { DossierIndexPayload, DossierSectionKey, DossierTreeNode } from "../../../../shared/workspace-markdown"
import type { LeadFileItem, LeadTreeNode, LeadsIndexPayload } from "../../../../shared/workspace-leads"
import type { AllegationFileItem, FindingFileItem, InvestigationIndexPayload } from "../../../../shared/workspace-investigation"
import type { SourcesIndexPayload } from "../../../../shared/workspace-sources"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export type { ShellViewId } from "@/components/app/sidebar/types"

type AppSidebarProps = {
  activeView: ShellViewId
  dossierIndex: DossierIndexPayload | null
  leadsIndex: LeadsIndexPayload | null
  investigationIndex: InvestigationIndexPayload | null
  sourcesIndex: SourcesIndexPayload | null
  onSelectView: (view: ShellViewId) => void
  onSelectDossierFilter: (filter: DossierViewFilter) => void
  onOpenDossierDocument: (relativePath: string) => void
  onOpenLeadDocument: (relativePath: string) => void
  onOpenFindingDocument: (relativePath: string) => void
  onOpenAllegationDocument: (relativePath: string) => void
  onOpenSourceDocument: (relativePath: string) => void
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
    files: node.files.map((file) => ({
      name: toDisplayDocumentName(file),
      title: file.title,
      fileName: file.fileName,
      relativePath: file.relativePath,
    })),
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
        .map((file) => ({
          name: toDisplayDocumentName(file),
          title: file.title,
          fileName: file.fileName,
          relativePath: file.relativePath,
        })),
      subfolders: section.tree.map((node) => toSidebarNode(node)),
    }
  })
}

function renderLeadFiles(
  files: LeadFileItem[],
  onOpenLeadDocument: (relativePath: string) => void
): JSX.Element[] {
  return files.map((file) => (
    <SidebarMenuSubItem key={file.relativePath}>
      <SidebarMenuSubButton asChild className="h-6 w-full min-w-0 text-xs">
        <button type="button" className="w-full py-0 text-left" onClick={() => onOpenLeadDocument(file.relativePath)}>
          <span className="truncate">{file.slug ? `lead-${file.slug}` : file.fileStem}</span>
        </button>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  ))
}

function renderLeadFolderNodes(
  nodes: LeadTreeNode[],
  onOpenLeadDocument: (relativePath: string) => void
): JSX.Element[] {
  return nodes
    .filter((node) => Boolean(node.name))
    .map((node) => (
      <SidebarMenuSubItem key={node.relativePath || node.name} className="w-full min-w-0">
        <Collapsible defaultOpen={false} className="group/leads-tree">
          <CollapsibleTrigger asChild>
            <SidebarMenuSubButton asChild className="h-8 w-full min-w-0 text-sm">
              <button type="button" className="flex w-full min-w-0 items-center gap-2 py-0 text-left">
                <span className="min-w-0 flex-1 truncate">{node.name}</span>
              </button>
            </SidebarMenuSubButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub className="gap-0 border-l border-sidebar-border py-0 pl-2 ml-1">
              {renderLeadFiles(node.files, onOpenLeadDocument)}
              {renderLeadFolderNodes(node.subfolders, onOpenLeadDocument)}
            </SidebarMenuSub>
          </CollapsibleContent>
        </Collapsible>
      </SidebarMenuSubItem>
    ))
}

function renderInvestigationFiles(
  files: Array<AllegationFileItem | FindingFileItem>,
  onOpenDocument: (relativePath: string) => void
): JSX.Element[] {
  const toSlug = (value: string): string =>
    value
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")

  return files.map((file) => (
    <SidebarMenuSubItem key={file.relativePath}>
      <SidebarMenuSubButton asChild className="h-6 w-full min-w-0 text-xs">
        <button type="button" className="w-full py-0 text-left" onClick={() => onOpenDocument(file.relativePath)}>
          <span className="truncate">{toSlug(file.title) || file.id || file.fileStem}</span>
        </button>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  ))
}

export function AppSidebar({
  activeView,
  dossierIndex,
  leadsIndex,
  investigationIndex,
  sourcesIndex,
  onSelectView,
  onSelectDossierFilter,
  onOpenDossierDocument,
  onOpenLeadDocument,
  onOpenFindingDocument,
  onOpenAllegationDocument,
  onOpenSourceDocument,
}: AppSidebarProps): JSX.Element {
  const dossierSections = buildDossierSections(dossierIndex)
  const sourcePreviews = sourcesIndex?.previews ?? []
  const leadTree = leadsIndex?.tree ?? []
  const leadRoot = leadTree.find((node) => node.name === "")
  const leadRootFiles = leadRoot?.files ?? []
  const leadFolders = leadRoot ? leadRoot.subfolders : leadTree
  const findingFiles = investigationIndex?.findings ?? []
  const allegationFiles = investigationIndex?.allegations ?? []

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border/60">
      <AppSidebarHeader />

      <SidebarContent className="gap-0">
        <AppSidebarSection label="Investigation Desk">
          {investigationItems.map((item) =>
            item.id === "sources" ? (
              <SidebarMenuItem key={item.id}>
                <Collapsible defaultOpen={activeView === "sources"} className="group/sources-collapsible">
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton type="button" isActive={activeView === "sources"} onClick={() => onSelectView("sources")}>
                      <HugeiconsIcon icon={FileUploadIcon} size={16} strokeWidth={1.8} />
                      <span className="min-w-0 flex-1 truncate">Sources</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="gap-0 py-0">
                      {sourcePreviews.length ? (
                        sourcePreviews.map((preview) => (
                          <SidebarMenuSubItem key={preview.relativePath}>
                            <SidebarMenuSubButton asChild className="h-6 w-full min-w-0 text-xs">
                              <button
                                type="button"
                                className="w-full py-0 text-left"
                                onClick={() => {
                                  onSelectView("sources")
                                  onOpenSourceDocument(preview.relativePath)
                                }}
                              >
                                <span className="truncate">{preview.fileName}</span>
                              </button>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))
                      ) : (
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton className="h-6 w-full min-w-0 text-xs text-muted-foreground">
                            Nenhum preview
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            ) : item.id === "leads" ? (
              <SidebarMenuItem key={item.id}>
                <Collapsible defaultOpen={activeView === "leads"} className="group/leads-collapsible">
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton type="button" isActive={activeView === "leads"} onClick={() => onSelectView("leads")}>
                      <HugeiconsIcon icon={MapsSearchIcon} size={16} strokeWidth={1.8} />
                      <span className="min-w-0 flex-1 truncate">Leads</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="gap-0 py-0">
                      {leadTree.length ? (
                        <>
                          {renderLeadFiles(leadRootFiles, (relativePath) => {
                            onSelectView("leads")
                            onOpenLeadDocument(relativePath)
                          })}
                          {renderLeadFolderNodes(leadFolders, (relativePath) => {
                            onSelectView("leads")
                            onOpenLeadDocument(relativePath)
                          })}
                        </>
                      ) : (
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton className="h-6 w-full min-w-0 text-xs text-muted-foreground">
                            No leads
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            ) : item.id === "findings" ? (
              <SidebarMenuItem key={item.id}>
                <Collapsible defaultOpen={activeView === "findings"} className="group/findings-collapsible">
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton type="button" isActive={activeView === "findings"} onClick={() => onSelectView("findings")}>
                      <HugeiconsIcon icon={BookCheckIcon} size={16} strokeWidth={1.8} />
                      <span className="min-w-0 flex-1 truncate">Findings</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="gap-0 py-0">
                      {findingFiles.length ? (
                        renderInvestigationFiles(findingFiles, (relativePath) => {
                          onSelectView("findings")
                          onOpenFindingDocument(relativePath)
                        })
                      ) : (
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton className="h-6 w-full min-w-0 text-xs text-muted-foreground">
                            No findings
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            ) : item.id === "allegations" ? (
              <SidebarMenuItem key={item.id}>
                <Collapsible defaultOpen={activeView === "allegations"} className="group/allegations-collapsible">
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      type="button"
                      isActive={activeView === "allegations"}
                      onClick={() => onSelectView("allegations")}
                    >
                      <HugeiconsIcon icon={AlertSquareIcon} size={16} strokeWidth={1.8} />
                      <span className="min-w-0 flex-1 truncate">Allegations</span>
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="gap-0 py-0">
                      {allegationFiles.length ? (
                        renderInvestigationFiles(allegationFiles, (relativePath) => {
                          onSelectView("allegations")
                          onOpenAllegationDocument(relativePath)
                        })
                      ) : (
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton className="h-6 w-full min-w-0 text-xs text-muted-foreground">
                            No allegations
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            ) : (
              <AppSidebarMenuItem
                key={item.id}
                label={item.label}
                icon={item.icon}
                active={activeView === item.id}
                onClick={() => onSelectView(item.id)}
              />
            )
          )}
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
