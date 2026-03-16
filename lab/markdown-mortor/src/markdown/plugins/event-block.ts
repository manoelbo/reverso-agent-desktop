export type EventBlock = {
  date?: string
  actors: string[]
  type?: string
  source?: string
  page?: string
  follows?: string
  body: string
}

const EVENT_BLOCK_REGEX = /:::event\s*\n([\s\S]*?)\n:::/g
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

const EVENT_TYPE_CLASSES: Record<string, string> = {
  contract:   "border-blue-500/25 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  legal:      "border-blue-500/25 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  allegation: "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  finding:    "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  transfer:   "border-violet-500/25 bg-violet-500/10 text-violet-600 dark:text-violet-400",
  other:      "border-border/60 bg-muted/60 text-muted-foreground",
}

function eventTypeBadgeClass(type?: string): string {
  const key = (type ?? "other").toLowerCase()
  return EVENT_TYPE_CLASSES[key] ?? EVENT_TYPE_CLASSES.other
}

function buildEventHtml(event: EventBlock): string {
  const badgeClass = eventTypeBadgeClass(event.type)

  const typeLabel = event.type ?? "other"

  const headerRight = event.source
    ? [
        `<div class="reverso-event-source ml-auto flex items-center gap-1 text-[11px] text-muted-foreground/70 tabular-nums">`,
        `<span>${escapeHtml(event.source)}</span>`,
        event.page ? `<span aria-hidden="true">·</span><span>p.&thinsp;${escapeHtml(event.page)}</span>` : "",
        `</div>`,
      ].join("")
    : ""

  const actorsHtml = event.actors.length > 0
    ? [
        `<div class="reverso-event-meta flex flex-wrap items-center gap-1.5 border-b border-border/40 px-4 py-2">`,
        `<span class="reverso-event-meta-label mr-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">Actors</span>`,
        ...event.actors.map(
          (actor) =>
            `<span class="reverso-event-actor inline-flex items-center rounded-md border border-border/50 bg-background px-2 py-0.5 text-xs text-foreground/80">${escapeHtml(actor)}</span>`,
        ),
        `</div>`,
      ].join("")
    : ""

  const followsHtml = event.follows
    ? [
        `<div class="reverso-event-follows flex items-center gap-1.5 border-b border-border/40 px-4 py-2 text-[11px] text-muted-foreground">`,
        `<span class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">Follows</span>`,
        `<span>${escapeHtml(event.follows)}</span>`,
        `</div>`,
      ].join("")
    : ""

  const bodyHtml = event.body
    ? `<div class="reverso-event-body px-4 py-3 text-sm leading-relaxed">${event.body}</div>`
    : ""

  return [
    `<article class="reverso-event my-5 overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10" data-event-type="${escapeHtml(typeLabel)}">`,
    `<header class="reverso-event-header flex items-center gap-2 border-b border-border/50 bg-muted/20 px-4 py-2.5">`,
    event.date
      ? `<time class="reverso-event-date text-sm font-semibold tabular-nums text-foreground/90">${escapeHtml(event.date)}</time>`
      : "",
    `<span class="reverso-event-badge inline-flex h-5 items-center rounded-full border px-2.5 text-[11px] font-medium ${badgeClass}">${escapeHtml(typeLabel)}</span>`,
    headerRight,
    `</header>`,
    actorsHtml,
    followsHtml,
    bodyHtml,
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
