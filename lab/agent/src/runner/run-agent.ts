import path from 'node:path'
import { access, readdir, readFile } from 'node:fs/promises'
import type { Dirent } from 'node:fs'
import { createFeedbackController, type FeedbackController, type FeedbackMode } from '../cli/renderer.js'
import { resolveRuntimeConfig } from '../config/env.js'
import { parseStrictJson } from '../core/json-contract.js'
import { type DeepDiveSessionState } from '../core/deep-dive-session.js'
import { loadActiveSession } from '../core/deep-dive-session-store.js'
import { OpenRouterClient } from '../llm/openrouter-client.js'
import {
  buildAgentRouterSystemPrompt,
  buildAgentRouterUserPrompt,
  type AgentRouterIntent
} from '../prompts/agent-router.js'
import { createInquiryPlanOnly } from './run-create-lead.js'
import { runCreateLead } from './run-create-lead.js'
import { runAgentSetup } from './run-agent-instructions.js'
import { runDeepDiveNext } from './run-deep-dive-next.js'
import { resolveLeadTargetFromText } from './run-deep-dive-next.js'
import { runDig } from './run-dig.js'
import { runInit } from './run-init.js'
import { runInquiry } from './run-inquiry.js'
import { updateLeadPlanAndStatus } from '../tools/investigative/create-lead-file.js'

export interface RunAgentOptions {
  text: string
  model?: string
  responseLanguage?: string
  artifactLanguage?: string
  enablePev?: boolean
  selfRepairEnabled?: boolean
  selfRepairMaxRounds?: number
  evidenceGateEnabled?: boolean
  evidenceMinConfidence?: number
  enrichedToolManifestEnabled?: boolean
  strictPlanningValidation?: boolean
  preWriteValidationEnabled?: boolean
  preWriteValidationStrict?: boolean
  criticalWriteGateEnabled?: boolean
  requireExplicitWriteApproval?: boolean
  feedbackMode?: FeedbackMode
  feedback?: FeedbackController
}

interface LeadSummary {
  slug: string
  title: string
  description: string
  status: 'draft' | 'planned'
}

interface RouterResult {
  intent: AgentRouterIntent
  targetSlug?: string
  targetTitle?: string
  targetIndex?: number
  targetScope?: 'one' | 'all'
  targetCount?: number
  idea?: string
  reason: string
  confidence: number
}

export interface InquiryBatchFailure {
  slug: string
  message: string
}

export interface InquiryBatchResult {
  succeededLeads: string[]
  failedLeads: InquiryBatchFailure[]
}

type AgentRouteAction =
  | { kind: 'deep_dive_next'; reason: string }
  | { kind: 'deep_dive'; reason: string }
  | { kind: 'init'; reason: string }
  | { kind: 'create_lead'; reason: string; idea?: string }
  | { kind: 'plan_leads'; reason: string; leads: LeadSummary[] }
  | { kind: 'execute_inquiry'; reason: string; leads: LeadSummary[]; autoPlanDrafts: boolean }
  | { kind: 'ask_clarify'; reason: string; lines: string[] }

const DEFAULT_REASON = 'heuristic fallback'

