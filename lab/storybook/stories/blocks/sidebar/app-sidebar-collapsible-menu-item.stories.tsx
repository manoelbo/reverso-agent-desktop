import React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, ArrowRight01Icon, Folder01Icon } from "@hugeicons/core-free-icons"

import { AppSidebarCollapsibleMenuItem } from "@/components/app/sidebar/AppSidebarCollapsibleMenuItem"
import type { DossierSection } from "@/components/app/sidebar/types"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Sidebar, SidebarContent, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarProvider } from "@/components/ui/sidebar"

const dossierPeople: DossierSection = {
  id: "dossier-people",
  label: "People",
  files: ["andre-santos.md", "ana-de-fatima-alves-ruivo.md"],
}

const dossierPlaces: DossierSection = {
  id: "dossier-places",
  label: "Places",
  subfolders: [
    {
      name: "Brasil",
      subfolders: [
        {
          name: "São Paulo",
          files: ["rua-pedro-messias.md", "av-regente-feijo-944.md"],
        },
      ],
    },
  ],
}

const meta = {
  title: "blocks/sidebar/AppSidebarCollapsibleMenuItem",
  component: AppSidebarCollapsibleMenuItem,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AppSidebarCollapsibleMenuItem>

export default meta
type Story = StoryObj<typeof meta>

function ItemFrame({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="h-screen w-[320px] bg-background">
        <Sidebar collapsible="none">
          <SidebarContent className="px-2 py-3">{children}</SidebarContent>
        </Sidebar>
      </div>
    </SidebarProvider>
  )
}

export const Variant1CurrentFiles: Story = {
  render: () => (
    <ItemFrame>
      <AppSidebarCollapsibleMenuItem
        section={dossierPeople}
        activeView="dossier-people"
        onSelectView={() => undefined}
        onSelectDossierFilter={() => undefined}
      />
    </ItemFrame>
  ),
}

export const Variant2NestedFolders: Story = {
  render: () => (
    <ItemFrame>
      <AppSidebarCollapsibleMenuItem
        section={dossierPlaces}
        activeView="dossier-places"
        onSelectView={() => undefined}
        onSelectDossierFilter={() => undefined}
      />
    </ItemFrame>
  ),
}

export const Variant3WithBadge: Story = {
  render: () => (
    <ItemFrame>
      <Collapsible defaultOpen className="group/collapsible">
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton type="button" isActive>
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
              <span className="min-w-0 flex-1 truncate">People</span>
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                24
              </Badge>
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub className="gap-0 py-0">
              {["andre-santos.md", "ana-de-fatima.md", "milena-borges.md"].map((file) => (
                <SidebarMenuSubItem key={file}>
                  <SidebarMenuSubButton asChild className="h-6 w-full min-w-0 text-xs">
                    <button type="button" className="w-full text-left py-0">
                      <span className="truncate">{file}</span>
                    </button>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    </ItemFrame>
  ),
}

export const Variant4Compact: Story = {
  render: () => (
    <ItemFrame>
      <Collapsible defaultOpen={false} className="group/collapsible">
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton type="button" size="sm">
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={12}
                strokeWidth={2}
                className="shrink-0 transition-transform group-data-[state=open]/collapsible:rotate-90"
              />
              <span className="min-w-0 flex-1 truncate text-xs uppercase tracking-[0.16em]">Timeline</span>
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub className="gap-0 py-0">
              {["2023-12.md", "2023-11.md", "2023-10.md"].map((file) => (
                <SidebarMenuSubItem key={file}>
                  <SidebarMenuSubButton asChild className="h-6 w-full min-w-0 text-xs">
                    <button type="button" className="w-full text-left py-0">
                      <span className="truncate">{file}</span>
                    </button>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    </ItemFrame>
  ),
}

export const Variant5DeepTree: Story = {
  render: () => (
    <ItemFrame>
      <AppSidebarCollapsibleMenuItem
        section={{
          id: "dossier-places",
          label: "Places",
          subfolders: [
            {
              name: "Brasil",
              subfolders: [
                {
                  name: "São Paulo",
                  subfolders: [
                    {
                      name: "Aricanduva",
                      files: ["rua-da-meacao-197.md", "av-regente-feijo-944.md"],
                    },
                  ],
                },
              ],
            },
          ],
        }}
        activeView="dossier-places"
        onSelectView={() => undefined}
        onSelectDossierFilter={() => undefined}
      />
    </ItemFrame>
  ),
}

export const Default = Variant1CurrentFiles
