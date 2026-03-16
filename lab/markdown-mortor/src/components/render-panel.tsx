import { getTemplate } from "@/templates/registry"

type RenderState =
  | { status: "initializing"; loaded: number; total: number }
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "rendered"; content: string; relativePath: string; templateId: string; variationId: string }
  | { status: "rendered_all"; items: Array<{ relativePath: string; content: string }>; templateId: string; variationId: string }

type RenderPanelProps = {
  renderState: RenderState
  onNavigate?: (relativePath: string) => void
  wikiLinkResolver?: (value: string) => string
  onSelectFile?: (relativePath: string) => void
}

export type { RenderState }

export function RenderPanel({ renderState, onNavigate, wikiLinkResolver, onSelectFile }: RenderPanelProps) {
  if (renderState.status === "initializing") {
    const pct = renderState.total > 0 ? Math.round((renderState.loaded / renderState.total) * 100) : 0
    return (
      <div className="flex flex-1 items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 w-52">
          <div className="flex flex-col items-center gap-2">
            <div className="size-5 animate-spin rounded-full border-2 border-border border-t-primary" />
            <p className="text-xs text-muted-foreground">
              {renderState.total > 0
                ? `Carregando ${renderState.loaded} de ${renderState.total} documentos…`
                : "Iniciando…"}
            </p>
          </div>
          {renderState.total > 0 && (
            <div className="w-full">
              <div className="h-1 w-full rounded-full bg-border overflow-hidden">
                <div
                  className="h-1 rounded-full bg-primary transition-all duration-150"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1.5 text-center font-mono text-[10px] text-muted-foreground/50">
                {pct}%
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (renderState.status === "idle") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-background">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-border/60 bg-muted/30">
            <span className="text-2xl opacity-40">◈</span>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground/60">Selecione um arquivo</p>
            <p className="text-xs text-muted-foreground/50">
              Clique em qualquer documento na sidebar para visualizá-lo.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (renderState.status === "error") {
    return (
      <div className="flex flex-1 items-center justify-center bg-background p-8">
        <div className="max-w-md rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-center">
          <p className="text-sm font-medium text-destructive">Erro ao carregar documentos</p>
          <p className="mt-1 text-xs text-muted-foreground">{renderState.message}</p>
        </div>
      </div>
    )
  }

  if (renderState.status === "rendered") {
    const template = getTemplate(renderState.templateId)
    if (!template) {
      return (
        <div className="flex flex-1 items-center justify-center bg-background">
          <p className="text-sm text-muted-foreground">Template não encontrado: {renderState.templateId}</p>
        </div>
      )
    }

    const TemplateComponent = template.component
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <TemplateComponent
          content={renderState.content}
          relativePath={renderState.relativePath}
          variationId={renderState.variationId}
          onNavigate={onNavigate}
          wikiLinkResolver={wikiLinkResolver}
        />
      </div>
    )
  }

  if (renderState.status === "rendered_all") {
    const template = getTemplate(renderState.templateId)
    if (!template) {
      return (
        <div className="flex flex-1 items-center justify-center bg-background">
          <p className="text-sm text-muted-foreground">Template não encontrado: {renderState.templateId}</p>
        </div>
      )
    }

    const TemplateComponent = template.component
    const { items, variationId } = renderState

    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header da galeria */}
        <div className="flex items-center gap-3 border-b border-border/50 px-5 py-3 bg-background shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Galeria</span>
            <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">
              {items.length} docs
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground/50">Clique em um card para abrir o documento</span>
        </div>

        {/* Grid de cards */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {items.map((item) => {
              const filename = item.relativePath.split("/").at(-1)?.replace(/\.md$/, "") ?? item.relativePath
              return (
                <button
                  key={item.relativePath}
                  onClick={() => onSelectFile?.(item.relativePath)}
                  className="group relative w-full overflow-hidden rounded-xl border border-border/60 bg-background text-left transition-all hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  {/* Label do arquivo */}
                  <div className="flex items-center gap-2 border-b border-border/40 bg-muted/20 px-3 py-2">
                    <span className="font-mono text-[10px] text-muted-foreground truncate">{filename}</span>
                    <span className="ml-auto shrink-0 text-[10px] text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      Abrir →
                    </span>
                  </div>

                  {/* Preview do template em escala reduzida */}
                  <div className="relative h-[340px] overflow-hidden pointer-events-none select-none">
                    <div className="absolute inset-0 origin-top-left scale-[0.6]" style={{ width: "167%", height: "167%" }}>
                      <TemplateComponent
                        content={item.content}
                        relativePath={item.relativePath}
                        variationId={variationId}
                        wikiLinkResolver={wikiLinkResolver}
                      />
                    </div>
                    {/* Fade no rodapé do preview */}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-background to-transparent" />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return null
}
