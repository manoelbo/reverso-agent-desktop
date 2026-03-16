import path from 'node:path'
import { readdir, readFile } from 'node:fs/promises'
import { resolveRuntimeConfig } from '../config/env.js'
import { createFeedbackController, type FeedbackMode } from '../cli/renderer.js'
import { runInquiry } from './run-inquiry.js'
import { printNextCommand } from '../core/next-command.js'
import type { EvidenceVerificationMode } from '../core/evidence-semantic-verifier.js'
import type { SensitiveDataPolicyMode } from '../core/sensitive-data-policy.js'
import { readLeadCheckpoint } from '../core/lead-checkpoint.js'

export interface RunInquiryAllOptions {
  model?: string
  responseLanguage?: string
  feedbackMode?: FeedbackMode
  enablePev?: boolean
  maxSteps?: number
  maxToolCalls?: number
  maxElapsedMs?: number
  confidenceThreshold?: number
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
  p1ComplianceHooksEnabled?: boolean
  p1DomainSubagentsEnabled?: boolean
  p1CheckpointEnabled?: boolean
  p1CheckpointRestore?: boolean
  editorialGovernanceEnabled?: boolean
  editorialGovernanceStrict?: boolean
  p2InquiryBatchConcurrency?: number
  p2EvidenceVerificationMode?: EvidenceVerificationMode
  p2ObservabilityEnabled?: boolean
  p2SensitiveDataPolicyMode?: SensitiveDataPolicyMode
}

const CONCLUSION_REGEX = /^#\s+Conclusion/im

function isPrimaryLeadMarkdownFile(name: string): boolean {
  if (!name.startsWith('lead-') || !name.endsWith('.md')) return false
  const stem = name.slice(0, -'.md'.length)
  return !stem.includes('.')
}

async function findUninvestigatedLeads(leadsDir: string): Promise<string[]> {
  let entries: string[]
  try {
    entries = await readdir(leadsDir)
  } catch {
    return []
  }

  const checkpoint = await readLeadCheckpoint(leadsDir)
  const statusBySlug = new Map(checkpoint.leads.map((item) => [item.slug, item.status]))
  const slugs: string[] = []
  for (const name of entries) {
    if (!isPrimaryLeadMarkdownFile(name)) continue
    const leadPath = path.join(leadsDir, name)
    const slug = name.replace(/^lead-/, '').replace(/\.md$/, '')
    const checkpointStatus = statusBySlug.get(slug)
    if (checkpointStatus === 'done') continue
    if (checkpointStatus === 'planned' || checkpointStatus === 'in_progress' || checkpointStatus === 'blocked') {
      slugs.push(slug)
      continue
    }
    try {
      const content = await readFile(leadPath, 'utf8')
      if (!CONCLUSION_REGEX.test(content)) {
        slugs.push(slug)
      }
    } catch {
      continue
    }
  }
  return slugs
}

