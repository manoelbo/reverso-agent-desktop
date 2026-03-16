import type MarkdownIt from "markdown-it"

export type WikiLinkMeta = {
  raw: string
  value: string
  href: string
}

export type WikiLinkResolver = (value: string) => string
export type WikiLinksPluginOptions = {
  showIcon?: boolean
  /** When set, wikilinks that resolve to this path (dossier://currentDocumentPath) are rendered as plain text, not links. */
  currentDocumentPath?: string
}

function defaultWikiLinkResolver(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return `/wiki/${slug || "unknown"}`
}

export function wikiLinksPlugin(
  md: MarkdownIt,
  resolver: WikiLinkResolver = defaultWikiLinkResolver,
  options: WikiLinksPluginOptions = {},
): void {
  md.inline.ruler.before("emphasis", "wikilink", (state, silent) => {
    const start = state.pos
    const src = state.src

    if (src.charCodeAt(start) !== 0x5b || src.charCodeAt(start + 1) !== 0x5b) {
      return false
    }

    const closeIndex = src.indexOf("]]", start + 2)
    if (closeIndex < 0) {
      return false
    }

    const rawValue = src.slice(start + 2, closeIndex).trim()
    if (!rawValue) {
      return false
    }

    if (!silent) {
      const href = resolver(rawValue)
      const meta: WikiLinkMeta = {
        raw: `[[${rawValue}]]`,
        value: rawValue,
        href,
      }
      const token = state.push("wikilink", "", 0)
      token.meta = meta
      token.content = rawValue
    }

    state.pos = closeIndex + 2
    return true
  })

  md.renderer.rules.wikilink = (tokens, index) => {
    const token = tokens[index]
    const meta = token.meta as WikiLinkMeta | undefined
    const value = meta?.value ?? token.content
    const href = meta?.href ?? defaultWikiLinkResolver(value)
    const currentPath = options.currentDocumentPath
    const isSelf = currentPath != null && href === `dossier://${currentPath}`
    if (isSelf) {
      return `<span class="reverso-wikilink-self" data-wikilink="${md.utils.escapeHtml(value)}">${md.utils.escapeHtml(value)}</span>`
    }
    const icon = options.showIcon ? '<span class="reverso-wikilink-icon" aria-hidden="true">↗</span>' : ""
    return `<a href="${md.utils.escapeHtml(href)}" data-wikilink="${md.utils.escapeHtml(value)}" class="reverso-wikilink"><span class="reverso-wikilink-label">${md.utils.escapeHtml(value)}</span>${icon}</a>`
  }
}
