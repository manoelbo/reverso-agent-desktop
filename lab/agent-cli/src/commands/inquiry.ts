import type { Argv, CommandModule } from 'yargs'
import { runInquiry } from '../runner/run-inquiry.js'
import type { FeedbackMode } from '../cli/renderer.js'
import type { EvidenceVerificationMode } from '../core/evidence-semantic-verifier.js'
import type { SensitiveDataPolicyMode } from '../core/sensitive-data-policy.js'

interface InquiryArgs {
  lead: string
  model?: string
  'response-language'?: string
  feedback: FeedbackMode
  pev?: boolean
  'max-steps'?: number
  'max-tool-calls'?: number
  'max-elapsed-ms'?: number
  'confidence-threshold'?: number
  'self-repair'?: boolean
  'self-repair-max-rounds'?: number
  advanced?: boolean
  expert?: boolean
  'evidence-gate'?: boolean
  'evidence-min-confidence'?: number
  'enriched-tool-manifest'?: boolean
  'strict-planning-validation'?: boolean
  'prewrite-validation'?: boolean
  'prewrite-validation-strict'?: boolean
  'critical-write-gate'?: boolean
  'p1-compliance-hooks'?: boolean
  'p1-domain-subagents'?: boolean
  'p1-checkpoint'?: boolean
  'p1-checkpoint-restore'?: boolean
  'editorial-governance'?: boolean
  'editorial-governance-strict'?: boolean
  'p2-batch-concurrency'?: number
  'p2-evidence-mode'?: EvidenceVerificationMode
  'p2-observability'?: boolean
  'p2-sensitive-data-policy'?: SensitiveDataPolicyMode
  'p2-sensitive-data-strict'?: boolean
}

function addAdvancedOption(
  yargs: Argv<any>,
  showAdvanced: boolean,
  key: string,
  config: {
    type: 'boolean' | 'number' | 'string'
    describe: string
    choices?: readonly string[]
  }
): Argv<any> {
  return yargs.option(key, {
    type: config.type,
    describe: config.describe,
    ...(config.choices ? { choices: config.choices } : {}),
    hidden: !showAdvanced,
    group: showAdvanced ? 'Advanced options:' : undefined
  })
}

