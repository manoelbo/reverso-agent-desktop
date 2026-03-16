"use client"

import { useMemo, useState, type JSX } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon, FileUploadIcon } from "@hugeicons/core-free-icons"

import { ReversoMarkdown, type ReversoMarkdownVariant } from "@/components/app/markdown/ReversoMarkdown"
import { parseWikiLinkHref } from "@/components/app/markdown/wiki-link-resolver"
import type { WikiLinkResolver } from "@/components/app/markdown/plugins/wiki-links"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type SourcePreviewTemplateProps = {
  content: string
  relativePath: string
  title?: string
  onNavigateDossier?: (relativePath: string) => void
  onNavigateSource?: (relativePath: string) => void
  onNavigateLead?: (relativePath: string) => void
  onNavigateFinding?: (relativePath: string) => void
  onNavigateAllegation?: (relativePath: string) => void
  wikiLinkResolver?: WikiLinkResolver
  variationId?: "editorial" | "evidence" | "analyst"
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

function extractBodyAfterTitle(content: string): string {
  const withoutFrontmatter = content.replace(/^---\n[\s\S]*?\n---\n?/, "").trimStart()
  const lines = withoutFrontmatter.split("\n")
  if (lines.length === 0) return ""
  if (/^# .+$/.test(lines[0])) {
    return lines.slice(1).join("\n").trimStart()
  }
  return withoutFrontmatter
}

function extractDocumentSummary(content: string): { title: string; type: string; subject: string } {
  const typeMatch = content.match(/\*\*Document Type:\*\*\s*(.+)/i)
  const subjectMatch = content.match(/\*\*Subject:\*\*\s*(.+)/i)
  const h1Match = /^# (.+)$/m.exec(content)
  return {
    title: h1Match?.[1] ?? "Source Document",
    type: typeMatch?.[1]?.trim() ?? "",
    subject: subjectMatch?.[1]?.trim() ?? "",
  }
}

const sourceAccent = {
  header: "bg-gradient-to-r from-rose-500/12 to-transparent border-b border-rose-500/20",
  badge: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  icon: "text-rose-500",
}

export function SourcePreviewTemplate({
  content,
  relativePath,
  title,
  onNavigateDossier,
  onNavigateSource,
  onNavigateLead,
  onNavigateFinding,
  onNavigateAllegation,
  wikiLinkResolver,
  variationId = "editorial",
}: SourcePreviewTemplateProps): JSX.Element {
  const [wikiMsg, setWikiMsg] = useState<string | null>(null)
  const fm = useMemo(() => extractFrontmatter(content), [content])
  const summary = useMemo(() => extractDocumentSummary(content), [content])
  const mdVariant: ReversoMarkdownVariant =
    variationId === "evidence" ? "evidence" : variationId === "analyst" ? "analyst" : "editorial"

  const metaForRibbon = useMemo(() => {
    const base: Record<string, string> = {
      type: "source",
      document_type: summary.type || "—",
      subject: summary.subject || "—",
      ...Object.fromEntries(
        Object.entries(fm).filter(([k]) => !["title", "name"].includes(k.toLowerCase()))
      ),
    }
    return base
  }, [fm, summary.type, summary.subject])

  const allMetaFields = useMemo(
    () => Object.entries(metaForRibbon).filter(([, value]) => value !== undefined && value !== ""),
    [metaForRibbon]
  )
  const bodyContent = useMemo(() => extractBodyAfterTitle(content), [content])
  const resolvedTitle = title?.trim() || summary.title

  return (
    <div className="bg-background">
      <div className="mx-auto w-full max-w-4xl px-6 py-8">
          <header className={`rounded-t-xl px-6 py-5 ${sourceAccent.header}`}>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`flex size-8 items-center justify-center rounded-lg border ${sourceAccent.badge}`}>
                    <HugeiconsIcon icon={FileUploadIcon} size={16} strokeWidth={1.8} className={sourceAccent.icon} />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="uppercase tracking-[0.14em]">dossier</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} size={10} strokeWidth={2} />
                    <span className="uppercase tracking-[0.14em]">sources</span>
                  </div>
                </div>
              </div>

              <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground">{resolvedTitle}</h1>
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
              wikiLinkShowIcon={true}
              enableClaimBlocks={true}
              wikiLinkResolver={wikiLinkResolver}
              currentRelativePath={relativePath}
              onWikiLinkClick={(value, href) => {
                const parsed = parseWikiLinkHref(href ?? "")
                if (parsed.kind === "dossier") return onNavigateDossier?.(parsed.relativePath)
                if (parsed.kind === "source") return onNavigateSource?.(parsed.relativePath)
                if (parsed.kind === "lead") return onNavigateLead?.(parsed.relativePath)
                if (parsed.kind === "finding") return onNavigateFinding?.(parsed.relativePath)
                if (parsed.kind === "allegation") return onNavigateAllegation?.(parsed.relativePath)
                setWikiMsg(`[[${value}]] nao encontrado`)
              }}
            />
          </div>

          <div className="mt-10 flex items-center justify-between border-t border-border/50 pt-4">
            <span className="max-w-[50ch] truncate font-mono text-[11px] text-muted-foreground">{relativePath}</span>
            {fm.updated ? <Badge variant="outline">Updated {String(fm.updated).slice(0, 10)}</Badge> : null}
          </div>
      </div>
    </div>
  )
}
