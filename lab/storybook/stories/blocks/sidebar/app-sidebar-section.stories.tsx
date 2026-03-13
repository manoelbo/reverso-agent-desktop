import React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { FileUploadIcon, MapsSearchIcon } from "@hugeicons/core-free-icons"

import { AppSidebarMenuItem } from "@/components/app/sidebar/AppSidebarMenuItem"
import { AppSidebarSection } from "@/components/app/sidebar/AppSidebarSection"
import { Sidebar, SidebarContent, SidebarProvider } from "@/components/ui/sidebar"

const meta = {
  title: "blocks/sidebar/AppSidebarSection",
  component: AppSidebarSection,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AppSidebarSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <SidebarProvider>
      <div className="h-screen w-[320px] bg-background">
        <Sidebar collapsible="none">
          <SidebarContent className="px-2 py-3">
            <AppSidebarSection label="Investigation Desk">
              <AppSidebarMenuItem
                label="Sources"
                icon={FileUploadIcon}
                active
                onClick={() => undefined}
              />
              <AppSidebarMenuItem
                label="Leads"
                icon={MapsSearchIcon}
                active={false}
                onClick={() => undefined}
              />
            </AppSidebarSection>
          </SidebarContent>
        </Sidebar>
      </div>
    </SidebarProvider>
  ),
}
