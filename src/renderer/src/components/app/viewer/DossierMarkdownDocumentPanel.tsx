"use client"

import type { JSX } from "react"
import { useEffect, useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon, RefreshIcon, Alert02Icon } from "@hugeicons/core-free-icons"

import { ReversoMarkdown } from "@/components/app/markdown/ReversoMarkdown"
import { buildDossierLookup, normalizeWikiKey, toDisplayDocumentName, type SelectedDossierDocument } from "@/components/app/dossier/types"
import { readDossierDocument, subscribeDossierChanges } from "@/components/app/dossier/workspace-client"
import type { DossierDocumentPayload, DossierIndexPayload } from "../../../../../shared/workspace-markdown"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type DossierMarkdownDocumentPanelProps = {
  selectedDocument: SelectedDossierDocument
  dossierIndex: DossierIndexPayload | null
  onClose: () => void
  onOpenDocument: (relativePath: string) => void
}

function formatUpdatedAt(value: string): string {
  return new Date(value).toLocaleString("pt-BR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function DossierMarkdownDocumentPanel({
  selectedDocument,
  dossierIndex,
  onClose,
  onOpenDocument,
}: DossierMarkdownDocumentPanelProps): JSX.Element {
  const [document, setDocument] = useState<DossierDocumentPayload | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleted, setIsDeleted] = useState(false)
  const [unresolvedWikiLink, setUnresolvedWikiLink] = useState<string | null>(null)
  const lookup = useMemo(() => buildDossierLookup(dossierIndex), [dossierIndex])
  const selectedMeta = lookup.byRelativePath.get(selectedDocument.relativePath)

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
        void readDossierDocument(selectedDocument.relativePath).then((payload) => {
          if (!payload) return
          setDocument(payload)
          setIsDeleted(false)
          setError(null)
        }).catch((refreshError) => {
          setError(refreshError instanceof Error ? refreshError.message : "Falha ao atualizar documento.")
        })
      }
    })
    return () => unsubscribe()
  }, [onOpenDocument, selectedDocument.relativePath])

  return (
    <section className="space-y-3 rounded-xl border border-border/70 bg-card/70 p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-semibold text-foreground">
              {document?.title ??
                selectedMeta?.title ??
                toDisplayDocumentName({
                  title: "",
                  fileStem: selectedDocument.relativePath.replace(/^.*\//, "").replace(/\.md$/i, ""),
                })}
            </h2>
            <Badge variant="outline">Markdown</Badge>
            <Badge variant="secondary">Source: {selectedDocument.source}</Badge>
          </div>
          <p className="truncate font-mono text-xs text-muted-foreground">{selectedDocument.relativePath}</p>
          {document ? <p className="text-xs text-muted-foreground">Atualizado em {formatUpdatedAt(document.updatedAt)}</p> : null}
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              if (!document) return
              setIsLoading(true)
              readDossierDocument(document.relativePath)
                .then((payload) => {
                  if (!payload) return
                  setDocument(payload)
                  setError(null)
                  setIsDeleted(false)
                })
                .catch((refreshError) => {
                  setError(refreshError instanceof Error ? refreshError.message : "Falha ao atualizar documento.")
                })
                .finally(() => setIsLoading(false))
            }}
          >
            <HugeiconsIcon icon={RefreshIcon} size={14} strokeWidth={1.8} />
            <span>Refresh</span>
          </Button>
          <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={onClose}>
            <HugeiconsIcon icon={Cancel01Icon} size={14} strokeWidth={1.8} />
            <span>Fechar</span>
          </Button>
        </div>
      </header>

      {isLoading ? <p className="text-sm text-muted-foreground">Carregando documento...</p> : null}
      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Alert02Icon} size={14} strokeWidth={1.8} />
            <span>{error}</span>
          </div>
          {isDeleted ? <p className="mt-1 text-xs">Feche o painel ou selecione outro arquivo para continuar.</p> : null}
        </div>
      ) : null}
      {unresolvedWikiLink ? (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
          Wikilink nao resolvido: <strong>{unresolvedWikiLink}</strong>
        </div>
      ) : null}

      {document ? (
        <ReversoMarkdown
          variant="editorial"
          content={document.content}
          wikiLinkResolver={(value) => {
            const key = normalizeWikiKey(value)
            const matches = lookup.byWikiKey.get(key)
            return matches?.[0] ? `dossier://${matches[0].relativePath}` : `dossier://unresolved/${encodeURIComponent(value)}`
          }}
          onWikiLinkClick={(value) => {
            const key = normalizeWikiKey(value)
            const matches = lookup.byWikiKey.get(key)
            if (!matches || matches.length === 0) {
              setUnresolvedWikiLink(value)
              return
            }
            setUnresolvedWikiLink(null)
            onOpenDocument(matches[0].relativePath)
          }}
        />
      ) : null}
    </section>
  )
}
