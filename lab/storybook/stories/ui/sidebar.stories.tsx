import React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { House, MagnifyingGlass, Sliders } from "@phosphor-icons/react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"

const meta = {
  title: "ui/Sidebar",
  component: Sidebar,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof Sidebar>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  render: () => (
    <SidebarProvider>
      <div className="flex h-screen w-screen">
        <Sidebar collapsible="offcanvas">
          <SidebarHeader className="border-b border-sidebar-border/60">
            <p className="text-sm font-semibold">Reverso Agent</p>
            <p className="text-xs text-muted-foreground">Storybook Lab</p>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Investigation Desk</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive>
                      <House />
                      <span>Sources</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <MagnifyingGlass />
                      <span>Leads</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Sliders />
                      <span>Settings</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="p-6">
          <div className="rounded-lg border border-border/60 bg-card/70 p-4 text-sm text-muted-foreground">
            Área central para validar integração com `SidebarInset`.
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  ),
}
