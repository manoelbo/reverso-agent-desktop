import yargs from 'yargs/yargs'
import { hideBin } from 'yargs/helpers'
import { initCommand } from './commands/init.js'
import { digCommand } from './commands/dig.js'
import { createLeadCommand } from './commands/create-lead.js'
import { inquiryCommand } from './commands/inquiry.js'
import { inquiryAllCommand } from './commands/inquiry-all.js'
import { agentSetupCommand } from './commands/agent-setup.js'
import { docProcessCommand } from './commands/doc-process.js'
import { docProcessDirectCommands } from './commands/doc-process-direct.js'
import { setupCommand } from './commands/setup.js'
import { processCommand } from './commands/process.js'
import { DEFAULT_FEEDBACK_MODE } from './core/feedback.js'

async function main(): Promise<void> {
  await yargs(hideBin(process.argv))
    .scriptName('reverso')
    .usage('$0 <command> [flags]')
    .parserConfiguration({
      'camel-case-expansion': false
    })
    .option('filesystem', {
      type: 'string',
      describe: 'Override filesystem root path',
      global: true
    })
    .option('feedback', {
      type: 'string',
      choices: ['plain', 'compact', 'visual'] as const,
      default: DEFAULT_FEEDBACK_MODE,
      describe: 'Terminal feedback mode',
      global: true
    })
    .option('advanced', {
      type: 'boolean',
      default: false,
      describe: 'Show advanced flags in help',
      global: true
    })
    .option('expert', {
      type: 'boolean',
      default: false,
      hidden: true,
      describe: 'Internal alias for advanced flags',
      global: true
    })
    .middleware((argv) => {
      if (typeof argv.filesystem === 'string' && argv.filesystem.length > 0) {
        process.env.REVERSO_FILESYSTEM = argv.filesystem
      }
    })
    .command(setupCommand)
    .command(processCommand)
    .command(initCommand)
    .command(agentSetupCommand)
    .command(digCommand)
    .command(createLeadCommand)
    .command(inquiryCommand)
    .command(inquiryAllCommand)
    .command(docProcessCommand)
    .command(docProcessDirectCommands)
    .demandCommand(1, 'Specify a command. Use --help to see available commands.')
    .strictCommands()
    .recommendCommands()
    .help()
    .alias('h', 'help')
    .parseAsync()
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Agent CLI error: ${message}`)
  process.exitCode = 1
})

