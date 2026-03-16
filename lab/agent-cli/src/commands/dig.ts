import type { Argv, CommandModule } from 'yargs'
import { runDig } from '../runner/run-dig.js'
import type { FeedbackMode } from '../cli/renderer.js'

interface DigArgs {
  model?: string
  'response-language'?: string
  pev?: boolean
  'self-repair'?: boolean
  'self-repair-max-rounds'?: number
  feedback: FeedbackMode
}

export const digCommand: CommandModule<object, any> = {
  command: 'dig',
  aliases: ['deep-dive'],
  describe: 'Run deep-dive on sources',
  builder: (yargs: Argv<object>) =>
    yargs
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
    await runDig({
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
