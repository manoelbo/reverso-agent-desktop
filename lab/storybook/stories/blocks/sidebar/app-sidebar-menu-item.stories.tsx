import React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { FileUploadIcon } from "@hugeicons/core-free-icons"

import { AppSidebarMenuItem } from "@/components/app/sidebar/AppSidebarMenuItem"
import { Sidebar, SidebarContent, SidebarProvider } from "@/components/ui/sidebar"

const meta = {
  title: "blocks/sidebar/AppSidebarMenuItem",
  component: AppSidebarMenuItem,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AppSidebarMenuItem>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <SidebarProvider>
      <div className="h-screen w-[320px] bg-background">
        <Sidebar collapsible="none">
          <SidebarContent className="px-2 py-3">
            <AppSidebarMenuItem
              label="Sources"
              icon={FileUploadIcon}
              active
              onClick={() => undefined}
            />
          </SidebarContent>
        </Sidebar>
      </div>
    </SidebarProvider>
  ),
}

export const Inactive: Story = {
  render: () => (
    <SidebarProvider>
      <div className="h-screen w-[320px] bg-background">
        <Sidebar collapsible="none">
          <SidebarContent className="px-2 py-3">
            <AppSidebarMenuItem
              label="Sources"
              icon={FileUploadIcon}
              active={false}
              onClick={() => undefined}
            />
          </SidebarContent>
        </Sidebar>
      </div>
    </SidebarProvider>
  ),
}
