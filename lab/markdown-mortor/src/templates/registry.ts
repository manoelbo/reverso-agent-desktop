import type { ComponentType } from "react"

export type TemplateProps = {
  content: string
  relativePath: string
  variationId: string
  onNavigate?: (relativePath: string) => void
  wikiLinkResolver?: (value: string) => string
}

export type TemplateVariation = {
  id: string
  label: string
  description?: string
}

export type TemplateDefinition = {
  id: string
  label: string
  description: string
  component: ComponentType<TemplateProps>
  variations: TemplateVariation[]
  defaultVariation: string
}

const registry: TemplateDefinition[] = []

export function registerTemplate(def: TemplateDefinition): void {
  registry.push(def)
}

export function getTemplates(): TemplateDefinition[] {
  return registry
}

export function getTemplate(id: string): TemplateDefinition | undefined {
  return registry.find((t) => t.id === id)
}
