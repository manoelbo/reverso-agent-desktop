import type { Argv, CommandModule } from 'yargs'
import { runDocumentProcessing } from '../runner/run-document-processing.js'

interface DocProcessArgs {
  'artifact-language'?: string
  feedback?: 'plain' | 'compact' | 'visual'
}

export const docProcessCommand: CommandModule<object, any> = {
  command: 'doc-process [args..]',
  describe: 'Run document processing (namespace legado; prefira comandos diretos)',
  builder: (yargs: Argv<object>) =>
    yargs
      .usage('reverso doc-process <subcommand> [flags]')
      .example('reverso process-all', 'Process all pending PDFs (comando direto)')
      .example('reverso doc-process process-all', 'Compatibilidade com namespace legado')
      .example('reverso doc-process queue-status', 'Show the current queue')
      .option('artifact-language', {
        type: 'string',
        describe: 'Artifact language (source|en|pt|es|fr|de|it)'
      }),
  handler: async (argv) => {
    const positional = Array.isArray(argv.args) ? argv.args : []
    const docProcessArgv = positional.map((value) => String(value))
    if (
      typeof argv['artifact-language'] === 'string' &&
      !docProcessArgv.includes('--artifact-language')
    ) {
      docProcessArgv.push('--artifact-language', argv['artifact-language'])
    }
    const hasExplicitFeedback = docProcessArgv.includes('--feedback')
    if (!hasExplicitFeedback && typeof argv.feedback === 'string') {
      docProcessArgv.push('--feedback', argv.feedback)
    }
    await runDocumentProcessing(docProcessArgv)
  }
}