export async function runAgent(options: RunAgentOptions): Promise<void> {
  const text = options.text.trim()
  if (!text) {
    throw new Error(
      'Forneca a mensagem do usuario com --text "<mensagem>" ou --prompt "<mensagem>".'
    )
  }

  const runtime = await resolveRuntimeConfig({
    ...(options.model ? { model: options.model } : {}),
    ...(options.responseLanguage ? { responseLanguage: options.responseLanguage } : {}),
    ...(options.artifactLanguage ? { artifactLanguage: options.artifactLanguage } : {}),
    ...(typeof options.enablePev === 'boolean' ? { enablePev: options.enablePev } : {}),
    ...(typeof options.selfRepairEnabled === 'boolean'
      ? { selfRepairEnabled: options.selfRepairEnabled }
      : {}),
    ...(typeof options.selfRepairMaxRounds === 'number'
      ? { selfRepairMaxRounds: options.selfRepairMaxRounds }
      : {}),
    ...(typeof options.evidenceGateEnabled === 'boolean'
      ? { evidenceGateEnabled: options.evidenceGateEnabled }
      : {}),
    ...(typeof options.evidenceMinConfidence === 'number'
      ? { evidenceMinConfidence: options.evidenceMinConfidence }
      : {}),
    ...(typeof options.enrichedToolManifestEnabled === 'boolean'
      ? { enrichedToolManifestEnabled: options.enrichedToolManifestEnabled }
      : {}),
    ...(typeof options.strictPlanningValidation === 'boolean'
      ? { strictPlanningValidation: options.strictPlanningValidation }
      : {}),
    ...(typeof options.preWriteValidationEnabled === 'boolean'
      ? { preWriteValidationEnabled: options.preWriteValidationEnabled }
      : {}),
    ...(typeof options.preWriteValidationStrict === 'boolean'
      ? { preWriteValidationStrict: options.preWriteValidationStrict }
      : {}),
    ...(typeof options.criticalWriteGateEnabled === 'boolean'
      ? { criticalWriteGateEnabled: options.criticalWriteGateEnabled }
      : {}),
    ...(typeof options.requireExplicitWriteApproval === 'boolean'
      ? { requireExplicitWriteApproval: options.requireExplicitWriteApproval }
      : {})
  })

  const ownsFeedback = !options.feedback
  const feedback =
    options.feedback ??
    (await createFeedbackController({
      eventsDir: runtime.paths.eventsDir,
      sessionName: 'agent',
      ...(options.feedbackMode ? { mode: options.feedbackMode } : {})
    }))

  const session = await loadActiveSession(runtime.paths)
  const activeSession = isActionableSession(session) ? session : undefined
  const hasAgentContext = await exists(path.join(runtime.paths.outputDir, 'agent.md'))
  const leads = await listLeadSummaries(runtime.paths.leadsDir)
  const route = await decideAgentRoute({
    text,
    ...(activeSession ? { session: activeSession } : {}),
    hasAgentContext,
    leads,
    model: runtime.model,
    apiKey: runtime.apiKey
  })

  feedback.step('Mensagem recebida em modo conversacional', 'in_progress', text)
  feedback.info(`Roteamento: ${route.kind} (${route.reason})`)

  const shouldUpdateContext =
    hasAgentContext && shouldCaptureInvestigationContext(text) && route.kind !== 'deep_dive_next'
  if (shouldUpdateContext) {
    feedback.step('Atualizando memoria de contexto em agent.md...', 'in_progress')
    await runAgentSetup({
      text,
      feedback
    })
  }

  if (route.kind === 'ask_clarify') {
    feedback.finalSummary('Preciso de confirmacao', route.lines)
    if (ownsFeedback) await feedback.flush()
    return
  }

  if (route.kind === 'deep_dive_next') {
    await runDeepDiveNext({
      text,
      model: runtime.model,
      responseLanguage: runtime.responseLanguage,
      enablePev: runtime.enablePev,
      selfRepairEnabled: runtime.selfRepairEnabled,
      selfRepairMaxRounds: runtime.selfRepairMaxRounds,
      feedback
    })
    if (ownsFeedback) await feedback.flush()
    return
  }

  if (route.kind === 'init') {
    await runInit({
      model: runtime.model,
      responseLanguage: runtime.responseLanguage,
      artifactLanguage: runtime.artifactLanguage,
      feedback
    })
    if (ownsFeedback) await feedback.flush()
    return
  }

  if (route.kind === 'deep_dive') {
    await runDig({
      model: runtime.model,
      responseLanguage: runtime.responseLanguage,
      enablePev: runtime.enablePev,
      selfRepairEnabled: runtime.selfRepairEnabled,
      selfRepairMaxRounds: runtime.selfRepairMaxRounds,
      feedback
    })
    if (ownsFeedback) await feedback.flush()
    return
  }

  if (route.kind === 'create_lead') {
    await runCreateLead({
      ...(route.idea ? { idea: route.idea } : {}),
      model: runtime.model,
      responseLanguage: runtime.responseLanguage,
      enablePev: runtime.enablePev,
      selfRepairEnabled: runtime.selfRepairEnabled,
      selfRepairMaxRounds: runtime.selfRepairMaxRounds,
      feedback
    })
    if (ownsFeedback) await feedback.flush()
    return
  }

  if (route.kind === 'plan_leads') {
    await planLeads({
      leads: route.leads,
      runtime: {
        model: runtime.model,
        responseLanguage: runtime.responseLanguage,
        selfRepairEnabled: runtime.selfRepairEnabled,
        selfRepairMaxRounds: runtime.selfRepairMaxRounds,
          apiKey: runtime.apiKey,
          paths: runtime.paths
      },
      feedback
    })
    feedback.finalSummary('Planejamento concluido', [
      `Inquiry Plan atualizado para ${route.leads.length} lead(s).`,
      'Proximo passo: diga "pode fazer a investigacao dos leads" para executar inquiry.'
    ])
    if (ownsFeedback) await feedback.flush()
    return
  }

  if (route.kind === 'execute_inquiry') {
    const draftLeads = route.leads.filter((lead) => lead.status === 'draft')
    if (route.autoPlanDrafts && draftLeads.length > 0) {
      feedback.step('Leads em draft detectados: gerando Inquiry Plan antes da execucao...', 'in_progress')
      await planLeads({
        leads: draftLeads,
        runtime: {
          model: runtime.model,
          responseLanguage: runtime.responseLanguage,
          selfRepairEnabled: runtime.selfRepairEnabled,
          selfRepairMaxRounds: runtime.selfRepairMaxRounds,
          apiKey: runtime.apiKey,
          paths: runtime.paths
        },
        feedback
      })
    }

    const batchResult = await executeInquiryBatch({
      leads: route.leads.map((lead) => lead.slug),
      runOne: async (leadSlug) => {
        await runInquiry({
          lead: leadSlug,
          model: runtime.model,
          responseLanguage: runtime.responseLanguage,
          enablePev: runtime.enablePev,
          selfRepairEnabled: runtime.selfRepairEnabled,
          selfRepairMaxRounds: runtime.selfRepairMaxRounds,
          evidenceGateEnabled: runtime.evidenceGateEnabled,
          evidenceMinConfidence: runtime.evidenceMinConfidence,
          enrichedToolManifestEnabled: runtime.enrichedToolManifestEnabled,
          strictPlanningValidation: runtime.strictPlanningValidation,
          preWriteValidationEnabled: runtime.preWriteValidationEnabled,
          preWriteValidationStrict: runtime.preWriteValidationStrict,
          criticalWriteGateEnabled: runtime.criticalWriteGateEnabled,
          requireExplicitWriteApproval: runtime.requireExplicitWriteApproval,
          feedback
        })
      }
    })
    const { succeededLeads, failedLeads } = batchResult
    for (const failure of failedLeads) {
      feedback.warn(`Inquiry falhou para lead ${failure.slug}: ${failure.message}`)
    }

    if (failedLeads.length > 0 && succeededLeads.length === 0) {
      throw new Error(
        `Inquiry falhou para todos os leads selecionados (${failedLeads
          .map((entry) => `${entry.slug}: ${entry.message}`)
          .join(' | ')})`
      )
    }

    const finalLines = [
      `Leads solicitados: ${route.leads.length}.`,
      `Sucesso: ${succeededLeads.length}.`,
      `Falhas: ${failedLeads.length}.`,
      ...(succeededLeads.length > 0 ? [`Leads concluidos: ${succeededLeads.join(', ')}.`] : []),
      ...(failedLeads.length > 0
        ? [`Leads com erro: ${failedLeads.map((entry) => entry.slug).join(', ')}.`]
        : []),
      'Revise allegations/findings e, se quiser ampliar cobertura, peça novo deep-dive nas fontes.'
    ]
    feedback.finalSummary(
      failedLeads.length > 0 ? 'Execucao de inquiry concluida com falhas parciais' : 'Execucao de inquiry concluida',
      finalLines
    )
    if (ownsFeedback) await feedback.flush()
    return
  }

  if (ownsFeedback) await feedback.flush()
}

