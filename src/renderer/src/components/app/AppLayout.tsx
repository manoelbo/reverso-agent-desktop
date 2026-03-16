"use client"

import type { CSSProperties, JSX } from "react"
import { useEffect, useState } from "react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { PanelLeftIcon, PanelRightIcon } from "@hugeicons/core-free-icons"

import { AppSidebar, type ShellViewId } from "@/components/app/AppSidebar"
import { listDossierIndex, subscribeDossierChanges } from "@/components/app/dossier/workspace-client"
import type { SelectedDossierDocument } from "@/components/app/dossier/types"
import { listLeadsIndex, subscribeLeadsChanges } from "@/components/app/leads/workspace-client"
import type { SelectedLeadDocument } from "@/components/app/leads/types"
import { listInvestigationIndex, subscribeInvestigationChanges } from "@/components/app/investigation/workspace-client"
import type { SelectedInvestigationDocument } from "@/components/app/investigation/types"
import { listSourcesIndex, subscribeSourcesChanges } from "@/components/app/sources/workspace-client"
import type { SelectedSourceDocument } from "@/components/app/sources/types"
import type { DossierViewFilter } from "@/components/app/sidebar/types"
import { ChatPanel, type ChatPanelProps } from "@/components/app/ChatPanel"
import { ViewerPanel } from "@/components/app/ViewerPanel"
import { Button } from "@/components/ui/button"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

const sidebarStyle = {
  "--sidebar-width": "19rem",
  "--sidebar-top": "2.5rem",
} as CSSProperties

type AppLayoutProps = {
  defaultLeftOpen?: boolean
  defaultRightOpen?: boolean
  chatPanelProps?: ChatPanelProps
}

function resolveDossierViewFromRelativePath(relativePath: string): ShellViewId {
  if (relativePath.startsWith("people/")) return "dossier-people"
  if (relativePath.startsWith("groups/")) return "dossier-groups"
  if (relativePath.startsWith("places/")) return "dossier-places"
  return "dossier-timeline"
}

