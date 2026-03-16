"use client"

import type { JSX } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { AiMagicIcon, ArrowDown01Icon } from "@hugeicons/core-free-icons"

import type { ShellViewId } from "@/components/app/AppSidebar"
import { buildDossierLookup, toDisplayDocumentName, type SelectedDossierDocument } from "@/components/app/dossier/types"
import type { DossierViewFilter } from "@/components/app/sidebar/types"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { GroupsViewPanel } from "@/components/app/viewer/GroupsViewPanel"
import { PeopleViewPanel } from "@/components/app/viewer/PeopleViewPanel"
import { PlacesViewPanel } from "@/components/app/viewer/PlacesViewPanel"
import { LeadMarkdownDocumentPanel } from "@/components/app/viewer/LeadMarkdownDocumentPanel"
import { LeadViewPanel } from "@/components/app/viewer/LeadViewPanel"
import { SourceViewPanel } from "@/components/app/viewer/SourceViewPanel"
import { TimelineViewPanel } from "@/components/app/viewer/TimelineViewPanel"
import { DossierMarkdownDocumentPanel } from "@/components/app/viewer/DossierMarkdownDocumentPanel"
import { SourceMarkdownDocumentPanel } from "@/components/app/viewer/SourceMarkdownDocumentPanel"
import { GraphViewPanel } from "@/components/app/viewer/GraphViewPanel"
import { FindingViewPanel } from "@/components/app/viewer/FindingViewPanel"
import { AllegationViewPanel } from "@/components/app/viewer/AllegationViewPanel"
import { InvestigationMarkdownDocumentPanel } from "@/components/app/viewer/InvestigationMarkdownDocumentPanel"
import type { DossierIndexPayload } from "../../../../shared/workspace-markdown"
import type { LeadsIndexPayload } from "../../../../shared/workspace-leads"
import type { InvestigationDocumentKind, InvestigationIndexPayload } from "../../../../shared/workspace-investigation"
import type { SourcesIndexPayload } from "../../../../shared/workspace-sources"
import type { SelectedLeadDocument } from "@/components/app/leads/types"
import type { SelectedSourceDocument } from "@/components/app/sources/types"
import type { SelectedInvestigationDocument } from "@/components/app/investigation/types"

type DossierViewId = Extract<ShellViewId, "dossier-people" | "dossier-groups" | "dossier-places" | "dossier-timeline">

type ViewerPanelProps = {
  activeView: ShellViewId
  dossierFilter?: DossierViewFilter | null
  dossierFilterVersion?: number
  dossierIndex: DossierIndexPayload | null
  dossierIndexLoading: boolean
  dossierIndexError: string | null
  dossierIndexStale: boolean
  selectedDossierDocument: SelectedDossierDocument | null
  leadsIndex: LeadsIndexPayload | null
  leadsIndexLoading: boolean
  leadsIndexError: string | null
  leadsIndexStale: boolean
  selectedLeadDocument: SelectedLeadDocument | null
  investigationIndex: InvestigationIndexPayload | null
  investigationIndexLoading: boolean
  investigationIndexError: string | null
  investigationIndexStale: boolean
  selectedInvestigationDocument: SelectedInvestigationDocument | null
  sourcesIndex: SourcesIndexPayload | null
  sourcesIndexLoading: boolean
  sourcesIndexError: string | null
  sourcesIndexStale: boolean
  selectedSourceDocument: SelectedSourceDocument | null
  onOpenDossierDocument: (relativePath: string) => void
  onOpenDossierDocumentFromWikiLink: (relativePath: string) => void
  onOpenSourceDocumentFromWikiLink: (relativePath: string) => void
  onOpenLeadDocument: (relativePath: string) => void
  onOpenLeadDocumentFromWikiLink: (relativePath: string) => void
  onOpenFindingDocument: (relativePath: string) => void
  onOpenFindingDocumentFromWikiLink: (relativePath: string) => void
  onOpenAllegationDocument: (relativePath: string) => void
  onOpenAllegationDocumentFromWikiLink: (relativePath: string) => void
  onOpenInvestigationDocument: (documentKind: InvestigationDocumentKind, relativePath: string) => void
  onOpenSourceDocument: (relativePath: string) => void
  onSelectCommand: (command: string) => void
  onNavigateDossierSection: (view: DossierViewId) => void
  onNavigateDossierFilter: (filter: DossierViewFilter) => void
}

