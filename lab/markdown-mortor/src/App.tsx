import { useCallback, useEffect, useMemo, useState } from "react"

// Templates must be imported to trigger side-effect registration
import "@/templates/editorial-dossier"
import "@/templates/source-preview"

import { FileSidebar } from "@/components/file-sidebar"
import { TemplateControls } from "@/components/template-controls"
import { RenderPanel, type RenderState } from "@/components/render-panel"
import { loadDossierFiles, groupBySection, type DossierFile } from "@/lib/dossier-loader"
import { loadSourceFiles, buildSourceTree } from "@/lib/source-loader"
import { getTemplates } from "@/templates/registry"
import { normalizeWikiKey } from "@/lib/utils"

function ThemeToggle({ theme, onToggle }: { theme: "light" | "dark"; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-2.5 flex size-7 items-center justify-center rounded border border-border/60 bg-background text-[11px] text-muted-foreground hover:bg-muted/50 transition-colors z-10"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? "☀" : "◐"}
    </button>
  )
}

export function App() {
  const [theme, setTheme] = useState<"light" | "dark">("dark")
  const [selectedFile, setSelectedFile] = useState<DossierFile | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const [selectedVariationId, setSelectedVariationId] = useState<string>("")
  const [contentCache, setContentCache] = useState<Map<string, string>>(new Map())
  const [cacheReady, setCacheReady] = useState(false)
  const [renderState, setRenderState] = useState<RenderState>({ status: "initializing", loaded: 0, total: 0 })

  // Initialize template selection from registry
  useEffect(() => {
    const templates = getTemplates()
    if (templates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(templates[0].id)
      setSelectedVariationId(templates[0].defaultVariation)
    }
  }, [selectedTemplateId])

  // Apply theme to html element
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", theme === "dark")
    root.classList.toggle("light", theme === "light")
  }, [theme])

  const dossierFiles = useMemo(() => loadDossierFiles(), [])
  const sourceFiles = useMemo(() => loadSourceFiles(), [])
  // Unified list: dossier files for wikiIndex + source files for cache/sidebar
  const files = useMemo(() => [...dossierFiles, ...sourceFiles], [dossierFiles, sourceFiles])
  const trees = useMemo(() => [...groupBySection(dossierFiles), buildSourceTree(sourceFiles)], [dossierFiles, sourceFiles])

  // Eager-load all files at startup
  useEffect(() => {
    if (files.length === 0) return

    const total = files.length
    setRenderState({ status: "initializing", loaded: 0, total })

    let loaded = 0
    const cache = new Map<string, string>()

    Promise.allSettled(
      files.map(async (file) => {
        const content = await file.load()
        cache.set(file.relativePath, content)
        loaded++
        setRenderState((prev) =>
          prev.status === "initializing"
            ? { status: "initializing", loaded, total }
            : prev
        )
      })
    ).then(() => {
      setContentCache(cache)
      setCacheReady(true)
      setRenderState({ status: "idle" })
    })
  }, [files])

  // Auto-render when selectedFile, template, or variation changes (reactive, from cache)
  useEffect(() => {
    if (!cacheReady || !selectedFile) return
    const content = contentCache.get(selectedFile.relativePath)
    if (!content) return
    setRenderState({
      status: "rendered",
      content,
      relativePath: selectedFile.relativePath,
      templateId: selectedTemplateId,
      variationId: selectedVariationId,
    })
  }, [selectedFile, selectedTemplateId, selectedVariationId, cacheReady, contentCache])

  // Wiki index: stem e nome normalizado → DossierFile (apenas dossier, sources não são backlinked)
  const wikiIndex = useMemo(() => {
    const map = new Map<string, DossierFile>()
    for (const file of dossierFiles) {
      const stem = file.relativePath.split("/").at(-1)?.replace(/\.md$/, "") ?? ""
      map.set(stem, file)
      map.set(normalizeWikiKey(file.label), file)
      map.set(normalizeWikiKey(stem), file)
    }
    return map
  }, [dossierFiles])

  const wikiLinkResolver = useCallback(
    (value: string): string => {
      const key = normalizeWikiKey(value)
      const file = wikiIndex.get(key) ?? wikiIndex.get(value)
      return file ? `dossier://${file.relativePath}` : `#unresolved/${encodeURIComponent(value)}`
    },
    [wikiIndex]
  )

  // Navigate via wikilink — sync from cache
  const handleNavigate = useCallback(
    (relativePath: string) => {
      const file = files.find((f) => f.relativePath === relativePath)
      if (!file) return
      setSelectedFile(file)
      // auto-render useEffect will handle rendering from cache
    },
    [files]
  )

  // Sidebar file selection — sync, auto-render reacts
  // Auto-switch template when switching between dossier and source files
  const handleSelectFile = (file: DossierFile) => {
    setSelectedFile(file)
    if (file.section === "sources" && selectedTemplateId !== "source-preview") {
      setSelectedTemplateId("source-preview")
      setSelectedVariationId("editorial")
    } else if (file.section !== "sources" && selectedTemplateId === "source-preview") {
      const firstDossierTemplate = getTemplates().find((t) => t.id !== "source-preview")
      if (firstDossierTemplate) {
        setSelectedTemplateId(firstDossierTemplate.id)
        setSelectedVariationId(firstDossierTemplate.defaultVariation)
      }
    }
  }

  // Template/variation changes — auto-render useEffect reacts
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId)
  }

  const handleVariationChange = (variationId: string) => {
    setSelectedVariationId(variationId)
  }

  // Gallery — sync from cache, no async loading needed
  const handleRenderAll = useCallback(() => {
    if (!cacheReady) return
    const items = files
      .filter((f) => contentCache.has(f.relativePath))
      .map((f) => ({ relativePath: f.relativePath, content: contentCache.get(f.relativePath)! }))
    setRenderState({
      status: "rendered_all",
      items,
      templateId: selectedTemplateId,
      variationId: selectedVariationId,
    })
  }, [cacheReady, contentCache, files, selectedTemplateId, selectedVariationId])

  // Gallery card click — select file, auto-render useEffect takes over
  const handleSelectFromGallery = useCallback(
    (relativePath: string) => {
      const file = files.find((f) => f.relativePath === relativePath)
      if (!file) return
      setSelectedFile(file)
      // auto-render useEffect will set renderState to "rendered"
    },
    [files]
  )

  return (
    <div className="relative flex h-full bg-background">
      <ThemeToggle theme={theme} onToggle={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} />

      {/* Sidebar */}
      <FileSidebar
        trees={trees}
        selectedPath={selectedFile?.relativePath ?? null}
        onSelect={handleSelectFile}
      />

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TemplateControls
          selectedFile={selectedFile?.relativePath ?? null}
          selectedTemplateId={selectedTemplateId}
          selectedVariationId={selectedVariationId}
          onTemplateChange={handleTemplateChange}
          onVariationChange={handleVariationChange}
          onRenderAll={handleRenderAll}
          cacheReady={cacheReady}
        />

        <RenderPanel
          renderState={renderState}
          onNavigate={handleNavigate}
          wikiLinkResolver={wikiLinkResolver}
          onSelectFile={handleSelectFromGallery}
        />
      </div>
    </div>
  )
}
