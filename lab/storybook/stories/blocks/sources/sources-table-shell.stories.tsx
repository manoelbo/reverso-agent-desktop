import React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { SourcesTableShell } from './sources-components'
import { sourcesRowsMock } from './sources-mocks'

const meta = {
  title: 'blocks/sources/SourcesTableShell',
  component: SourcesTableShell,
  args: {
    rows: sourcesRowsMock,
    showMetaColumns: true,
    showInlineFilters: true
  },
  parameters: {
    layout: 'fullscreen'
  }
} satisfies Meta<typeof SourcesTableShell>

export default meta
type Story = StoryObj<typeof meta>

export const OperationalDense: Story = {}

export const GuidedCompact: Story = {
  args: {
    showMetaColumns: false,
    showInlineFilters: false
  }
}

export const AnalystTelemetry: Story = {
  args: {
    showMetaColumns: true,
    showInlineFilters: true
  }
}
