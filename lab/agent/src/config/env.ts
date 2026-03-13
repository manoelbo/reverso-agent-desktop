import path from 'node:path'
import dotenv from 'dotenv'
import { resolveLabPaths, type LabPaths } from '../core/paths.js'
import {
  parseArtifactLanguage,
  parseResponseLanguage,
  type ArtifactLanguage,
  type ResponseLanguage
} from '../core/language.js'

export interface RuntimeConfig {
  paths: LabPaths
  apiKey: string
  model: string
  responseLanguage: ResponseLanguage
  artifactLanguage: ArtifactLanguage
  enablePev: boolean
  loopMaxSteps: number
  loopMaxToolCalls: number
  loopMaxElapsedMs: number
  confidenceThreshold: number
  selfRepairEnabled: boolean
  selfRepairMaxRounds: number
  evidenceGateEnabled: boolean
  evidenceMinConfidence: number
  enrichedToolManifestEnabled: boolean
  strictPlanningValidation: boolean
  preWriteValidationEnabled: boolean
  preWriteValidationStrict: boolean
  criticalWriteGateEnabled: boolean
  requireExplicitWriteApproval: boolean
  defaultResponseLanguage: 'en'
  defaultArtifactLanguage: 'source'
}

export async function resolveRuntimeConfig(opts?: {
  model?: string
  responseLanguage?: string
  artifactLanguage?: string
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
}): Promise<RuntimeConfig> {
  const paths = await resolveLabPaths(process.cwd())
  dotenv.config({ path: path.join(paths.projectRoot, '.env.local') })
  dotenv.config({ path: path.join(paths.projectRoot, '.env') })

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY nao encontrado em .env.local/.env.')
  }

  const model = opts?.model ?? process.env.AGENT_LAB_MODEL ?? 'google/gemini-2.5-flash'
  const responseLanguage =
    parseResponseLanguage(opts?.responseLanguage) ??
    parseResponseLanguage(process.env.AGENT_LAB_RESPONSE_LANGUAGE_OVERRIDE) ??
    'auto'
  const artifactLanguage =
    parseArtifactLanguage(opts?.artifactLanguage) ??
    parseArtifactLanguage(process.env.AGENT_LAB_ARTIFACT_LANGUAGE_OVERRIDE) ??
    'source'
  const envPev =
    process.env.AGENT_LAB_PEV_ENABLED === '1' ||
    String(process.env.AGENT_LAB_PEV_ENABLED).toLowerCase() === 'true'
  const enablePev = typeof opts?.enablePev === 'boolean' ? opts.enablePev : envPev
  const loopMaxSteps = resolvePositiveInt(opts?.maxSteps, process.env.AGENT_LAB_LOOP_MAX_STEPS, 6)
  const loopMaxToolCalls = resolvePositiveInt(
    opts?.maxToolCalls,
    process.env.AGENT_LAB_LOOP_MAX_TOOL_CALLS,
    12
  )
  const loopMaxElapsedMs = resolvePositiveInt(
    opts?.maxElapsedMs,
    process.env.AGENT_LAB_LOOP_MAX_ELAPSED_MS,
    120_000
  )
  const confidenceThreshold = resolveThreshold(
    opts?.confidenceThreshold,
    process.env.AGENT_LAB_CONFIDENCE_THRESHOLD,
    0.75
  )
  const envSelfRepair =
    process.env.AGENT_LAB_SELF_REPAIR_ENABLED === '1' ||
    String(process.env.AGENT_LAB_SELF_REPAIR_ENABLED).toLowerCase() === 'true'
  const selfRepairEnabled =
    typeof opts?.selfRepairEnabled === 'boolean' ? opts.selfRepairEnabled : envSelfRepair
  const selfRepairMaxRounds = resolvePositiveInt(
    opts?.selfRepairMaxRounds,
    process.env.AGENT_LAB_SELF_REPAIR_MAX_ROUNDS,
    1
  )
  const envEvidenceGate =
    process.env.AGENT_LAB_EVIDENCE_GATE_ENABLED === '1' ||
    String(process.env.AGENT_LAB_EVIDENCE_GATE_ENABLED).toLowerCase() === 'true'
  const evidenceGateEnabled =
    typeof opts?.evidenceGateEnabled === 'boolean' ? opts.evidenceGateEnabled : envEvidenceGate
  const evidenceMinConfidence = resolveThreshold(
    opts?.evidenceMinConfidence,
    process.env.AGENT_LAB_EVIDENCE_MIN_CONFIDENCE,
    0.75
  )
  const envEnrichedToolManifest =
    process.env.AGENT_LAB_ENRICHED_TOOL_MANIFEST_ENABLED === '1' ||
    String(process.env.AGENT_LAB_ENRICHED_TOOL_MANIFEST_ENABLED).toLowerCase() === 'true'
  const enrichedToolManifestEnabled =
    typeof opts?.enrichedToolManifestEnabled === 'boolean'
      ? opts.enrichedToolManifestEnabled
      : envEnrichedToolManifest
  const envStrictPlanningValidation =
    process.env.AGENT_LAB_STRICT_PLANNING_VALIDATION === '1' ||
    String(process.env.AGENT_LAB_STRICT_PLANNING_VALIDATION).toLowerCase() === 'true'
  const strictPlanningValidation =
    typeof opts?.strictPlanningValidation === 'boolean'
      ? opts.strictPlanningValidation
      : envStrictPlanningValidation
  const envPreWriteValidation =
    process.env.AGENT_LAB_PREWRITE_VALIDATION_ENABLED === '1' ||
    String(process.env.AGENT_LAB_PREWRITE_VALIDATION_ENABLED).toLowerCase() === 'true'
  const preWriteValidationEnabled =
    typeof opts?.preWriteValidationEnabled === 'boolean'
      ? opts.preWriteValidationEnabled
      : envPreWriteValidation
  const envPreWriteValidationStrict =
    process.env.AGENT_LAB_PREWRITE_VALIDATION_STRICT === '1' ||
    String(process.env.AGENT_LAB_PREWRITE_VALIDATION_STRICT).toLowerCase() === 'true'
  const preWriteValidationStrict =
    typeof opts?.preWriteValidationStrict === 'boolean'
      ? opts.preWriteValidationStrict
      : envPreWriteValidationStrict
  const criticalWriteGateEnabled = resolveBooleanFlag(
    opts?.criticalWriteGateEnabled,
    process.env.AGENT_LAB_CRITICAL_WRITE_GATE_ENABLED,
    true
  )
  const requireExplicitWriteApproval = resolveBooleanFlag(
    opts?.requireExplicitWriteApproval,
    process.env.AGENT_LAB_REQUIRE_EXPLICIT_WRITE_APPROVAL,
    true
  )

  return {
    paths,
    apiKey,
    model,
    responseLanguage,
    artifactLanguage,
    enablePev,
    loopMaxSteps,
    loopMaxToolCalls,
    loopMaxElapsedMs,
    confidenceThreshold,
    selfRepairEnabled,
    selfRepairMaxRounds,
    evidenceGateEnabled,
    evidenceMinConfidence,
    enrichedToolManifestEnabled,
    strictPlanningValidation,
    preWriteValidationEnabled,
    preWriteValidationStrict,
    criticalWriteGateEnabled,
    requireExplicitWriteApproval,
    defaultResponseLanguage: 'en',
    defaultArtifactLanguage: 'source'
  }
}