export async function executeInquiryBatch(input: {
  leads: string[]
  runOne: (leadSlug: string) => Promise<void>
}): Promise<InquiryBatchResult> {
  const succeededLeads: string[] = []
  const failedLeads: InquiryBatchFailure[] = []

  for (const leadSlug of input.leads) {
    try {
      await input.runOne(leadSlug)
      succeededLeads.push(leadSlug)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      failedLeads.push({ slug: leadSlug, message })
    }
  }

  return { succeededLeads, failedLeads }
}

export async function decideAgentRoute(input: {
  text: string
  session?: DeepDiveSessionState
  hasAgentContext: boolean
  leads: LeadSummary[]
  model: string
  apiKey: string
}): Promise<AgentRouteAction> {
  if (
    input.session &&
    (input.session.stage === 'awaiting_plan_decision' ||
      input.session.stage === 'awaiting_inquiry_execution')
  ) {
    return {
      kind: 'deep_dive_next',
      reason: `active session: ${input.session.stage}`
    }
  }

  const intent = await classifyAgentIntent({
    text: input.text,
    ...(input.session ? { session: input.session } : {}),
    hasAgentContext: input.hasAgentContext,
    leads: input.leads,
    model: input.model,
    apiKey: input.apiKey
  })

  if (intent.intent === 'run_init') {
    return { kind: 'init', reason: intent.reason }
  }
  if (intent.intent === 'request_context') {
    return { kind: 'init', reason: intent.reason }
  }
  if (intent.intent === 'start_deep_dive') {
    return { kind: 'deep_dive', reason: intent.reason }
  }
  if (intent.intent === 'create_lead') {
    return {
      kind: 'create_lead',
      reason: intent.reason,
      ...(intent.idea ? { idea: intent.idea } : {})
    }
  }
  if (intent.intent === 'describe_investigation') {
    if (!input.hasAgentContext) {
      return { kind: 'init', reason: 'investigation described but agent.md missing' }
    }
    return {
      kind: 'ask_clarify',
      reason: intent.reason,
      lines: [
        'Entendi o contexto e atualizei a memoria da investigacao em agent.md.',
        'Posso seguir com uma destas acoes:',
        '- "olhe as fontes e me de contexto"',
        '- "faça deep-dive e sugira leads"',
        '- "planeje os leads" ou "investigue os leads"'
      ]
    }
  }
  if (intent.intent === 'run_inquiry') {
    const resolution = resolveTargetsFromIntent(input.text, input.leads, intent, 'execute')
    if (resolution.kind === 'ambiguous') {
      return {
        kind: 'ask_clarify',
        reason: 'inquiry target ambiguous',
        lines: [
          'Seu pedido de investigacao corresponde a mais de um lead.',
          ...formatLeadChoices(resolution.candidates),
          'Especifique com: "investiga o lead <slug>" ou "investiga o lead 2".'
        ]
      }
    }
    if (resolution.targets.length > 0) {
      const hasDraft = resolution.targets.some((lead) => lead.status === 'draft')
      return {
        kind: 'execute_inquiry',
        reason: intent.reason,
        leads: resolution.targets,
        autoPlanDrafts: hasDraft
      }
    }
    return {
      kind: 'ask_clarify',
      reason: 'inquiry target missing',
      lines: [
        'Entendi que voce quer executar investigacao, mas nao identifiquei o alvo.',
        'Exemplos: "investiga o lead <slug>", "investiga o lead 2" ou "investiga todos os leads".',
        ...formatLeadChoices(input.leads)
      ]
    }
  }
  if (intent.intent === 'plan_inquiry') {
    const resolution = resolveTargetsFromIntent(input.text, input.leads, intent, 'plan')
    if (resolution.kind === 'ambiguous') {
      return {
        kind: 'ask_clarify',
        reason: 'plan target ambiguous',
        lines: [
          'Seu pedido de planejamento corresponde a mais de um lead.',
          ...formatLeadChoices(resolution.candidates),
          'Especifique com: "planeja o lead <slug>" ou "planeja o lead 2".'
        ]
      }
    }
    if (resolution.targets.length > 0) {
      return {
        kind: 'plan_leads',
        reason: intent.reason,
        leads: resolution.targets
      }
    }
    return {
      kind: 'ask_clarify',
      reason: 'plan target missing',
      lines: [
        'Nao encontrei leads para planejar.',
        'Se quiser, eu posso rodar deep-dive para sugerir novos leads.'
      ]
    }
  }
  if (intent.intent === 'continue_session') {
    if (
      input.session &&
      (input.session.stage === 'awaiting_plan_decision' ||
        input.session.stage === 'awaiting_inquiry_execution')
    ) {
      return { kind: 'deep_dive_next', reason: intent.reason }
    }
    const resolution = resolveTargetsFromIntent(input.text, input.leads, intent, 'execute')
    if (resolution.kind === 'targets' && resolution.targets.length > 0) {
      const hasDraft = resolution.targets.some((lead) => lead.status === 'draft')
      return {
        kind: 'execute_inquiry',
        reason: `${intent.reason} (continue sem sessao ativa)`,
        leads: resolution.targets,
        autoPlanDrafts: hasDraft
      }
    }
    if (resolution.kind === 'ambiguous') {
      return {
        kind: 'ask_clarify',
        reason: 'continue-session ambiguous',
        lines: [
          'Nao consegui identificar qual lead voce quer continuar.',
          ...formatLeadChoices(resolution.candidates),
          'Especifique com: "investiga o lead <slug>" ou "investiga todos os leads".'
        ]
      }
    }
    if (input.leads.length > 0) {
      const draftLeads = input.leads.filter((lead) => lead.status === 'draft')
      if (draftLeads.length > 0) {
        return {
          kind: 'plan_leads',
          reason: `${intent.reason} (planejando drafts existentes)`,
          leads: draftLeads
        }
      }
    }
    return { kind: 'deep_dive', reason: 'no active session -> fallback deep-dive' }
  }

  if (!input.hasAgentContext) {
    return { kind: 'init', reason: 'missing agent.md context' }
  }
  if (input.leads.some((lead) => lead.status === 'planned')) {
    return {
      kind: 'execute_inquiry',
      reason: 'default route with planned leads',
      leads: input.leads.filter((lead) => lead.status === 'planned'),
      autoPlanDrafts: false
    }
  }
  return { kind: 'deep_dive', reason: 'default exploration route' }
}

