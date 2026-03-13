export type PlaceRow = {
  id: string
  name: string
  country: string
  city: string
  neighborhood: string
  updatedAt: string
  viewPath: string
}

export const placeActionCommands = [
  'research --source',
  'research --web',
  'deep-research --source',
  'deep-research --web'
] as const

export const placesRowsMock: PlaceRow[] = [
  {
    id: 'place-01',
    name: 'Alameda Madeira, 162',
    country: 'Brasil',
    city: 'Barueri',
    neighborhood: 'Alphaville',
    updatedAt: '2026-03-12T16:18:00.000Z',
    viewPath: 'dossier/places/Brasil/Barueri/alameda-madeira-162-barueri.md'
  },
  {
    id: 'place-02',
    name: 'Avenida Paulista, 900',
    country: 'Brasil',
    city: 'Sao Paulo',
    neighborhood: 'Bela Vista',
    updatedAt: '2026-03-12T15:27:00.000Z',
    viewPath: 'dossier/places/Brasil/Sao-Paulo/avenida-paulista-900.md'
  },
  {
    id: 'place-03',
    name: 'Rue de Rivoli, 88',
    country: 'France',
    city: 'Paris',
    neighborhood: 'Louvre',
    updatedAt: '2026-03-11T22:05:00.000Z',
    viewPath: 'dossier/places/France/Paris/rue-de-rivoli-88.md'
  },
  {
    id: 'place-04',
    name: 'Calle 72, 1450',
    country: 'Colombia',
    city: 'Bogota',
    neighborhood: 'Chapinero',
    updatedAt: '2026-03-11T19:44:00.000Z',
    viewPath: 'dossier/places/Colombia/Bogota/calle-72-1450.md'
  }
]
