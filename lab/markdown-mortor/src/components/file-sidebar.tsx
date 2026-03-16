import { useState } from "react"
import { cn } from "@/lib/utils"
import type { DossierFile, DossierTree, DossierTreeEntry } from "@/lib/dossier-loader"

type FileSidebarProps = {
  trees: DossierTree[]
  selectedPath: string | null
  onSelect: (file: DossierFile) => void
}

const sectionAccent: Record<string, string> = {
  groups: "text-sky-400",
  people: "text-indigo-400",
  places: "text-emerald-400",
  timeline: "text-amber-400",
  sources: "text-rose-400",
  leads: "text-violet-400",
  findings: "text-teal-400",
  allegations: "text-red-400",
}

const sectionDot: Record<string, string> = {
  groups: "bg-sky-400",
  people: "bg-indigo-400",
  places: "bg-emerald-400",
  timeline: "bg-amber-400",
  sources: "bg-rose-400",
  leads: "bg-violet-400",
  findings: "bg-teal-400",
  allegations: "bg-red-400",
}

function SectionIcon({ section }: { section: string }) {
  const icons: Record<string, string> = {
    groups: "⬡",
    people: "◉",
    places: "◈",
    timeline: "◆",
    sources: "⊡",
    leads: "◐",
    findings: "◆",
    allegations: "⚠",
  }
  return (
    <span className={cn("text-[11px]", sectionAccent[section])}>
      {icons[section] ?? "◦"}
    </span>
  )
}

type TreeEntryProps = {
  entry: DossierTreeEntry
  section: string
  selectedPath: string | null
  onSelect: (file: DossierFile) => void
  depth: number
}

function TreeEntry({ entry, section, selectedPath, onSelect, depth }: TreeEntryProps) {
  const [open, setOpen] = useState(depth === 0)
  const isFolder = Boolean(entry.folder)
  const isSelected = entry.file ? entry.file.relativePath === selectedPath : false

  if (isFolder && entry.children) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "group flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors",
          )}
          style={{ paddingLeft: `${8 + depth * 12}px` }}
        >
          <span className="text-[9px] text-muted-foreground/60 transition-transform" style={{ transform: open ? "rotate(90deg)" : "none" }}>
            ▶
          </span>
          <span className="truncate font-medium">{entry.label}</span>
          <span className="ml-auto text-[10px] text-muted-foreground/40">{countFiles(entry.children)}</span>
        </button>
        {open && (
          <div>
            {entry.children.map((child) => (
              <TreeEntry
                key={child.path}
                entry={child}
                section={section}
                selectedPath={selectedPath}
                onSelect={onSelect}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (entry.file) {
    return (
      <button
        type="button"
        onClick={() => onSelect(entry.file!)}
        className={cn(
          "group flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs transition-colors",
          isSelected
            ? "bg-primary/10 text-foreground font-medium"
            : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
        )}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
      >
        <span className={cn("size-1.5 shrink-0 rounded-full", isSelected ? sectionDot[section] : "bg-border")} />
        <span className="truncate">{entry.label}</span>
      </button>
    )
  }

  return null
}

function countFiles(entries: DossierTreeEntry[]): number {
  let count = 0
  for (const e of entries) {
    if (e.file) count += 1
    if (e.children) count += countFiles(e.children)
  }
  return count
}

type SectionGroupProps = {
  tree: DossierTree
  selectedPath: string | null
  onSelect: (file: DossierFile) => void
}

function SectionGroup({ tree, selectedPath, onSelect }: SectionGroupProps) {
  const [open, setOpen] = useState(true)
  const total = countFiles(tree.entries)

  return (
    <div className="border-b border-border/40 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted/30 transition-colors"
      >
        <SectionIcon section={tree.section} />
        <span className={cn("text-xs font-semibold tracking-wide uppercase", sectionAccent[tree.section])}>
          {tree.label}
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground/50">{total}</span>
        <span className="text-[9px] text-muted-foreground/40 transition-transform" style={{ transform: open ? "rotate(90deg)" : "none" }}>
          ▶
        </span>
      </button>
      {open && (
        <div className="pb-1">
          {tree.entries.map((entry) => (
            <TreeEntry
              key={entry.path}
              entry={entry}
              section={tree.section}
              selectedPath={selectedPath}
              onSelect={onSelect}
              depth={0}
            />
          ))}
          {tree.entries.length === 0 && (
            <p className="px-4 py-2 text-[11px] text-muted-foreground/50 italic">Sem arquivos</p>
          )}
        </div>
      )}
    </div>
  )
}

export function FileSidebar({ trees, selectedPath, onSelect }: FileSidebarProps) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border/60 bg-sidebar">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/60 px-3 py-3">
        <div className="flex size-5 items-center justify-center rounded bg-muted/60">
          <span className="text-[10px] font-bold text-muted-foreground">M</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold text-foreground">Markdown Mortor</span>
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">Dossier Lab</span>
        </div>
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {trees.map((tree) => (
          <SectionGroup
            key={tree.section}
            tree={tree}
            selectedPath={selectedPath}
            onSelect={onSelect}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-border/40 px-3 py-2">
        <p className="text-[10px] text-muted-foreground/40 font-mono">
          lab/agent/filesystem/dossier
        </p>
      </div>
    </aside>
  )
}
