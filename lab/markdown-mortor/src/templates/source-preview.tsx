import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon, FileUploadIcon } from "@hugeicons/core-free-icons"

import { ReversoMarkdown } from "@/markdown/ReversoMarkdown"
import type { ReversoMarkdownVariant } from "@/markdown/ReversoMarkdown"
import { Badge } from "@/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/ui/tooltip"
import { registerTemplate, type TemplateProps } from "./registry"

// ─── Helpers (alinhados ao editorial-dossier) ──────────────────────────────────

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

function labelFromRelativePath(relativePath: string): string {
  const artifactId = relativePath.replace(/^sources\//, "")
  const withoutHash = artifactId.replace(/-[0-9a-f]{8}$/, "")
  return withoutHash
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
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

// Acento Sources (rose) — mesma cor do sidebar
const sourceAccent = {
  header: "bg-gradient-to-r from-rose-500/12 to-transparent border-b border-rose-500/20",
  badge: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
  icon: "text-rose-500",
}

// ─── Source Preview Template (mesmo header e metadados do editorial-dossier) ───

function SourcePreviewTemplate({ content, relativePath, variationId, onNavigate, wikiLinkResolver }: TemplateProps) {
  const [wikiMsg, setWikiMsg] = useState<string | null>(null)

  const fm = useMemo(() => extractFrontmatter(content), [content])
  const summary = useMemo(() => extractDocumentSummary(content), [content])
  const label = useMemo(() => labelFromRelativePath(relativePath), [relativePath])
  const title = summary.title || label

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
    () => Object.entries(metaForRibbon).filter(([_, v]) => v !== undefined && v !== ""),
    [metaForRibbon]
  )

  const bodyContent = useMemo(() => extractBodyAfterTitle(content), [content])

  const tagsList = useMemo(() => {
    const raw = fm.tags
    if (!raw) return []
    if (Array.isArray(raw)) return raw.map(String)
    return String(raw)
      .split(/[,;]/)
      .map((t) => t.trim())
      .filter(Boolean)
  }, [fm.tags])

  return (
    <div className="flex h-full flex-col bg-background overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl px-6 py-8">

          {/* Header — mesmo layout do editorial-dossier */}
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
                    <span className="uppercase tracking-[0.14em]">Sources</span>
                  </div>
                </div>
              </div>

              <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground">
                {title}
              </h1>

              <div className="flex flex-wrap gap-2">
                {summary.type && (
                  <Badge variant="secondary" className="text-[11px]">
                    {summary.type.replace(/_/g, " ")}
                  </Badge>
                )}
                {tagsList.map((tag) => (
                  <Badge key={tag} variant="outline" className={`border text-[11px] ${sourceAccent.badge}`}>
                    {tag.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
            </div>
          </header>

          {/* Metadata ribbon — mesmo grid e estilo do editorial-dossier */}
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

          {/* Body — mesmo padding lateral do ribbon (px-6) para alinhar */}
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
              enableClaimBlocks
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

          {/* Footer — mesmo estilo do editorial-dossier */}
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

// ─── Register ─────────────────────────────────────────────────────────────────

registerTemplate({
  id: "source-preview",
  label: "Source Preview",
  description: "Visualização de documento-fonte (preview.md) com renderização de CLAIM, RED_FLAG e DISCREPANCY.",
  component: SourcePreviewTemplate,
  variations: [
    { id: "editorial", label: "Editorial", description: "Tipografia editorial — corpo amplo" },
    { id: "evidence", label: "Evidence", description: "Estilo de evidência — h3 uppercase" },
    { id: "analyst", label: "Analyst", description: "Compacto — ideal para leitura rápida" },
  ],
  defaultVariation: "editorial",
})
