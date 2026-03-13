import React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import type { CSSProperties } from "react"
import { useState } from "react"
import { AppSidebar, type ShellViewId } from "@/components/app/AppSidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

const viewOptions: ShellViewId[] = [
  "sources",
  "leads",
  "findings",
  "allegations",
  "dossier-people",
  "dossier-groups",
  "dossier-places",
  "dossier-timeline",
  "graph-view",
  "model",
  "preferences",
]

const meta = {
  title: "blocks/AppSidebar",
  component: AppSidebar,
  args: {
    activeView: "sources" as ShellViewId,
  },
  argTypes: {
    activeView: {
      control: "select",
      options: viewOptions,
    },
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AppSidebar>

export default meta
type Story = StoryObj<typeof meta>

export const Interactive: Story = {
  render: ({ activeView }) => {
    const [currentView, setCurrentView] = useState<ShellViewId>(activeView)

    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "19rem",
            "--sidebar-top": "0px",
          } as CSSProperties
        }
      >
        <div className="flex h-screen w-[19rem] bg-background">
          <AppSidebar activeView={currentView} onSelectView={setCurrentView} onSelectDossierFilter={() => undefined} />
        </div>
      </SidebarProvider>
    )
  },
}
