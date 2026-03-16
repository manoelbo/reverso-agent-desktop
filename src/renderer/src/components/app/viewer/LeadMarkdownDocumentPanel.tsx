"use client"

import type { JSX } from "react"
import { useEffect, useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon } from "@hugeicons/core-free-icons"

import { buildLeadsLookup, type SelectedLeadDocument } from "@/components/app/leads/types"
import { readLeadDocument, subscribeLeadsChanges } from "@/components/app/leads/workspace-client"
import { buildDossierLookup } from "@/components/app/dossier/types"
import { EditorialDossierTemplate } from "@/components/app/markdown/templates/EditorialDossierTemplate"
import {
  injectDynamicBacklinks,
  injectPdfMentionsAsWikiLinks,
} from "@/components/app/markdown/wiki-linking"
import { buildSourcesPreviewLookup } from "@/components/app/sources/types"
import { createWorkspaceWikiLinkResolver } from "@/components/app/markdown/wiki-link-resolver"
import { buildInvestigationLookup } from "@/components/app/investigation/types"
import type { DossierIndexPayload } from "../../../../../shared/workspace-markdown"
import type { LeadDocumentPayload, LeadsIndexPayload } from "../../../../../shared/workspace-leads"
import type { InvestigationIndexPayload } from "../../../../../shared/workspace-investigation"
import type { SourcesIndexPayload } from "../../../../../shared/workspace-sources"
import { Skeleton } from "@/components/ui/skeleton"

type LeadMarkdownDocumentPanelProps = {
  selectedDocument: SelectedLeadDocument
  leadsIndex: LeadsIndexPayload | null
  dossierIndex: DossierIndexPayload | null
  investigationIndex: InvestigationIndexPayload | null
  sourcesIndex: SourcesIndexPayload | null
  onOpenDossierDocument: (relativePath: string) => void
  onOpenLeadDocument: (relativePath: string) => void
  onOpenFindingDocument: (relativePath: string) => void
  onOpenAllegationDocument: (relativePath: string) => void
  onOpenSourceDocument: (relativePath: string) => void
  onOpenDocument: (relativePath: string) => void
}

export function LeadMarkdownDocumentPanel({
  selectedDocument,
  leadsIndex,
  dossierIndex,
  investigationIndex,
  sourcesIndex,
  onOpenDossierDocument,
  onOpenLeadDocument,
  onOpenFindingDocument,
  onOpenAllegationDocument,
  onOpenSourceDocument,
  onOpenDocument,
}: LeadMarkdownDocumentPanelProps): JSX.Element {
  const [document, setDocument] = useState<LeadDocumentPayload | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleted, setIsDeleted] = useState(false)
  const lookup = useMemo(() => buildLeadsLookup(leadsIndex), [leadsIndex])
  const dossierLookup = useMemo(() => buildDossierLookup(dossierIndex), [dossierIndex])
  const investigationLookup = useMemo(() => buildInvestigationLookup(investigationIndex), [investigationIndex])
  const sourceLookup = useMemo(() => buildSourcesPreviewLookup(sourcesIndex), [sourcesIndex])

  useEffect(() => {
    let isMounted = true
    const load = async (): Promise<void> => {
      setIsLoading(true)
      setError(null)
      setIsDeleted(false)
      try {
        const payload = await readLeadDocument(selectedDocument.relativePath)
        if (!isMounted) return
        if (!payload) {
          setError("Leads read API unavailable.")
          return
        }
        setDocument(payload)
      } catch (loadError) {
        if (!isMounted) return
        setError(loadError instanceof Error ? loadError.message : "Failed to load lead document.")
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void load()
    return () => {
      isMounted = false
    }
  }, [selectedDocument.relativePath])

  useEffect(() => {
    const unsubscribe = subscribeLeadsChanges((event) => {
      if (event.kind === "deleted" && event.relativePath === selectedDocument.relativePath) {
        setIsDeleted(true)
        setError("The opened lead was removed from filesystem.")
        return
      }

      if (event.kind === "renamed" && event.oldRelativePath === selectedDocument.relativePath) {
        onOpenDocument(event.newRelativePath)
        return
      }

      if (event.kind === "changed" && event.relativePath === selectedDocument.relativePath) {
        void readLeadDocument(selectedDocument.relativePath)
          .then((payload) => {
            if (!payload) return
            setDocument(payload)
            setError(null)
            setIsDeleted(false)
          })
          .catch((refreshError) => {
            setError(refreshError instanceof Error ? refreshError.message : "Failed to refresh lead document.")
          })
      }
    })
    return () => unsubscribe()
  }, [onOpenDocument, selectedDocument.relativePath])

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      {isLoading ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-2/5" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Alert02Icon} size={14} strokeWidth={1.8} />
            <span>{error}</span>
          </div>
          {isDeleted ? <p className="mt-1 text-xs">Navigate to another lead in sidebar or home table.</p> : null}
        </div>
      ) : null}

      <div className="min-h-0 flex-1">
        {document ? (
          (() => {
            const wikiLinkResolver = createWorkspaceWikiLinkResolver({
              dossierLookup: dossierLookup,
              sourcesLookup: sourceLookup,
              leadsLookup: lookup,
              investigationLookup,
              currentDocumentPath: `leads/${document.relativePath}`,
            })

            const contentWithPdfLinks = injectPdfMentionsAsWikiLinks(document.content, sourceLookup)
            const contentWithBacklinks = injectDynamicBacklinks(
              contentWithPdfLinks,
              wikiLinkResolver,
              `leads/${document.relativePath}`
            )

            return (
              <EditorialDossierTemplate
                content={contentWithBacklinks}
                relativePath={`leads/${document.relativePath}`}
                wikiLinkResolver={wikiLinkResolver}
                onWikiNavigate={onOpenDossierDocument}
                onSourceNavigate={onOpenSourceDocument}
                onLeadNavigate={onOpenLeadDocument}
                onFindingNavigate={onOpenFindingDocument}
                onAllegationNavigate={onOpenAllegationDocument}
              />
            )
          })()
        ) : null}
      </div>
    </section>
  )
}
