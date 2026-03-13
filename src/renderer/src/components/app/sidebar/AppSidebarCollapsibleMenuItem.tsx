"use client"

import type { JSX } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, ArrowRight01Icon, Folder01Icon } from "@hugeicons/core-free-icons"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from "@/components/ui/sidebar"
import type { DossierSection, DossierSidebarFile, DossierViewFilter, ShellViewId, SidebarTreeNode } from "@/components/app/sidebar/types"

type AppSidebarCollapsibleMenuItemProps = {
  section: DossierSection
  activeView: ShellViewId
  onSelectView: (view: ShellViewId) => void
  onSelectDossierFilter: (filter: DossierViewFilter) => void
  onOpenDossierDocument: (relativePath: string) => void
}

type SidebarTreeNodeProps = {
  sectionId: DossierSection["id"]
  node: SidebarTreeNode
  path: string[]
  onSelectDossierFilter: (filter: DossierViewFilter) => void
  onOpenDossierDocument: (relativePath: string) => void
}

function SidebarFilesList({ files, onOpenDossierDocument }: { files: DossierSidebarFile[]; onOpenDossierDocument: (relativePath: string) => void }): JSX.Element {
  return (
    <SidebarMenuSub className="gap-0 py-0">
      {files.map((file) => (
        <SidebarMenuSubItem key={file.relativePath}>
          <SidebarMenuSubButton asChild className="h-6 w-full min-w-0 text-xs">
            <button type="button" className="w-full text-left py-0" onClick={() => onOpenDossierDocument(file.relativePath)}>
              <span className="truncate">{file.name}</span>
            </button>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      ))}
    </SidebarMenuSub>
  )
}

function toDossierFilter(sectionId: DossierSection["id"], folderPath: string[]): DossierViewFilter | null {
  if (sectionId === "dossier-places") {
    const [country, city, neighborhood] = folderPath
    return {
      view: "dossier-places",
      country,
      city,
      neighborhood,
    }
  }

  if (sectionId === "dossier-timeline") {
    const [year, month] = folderPath
    return {
      view: "dossier-timeline",
      year,
      month,
    }
  }

  return null
}

function SidebarTreeBranch({ sectionId, node, path, onSelectDossierFilter, onOpenDossierDocument }: SidebarTreeNodeProps): JSX.Element {
  const hasChildren = Boolean(node.subfolders?.length || node.files?.length)

  if (!hasChildren) {
    return <></>
  }

  return (
    <SidebarMenuSubItem key={node.name} className="w-full min-w-0">
      <Collapsible defaultOpen={false} className="group/sub">
        <CollapsibleTrigger asChild>
          <SidebarMenuSubButton asChild className="h-8 w-full min-w-0 text-sm">
            <button
              type="button"
              className="flex w-full min-w-0 items-center gap-2 py-0 text-left"
              onClick={() => {
                const filter = toDossierFilter(sectionId, [...path, node.name])
                if (filter) {
                  onSelectDossierFilter(filter)
                }
              }}
            >
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={14}
                strokeWidth={1.8}
                className="shrink-0 transition-transform group-data-[state=open]/sub:rotate-90"
              />
              <HugeiconsIcon icon={Folder01Icon} size={16} strokeWidth={1.8} className="shrink-0" />
              <span className="min-w-0 flex-1 truncate">{node.name}</span>
            </button>
          </SidebarMenuSubButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="gap-0 border-l border-sidebar-border py-0 pl-2 ml-1">
            {node.subfolders?.map((child) => (
              <SidebarTreeBranch
                key={child.name}
                sectionId={sectionId}
                node={child}
                path={[...path, node.name]}
                onSelectDossierFilter={onSelectDossierFilter}
                onOpenDossierDocument={onOpenDossierDocument}
              />
            ))}
            {node.files?.map((file) => (
              <SidebarMenuSubItem key={file.relativePath}>
                <SidebarMenuSubButton asChild className="h-6 w-full min-w-0 text-xs">
                  <button type="button" className="w-full text-left py-0" onClick={() => onOpenDossierDocument(file.relativePath)}>
                    <span className="truncate">{file.name}</span>
                  </button>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuSubItem>
  )
}

export function AppSidebarCollapsibleMenuItem({
  section,
  activeView,
  onSelectView,
  onSelectDossierFilter,
  onOpenDossierDocument,
}: AppSidebarCollapsibleMenuItemProps): JSX.Element {
  const handleOpenDossierDocument = (relativePath: string): void => {
    onSelectView(section.id)
    onOpenDossierDocument(relativePath)
  }

  return (
    <Collapsible defaultOpen={section.id === "dossier-people"} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton type="button" isActive={activeView === section.id} onClick={() => onSelectView(section.id)}>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={14}
              strokeWidth={1.8}
              className="shrink-0 transition-transform group-data-[state=open]/collapsible:hidden"
            />
            <HugeiconsIcon
              icon={ArrowDown01Icon}
              size={14}
              strokeWidth={1.8}
              className="hidden shrink-0 transition-transform group-data-[state=open]/collapsible:block"
            />
            <HugeiconsIcon icon={Folder01Icon} size={16} strokeWidth={1.8} />
            <span className="min-w-0 flex-1 truncate">{section.label}</span>
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {section.files ? <SidebarFilesList files={section.files} onOpenDossierDocument={handleOpenDossierDocument} /> : null}
          {section.subfolders ? (
            <SidebarMenuSub className="gap-0 py-0">
              {section.subfolders.map((folder) => (
                <SidebarTreeBranch
                  key={folder.name}
                  sectionId={section.id}
                  node={folder}
                  path={[]}
                  onSelectDossierFilter={onSelectDossierFilter}
                  onOpenDossierDocument={handleOpenDossierDocument}
                />
              ))}
            </SidebarMenuSub>
          ) : null}
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}