export function AppLayout({
  defaultLeftOpen = true,
  defaultRightOpen = true,
  chatPanelProps,
}: AppLayoutProps): JSX.Element {
  const [activeView, setActiveView] = useState<ShellViewId>("sources")
  const [dossierFilter, setDossierFilter] = useState<DossierViewFilter | null>(null)
  const [dossierFilterVersion, setDossierFilterVersion] = useState(0)
  const [dossierIndexLoading, setDossierIndexLoading] = useState(false)
  const [dossierIndexError, setDossierIndexError] = useState<string | null>(null)
  const [dossierIndexStale, setDossierIndexStale] = useState(false)
  const [dossierIndex, setDossierIndex] = useState<Awaited<ReturnType<typeof listDossierIndex>>>(null)
  const [selectedDossierDocument, setSelectedDossierDocument] = useState<SelectedDossierDocument | null>(null)
  const [leadsIndexLoading, setLeadsIndexLoading] = useState(false)
  const [leadsIndexError, setLeadsIndexError] = useState<string | null>(null)
  const [leadsIndexStale, setLeadsIndexStale] = useState(false)
  const [leadsIndex, setLeadsIndex] = useState<Awaited<ReturnType<typeof listLeadsIndex>>>(null)
  const [selectedLeadDocument, setSelectedLeadDocument] = useState<SelectedLeadDocument | null>(null)
  const [investigationIndexLoading, setInvestigationIndexLoading] = useState(false)
  const [investigationIndexError, setInvestigationIndexError] = useState<string | null>(null)
  const [investigationIndexStale, setInvestigationIndexStale] = useState(false)
  const [investigationIndex, setInvestigationIndex] = useState<Awaited<ReturnType<typeof listInvestigationIndex>>>(null)
  const [selectedInvestigationDocument, setSelectedInvestigationDocument] = useState<SelectedInvestigationDocument | null>(null)
  const [sourcesIndexLoading, setSourcesIndexLoading] = useState(false)
  const [sourcesIndexError, setSourcesIndexError] = useState<string | null>(null)
  const [sourcesIndexStale, setSourcesIndexStale] = useState(false)
  const [sourcesIndex, setSourcesIndex] = useState<Awaited<ReturnType<typeof listSourcesIndex>>>(null)
  const [selectedSourceDocument, setSelectedSourceDocument] = useState<SelectedSourceDocument | null>(null)
  const [chatCommandDraft, setChatCommandDraft] = useState<string | null>(null)
  const [chatCommandDraftVersion, setChatCommandDraftVersion] = useState(0)
  const [isLeftOpen, setIsLeftOpen] = useState(defaultLeftOpen)
  const [isRightOpen, setIsRightOpen] = useState(defaultRightOpen)

  useEffect(() => {
    let isMounted = true

    const refreshIndex = async (showLoading: boolean): Promise<void> => {
      if (showLoading && isMounted) {
        setDossierIndexLoading(true)
      }
      try {
        const payload = await listDossierIndex()
        if (!isMounted) return
        setDossierIndex(payload)
        setDossierIndexError(payload ? null : "Workspace markdown API indisponivel.")
        setDossierIndexStale(false)
      } catch (error) {
        if (!isMounted) return
        setDossierIndexError(error instanceof Error ? error.message : "Falha ao carregar indice do dossier.")
      } finally {
        if (isMounted) {
          setDossierIndexLoading(false)
        }
      }
    }

    void refreshIndex(true)

    const unsubscribe = subscribeDossierChanges(() => {
      setDossierIndexStale(true)
      void refreshIndex(false)
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const refreshIndex = async (showLoading: boolean): Promise<void> => {
      if (showLoading && isMounted) {
        setInvestigationIndexLoading(true)
      }
      try {
        const payload = await listInvestigationIndex()
        if (!isMounted) return
        setInvestigationIndex(payload)
        setInvestigationIndexError(payload ? null : "Workspace investigation API unavailable.")
        setInvestigationIndexStale(false)
      } catch (error) {
        if (!isMounted) return
        setInvestigationIndexError(error instanceof Error ? error.message : "Failed to load investigation index.")
      } finally {
        if (isMounted) {
          setInvestigationIndexLoading(false)
        }
      }
    }

    void refreshIndex(true)

    const unsubscribe = subscribeInvestigationChanges(() => {
      setInvestigationIndexStale(true)
      void refreshIndex(false)
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const refreshIndex = async (showLoading: boolean): Promise<void> => {
      if (showLoading && isMounted) {
        setLeadsIndexLoading(true)
      }
      try {
        const payload = await listLeadsIndex()
        if (!isMounted) return
        setLeadsIndex(payload)
        setLeadsIndexError(payload ? null : "Workspace leads API unavailable.")
        setLeadsIndexStale(false)
      } catch (error) {
        if (!isMounted) return
        setLeadsIndexError(error instanceof Error ? error.message : "Failed to load leads index.")
      } finally {
        if (isMounted) {
          setLeadsIndexLoading(false)
        }
      }
    }

    void refreshIndex(true)

    const unsubscribe = subscribeLeadsChanges(() => {
      setLeadsIndexStale(true)
      void refreshIndex(false)
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const refreshIndex = async (showLoading: boolean): Promise<void> => {
      if (showLoading && isMounted) {
        setSourcesIndexLoading(true)
      }
      try {
        const payload = await listSourcesIndex()
        if (!isMounted) return
        setSourcesIndex(payload)
        setSourcesIndexError(payload ? null : "Workspace sources API unavailable.")
        setSourcesIndexStale(false)
      } catch (error) {
        if (!isMounted) return
        setSourcesIndexError(error instanceof Error ? error.message : "Failed to load sources index.")
      } finally {
        if (isMounted) {
          setSourcesIndexLoading(false)
        }
      }
    }

    void refreshIndex(true)

    const unsubscribe = subscribeSourcesChanges(() => {
      setSourcesIndexStale(true)
      void refreshIndex(false)
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  const handleSelectView = (view: ShellViewId): void => {
    setActiveView(view)
    setDossierFilter(null)
    setDossierFilterVersion((value) => value + 1)
    setSelectedDossierDocument(null)
    setSelectedLeadDocument(null)
    setSelectedInvestigationDocument(null)
    setSelectedSourceDocument(null)
  }

  const handleSelectDossierFilter = (filter: DossierViewFilter): void => {
    setActiveView(filter.view)
    setDossierFilter(filter)
    setDossierFilterVersion((value) => value + 1)
    setSelectedDossierDocument(null)
    setSelectedLeadDocument(null)
    setSelectedInvestigationDocument(null)
    setSelectedSourceDocument(null)
  }

  const handleOpenDossierDocument = (relativePath: string, source: SelectedDossierDocument["source"] = "sidebar"): void => {
    setActiveView(resolveDossierViewFromRelativePath(relativePath))
    setSelectedDossierDocument({ relativePath, source })
    setSelectedLeadDocument(null)
    setSelectedInvestigationDocument(null)
    setSelectedSourceDocument(null)
  }

  const handleOpenLeadDocument = (relativePath: string, source: SelectedLeadDocument["source"] = "sidebar"): void => {
    setActiveView("leads")
    setSelectedLeadDocument({ relativePath, source })
    setSelectedDossierDocument(null)
    setSelectedInvestigationDocument(null)
    setSelectedSourceDocument(null)
  }

  const handleOpenFindingDocument = (
    relativePath: string,
    source: SelectedInvestigationDocument["source"] = "sidebar"
  ): void => {
    setActiveView("findings")
    setSelectedInvestigationDocument({
      documentKind: "finding",
      relativePath,
      source,
    })
    setSelectedDossierDocument(null)
    setSelectedLeadDocument(null)
    setSelectedSourceDocument(null)
  }

  const handleOpenAllegationDocument = (
    relativePath: string,
    source: SelectedInvestigationDocument["source"] = "sidebar"
  ): void => {
    setActiveView("allegations")
    setSelectedInvestigationDocument({
      documentKind: "allegation",
      relativePath,
      source,
    })
    setSelectedDossierDocument(null)
    setSelectedLeadDocument(null)
    setSelectedSourceDocument(null)
  }

  const handleOpenSourceDocument = (relativePath: string, source: SelectedSourceDocument["source"] = "sidebar"): void => {
    setActiveView("sources")
    setSelectedSourceDocument({ relativePath, source })
    setSelectedDossierDocument(null)
    setSelectedLeadDocument(null)
    setSelectedInvestigationDocument(null)
  }

  const handleSelectViewerCommand = (command: string): void => {
    setChatCommandDraft(command)
    setChatCommandDraftVersion((value) => value + 1)
    if (!isRightOpen) {
      setIsRightOpen(true)
    }
  }

  return (
    <TooltipProvider>
      <SidebarProvider open={isLeftOpen} onOpenChange={setIsLeftOpen} style={sidebarStyle}>
        <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
          <header className="drag-region relative z-30 flex h-10 shrink-0 items-center border-b border-border/60 px-3">
            <div className="no-drag relative z-40 flex items-center gap-2">
              <div aria-hidden="true" className="h-5 w-16 shrink-0" />

              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground"
                aria-label={isLeftOpen ? "Hide left sidebar" : "Show left sidebar"}
                onClick={() => setIsLeftOpen((open) => !open)}
              >
                <HugeiconsIcon icon={PanelLeftIcon as IconSvgElement} size={18} strokeWidth={1.8} />
              </Button>
            </div>

            <div className="pointer-events-none absolute inset-x-0 text-center text-sm font-medium text-foreground">
              Reverso Agent
            </div>

            <div className="no-drag ml-auto flex items-center">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground"
                aria-label={isRightOpen ? "Hide right sidebar" : "Show right sidebar"}
                onClick={() => setIsRightOpen((open) => !open)}
              >
                <HugeiconsIcon icon={PanelRightIcon as IconSvgElement} size={18} strokeWidth={1.8} />
              </Button>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 overflow-hidden">
            <AppSidebar
              activeView={activeView}
              dossierIndex={dossierIndex}
              leadsIndex={leadsIndex}
              investigationIndex={investigationIndex}
              sourcesIndex={sourcesIndex}
              onSelectView={handleSelectView}
              onSelectDossierFilter={handleSelectDossierFilter}
              onOpenDossierDocument={(relativePath) => handleOpenDossierDocument(relativePath, "sidebar")}
              onOpenLeadDocument={(relativePath) => handleOpenLeadDocument(relativePath, "sidebar")}
              onOpenFindingDocument={(relativePath) => handleOpenFindingDocument(relativePath, "sidebar")}
              onOpenAllegationDocument={(relativePath) => handleOpenAllegationDocument(relativePath, "sidebar")}
              onOpenSourceDocument={(relativePath) => handleOpenSourceDocument(relativePath, "sidebar")}
            />
            <SidebarInset className="flex min-w-0 flex-1 flex-col">
              <ViewerPanel
                activeView={activeView}
                dossierFilter={dossierFilter}
                dossierFilterVersion={dossierFilterVersion}
                dossierIndex={dossierIndex}
                dossierIndexLoading={dossierIndexLoading}
                dossierIndexError={dossierIndexError}
                dossierIndexStale={dossierIndexStale}
                selectedDossierDocument={selectedDossierDocument}
                leadsIndex={leadsIndex}
                leadsIndexLoading={leadsIndexLoading}
                leadsIndexError={leadsIndexError}
                leadsIndexStale={leadsIndexStale}
                selectedLeadDocument={selectedLeadDocument}
                investigationIndex={investigationIndex}
                investigationIndexLoading={investigationIndexLoading}
                investigationIndexError={investigationIndexError}
                investigationIndexStale={investigationIndexStale}
                selectedInvestigationDocument={selectedInvestigationDocument}
                sourcesIndex={sourcesIndex}
                sourcesIndexLoading={sourcesIndexLoading}
                sourcesIndexError={sourcesIndexError}
                sourcesIndexStale={sourcesIndexStale}
                selectedSourceDocument={selectedSourceDocument}
                onOpenDossierDocument={(relativePath) => handleOpenDossierDocument(relativePath, "home")}
                onOpenDossierDocumentFromWikiLink={(relativePath) => handleOpenDossierDocument(relativePath, "wikilink")}
                onOpenSourceDocumentFromWikiLink={(relativePath) => handleOpenSourceDocument(relativePath, "wikilink")}
                onOpenLeadDocument={(relativePath) => handleOpenLeadDocument(relativePath, "home")}
                onOpenLeadDocumentFromWikiLink={(relativePath) => handleOpenLeadDocument(relativePath, "wikilink")}
                onOpenFindingDocument={(relativePath) => handleOpenFindingDocument(relativePath, "home")}
                onOpenFindingDocumentFromWikiLink={(relativePath) => handleOpenFindingDocument(relativePath, "wikilink")}
                onOpenAllegationDocument={(relativePath) => handleOpenAllegationDocument(relativePath, "home")}
                onOpenAllegationDocumentFromWikiLink={(relativePath) =>
                  handleOpenAllegationDocument(relativePath, "wikilink")
                }
                onOpenSourceDocument={(relativePath) => handleOpenSourceDocument(relativePath, "home")}
                onOpenInvestigationDocument={(documentKind, relativePath) =>
                  documentKind === "finding"
                    ? handleOpenFindingDocument(relativePath, "graph")
                    : handleOpenAllegationDocument(relativePath, "graph")
                }
                onSelectCommand={handleSelectViewerCommand}
                onNavigateDossierSection={handleSelectView}
                onNavigateDossierFilter={handleSelectDossierFilter}
              />
            </SidebarInset>
            {isRightOpen ? (
              <ChatPanel
                {...chatPanelProps}
                commandDraft={chatCommandDraft}
                commandDraftVersion={chatCommandDraftVersion}
              />
            ) : null}
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}
