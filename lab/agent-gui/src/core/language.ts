export type LanguageCode = 'en' | 'pt' | 'es' | 'fr' | 'de' | 'it'
export type ResponseLanguage = LanguageCode | 'auto'
export type ArtifactLanguage = LanguageCode | 'source'

const SUPPORTED: LanguageCode[] = ['en', 'pt', 'es', 'fr', 'de', 'it']

function normalizeLanguage(value: string | undefined): string | undefined {
  if (!value) return undefined
  return value.trim().toLowerCase()
}

export function parseResponseLanguage(value: string | undefined): ResponseLanguage | undefined {
  const v = normalizeLanguage(value)
  if (!v) return undefined
  if (v === 'auto') return 'auto'
  if (SUPPORTED.includes(v as LanguageCode)) return v as LanguageCode
  return undefined
}

export function parseArtifactLanguage(value: string | undefined): ArtifactLanguage | undefined {
  const v = normalizeLanguage(value)
  if (!v) return undefined
  if (v === 'source') return 'source'
  if (SUPPORTED.includes(v as LanguageCode)) return v as LanguageCode
  return undefined
}

export function detectLanguageFromText(text: string | undefined): LanguageCode | undefined {
  if (!text) return undefined
  const raw = text.toLowerCase()
  const normalized = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  if (!normalized.trim()) return undefined

  const scoreByLanguage: Record<LanguageCode, number> = {
    en: 0,
    pt: 0,
    es: 0,
    fr: 0,
    de: 0,
    it: 0
  }

  const weightedPatterns: Record<Exclude<LanguageCode, 'en'>, Array<[RegExp, number]>> = {
    pt: [
      [/\b(voce|voces|nao|investigacao|prefeitura|licitacao|edital)\b/g, 3],
      [/\b(evidencia|evidencias|achados|alegacao|alegacoes|conclusao)\b/g, 2]
    ],
    es: [
      [/\b(usted|ustedes|investigacion|hallazgo|licitacion|prueba)\b/g, 3],
      [/\b(evidencia|alegacion|alegaciones|conclusion)\b/g, 2]
    ],
    fr: [
      [/\b(vous|enquete|preuves?|constats?|municipalite|appel\sd'offres)\b/g, 4]
    ],
    de: [
      [/\b(sie|untersuchung|beleg|befund|ausschreibung|nachweis)\b/g, 4]
    ],
    it: [
      [/\b(lei|indagine|prova|riscontro|gara|appalto)\b/g, 4]
    ]
  }

  const applyScore = (
    language: Exclude<LanguageCode, 'en'>,
    patterns: Array<[RegExp, number]>
  ): void => {
    for (const [pattern, weight] of patterns) {
      const matches = normalized.match(pattern)
      if (!matches || matches.length === 0) continue
      scoreByLanguage[language] += matches.length * weight
    }
  }

  applyScore('pt', weightedPatterns.pt)
  applyScore('es', weightedPatterns.es)
  applyScore('fr', weightedPatterns.fr)
  applyScore('de', weightedPatterns.de)
  applyScore('it', weightedPatterns.it)

  const ranking = (Object.entries(scoreByLanguage) as Array<[LanguageCode, number]>)
    .filter(([language]) => language !== 'en')
    .sort((a, b) => b[1] - a[1])
  const [top, second] = ranking
  if (!top || top[1] < 2) return undefined
  if (second && top[1] - second[1] < 2) return undefined
  return top[0]
}

export function resolveResponseLanguage(args: {
  mode: ResponseLanguage | undefined
  fallback: LanguageCode
  userText?: string
}): LanguageCode {
  if (args.mode && args.mode !== 'auto') return args.mode
  if (args.mode === 'auto') {
    return detectLanguageFromText(args.userText) ?? args.fallback
  }
  return detectLanguageFromText(args.userText) ?? args.fallback
}

export function resolveResponseLanguageForPrompt(args: {
  mode: ResponseLanguage | undefined
  fallback?: LanguageCode
  userText?: string
}): LanguageCode {
  return resolveResponseLanguage({
    mode: args.mode,
    fallback: args.fallback ?? 'en',
    ...(args.userText ? { userText: args.userText } : {})
  })
}

export function resolveArtifactLanguage(args: {
  mode: ArtifactLanguage | undefined
  fallback: ArtifactLanguage
}): ArtifactLanguage {
  return args.mode ?? args.fallback
}

export function resolveArtifactLanguageForSource(args: {
  mode: ArtifactLanguage | undefined
  sourceLanguage?: LanguageCode
  fallback?: ArtifactLanguage
}): ArtifactLanguage {
  if (args.mode && args.mode !== 'source') return args.mode
  if (args.mode === 'source') {
    return args.sourceLanguage ?? 'source'
  }
  return args.fallback ?? 'source'
}

export function languageName(code: LanguageCode): string {
  if (code === 'pt') return 'Portuguese'
  if (code === 'es') return 'Spanish'
  if (code === 'fr') return 'French'
  if (code === 'de') return 'German'
  if (code === 'it') return 'Italian'
  return 'English'
}

export function buildResponseLanguageInstruction(code: LanguageCode): string {
  return `Write all natural-language output in ${languageName(code)}.`
}

export function buildArtifactLanguageInstruction(mode: ArtifactLanguage): string {
  if (mode === 'source') {
    return 'Write all generated document content in the same language as the source document.'
  }
  return `Write all generated document content in ${languageName(mode)}.`
}
