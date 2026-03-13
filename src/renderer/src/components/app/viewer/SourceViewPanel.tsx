"use client"

import type { CSSProperties, JSX, MouseEvent as ReactMouseEvent } from "react"
import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AiMagicIcon,
  ArrowDown01Icon,
  FilterHorizontalIcon,
  MoreHorizontalCircle01Icon,
  Search01Icon,
  UploadSquare02Icon,
} from "@hugeicons/core-free-icons"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type SourceProcessingStatus =
  | "not_processed"
  | "replica_running"
  | "preview_metadata_running"
  | "done"
  | "failed"

type SourceProcessingMode = "standard" | "deep"

type SourceRow = {
  docId: string
  originalFileName: string
  status: SourceProcessingStatus
  processingMode: SourceProcessingMode
  selected: boolean
  queuedAt: string | null
  updatedAt: string
  lastError: string | null
  previewPath: string | null
}

type TableColumnKey = "select" | "sourceFile" | "status" | "mode" | "preview" | "queued" | "updated" | "error" | "actions"

const sourcesBulkCommands = [
  "process-selected --standard",
  "process-selected --deep",
  "rerun-selected --standard",
  "rerun-selected --deep",
] as const

const sourceRowsMock: SourceRow[] = [
  {
    docId: "source-01",
    originalFileName: "bidding-contract-2024.pdf",
    status: "done",
    processingMode: "standard",
    selected: true,
    queuedAt: null,
    updatedAt: "2026-03-12T14:05:00.000Z",
    lastError: null,
    previewPath: "source/.artifacts/source-01/preview.md",
  },
  {
    docId: "source-02",
    originalFileName: "budget-addendum-annex-a.pdf",
    status: "replica_running",
    processingMode: "deep",
    selected: true,
    queuedAt: "2026-03-12T14:08:00.000Z",
    updatedAt: "2026-03-12T14:09:00.000Z",
    lastError: null,
    previewPath: null,
  },
  {
    docId: "source-03",
    originalFileName: "meeting-minutes-jan.pdf",
    status: "preview_metadata_running",
    processingMode: "standard",
    selected: false,
    queuedAt: "2026-03-12T14:10:00.000Z",
    updatedAt: "2026-03-12T14:12:00.000Z",
    lastError: null,
    previewPath: null,
  },
  {
    docId: "source-04",
    originalFileName: "municipal-decree-scan.pdf",
    status: "failed",
    processingMode: "deep",
    selected: false,
    queuedAt: null,
    updatedAt: "2026-03-12T13:49:00.000Z",
    lastError: "OCR provider timeout on chunk 07",
    previewPath: null,
  },
  {
    docId: "source-05",
    originalFileName: "invoice-package-q4.pdf",
    status: "not_processed",
    processingMode: "standard",
    selected: false,
    queuedAt: null,
    updatedAt: "2026-03-12T13:20:00.000Z",
    lastError: null,
    previewPath: null,
  },
]

const statusLabelMap: Record<SourceProcessingStatus, string> = {
  not_processed: "Pending",
  replica_running: "Structure run",
  preview_metadata_running: "Metadata run",
  done: "Done",
  failed: "Failed",
}

const statusToneMap: Record<SourceProcessingStatus, string> = {
  not_processed: "bg-muted text-muted-foreground",
  replica_running: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  preview_metadata_running: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  done: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  failed: "bg-red-500/10 text-red-700 dark:text-red-300",
}

const minColumnWidthMap: Record<TableColumnKey, number> = {
  select: 52,
  sourceFile: 320,
  status: 110,
  mode: 110,
  preview: 120,
  queued: 140,
  updated: 140,
  error: 240,
  actions: 92,
}

