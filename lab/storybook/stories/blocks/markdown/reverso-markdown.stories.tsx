import React, { useMemo, useState } from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"

import { ReversoMarkdown, type ReversoMarkdownVariant } from "@/components/app/markdown/ReversoMarkdown"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

import dossierPersonRaw from "../../../../agent/filesystem/dossier/people/alessandra-araujo-do-vale.md?raw"
import dossierTimelineRaw from "../../../../agent/filesystem/dossier/timeline/2021/2021-05.md?raw"
import investigationLeadRaw from "../../../../agent/filesystem/investigation/leads/lead-consistency-and-justification-of-direct-emergency-contracting.md?raw"
import sourceArtifactRaw from "../../../../agent/filesystem/source/.artifacts/2023-fornecimento-de-cafe-05a8f7a5/index.md?raw"

type MarkdownCorpusDocument = {
  id: string
  label: string
  domain: "dossier" | "investigation" | "source"
  content: string
}

const markdownCorpus: MarkdownCorpusDocument[] = [
  {
    id: "dossier-person",
    label: "Dossier / Person",
    domain: "dossier",
    content: dossierPersonRaw,
  },
  {
    id: "dossier-timeline",
    label: "Dossier / Timeline",
    domain: "dossier",
    content: dossierTimelineRaw,
  },
  {
    id: "investigation-lead",
    label: "Investigation / Lead",
    domain: "investigation",
    content: investigationLeadRaw,
  },
  {
    id: "source-artifact-index",
    label: "Source / .artifacts index",
    domain: "source",
    content: sourceArtifactRaw,
  },
]

type ReversoMarkdownFamilyStoryProps = {
  title: string
  subtitle: string
  variant: ReversoMarkdownVariant
}

function getVariantBadgeLabel(variant: ReversoMarkdownVariant): string {
  if (variant === "editorial") return "Editorial Prose"
  if (variant === "evidence") return "Evidence Cards"
  if (variant === "analyst") return "Analyst Workspace"
  return "Default"
}

function ReversoMarkdownFamilyStory({
  title,
  subtitle,
  variant,
}: ReversoMarkdownFamilyStoryProps): React.JSX.Element {
  const [lastClick, setLastClick] = useState<string>("Nenhum wikilink clicado")

  const resolver = useMemo(
    () => (value: string) => `/lab/agent/filesystem/dossier/${value.toLowerCase().replace(/\s+/g, "-")}.md`,
    []
  )

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-6">
      <header className="space-y-2">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{getVariantBadgeLabel(variant)}</Badge>
          <Separator orientation="vertical" className="h-4" />
          <p className="text-xs text-muted-foreground">{lastClick}</p>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-2">
        {markdownCorpus.map((document) => (
          <section key={document.id} className="space-y-2 rounded-xl border border-border/70 bg-card/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">{document.label}</p>
              <Badge variant="outline" className="uppercase">
                {document.domain}
              </Badge>
            </div>
            <ScrollArea className="h-104 rounded-lg border border-border/60 bg-background/70 p-3">
              <ReversoMarkdown
                content={document.content}
                variant={variant}
                wikiLinkResolver={resolver}
                onWikiLinkClick={(value, href) => setLastClick(`Wikilink: [[${value}]] -> ${href}`)}
              />
            </ScrollArea>
          </section>
        ))}
      </div>
    </div>
  )
}

type ReversoMarkdownSingleStoryProps = {
  title: string
  content: string
  variant: ReversoMarkdownVariant
}

function ReversoMarkdownSingleStory({
  title,
  content,
  variant,
}: ReversoMarkdownSingleStoryProps): React.JSX.Element {
  const [lastClick, setLastClick] = useState<string>("Nenhum wikilink clicado")

  const resolver = useMemo(
    () => (value: string) => `/lab/agent/filesystem/dossier/${value.toLowerCase().replace(/\s+/g, "-")}.md`,
    []
  )

  return (
    <div className="mx-auto w-full max-w-5xl space-y-3 p-6">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{lastClick}</p>
      </header>
      <ReversoMarkdown
        content={content}
        variant={variant}
        wikiLinkResolver={resolver}
        onWikiLinkClick={(value, href) => setLastClick(`Wikilink: [[${value}]] -> ${href}`)}
      />
    </div>
  )
}

const meta = {
  title: "blocks/Markdown/ReversoMarkdown",
  component: ReversoMarkdownFamilyStory,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof ReversoMarkdownFamilyStory>

export default meta
type Story = StoryObj<typeof meta>

export const EditorialFamilyCorpus: Story = {
  args: {
    title: "Markdown style family / Editorial Prose",
    subtitle: "Foco em legibilidade de leitura longa com hierarquia tipografica e espacamento amplo.",
    variant: "editorial",
  },
}

export const EvidenceFamilyCorpus: Story = {
  args: {
    title: "Markdown style family / Evidence Cards",
    subtitle: "Foco investigativo, destacando metadados, wikilinks e blocos :::event como evidencias.",
    variant: "evidence",
  },
}

export const AnalystFamilyCorpus: Story = {
  args: {
    title: "Markdown style family / Analyst Workspace",
    subtitle: "Foco operacional com densidade maior para manter contexto no fluxo do ViewerPanel.",
    variant: "analyst",
  },
}

export const TimelineEventDetail: Story = {
  render: () => (
    <ReversoMarkdownSingleStory
      title="Dossier / Timeline with :::event (real file)"
      content={dossierTimelineRaw}
      variant="evidence"
    />
  ),
}
