import readline from 'node:readline'
import fs from 'node:fs'
import path from 'node:path'
import type { CommandModule } from 'yargs'
import { getGlobalEnvPath } from '../core/paths.js'

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

export const setupCommand: CommandModule<object, object> = {
  command: 'setup',
  describe: 'Configure OpenRouter API key',
  builder: (yargs) => yargs,
  handler: async () => {
    console.log('=== Reverso Setup ===\n')
    console.log('To get your OpenRouter API key, visit:')
    console.log('  https://openrouter.ai/settings/keys\n')

    const key = await prompt('Enter your OpenRouter API key: ')

    if (!key.startsWith('sk-or-')) {
      console.error('\nError: API key must start with "sk-or-". Please check your key and try again.')
      process.exitCode = 1
      return
    }

    const envPath = getGlobalEnvPath()
    const envDir = path.dirname(envPath)

    fs.mkdirSync(envDir, { recursive: true })

    let existing = ''
    if (fs.existsSync(envPath)) {
      existing = fs.readFileSync(envPath, 'utf8')
    }

    const lines = existing.split('\n').filter((l) => !l.startsWith('OPENROUTER_API_KEY='))
    lines.push(`OPENROUTER_API_KEY=${key}`)
    const content = lines.filter(Boolean).join('\n') + '\n'

    fs.writeFileSync(envPath, content, 'utf8')

    console.log(`\nAPI key saved to ${envPath}`)
  }
}
