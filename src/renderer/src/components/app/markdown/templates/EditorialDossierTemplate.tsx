"use client"

import { useMemo, useState, type JSX } from "react"
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
  Building05Icon,
} from "@hugeicons/core-free-icons"

import { ReversoMarkdown, type ReversoMarkdownVariant } from "@/components/app/markdown/ReversoMarkdown"
import { parseWikiLinkHref } from "@/components/app/markdown/wiki-link-resolver"
import type { WikiLinkResolver } from "@/components/app/markdown/plugins/wiki-links"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type EditorialDossierTemplateProps = {
  content: string
  relativePath: string
  wikiLinkResolver?: WikiLinkResolver
  onWikiNavigate?: (relativePath: string) => void
  onSourceNavigate?: (relativePath: string) => void
  onLeadNavigate?: (relativePath: string) => void
  onFindingNavigate?: (relativePath: string) => void
  onAllegationNavigate?: (relativePath: string) => void
  onWikiUnresolved?: (value: string) => void
}

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
  groups: {
    header: "bg-gradient-to-r from-sky-500/12 to-transparent border-b border-sky-500/20",
    badge: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
    icon: "text-sky-500",
  },
  people: {
    header: "bg-gradient-to-r from-indigo-500/12 to-transparent border-b border-indigo-500/20",
    badge: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
    icon: "text-indigo-500",
  },
  places: {
    header: "bg-gradient-to-r from-emerald-500/12 to-transparent border-b border-emerald-500/20",
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    icon: "text-emerald-500",
  },
  timeline: {
    header: "bg-gradient-to-r from-amber-500/12 to-transparent border-b border-amber-500/20",
    badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    icon: "text-amber-500",
  },
  leads: {
    header: "bg-gradient-to-r from-violet-500/12 to-transparent border-b border-violet-500/20",
    badge: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
    icon: "text-violet-500",
  },
  findings: {
    header: "bg-gradient-to-r from-teal-500/12 to-transparent border-b border-teal-500/20",
    badge: "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
    icon: "text-teal-500",
  },
  allegations: {
    header: "bg-gradient-to-r from-red-500/12 to-transparent border-b border-red-500/20",
    badge: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
    icon: "text-red-500",
  },
}

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
  if (relativePath.startsWith("leads/")) return "Leads"
  if (relativePath.startsWith("findings/")) return "Findings"
  if (relativePath.startsWith("allegations/")) return "Allegations"
  return "Dossier"
}

function getSectionIcon(section: string): typeof UserGroupIcon {
  if (section === "People") return UserGroupIcon
  if (section === "Groups") return Building05Icon
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

function toVariant(section: string): ReversoMarkdownVariant {
  if (section === "Timeline") return "evidence"
  if (section === "Places") return "analyst"
  return "editorial"
}

export function EditorialDossierTemplate({
  content,
  relativePath,
  wikiLinkResolver,
  onWikiNavigate,
  onSourceNavigate,
  onLeadNavigate,
  onFindingNavigate,
  onAllegationNavigate,
  onWikiUnresolved,
}: EditorialDossierTemplateProps): JSX.Element {
  const [wikiMsg, setWikiMsg] = useState<string | null>(null)

  const fm = useMemo(() => extractFrontmatter(content), [content])
  const title = useMemo(() => extractTitle(content, fm), [content, fm])
  const section = useMemo(() => sectionFromPath(relativePath), [relativePath])
  const icon = getSectionIcon(section)
  const accent = accentConfigs[section.toLowerCase()] ?? accentConfigs.dossier
  const mdVariant = toVariant(section)

  const allMetaFields = useMemo(
    () => Object.entries(fm).filter(([k]) => !["title", "name"].includes(k)),
    [fm]
  )

  const bodyContent = useMemo(() => extractBodyAfterTitle(content), [content])
  const tagsList = useMemo(() => {
    const raw = fm.tags
    if (!raw) return []
    return String(raw)
      .split(/[,;]/)
      .map((tag) => tag.trim())
      .filter(Boolean)
  }, [fm.tags])

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl px-6 py-8">
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
                {fm.status ? (
                  <Badge variant={formatStatus(fm.status).variant} className="text-[11px]">
                    {formatStatus(fm.status).label}
                  </Badge>
                ) : null}
              </div>

              <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground">{title}</h1>

              <div className="flex flex-wrap gap-2">
                {fm.category ? (
                  <Badge variant="secondary" className="text-[11px]">
                    {String(fm.category).replace(/_/g, " ")}
                  </Badge>
                ) : null}
                {tagsList.map((tag) => (
                  <Badge key={tag} variant="outline" className={`border text-[11px] ${accent.badge}`}>
                    {tag.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
            </div>
          </header>

          {allMetaFields.length > 0 ? (
            <div className="border-b border-border/50 bg-background px-6 py-4 text-left">
              <TooltipProvider delayDuration={300}>
                <div className="grid justify-items-start gap-x-6 gap-y-3" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
                  {allMetaFields.map(([key, value]) => {
                    const displayValue = String(value ?? "")
                    const isNull = displayValue === "" || displayValue === "null"
                    const maxLen = 24
                    const truncated = displayValue.length > maxLen
                    const showValue = isNull ? "—" : truncated ? `${displayValue.slice(0, maxLen)}…` : displayValue
                    return (
                      <div key={key} className="min-w-0 flex flex-col gap-0.5">
                        <span className="whitespace-nowrap text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                          {key.replace(/_/g, " ")}
                        </span>
                        {truncated ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-default truncate text-[12px] text-foreground">{showValue}</span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[320px] wrap-break-word font-normal">
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
          ) : null}

          <div className="mt-6">
            {wikiMsg ? (
              <div className="mb-4 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
                {wikiMsg}
              </div>
            ) : null}
            <ReversoMarkdown
              content={bodyContent}
              variant={mdVariant}
              className="rounded-none! border-0! bg-transparent! py-0! pl-6! pr-6! shadow-none! [&_h2]:mt-0!"
              wikiLinkShowIcon
              wikiLinkResolver={wikiLinkResolver}
              currentRelativePath={relativePath}
              onWikiLinkClick={(value, href) => {
                const parsed = parseWikiLinkHref(href ?? "")
                if (parsed.kind === "dossier") return onWikiNavigate?.(parsed.relativePath)
                if (parsed.kind === "source") return onSourceNavigate?.(parsed.relativePath)
                if (parsed.kind === "lead") return onLeadNavigate?.(parsed.relativePath)
                if (parsed.kind === "finding") return onFindingNavigate?.(parsed.relativePath)
                if (parsed.kind === "allegation") return onAllegationNavigate?.(parsed.relativePath)
                setWikiMsg(`→ [[${value}]] não encontrado`)
                onWikiUnresolved?.(value)
              }}
            />
          </div>

          <div className="mt-10 flex items-center justify-between border-t border-border/50 pt-4">
            <span className="max-w-[50ch] truncate font-mono text-[11px] text-muted-foreground">{relativePath}</span>
            {fm.updated ? <span className="shrink-0 text-[11px] text-muted-foreground">Updated {String(fm.updated).slice(0, 10)}</span> : null}
          </div>
        </div>
      </div>
    </div>
  )
}
