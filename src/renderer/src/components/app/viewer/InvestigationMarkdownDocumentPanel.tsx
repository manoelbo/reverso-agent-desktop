"use client"

import { useEffect, useMemo, useState, type JSX } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon } from "@hugeicons/core-free-icons"

import { buildDossierLookup } from "@/components/app/dossier/types"
import { buildLeadsLookup } from "@/components/app/leads/types"
import { buildSourcesPreviewLookup } from "@/components/app/sources/types"
import { buildInvestigationLookup, type SelectedInvestigationDocument } from "@/components/app/investigation/types"
import { readInvestigationDocument, subscribeInvestigationChanges } from "@/components/app/investigation/workspace-client"
import {
  injectDynamicBacklinks,
  injectPdfMentionsAsWikiLinks,
} from "@/components/app/markdown/wiki-linking"
import { createWorkspaceWikiLinkResolver } from "@/components/app/markdown/wiki-link-resolver"
import { EditorialDossierTemplate } from "@/components/app/markdown/templates/EditorialDossierTemplate"
import type { DossierIndexPayload } from "../../../../../shared/workspace-markdown"
import type { LeadsIndexPayload } from "../../../../../shared/workspace-leads"
import type { SourcesIndexPayload } from "../../../../../shared/workspace-sources"
import type { InvestigationDocumentPayload, InvestigationIndexPayload } from "../../../../../shared/workspace-investigation"
import { Skeleton } from "@/components/ui/skeleton"

type InvestigationMarkdownDocumentPanelProps = {
  selectedDocument: SelectedInvestigationDocument
  dossierIndex: DossierIndexPayload | null
  leadsIndex: LeadsIndexPayload | null
  sourcesIndex: SourcesIndexPayload | null
  investigationIndex: InvestigationIndexPayload | null
  onOpenDossierDocument: (relativePath: string) => void
  onOpenLeadDocument: (relativePath: string) => void
  onOpenSourceDocument: (relativePath: string) => void
  onOpenFindingDocument: (relativePath: string) => void
  onOpenAllegationDocument: (relativePath: string) => void
}

function toTemplatePath(document: InvestigationDocumentPayload): string {
  return `${document.kind === "allegation" ? "allegations" : "findings"}/${document.relativePath}`
}

export function InvestigationMarkdownDocumentPanel({
  selectedDocument,
  dossierIndex,
  leadsIndex,
  sourcesIndex,
  investigationIndex,
  onOpenDossierDocument,
  onOpenLeadDocument,
  onOpenSourceDocument,
  onOpenFindingDocument,
  onOpenAllegationDocument,
}: InvestigationMarkdownDocumentPanelProps): JSX.Element {
  const [document, setDocument] = useState<InvestigationDocumentPayload | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleted, setIsDeleted] = useState(false)
  const [unresolvedWikiLink, setUnresolvedWikiLink] = useState<string | null>(null)

  const dossierLookup = useMemo(() => buildDossierLookup(dossierIndex), [dossierIndex])
  const leadsLookup = useMemo(() => buildLeadsLookup(leadsIndex), [leadsIndex])
  const sourcesLookup = useMemo(() => buildSourcesPreviewLookup(sourcesIndex), [sourcesIndex])
  const investigationLookup = useMemo(() => buildInvestigationLookup(investigationIndex), [investigationIndex])
  useEffect(() => {
    let mounted = true
    const load = async (): Promise<void> => {
      setIsLoading(true)
      setError(null)
      setIsDeleted(false)
      setUnresolvedWikiLink(null)
      try {
        const payload = await readInvestigationDocument(selectedDocument.documentKind, selectedDocument.relativePath)
        if (!mounted) return
        if (!payload) {
          setError("Investigation read API unavailable.")
          return
        }
        setDocument(payload)
      } catch (loadError) {
        if (!mounted) return
        setError(loadError instanceof Error ? loadError.message : "Failed to load investigation document.")
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    void load()
    return () => {
      mounted = false
    }
  }, [selectedDocument.documentKind, selectedDocument.relativePath])

  useEffect(() => {
    const unsubscribe = subscribeInvestigationChanges((event) => {
      if (event.documentKind !== selectedDocument.documentKind) return

      if (event.kind === "deleted" && event.relativePath === selectedDocument.relativePath) {
        setIsDeleted(true)
        setError("The opened document was removed from filesystem.")
        return
      }

      if (event.kind === "renamed" && event.oldRelativePath === selectedDocument.relativePath) {
        if (selectedDocument.documentKind === "finding") onOpenFindingDocument(event.newRelativePath)
        else onOpenAllegationDocument(event.newRelativePath)
        return
      }

      if (event.kind === "changed" && event.relativePath === selectedDocument.relativePath) {
        void readInvestigationDocument(selectedDocument.documentKind, selectedDocument.relativePath)
          .then((payload) => {
            if (!payload) return
            setDocument(payload)
            setError(null)
            setIsDeleted(false)
          })
          .catch((refreshError) => {
            setError(refreshError instanceof Error ? refreshError.message : "Failed to refresh document.")
          })
      }
    })
    return () => unsubscribe()
  }, [onOpenAllegationDocument, onOpenFindingDocument, selectedDocument.documentKind, selectedDocument.relativePath])

  const wikiLinkResolver = useMemo(
    () =>
      createWorkspaceWikiLinkResolver({
        dossierLookup,
        leadsLookup,
        investigationLookup,
        sourcesLookup,
        currentDocumentPath: document ? toTemplatePath(document) : "",
      }),
    [document, dossierLookup, leadsLookup, investigationLookup, sourcesLookup]
  )

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
          {isDeleted ? <p className="mt-1 text-xs">Navigate to another item in sidebar or home table.</p> : null}
        </div>
      ) : null}
      {unresolvedWikiLink ? (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-xs text-foreground">
          Wikilink nao resolvido: <strong>{unresolvedWikiLink}</strong>
        </div>
      ) : null}

      <div className="min-h-0 flex-1">
        {document ? (
          <EditorialDossierTemplate
            content={injectDynamicBacklinks(injectPdfMentionsAsWikiLinks(document.content, sourcesLookup), wikiLinkResolver, toTemplatePath(document))}
            relativePath={toTemplatePath(document)}
            wikiLinkResolver={wikiLinkResolver}
            onWikiNavigate={onOpenDossierDocument}
            onLeadNavigate={onOpenLeadDocument}
            onSourceNavigate={onOpenSourceDocument}
            onFindingNavigate={onOpenFindingDocument}
            onAllegationNavigate={onOpenAllegationDocument}
            onWikiUnresolved={(value) => setUnresolvedWikiLink(value)}
          />
        ) : null}
      </div>
    </section>
  )
}
