import { cn } from "@/lib/utils"
import { Button } from "@/ui/button"
import { getTemplates, type TemplateDefinition } from "@/templates/registry"

type TemplateControlsProps = {
  selectedFile: string | null
  selectedTemplateId: string
  selectedVariationId: string
  onTemplateChange: (templateId: string) => void
  onVariationChange: (variationId: string) => void
  onRenderAll: () => void
  cacheReady: boolean
}

const selectClass = cn(
  "h-8 rounded-md border border-border/70 bg-background px-3 text-xs text-foreground",
  "focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring",
  "hover:border-border transition-colors cursor-pointer",
  "disabled:opacity-50 disabled:cursor-not-allowed"
)

export function TemplateControls({
  selectedFile,
  selectedTemplateId,
  selectedVariationId,
  onTemplateChange,
  onVariationChange,
  onRenderAll,
  cacheReady,
}: TemplateControlsProps) {
  const templates = getTemplates()
  const currentTemplate = templates.find((t) => t.id === selectedTemplateId)

  const handleTemplateChange = (templateId: string) => {
    onTemplateChange(templateId)
    const tpl = templates.find((t) => t.id === templateId)
    if (tpl) {
      onVariationChange(tpl.defaultVariation)
    }
  }

  return (
    <div className="flex h-11 shrink-0 items-center gap-2 border-b border-border/60 bg-background px-4">
      {/* File indicator */}
      {selectedFile ? (
        <div className="flex items-center gap-1.5 mr-2">
          <span className="size-1.5 rounded-full bg-primary/60" />
          <span className="max-w-[24ch] truncate font-mono text-[11px] text-muted-foreground">
            {selectedFile}
          </span>
        </div>
      ) : (
        <span className="mr-2 text-[11px] text-muted-foreground/50 italic">
          {cacheReady ? "Nenhum arquivo selecionado" : "Carregando…"}
        </span>
      )}

      <div className="h-4 w-px bg-border/60" />

      {/* Template selector */}
      <div className="flex items-center gap-1.5">
        <label htmlFor="template-select" className="text-[11px] text-muted-foreground whitespace-nowrap">
          Template
        </label>
        <select
          id="template-select"
          value={selectedTemplateId}
          onChange={(e) => handleTemplateChange(e.target.value)}
          className={selectClass}
          disabled={!selectedFile}
        >
          {templates.map((t: TemplateDefinition) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Variation selector */}
      <div className="flex items-center gap-1.5">
        <label htmlFor="variation-select" className="text-[11px] text-muted-foreground whitespace-nowrap">
          Variação
        </label>
        <select
          id="variation-select"
          value={selectedVariationId}
          onChange={(e) => onVariationChange(e.target.value)}
          className={selectClass}
          disabled={!selectedFile || !currentTemplate}
        >
          {(currentTemplate?.variations ?? []).map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      {/* Template description */}
      {currentTemplate && (
        <>
          <div className="h-4 w-px bg-border/60" />
          <p className="hidden text-[11px] text-muted-foreground/60 lg:block max-w-[32ch] truncate">
            {currentTemplate.variations.find((v) => v.id === selectedVariationId)?.description ??
              currentTemplate.description}
          </p>
        </>
      )}

      <div className="ml-auto flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onRenderAll}
          disabled={!cacheReady}
          className="gap-1.5 text-xs"
        >
          <span className="text-[10px]">▶▶</span>
          Galeria
        </Button>
      </div>
    </div>
  )
}
