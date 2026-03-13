export type TimelineRow = {
  id: string
  title: string
  year: string
  month: string
  mentionsCount: number
  updatedAt: string
  viewPath: string
}

export const timelineActionCommands = [
  'research --source',
  'research --web',
  'deep-research --source',
  'deep-research --web'
] as const

export const timelineRowsMock: TimelineRow[] = [
  {
    id: 'timeline-01',
    title: 'Early procurement notes',
    year: '2019',
    month: '08',
    mentionsCount: 5,
    updatedAt: '2026-03-12T15:48:00.000Z',
    viewPath: 'dossier/timeline/2019/2019-08.md'
  },
  {
    id: 'timeline-02',
    title: 'Vendor meeting records',
    year: '2021',
    month: '05',
    mentionsCount: 11,
    updatedAt: '2026-03-12T15:11:00.000Z',
    viewPath: 'dossier/timeline/2021/2021-05.md'
  },
  {
    id: 'timeline-03',
    title: 'Contract amendment trail',
    year: '2021',
    month: '09',
    mentionsCount: 8,
    updatedAt: '2026-03-12T14:35:00.000Z',
    viewPath: 'dossier/timeline/2021/2021-09.md'
  },
  {
    id: 'timeline-04',
    title: 'Internal compliance summary',
    year: '2022',
    month: '02',
    mentionsCount: 3,
    updatedAt: '2026-03-11T19:58:00.000Z',
    viewPath: 'dossier/timeline/2022/2022-02.md'
  }
]
