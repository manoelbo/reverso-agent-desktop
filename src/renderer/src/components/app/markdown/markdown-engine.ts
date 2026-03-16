import MarkdownIt from "markdown-it"

import { parseFrontmatter, type MarkdownFrontmatter } from "@/components/app/markdown/plugins/frontmatter"
import { transformEventBlocks } from "@/components/app/markdown/plugins/event-block"
import { transformClaimBlocks } from "@/components/app/markdown/plugins/claim-block"
import { wikiLinksPlugin, type WikiLinkResolver } from "@/components/app/markdown/plugins/wiki-links"

export type ReversoMarkdownDocument = {
  frontmatter: MarkdownFrontmatter
  html: string
}

export type MarkdownEngineOptions = {
  wikiLinkResolver?: WikiLinkResolver
  wikiLinkShowIcon?: boolean
  enableClaimBlocks?: boolean
  currentDocumentPath?: string
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
  const md = createMarkdownIt(options.wikiLinkResolver, options.wikiLinkShowIcon, options.currentDocumentPath)
  // Fase 1: bloqueia HTML bruto do documento para reduzir risco de injeção.
  const sanitizedSource = content.replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  const withClaims = options.enableClaimBlocks ? transformClaimBlocks(sanitizedSource) : sanitizedSource
  const withEventBlocks = transformEventBlocks(withClaims, (body) => renderEventBodyMarkdown(md, body))
  const html = md.render(withEventBlocks)
  return { frontmatter, html }
}
