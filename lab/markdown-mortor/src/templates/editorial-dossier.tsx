import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Alert02Icon,
  AlertSquareIcon,
  ArrowRight01Icon,
  BookCheckIcon,
  Calendar02Icon,
  FileUploadIcon,
  Location01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"

import { ReversoMarkdown } from "@/markdown/ReversoMarkdown"
import type { ReversoMarkdownVariant } from "@/markdown/ReversoMarkdown"
import { Badge } from "@/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/ui/tooltip"
import { registerTemplate, type TemplateProps } from "./registry"

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function extractBodyAfterTitle(content: string): string {
  const withoutFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n?/, "").trimStart()
  const lines = withoutFrontmatter.split("\n")
  if (lines.length === 0) return ""
  if (/^# .+$/.test(lines[0])) {
    return lines.slice(1).join("\n").trimStart()
  }
  return withoutFrontmatter
}

function sectionFromPath(relativePath: string): string {
  if (relativePath.startsWith("people/")) return "People"
  if (relativePath.startsWith("groups/")) return "Groups"
  if (relativePath.startsWith("places/")) return "Places"
  if (relativePath.startsWith("timeline/")) return "Timeline"
  return "Dossier"
}

function getSectionIcon(section: string): typeof UserGroupIcon {
  if (section === "People") return UserGroupIcon
  if (section === "Places") return Location01Icon
  if (section === "Timeline") return Calendar02Icon
  if (section === "Leads") return BookCheckIcon
  if (section === "Findings") return AlertSquareIcon
  if (section === "Allegations") return Alert02Icon
  return FileUploadIcon
}

function formatStatus(status: string): { label: string; variant: "secondary" | "outline" | "destructive" } {
  if (status === "verified") return { label: "Verified", variant: "secondary" }
  if (status === "planned") return { label: "Planned", variant: "outline" }
  if (status === "rejected") return { label: "Rejected", variant: "destructive" }
  return { label: status, variant: "outline" }
}

// ─── Accent configs per variation ────────────────────────────────────────────

type AccentConfig = {
  header: string
  badge: string
  icon: string
}

