import type { Argv, CommandModule } from 'yargs'
import { runCreateLead } from '../runner/run-create-lead.js'
import type { FeedbackMode } from '../cli/renderer.js'

interface CreateLeadArgs {
  idea?: string
  model?: string
  'response-language'?: string
  pev?: boolean
  'self-repair'?: boolean
  'self-repair-max-rounds'?: number
  feedback: FeedbackMode
}

export const createLeadCommand: CommandModule<object, any> = {
  command: 'create-lead',
  describe: 'Create investigation lead with inquiry plan',
  builder: (yargs: Argv<object>) =>
    yargs
      .option('idea', { type: 'string', describe: 'Initial idea for the lead' })
      .option('model', { type: 'string', describe: 'LLM model' })
      .option('response-language', {
        type: 'string',
        describe: 'Response language (auto|en|pt|es|fr|de|it)'
      })
      .option('pev', {
        type: 'boolean',
        describe: 'Enable plan -> execute -> verify flow'
      })
      .option('self-repair', {
        type: 'boolean',
        describe: 'Enable JSON contract auto-repair'
      })
      .option('self-repair-max-rounds', {
        type: 'number',
        describe: 'Maximum auto-repair rounds'
      }),
  handler: async (argv) => {
    await runCreateLead({
      ...(typeof argv.idea === 'string' ? { idea: argv.idea } : {}),
      ...(typeof argv.model === 'string' ? { model: argv.model } : {}),
      ...(typeof argv.feedback === 'string'
        ? { feedbackMode: argv.feedback as FeedbackMode }
        : {}),
      ...(typeof argv['response-language'] === 'string'
        ? { responseLanguage: argv['response-language'] }
        : {}),
      ...(typeof argv.pev === 'boolean' ? { enablePev: argv.pev } : {}),
      ...(typeof argv['self-repair'] === 'boolean'
        ? { selfRepairEnabled: argv['self-repair'] }
        : {}),
      ...(typeof argv['self-repair-max-rounds'] === 'number'
        ? { selfRepairMaxRounds: argv['self-repair-max-rounds'] }
        : {})
    })
  }
}
