"use client"

import type { JSX } from "react"
import { useMemo } from "react"

import { renderReversoMarkdownDocument } from "@/components/app/markdown/markdown-engine"
import { cn } from "@/lib/utils"

export type ReversoMarkdownVariant = "default" | "editorial" | "evidence" | "analyst"

type ReversoMarkdownProps = {
  content: string
  className?: string
  variant?: ReversoMarkdownVariant
  onWikiLinkClick?: (value: string, href: string) => void
  wikiLinkResolver?: (value: string) => string
}

const markdownVariantClassMap: Record<ReversoMarkdownVariant, string> = {
  default:
    "rounded-xl border border-border/70 bg-card/60 p-5",
  editorial:
    "rounded-2xl border border-border/60 bg-background p-7 shadow-sm",
  evidence:
    "rounded-xl border border-primary/30 bg-card/80 p-5 shadow-[0_0_0_1px_hsl(var(--border)/0.35)]",
  analyst:
    "rounded-lg border border-border/70 bg-card/70 p-4",
}

const markdownBodyClassMap: Record<ReversoMarkdownVariant, string> = {
  default:
    "[&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-lg [&_h2]:font-semibold " +
    "[&_h3]:mb-1 [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-semibold [&_p]:my-2 [&_p]:leading-7 " +
    "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 " +
    "[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border/70 [&_th]:bg-muted/50 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left " +
    "[&_td]:border [&_td]:border-border/70 [&_td]:px-2 [&_td]:py-1 " +
    "[&_.reverso-wikilink]:font-medium [&_.reverso-wikilink]:text-primary [&_.reverso-wikilink]:underline [&_.reverso-wikilink]:underline-offset-2 " +
    "[&_.reverso-event]:my-4 [&_.reverso-event]:rounded-lg [&_.reverso-event]:border [&_.reverso-event]:border-border/70 [&_.reverso-event]:bg-background/80 [&_.reverso-event]:p-3 " +
    "[&_.reverso-event-header]:mb-2 [&_.reverso-event-header]:flex [&_.reverso-event-header]:items-center [&_.reverso-event-header]:gap-2 " +
    "[&_.reverso-event-date]:text-sm [&_.reverso-event-date]:font-medium " +
    "[&_.reverso-event-badge]:rounded-md [&_.reverso-event-badge]:bg-muted [&_.reverso-event-badge]:px-2 [&_.reverso-event-badge]:py-0.5 [&_.reverso-event-badge]:text-xs " +
    "[&_.reverso-event-meta]:space-y-1 [&_.reverso-event-meta]:text-xs [&_.reverso-event-meta]:text-muted-foreground " +
    "[&_.reverso-event-actor]:mr-1.5 [&_.reverso-event-actor]:inline-flex [&_.reverso-event-actor]:rounded [&_.reverso-event-actor]:bg-muted/70 [&_.reverso-event-actor]:px-1.5 [&_.reverso-event-actor]:py-0.5",
  editorial:
    "[&_h1]:mb-4 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h2]:mb-2 [&_h2]:mt-7 [&_h2]:text-xl [&_h2]:font-semibold " +
    "[&_h3]:mb-1 [&_h3]:mt-5 [&_h3]:text-base [&_h3]:font-semibold [&_p]:my-3 [&_p]:max-w-[72ch] [&_p]:leading-8 " +
    "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 " +
    "[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic " +
    "[&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_th]:border-b [&_th]:border-border [&_th]:bg-muted/30 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left " +
    "[&_td]:border-b [&_td]:border-border/60 [&_td]:px-3 [&_td]:py-2 " +
    "[&_.reverso-wikilink]:font-medium [&_.reverso-wikilink]:text-primary [&_.reverso-wikilink]:underline [&_.reverso-wikilink]:decoration-primary/50 [&_.reverso-wikilink]:underline-offset-3 " +
    "[&_.reverso-event]:my-5 [&_.reverso-event]:rounded-xl [&_.reverso-event]:border [&_.reverso-event]:border-border/60 [&_.reverso-event]:bg-muted/20 [&_.reverso-event]:p-4 " +
    "[&_.reverso-event-header]:mb-3 [&_.reverso-event-header]:flex [&_.reverso-event-header]:items-center [&_.reverso-event-header]:gap-2 " +
    "[&_.reverso-event-date]:text-sm [&_.reverso-event-date]:font-semibold " +
    "[&_.reverso-event-badge]:rounded-md [&_.reverso-event-badge]:bg-primary/10 [&_.reverso-event-badge]:px-2 [&_.reverso-event-badge]:py-0.5 [&_.reverso-event-badge]:text-xs [&_.reverso-event-badge]:text-primary " +
    "[&_.reverso-event-meta]:space-y-1 [&_.reverso-event-meta]:text-xs [&_.reverso-event-meta]:text-muted-foreground",
  evidence:
    "[&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold " +
    "[&_h3]:mb-1 [&_h3]:mt-4 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:uppercase [&_h3]:tracking-wide [&_p]:my-2 [&_p]:leading-7 " +
    "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 " +
    "[&_table]:my-4 [&_table]:w-full [&_table]:border-separate [&_table]:border-spacing-0 [&_th]:border [&_th]:border-border/70 [&_th]:bg-muted/60 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left " +
    "[&_td]:border [&_td]:border-border/50 [&_td]:px-2 [&_td]:py-1 " +
    "[&_.reverso-wikilink]:inline-flex [&_.reverso-wikilink]:rounded-md [&_.reverso-wikilink]:bg-primary/10 [&_.reverso-wikilink]:px-1.5 [&_.reverso-wikilink]:py-0.5 [&_.reverso-wikilink]:text-primary [&_.reverso-wikilink]:no-underline " +
    "[&_.reverso-event]:my-4 [&_.reverso-event]:rounded-xl [&_.reverso-event]:border [&_.reverso-event]:border-primary/35 [&_.reverso-event]:bg-card [&_.reverso-event]:p-4 [&_.reverso-event]:shadow-sm " +
    "[&_.reverso-event-header]:mb-2 [&_.reverso-event-header]:flex [&_.reverso-event-header]:items-center [&_.reverso-event-header]:gap-2 " +
    "[&_.reverso-event-date]:text-xs [&_.reverso-event-date]:font-semibold [&_.reverso-event-date]:uppercase [&_.reverso-event-date]:tracking-wide " +
    "[&_.reverso-event-badge]:rounded [&_.reverso-event-badge]:border [&_.reverso-event-badge]:border-primary/40 [&_.reverso-event-badge]:bg-primary/10 [&_.reverso-event-badge]:px-2 [&_.reverso-event-badge]:py-0.5 [&_.reverso-event-badge]:text-[11px] [&_.reverso-event-badge]:font-medium " +
    "[&_.reverso-event-meta]:space-y-1 [&_.reverso-event-meta]:text-xs [&_.reverso-event-meta]:text-muted-foreground " +
    "[&_.reverso-event-actor]:mr-1.5 [&_.reverso-event-actor]:inline-flex [&_.reverso-event-actor]:rounded [&_.reverso-event-actor]:bg-muted/80 [&_.reverso-event-actor]:px-1.5 [&_.reverso-event-actor]:py-0.5",
  analyst:
    "[&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:mb-1 [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold " +
    "[&_h3]:mb-1 [&_h3]:mt-3 [&_h3]:text-sm [&_h3]:font-semibold [&_p]:my-1.5 [&_p]:text-sm [&_p]:leading-6 " +
    "[&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 " +
    "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[12px] " +
    "[&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border/60 [&_th]:bg-muted/45 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:text-[11px] [&_th]:uppercase [&_th]:tracking-wide " +
    "[&_td]:border [&_td]:border-border/50 [&_td]:px-2 [&_td]:py-1 [&_td]:text-sm " +
    "[&_.reverso-wikilink]:font-medium [&_.reverso-wikilink]:text-primary [&_.reverso-wikilink]:underline [&_.reverso-wikilink]:underline-offset-2 " +
    "[&_.reverso-event]:my-3 [&_.reverso-event]:rounded-md [&_.reverso-event]:border [&_.reverso-event]:border-border/70 [&_.reverso-event]:bg-background [&_.reverso-event]:p-3 " +
    "[&_.reverso-event-header]:mb-2 [&_.reverso-event-header]:flex [&_.reverso-event-header]:items-center [&_.reverso-event-header]:gap-2 " +
    "[&_.reverso-event-date]:text-xs [&_.reverso-event-date]:font-medium " +
    "[&_.reverso-event-badge]:rounded [&_.reverso-event-badge]:bg-muted [&_.reverso-event-badge]:px-2 [&_.reverso-event-badge]:py-0.5 [&_.reverso-event-badge]:text-[11px] " +
    "[&_.reverso-event-meta]:space-y-1 [&_.reverso-event-meta]:text-[11px] [&_.reverso-event-meta]:text-muted-foreground",
}

