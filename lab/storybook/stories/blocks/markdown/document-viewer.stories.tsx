import React, { useMemo, useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert02Icon,
  AlertSquareIcon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  BookCheckIcon,
  Calendar02Icon,
  FileUploadIcon,
  FilterHorizontalIcon,
  Location01Icon,
  RefreshIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"

import { ReversoMarkdown } from "@/components/app/markdown/ReversoMarkdown"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// ─── Corpus (real markdown files from 3 domains) ─────────────────────────────
import dossierPersonRaw from "../../../../agent/filesystem/dossier/people/alessandra-araujo-do-vale.md?raw"
import dossierPlaceRaw from "../../../../agent/filesystem/dossier/places/Brazil/Barueri/alameda-madeira-162.md?raw"
import dossierTimelineRaw from "../../../../agent/filesystem/dossier/timeline/2021/2021-05.md?raw"
import investigationLeadRaw from "../../../../agent/filesystem/investigation/leads/lead-consistency-and-justification-of-direct-emergency-contracting.md?raw"
import investigationFindingRaw from "../../../../agent/filesystem/investigation/findings/finding-1.md?raw"
import investigationAllegationRaw from "../../../../agent/filesystem/investigation/allegations/allegation-1.md?raw"
import sourceArtifactIndexRaw from "../../../../agent/filesystem/source/.artifacts/2023-fornecimento-de-cafe-05a8f7a5/index.md?raw"
import sourceArtifactPreviewRaw from "../../../../agent/filesystem/source/.artifacts/2023-deslizamento-rua-arnaldo-teixeira-mendes-1585fd3f/preview.md?raw"

// ─── Types ────────────────────────────────────────────────────────────────────
type CorpusDomain = "dossier" | "investigation" | "source"

type CorpusDoc = {
  id: string
  label: string
  domain: CorpusDomain
  section: string
  content: string
  path: string
}

// ─── Corpus registry ─────────────────────────────────────────────────────────
const CORPUS: CorpusDoc[] = [
  {
    id: "dossier-person",
    label: "Person Profile",
    domain: "dossier",
    section: "People",
    content: dossierPersonRaw,
    path: "dossier/people/alessandra-araujo-do-vale.md",
  },
  {
    id: "dossier-place",
    label: "Place",
    domain: "dossier",
    section: "Places",
    content: dossierPlaceRaw,
    path: "dossier/places/Brazil/Barueri/alameda-madeira-162.md",
  },
  {
    id: "dossier-timeline",
    label: "Timeline",
    domain: "dossier",
    section: "Timeline",
    content: dossierTimelineRaw,
    path: "dossier/timeline/2021/2021-05.md",
  },
  {
    id: "investigation-lead",
    label: "Lead",
    domain: "investigation",
    section: "Leads",
    content: investigationLeadRaw,
    path: "investigation/leads/lead-consistency-and-justification-of-direct-emergency-contracting.md",
  },
  {
    id: "investigation-finding",
    label: "Finding",
    domain: "investigation",
    section: "Findings",
    content: investigationFindingRaw,
    path: "investigation/findings/finding-1.md",
  },
  {
    id: "investigation-allegation",
    label: "Allegation",
    domain: "investigation",
    section: "Allegations",
    content: investigationAllegationRaw,
    path: "investigation/allegations/allegation-1.md",
  },
  {
    id: "source-index",
    label: "Artifact Index",
    domain: "source",
    section: "Source",
    content: sourceArtifactIndexRaw,
    path: "source/.artifacts/2023-fornecimento-de-cafe/index.md",
  },
  {
    id: "source-preview",
    label: "Artifact Preview",
    domain: "source",
    section: "Source",
    content: sourceArtifactPreviewRaw,
    path: "source/.artifacts/2023-deslizamento-arnaldo-teixeira/preview.md",
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function extractFrontmatter(content: string): Record<string, string> {
  const match = /^---\n([\s\S]*?)\n---/.exec(content)
  if (!match) return {}
  const result: Record<string, string> = {}
  for (const line of match[1].split("\n")) {
    if (!line.trim() || line.trimStart().startsWith("-")) continue
    const colonIdx = line.indexOf(":")
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const raw = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, "")
    if (key && raw) result[key] = raw
  }
  return result
}

function extractTitle(content: string, frontmatter: Record<string, string>): string {
  if (frontmatter.title) return frontmatter.title
  if (frontmatter.name) return frontmatter.name
  const h1 = /^# (.+)$/m.exec(content)
  if (h1) return h1[1]
  return "Untitled Document"
}

/** Conteúdo do documento após o primeiro # título (já exibido no header). */
function extractBodyAfterTitle(content: string): string {
  const withoutFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n?/, "").trimStart()
  const lines = withoutFrontmatter.split("\n")
  if (lines.length === 0) return ""
  const firstLine = lines[0]
  if (/^# .+$/.test(firstLine)) {
    return lines.slice(1).join("\n").trimStart()
  }
  return withoutFrontmatter
}

function getDomainIcon(doc: CorpusDoc): typeof UserGroupIcon {
  if (doc.section === "People") return UserGroupIcon
  if (doc.section === "Places") return Location01Icon
  if (doc.section === "Timeline") return Calendar02Icon
  if (doc.section === "Leads") return BookCheckIcon
  if (doc.section === "Findings") return AlertSquareIcon
  if (doc.section === "Allegations") return Alert02Icon
  return FileUploadIcon
}

function formatStatus(status: string): { label: string; variant: "secondary" | "outline" | "destructive" } {
  if (status === "verified") return { label: "Verified", variant: "secondary" }
  if (status === "planned") return { label: "Planned", variant: "outline" }
  if (status === "rejected") return { label: "Rejected", variant: "destructive" }
  return { label: status, variant: "outline" }
}

// ─── Corpus Selector ──────────────────────────────────────────────────────────
function CorpusSelector({
  selected,
  onChange,
}: {
  selected: CorpusDoc
  onChange: (doc: CorpusDoc) => void
}): React.JSX.Element {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <span className="text-muted-foreground">{selected.domain}</span>
          <span>/</span>
          <span>{selected.label}</span>
          <HugeiconsIcon icon={ArrowDown01Icon} size={12} strokeWidth={2} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {CORPUS.map((doc) => (
          <DropdownMenuItem
            key={doc.id}
            onClick={() => onChange(doc)}
            className="flex items-center justify-between"
          >
            <span className="text-sm">{doc.label}</span>
            <Badge variant="outline" className="ml-2 text-[10px] uppercase">
              {doc.domain}
            </Badge>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── Wikilink resolver (stub for stories) ────────────────────────────────────
function storyWikiResolver(value: string): string {
  return `/dossier/${value.toLowerCase().replace(/\s+/g, "-")}.md`
}

// =============================================================================
// DocumentViewer — Editorial Dossier Card
// Aesthetic: polished card with rich, section-colored header. Feels like
// a well-designed entity record. Compact metadata ribbon below the header.
// Designed for: dossier entities (people, groups, places) and source artifacts.
// Shadcn: Card, CardHeader, CardContent, CardFooter, Badge, ScrollArea, Separator
// =============================================================================
function Variant2Frame({ doc }: { doc: CorpusDoc }): React.JSX.Element {
  const fm = useMemo(() => extractFrontmatter(doc.content), [doc.content])
  const title = useMemo(() => extractTitle(doc.content, fm), [doc.content, fm])
  const [wikiMsg, setWikiMsg] = useState<string | null>(null)
  const icon = getDomainIcon(doc)

  const accentConfig: Record<string, { header: string; badge: string; icon: string }> = {
    dossier: {
      header: "bg-gradient-to-r from-indigo-500/12 to-transparent border-b border-indigo-500/20",
      badge: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
      icon: "text-indigo-500",
    },
    investigation: {
      header: "bg-gradient-to-r from-amber-500/12 to-transparent border-b border-amber-500/20",
      badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
      icon: "text-amber-500",
    },
    source: {
      header: "bg-gradient-to-r from-emerald-500/12 to-transparent border-b border-emerald-500/20",
      badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
      icon: "text-emerald-500",
    },
  }
  const accent = accentConfig[doc.domain]

  const allMetaFields = useMemo(
    () => Object.entries(fm).filter(([k]) => !["title", "name"].includes(k)),
    [fm]
  )
  const bodyContent = useMemo(() => extractBodyAfterTitle(doc.content), [doc.content])

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Eval label */}
      <div className="shrink-0 border-b border-border/50 bg-muted/30 px-6 py-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        DocumentViewer
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl px-6 py-8">

          {/* ── Header — gradient por domínio, só cantos superiores; embaixo conecta com metadata ── */}
          <header className={`rounded-t-xl px-6 py-5 ${accent.header}`}>
            <div className="flex flex-col gap-3">
              {/* Breadcrumb + status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`flex size-8 items-center justify-center rounded-lg border ${accent.badge}`}>
                    <HugeiconsIcon icon={icon} size={16} strokeWidth={1.8} className={accent.icon} />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="uppercase tracking-[0.14em]">{doc.domain}</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} size={10} strokeWidth={2} />
                    <span className="uppercase tracking-[0.14em]">{doc.section}</span>
                  </div>
                </div>
                {fm.status && (
                  <Badge variant={formatStatus(fm.status).variant} className="text-[11px]">
                    {formatStatus(fm.status).label}
                  </Badge>
                )}
              </div>

              {/* Título */}
              <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground">
                {title}
              </h1>

              {/* Badges de category e tags */}
              <div className="flex flex-wrap gap-2">
                {fm.category && (
                  <Badge variant="secondary" className="text-[11px]">
                    {String(fm.category).replace(/_/g, " ")}
                  </Badge>
                )}
                {(() => {
                  const tagsList =
                    fm.tags == null
                      ? []
                      : Array.isArray(fm.tags)
                        ? fm.tags.map(String)
                        : String(fm.tags)
                            .split(/[,;]/)
                            .map((t) => t.trim())
                            .filter(Boolean)
                  return tagsList.map((tag) => (
                    <Badge key={tag} variant="outline" className={`border text-[11px] ${accent.badge}`}>
                      {String(tag).replace(/_/g, " ")}
                    </Badge>
                  ))
                })()}
              </div>
            </div>
          </header>

          {/* ── Metadata — colado ao header, mesma continuidade ── */}
          {allMetaFields.length > 0 && (
            <div className="border-b border-border/50 bg-background px-6 py-4">
              <TooltipProvider delayDuration={300}>
                <div
                  className="grid gap-x-6 gap-y-3"
                  style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
                >
                  {allMetaFields.map(([k, v]) => {
                    const displayValue = v ?? ""
                    const isNull = displayValue === "" || displayValue === "null"
                    const maxLen = 24
                    const truncated = displayValue.length > maxLen
                    const showValue = isNull ? "null" : truncated ? `${displayValue.slice(0, maxLen)}…` : displayValue
                    return (
                      <div key={k} className="min-w-0 flex flex-col gap-0.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                          {k.replace(/_/g, " ")}
                        </span>
                        {truncated ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-default truncate text-[12px] text-foreground" title="">
                                {showValue}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[320px] break-words font-normal">
                              {displayValue}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className={`truncate text-[12px] ${isNull ? "text-muted-foreground/50" : "text-foreground"}`}>
                            {showValue}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </TooltipProvider>
            </div>
          )}

          {/* ── Body — direto, sem container (ReversoMarkdown editorial aplica card; removemos aqui) ── */}
          <div className="mt-6">
            {wikiMsg && (
              <div className="mb-4 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
                {wikiMsg}
              </div>
            )}
            <ReversoMarkdown
              content={bodyContent}
              variant="editorial"
              className="!rounded-none !border-0 !bg-transparent !p-0 !shadow-none"
              wikiLinkResolver={storyWikiResolver}
              wikiLinkShowIcon
              onWikiLinkClick={(value) => setWikiMsg(`→ [[${value}]]`)}
            />
          </div>

          {/* ── Footer ── */}
          <div className="mt-10 flex items-center justify-between border-t border-border/50 pt-4">
            <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[40ch]">
              {doc.path}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              {fm.updated && (
                <span className="text-[11px] text-muted-foreground">Updated {fm.updated.slice(0, 10)}</span>
              )}
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                <HugeiconsIcon icon={RefreshIcon} size={12} strokeWidth={2} />
                Refresh
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Story frame wrapper — corpus selector + document display
// =============================================================================
function StoryShell({
  defaultDocId,
  children,
}: {
  defaultDocId: string
  children: (doc: CorpusDoc) => React.JSX.Element
}): React.JSX.Element {
  const defaultDoc = CORPUS.find((d) => d.id === defaultDocId) ?? CORPUS[0]
  const [selected, setSelected] = useState<CorpusDoc>(defaultDoc)

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Global corpus picker strip */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border/60 bg-card px-4 py-2.5">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
          <HugeiconsIcon icon={FilterHorizontalIcon} size={12} strokeWidth={2} className="mr-1 inline" />
          Preview corpus:
        </span>
        <CorpusSelector selected={selected} onChange={setSelected} />
        <Separator orientation="vertical" className="h-4" />
        <span className="text-[11px] text-muted-foreground">
          Change documents to test how the viewer handles different content types.
        </span>
      </div>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {children(selected)}
      </div>
    </div>
  )
}

// ─── Meta ─────────────────────────────────────────────────────────────────────
const meta = {
  title: "blocks/Markdown/DocumentViewer",
  parameters: { layout: "fullscreen" },
} satisfies Meta

export default meta
type Story = StoryObj

// =============================================================================
// STORY EXPORTS
// =============================================================================

export const Variant2EditorialDossierCard: Story = {
  name: "Variant 2 — Editorial Dossier Card",
  parameters: {
    docs: {
      description: {
        story:
          "Card com header colorido por domínio (dossier / investigation / source), metadata em grid de 3 colunas com tooltip para valores longos, badges de category e tags. Ideal para entidades de dossiê e artefatos de fonte.",
      },
    },
  },
  render: () => (
    <StoryShell defaultDocId="dossier-place">
      {(doc) => <Variant2Frame doc={doc} />}
    </StoryShell>
  ),
}