export const inquiryCommand: CommandModule<object, any> = {
  command: 'inquiry',
  describe: 'Run inquiry for a specific lead',
  builder: (yargs: Argv<any>) => {
    const showAdvanced = process.argv.includes('--advanced') || process.argv.includes('--expert')

    let configured = yargs
      .option('lead', {
        type: 'string',
        demandOption: true,
        describe: 'Lead slug'
      })
      .option('model', { type: 'string', describe: 'LLM model' })
      .option('response-language', {
        type: 'string',
        describe: 'Response language (auto|en|pt|es|fr|de|it)'
      })
      .option('pev', {
        type: 'boolean',
        describe: 'Enable plan -> execute -> verify flow'
      })
      .option('max-steps', { type: 'number', describe: 'Loop step limit' })
      .option('max-tool-calls', { type: 'number', describe: 'Loop tool call limit' })
      .option('max-elapsed-ms', { type: 'number', describe: 'Total timeout in ms' })
      .option('confidence-threshold', {
        type: 'number',
        describe: 'Confidence threshold (0-1)'
      })
      .option('self-repair', {
        type: 'boolean',
        describe: 'Enable JSON contract auto-repair'
      })
      .option('self-repair-max-rounds', {
        type: 'number',
        describe: 'Maximum auto-repair rounds'
      })

    configured = addAdvancedOption(configured, showAdvanced, 'evidence-gate', {
      type: 'boolean',
      describe: 'Enable evidence gate'
    })
    configured = addAdvancedOption(configured, showAdvanced, 'evidence-min-confidence', {
      type: 'number',
      describe: 'Minimum confidence for evidence gate (0-1)'
    })
    configured = addAdvancedOption(configured, showAdvanced, 'enriched-tool-manifest', {
      type: 'boolean',
      describe: 'Expose enriched tool manifest in planning'
    })
    configured = addAdvancedOption(configured, showAdvanced, 'strict-planning-validation', {
      type: 'boolean',
      describe: 'Fail if plan does not meet strict validation'
    })
    configured = addAdvancedOption(configured, showAdvanced, 'prewrite-validation', {
      type: 'boolean',
      describe: 'Run pre-persistence validation'
    })
    configured = addAdvancedOption(configured, showAdvanced, 'prewrite-validation-strict', {
      type: 'boolean',
      describe: 'Fail execution if pre-write validation fails'
    })
    configured = addAdvancedOption(configured, showAdvanced, 'critical-write-gate', {
      type: 'boolean',
      describe: 'Enable critical write gate'
    })
    configured = addAdvancedOption(configured, showAdvanced, 'p1-compliance-hooks', {
      type: 'boolean',
      describe: 'Enable P1 compliance hooks'
    })
    configured = addAdvancedOption(configured, showAdvanced, 'p1-domain-subagents', {
      type: 'boolean',
      describe: 'Enable P1 domain subagents'
    })
    configured = addAdvancedOption(configured, showAdvanced, 'p1-checkpoint', {
      type: 'boolean',
      describe: 'Enable P1 investigation checkpoints'
    })
    configured = addAdvancedOption(configured, showAdvanced, 'p1-checkpoint-restore', {
      type: 'boolean',
      describe: 'Restore checkpoint at inquiry start'
    })
    configured = addAdvancedOption(configured, showAdvanced, 'editorial-governance', {
      type: 'boolean',
      describe: 'Enable artifact editorial governance'
    })
    configured = addAdvancedOption(configured, showAdvanced, 'editorial-governance-strict', {
      type: 'boolean',
      describe: 'Fail on editorial governance violations'
    })
    configured = addAdvancedOption(configured, showAdvanced, 'p2-batch-concurrency', {
      type: 'number',
      describe: 'Inquiry batch concurrency'
    })
    configured = addAdvancedOption(configured, showAdvanced, 'p2-evidence-mode', {
      type: 'string',
      choices: ['lexical', 'semantic', 'hybrid'] as const,
      describe: 'Evidence verification mode'
    })
    configured = addAdvancedOption(configured, showAdvanced, 'p2-observability', {
      type: 'boolean',
      describe: 'Enable P2 operational observability'
    })
    configured = addAdvancedOption(configured, showAdvanced, 'p2-sensitive-data-policy', {
      type: 'string',
      choices: ['off', 'warn', 'strict'] as const,
      describe: 'Sensitive data policy'
    })
    configured = addAdvancedOption(configured, showAdvanced, 'p2-sensitive-data-strict', {
      type: 'boolean',
      describe: 'Alias for p2-sensitive-data-policy=strict'
    })

    return configured
  },
  handler: async (argv) => {
    const sensitivePolicyMode =
      argv['p2-sensitive-data-strict'] === true
        ? ('strict' as SensitiveDataPolicyMode)
        : argv['p2-sensitive-data-policy']

    await runInquiry({
      lead: argv.lead,
      ...(typeof argv.model === 'string' ? { model: argv.model } : {}),
      ...(typeof argv.feedback === 'string'
        ? { feedbackMode: argv.feedback as FeedbackMode }
        : {}),
      ...(typeof argv['response-language'] === 'string'
        ? { responseLanguage: argv['response-language'] }
        : {}),
      ...(typeof argv.pev === 'boolean' ? { enablePev: argv.pev } : {}),
      ...(typeof argv['max-steps'] === 'number' ? { maxSteps: argv['max-steps'] } : {}),
      ...(typeof argv['max-tool-calls'] === 'number'
        ? { maxToolCalls: argv['max-tool-calls'] }
        : {}),
      ...(typeof argv['max-elapsed-ms'] === 'number'
        ? { maxElapsedMs: argv['max-elapsed-ms'] }
        : {}),
      ...(typeof argv['confidence-threshold'] === 'number'
        ? { confidenceThreshold: argv['confidence-threshold'] }
        : {}),
      ...(typeof argv['self-repair'] === 'boolean'
        ? { selfRepairEnabled: argv['self-repair'] }
        : {}),
      ...(typeof argv['self-repair-max-rounds'] === 'number'
        ? { selfRepairMaxRounds: argv['self-repair-max-rounds'] }
        : {}),
      ...(typeof argv['evidence-gate'] === 'boolean'
        ? { evidenceGateEnabled: argv['evidence-gate'] }
        : {}),
      ...(typeof argv['evidence-min-confidence'] === 'number'
        ? { evidenceMinConfidence: argv['evidence-min-confidence'] }
        : {}),
      ...(typeof argv['enriched-tool-manifest'] === 'boolean'
        ? { enrichedToolManifestEnabled: argv['enriched-tool-manifest'] }
        : {}),
      ...(typeof argv['strict-planning-validation'] === 'boolean'
        ? { strictPlanningValidation: argv['strict-planning-validation'] }
        : {}),
      ...(typeof argv['prewrite-validation'] === 'boolean'
        ? { preWriteValidationEnabled: argv['prewrite-validation'] }
        : {}),
      ...(typeof argv['prewrite-validation-strict'] === 'boolean'
        ? { preWriteValidationStrict: argv['prewrite-validation-strict'] }
        : {}),
      ...(typeof argv['critical-write-gate'] === 'boolean'
        ? { criticalWriteGateEnabled: argv['critical-write-gate'] }
        : {}),
      ...(typeof argv['p1-compliance-hooks'] === 'boolean'
        ? { p1ComplianceHooksEnabled: argv['p1-compliance-hooks'] }
        : {}),
      ...(typeof argv['p1-domain-subagents'] === 'boolean'
        ? { p1DomainSubagentsEnabled: argv['p1-domain-subagents'] }
        : {}),
      ...(typeof argv['p1-checkpoint'] === 'boolean'
        ? { p1CheckpointEnabled: argv['p1-checkpoint'] }
        : {}),
      ...(typeof argv['p1-checkpoint-restore'] === 'boolean'
        ? { p1CheckpointRestore: argv['p1-checkpoint-restore'] }
        : {}),
      ...(typeof argv['editorial-governance'] === 'boolean'
        ? { editorialGovernanceEnabled: argv['editorial-governance'] }
        : {}),
      ...(typeof argv['editorial-governance-strict'] === 'boolean'
        ? { editorialGovernanceStrict: argv['editorial-governance-strict'] }
        : {}),
      ...(typeof argv['p2-batch-concurrency'] === 'number'
        ? { p2InquiryBatchConcurrency: argv['p2-batch-concurrency'] }
        : {}),
      ...(typeof argv['p2-evidence-mode'] === 'string'
        ? {
            p2EvidenceVerificationMode:
              argv['p2-evidence-mode'] as EvidenceVerificationMode
          }
        : {}),
      ...(typeof argv['p2-observability'] === 'boolean'
        ? { p2ObservabilityEnabled: argv['p2-observability'] }
        : {}),
      ...(typeof sensitivePolicyMode === 'string'
        ? {
            p2SensitiveDataPolicyMode:
              sensitivePolicyMode as SensitiveDataPolicyMode
          }
        : {})
    })
  }
}
