import type { Argv, CommandModule } from 'yargs'
import { runAgentSetup } from '../runner/run-agent-instructions.js'
import type { FeedbackMode } from '../cli/renderer.js'

interface AgentSetupArgs {
  text: string
  feedback: FeedbackMode
}

export const agentSetupCommand: CommandModule<object, any> = {
  command: 'agent-setup',
  describe: 'Update agent.md instructions',
  builder: (yargs: Argv<object>) =>
    yargs.option('text', {
      type: 'string',
      demandOption: true,
      describe: 'Instruction text'
    }),
  handler: async (argv) => {
    await runAgentSetup({
      text: argv.text,
      ...(typeof argv.feedback === 'string'
        ? { feedbackMode: argv.feedback as FeedbackMode }
        : {})
    })
  }
}
