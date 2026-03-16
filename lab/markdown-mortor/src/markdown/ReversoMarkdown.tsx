import type { JSX } from "react"
import { useMemo } from "react"

import { FrontmatterPanel } from "./FrontmatterPanel"
import { renderReversoMarkdownDocument } from "./markdown-engine"
import { cn } from "@/lib/utils"

export type ReversoMarkdownVariant = "default" | "editorial" | "evidence" | "analyst"

type ReversoMarkdownProps = {
  content: string
  className?: string
  variant?: ReversoMarkdownVariant
  onWikiLinkClick?: (value: string, href: string) => void
  wikiLinkResolver?: (value: string) => string
  wikiLinkShowIcon?: boolean
  /** When set, [[wikilinks]] that resolve to this path are rendered as plain text (no link). */
  currentRelativePath?: string
  /** When true, transforms CLAIM/RED_FLAG/DISCREPANCY list items into styled HTML cards. */
  enableClaimBlocks?: boolean
}

const markdownVariantClassMap: Record<ReversoMarkdownVariant, string> = {
  default:
    "rounded-xl border border-border/70 bg-card/65 p-5",
  editorial:
    "rounded-2xl border border-border/60 bg-background p-7 shadow-sm",
  evidence:
    "rounded-xl border border-primary/25 bg-card/80 p-5 shadow-[0_0_0_1px_hsl(var(--border)/0.25)]",
  analyst:
    "rounded-lg border border-border/70 bg-card/70 p-4",
}

const markdownBaseBodyClass =
  "flex flex-col gap-4 [&_h1]:scroll-m-20 [&_h2]:scroll-m-20 [&_h3]:scroll-m-20 " +
  "[&_h1]:text-balance [&_h2]:text-balance [&_h3]:text-balance [&_p]:text-foreground " +
  "[&_p]:text-pretty [&_ul]:marker:text-muted-foreground [&_ol]:marker:text-muted-foreground " +
  "[&_table]:text-sm [&_.reverso-wikilink]:inline-flex [&_.reverso-wikilink]:items-center [&_.reverso-wikilink]:gap-1 " +
  "[&_.reverso-wikilink]:font-medium [&_.reverso-wikilink]:text-primary [&_.reverso-wikilink]:transition-colors " +
  "[&_.reverso-wikilink]:hover:text-primary/80 [&_.reverso-wikilink-icon]:text-[11px] [&_.reverso-wikilink-icon]:opacity-80 " +
  "[&_.reverso-wikilink-self]:font-normal [&_.reverso-wikilink-self]:text-foreground [&_.reverso-wikilink-self]:no-underline [&_.reverso-wikilink-self]:cursor-default " +
  "[&_.reverso-claim]:my-3 [&_.reverso-claim-header]:flex [&_.reverso-claim-header]:flex-wrap [&_.reverso-claim-header]:items-center [&_.reverso-claim-header]:gap-2 " +
  "[&_.reverso-claim-quote]:my-2 [&_.reverso-claim-quote]:block [&_.reverso-claim-quote]:text-sm [&_.reverso-claim-quote]:leading-7 [&_.reverso-claim-quote]:italic [&_.reverso-claim-quote]:text-foreground/80 " +
  "[&_.reverso-claim-explanation]:mt-1.5 [&_.reverso-claim-explanation]:text-[13px] [&_.reverso-claim-explanation]:leading-6 [&_.reverso-claim-explanation]:text-muted-foreground " +
  "[&_.reverso-claim-badge]:shrink-0 [&_.reverso-claim-page]:font-mono [&_.reverso-claim-page]:text-[11px] [&_.reverso-claim-page]:text-muted-foreground/70 " +
  "[&_.reverso-claim-tags]:text-[10px] [&_.reverso-claim-tags]:text-muted-foreground/50 [&_.reverso-claim-tags]:ml-auto"