function isActionableSession(
  session: DeepDiveSessionState | undefined
): session is DeepDiveSessionState {
  if (!session) return false
  if (
    session.stage !== 'awaiting_plan_decision' &&
    session.stage !== 'awaiting_inquiry_execution'
  ) {
    return false
  }
  const updatedAtMs = Date.parse(session.updatedAt)
  if (!Number.isFinite(updatedAtMs)) return false
  const staleAfterMs = 1000 * 60 * 60 * 72
  return Date.now() - updatedAtMs <= staleAfterMs
}

async function classifyAgentIntent(input: {
  text: string
  session?: DeepDiveSessionState
  hasAgentContext: boolean
  leads: LeadSummary[]
  model: string
  apiKey: string
}): Promise<RouterResult> {
  const heuristic = heuristicAgentIntent(input.text)
  if (heuristic.intent !== 'unknown') return heuristic

  const client = new OpenRouterClient(input.apiKey)
  const raw = await client.chatText({
    model: input.model,
    system: buildAgentRouterSystemPrompt(),
    user: buildAgentRouterUserPrompt({
      userText: input.text,
      ...(input.session ? { sessionStage: input.session.stage } : {}),
      hasAgentContext: input.hasAgentContext,
      availableLeads: input.leads.slice(0, 8).map((lead, index) => ({
        index: index + 1,
        slug: lead.slug,
        title: lead.title,
        status: lead.status
      }))
    }),
    temperature: 0
  })
  const parsed = parseStrictJson(raw)
  if (!parsed.ok || typeof parsed.value !== 'object' || parsed.value === null) {
    return heuristic
  }
  const value = parsed.value as {
    intent?: unknown
    targetSlug?: unknown
    targetTitle?: unknown
    targetIndex?: unknown
    targetScope?: unknown
    targetCount?: unknown
    idea?: unknown
    confidence?: unknown
    reason?: unknown
  }
  const allowed: AgentRouterIntent[] = [
    'continue_session',
    'start_deep_dive',
    'run_init',
    'request_context',
    'describe_investigation',
    'create_lead',
    'plan_inquiry',
    'run_inquiry',
    'unknown'
  ]
  const intentCandidate =
    typeof value.intent === 'string' ? (value.intent as AgentRouterIntent) : 'unknown'
  const intent = allowed.includes(intentCandidate) ? intentCandidate : 'unknown'
  const targetSlug =
    typeof value.targetSlug === 'string' && value.targetSlug.trim().length > 0
      ? value.targetSlug.trim().toLowerCase().replace(/^lead-/, '')
      : undefined
  const targetIndex =
    typeof value.targetIndex === 'number' && Number.isFinite(value.targetIndex)
      ? Math.max(1, Math.floor(value.targetIndex))
      : undefined
  const targetTitle =
    typeof value.targetTitle === 'string' && value.targetTitle.trim().length > 0
      ? value.targetTitle.trim()
      : undefined
  const targetScope =
    value.targetScope === 'all' || value.targetScope === 'one'
      ? value.targetScope
      : undefined
  const targetCount =
    typeof value.targetCount === 'number' && Number.isFinite(value.targetCount)
      ? Math.max(1, Math.floor(value.targetCount))
      : undefined
  const idea =
    typeof value.idea === 'string' && value.idea.trim().length > 0 ? value.idea.trim() : undefined
  const reason =
    typeof value.reason === 'string' && value.reason.trim().length > 0
      ? value.reason.trim()
      : 'llm router'
  const confidence =
    typeof value.confidence === 'number' && Number.isFinite(value.confidence)
      ? Math.max(0, Math.min(1, value.confidence))
      : 0.5
  if (intent === 'unknown' || confidence < 0.55) return heuristic
  return {
    intent,
    ...(targetSlug ? { targetSlug } : {}),
    ...(targetTitle ? { targetTitle } : {}),
    ...(targetIndex ? { targetIndex } : {}),
    ...(targetScope ? { targetScope } : {}),
    ...(targetCount ? { targetCount } : {}),
    ...(idea ? { idea } : {}),
    reason,
    confidence
  }
}

