export type EventBlock = {
  date?: string
  actors: string[]
  type?: string
  source?: string
  page?: string
  follows?: string
  body: string
}

const EVENT_BLOCK_REGEX = /:::event\s*\n([\s\S]*?)\n::::/g
const META_SEPARATOR = "\n---\n"
const WIKILINK_REGEX = /\[\[([^\]]+)\]\]/g

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function parseActors(value: string): string[] {
  const actors: string[] = []
  value.replace(WIKILINK_REGEX, (_, actor: string) => {
    actors.push(actor.trim())
    return ""
  })
  if (actors.length > 0) return actors
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
}

function parseMetadata(raw: string): Omit<EventBlock, "body" | "actors"> & { actors?: string[] } {
  const metadata: Omit<EventBlock, "body" | "actors"> & { actors?: string[] } = {}
  for (const line of raw.split("\n")) {
    const separator = line.indexOf(":")
    if (separator < 0) continue
    const key = line.slice(0, separator).trim().toLowerCase()
    const value = line.slice(separator + 1).trim()
    if (!value) continue
    if (key === "actors") {
      metadata.actors = parseActors(value)
      continue
    }
    if (key === "date" || key === "type" || key === "source" || key === "page" || key === "follows") {
      metadata[key] = value
    }
  }
  return metadata
}

function buildEventHtml(event: EventBlock): string {
  const actorsHtml = event.actors
    .map((actor) => `<span class="reverso-event-actor">[[${escapeHtml(actor)}]]</span>`)
    .join("")

  return [
    `<article class="reverso-event" data-event-type="${escapeHtml(event.type ?? "other")}">`,
    `<header class="reverso-event-header">`,
    event.date ? `<span class="reverso-event-date">${escapeHtml(event.date)}</span>` : "",
    event.type ? `<span class="reverso-event-badge">${escapeHtml(event.type)}</span>` : "",
    `</header>`,
    `<div class="reverso-event-meta">`,
    actorsHtml ? `<div class="reverso-event-meta-row"><strong>Actors:</strong> ${actorsHtml}</div>` : "",
    event.source
      ? `<div class="reverso-event-meta-row"><strong>Source:</strong> ${escapeHtml(event.source)}${event.page ? ` (p. ${escapeHtml(event.page)})` : ""}</div>`
      : "",
    event.follows ? `<div class="reverso-event-meta-row"><strong>Follows:</strong> ${escapeHtml(event.follows)}</div>` : "",
    `</div>`,
    `<div class="reverso-event-body">${event.body}</div>`,
    `</article>`,
  ].join("")
}

export function transformEventBlocks(raw: string, renderBody: (body: string) => string): string {
  return raw.replace(EVENT_BLOCK_REGEX, (_whole, content: string) => {
    const normalized = content.trim()
    const [metadataRaw, bodyRaw] = normalized.includes(META_SEPARATOR)
      ? normalized.split(META_SEPARATOR, 2)
      : [normalized, ""]
    const metadata = parseMetadata(metadataRaw)
    const body = bodyRaw.trim()
    const renderedBody = body ? renderBody(body) : ""
    const event: EventBlock = {
      date: metadata.date,
      actors: metadata.actors ?? [],
      type: metadata.type,
      source: metadata.source,
      page: metadata.page,
      follows: metadata.follows,
      body: renderedBody,
    }
    return buildEventHtml(event)
  })
}