export async function runInquiryAll(options: RunInquiryAllOptions = {}): Promise<void> {
  const runtime = await resolveRuntimeConfig({
    ...(options.model ? { model: options.model } : {}),
    ...(options.responseLanguage ? { responseLanguage: options.responseLanguage } : {}),
    ...(typeof options.selfRepairEnabled === 'boolean'
      ? { selfRepairEnabled: options.selfRepairEnabled }
      : {})
  })

  const feedback = await createFeedbackController({
    eventsDir: runtime.paths.eventsDir,
    sessionName: 'inquiry-all',
    ...(options.feedbackMode ? { mode: options.feedbackMode } : {})
  })

  feedback.stepStart('inquiry-all-scan', 'Verificando leads ainda não investigados...')
  const queue = await findUninvestigatedLeads(runtime.paths.leadsDir)
  feedback.stepComplete('inquiry-all-scan', `${queue.length} lead(s) na fila`)

  if (queue.length === 0) {
    feedback.summary('Nada a investigar', [
      'Todos os leads já foram investigados (possuem seção # Conclusion).',
      'Execute reverso dig para gerar novos leads.'
    ])
    await feedback.flush()
    printNextCommand({
      command: 'reverso dig',
      description: 'Gerar novos leads a partir dos documentos.',
      alternatives: ['reverso create-lead']
    })
    return
  }

  feedback.systemInfo(`Fila: ${queue.map((s) => s).join(', ')}`)

  const total = queue.length
  for (let i = 0; i < queue.length; i += 1) {
    const slug = queue[i]!
    feedback.stepStart(`inquiry-${slug}`, `[${i + 1}/${total}] Investigando ${slug}...`)
    await runInquiry({
      lead: slug,
      ...(options.model ? { model: options.model } : {}),
      ...(options.responseLanguage ? { responseLanguage: options.responseLanguage } : {}),
      ...(options.feedbackMode ? { feedbackMode: options.feedbackMode } : {}),
      ...(typeof options.enablePev === 'boolean' ? { enablePev: options.enablePev } : {}),
      ...(typeof options.maxSteps === 'number' ? { maxSteps: options.maxSteps } : {}),
      ...(typeof options.maxToolCalls === 'number' ? { maxToolCalls: options.maxToolCalls } : {}),
      ...(typeof options.maxElapsedMs === 'number' ? { maxElapsedMs: options.maxElapsedMs } : {}),
      ...(typeof options.confidenceThreshold === 'number'
        ? { confidenceThreshold: options.confidenceThreshold }
        : {}),
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
        : {}),
      ...(typeof options.p1ComplianceHooksEnabled === 'boolean'
        ? { p1ComplianceHooksEnabled: options.p1ComplianceHooksEnabled }
        : {}),
      ...(typeof options.p1DomainSubagentsEnabled === 'boolean'
        ? { p1DomainSubagentsEnabled: options.p1DomainSubagentsEnabled }
        : {}),
      ...(typeof options.p1CheckpointEnabled === 'boolean'
        ? { p1CheckpointEnabled: options.p1CheckpointEnabled }
        : {}),
      ...(typeof options.p1CheckpointRestore === 'boolean'
        ? { p1CheckpointRestore: options.p1CheckpointRestore }
        : {}),
      ...(typeof options.editorialGovernanceEnabled === 'boolean'
        ? { editorialGovernanceEnabled: options.editorialGovernanceEnabled }
        : {}),
      ...(typeof options.editorialGovernanceStrict === 'boolean'
        ? { editorialGovernanceStrict: options.editorialGovernanceStrict }
        : {}),
      ...(typeof options.p2InquiryBatchConcurrency === 'number'
        ? { p2InquiryBatchConcurrency: options.p2InquiryBatchConcurrency }
        : {}),
      ...(typeof options.p2EvidenceVerificationMode === 'string'
        ? { p2EvidenceVerificationMode: options.p2EvidenceVerificationMode }
        : {}),
      ...(typeof options.p2ObservabilityEnabled === 'boolean'
        ? { p2ObservabilityEnabled: options.p2ObservabilityEnabled }
        : {}),
      ...(typeof options.p2SensitiveDataPolicyMode === 'string'
        ? { p2SensitiveDataPolicyMode: options.p2SensitiveDataPolicyMode }
        : {})
    })
    feedback.stepComplete(`inquiry-${slug}`)
  }

  feedback.summary('Investigação completa', [
    `${total} lead(s) investigado(s).`,
    'Revise allegations e findings gerados em investigation/allegations e investigation/findings.',
    'Verifique cada evidência diretamente nos documentos originais antes de consolidar conclusões.'
  ])

  await feedback.flush()

  printNextCommand({
    command: 'reverso inquiry --lead <slug>',
    description: 'Após revisar allegations/findings nas fontes originais, reexecute o lead que precisar ajuste.',
    alternatives: ['reverso dig']
  })
}