const markdownBodyClassMap: Record<ReversoMarkdownVariant, string> = {
  default:
    "[&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold " +
    "[&_h3]:mb-1 [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-semibold [&_p]:my-2 [&_p]:leading-7 " +
    "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 " +
    "[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic " +
    "[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border/70 [&_th]:bg-muted/40 [&_th]:px-2.5 [&_th]:py-2 [&_th]:text-left " +
    "[&_td]:border [&_td]:border-border/70 [&_td]:px-2.5 [&_td]:py-2 " +
    "[&_.reverso-wikilink]:underline [&_.reverso-wikilink]:underline-offset-2 " +
    "[&_.reverso-event]:my-4",
  editorial:
    "[&_h1]:mb-4 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold " +
    "[&_h3]:mb-1 [&_h3]:mt-5 [&_h3]:text-base [&_h3]:font-semibold [&_p]:my-3 [&_p]:max-w-[74ch] [&_p]:leading-8 " +
    "[&_p:first-of-type]:text-base [&_p:first-of-type]:text-muted-foreground [&_p:first-of-type]:italic " +
    "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 " +
    "[&_blockquote]:my-5 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/35 [&_blockquote]:pl-5 [&_blockquote]:text-muted-foreground [&_blockquote]:italic " +
    "[&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_th]:border-b [&_th]:border-border [&_th]:bg-muted/25 [&_th]:px-3 [&_th]:py-2.5 [&_th]:text-left " +
    "[&_td]:border-b [&_td]:border-border/60 [&_td]:px-3 [&_td]:py-2.5 " +
    "[&_.reverso-wikilink]:underline [&_.reverso-wikilink]:decoration-primary/50 [&_.reverso-wikilink]:underline-offset-3 " +
    "[&_.reverso-event]:my-5",
  evidence:
    "[&_h1]:mb-3 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-semibold " +
    "[&_h3]:mb-1 [&_h3]:mt-4 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:uppercase [&_h3]:tracking-wide [&_p]:my-2 [&_p]:leading-7 " +
    "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 " +
    "[&_table]:my-4 [&_table]:w-full [&_table]:border-separate [&_table]:border-spacing-0 [&_th]:border [&_th]:border-border/70 [&_th]:bg-muted/55 [&_th]:px-2.5 [&_th]:py-1.5 [&_th]:text-left " +
    "[&_td]:border [&_td]:border-border/50 [&_td]:px-2.5 [&_td]:py-1.5 " +
    "[&_.reverso-wikilink]:rounded-md [&_.reverso-wikilink]:bg-primary/10 [&_.reverso-wikilink]:px-1.5 [&_.reverso-wikilink]:py-0.5 [&_.reverso-wikilink]:no-underline " +
    "[&_.reverso-event]:my-4",
  analyst:
    "[&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:mb-1 [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-semibold " +
    "[&_h3]:mb-1 [&_h3]:mt-3 [&_h3]:text-sm [&_h3]:font-semibold [&_p]:my-1.5 [&_p]:text-sm [&_p]:leading-6 " +
    "[&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 " +
    "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[12px] " +
    "[&_table]:my-2 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border/60 [&_th]:bg-muted/45 [&_th]:px-2 [&_th]:py-1 [&_th]:text-left [&_th]:text-[11px] [&_th]:uppercase [&_th]:tracking-wide " +
    "[&_td]:border [&_td]:border-border/50 [&_td]:px-2 [&_td]:py-1 [&_td]:text-sm " +
    "[&_.reverso-wikilink]:underline [&_.reverso-wikilink]:underline-offset-2 " +
    "[&_.reverso-event]:my-3",
}

export function ReversoMarkdown({
  content,
  className,
  variant = "default",
  onWikiLinkClick,
  wikiLinkResolver,
  wikiLinkShowIcon = false,
  currentRelativePath,
  enableClaimBlocks = false,
}: ReversoMarkdownProps): JSX.Element {
  const document = useMemo(
    () =>
      renderReversoMarkdownDocument(content, {
        wikiLinkResolver,
        wikiLinkShowIcon,
        currentDocumentPath: currentRelativePath,
        enableClaimBlocks,
      }),
    [content, wikiLinkResolver, wikiLinkShowIcon, currentRelativePath, enableClaimBlocks]
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
        "flex flex-col gap-4",
        markdownVariantClassMap[variant],
        markdownBaseBodyClass,
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
      {frontmatterEntries.length ? <FrontmatterPanel frontmatter={document.frontmatter} variant={variant} /> : null}

      <section dangerouslySetInnerHTML={{ __html: document.html }} />
    </article>
  )
}
