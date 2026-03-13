import { runAgentSetup } from './runner/run-agent-instructions.js'
import { runAgent } from './runner/run-agent.js'
import { runCreateLead } from './runner/run-create-lead.js'
import { runDig } from './runner/run-dig.js'
import { runDeepDiveNext } from './runner/run-deep-dive-next.js'
import { runInit } from './runner/run-init.js'
import { runInquiry } from './runner/run-inquiry.js'
import { runDocumentProcessing } from './runner/run-document-processing.js'
import type { FeedbackMode } from './cli/renderer.js'

function parseFlags(argv: string[]): Record<string, string> {
  const flags: Record<string, string> = {}
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (!token || !token.startsWith('--')) continue
    const key = token.slice(2)
    const next = argv[i + 1]
    if (!next || next.startsWith('--')) {
      flags[key] = 'true'
      continue
    }
    flags[key] = next
    i += 1
  }
  return flags
}

function parseFeedbackMode(value: string | undefined): FeedbackMode | undefined {
  if (!value) return undefined
  if (value === 'plain' || value === 'compact' || value === 'visual') return value
  throw new Error(`Valor invalido para --feedback: ${value}. Use plain, compact ou visual.`)
}

function printUsage(): void {
  console.log(`
Agent Lab CLI

Comandos:
  agent --text "<mensagem>"|--prompt "<mensagem>" [--model <openrouter-model>] [--feedback <plain|compact|visual>] [--response-language <auto|en|pt|es|fr|de|it>] [--pev] [--self-repair] [--self-repair-max-rounds <n>]
  init [--max-tokens <n>] [--model <openrouter-model>] [--feedback <plain|compact|visual>] [--response-language <auto|en|pt|es|fr|de|it>] [--artifact-language <source|en|pt|es|fr|de|it>]
  agent-setup --text "<instrucao>" [--feedback <plain|compact|visual>]
  deep-dive [--model <openrouter-model>] [--feedback <plain|compact|visual>] [--response-language <auto|en|pt|es|fr|de|it>] [--pev] [--self-repair] [--self-repair-max-rounds <n>]
  dig [alias legado de deep-dive]
  deep-dive-next --text "<resposta natural>" [--model <openrouter-model>] [--feedback <plain|compact|visual>] [--response-language <auto|en|pt|es|fr|de|it>] [--pev] [--self-repair] [--self-repair-max-rounds <n>]
  create-lead [--idea "<idea>"] [--model <openrouter-model>] [--feedback <plain|compact|visual>] [--response-language <auto|en|pt|es|fr|de|it>] [--pev] [--self-repair] [--self-repair-max-rounds <n>]
  inquiry --lead <slug> [--model <openrouter-model>] [--feedback <plain|compact|visual>] [--response-language <auto|en|pt|es|fr|de|it>] [--pev] [--max-steps <n>] [--max-tool-calls <n>] [--max-elapsed-ms <n>] [--confidence-threshold <0-1>] [--self-repair] [--self-repair-max-rounds <n>] [--evidence-gate] [--evidence-min-confidence <0-1>] [--enriched-tool-manifest] [--strict-planning-validation] [--prewrite-validation] [--prewrite-validation-strict] [--critical-write-gate] [--require-explicit-write-approval]
  doc-process <subcommand-or-flags> [--artifact-language <source|en|pt|es|fr|de|it>]

Atalho sem subcomando:
  --text "<mensagem>" | --prompt "<mensagem>"
`.trim())
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2)
  const command = argv[0] && !argv[0].startsWith('--') ? argv[0] : undefined
  const rest = command ? argv.slice(1) : argv
  const flags = parseFlags(rest)
  const feedbackMode = parseFeedbackMode(flags.feedback)
  const enablePev = parseBooleanFlag(flags.pev)
  const selfRepairEnabled = parseBooleanFlag(flags['self-repair'])
  const selfRepairMaxRounds = parseIntegerFlag(flags['self-repair-max-rounds'])
  const evidenceGateEnabled = parseBooleanFlag(flags['evidence-gate'])
  const evidenceMinConfidence = parseNumberFlag(flags['evidence-min-confidence'])
  const enrichedToolManifestEnabled = parseBooleanFlag(flags['enriched-tool-manifest'])
  const strictPlanningValidation = parseBooleanFlag(flags['strict-planning-validation'])
  const preWriteValidationEnabled = parseBooleanFlag(flags['prewrite-validation'])
  const preWriteValidationStrict = parseBooleanFlag(flags['prewrite-validation-strict'])
  const criticalWriteGateEnabled = parseBooleanFlag(flags['critical-write-gate'])
  const requireExplicitWriteApproval = parseBooleanFlag(flags['require-explicit-write-approval'])
  const conversationalText = (flags.text ?? flags.prompt ?? rest.find((x) => !x.startsWith('--')) ?? '').trim()

  switch (command) {
    case 'agent': {
      await runAgent({
        text: conversationalText,
        ...(flags.model ? { model: flags.model } : {}),
        ...(feedbackMode ? { feedbackMode } : {}),
        ...(typeof enablePev === 'boolean' ? { enablePev } : {}),
        ...(typeof selfRepairEnabled === 'boolean' ? { selfRepairEnabled } : {}),
        ...(typeof selfRepairMaxRounds === 'number' ? { selfRepairMaxRounds } : {}),
        ...(typeof evidenceGateEnabled === 'boolean' ? { evidenceGateEnabled } : {}),
        ...(typeof evidenceMinConfidence === 'number' ? { evidenceMinConfidence } : {}),
        ...(typeof enrichedToolManifestEnabled === 'boolean'
          ? { enrichedToolManifestEnabled }
          : {}),
        ...(typeof strictPlanningValidation === 'boolean'
          ? { strictPlanningValidation }
          : {}),
        ...(typeof preWriteValidationEnabled === 'boolean'
          ? { preWriteValidationEnabled }
          : {}),
        ...(typeof preWriteValidationStrict === 'boolean'
          ? { preWriteValidationStrict }
          : {}),
        ...(typeof criticalWriteGateEnabled === 'boolean'
          ? { criticalWriteGateEnabled }
          : {}),
        ...(typeof requireExplicitWriteApproval === 'boolean'
          ? { requireExplicitWriteApproval }
          : {}),
        ...(flags['response-language']
          ? { responseLanguage: flags['response-language'] }
          : {}),
        ...(flags['artifact-language']
          ? { artifactLanguage: flags['artifact-language'] }
          : {})
      })
      return
    }
    case 'init': {
      const maxTokens = flags['max-tokens'] ? parseInt(flags['max-tokens'], 10) : undefined
      await runInit({
        ...(typeof maxTokens === 'number' && !Number.isNaN(maxTokens) ? { maxTokens } : {}),
        ...(flags.model ? { model: flags.model } : {}),
        ...(feedbackMode ? { feedbackMode } : {}),
        ...(flags['response-language']
          ? { responseLanguage: flags['response-language'] }
          : {}),
        ...(flags['artifact-language']
          ? { artifactLanguage: flags['artifact-language'] }
          : {})
      })
      return
    }
    case 'agent-setup': {
      const text = flags.text ?? rest.find((x) => !x.startsWith('--'))
      await runAgentSetup({
        text: text ?? '',
        ...(feedbackMode ? { feedbackMode } : {})
      })
      return
    }
    case 'deep-dive':
    case 'dig': {
      await runDig({
        ...(flags.model ? { model: flags.model } : {}),
        ...(feedbackMode ? { feedbackMode } : {}),
        ...(typeof enablePev === 'boolean' ? { enablePev } : {}),
        ...(typeof selfRepairEnabled === 'boolean' ? { selfRepairEnabled } : {}),
        ...(typeof selfRepairMaxRounds === 'number' ? { selfRepairMaxRounds } : {}),
        ...(typeof evidenceGateEnabled === 'boolean' ? { evidenceGateEnabled } : {}),
        ...(typeof evidenceMinConfidence === 'number' ? { evidenceMinConfidence } : {}),
        ...(flags['response-language']
          ? { responseLanguage: flags['response-language'] }
          : {})
      })
      return
    }
    case 'deep-dive-next': {
      const text = flags.text ?? rest.find((x) => !x.startsWith('--')) ?? ''
      await runDeepDiveNext({
        text,
        ...(flags.model ? { model: flags.model } : {}),
        ...(feedbackMode ? { feedbackMode } : {}),
        ...(typeof enablePev === 'boolean' ? { enablePev } : {}),
        ...(typeof selfRepairEnabled === 'boolean' ? { selfRepairEnabled } : {}),
        ...(typeof selfRepairMaxRounds === 'number' ? { selfRepairMaxRounds } : {}),
        ...(flags['response-language']
          ? { responseLanguage: flags['response-language'] }
          : {})
      })
      return
    }
    case 'create-lead': {
      const idea = flags.idea
      await runCreateLead({
        ...(idea !== undefined ? { idea } : {}),
        ...(flags.model ? { model: flags.model } : {}),
        ...(feedbackMode ? { feedbackMode } : {}),
        ...(typeof enablePev === 'boolean' ? { enablePev } : {}),
        ...(typeof selfRepairEnabled === 'boolean' ? { selfRepairEnabled } : {}),
        ...(typeof selfRepairMaxRounds === 'number' ? { selfRepairMaxRounds } : {}),
        ...(typeof evidenceGateEnabled === 'boolean' ? { evidenceGateEnabled } : {}),
        ...(typeof evidenceMinConfidence === 'number' ? { evidenceMinConfidence } : {}),
        ...(typeof enrichedToolManifestEnabled === 'boolean'
          ? { enrichedToolManifestEnabled }
          : {}),
        ...(typeof strictPlanningValidation === 'boolean'
          ? { strictPlanningValidation }
          : {}),
        ...(typeof preWriteValidationEnabled === 'boolean'
          ? { preWriteValidationEnabled }
          : {}),
        ...(typeof preWriteValidationStrict === 'boolean'
          ? { preWriteValidationStrict }
          : {}),
        ...(flags['response-language']
          ? { responseLanguage: flags['response-language'] }
          : {})
      })
      return
    }
    case 'inquiry': {
      const lead = flags.lead ?? rest.find((x) => !x.startsWith('--')) ?? ''
      const maxSteps = parseIntegerFlag(flags['max-steps'])
      const maxToolCalls = parseIntegerFlag(flags['max-tool-calls'])
      const maxElapsedMs = parseIntegerFlag(flags['max-elapsed-ms'])
      const confidenceThreshold = parseNumberFlag(flags['confidence-threshold'])
      await runInquiry({
        lead,
        ...(flags.model ? { model: flags.model } : {}),
        ...(feedbackMode ? { feedbackMode } : {}),
        ...(typeof enablePev === 'boolean' ? { enablePev } : {}),
        ...(typeof maxSteps === 'number' ? { maxSteps } : {}),
        ...(typeof maxToolCalls === 'number' ? { maxToolCalls } : {}),
        ...(typeof maxElapsedMs === 'number' ? { maxElapsedMs } : {}),
        ...(typeof confidenceThreshold === 'number' ? { confidenceThreshold } : {}),
        ...(typeof selfRepairEnabled === 'boolean' ? { selfRepairEnabled } : {}),
        ...(typeof selfRepairMaxRounds === 'number' ? { selfRepairMaxRounds } : {}),
        ...(typeof evidenceGateEnabled === 'boolean' ? { evidenceGateEnabled } : {}),
        ...(typeof evidenceMinConfidence === 'number' ? { evidenceMinConfidence } : {}),
        ...(typeof enrichedToolManifestEnabled === 'boolean'
          ? { enrichedToolManifestEnabled }
          : {}),
        ...(typeof strictPlanningValidation === 'boolean'
          ? { strictPlanningValidation }
          : {}),
        ...(typeof preWriteValidationEnabled === 'boolean'
          ? { preWriteValidationEnabled }
          : {}),
        ...(typeof preWriteValidationStrict === 'boolean'
          ? { preWriteValidationStrict }
          : {}),
        ...(typeof criticalWriteGateEnabled === 'boolean'
          ? { criticalWriteGateEnabled }
          : {}),
        ...(typeof requireExplicitWriteApproval === 'boolean'
          ? { requireExplicitWriteApproval }
          : {}),
        ...(flags['response-language']
          ? { responseLanguage: flags['response-language'] }
          : {})
      })
      return
    }
    case 'doc-process': {
      await runDocumentProcessing(rest)
      return
    }
    case 'help':
    case '--help':
    case undefined: {
      if (conversationalText) {
        await runAgent({
          text: conversationalText,
          ...(flags.model ? { model: flags.model } : {}),
          ...(feedbackMode ? { feedbackMode } : {}),
          ...(typeof enablePev === 'boolean' ? { enablePev } : {}),
          ...(typeof selfRepairEnabled === 'boolean' ? { selfRepairEnabled } : {}),
          ...(typeof selfRepairMaxRounds === 'number' ? { selfRepairMaxRounds } : {}),
          ...(typeof evidenceGateEnabled === 'boolean' ? { evidenceGateEnabled } : {}),
          ...(typeof evidenceMinConfidence === 'number' ? { evidenceMinConfidence } : {}),
          ...(typeof enrichedToolManifestEnabled === 'boolean'
            ? { enrichedToolManifestEnabled }
            : {}),
          ...(typeof strictPlanningValidation === 'boolean'
            ? { strictPlanningValidation }
            : {}),
          ...(typeof preWriteValidationEnabled === 'boolean'
            ? { preWriteValidationEnabled }
            : {}),
          ...(typeof preWriteValidationStrict === 'boolean'
            ? { preWriteValidationStrict }
            : {}),
          ...(typeof criticalWriteGateEnabled === 'boolean'
            ? { criticalWriteGateEnabled }
            : {}),
          ...(typeof requireExplicitWriteApproval === 'boolean'
            ? { requireExplicitWriteApproval }
            : {}),
          ...(flags['response-language']
            ? { responseLanguage: flags['response-language'] }
            : {}),
          ...(flags['artifact-language']
            ? { artifactLanguage: flags['artifact-language'] }
            : {})
        })
        return
      }
      printUsage()
      return
    }
    default: {
      throw new Error(`Comando desconhecido: ${command}`)
    }
  }
}

function parseIntegerFlag(value: string | undefined): number | undefined {
  if (!value) return undefined
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) {
    throw new Error(`Valor invalido para inteiro: ${value}`)
  }
  return parsed
}

function parseNumberFlag(value: string | undefined): number | undefined {
  if (!value) return undefined
  const parsed = Number.parseFloat(value)
  if (!Number.isFinite(parsed)) {
    throw new Error(`Valor invalido para numero: ${value}`)
  }
  return parsed
}

function parseBooleanFlag(value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined
  if (value === 'true') return true
  if (value === 'false') return false
  return true
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Erro no Agent Lab: ${message}`)
  process.exitCode = 1
})

