import React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { SourcesTableShell, SourcesUploadDropzone } from '../blocks/sources/sources-components'
import { sourcesRowsMock } from '../blocks/sources/sources-mocks'

type SourcesPageVariantProps = {
  subtitle: string
  dropzoneEmphasis: 'subtle' | 'balanced' | 'prominent'
  showMetaColumns: boolean
  showInlineFilters: boolean
}

function SourcesPageVariant({
  subtitle,
  dropzoneEmphasis,
  showMetaColumns,
  showInlineFilters
}: SourcesPageVariantProps): React.JSX.Element {
  return (
    <section className='mx-auto flex w-full max-w-[92rem] flex-col gap-4 px-6 py-6'>
      <header className='space-y-1 rounded-xl border border-border/70 bg-card/60 px-5 py-4'>
        <h1 className='text-2xl font-semibold tracking-tight text-foreground'>Sources</h1>
        <p className='text-sm text-muted-foreground'>{subtitle}</p>
      </header>

      <SourcesUploadDropzone
        headline='Drop PDF files or upload from your device'
        helperText='PDF only. Original files remain immutable for evidence integrity.'
        emphasis={dropzoneEmphasis}
      />

      <SourcesTableShell rows={sourcesRowsMock} showMetaColumns={showMetaColumns} showInlineFilters={showInlineFilters} />
    </section>
  )
}

const meta = {
  title: 'screens/SourcesPage',
  component: SourcesPageVariant,
  parameters: {
    layout: 'fullscreen'
  },
  args: {
    subtitle: 'Ingest, track, and process source documents reliably.',
    dropzoneEmphasis: 'balanced',
    showMetaColumns: true,
    showInlineFilters: true
  }
} satisfies Meta<typeof SourcesPageVariant>

export default meta
type Story = StoryObj<typeof meta>

export const VariantAOperationalDesk: Story = {
  args: {
    subtitle: 'Ingest, track, and process source documents reliably.',
    dropzoneEmphasis: 'balanced',
    showMetaColumns: true,
    showInlineFilters: true
  }
}

export const VariantBGuidedFlow: Story = {
  args: {
    subtitle: 'Upload evidence quickly and process with confidence.',
    dropzoneEmphasis: 'prominent',
    showMetaColumns: false,
    showInlineFilters: false
  }
}

export const VariantCAnalystWorkspace: Story = {
  args: {
    subtitle: 'Monitor processing health, retries, and actionable metadata.',
    dropzoneEmphasis: 'subtle',
    showMetaColumns: true,
    showInlineFilters: true
  }
}
