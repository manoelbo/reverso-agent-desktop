"use client"

import type { JSX } from "react"
import { useEffect, useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert02Icon,
} from "@hugeicons/core-free-icons"

import { EditorialDossierTemplate } from "@/components/app/markdown/templates/EditorialDossierTemplate"
import {
  injectDynamicBacklinks,
  injectPdfMentionsAsWikiLinks,
} from "@/components/app/markdown/wiki-linking"
import {
  buildDossierLookup,
  type SelectedDossierDocument,
} from "@/components/app/dossier/types"
import { buildSourcesPreviewLookup } from "@/components/app/sources/types"
import { createWorkspaceWikiLinkResolver } from "@/components/app/markdown/wiki-link-resolver"
import { buildLeadsLookup } from "@/components/app/leads/types"
import { buildInvestigationLookup } from "@/components/app/investigation/types"
import { readDossierDocument, subscribeDossierChanges } from "@/components/app/dossier/workspace-client"
import type {
  DossierDocumentPayload,
  DossierIndexPayload,
} from "../../../../../shared/workspace-markdown"
import type { LeadsIndexPayload } from "../../../../../shared/workspace-leads"
import type { InvestigationIndexPayload } from "../../../../../shared/workspace-investigation"
import type { SourcesIndexPayload } from "../../../../../shared/workspace-sources"
import { Skeleton } from "@/components/ui/skeleton"

type DossierMarkdownDocumentPanelProps = {
  selectedDocument: SelectedDossierDocument
  dossierIndex: DossierIndexPayload | null
  sourcesIndex: SourcesIndexPayload | null
  leadsIndex: LeadsIndexPayload | null
  investigationIndex: InvestigationIndexPayload | null
  onOpenDocument: (relativePath: string) => void
  onOpenLeadDocument: (relativePath: string) => void
  onOpenFindingDocument: (relativePath: string) => void
  onOpenAllegationDocument: (relativePath: string) => void
  onOpenSourceDocument: (relativePath: string) => void
}

export function DossierMarkdownDocumentPanel({
  selectedDocument,
  dossierIndex,
  sourcesIndex,
  leadsIndex,
  investigationIndex,
  onOpenDocument,
  onOpenLeadDocument,
  onOpenFindingDocument,
  onOpenAllegationDocument,
  onOpenSourceDocument,
}: DossierMarkdownDocumentPanelProps): JSX.Element {
  const [document, setDocument] = useState<DossierDocumentPayload | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleted, setIsDeleted] = useState(false)
  const [unresolvedWikiLink, setUnresolvedWikiLink] = useState<string | null>(null)
  const lookup = useMemo(() => buildDossierLookup(dossierIndex), [dossierIndex])
  const sourcesLookup = useMemo(() => buildSourcesPreviewLookup(sourcesIndex), [sourcesIndex])
  const leadsLookup = useMemo(() => buildLeadsLookup(leadsIndex), [leadsIndex])
  const investigationLookup = useMemo(() => buildInvestigationLookup(investigationIndex), [investigationIndex])

  useEffect(() => {
    let isMounted = true
    const load = async (): Promise<void> => {
      setIsLoading(true)
      setError(null)
      setIsDeleted(false)
      setUnresolvedWikiLink(null)
      try {
        const payload = await readDossierDocument(selectedDocument.relativePath)
        if (!isMounted) return
        if (!payload) {
          setError("API de leitura do dossier indisponivel.")
          return
        }
        setDocument(payload)
      } catch (loadError) {
        if (!isMounted) return
        setError(loadError instanceof Error ? loadError.message : "Falha ao carregar documento.")
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
    const unsubscribe = subscribeDossierChanges((event) => {
      if (event.kind === "deleted" && event.relativePath === selectedDocument.relativePath) {
        setIsDeleted(true)
        setError("O arquivo aberto foi removido do filesystem.")
        return
      }

      if (event.kind === "renamed" && event.oldRelativePath === selectedDocument.relativePath) {
        onOpenDocument(event.newRelativePath)
        return
      }

      if (event.kind === "changed" && event.relativePath === selectedDocument.relativePath) {
        void readDossierDocument(selectedDocument.relativePath)
          .then((payload) => {
            if (!payload) return
            setDocument(payload)
            setIsDeleted(false)
            setError(null)
          })
          .catch((refreshError) => {
            setError(refreshError instanceof Error ? refreshError.message : "Falha ao atualizar documento.")
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
          {isDeleted ? <p className="mt-1 text-xs">Navegue por outro item na sidebar para continuar.</p> : null}
        </div>
      ) : null}
      {unresolvedWikiLink ? (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-xs text-foreground">
          Wikilink nao resolvido: <strong>{unresolvedWikiLink}</strong>
        </div>
      ) : null}

      <div className="min-h-0 flex-1">
        {document ? (
          (() => {
            const wikiLinkResolver = createWorkspaceWikiLinkResolver({
              dossierLookup: lookup,
              sourcesLookup: sourcesLookup,
              leadsLookup,
              investigationLookup,
              currentDocumentPath: document.relativePath,
            })
            const contentWithPdfLinks = injectPdfMentionsAsWikiLinks(document.content, sourcesLookup)
            const contentWithBacklinks = injectDynamicBacklinks(
              contentWithPdfLinks,
              wikiLinkResolver,
              document.relativePath
            )
            return (
              <EditorialDossierTemplate
                content={contentWithBacklinks}
                relativePath={document.relativePath}
                wikiLinkResolver={wikiLinkResolver}
                onWikiNavigate={(relativePath) => {
                  setUnresolvedWikiLink(null)
                  onOpenDocument(relativePath)
                }}
                onLeadNavigate={(relativePath) => {
                  setUnresolvedWikiLink(null)
                  onOpenLeadDocument(relativePath)
                }}
                onFindingNavigate={(relativePath) => {
                  setUnresolvedWikiLink(null)
                  onOpenFindingDocument(relativePath)
                }}
                onAllegationNavigate={(relativePath) => {
                  setUnresolvedWikiLink(null)
                  onOpenAllegationDocument(relativePath)
                }}
                onSourceNavigate={(relativePath) => {
                  setUnresolvedWikiLink(null)
                  onOpenSourceDocument(relativePath)
                }}
                onWikiUnresolved={(value) => {
                  setUnresolvedWikiLink(value)
                }}
              />
            )
          })()
        ) : null}
      </div>
    </section>
  )
}
