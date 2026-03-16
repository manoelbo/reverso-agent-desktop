import type MarkdownIt from "markdown-it"

export type WikiLinkMeta = {
  raw: string
  value: string
  label: string
  href: string
  isSelf: boolean
}

export type WikiLinkResolution = {
  href: string
  isSelf?: boolean
  label?: string
}

export type WikiLinkResolverContext = {
  currentDocumentPath?: string
}

export type WikiLinkResolver = (value: string, context: WikiLinkResolverContext) => string | WikiLinkResolution
export type WikiLinksPluginOptions = {
  showIcon?: boolean
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
      const resolved = resolver(rawValue, { currentDocumentPath: options.currentDocumentPath })
      const href = typeof resolved === "string" ? resolved : resolved.href
      const isSelf = typeof resolved === "string" ? href.startsWith("wikilink://self/") : Boolean(resolved.isSelf)
      const label = typeof resolved === "string" ? rawValue : resolved.label ?? rawValue
      const meta: WikiLinkMeta = {
        raw: `[[${rawValue}]]`,
        value: rawValue,
        label,
        href,
        isSelf,
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
    const label = meta?.label ?? value
    const href = meta?.href ?? defaultWikiLinkResolver(value)
    const isSelf = meta?.isSelf ?? href.startsWith("wikilink://self/")
    const isInvestigationWikiLink = href.startsWith("finding://") || href.startsWith("allegation://")
    if (isSelf) {
      return `<span class="reverso-wikilink-text">${md.utils.escapeHtml(label)}</span>`
    }
    const icon = options.showIcon ? '<span class="reverso-wikilink-icon" aria-hidden="true">↗</span>' : ""
    const linkClass = isInvestigationWikiLink ? "reverso-wikilink reverso-wikilink-investigation" : "reverso-wikilink"
    return `<a href="${md.utils.escapeHtml(href)}" data-wikilink="${md.utils.escapeHtml(value)}" class="${linkClass}"><span class="reverso-wikilink-label">${md.utils.escapeHtml(label)}</span>${icon}</a>`
  }
}
