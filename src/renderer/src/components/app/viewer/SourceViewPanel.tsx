"use client"

import type { JSX } from "react"
import { useMemo, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { pickSourceFiles, setSourceSelection, uploadSourceFiles } from "@/components/app/sources/workspace-client"
import type { SourcesIndexPayload, SourceProcessingStatus } from "../../../../../shared/workspace-sources"

type SourceViewPanelProps = {
  sourcesIndex: SourcesIndexPayload | null
  sourcesIndexLoading: boolean
  sourcesIndexError: string | null
  sourcesIndexStale: boolean
  onOpenSourceDocument: (relativePath: string) => void
}

const statusLabelMap: Record<SourceProcessingStatus, string> = {
  not_processed: "Pending",
  replica_running: "Structure run",
  preview_metadata_running: "Metadata run",
  replica_paused: "Structure run (paused)",
  preview_metadata_paused: "Metadata run (paused)",
  done: "Done",
  failed: "Failed",
}

const statusToneMap: Record<SourceProcessingStatus, string> = {
  not_processed: "bg-muted text-muted-foreground",
  replica_running: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  preview_metadata_running: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  replica_paused: "bg-amber-500/20 text-amber-800 dark:text-amber-200",
  preview_metadata_paused: "bg-blue-500/20 text-blue-800 dark:text-blue-200",
  done: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  failed: "bg-red-500/10 text-red-700 dark:text-red-300",
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
  if (status === "replica_running" || status === "preview_metadata_running") {
    return (
      <span
        aria-label="Processing loop indicator"
        className="inline-flex size-3 animate-spin rounded-full border-2 border-current border-t-transparent"
      />
    )
  }

  if (status === "replica_paused" || status === "preview_metadata_paused") {
    return (
      <span aria-label="Paused indicator" className="inline-flex h-3 items-center gap-[2px]">
        <span className="h-3 w-[2px] rounded-[2px] bg-current" />
        <span className="h-3 w-[2px] rounded-[2px] bg-current" />
      </span>
    )
  }
  return null
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
        <div className="px-2 py-1 text-xs text-muted-foreground">Ações por linha serão conectadas na próxima etapa.</div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function SourceViewPanel({
  sourcesIndex,
  sourcesIndexLoading,
  sourcesIndexError,
  sourcesIndexStale,
  onOpenSourceDocument,
}: SourceViewPanelProps): JSX.Element {
  const [search, setSearch] = useState("")
  const [showDone, setShowDone] = useState(true)
  const [showFailed, setShowFailed] = useState(true)
  const [showRunning, setShowRunning] = useState(true)
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null)
  const uploadInProgressRef = useRef(false)

  const checkpointFiles = sourcesIndex?.checkpoint.files ?? []
  const previewByDocId = useMemo(
    () => new Map((sourcesIndex?.previews ?? []).map((preview) => [preview.docId, preview] as const)),
    [sourcesIndex?.previews]
  )
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
      statusMatches.add("replica_paused")
      statusMatches.add("preview_metadata_paused")
      statusMatches.add("not_processed")
    }

    return checkpointFiles.filter((row) => {
      const searchMatch = row.originalFileName.toLowerCase().includes(search.toLowerCase())
      return searchMatch && statusMatches.has(row.status)
    })
  }, [checkpointFiles, search, showDone, showFailed, showRunning])

  const selectedCount = useMemo(() => checkpointFiles.filter((row) => row.selected).length, [checkpointFiles])

  const handleUpload = async (paths: string[]): Promise<void> => {
    if (!paths.length) {
      setUploadFeedback("Could not resolve file paths. Please use the Select PDFs button.")
      return
    }
    if (uploadInProgressRef.current) {
      return
    }
    uploadInProgressRef.current = true
    setUploadFeedback(`Preparing upload for ${paths.length} file(s)...`)
    try {
      const result = await uploadSourceFiles(paths)
      if (!result) {
        setUploadFeedback("Upload API unavailable.")
        return
      }
      setUploadFeedback(`Upload: ${result.added.length} added, ${result.skipped.length} skipped.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload files."
      setUploadFeedback(`Upload error: ${message}`)
    } finally {
      uploadInProgressRef.current = false
    }
  }

  return (
    <TooltipProvider>
      <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col gap-4 px-6 py-6">
      <header className="space-y-1 rounded-xl border border-border/70 bg-card/60 px-5 py-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Sources</h1>
        <p className="text-sm text-muted-foreground">Upload evidence quickly and process with confidence.</p>
      </header>

      <section className="rounded-xl border border-border/70 bg-card/70 p-4">
        <div className="rounded-lg border-2 border-primary/45 bg-primary/10 p-6 shadow-[0_0_0_1px_rgba(59,130,246,0.25)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Add PDF sources</p>
              <p className="text-xs text-muted-foreground">Select files to organize the queue. Supports large files.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="lg"
                className="gap-2 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                onClick={() => {
                  void pickSourceFiles().then((paths) => handleUpload(paths))
                }}
              >
                <HugeiconsIcon icon={UploadSquare02Icon} size={18} strokeWidth={1.9} />
                <span>Select PDFs</span>
              </Button>
            </div>
          </div>
          {uploadFeedback ? <p className="mt-3 text-xs text-muted-foreground">{uploadFeedback}</p> : null}
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

          <div className="text-xs text-muted-foreground">{selectedCount} selected files</div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-border/70">
          <table className="w-full min-w-[1100px] border-collapse text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="w-14 px-3 py-2 text-left">
                  <input
                    type="checkbox"
                    aria-label="Select all files"
                    checked={checkpointFiles.length > 0 && checkpointFiles.every((row) => row.selected)}
                    onChange={(event) => {
                      void setSourceSelection(
                        checkpointFiles.map((row) => row.docId),
                        event.target.checked
                      )
                    }}
                  />
                </th>
                <th className="px-3 py-2 text-left">
                  Source file
                </th>
                <th className="w-36 px-3 py-2 text-left">Status</th>
                <th className="w-28 px-3 py-2 text-left">Mode</th>
                <th className="w-32 px-3 py-2 text-left">Preview</th>
                <th className="w-40 px-3 py-2 text-left">Queued</th>
                <th className="w-40 px-3 py-2 text-left">Updated</th>
                <th className="px-3 py-2 text-left">Error</th>
                <th className="sticky right-0 z-10 w-24 bg-muted/40 px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.docId} className="border-t border-border/60">
                  <td className="px-3 py-2 align-middle">
                    <input
                      type="checkbox"
                      aria-label={`Select ${row.originalFileName}`}
                      checked={row.selected}
                      onChange={(event) => {
                        void setSourceSelection([row.docId], event.target.checked)
                      }}
                    />
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="max-w-full truncate whitespace-nowrap font-medium text-foreground">{row.originalFileName}</p>
                      </TooltipTrigger>
                      <TooltipContent side="top" align="start" className="max-w-2xl break-all text-xs">
                        {row.originalFileName}
                      </TooltipContent>
                    </Tooltip>
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <Badge variant="secondary" className="uppercase">
                      {row.processingMode}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 align-middle text-xs">
                    {previewByDocId.get(row.docId)?.relativePath ? (
                      <button
                        type="button"
                        className="text-primary underline-offset-2 hover:underline"
                        onClick={() => onOpenSourceDocument(previewByDocId.get(row.docId)?.relativePath ?? "")}
                      >
                        View
                      </button>
                    ) : (
                      <span className="text-muted-foreground">Not available</span>
                    )}
                  </td>
                  <td className="px-3 py-2 align-middle text-xs text-muted-foreground">{formatDate(row.queuedAt)}</td>
                  <td className="px-3 py-2 align-middle text-xs text-muted-foreground">{formatDate(row.updatedAt)}</td>
                  <td className="px-3 py-2 align-middle text-xs text-muted-foreground">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="block truncate whitespace-nowrap">{row.lastError ?? "-"}</span>
                      </TooltipTrigger>
                      <TooltipContent side="top" align="start" className="max-w-160 wrap-break-word text-xs">
                        {row.lastError ?? "No error details available."}
                      </TooltipContent>
                    </Tooltip>
                  </td>
                  <td className="sticky right-0 z-1 bg-card px-3 py-2 align-middle text-right">
                    <QuickActionsMenu />
                  </td>
                </tr>
              ))}
              {!visibleRows.length ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No files matched your current filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {sourcesIndexLoading ? <p className="text-xs text-muted-foreground">Loading checkpoint...</p> : null}
        {sourcesIndexError ? <p className="text-xs text-destructive">Error: {sourcesIndexError}</p> : null}
        {sourcesIndexStale ? <p className="text-xs text-muted-foreground">Refreshing data...</p> : null}
      </section>
      </div>
    </TooltipProvider>
  )
}