function formatDate(value: string | null): string {
  if (!value) {
    return "-"
  }

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function ProcessingIndicator({ status }: { status: SourceProcessingStatus }): JSX.Element | null {
  if (status !== "replica_running" && status !== "preview_metadata_running") {
    return null
  }

  return (
    <span
      aria-label="Processing loop indicator"
      className="inline-flex size-3 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  )
}

function StatusBadge({ status }: { status: SourceProcessingStatus }): JSX.Element {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusToneMap[status]}`}>
      <ProcessingIndicator status={status} />
      <span className="whitespace-nowrap">{statusLabelMap[status]}</span>
    </span>
  )
}

function QuickActionsMenu(): JSX.Element {
  const rowCommands = [
    "process-file --standard",
    "process-file --deep",
    "rerun-file --standard",
    "rerun-file --deep",
  ] as const

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" size="icon-sm" variant="ghost" aria-label="Open quick actions">
          <HugeiconsIcon icon={MoreHorizontalCircle01Icon} size={16} strokeWidth={1.8} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Quick Action</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Add to Chat</DropdownMenuItem>
        <DropdownMenuItem>Open Source</DropdownMenuItem>
        <DropdownMenuItem>Open Preview</DropdownMenuItem>
        <DropdownMenuItem className="text-destructive focus:text-destructive">Delete</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Commands</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {rowCommands.map((command) => (
          <DropdownMenuItem key={command} className="whitespace-nowrap font-mono text-xs">
            {command}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function SourceViewPanel(): JSX.Element {
  const [search, setSearch] = useState("")
  const [showDone, setShowDone] = useState(true)
  const [showFailed, setShowFailed] = useState(true)
  const [showRunning, setShowRunning] = useState(true)
  const [sourceFileWidth, setSourceFileWidth] = useState(420)

  const selectedCount = useMemo(() => sourceRowsMock.filter((row) => row.selected).length, [])
  const activeColumns = useMemo<TableColumnKey[]>(
    () => ["select", "sourceFile", "status", "mode", "preview", "queued", "updated", "error", "actions"],
    []
  )
  const fixedColumnsWidth = useMemo(
    () => activeColumns.filter((columnKey) => columnKey !== "sourceFile").reduce((total, key) => total + minColumnWidthMap[key], 0),
    [activeColumns]
  )
  const tableMinWidth = useMemo(() => fixedColumnsWidth + sourceFileWidth, [fixedColumnsWidth, sourceFileWidth])

  const visibleRows = useMemo(() => {
    const statusMatches = new Set<SourceProcessingStatus>()

    if (showDone) {
      statusMatches.add("done")
    }
    if (showFailed) {
      statusMatches.add("failed")
    }
    if (showRunning) {
      statusMatches.add("replica_running")
      statusMatches.add("preview_metadata_running")
      statusMatches.add("not_processed")
    }

    return sourceRowsMock.filter((row) => {
      const searchMatch = row.originalFileName.toLowerCase().includes(search.toLowerCase())
      return searchMatch && statusMatches.has(row.status)
    })
  }, [search, showDone, showFailed, showRunning])

  const getColumnStyle = (columnKey: TableColumnKey): CSSProperties => ({
    width: columnKey === "sourceFile" ? `${sourceFileWidth}px` : `${minColumnWidthMap[columnKey]}px`,
    minWidth: `${minColumnWidthMap[columnKey]}px`,
  })

  const startSourceFileResize = (event: ReactMouseEvent<HTMLButtonElement>): void => {
    event.preventDefault()
    event.stopPropagation()

    const startX = event.clientX
    const startWidth = sourceFileWidth
    const minWidth = minColumnWidthMap.sourceFile

    const handleMouseMove = (moveEvent: MouseEvent): void => {
      const nextWidth = Math.max(minWidth, startWidth + (moveEvent.clientX - startX))
      setSourceFileWidth(nextWidth)
    }

    const handleMouseUp = (): void => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
  }

  return (
    <TooltipProvider>
      <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col gap-4 px-6 py-6">
      <header className="space-y-1 rounded-xl border border-border/70 bg-card/60 px-5 py-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Sources</h1>
        <p className="text-sm text-muted-foreground">Upload evidence quickly and process with confidence.</p>
      </header>

      <section className="rounded-xl border border-border/70 bg-card/70 p-4">
        <div className="rounded-lg border border-dashed border-primary/50 bg-primary/5 p-6 transition-colors">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Drop PDF files or upload from your device</p>
              <p className="text-xs text-muted-foreground">PDF only. Original files remain immutable for evidence integrity.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" className="gap-1.5">
                <HugeiconsIcon icon={UploadSquare02Icon} size={16} strokeWidth={1.8} />
                <span>Upload PDF</span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-border/70 bg-card/70 p-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative min-w-[18rem] flex-1">
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
                placeholder="Search sources by filename"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="gap-1.5">
                  <HugeiconsIcon icon={FilterHorizontalIcon} size={14} strokeWidth={1.8} />
                  <span>Filters</span>
                  <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={1.8} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel>Status visibility</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked={showDone} onCheckedChange={(checked) => setShowDone(Boolean(checked))}>
                  Done
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={showFailed} onCheckedChange={(checked) => setShowFailed(Boolean(checked))}>
                  Failed
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={showRunning} onCheckedChange={(checked) => setShowRunning(Boolean(checked))}>
                  Running + pending
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" size="sm" className="gap-1.5">
                <HugeiconsIcon icon={AiMagicIcon} size={14} strokeWidth={1.8} />
                <span>Bulk commands</span>
                <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={1.8} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[24rem] max-w-[90vw]">
              <DropdownMenuLabel>{selectedCount} selected files</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {sourcesBulkCommands.map((command) => (
                <DropdownMenuItem key={command} className="whitespace-nowrap font-mono text-xs">
                  {command}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border/70">
          <table className="w-full border-collapse text-sm" style={{ minWidth: tableMinWidth }}>
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left" style={getColumnStyle("select")}>
                  <input type="checkbox" aria-label="Select all files" />
                </th>
                <th className="group relative px-3 py-2 text-left" style={getColumnStyle("sourceFile")}>
                  Source file
                  <button
                    type="button"
                    aria-label="Resize source file column"
                    onMouseDown={startSourceFileResize}
                    className="absolute top-0 right-0 h-full w-2 cursor-col-resize touch-none opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <span className="mx-auto block h-4/5 w-px bg-border/70" />
                  </button>
                </th>
                <th className="px-3 py-2 text-left" style={getColumnStyle("status")}>Status</th>
                <th className="px-3 py-2 text-left" style={getColumnStyle("mode")}>Mode</th>
                <th className="px-3 py-2 text-left" style={getColumnStyle("preview")}>Preview</th>
                <th className="px-3 py-2 text-left" style={getColumnStyle("queued")}>Queued</th>
                <th className="px-3 py-2 text-left" style={getColumnStyle("updated")}>Updated</th>
                <th className="px-3 py-2 text-left" style={getColumnStyle("error")}>Error</th>
                <th className="sticky right-0 z-10 bg-muted/40 px-3 py-2 text-right" style={getColumnStyle("actions")}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.docId} className="border-t border-border/60">
                  <td className="px-3 py-2 align-middle" style={getColumnStyle("select")}>
                    <input type="checkbox" aria-label={`Select ${row.originalFileName}`} checked={row.selected} readOnly />
                  </td>
                  <td className="px-3 py-2 align-middle" style={getColumnStyle("sourceFile")}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="max-w-full truncate whitespace-nowrap font-medium text-foreground">{row.originalFileName}</p>
                      </TooltipTrigger>
                      <TooltipContent side="top" align="start" className="max-w-2xl break-all text-xs">
                        {row.originalFileName}
                      </TooltipContent>
                    </Tooltip>
                  </td>
                  <td className="px-3 py-2 align-middle" style={getColumnStyle("status")}>
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-3 py-2 align-middle" style={getColumnStyle("mode")}>
                    <Badge variant="secondary" className="uppercase">
                      {row.processingMode}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 align-middle text-xs" style={getColumnStyle("preview")}>
                    {row.previewPath ? (
                      <a href={row.previewPath} className="text-primary underline-offset-2 hover:underline">
                        View
                      </a>
                    ) : (
                      <span className="text-muted-foreground">Not available</span>
                    )}
                  </td>
                  <td className="px-3 py-2 align-middle text-xs text-muted-foreground" style={getColumnStyle("queued")}>{formatDate(row.queuedAt)}</td>
                  <td className="px-3 py-2 align-middle text-xs text-muted-foreground" style={getColumnStyle("updated")}>{formatDate(row.updatedAt)}</td>
                  <td className="px-3 py-2 align-middle text-xs text-muted-foreground" style={getColumnStyle("error")}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="block truncate whitespace-nowrap">{row.lastError ?? "-"}</span>
                      </TooltipTrigger>
                      <TooltipContent side="top" align="start" className="max-w-160 wrap-break-word text-xs">
                        {row.lastError ?? "No error details available."}
                      </TooltipContent>
                    </Tooltip>
                  </td>
                  <td className="sticky right-0 z-1 bg-card px-3 py-2 align-middle text-right" style={getColumnStyle("actions")}>
                    <QuickActionsMenu />
                  </td>
                </tr>
              ))}
              {!visibleRows.length ? (
                <tr>
                  <td colSpan={activeColumns.length} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No files matched your current filters.
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