export function heuristicAgentIntent(text: string): RouterResult {
  const normalized = text.toLowerCase()
  const extractIndex = (): number | undefined => {
    if (normalized.includes('primeiro') || normalized.includes('first')) return 1
    if (normalized.includes('segundo') || normalized.includes('second')) return 2
    if (normalized.includes('terceiro') || normalized.includes('third')) return 3
    const match = normalized.match(/\b([1-9])\b/)
    if (!match?.[1]) return undefined
    return Number.parseInt(match[1], 10)
  }
  const extractSlug = (): string | undefined => {
    const explicit = normalized.match(/lead-([a-z0-9-]+)/)
    if (explicit?.[1]) return explicit[1]
    const dashed = normalized.match(/\b([a-z0-9]+(?:-[a-z0-9]+)+)\b/)
    if (dashed?.[1]) return dashed[1]
    return undefined
  }

  const asksContinue =
    normalized.includes('plano de todos') ||
    normalized.includes('plan all') ||
    normalized.includes('executa todos') ||
    normalized.includes('execute all') ||
    normalized.includes('refaz') ||
    normalized.includes('redo') ||
    normalized.includes('continue') ||
    normalized.includes('continuar')
  if (asksContinue) {
    const targetSlug = extractSlug()
    const targetIndex = extractIndex()
    const result: RouterResult = {
      intent: 'continue_session',
      reason: 'heuristic continue-session',
      confidence: 0.9
    }
    if (targetSlug) result.targetSlug = targetSlug
    if (targetIndex) result.targetIndex = targetIndex
    return result
  }

  const asksContext =
    normalized.includes('contexto') ||
    normalized.includes('resumo') ||
    normalized.includes('olhe meus documentos') ||
    normalized.includes('olha meus documentos') ||
    normalized.includes('olhe minhas fontes') ||
    normalized.includes('entenda minhas fontes') ||
    normalized.includes('look at my sources')
  if (asksContext) {
    return { intent: 'request_context', reason: 'heuristic request-context', confidence: 0.9 }
  }

  const describesInvestigation =
    normalized.includes('estou investigando') ||
    normalized.includes('minha investigacao') ||
    normalized.includes('o caso e') ||
    normalized.includes('investigation is about') ||
    normalized.includes('my investigation')
  if (describesInvestigation) {
    return { intent: 'describe_investigation', reason: 'heuristic investigation-description', confidence: 0.88 }
  }

  const asksPlanInquiry =
    (normalized.includes('plano') || normalized.includes('planeja') || normalized.includes('plan')) &&
    normalized.includes('lead')
  if (asksPlanInquiry) {
    const targetSlug = extractSlug()
    const targetIndex = extractIndex()
    const asksAll = normalized.includes('todos') || normalized.includes('all') || normalized.includes('3 leads') || normalized.includes('tres leads')
    const result: RouterResult = {
      intent: 'plan_inquiry',
      reason: 'heuristic plan-inquiry',
      confidence: 0.92
    }
    if (targetSlug) result.targetSlug = targetSlug
    if (targetIndex) result.targetIndex = targetIndex
    if (asksAll) result.targetScope = 'all'
    return result
  }

  const asksInquiry =
    (normalized.includes('inquiry') ||
      normalized.includes('investigacao') ||
      normalized.includes('investigar') ||
      normalized.includes('pesquisa')) &&
    (normalized.includes('lead') ||
      normalized.includes('leads') ||
      normalized.includes('executa') ||
      normalized.includes('execute') ||
      normalized.includes('rodar') ||
      normalized.includes('fazer'))
  if (asksInquiry) {
    const targetSlug = extractSlug()
    const targetIndex = extractIndex()
    const asksAll = normalized.includes('todos') || normalized.includes('all') || normalized.includes('3 leads') || normalized.includes('tres leads')
    const result: RouterResult = {
      intent: 'run_inquiry',
      reason: 'heuristic inquiry',
      confidence: 0.9
    }
    if (targetSlug) result.targetSlug = targetSlug
    if (targetIndex) result.targetIndex = targetIndex
    if (asksAll) {
      result.targetScope = 'all'
      result.targetCount = 3
    }
    return result
  }

  const asksInit =
    normalized.includes('init') ||
    normalized.includes('iniciar agente') ||
    normalized.includes('contexto inicial')
  if (asksInit) {
    return { intent: 'run_init', reason: 'heuristic init', confidence: 0.88 }
  }

  const asksCreateLead =
    (normalized.includes('cria') || normalized.includes('create')) &&
    normalized.includes('lead')
  if (asksCreateLead) {
    return {
      intent: 'create_lead',
      idea: text.trim(),
      reason: 'heuristic create-lead',
      confidence: 0.84
    }
  }

  const asksDeepDive =
    normalized.includes('deep-dive') ||
    normalized.includes('dig') ||
    normalized.includes('analise as fontes') ||
    normalized.includes('analyse sources') ||
    normalized.includes('sugira leads') ||
    normalized.includes('suggest leads') ||
    normalized.includes('primeira pesquisa') ||
    normalized.includes('start investigation')
  if (asksDeepDive) {
    return { intent: 'start_deep_dive', reason: 'heuristic deep-dive', confidence: 0.86 }
  }

  return { intent: 'unknown', reason: DEFAULT_REASON, confidence: 0.4 }
}

