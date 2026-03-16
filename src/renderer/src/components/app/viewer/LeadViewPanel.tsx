"use client"

import type { JSX } from "react"
import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon } from "@hugeicons/core-free-icons"

import type { LeadsIndexPayload, LeadStatus } from "../../../../../shared/workspace-leads"
import { Input } from "@/components/ui/input"

type LeadViewPanelProps = {
  leadsIndex: LeadsIndexPayload | null
  leadsIndexLoading: boolean
  leadsIndexError: string | null
  leadsIndexStale: boolean
  onOpenLeadDocument: (relativePath: string) => void
}

const statusLabelMap: Record<LeadStatus, string> = {
  planned: "Planned",
  in_progress: "In progress",
  done: "Done",
  blocked: "Blocked",
  unknown: "Unknown",
}

const statusToneMap: Record<LeadStatus, string> = {
  planned: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  in_progress: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  done: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  blocked: "bg-red-500/10 text-red-700 dark:text-red-300",
  unknown: "bg-muted text-muted-foreground",
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function LeadStatusBadge({ status }: { status: LeadStatus }): JSX.Element {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusToneMap[status]}`}>
      <span className="whitespace-nowrap">{statusLabelMap[status]}</span>
    </span>
  )
}

export function LeadViewPanel({
  leadsIndex,
  leadsIndexLoading,
  leadsIndexError,
  leadsIndexStale,
  onOpenLeadDocument,
}: LeadViewPanelProps): JSX.Element {
  const [search, setSearch] = useState("")
  const rows = leadsIndex?.files ?? []
  const totalLeads = rows.length
  const plannedLeads = rows.filter((row) => row.status === "planned").length
  const inProgressLeads = rows.filter((row) => row.status === "in_progress").length
  const doneLeads = rows.filter((row) => row.status === "done").length

  const visibleRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    if (!normalizedSearch.length) return rows
    return rows.filter((row) => {
      const haystack = `${row.title} ${row.slug} ${row.fileName}`.toLowerCase()
      return haystack.includes(normalizedSearch)
    })
  }, [rows, search])

  return (
    <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col gap-4 px-8 py-8">
      <header className="space-y-1 rounded-2xl border border-border/70 bg-card/70 px-6 py-5 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Leads</h1>
        <p className="text-sm text-muted-foreground">Track investigation hypotheses and run inquiries from each lead.</p>
      </header>

      <section className="grid grid-cols-2 gap-3 rounded-2xl border border-border/70 bg-card/60 p-4 shadow-sm md:grid-cols-4">
        <div className="rounded-lg border border-border/60 bg-background/70 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total</p>
          <p className="text-xl font-semibold">{totalLeads}</p>
        </div>
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Planned</p>
          <p className="text-xl font-semibold text-blue-700 dark:text-blue-300">{plannedLeads}</p>
        </div>
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">In Progress</p>
          <p className="text-xl font-semibold text-amber-700 dark:text-amber-300">{inProgressLeads}</p>
        </div>
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Done</p>
          <p className="text-xl font-semibold text-emerald-700 dark:text-emerald-300">{doneLeads}</p>
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
            placeholder="Search leads by title, slug or filename"
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-border/70 bg-background/60">
          <table className="w-full min-w-[980px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground backdrop-blur">
              <tr>
                <th className="px-4 py-2 text-left">Title</th>
                <th className="w-64 px-3 py-2 text-left">Slug</th>
                <th className="w-36 px-3 py-2 text-left">Status</th>
                <th className="w-32 px-3 py-2 text-left">Allegations</th>
                <th className="w-28 px-3 py-2 text-left">Findings</th>
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
                  <td className="px-3 py-2 align-middle font-mono text-xs text-muted-foreground">{row.slug}</td>
                  <td className="px-3 py-2 align-middle">
                    <LeadStatusBadge status={row.status} />
                  </td>
                  <td className="px-3 py-2 align-middle text-muted-foreground">{row.allegationsCount ?? "-"}</td>
                  <td className="px-3 py-2 align-middle text-muted-foreground">{row.findingsCount ?? "-"}</td>
                  <td className="px-3 py-2 align-middle text-xs text-muted-foreground">{formatDate(row.updatedAt)}</td>
                  <td className="px-4 py-2 align-middle text-right">
                    <button
                      type="button"
                      className="rounded-md border border-primary/30 px-2.5 py-1 text-primary transition-colors hover:bg-primary/10"
                      onClick={() => onOpenLeadDocument(row.relativePath)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {!visibleRows.length ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No leads matched your current search.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        {leadsIndexLoading ? <p className="text-xs text-muted-foreground">Loading leads index...</p> : null}
        {leadsIndexError ? <p className="text-xs text-destructive">Index error: {leadsIndexError}</p> : null}
        {leadsIndexStale ? <p className="text-xs text-muted-foreground">Refreshing leads data...</p> : null}
      </section>
    </div>
  )
}
