import React from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { PlacesPageHeader, PlacesSummaryBadge, PlacesTableShell } from '../blocks/dossier/places/places-components'
import { placesRowsMock } from '../blocks/dossier/places/places-mocks'

type DossierPlacesPageProps = {
  subtitle: string
}

function DossierPlacesPage({ subtitle }: DossierPlacesPageProps): React.JSX.Element {
  return (
    <section className='mx-auto flex w-full max-w-368 flex-col gap-4 px-6 py-6'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <PlacesPageHeader title='Places' subtitle={subtitle} />
        <PlacesSummaryBadge rows={placesRowsMock} />
      </div>
      <PlacesTableShell rows={placesRowsMock} />
    </section>
  )
}

const meta = {
  title: 'screens/DossierPlacesPage',
  component: DossierPlacesPage,
  parameters: {
    layout: 'fullscreen'
  },
  args: {
    subtitle: 'Browse final place files and filter by folder hierarchy.'
  }
} satisfies Meta<typeof DossierPlacesPage>

export default meta
type Story = StoryObj<typeof meta>

export const PlacesFolderDrivenList: Story = {}
