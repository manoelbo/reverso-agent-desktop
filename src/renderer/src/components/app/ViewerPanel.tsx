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
import { SourceViewPanel } from "@/components/app/viewer/SourceViewPanel"
import { TimelineViewPanel } from "@/components/app/viewer/TimelineViewPanel"
import { DossierMarkdownDocumentPanel } from "@/components/app/viewer/DossierMarkdownDocumentPanel"
import type { DossierIndexPayload } from "../../../../shared/workspace-markdown"

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
  onOpenDossierDocument: (relativePath: string) => void
  onOpenDossierDocumentFromWikiLink: (relativePath: string) => void
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
    commands: ["/create-lead"],
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
  onOpenDossierDocument,
  onOpenDossierDocumentFromWikiLink,
  onNavigateDossierSection,
  onNavigateDossierFilter,
}: ViewerPanelProps): JSX.Element {
  const content = viewContent[activeView]
  const isDossierView = activeView === "dossier-people" || activeView === "dossier-groups" || activeView === "dossier-places" || activeView === "dossier-timeline"
  const isDocumentMode = isDossierView && Boolean(selectedDossierDocument)
  const showTopCommands = !isDossierView
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
            <DropdownMenuContent align="end" className="w-[28rem] max-w-[92vw] overflow-x-auto">
              {content.commands.length ? (
                content.commands.map((command) => (
                  <DropdownMenuItem key={command} className="whitespace-nowrap font-mono text-xs">
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
        <div className="flex min-h-0 flex-1">
          <div className="mx-auto flex min-h-full w-full max-w-368 flex-col gap-4 px-6 py-6">
            {selectedDossierDocument ? (
              <DossierMarkdownDocumentPanel
                selectedDocument={selectedDossierDocument}
                dossierIndex={dossierIndex}
                section={selectedMeta?.section}
                onOpenDocument={onOpenDossierDocumentFromWikiLink}
              />
            ) : null}
          </div>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          {activeView === "sources" ? (
            <SourceViewPanel />
          ) : activeView === "dossier-people" ? (
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
      )}
      {isDossierView && (dossierIndexLoading || dossierIndexError || dossierIndexStale) ? (
        <footer className="flex shrink-0 items-center gap-2 border-t border-border/60 px-4 py-2 text-xs text-muted-foreground">
          {dossierIndexLoading ? <span>Carregando indice do dossier...</span> : null}
          {dossierIndexError ? <span>Erro de indice: {dossierIndexError}</span> : null}
          {dossierIndexStale && !dossierIndexLoading ? <span>Atualizando dados do filesystem...</span> : null}
        </footer>
      ) : null}
    </section>
  )
}
