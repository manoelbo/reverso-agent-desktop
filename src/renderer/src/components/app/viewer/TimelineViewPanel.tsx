"use client"

import type { JSX } from "react"
import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, FilterHorizontalIcon, MoreHorizontalCircle01Icon, Search01Icon, LinkSquare02Icon } from "@hugeicons/core-free-icons"

import { toDisplayDocumentName } from "@/components/app/dossier/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenuCheckboxItem,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { DossierIndexPayload } from "../../../../../shared/workspace-markdown"

type TimelineRow = {
  id: string
  title: string
  year: string
  month: string
  mentionsCount: number
  updatedAt: string
  relativePath: string
}

type TimelineViewPanelProps = {
  dossierIndex: DossierIndexPayload | null
  onOpenDossierDocument: (relativePath: string) => void
  preset?: {
    year?: string
    month?: string
  } | null
  presetVersion?: number
}

const timelineActionCommands = ["research --source", "research --web", "deep-research --source", "deep-research --web"] as const

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function RowActionsMenu(): JSX.Element {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" size="icon-sm" variant="ghost" aria-label="Open row actions">
          <HugeiconsIcon icon={MoreHorizontalCircle01Icon} size={16} strokeWidth={1.8} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Quick Action</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Add to Chat</DropdownMenuItem>
        <DropdownMenuItem>View</DropdownMenuItem>
        <DropdownMenuItem className="text-destructive focus:text-destructive">Delete</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Commands</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {timelineActionCommands.map((command) => (
          <DropdownMenuItem key={command} className="whitespace-nowrap font-mono text-xs">
            {command}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function FolderCellButton({ value, onActivate }: { value: string; onActivate: (value: string) => void }): JSX.Element {
  return (
    <button
      type="button"
      onClick={() => onActivate(value)}
      className="inline-flex items-center rounded-md border border-border/60 px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground"
    >
      {value}
    </button>
  )
}

export function TimelineViewPanel({ dossierIndex, onOpenDossierDocument, preset, presetVersion }: TimelineViewPanelProps): JSX.Element {
  const [search, setSearch] = useState("")
  const [filterSearch, setFilterSearch] = useState("")
  const [yearFilters, setYearFilters] = useState<string[]>([])
  const [monthFilters, setMonthFilters] = useState<string[]>([])

  const rows = useMemo<TimelineRow[]>(() => {
    const files = dossierIndex?.sections.timeline.files ?? []
    return files.map((file) => {
      const [, year = "Unknown"] = file.folderPath
      const monthMatch = file.fileStem.match(/^\d{4}-(\d{2})$/)
      return {
        id: file.relativePath,
        title: toDisplayDocumentName(file),
        year,
        month: monthMatch?.[1] ?? "00",
        mentionsCount: 0,
        updatedAt: file.updatedAt,
        relativePath: file.relativePath,
      }
    })
  }, [dossierIndex])

  const yearOptions = useMemo(() => Array.from(new Set(rows.map((row) => row.year))).sort(), [rows])
  const monthOptions = useMemo(() => Array.from(new Set(rows.map((row) => row.month))).sort(), [rows])
  const effectiveYearFilters = preset?.year && presetVersion !== undefined ? [preset.year] : yearFilters
  const effectiveMonthFilters = preset?.month && presetVersion !== undefined ? [preset.month] : monthFilters
  const normalizedFilterSearch = filterSearch.trim().toLowerCase()
  const filteredYearOptions = useMemo(
    () => yearOptions.filter((value) => value.toLowerCase().includes(normalizedFilterSearch)),
    [yearOptions, normalizedFilterSearch]
  )
  const filteredMonthOptions = useMemo(
    () => monthOptions.filter((value) => value.toLowerCase().includes(normalizedFilterSearch)),
    [monthOptions, normalizedFilterSearch]
  )
  const activeFiltersCount = effectiveYearFilters.length + effectiveMonthFilters.length

  const visibleRows = useMemo(() => {
    return rows.filter((row) => {
      const searchMatch = row.title.toLowerCase().includes(search.toLowerCase())
      const yearMatch = !effectiveYearFilters.length || effectiveYearFilters.includes(row.year)
      const monthMatch = !effectiveMonthFilters.length || effectiveMonthFilters.includes(row.month)
      return searchMatch && yearMatch && monthMatch
    })
  }, [rows, search, effectiveYearFilters, effectiveMonthFilters])

  const toggleFilterValue = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    force?: "add" | "remove"
  ): void => {
    setter((previous) => {
      const alreadyIncluded = previous.includes(value)
      if (force === "add") {
        return alreadyIncluded ? previous : [...previous, value]
      }
      if (force === "remove") {
        return previous.filter((item) => item !== value)
      }
      return alreadyIncluded ? previous.filter((item) => item !== value) : [...previous, value]
    })
  }

  const clearAllFilters = (): void => {
    setYearFilters([])
    setMonthFilters([])
  }

  const yearsTotal = useMemo(() => new Set(rows.map((row) => row.year)).size, [rows])

  return (
    <TooltipProvider>
      <div className="flex min-h-full flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <header className="space-y-1 rounded-xl border border-border/70 bg-card/60 px-5 py-4">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Timeline</h1>
            <p className="text-sm text-muted-foreground">Follow chronology by year and month using folder filters.</p>
          </header>
          <Badge variant="outline" className="h-8 rounded-md px-2 text-xs">
            {rows.length} entries · {yearsTotal} years
          </Badge>
        </div>

        <section className="space-y-3 rounded-xl border border-border/70 bg-card/70 p-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative min-w-[18rem] flex-1">
              <HugeiconsIcon
                icon={Search01Icon}
                size={14}
                strokeWidth={1.8}
                className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
              />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-8" placeholder="Search timeline entries" />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="gap-1.5">
                  <HugeiconsIcon icon={FilterHorizontalIcon} size={14} strokeWidth={1.8} />
                  <span>Filters</span>
                  {activeFiltersCount ? (
                    <Badge variant="secondary" className="h-5 rounded px-1.5 text-[10px]">
                      {activeFiltersCount}
                    </Badge>
                  ) : null}
                  <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={1.8} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-88 max-w-[92vw] p-2">
                <div className="space-y-2">
                  <Input value={filterSearch} onChange={(event) => setFilterSearch(event.target.value)} placeholder="Filter options..." className="h-8" />
                  <div className="max-h-80 space-y-1 overflow-y-auto pr-1">
                    <DropdownMenuLabel className="px-2">Year</DropdownMenuLabel>
                    {filteredYearOptions.map((value) => (
                      <DropdownMenuCheckboxItem
                        key={`year-${value}`}
                        checked={effectiveYearFilters.includes(value)}
                        onCheckedChange={() => toggleFilterValue(value, setYearFilters)}
                      >
                        {value}
                      </DropdownMenuCheckboxItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="px-2">Month</DropdownMenuLabel>
                    {filteredMonthOptions.map((value) => (
                      <DropdownMenuCheckboxItem
                        key={`month-${value}`}
                        checked={effectiveMonthFilters.includes(value)}
                        onCheckedChange={() => toggleFilterValue(value, setMonthFilters)}
                      >
                        {value}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {activeFiltersCount ? (
            <div className="flex flex-wrap items-center gap-2">
              {effectiveYearFilters.map((value) => (
                <button
                  key={`chip-year-${value}`}
                  type="button"
                  onClick={() => toggleFilterValue(value, setYearFilters, "remove")}
                  className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-muted/50 px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <span>Year: {value}</span>
                  <span>x</span>
                </button>
              ))}
              {effectiveMonthFilters.map((value) => (
                <button
                  key={`chip-month-${value}`}
                  type="button"
                  onClick={() => toggleFilterValue(value, setMonthFilters, "remove")}
                  className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-muted/50 px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <span>Month: {value}</span>
                  <span>x</span>
                </button>
              ))}
              <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearAllFilters}>
                Clear all
              </Button>
            </div>
          ) : null}

          <div className="overflow-x-auto rounded-lg border border-border/70">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Entry</th>
                  <th className="px-3 py-2 text-left">Year</th>
                  <th className="px-3 py-2 text-left">Month</th>
                  <th className="px-3 py-2 text-left">N of Mentions</th>
                  <th className="px-3 py-2 text-left">Updated</th>
                  <th className="px-3 py-2 text-left">View</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.id} className="border-t border-border/60">
                    <td className="max-w-96 px-3 py-2 align-middle">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="truncate whitespace-nowrap font-medium text-foreground">{row.title}</p>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="start" className="text-xs">
                          {row.title}
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <FolderCellButton value={row.year} onActivate={(value) => toggleFilterValue(value, setYearFilters, "add")} />
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <FolderCellButton value={row.month} onActivate={(value) => toggleFilterValue(value, setMonthFilters, "add")} />
                    </td>
                    <td className="px-3 py-2 align-middle text-xs text-muted-foreground">{row.mentionsCount}</td>
                    <td className="px-3 py-2 align-middle text-xs text-muted-foreground">{formatDate(row.updatedAt)}</td>
                    <td className="px-3 py-2 align-middle text-xs">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
                        onClick={() => onOpenDossierDocument(row.relativePath)}
                      >
                        <HugeiconsIcon icon={LinkSquare02Icon} size={12} strokeWidth={1.8} />
                        <span>View</span>
                      </button>
                    </td>
                    <td className="px-3 py-2 align-middle text-right">
                      <RowActionsMenu />
                    </td>
                  </tr>
                ))}
                {!visibleRows.length ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-sm text-muted-foreground">
                      {!rows.length ? "No timeline markdown files found in dossier/timeline." : "No timeline entries matched your current filters."}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </TooltipProvider>
  )
}
