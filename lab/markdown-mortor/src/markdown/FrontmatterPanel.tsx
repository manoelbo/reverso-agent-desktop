import type { JSX } from "react"
import { useMemo } from "react"

import type { MarkdownFrontmatter } from "./plugins/frontmatter"
import type { ReversoMarkdownVariant } from "./ReversoMarkdown"
import { Badge } from "@/ui/badge"
import { Separator } from "@/ui/separator"
import { cn } from "@/lib/utils"

type FrontmatterPanelProps = {
  frontmatter: MarkdownFrontmatter
  variant: ReversoMarkdownVariant
  className?: string
}

type FrontmatterEntry = [string, unknown]

const panelClassMap: Record<ReversoMarkdownVariant, string> = {
  default: "rounded-xl border border-border/70 bg-card/60 p-4",
  editorial: "rounded-2xl border border-border/60 bg-background/90 p-5 shadow-sm",
  evidence: "rounded-xl border border-primary/25 bg-card/70 p-4 shadow-[0_0_0_1px_hsl(var(--border)/0.2)]",
  analyst: "rounded-lg border border-border/70 bg-card/70 p-3.5",
}

const itemClassMap: Record<ReversoMarkdownVariant, string> = {
  default: "rounded-lg border border-border/60 bg-muted/20 p-3",
  editorial: "rounded-xl border border-border/60 bg-muted/15 p-3.5",
  evidence: "rounded-lg border border-primary/20 bg-muted/20 p-3",
  analyst: "rounded-md border border-border/60 bg-muted/20 p-2.5",
}

function prettifyKey(key: string): string {
  return key
    .replaceAll("-", " ")
    .replaceAll("_", " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase())
}

function isIsoDateLike(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value)) return false
  const parsed = Date.parse(value)
  return Number.isFinite(parsed)
}

function formatScalar(value: unknown): string {
  if (typeof value === "number") {
    return new Intl.NumberFormat("pt-BR").format(value)
  }

  if (typeof value === "boolean") {
    return value ? "Sim" : "Nao"
  }

  if (typeof value === "string" && isIsoDateLike(value)) {
    const parsed = new Date(value)
    return parsed.toLocaleString("pt-BR")
  }

  return String(value)
}

function renderValue(value: unknown): JSX.Element {
  if (Array.isArray(value)) {
    if (!value.length) {
      return <span className="text-muted-foreground">Sem itens</span>
    }
    return (
      <div className="flex flex-wrap gap-1.5">
        {value.map((item, index) => (
          <Badge key={`${String(item)}-${index}`} variant="secondary" className="max-w-full">
            <span className="truncate">{formatScalar(item)}</span>
          </Badge>
        ))}
      </div>
    )
  }

  if (value && typeof value === "object") {
    return (
      <pre className="overflow-x-auto rounded-md border border-border/60 bg-muted/30 p-2 text-[11px] leading-relaxed whitespace-pre-wrap wrap-break-word">
        {JSON.stringify(value, null, 2)}
      </pre>
    )
  }

  return <span className="wrap-break-word text-foreground">{formatScalar(value)}</span>
}

const featuredKeysByVariant: Record<ReversoMarkdownVariant, string[]> = {
  default: ["title", "name", "type", "status"],
  editorial: ["name", "alias", "role", "category"],
  evidence: ["status", "confidence", "source", "updated_at"],
  analyst: ["type", "category", "source", "updated_at"],
}

function toEntryMap(entries: FrontmatterEntry[]): Map<string, FrontmatterEntry> {
  const map = new Map<string, FrontmatterEntry>()
  for (const entry of entries) {
    map.set(entry[0].toLowerCase(), entry)
  }
  return map
}

export function FrontmatterPanel({ frontmatter, variant, className }: FrontmatterPanelProps): JSX.Element | null {
  const entries = useMemo<FrontmatterEntry[]>(
    () =>
      Object.entries(frontmatter)
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .slice(0, 16),
    [frontmatter]
  )

  if (!entries.length) return null

  const byKey = toEntryMap(entries)
  const featuredEntries = featuredKeysByVariant[variant]
    .map((key) => byKey.get(key))
    .filter((entry): entry is FrontmatterEntry => Boolean(entry))
  const featuredSet = new Set(featuredEntries.map(([key]) => key.toLowerCase()))
  const detailEntries = entries.filter(([key]) => !featuredSet.has(key.toLowerCase()))

  return (
    <section className={cn(panelClassMap[variant], className)}>
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Frontmatter</p>
          <p className="text-xs text-muted-foreground">Metadados estruturados para contexto rapido</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline">{entries.length} campos</Badge>
          <Badge variant="secondary">{variant}</Badge>
        </div>
      </header>
      <Separator className="my-3" />

      {featuredEntries.length ? (
        <section className="flex flex-col gap-2">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">Highlights</p>
          <div className="flex flex-wrap gap-2">
            {featuredEntries.map(([key, value]) => (
              <Badge key={key} variant="secondary" className="h-auto max-w-full items-start py-1">
                <span className="truncate text-[11px] text-muted-foreground">{prettifyKey(key)}:</span>
                <span className="truncate text-foreground">{formatScalar(value)}</span>
              </Badge>
            ))}
          </div>
          <Separator />
        </section>
      ) : null}

      <dl className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
        {detailEntries.map(([key, value]) => (
          <div key={key} className={itemClassMap[variant]}>
            <dt className="mb-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
              {prettifyKey(key)}
            </dt>
            <dd className="text-sm leading-relaxed">{renderValue(value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