function resolveTargetsFromIntent(
  text: string,
  leads: LeadSummary[],
  intent: RouterResult,
  mode: 'plan' | 'execute'
): { kind: 'targets'; targets: LeadSummary[] } | { kind: 'ambiguous'; candidates: LeadSummary[] } {
  const relevant =
    mode === 'plan'
      ? leads.filter((lead) => lead.status === 'draft')
      : leads.filter((lead) => lead.status === 'planned').length > 0
        ? leads.filter((lead) => lead.status === 'planned')
        : leads.filter((lead) => lead.status === 'draft')

  if (relevant.length === 0) return { kind: 'targets', targets: [] }
  if (intent.targetScope === 'all') return { kind: 'targets', targets: relevant }
  if (intent.targetCount && intent.targetCount > 1) {
    return { kind: 'targets', targets: relevant.slice(0, intent.targetCount) }
  }

  const mapped = relevant.map((lead) => ({
    slug: lead.slug,
    title: lead.title,
    description: lead.description,
    status: lead.status,
    createdInLastRun: false as const
  }))
  const resolution = resolveLeadTargetFromText(text, mapped, {
    ...(intent.targetSlug ? { preferredSlug: intent.targetSlug } : {}),
    ...(intent.targetIndex ? { preferredIndex: intent.targetIndex } : {}),
    ...(intent.targetTitle ? { preferredTitle: intent.targetTitle } : {})
  })

  if (resolution.kind === 'ambiguous' && resolution.candidates) {
    const candidates = resolution.candidates
      .map((item) => relevant.find((lead) => lead.slug === item.slug))
      .filter((lead): lead is LeadSummary => Boolean(lead))
    return { kind: 'ambiguous', candidates }
  }

  if (resolution.lead) {
    const target = relevant.find((lead) => lead.slug === resolution.lead?.slug)
    return { kind: 'targets', targets: target ? [target] : [] }
  }

  if (intent.targetSlug) {
    const bySlug = relevant.find((lead) => lead.slug === intent.targetSlug)
    if (bySlug) return { kind: 'targets', targets: [bySlug] }
  }
  if (intent.targetIndex) {
    const byIndex = relevant[intent.targetIndex - 1]
    if (byIndex) return { kind: 'targets', targets: [byIndex] }
  }

  if (relevant.length === 1 && relevant[0]) return { kind: 'targets', targets: [relevant[0]] }
  return { kind: 'targets', targets: [] }
}

