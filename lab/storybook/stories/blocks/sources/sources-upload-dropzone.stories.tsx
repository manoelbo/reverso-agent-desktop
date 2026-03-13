import React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { SourcesUploadDropzone } from './sources-components'

const meta = {
  title: 'blocks/sources/SourcesUploadDropzone',
  component: SourcesUploadDropzone,
  args: {
    headline: 'Drop PDF files or upload from your device',
    helperText: 'PDF only. Original file is preserved for traceability.',
    emphasis: 'balanced'
  },
  parameters: {
    layout: 'padded'
  }
} satisfies Meta<typeof SourcesUploadDropzone>

export default meta
type Story = StoryObj<typeof meta>

export const Balanced: Story = {}

export const Subtle: Story = {
  args: {
    emphasis: 'subtle',
    helperText: 'Use this mode for quick single-file ingestion.'
  }
}

export const Prominent: Story = {
  args: {
    emphasis: 'prominent',
    helperText: 'Best for batch intake during active investigations.'
  }
}
