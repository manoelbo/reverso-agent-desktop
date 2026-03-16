"use client"

import type { JSX } from "react"
import { useEffect, useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert02Icon,
  Building05Icon,
  Calendar02Icon,
  Location01Icon,
  RefreshIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"

import { ReversoMarkdown } from "@/components/app/markdown/ReversoMarkdown"
import {
  buildDossierLookup,
  normalizeWikiKey,
  toDisplayDocumentName,
  type SelectedDossierDocument,
} from "@/components/app/dossier/types"
import { readDossierDocument, subscribeDossierChanges } from "@/components/app/dossier/workspace-client"
import type {
  DossierDocumentPayload,
  DossierIndexPayload,
  DossierSectionKey,
} from "../../../../../shared/workspace-markdown"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

type DossierMarkdownDocumentPanelProps = {
  selectedDocument: SelectedDossierDocument
  dossierIndex: DossierIndexPayload | null
  section?: DossierSectionKey
  onOpenDocument: (relativePath: string) => void
}

type SectionVisualConfig = {
  label: string
  subtitle: string
  containerClassName: string
  headerClassName: string
  titleClassName: string
  accentClassName: string
  variant: "default" | "editorial" | "evidence" | "analyst"
  icon: typeof UserGroupIcon
}

const sectionVisualMap: Record<DossierSectionKey, SectionVisualConfig> = {
  people: {
    label: "People",
    subtitle: "Perfil narrativo e conexoes pessoais",
    containerClassName: "border-indigo-500/25 bg-gradient-to-b from-indigo-500/5 via-card to-card",
    headerClassName: "rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3",
    titleClassName: "tracking-tight",
    accentClassName: "border-indigo-500/30 bg-indigo-500/10 text-foreground",
    variant: "editorial",
    icon: UserGroupIcon,
  },
  groups: {
    label: "Groups",
    subtitle: "Estrutura institucional e organizacional",
    containerClassName: "border-sky-500/25 bg-gradient-to-b from-sky-500/5 via-card to-card",
    headerClassName: "rounded-xl border border-sky-500/20 bg-sky-500/5 p-3",
    titleClassName: "tracking-tight",
    accentClassName: "border-sky-500/30 bg-sky-500/10 text-foreground",
    variant: "default",
    icon: Building05Icon,
  },
  places: {
    label: "Places",
    subtitle: "Contexto geografico e localizacao",
    containerClassName: "border-emerald-500/25 bg-gradient-to-b from-emerald-500/5 via-card to-card",
    headerClassName: "rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3",
    titleClassName: "font-semibold tracking-wide",
    accentClassName: "border-emerald-500/30 bg-emerald-500/10 text-foreground",
    variant: "analyst",
    icon: Location01Icon,
  },
  timeline: {
    label: "Timeline",
    subtitle: "Leitura cronologica de eventos e evidencias",
    containerClassName: "border-amber-500/25 bg-gradient-to-b from-amber-500/5 via-card to-card",
    headerClassName: "rounded-xl border border-amber-500/20 bg-amber-500/5 p-3",
    titleClassName: "font-semibold tracking-wide",
    accentClassName: "border-amber-500/30 bg-amber-500/10 text-foreground",
    variant: "evidence",
    icon: Calendar02Icon,
  },
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

function resolveSection(relativePath: string, explicitSection?: DossierSectionKey): DossierSectionKey {
  if (explicitSection) return explicitSection
  if (relativePath.startsWith("people/")) return "people"
  if (relativePath.startsWith("groups/")) return "groups"
  if (relativePath.startsWith("places/")) return "places"
  return "timeline"
}

export function DossierMarkdownDocumentPanel({
  selectedDocument,
  dossierIndex,
  section,
  onOpenDocument,
}: DossierMarkdownDocumentPanelProps): JSX.Element {
  const [document, setDocument] = useState<DossierDocumentPayload | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDeleted, setIsDeleted] = useState(false)
  const [unresolvedWikiLink, setUnresolvedWikiLink] = useState<string | null>(null)
  const lookup = useMemo(() => buildDossierLookup(dossierIndex), [dossierIndex])
  const selectedMeta = lookup.byRelativePath.get(selectedDocument.relativePath)
  const resolvedSection = resolveSection(selectedDocument.relativePath, section ?? selectedMeta?.section)
  const visual = sectionVisualMap[resolvedSection]

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
    <section
      className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border p-5 md:p-6 ${visual.containerClassName}`}
    >
      <header className={`flex flex-col gap-3 ${visual.headerClassName}`}>
        <div className="min-w-0 flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className={`truncate text-lg text-foreground ${visual.titleClassName}`}>
              {document?.title ??
                selectedMeta?.title ??
                toDisplayDocumentName({
                  title: "",
                  fileStem: selectedDocument.relativePath.replace(/^.*\//, "").replace(/\.md$/i, ""),
                })}
            </h2>
            <Badge variant="outline" className={visual.accentClassName}>
              <HugeiconsIcon icon={visual.icon} size={12} strokeWidth={1.8} className="mr-1" />
              {visual.label}
            </Badge>
            <Badge variant="secondary">Source: {selectedDocument.source}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{visual.subtitle}</p>
          <p className="truncate font-mono text-xs text-muted-foreground">{selectedDocument.relativePath}</p>
          <p className="text-xs text-muted-foreground">
            Documento em modo de leitura; use sidebar ou breadcrumb para navegar.
          </p>
          {document ? (
            <p className="text-xs text-muted-foreground">Atualizado em {formatUpdatedAt(document.updatedAt)}</p>
          ) : null}
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
                  setError(
                    refreshError instanceof Error ? refreshError.message : "Falha ao atualizar documento.",
                  )
                })
                .finally(() => setIsLoading(false))
            }}
          >
            <HugeiconsIcon icon={RefreshIcon} size={14} strokeWidth={1.8} />
            <span>Refresh</span>
          </Button>
        </div>
      </header>

      <Separator className="my-3" />

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
          {isDeleted ? (
            <p className="mt-1 text-xs">
              Navegue por outro item na sidebar para continuar.
            </p>
          ) : null}
        </div>
      ) : null}
      {unresolvedWikiLink ? (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-xs text-foreground">
          Wikilink nao resolvido: <strong>{unresolvedWikiLink}</strong>
        </div>
      ) : null}

      <ScrollArea className="mt-1 min-h-0 flex-1 pr-1">
        {document ? (
          <ReversoMarkdown
            variant={visual.variant}
            content={document.content}
            wikiLinkShowIcon={true}
            wikiLinkResolver={(value) => {
              const key = normalizeWikiKey(value)
              const matches = lookup.byWikiKey.get(key)
              return matches?.[0]
                ? `dossier://${matches[0].relativePath}`
                : `dossier://unresolved/${encodeURIComponent(value)}`
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
      </ScrollArea>
    </section>
  )
}