async function listLeadSummaries(leadsDir: string): Promise<LeadSummary[]> {
  let entries: Dirent[]
  try {
    entries = await readdir(leadsDir, { withFileTypes: true })
  } catch {
    return []
  }
  const leads: LeadSummary[] = []
  for (const entry of entries) {
    const isMarkdown = typeof entry.name === 'string' && entry.name.endsWith('.md')
    const isFile = entry.isFile()
    if (!isFile || !isMarkdown) continue
    const leadPath = path.join(leadsDir, entry.name)
    try {
      const raw = await readFile(leadPath, 'utf8')
      const title =
        raw.match(/^title:\s+"?(.+?)"?$/m)?.[1]?.trim() ??
        raw.match(/^#\s+(.+)$/m)?.[1]?.trim() ??
        entry.name.replace(/^lead-/, '').replace(/\.md$/, '')
      const statusRaw = raw.match(/^status:\s+(.+)$/m)?.[1]?.trim().toLowerCase() ?? 'draft'
      const status: 'draft' | 'planned' = statusRaw === 'planned' ? 'planned' : 'draft'
      const description = raw.match(/^description:\s+"?(.+?)"?$/m)?.[1]?.trim() ?? ''
      leads.push({
        slug: entry.name.replace(/^lead-/, '').replace(/\.md$/, ''),
        title,
        description,
        status
      })
    } catch {
      continue
    }
  }
  return leads.sort((a, b) => a.title.localeCompare(b.title))
}

function formatLeadChoices(leads: LeadSummary[]): string[] {
  if (leads.length === 0) return ['Nenhum lead encontrado em investigation/leads.']
  return [
    'Leads disponiveis:',
    ...leads
      .slice(0, 8)
      .map((lead, index) => `${index + 1}. ${lead.title} (${lead.slug}) [${lead.status}]`)
  ]
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

function shouldCaptureInvestigationContext(text: string): boolean {
  const normalized = text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  if (normalized.length < 40) return false
  const keywords = [
    'estou investigando',
    'minha investigacao',
    'o caso e',
    'sobre a investigacao',
    'investigation is',
    'my investigation',
    'contexto da investigacao'
  ]
  return keywords.some((keyword) => normalized.includes(keyword))
}

async function planLeads(input: {
  leads: LeadSummary[]
  runtime: {
    model: string
    responseLanguage: string
    selfRepairEnabled: boolean
    selfRepairMaxRounds: number
    apiKey: string
    paths: Awaited<ReturnType<typeof resolveRuntimeConfig>>['paths']
  }
  feedback: FeedbackController
}): Promise<void> {
  if (input.leads.length === 0) return
  const client = new OpenRouterClient(input.runtime.apiKey)
  const sourceSummary = `Planning ${input.leads.length} lead(s) from conversational route.`
  for (const lead of input.leads) {
    if (lead.status === 'planned') continue
    input.feedback.step(`Gerando Inquiry Plan para ${lead.slug}...`, 'in_progress')
    const payload = await createInquiryPlanOnly({
      idea: `${lead.title}\n${lead.description}`,
      sourceSummary,
      model: input.runtime.model,
      responseLanguage: 'en',
      selfRepairEnabled: input.runtime.selfRepairEnabled,
      selfRepairMaxRounds: input.runtime.selfRepairMaxRounds,
      feedback: input.feedback,
      client
    })
    const language = input.runtime.responseLanguage === 'auto' ? 'en' : input.runtime.responseLanguage
    await updateLeadPlanAndStatus(
      {
        slug: lead.slug,
        inquiryPlan: payload.inquiryPlan,
        status: 'planned',
        language
      },
      { paths: input.runtime.paths }
    )
    lead.status = 'planned'
  }
}