const accentConfigs: Record<string, AccentConfig> = {
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

const mdVariantByAccent: Record<string, ReversoMarkdownVariant> = {
  dossier: "editorial",
  investigation: "evidence",
  source: "analyst",
}

// ─── Template component ───────────────────────────────────────────────────────

function EditorialDossierTemplate({ content, relativePath, variationId, onNavigate, wikiLinkResolver }: TemplateProps) {
  const [wikiMsg, setWikiMsg] = useState<string | null>(null)

  const fm = useMemo(() => extractFrontmatter(content), [content])
  const title = useMemo(() => extractTitle(content, fm), [content, fm])
  const section = useMemo(() => sectionFromPath(relativePath), [relativePath])
  const icon = getSectionIcon(section)
  const accent = accentConfigs[variationId] ?? accentConfigs.dossier
  const mdVariant = mdVariantByAccent[variationId] ?? "editorial"

  const allMetaFields = useMemo(
    () => Object.entries(fm).filter(([k]) => !["title", "name"].includes(k)),
    [fm]
  )

  const bodyContent = useMemo(() => extractBodyAfterTitle(content), [content])

  const tagsList = useMemo(() => {
    const raw = fm.tags
    if (!raw) return []
    if (Array.isArray(raw)) return raw.map(String)
    return String(raw).split(/[,;]/).map((t) => t.trim()).filter(Boolean)
  }, [fm.tags])

  return (
    <div className="flex h-full flex-col bg-background overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl px-6 py-8">

          {/* Header */}
          <header className={`rounded-t-xl px-6 py-5 ${accent.header}`}>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`flex size-8 items-center justify-center rounded-lg border ${accent.badge}`}>
                    <HugeiconsIcon icon={icon} size={16} strokeWidth={1.8} className={accent.icon} />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="uppercase tracking-[0.14em]">dossier</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} size={10} strokeWidth={2} />
                    <span className="uppercase tracking-[0.14em]">{section}</span>
                  </div>
                </div>
                {fm.status && (
                  <Badge variant={formatStatus(fm.status).variant} className="text-[11px]">
                    {formatStatus(fm.status).label}
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground">
                {title}
              </h1>

              <div className="flex flex-wrap gap-2">
                {fm.category && (
                  <Badge variant="secondary" className="text-[11px]">
                    {String(fm.category).replace(/_/g, " ")}
                  </Badge>
                )}
                {tagsList.map((tag) => (
                  <Badge key={tag} variant="outline" className={`border text-[11px] ${accent.badge}`}>
                    {tag.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
            </div>
          </header>

          {/* Metadata ribbon — alinhado à esquerda */}
          {allMetaFields.length > 0 && (
            <div className="border-b border-border/50 bg-background px-6 py-4 text-left">
              <TooltipProvider delayDuration={300}>
                <div
                  className="grid justify-items-start gap-x-6 gap-y-3"
                  style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
                >
                  {allMetaFields.map(([k, v]) => {
                    const displayValue = String(v ?? "")
                    const isNull = displayValue === "" || displayValue === "null"
                    const maxLen = 24
                    const truncated = displayValue.length > maxLen
                    const showValue = isNull ? "—" : truncated ? `${displayValue.slice(0, maxLen)}…` : displayValue
                    return (
                      <div key={k} className="min-w-0 flex flex-col gap-0.5">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                          {k.replace(/_/g, " ")}
                        </span>
                        {truncated ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-default truncate text-[12px] text-foreground">
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

          {/* Body — mesmo padding lateral do ribbon (px-6) para alinhar à esquerda */}
          <div className="mt-6">
            {wikiMsg && (
              <div className="mb-4 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
                {wikiMsg}
              </div>
            )}
            <ReversoMarkdown
              content={bodyContent}
              variant={mdVariant}
              className="!rounded-none !border-0 !bg-transparent !py-0 !pl-6 !pr-6 !shadow-none [&_h2]:!mt-0"
              wikiLinkShowIcon
              wikiLinkResolver={wikiLinkResolver}
              currentRelativePath={relativePath}
              onWikiLinkClick={(value, href) => {
                if (href && href.startsWith("dossier://") && !href.includes("unresolved")) {
                  onNavigate?.(href.replace("dossier://", ""))
                } else {
                  setWikiMsg(`→ [[${value}]] não encontrado`)
                }
              }}
            />
          </div>

          {/* Footer */}
          <div className="mt-10 flex items-center justify-between border-t border-border/50 pt-4">
            <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[50ch]">
              {relativePath}
            </span>
            {fm.updated && (
              <span className="text-[11px] text-muted-foreground shrink-0">
                Updated {String(fm.updated).slice(0, 10)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Raw Markdown template ────────────────────────────────────────────────────

function RawMarkdownTemplate({ content, relativePath, variationId, onNavigate, wikiLinkResolver }: TemplateProps) {
  const [wikiMsg, setWikiMsg] = useState<string | null>(null)
  const variant = (variationId as ReversoMarkdownVariant) ?? "default"

  return (
    <div className="flex h-full flex-col bg-background overflow-hidden">
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto w-full max-w-3xl">
          {wikiMsg && (
            <div className="mb-4 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
              {wikiMsg}
            </div>
          )}
          <ReversoMarkdown
            content={content}
            variant={variant}
            wikiLinkShowIcon
            wikiLinkResolver={wikiLinkResolver}
            currentRelativePath={relativePath}
            onWikiLinkClick={(value, href) => {
              if (href && href.startsWith("dossier://") && !href.includes("unresolved")) {
                onNavigate?.(href.replace("dossier://", ""))
              } else {
                setWikiMsg(`→ [[${value}]] não encontrado`)
              }
            }}
          />
        </div>
      </div>
    </div>
  )
}

// ─── Register templates ───────────────────────────────────────────────────────

registerTemplate({
  id: "editorial-dossier",
  label: "Editorial Dossier",
  description: "Header com gradiente por domínio, ribbon de metadados e corpo em Markdown. Baseado no Variant2EditorialDossierCard.",
  component: EditorialDossierTemplate,
  variations: [
    { id: "dossier", label: "Dossier (Indigo)", description: "Acento indigo — para entities do dossier" },
    { id: "investigation", label: "Investigation (Amber)", description: "Acento amber — para investigação" },
    { id: "source", label: "Source (Emerald)", description: "Acento emerald — para fontes" },
  ],
  defaultVariation: "dossier",
})

registerTemplate({
  id: "raw-markdown",
  label: "Raw Markdown",
  description: "Renderização direta via ReversoMarkdown sem estrutura adicional. Útil para testar variantes de estilo.",
  component: RawMarkdownTemplate,
  variations: [
    { id: "default", label: "Default" },
    { id: "editorial", label: "Editorial" },
    { id: "evidence", label: "Evidence" },
    { id: "analyst", label: "Analyst" },
  ],
  defaultVariation: "editorial",
})
