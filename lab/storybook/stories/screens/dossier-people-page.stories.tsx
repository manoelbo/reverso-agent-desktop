import React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { PeoplePageHeader, PeopleSummaryBadge, PeopleTableShell } from '../blocks/dossier/people/people-components'
import { peopleRowsMock } from '../blocks/dossier/people/people-mocks'

type DossierPeoplePageProps = {
  subtitle: string
}

function DossierPeoplePage({ subtitle }: DossierPeoplePageProps): React.JSX.Element {
  return (
    <section className='mx-auto flex w-full max-w-368 flex-col gap-4 px-6 py-6'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <PeoplePageHeader title='People' subtitle={subtitle} />
        <PeopleSummaryBadge rows={peopleRowsMock} />
      </div>
      <PeopleTableShell rows={peopleRowsMock} />
    </section>
  )
}

const meta = {
  title: 'screens/DossierPeoplePage',
  component: DossierPeoplePage,
  parameters: {
    layout: 'fullscreen'
  },
  args: {
    subtitle: 'Track entities, mentions, and dossier links in one place.'
  }
} satisfies Meta<typeof DossierPeoplePage>

export default meta
type Story = StoryObj<typeof meta>

export const PeopleOperationalList: Story = {}