type ViewMetadata = {
  title: string
  description: string
  breadcrumbs: string[]
  commands: string[]
}

const viewContent: Record<ShellViewId, ViewMetadata> = {
  sources: {
    title: "Sources",
    description: "Ingestao e organizacao das fontes primarias da investigacao.",
    breadcrumbs: ["Desk Title", "Sources"],
    commands: [
      "process-all --standard",
      "process-all --deep",
      "queue-status",
      "process-queue",
      "queue-clear",
      "rerun-all --standard",
      "rerun-all --deep",
    ],
  },
  leads: {
    title: "Leads",
    description: "Hipoteses investigativas e proximas linhas de apuracao.",
    breadcrumbs: ["Desk Title", "Leads"],
    commands: ["deep-dive", "dig", "create-lead", "inquiry-all", "inquiry --lead <slug>"],
  },
  findings: {
    title: "Findings",
    description: "Achados validados e evidencias consolidadas para o dossie.",
    breadcrumbs: ["Desk Title", "Findings"],
    commands: [],
  },
  allegations: {
    title: "Allegations",
    description: "Alegacoes em analise, com status de verificacao editorial.",
    breadcrumbs: ["Desk Title", "Allegations"],
    commands: [],
  },
  "dossier-people": {
    title: "Dossier / People",
    description: "Entidades pessoais relacionadas a investigacao e seus vinculos.",
    breadcrumbs: ["Desk Title", "Dossier", "People"],
    commands: [],
  },
  "dossier-groups": {
    title: "Dossier / Groups",
    description: "Organizacoes, empresas e grupos institucionais mapeados.",
    breadcrumbs: ["Desk Title", "Dossier", "Groups"],
    commands: [],
  },
  "dossier-places": {
    title: "Dossier / Places",
    description: "Locais relevantes e enderecos conectados aos eventos investigados.",
    breadcrumbs: ["Desk Title", "Dossier", "Places"],
    commands: [],
  },
  "dossier-timeline": {
    title: "Dossier / Timeline",
    description: "Linha do tempo dos fatos, documentos e marcos investigativos.",
    breadcrumbs: ["Desk Title", "Dossier", "Timeline"],
    commands: [],
  },
  "graph-view": {
    title: "Graph View",
    description: "Visualizacao de relacoes entre pessoas, grupos, locais e eventos.",
    breadcrumbs: ["Desk Title", "Dossier", "Graph View"],
    commands: [],
  },
  model: {
    title: "Model",
    description: "Configuracoes de modelo e roteamento de IA do Reverso Agent.",
    breadcrumbs: ["Desk Title", "Settings", "Model"],
    commands: [],
  },
  preferences: {
    title: "Preferences",
    description: "Preferencias da plataforma e comportamento da experiencia de uso.",
    breadcrumbs: ["Desk Title", "Settings", "Preferences"],
    commands: [],
  },
}

