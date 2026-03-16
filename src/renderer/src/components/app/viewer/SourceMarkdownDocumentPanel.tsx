"use client"

import { useEffect, useMemo, useState, type JSX } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Alert02Icon } from "@hugeicons/core-free-icons"

import { buildDossierLookup } from "@/components/app/dossier/types"
import {
  injectDynamicBacklinks,
  injectEntityMentionsAsWikiLinks,
  injectPdfMentionsAsWikiLinks,
} from "@/components/app/markdown/wiki-linking"
import { listSourcesIndex, readSourceDocument, subscribeSourcesChanges } from "@/components/app/sources/workspace-client"
import { buildSourcesPreviewLookup, type SelectedSourceDocument } from "@/components/app/sources/types"
import { SourcePreviewTemplate } from "@/components/app/viewer/SourcePreviewTemplate"
import { createWorkspaceWikiLinkResolver } from "@/components/app/markdown/wiki-link-resolver"
import { buildLeadsLookup } from "@/components/app/leads/types"
import { buildInvestigationLookup } from "@/components/app/investigation/types"
import type { DossierIndexPayload } from "../../../../../shared/workspace-markdown"
import type { LeadsIndexPayload } from "../../../../../shared/workspace-leads"
import type { InvestigationIndexPayload } from "../../../../../shared/workspace-investigation"
import type { SourceDocumentPayload, SourcesIndexPayload } from "../../../../../shared/workspace-sources"
import { Skeleton } from "@/components/ui/skeleton"

type SourceMarkdownDocumentPanelProps = {
  selectedDocument: SelectedSourceDocument
  sourcesIndex: SourcesIndexPayload | null
  dossierIndex: DossierIndexPayload | null
  leadsIndex: LeadsIndexPayload | null
  investigationIndex: InvestigationIndexPayload | null
  onOpenDossierDocument: (relativePath: string) => void
  onOpenLeadDocument: (relativePath: string) => void
  onOpenFindingDocument: (relativePath: string) => void
  onOpenAllegationDocument: (relativePath: string) => void
  onOpenSourceDocument: (relativePath: string) => void
}

export function SourceMarkdownDocumentPanel({
  selectedDocument,
  sourcesIndex,
  dossierIndex,
  leadsIndex,
  investigationIndex,
  onOpenDossierDocument,
  onOpenLeadDocument,
  onOpenFindingDocument,
  onOpenAllegationDocument,
  onOpenSourceDocument,
}: SourceMarkdownDocumentPanelProps): JSX.Element {
  const [document, setDocument] = useState<SourceDocumentPayload | null>(null)
  const [liveSourcesIndex, setLiveSourcesIndex] = useState<SourcesIndexPayload | null>(sourcesIndex)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleted, setIsDeleted] = useState(false)
  const lookup = useMemo(() => buildDossierLookup(dossierIndex), [dossierIndex])
  const sourceLookup = useMemo(() => buildSourcesPreviewLookup(liveSourcesIndex), [liveSourcesIndex])
  const leadsLookup = useMemo(() => buildLeadsLookup(leadsIndex), [leadsIndex])
  const investigationLookup = useMemo(() => buildInvestigationLookup(investigationIndex), [investigationIndex])
  const dossierEntityNames = useMemo(
    () =>
      (dossierIndex?.allFiles ?? [])
        .map((item) => item.title?.trim())
        .filter((value): value is string => Boolean(value && value.length > 0)),
    [dossierIndex]
  )

  useEffect(() => {
    setLiveSourcesIndex(sourcesIndex)
  }, [sourcesIndex])

  useEffect(() => {
    let disposed = false
    const refreshSourcesIndex = async (): Promise<void> => {
      const payload = await listSourcesIndex()
      if (disposed || !payload) return
      setLiveSourcesIndex(payload)
    }
    void refreshSourcesIndex()
    return () => {
      disposed = true
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    const load = async (): Promise<void> => {
      setIsLoading(true)
      setError(null)
      setIsDeleted(false)
      try {
        const payload = await readSourceDocument(selectedDocument.relativePath)
        if (!isMounted) return
        if (!payload) {
          setError("Sources read API unavailable.")
          return
        }
        setDocument(payload)
      } catch (loadError) {
        if (!isMounted) return
        setError(loadError instanceof Error ? loadError.message : "Failed to load preview.")
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
    const unsubscribe = subscribeSourcesChanges((event) => {
      if (event.kind === "checkpoint" || event.kind === "artifacts") {
        void listSourcesIndex().then((payload) => {
          if (!payload) return
          setLiveSourcesIndex(payload)
        })
        void readSourceDocument(selectedDocument.relativePath)
          .then((payload) => {
            if (!payload) return
            setDocument(payload)
            setError(null)
            setIsDeleted(false)
          })
          .catch((refreshError) => {
            setError(refreshError instanceof Error ? refreshError.message : "Failed to refresh preview.")
            setIsDeleted(true)
          })
      }
    })
    return () => unsubscribe()
  }, [selectedDocument.relativePath])

  useEffect(() => {
    const interval = window.setInterval(() => {
      void listSourcesIndex().then((payload) => {
        if (!payload) return
        setLiveSourcesIndex((current) => {
          if (current?.generatedAt === payload.generatedAt) return current
          return payload
        })
      })
      void readSourceDocument(selectedDocument.relativePath).then((payload) => {
        if (!payload) return
        setDocument((current) => {
          if (current && current.updatedAt === payload.updatedAt && current.sizeBytes === payload.sizeBytes) {
            return current
          }
          return payload
        })
      })
    }, 25000)
    return () => window.clearInterval(interval)
  }, [selectedDocument.relativePath])

  const previewMeta = useMemo(
    () => liveSourcesIndex?.previews.find((item) => item.relativePath === selectedDocument.relativePath),
    [selectedDocument.relativePath, liveSourcesIndex]
  )

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-2/5" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Alert02Icon} size={14} strokeWidth={1.8} />
            <span>{error}</span>
          </div>
          {isDeleted ? <p className="mt-1 text-xs">Select another item in Sources to continue.</p> : null}
        </div>
      ) : null}

      {document ? (
        (() => {
          const wikiLinkResolver = createWorkspaceWikiLinkResolver({
            dossierLookup: lookup,
            sourcesLookup: sourceLookup,
            leadsLookup,
            investigationLookup,
            currentDocumentPath: document.relativePath,
          })

          const contentWithPdfLinks = injectPdfMentionsAsWikiLinks(document.content, sourceLookup)
          const contentWithEntityLinks = injectEntityMentionsAsWikiLinks(contentWithPdfLinks, dossierEntityNames)
          const contentWithBacklinks = injectDynamicBacklinks(
            contentWithEntityLinks,
            wikiLinkResolver,
            document.relativePath
          )

          return (
            <SourcePreviewTemplate
              content={contentWithBacklinks}
              relativePath={document.relativePath}
              title={previewMeta?.title ?? document.title}
              wikiLinkResolver={wikiLinkResolver}
              onNavigateDossier={onOpenDossierDocument}
              onNavigateSource={onOpenSourceDocument}
              onNavigateLead={onOpenLeadDocument}
              onNavigateFinding={onOpenFindingDocument}
              onNavigateAllegation={onOpenAllegationDocument}
            />
          )
        })()
      ) : null}
    </section>
  )
}
