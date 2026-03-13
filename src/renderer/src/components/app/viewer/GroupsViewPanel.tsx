"use client"

import type { JSX } from "react"
import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon, FilterHorizontalIcon, MoreHorizontalCircle01Icon, Search01Icon, LinkSquare02Icon } from "@hugeicons/core-free-icons"

import { toDisplayDocumentName } from "@/components/app/dossier/types"
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
import type { DossierIndexPayload } from "../../../../../shared/workspace-markdown"

type GroupCategory = "government" | "company" | "institution" | "ngo"

type GroupRow = {
  id: string
  name: string
  category: GroupCategory
  mentionsCount: number
  updatedAt: string
  relativePath: string
}

type GroupsViewPanelProps = {
  dossierIndex: DossierIndexPayload | null
  onOpenDossierDocument: (relativePath: string) => void
  presetCategory?: string
  presetVersion?: number
}

const groupActionCommands = ["research --source", "research --web", "deep-research --source", "deep-research --web"] as const

const categoryLabelMap: Record<GroupCategory, string> = {
  government: "Government",
  company: "Company",
  institution: "Institution",
  ngo: "NGO",
}

const categoryToneMap: Record<GroupCategory, string> = {
  government: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  company: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  institution: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  ngo: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
}

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
        {groupActionCommands.map((command) => (
          <DropdownMenuItem key={command} className="whitespace-nowrap font-mono text-xs">
            {command}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function GroupsViewPanel({ dossierIndex, onOpenDossierDocument, presetCategory, presetVersion }: GroupsViewPanelProps): JSX.Element {
  const rows = useMemo<GroupRow[]>(() => {
    const files = dossierIndex?.sections.groups.files ?? []
    return files.map((file) => {
      const slug = `${file.title} ${file.fileStem}`.toLowerCase()
      let category: GroupCategory = "institution"
      if (slug.includes("secretaria") || slug.includes("prefeitura") || slug.includes("diretoria") || slug.includes("camara")) {
        category = "government"
      } else if (slug.includes("ltda") || slug.includes("eireli") || slug.includes("construtora") || slug.includes("engenharia")) {
        category = "company"
      } else if (slug.includes("ong") || slug.includes("associacao")) {
        category = "ngo"
      }
      return {
        id: file.relativePath,
        name: toDisplayDocumentName(file),
        category,
        mentionsCount: 0,
        updatedAt: file.updatedAt,
        relativePath: file.relativePath,
      }
    })
  }, [dossierIndex])

  const [search, setSearch] = useState("")
  const [showGovernment, setShowGovernment] = useState(true)
  const [showCompany, setShowCompany] = useState(true)
  const [showInstitution, setShowInstitution] = useState(true)
  const [showNgo, setShowNgo] = useState(true)

  const visibleRows = useMemo(() => {
    const usePreset = Boolean(presetCategory && presetVersion !== undefined)
    const allowedCategories = new Set<GroupCategory>()
    if (usePreset) {
      if (presetCategory === "government") allowedCategories.add("government")
      if (presetCategory === "company") allowedCategories.add("company")
      if (presetCategory === "institution") allowedCategories.add("institution")
      if (presetCategory === "ngo") allowedCategories.add("ngo")
    } else {
      if (showGovernment) allowedCategories.add("government")
      if (showCompany) allowedCategories.add("company")
      if (showInstitution) allowedCategories.add("institution")
      if (showNgo) allowedCategories.add("ngo")
    }

    return rows.filter((row) => {
      const searchMatch = row.name.toLowerCase().includes(search.toLowerCase())
      return searchMatch && allowedCategories.has(row.category)
    })
  }, [rows, search, showGovernment, showCompany, showInstitution, showNgo, presetCategory, presetVersion])

  const mentionsTotal = useMemo(() => rows.reduce((total, row) => total + row.mentionsCount, 0), [rows])

  return (
    <TooltipProvider>
      <div className="flex min-h-full flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <header className="space-y-1 rounded-xl border border-border/70 bg-card/60 px-5 py-4">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Groups</h1>
            <p className="text-sm text-muted-foreground">Track organizations, institutions, and group-level links.</p>
          </header>
          <Badge variant="outline" className="h-8 rounded-md px-2 text-xs">
            {rows.length} groups · {mentionsTotal} mentions
          </Badge>
        </div>

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
                <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-8" placeholder="Search groups by name" />
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
                  <DropdownMenuLabel>Category visibility</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem checked={showGovernment} onCheckedChange={(checked) => setShowGovernment(Boolean(checked))}>
                    Government
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={showCompany} onCheckedChange={(checked) => setShowCompany(Boolean(checked))}>
                    Company
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={showInstitution} onCheckedChange={(checked) => setShowInstitution(Boolean(checked))}>
                    Institution
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem checked={showNgo} onCheckedChange={(checked) => setShowNgo(Boolean(checked))}>
                    NGO
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border/70">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Category</th>
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
                          <p className="truncate whitespace-nowrap font-medium text-foreground">{row.name}</p>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="start" className="text-xs">
                          {row.name}
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${categoryToneMap[row.category]}`}>
                        {categoryLabelMap[row.category]}
                      </span>
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
                    <td colSpan={6} className="px-3 py-6 text-center text-sm text-muted-foreground">
                      {!rows.length ? "No group markdown files found in dossier/groups." : "No groups matched your current filters."}
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
