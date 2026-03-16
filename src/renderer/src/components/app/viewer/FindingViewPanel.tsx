"use client"

import type { JSX } from "react"
import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon } from "@hugeicons/core-free-icons"

import type { InvestigationIndexPayload } from "../../../../../shared/workspace-investigation"
import { Input } from "@/components/ui/input"

type FindingViewPanelProps = {
  investigationIndex: InvestigationIndexPayload | null
  investigationIndexLoading: boolean
  investigationIndexError: string | null
  investigationIndexStale: boolean
  onOpenFindingDocument: (relativePath: string) => void
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function FindingViewPanel({
  investigationIndex,
  investigationIndexLoading,
  investigationIndexError,
  investigationIndexStale,
  onOpenFindingDocument,
}: FindingViewPanelProps): JSX.Element {
  const [search, setSearch] = useState("")
  const rows = investigationIndex?.findings ?? []

  const visibleRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    if (!normalizedSearch.length) return rows
    return rows.filter((row) => {
      const haystack = `${row.title} ${row.id} ${row.leadSlug ?? ""} ${row.fileName}`.toLowerCase()
      return haystack.includes(normalizedSearch)
    })
  }, [rows, search])

  const verifiedCount = rows.filter((row) => row.status?.toLowerCase() === "verified").length
  const linkedAllegations = rows.reduce((acc, row) => acc + row.allegationIds.length, 0)

  return (
    <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col gap-4 px-8 py-8">
      <header className="space-y-1 rounded-2xl border border-border/70 bg-card/70 px-6 py-5 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Findings</h1>
        <p className="text-sm text-muted-foreground">Validated evidence statements connected to investigation leads.</p>
      </header>

      <section className="grid grid-cols-2 gap-3 rounded-2xl border border-border/70 bg-card/60 p-4 shadow-sm md:grid-cols-4">
        <div className="rounded-lg border border-border/60 bg-background/70 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total</p>
          <p className="text-xl font-semibold">{rows.length}</p>
        </div>
        <div className="rounded-lg border border-teal-500/20 bg-teal-500/5 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Verified</p>
          <p className="text-xl font-semibold text-teal-700 dark:text-teal-300">{verifiedCount}</p>
        </div>
        <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Linked Allegations</p>
          <p className="text-xl font-semibold text-violet-700 dark:text-violet-300">{linkedAllegations}</p>
        </div>
        <div className="rounded-lg border border-border/60 bg-background/70 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">With Lead</p>
          <p className="text-xl font-semibold">{rows.filter((row) => Boolean(row.leadSlug)).length}</p>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-border/70 bg-card/70 p-4 shadow-sm">
        <div className="relative min-w-[18rem] max-w-lg">
          <HugeiconsIcon
            icon={Search01Icon}
            size={14}
            strokeWidth={1.8}
            className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-8"
            placeholder="Search findings by title, id, lead or filename"
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-border/70 bg-background/60">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground backdrop-blur">
              <tr>
                <th className="px-4 py-2 text-left">Title</th>
                <th className="w-44 px-3 py-2 text-left">ID</th>
                <th className="w-64 px-3 py-2 text-left">Lead</th>
                <th className="w-32 px-3 py-2 text-left">Status</th>
                <th className="w-36 px-3 py-2 text-left">Allegations</th>
                <th className="w-40 px-3 py-2 text-left">Updated</th>
                <th className="w-28 px-4 py-2 text-right">Open</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.relativePath} className="border-t border-border/60 transition-colors hover:bg-muted/25">
                  <td className="px-4 py-3 align-middle">
                    <p className="line-clamp-2 font-medium text-foreground">{row.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{row.fileName}</p>
                  </td>
                  <td className="px-3 py-2 align-middle font-mono text-xs text-muted-foreground">{row.id}</td>
                  <td className="px-3 py-2 align-middle text-xs text-muted-foreground">{row.leadSlug ?? "-"}</td>
                  <td className="px-3 py-2 align-middle text-xs text-muted-foreground">{row.status ?? "-"}</td>
                  <td className="px-3 py-2 align-middle text-muted-foreground">{row.allegationIds.length}</td>
                  <td className="px-3 py-2 align-middle text-xs text-muted-foreground">{formatDate(row.updatedAt)}</td>
                  <td className="px-4 py-2 align-middle text-right">
                    <button
                      type="button"
                      className="rounded-md border border-primary/30 px-2.5 py-1 text-primary transition-colors hover:bg-primary/10"
                      onClick={() => onOpenFindingDocument(row.relativePath)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {!visibleRows.length ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No findings matched your current search.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {investigationIndexLoading ? <p className="text-xs text-muted-foreground">Loading findings index...</p> : null}
        {investigationIndexError ? <p className="text-xs text-destructive">Index error: {investigationIndexError}</p> : null}
        {investigationIndexStale ? <p className="text-xs text-muted-foreground">Refreshing findings data...</p> : null}
      </section>
    </div>
  )
}