function resolvePositiveInt(
  direct: number | undefined,
  envValue: string | undefined,
  fallback: number
): number {
  if (typeof direct === 'number' && Number.isFinite(direct)) return Math.max(1, Math.floor(direct))
  if (typeof envValue === 'string' && envValue.trim().length > 0) {
    const parsed = Number.parseInt(envValue, 10)
    if (Number.isFinite(parsed)) return Math.max(1, Math.floor(parsed))
  }
  return fallback
}

function resolveThreshold(
  direct: number | undefined,
  envValue: string | undefined,
  fallback: number
): number {
  if (typeof direct === 'number' && Number.isFinite(direct)) return Math.min(1, Math.max(0, direct))
  if (typeof envValue === 'string' && envValue.trim().length > 0) {
    const parsed = Number.parseFloat(envValue)
    if (Number.isFinite(parsed)) return Math.min(1, Math.max(0, parsed))
  }
  return fallback
}

function resolveBooleanFlag(
  direct: boolean | undefined,
  envValue: string | undefined,
  fallback: boolean
): boolean {
  if (typeof direct === 'boolean') return direct
  if (typeof envValue === 'string' && envValue.trim().length > 0) {
    const normalized = envValue.trim().toLowerCase()
    if (normalized === '1' || normalized === 'true' || normalized === 'yes') return true
    if (normalized === '0' || normalized === 'false' || normalized === 'no') return false
  }
  return fallback
}

