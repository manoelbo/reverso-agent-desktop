import React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { TimelinePageHeader, TimelineSummaryBadge, TimelineTableShell } from '../blocks/dossier/timeline/timeline-components'
import { timelineRowsMock } from '../blocks/dossier/timeline/timeline-mocks'

type DossierTimelinePageProps = {
  subtitle: string
}

function DossierTimelinePage({ subtitle }: DossierTimelinePageProps): React.JSX.Element {
  return (
    <section className='mx-auto flex w-full max-w-368 flex-col gap-4 px-6 py-6'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <TimelinePageHeader title='Timeline' subtitle={subtitle} />
        <TimelineSummaryBadge rows={timelineRowsMock} />
      </div>
      <TimelineTableShell rows={timelineRowsMock} />
    </section>
  )
}

const meta = {
  title: 'screens/DossierTimelinePage',
  component: DossierTimelinePage,
  parameters: {
    layout: 'fullscreen'
  },
  args: {
    subtitle: 'Follow chronology by year and month using folder filters.'
  }
} satisfies Meta<typeof DossierTimelinePage>

export default meta
type Story = StoryObj<typeof meta>

export const TimelineFolderDrivenList: Story = {}
