export type PeopleCategory = 'person' | 'public-agent' | 'contractor' | 'witness' | 'unknown'

export type PeopleRow = {
  id: string
  name: string
  category: PeopleCategory
  mentionsCount: number
  updatedAt: string
  viewPath: string
}

export const peopleActionCommands = [
  'research --source',
  'research --web',
  'deep-research --source',
  'deep-research --web'
] as const

export const peopleRowsMock: PeopleRow[] = [
  {
    id: 'person-01',
    name: 'Alessandra Araujo do Vale',
    category: 'public-agent',
    mentionsCount: 12,
    updatedAt: '2026-03-12T16:42:00.000Z',
    viewPath: 'dossier/people/alessandra-araujo-do-vale.md'
  },
  {
    id: 'person-02',
    name: 'Andre Santos',
    category: 'contractor',
    mentionsCount: 8,
    updatedAt: '2026-03-12T15:05:00.000Z',
    viewPath: 'dossier/people/andre-santos.md'
  },
  {
    id: 'person-03',
    name: 'Carolina Melo',
    category: 'witness',
    mentionsCount: 5,
    updatedAt: '2026-03-12T14:18:00.000Z',
    viewPath: 'dossier/people/carolina-melo.md'
  },
  {
    id: 'person-04',
    name: 'Fernando Queiroz',
    category: 'person',
    mentionsCount: 3,
    updatedAt: '2026-03-11T21:40:00.000Z',
    viewPath: 'dossier/people/fernando-queiroz.md'
  },
  {
    id: 'person-05',
    name: 'Unknown Contact (Invoice Annex)',
    category: 'unknown',
    mentionsCount: 2,
    updatedAt: '2026-03-10T10:22:00.000Z',
    viewPath: 'dossier/people/unknown-contact-invoice-annex.md'
  }
]
