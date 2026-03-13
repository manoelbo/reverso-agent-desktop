import React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { AppLayout } from "../../../../src/renderer/src/components/app/AppLayout"
import { AppSidebar, type ShellViewId } from "../../../../src/renderer/src/components/app/AppSidebar"
import { ChatPanel } from "../../../../src/renderer/src/components/app/ChatPanel"
import {
  peopleMarkdownExample,
  timelineMarkdownExample,
} from "../../../../src/renderer/src/components/app/markdown/examples"
import { ReversoMarkdown, type ReversoMarkdownVariant } from "../../../../src/renderer/src/components/app/markdown/ReversoMarkdown"
import type { DossierViewFilter } from "../../../../src/renderer/src/components/app/sidebar/types"
import {
  chatBusyConversation,
  chatLongConversation,
  chatShortConversation,
} from "../../../../src/renderer/src/components/app/chat/mock-data"
import { Badge } from "../../../../src/renderer/src/components/ui/badge"
import { ScrollArea } from "../../../../src/renderer/src/components/ui/scroll-area"
import { SidebarInset, SidebarProvider } from "../../../../src/renderer/src/components/ui/sidebar"
import { TooltipProvider } from "../../../../src/renderer/src/components/ui/tooltip"

const meta = {
  title: "screens/AppLayout",
  component: AppLayout,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AppLayout>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const RightSidebarClosed: Story = {
  args: {
    defaultRightOpen: false,
  },
}

export const CursorDenseConversation: Story = {
  args: {
    chatPanelProps: {
      surface: "cursor-dark",
      mode: "Agent",
      title: "Inspiracao para IDE com Electron",
      subtitle: "Sessao em andamento",
      items: chatLongConversation,
      composerState: "multiline",
    },
  },
}

export const NotionCalmConversation: Story = {
  args: {
    chatPanelProps: {
      surface: "notion-light",
      mode: "Plan",
      title: "Revisar tutorial Figma Mac",
      subtitle: "Workspace notes",
      items: chatShortConversation,
      composerState: "idle",
    },
  },
}

export const HybridBusyState: Story = {
  args: {
    chatPanelProps: {
      surface: "hybrid-reverso",
      mode: "Ask",
      title: "Markdown Interface",
      subtitle: "Agent running",
      items: chatBusyConversation,
      composerState: "focused",
    },
  },
}

type MarkdownShellShowcaseProps = {
  title: string
  subtitle: string
  variant: ReversoMarkdownVariant
  activeView: ShellViewId
  content: string
}

function MarkdownShellShowcase({
  title,
  subtitle,
  variant,
  activeView,
  content,
}: MarkdownShellShowcaseProps): React.JSX.Element {
  const sidebarStyle = {
    "--sidebar-width": "19rem",
    "--sidebar-top": "2.5rem",
  } as React.CSSProperties

  const resolveWikiLink = (value: string): string =>
    `/lab/agent/filesystem/dossier/${value.toLowerCase().replace(/\s+/g, "-")}.md`
  const noopSelectView = (_view: ShellViewId): void => {}
  const noopSelectDossierFilter = (_filter: DossierViewFilter): void => {}

  return (
    <TooltipProvider>
      <SidebarProvider open style={sidebarStyle}>
        <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
          <header className="relative z-30 flex h-10 shrink-0 items-center border-b border-border/60 px-3">
            <div className="pointer-events-none absolute inset-x-0 text-center text-sm font-medium text-foreground">
              Reverso Agent / Markdown in Shell
            </div>
          </header>

          <div className="flex min-h-0 flex-1 overflow-hidden">
            <AppSidebar
              activeView={activeView}
              onSelectView={noopSelectView}
              onSelectDossierFilter={noopSelectDossierFilter}
            />

            <SidebarInset className="flex min-w-0 flex-1 flex-col">
              <section className="flex min-h-0 flex-1 flex-col bg-background">
                <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 px-4">
                  <div className="min-w-0 space-y-0.5">
                    <p className="truncate text-sm font-semibold text-foreground">{title}</p>
                    <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
                  </div>
                  <Badge variant="secondary">{variant}</Badge>
                </header>

                <ScrollArea className="flex-1">
                  <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col gap-4 px-6 py-6">
                    <ReversoMarkdown content={content} variant={variant} wikiLinkResolver={resolveWikiLink} />
                  </div>
                </ScrollArea>
              </section>
            </SidebarInset>

            <ChatPanel />
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}

export const ShellMarkdownEditorial: Story = {
  render: () => (
    <MarkdownShellShowcase
      title="Dossier / People"
      subtitle="Contexto real de shell com sidebars para avaliar legibilidade."
      variant="editorial"
      activeView="dossier-people"
      content={peopleMarkdownExample}
    />
  ),
}

export const ShellMarkdownEvidence: Story = {
  render: () => (
    <MarkdownShellShowcase
      title="Dossier / Timeline"
      subtitle="Contexto real de shell para validar blocos :::event."
      variant="evidence"
      activeView="dossier-timeline"
      content={timelineMarkdownExample}
    />
  ),
}
