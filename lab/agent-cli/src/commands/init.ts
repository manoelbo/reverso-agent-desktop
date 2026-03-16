import type { Argv, CommandModule } from 'yargs'
import { runInit } from '../runner/run-init.js'
import type { FeedbackMode } from '../cli/renderer.js'

interface InitArgs {
  model?: string
  'max-tokens'?: number
  'response-language'?: string
  'artifact-language'?: string
  feedback: FeedbackMode
}

export const initCommand: CommandModule<object, any> = {
  command: 'init',
  describe: 'Generate initial understanding of the investigation',
  builder: (yargs: Argv<object>) =>
    yargs
      .option('max-tokens', {
        type: 'number',
        describe: 'Token consumption limit'
      })
      .option('model', {
        type: 'string',
        describe: 'LLM model'
      })
      .option('response-language', {
        type: 'string',
        describe: 'Response language (auto|en|pt|es|fr|de|it)'
      })
      .option('artifact-language', {
        type: 'string',
        describe: 'Artifact language (source|en|pt|es|fr|de|it)'
      }),
  handler: async (argv) => {
    await runInit({
      ...(typeof argv['max-tokens'] === 'number' ? { maxTokens: argv['max-tokens'] } : {}),
      ...(typeof argv.model === 'string' ? { model: argv.model } : {}),
      ...(typeof argv.feedback === 'string'
        ? { feedbackMode: argv.feedback as FeedbackMode }
        : {}),
      ...(typeof argv['response-language'] === 'string'
        ? { responseLanguage: argv['response-language'] }
        : {}),
      ...(typeof argv['artifact-language'] === 'string'
        ? { artifactLanguage: argv['artifact-language'] }
        : {})
    })
  }
}
