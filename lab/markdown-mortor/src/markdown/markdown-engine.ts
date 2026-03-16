import MarkdownIt from "markdown-it"

import { parseFrontmatter, type MarkdownFrontmatter } from "./plugins/frontmatter"
import { transformEventBlocks } from "./plugins/event-block"
import { transformClaimBlocks } from "./plugins/claim-block"
import { wikiLinksPlugin, type WikiLinkResolver } from "./plugins/wiki-links"

export type ReversoMarkdownDocument = {
  frontmatter: MarkdownFrontmatter
  html: string
}

export type MarkdownEngineOptions = {
  wikiLinkResolver?: WikiLinkResolver
  wikiLinkShowIcon?: boolean
  /** When set, wikilinks pointing to this path are rendered as plain text (no link). */
  currentDocumentPath?: string
  /** When true, transforms CLAIM/RED_FLAG/DISCREPANCY list items into styled HTML cards. */
  enableClaimBlocks?: boolean
}

function createMarkdownIt(
  resolver?: WikiLinkResolver,
  wikiLinkShowIcon = false,
  currentDocumentPath?: string
): MarkdownIt {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    breaks: true,
  })

  wikiLinksPlugin(md, resolver, { showIcon: wikiLinkShowIcon, currentDocumentPath })

  return md
}

function renderEventBodyMarkdown(md: MarkdownIt, body: string): string {
  return md.render(body)
}

export function renderReversoMarkdownDocument(raw: string, options: MarkdownEngineOptions = {}): ReversoMarkdownDocument {
  const { frontmatter, content } = parseFrontmatter(raw)
  const md = createMarkdownIt(
    options.wikiLinkResolver,
    options.wikiLinkShowIcon,
    options.currentDocumentPath
  )
  const sanitizedSource = content.replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  const withClaimBlocks = options.enableClaimBlocks ? transformClaimBlocks(sanitizedSource) : sanitizedSource
  const withEventBlocks = transformEventBlocks(withClaimBlocks, (body) => renderEventBodyMarkdown(md, body))
  const html = md.render(withEventBlocks)
  return { frontmatter, html }
}
