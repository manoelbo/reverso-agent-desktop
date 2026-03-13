import React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { GroupsPageHeader, GroupsSummaryBadge, GroupsTableShell } from '../blocks/dossier/groups/groups-components'
import { groupsRowsMock } from '../blocks/dossier/groups/groups-mocks'

type DossierGroupsPageProps = {
  subtitle: string
}

function DossierGroupsPage({ subtitle }: DossierGroupsPageProps): React.JSX.Element {
  return (
    <section className='mx-auto flex w-full max-w-368 flex-col gap-4 px-6 py-6'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <GroupsPageHeader title='Groups' subtitle={subtitle} />
        <GroupsSummaryBadge rows={groupsRowsMock} />
      </div>
      <GroupsTableShell rows={groupsRowsMock} />
    </section>
  )
}

const meta = {
  title: 'screens/DossierGroupsPage',
  component: DossierGroupsPage,
  parameters: {
    layout: 'fullscreen'
  },
  args: {
    subtitle: 'Track organizations, institutions, and group-level links.'
  }
} satisfies Meta<typeof DossierGroupsPage>

export default meta
type Story = StoryObj<typeof meta>

export const GroupsOperationalList: Story = {}
