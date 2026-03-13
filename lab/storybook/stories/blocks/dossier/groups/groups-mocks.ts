export type GroupCategory = 'government' | 'company' | 'institution' | 'ngo'

export type GroupRow = {
  id: string
  name: string
  category: GroupCategory
  mentionsCount: number
  updatedAt: string
  viewPath: string
}

export const groupActionCommands = [
  'research --source',
  'research --web',
  'deep-research --source',
  'deep-research --web'
] as const

export const groupsRowsMock: GroupRow[] = [
  {
    id: 'group-01',
    name: 'Secretaria Municipal de Saude',
    category: 'government',
    mentionsCount: 14,
    updatedAt: '2026-03-12T16:22:00.000Z',
    viewPath: 'dossier/groups/secretaria-municipal-de-saude.md'
  },
  {
    id: 'group-02',
    name: 'ABCON Consultoria e Engenharia EIRELI',
    category: 'company',
    mentionsCount: 9,
    updatedAt: '2026-03-12T15:01:00.000Z',
    viewPath: 'dossier/groups/abcon-consultoria-e-engenharia-eireli.md'
  },
  {
    id: 'group-03',
    name: 'COHAB Companhia de Habitacao',
    category: 'institution',
    mentionsCount: 7,
    updatedAt: '2026-03-12T14:37:00.000Z',
    viewPath: 'dossier/groups/cohab-companhia-de-habitacao.md'
  },
  {
    id: 'group-04',
    name: 'Instituto Transparencia Local',
    category: 'ngo',
    mentionsCount: 4,
    updatedAt: '2026-03-11T20:48:00.000Z',
    viewPath: 'dossier/groups/instituto-transparencia-local.md'
  }
]
