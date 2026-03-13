"use client"

import type { CSSProperties, JSX } from "react"
import { useEffect, useState } from "react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { PanelLeftIcon, PanelRightIcon } from "@hugeicons/core-free-icons"

import { AppSidebar, type ShellViewId } from "@/components/app/AppSidebar"
import { listDossierIndex, subscribeDossierChanges } from "@/components/app/dossier/workspace-client"
import type { SelectedDossierDocument } from "@/components/app/dossier/types"
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

  const handleSelectView = (view: ShellViewId): void => {
    setActiveView(view)
    setDossierFilter(null)
    setDossierFilterVersion((value) => value + 1)
    const isDossierView = view === "dossier-people" || view === "dossier-groups" || view === "dossier-places" || view === "dossier-timeline"
    if (!isDossierView) {
      setSelectedDossierDocument(null)
    }
  }

  const handleSelectDossierFilter = (filter: DossierViewFilter): void => {
    setActiveView(filter.view)
    setDossierFilter(filter)
    setDossierFilterVersion((value) => value + 1)
  }

  const handleOpenDossierDocument = (relativePath: string, source: SelectedDossierDocument["source"] = "sidebar"): void => {
    setSelectedDossierDocument({ relativePath, source })
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
              onSelectView={handleSelectView}
              onSelectDossierFilter={handleSelectDossierFilter}
              onOpenDossierDocument={(relativePath) => handleOpenDossierDocument(relativePath, "sidebar")}
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
                onOpenDossierDocument={(relativePath) => handleOpenDossierDocument(relativePath, "home")}
                onCloseDossierDocument={() => setSelectedDossierDocument(null)}
                onOpenDossierDocumentFromWikiLink={(relativePath) => handleOpenDossierDocument(relativePath, "wikilink")}
              />
            </SidebarInset>
            {isRightOpen ? <ChatPanel {...chatPanelProps} /> : null}
          </div>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}