const frontmatterVariantClassMap: Record<ReversoMarkdownVariant, string> = {
  default: "rounded-lg border border-border/70 bg-muted/30 p-3",
  editorial: "rounded-xl border border-border/60 bg-muted/15 p-4",
  evidence: "rounded-lg border border-primary/30 bg-primary/5 p-3",
  analyst: "rounded-md border border-border/70 bg-muted/25 p-2.5",
}

function formatFrontmatterValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(", ")
  }
  return String(value)
}

export function ReversoMarkdown({
  content,
  className,
  variant = "default",
  onWikiLinkClick,
  wikiLinkResolver,
}: ReversoMarkdownProps): JSX.Element {
  const document = useMemo(
    () => renderReversoMarkdownDocument(content, { wikiLinkResolver }),
    [content, wikiLinkResolver]
  )

  const frontmatterEntries = useMemo(
    () =>
      Object.entries(document.frontmatter)
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .slice(0, 8),
    [document.frontmatter]
  )

  return (
    <article
      className={cn(
        "space-y-4",
        markdownVariantClassMap[variant],
        markdownBodyClassMap[variant],
        className
      )}
      onClick={(event) => {
        if (!onWikiLinkClick) return
        const target = event.target as HTMLElement | null
        const anchor = target?.closest<HTMLAnchorElement>("a[data-wikilink]")
        if (!anchor) return
        event.preventDefault()
        const value = anchor.dataset.wikilink ?? ""
        onWikiLinkClick(value, anchor.getAttribute("href") ?? "")
      }}
    >
      {frontmatterEntries.length ? (
        <section className={frontmatterVariantClassMap[variant]}>
          <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Frontmatter</p>
          <dl className="grid gap-1 text-xs sm:grid-cols-2">
            {frontmatterEntries.map(([key, value]) => (
              <div key={key} className="flex items-start gap-2">
                <dt className="min-w-20 text-muted-foreground">{key}</dt>
                <dd className="font-medium text-foreground">{formatFrontmatterValue(value)}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <section dangerouslySetInnerHTML={{ __html: document.html }} />
    </article>
  )
}