export function ViewerPanel({
  activeView,
  dossierFilter,
  dossierFilterVersion,
  dossierIndex,
  dossierIndexLoading,
  dossierIndexError,
  dossierIndexStale,
  selectedDossierDocument,
  leadsIndex,
  leadsIndexLoading,
  leadsIndexError,
  leadsIndexStale,
  selectedLeadDocument,
  investigationIndex,
  investigationIndexLoading,
  investigationIndexError,
  investigationIndexStale,
  selectedInvestigationDocument,
  sourcesIndex,
  sourcesIndexLoading,
  sourcesIndexError,
  sourcesIndexStale,
  selectedSourceDocument,
  onOpenDossierDocument,
  onOpenDossierDocumentFromWikiLink,
  onOpenSourceDocumentFromWikiLink,
  onOpenLeadDocument,
  onOpenLeadDocumentFromWikiLink,
  onOpenFindingDocument,
  onOpenFindingDocumentFromWikiLink,
  onOpenAllegationDocument,
  onOpenAllegationDocumentFromWikiLink,
  onOpenInvestigationDocument,
  onOpenSourceDocument,
  onSelectCommand,
  onNavigateDossierSection,
  onNavigateDossierFilter,
}: ViewerPanelProps): JSX.Element {
  const content = viewContent[activeView]
  const isDossierView = activeView === "dossier-people" || activeView === "dossier-groups" || activeView === "dossier-places" || activeView === "dossier-timeline"
  const isLeadsView = activeView === "leads"
  const isFindingsView = activeView === "findings"
  const isAllegationsView = activeView === "allegations"
  const isInvestigationView = isFindingsView || isAllegationsView
  const isSourcesView = activeView === "sources"
  const isGraphView = activeView === "graph-view"
  const isDocumentMode = isDossierView && Boolean(selectedDossierDocument)
  const isLeadDocumentMode = isLeadsView && Boolean(selectedLeadDocument)
  const isInvestigationDocumentMode = isInvestigationView && Boolean(selectedInvestigationDocument)
  const isSourceDocumentMode = isSourcesView && Boolean(selectedSourceDocument)
  const showTopCommands = !isDossierView && content.commands.length > 0
  const dossierLookup = buildDossierLookup(dossierIndex)
  const selectedMeta = selectedDossierDocument ? dossierLookup.byRelativePath.get(selectedDossierDocument.relativePath) : undefined

  const headerBreadcrumbs: Array<{ label: string; onClick?: () => void; current?: boolean }> = isDocumentMode && selectedMeta
    ? (() => {
        const sectionView = activeView as DossierViewId
        const sectionLabel = sectionView === "dossier-people"
          ? "People"
          : sectionView === "dossier-groups"
            ? "Groups"
            : sectionView === "dossier-places"
              ? "Places"
              : "Timeline"
        const crumbs: Array<{ label: string; onClick?: () => void; current?: boolean }> = [
          { label: "Desk Title" },
          { label: "Dossier", onClick: () => onNavigateDossierSection(sectionView) },
          { label: sectionLabel, onClick: () => onNavigateDossierSection(sectionView) },
        ]

        if (sectionView === "dossier-places") {
          const [, country, city, neighborhood] = selectedMeta.folderPath
          if (country) {
            crumbs.push({
              label: country,
              onClick: () => onNavigateDossierFilter({ view: "dossier-places", country }),
            })
          }
          if (country && city) {
            crumbs.push({
              label: city,
              onClick: () => onNavigateDossierFilter({ view: "dossier-places", country, city }),
            })
          }
          if (country && city && neighborhood) {
            crumbs.push({
              label: neighborhood,
              onClick: () => onNavigateDossierFilter({ view: "dossier-places", country, city, neighborhood }),
            })
          }
        }

        if (sectionView === "dossier-timeline") {
          const [, year] = selectedMeta.folderPath
          if (year) {
            crumbs.push({
              label: year,
              onClick: () => onNavigateDossierFilter({ view: "dossier-timeline", year }),
            })
          }
        }

        crumbs.push({
          label: toDisplayDocumentName(selectedMeta),
          current: true,
        })
        return crumbs
      })()
    : content.breadcrumbs.map((label, index) => ({
        label,
        current: index === content.breadcrumbs.length - 1,
      }))

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 px-4 transition-[width,height] ease-linear">
        <div className="flex min-w-0 items-center gap-2">
          <Breadcrumb>
            <BreadcrumbList>
              {headerBreadcrumbs.map((crumb, index) => {
                const isLast = index === headerBreadcrumbs.length - 1
                return (
                  <BreadcrumbItem key={`${crumb.label}-${index}`} className="min-w-0">
                    {isLast || crumb.current ? (
                      <BreadcrumbPage className="truncate">{crumb.label}</BreadcrumbPage>
                    ) : crumb.onClick ? (
                      <BreadcrumbLink asChild>
                        <button type="button" onClick={crumb.onClick} className="truncate">
                          {crumb.label}
                        </button>
                      </BreadcrumbLink>
                    ) : (
                      <span>{crumb.label}</span>
                    )}
                    {!isLast ? <BreadcrumbSeparator /> : null}
                  </BreadcrumbItem>
                )
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {showTopCommands ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="gap-1.5">
                <HugeiconsIcon icon={AiMagicIcon} size={15} strokeWidth={1.8} />
                <span>Commands</span>
                <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={1.8} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-md max-w-[92vw] overflow-x-auto">
              {content.commands.length ? (
                content.commands.map((command) => (
                  <DropdownMenuItem
                    key={command}
                    className="whitespace-nowrap font-mono text-xs"
                    onClick={() => onSelectCommand(command.startsWith("/") ? command : `/${command}`)}
                  >
                    {command}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>Nenhum comando para esta pagina</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </header>

      {isDocumentMode ? (
        <div className="flex min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex min-h-full w-full max-w-368 flex-col gap-4 px-6 py-6">
            {selectedDossierDocument ? (
              <DossierMarkdownDocumentPanel
                selectedDocument={selectedDossierDocument}
                dossierIndex={dossierIndex}
                sourcesIndex={sourcesIndex}
                leadsIndex={leadsIndex}
                investigationIndex={investigationIndex}
                onOpenDocument={onOpenDossierDocumentFromWikiLink}
                onOpenLeadDocument={onOpenLeadDocumentFromWikiLink}
                onOpenFindingDocument={onOpenFindingDocumentFromWikiLink}
                onOpenAllegationDocument={onOpenAllegationDocumentFromWikiLink}
                onOpenSourceDocument={onOpenSourceDocumentFromWikiLink}
              />
            ) : null}
          </div>
        </div>
      ) : isSourceDocumentMode ? (
        <div className="flex min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex min-h-full w-full max-w-368 flex-col gap-4 px-6 py-6">
            {selectedSourceDocument ? (
              <SourceMarkdownDocumentPanel
                selectedDocument={selectedSourceDocument}
                sourcesIndex={sourcesIndex}
                dossierIndex={dossierIndex}
                leadsIndex={leadsIndex}
                investigationIndex={investigationIndex}
                onOpenDossierDocument={onOpenDossierDocumentFromWikiLink}
                onOpenLeadDocument={onOpenLeadDocumentFromWikiLink}
                onOpenFindingDocument={onOpenFindingDocumentFromWikiLink}
                onOpenAllegationDocument={onOpenAllegationDocumentFromWikiLink}
                onOpenSourceDocument={onOpenSourceDocumentFromWikiLink}
              />
            ) : null}
          </div>
        </div>
      ) : isLeadDocumentMode ? (
        <div className="flex min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex min-h-full w-full max-w-368 flex-col gap-4 px-6 py-6">
            {selectedLeadDocument ? (
              <LeadMarkdownDocumentPanel
                selectedDocument={selectedLeadDocument}
                leadsIndex={leadsIndex}
                dossierIndex={dossierIndex}
                investigationIndex={investigationIndex}
                sourcesIndex={sourcesIndex}
                onOpenDossierDocument={onOpenDossierDocumentFromWikiLink}
                onOpenLeadDocument={onOpenLeadDocumentFromWikiLink}
                onOpenFindingDocument={onOpenFindingDocumentFromWikiLink}
                onOpenAllegationDocument={onOpenAllegationDocumentFromWikiLink}
                onOpenSourceDocument={onOpenSourceDocumentFromWikiLink}
                onOpenDocument={onOpenLeadDocument}
              />
            ) : null}
          </div>
        </div>
      ) : isInvestigationDocumentMode ? (
        <div className="flex min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex min-h-full w-full max-w-368 flex-col gap-4 px-6 py-6">
            {selectedInvestigationDocument ? (
              <InvestigationMarkdownDocumentPanel
                selectedDocument={selectedInvestigationDocument}
                dossierIndex={dossierIndex}
                leadsIndex={leadsIndex}
                sourcesIndex={sourcesIndex}
                investigationIndex={investigationIndex}
                onOpenDossierDocument={onOpenDossierDocumentFromWikiLink}
                onOpenLeadDocument={onOpenLeadDocumentFromWikiLink}
                onOpenSourceDocument={onOpenSourceDocumentFromWikiLink}
                onOpenFindingDocument={onOpenFindingDocumentFromWikiLink}
                onOpenAllegationDocument={onOpenAllegationDocumentFromWikiLink}
              />
            ) : null}
          </div>
        </div>
      ) : (
        activeView === "leads" ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <LeadViewPanel
              leadsIndex={leadsIndex}
              leadsIndexLoading={leadsIndexLoading}
              leadsIndexError={leadsIndexError}
              leadsIndexStale={leadsIndexStale}
              onOpenLeadDocument={onOpenLeadDocument}
            />
          </div>
        ) : activeView === "findings" ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <FindingViewPanel
              investigationIndex={investigationIndex}
              investigationIndexLoading={investigationIndexLoading}
              investigationIndexError={investigationIndexError}
              investigationIndexStale={investigationIndexStale}
              onOpenFindingDocument={onOpenFindingDocument}
            />
          </div>
        ) : activeView === "allegations" ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <AllegationViewPanel
              investigationIndex={investigationIndex}
              investigationIndexLoading={investigationIndexLoading}
              investigationIndexError={investigationIndexError}
              investigationIndexStale={investigationIndexStale}
              onOpenAllegationDocument={onOpenAllegationDocument}
            />
          </div>
        ) : activeView === "sources" ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <SourceViewPanel
              sourcesIndex={sourcesIndex}
              sourcesIndexLoading={sourcesIndexLoading}
              sourcesIndexError={sourcesIndexError}
              sourcesIndexStale={sourcesIndexStale}
              onOpenSourceDocument={onOpenSourceDocument}
            />
          </div>
        ) : isGraphView ? (
          <div className="min-h-0 flex-1">
            <GraphViewPanel
              dossierIndex={dossierIndex}
              leadsIndex={leadsIndex}
              sourcesIndex={sourcesIndex}
              investigationIndex={investigationIndex}
              selectedDossierDocument={selectedDossierDocument}
              selectedLeadDocument={selectedLeadDocument}
              selectedSourceDocument={selectedSourceDocument}
              selectedInvestigationDocument={selectedInvestigationDocument}
              onOpenDossierDocument={onOpenDossierDocument}
              onOpenLeadDocument={onOpenLeadDocument}
              onOpenSourceDocument={onOpenSourceDocument}
              onOpenInvestigationDocument={onOpenInvestigationDocument}
            />
          </div>
        ) : (
          <ScrollArea className="min-h-0 flex-1">
            {activeView === "dossier-people" ? (
            <div className="mx-auto flex min-h-full w-full max-w-368 flex-col gap-4 px-6 py-6">
              <PeopleViewPanel dossierIndex={dossierIndex} onOpenDossierDocument={onOpenDossierDocument} />
            </div>
          ) : activeView === "dossier-groups" ? (
            <div className="mx-auto flex min-h-full w-full max-w-368 flex-col gap-4 px-6 py-6">
              <GroupsViewPanel
                dossierIndex={dossierIndex}
                onOpenDossierDocument={onOpenDossierDocument}
                presetCategory={dossierFilter?.view === "dossier-groups" ? dossierFilter.category : undefined}
                presetVersion={dossierFilterVersion}
              />
            </div>
          ) : activeView === "dossier-places" ? (
            <div className="mx-auto flex min-h-full w-full max-w-368 flex-col gap-4 px-6 py-6">
              <PlacesViewPanel
                dossierIndex={dossierIndex}
                onOpenDossierDocument={onOpenDossierDocument}
                preset={
                  dossierFilter?.view === "dossier-places"
                    ? {
                        country: dossierFilter.country,
                        city: dossierFilter.city,
                        neighborhood: dossierFilter.neighborhood,
                      }
                    : null
                }
                presetVersion={dossierFilterVersion}
              />
            </div>
          ) : activeView === "dossier-timeline" ? (
            <div className="mx-auto flex min-h-full w-full max-w-368 flex-col gap-4 px-6 py-6">
              <TimelineViewPanel
                dossierIndex={dossierIndex}
                onOpenDossierDocument={onOpenDossierDocument}
                preset={
                  dossierFilter?.view === "dossier-timeline"
                    ? {
                        year: dossierFilter.year,
                        month: dossierFilter.month,
                      }
                    : null
                }
                presetVersion={dossierFilterVersion}
              />
            </div>
          ) : (
            <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col gap-6 px-6 py-8">
              <section className="space-y-3 rounded-xl border border-border/60 bg-card/70 p-6 shadow-sm">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  Viewer Area
                </p>
                <div className="space-y-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-foreground">{content.title}</h1>
                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{content.description}</p>
                </div>
              </section>

              <section className="grid auto-rows-min gap-4 md:grid-cols-3">
                <div className="aspect-video rounded-xl bg-muted/50" />
                <div className="aspect-video rounded-xl bg-muted/50" />
                <div className="aspect-video rounded-xl bg-muted/50" />
              </section>

              <section className="rounded-xl border border-dashed border-border/70 bg-card/40 p-5">
                <h2 className="text-sm font-medium text-foreground">Workspace Surface</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Reader base para todas as view areas. O conteudo de cada pagina sera renderizado aqui mantendo o
                  mesmo padrao de navegacao e comandos.
                </p>
                <div className="mt-4 min-h-[55vh] rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
                  Conteudo dinamico: {content.title}
                </div>
              </section>
            </div>
            )}
          </ScrollArea>
        )
      )}
      {isDossierView && (dossierIndexLoading || dossierIndexError || dossierIndexStale) ? (
        <footer className="flex shrink-0 items-center gap-2 border-t border-border/60 px-4 py-2 text-xs text-muted-foreground">
          {dossierIndexLoading ? <span>Carregando indice do dossier...</span> : null}
          {dossierIndexError ? <span>Erro de indice: {dossierIndexError}</span> : null}
          {dossierIndexStale && !dossierIndexLoading ? <span>Atualizando dados do filesystem...</span> : null}
        </footer>
      ) : null}
      {isSourcesView && (sourcesIndexLoading || sourcesIndexError || sourcesIndexStale) ? (
        <footer className="flex shrink-0 items-center gap-2 border-t border-border/60 px-4 py-2 text-xs text-muted-foreground">
          {sourcesIndexLoading ? <span>Loading sources index...</span> : null}
          {sourcesIndexError ? <span>Index error: {sourcesIndexError}</span> : null}
          {sourcesIndexStale && !sourcesIndexLoading ? <span>Refreshing sources data...</span> : null}
        </footer>
      ) : null}
      {isLeadsView && (leadsIndexLoading || leadsIndexError || leadsIndexStale) ? (
        <footer className="flex shrink-0 items-center gap-2 border-t border-border/60 px-4 py-2 text-xs text-muted-foreground">
          {leadsIndexLoading ? <span>Loading leads index...</span> : null}
          {leadsIndexError ? <span>Index error: {leadsIndexError}</span> : null}
          {leadsIndexStale && !leadsIndexLoading ? <span>Refreshing leads data...</span> : null}
        </footer>
      ) : null}
      {isInvestigationView && (investigationIndexLoading || investigationIndexError || investigationIndexStale) ? (
        <footer className="flex shrink-0 items-center gap-2 border-t border-border/60 px-4 py-2 text-xs text-muted-foreground">
          {investigationIndexLoading ? <span>Loading investigation index...</span> : null}
          {investigationIndexError ? <span>Index error: {investigationIndexError}</span> : null}
          {investigationIndexStale && !investigationIndexLoading ? <span>Refreshing investigation data...</span> : null}
        </footer>
      ) : null}
    </section>
  )
}
