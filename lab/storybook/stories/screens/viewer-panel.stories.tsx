import React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { AppSidebar, type ShellViewId } from "../../../../src/renderer/src/components/app/AppSidebar"
import { ChatPanel } from "../../../../src/renderer/src/components/app/ChatPanel"
import {
  peopleMarkdownExample,
  sourceArtifactMarkdownExample,
  timelineMarkdownExample,
} from "../../../../src/renderer/src/components/app/markdown/examples"
import { ReversoMarkdown, type ReversoMarkdownVariant } from "../../../../src/renderer/src/components/app/markdown/ReversoMarkdown"
import type { DossierViewFilter } from "../../../../src/renderer/src/components/app/sidebar/types"
import { ViewerPanel } from "../../../../src/renderer/src/components/app/ViewerPanel"
import { Badge } from "../../../../src/renderer/src/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../../../../src/renderer/src/components/ui/breadcrumb"
import { ScrollArea } from "../../../../src/renderer/src/components/ui/scroll-area"
import { SidebarInset, SidebarProvider } from "../../../../src/renderer/src/components/ui/sidebar"
import { TooltipProvider } from "../../../../src/renderer/src/components/ui/tooltip"
import { GroupsPageHeader, GroupsTableShell } from "../blocks/dossier/groups/groups-components"
import { groupsRowsMock } from "../blocks/dossier/groups/groups-mocks"
import { PeoplePageHeader, PeopleTableShell } from "../blocks/dossier/people/people-components"
import { peopleRowsMock } from "../blocks/dossier/people/people-mocks"
import { PlacesPageHeader, PlacesTableShell } from "../blocks/dossier/places/places-components"
import { placesRowsMock } from "../blocks/dossier/places/places-mocks"
import { TimelinePageHeader, TimelineTableShell } from "../blocks/dossier/timeline/timeline-components"
import { timelineRowsMock } from "../blocks/dossier/timeline/timeline-mocks"

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
  title: "screens/ViewerPanel",
  component: ViewerPanel,
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
  decorators: [
    (Story) => (
      <div className="viewer-panel-source-wide">
        <style>{`
          .viewer-panel-source-wide .max-w-6xl {
            max-width: 92rem;
          }
        `}</style>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ViewerPanel>

export default meta
type Story = StoryObj<typeof meta>

export const SourceViewPanel: Story = {
  args: {
    activeView: "sources",
  },
}

function DossierPeopleViewerPanelMock(): React.JSX.Element {
  return (
    <section className="flex min-h-0 flex-1 flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 px-4 transition-[width,height] ease-linear">
        <div className="flex min-w-0 items-center gap-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="min-w-0">
                <span>Desk Title</span>
                <BreadcrumbSeparator />
              </BreadcrumbItem>
              <BreadcrumbItem className="min-w-0">
                <span>Dossier</span>
                <BreadcrumbSeparator />
              </BreadcrumbItem>
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="truncate">People</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="mx-auto flex min-h-full w-full max-w-368 flex-col gap-4 px-6 py-6">
          <PeoplePageHeader title="People" subtitle="Track entities, mentions, and dossier links in one place." />
          <PeopleTableShell rows={peopleRowsMock} />
        </div>
      </ScrollArea>
    </section>
  )
}

export const DossierPeopleViewPanelMock: Story = {
  render: () => <DossierPeopleViewerPanelMock />,
}

function DossierGroupsViewerPanelMock(): React.JSX.Element {
  return (
    <section className="flex min-h-0 flex-1 flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 px-4 transition-[width,height] ease-linear">
        <div className="flex min-w-0 items-center gap-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="min-w-0">
                <span>Desk Title</span>
                <BreadcrumbSeparator />
              </BreadcrumbItem>
              <BreadcrumbItem className="min-w-0">
                <span>Dossier</span>
                <BreadcrumbSeparator />
              </BreadcrumbItem>
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="truncate">Groups</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="mx-auto flex min-h-full w-full max-w-368 flex-col gap-4 px-6 py-6">
          <GroupsPageHeader title="Groups" subtitle="Track organizations, institutions, and group-level links." />
          <GroupsTableShell rows={groupsRowsMock} />
        </div>
      </ScrollArea>
    </section>
  )
}

export const DossierGroupsViewPanelMock: Story = {
  render: () => <DossierGroupsViewerPanelMock />,
}

function DossierPlacesViewerPanelMock(): React.JSX.Element {
  return (
    <section className="flex min-h-0 flex-1 flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 px-4 transition-[width,height] ease-linear">
        <div className="flex min-w-0 items-center gap-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="min-w-0">
                <span>Desk Title</span>
                <BreadcrumbSeparator />
              </BreadcrumbItem>
              <BreadcrumbItem className="min-w-0">
                <span>Dossier</span>
                <BreadcrumbSeparator />
              </BreadcrumbItem>
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="truncate">Places</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="mx-auto flex min-h-full w-full max-w-368 flex-col gap-4 px-6 py-6">
          <PlacesPageHeader title="Places" subtitle="Browse final place files and filter by folder hierarchy." />
          <PlacesTableShell rows={placesRowsMock} />
        </div>
      </ScrollArea>
    </section>
  )
}

export const DossierPlacesViewPanelMock: Story = {
  render: () => <DossierPlacesViewerPanelMock />,
}

function DossierTimelineViewerPanelMock(): React.JSX.Element {
  return (
    <section className="flex min-h-0 flex-1 flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 px-4 transition-[width,height] ease-linear">
        <div className="flex min-w-0 items-center gap-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="min-w-0">
                <span>Desk Title</span>
                <BreadcrumbSeparator />
              </BreadcrumbItem>
              <BreadcrumbItem className="min-w-0">
                <span>Dossier</span>
                <BreadcrumbSeparator />
              </BreadcrumbItem>
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage className="truncate">Timeline</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="mx-auto flex min-h-full w-full max-w-368 flex-col gap-4 px-6 py-6">
          <TimelinePageHeader title="Timeline" subtitle="Follow chronology by year and month using folder filters." />
          <TimelineTableShell rows={timelineRowsMock} />
        </div>
      </ScrollArea>
    </section>
  )
}

export const DossierTimelineViewPanelMock: Story = {
  render: () => <DossierTimelineViewerPanelMock />,
}

type MarkdownShellPreviewProps = {
  title: string
  subtitle: string
  content: string
  variant: ReversoMarkdownVariant
  activeView: ShellViewId
}

function MarkdownShellPreview({
  title,
  subtitle,
  content,
  variant,
  activeView,
}: MarkdownShellPreviewProps): React.JSX.Element {
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
              Reverso Agent / Markdown Preview
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

export const MarkdownInsideShellEditorial: Story = {
  render: () => (
    <MarkdownShellPreview
      title="ViewerPanel / Dossier People (Markdown variant)"
      subtitle="Preview no shell completo com sidebars esquerda e direita."
      content={peopleMarkdownExample}
      variant="editorial"
      activeView="dossier-people"
    />
  ),
}

export const MarkdownInsideShellEvidence: Story = {
  render: () => (
    <MarkdownShellPreview
      title="ViewerPanel / Timeline Event Cards"
      subtitle="Valida destaque de :::event no fluxo visual de dossie."
      content={timelineMarkdownExample}
      variant="evidence"
      activeView="dossier-timeline"
    />
  ),
}

export const MarkdownInsideShellAnalyst: Story = {
  render: () => (
    <MarkdownShellPreview
      title="ViewerPanel / Source Artifact Index"
      subtitle="Densidade operacional para leitura em painel."
      content={sourceArtifactMarkdownExample}
      variant="analyst"
      activeView="sources"
    />
  ),
}
