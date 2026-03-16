import fs from 'node:fs'
import path from 'node:path'
import type { Argv, CommandModule } from 'yargs'
import { runDocumentProcessing } from '../runner/run-document-processing.js'
import type { FeedbackMode } from '../cli/renderer.js'

interface ProcessArgs {
  mode?: string
  'artifact-language'?: string
  feedback?: FeedbackMode
}

function hasPdfs(dir: string): boolean {
  try {
    return fs.readdirSync(dir).some((f) => f.toLowerCase().endsWith('.pdf'))
  } catch {
    return false
  }
}

function detectSourceDir(cwd: string): string | undefined {
  // 1. <cwd>/sources/
  const sourcesDir = path.join(cwd, 'sources')
  if (fs.existsSync(sourcesDir) && hasPdfs(sourcesDir)) {
    return sourcesDir
  }

  // 2. <cwd>/source/ (compatibilidade legado)
  const sourceDir = path.join(cwd, 'source')
  if (fs.existsSync(sourceDir) && hasPdfs(sourceDir)) {
    return sourceDir
  }

  // 3. PDFs diretamente no root (cwd)
  if (hasPdfs(cwd)) {
    return cwd
  }

  // 4. Fall back — let the existing runner resolve via paths.ts
  return undefined
}

export const processCommand: CommandModule<object, any> = {
  command: 'process',
  describe: 'Process all PDFs (auto-detects source directory)',
  builder: (yargs: Argv<object>) =>
    yargs
      .option('mode', {
        type: 'string',
        choices: ['standard', 'deep'] as const,
        default: 'standard',
        describe: 'Processing mode'
      })
      .option('artifact-language', {
        type: 'string',
        describe: 'Artifact language (source|en|pt|es|fr|de|it)'
      })
      .example('reverso process', 'Auto-detect PDFs and process all')
      .example('reverso process --mode deep', 'Deep processing mode')
      .example('reverso process --artifact-language pt', 'Output artifacts in Portuguese'),
  handler: async (argv) => {
    const cwd = process.cwd()
    const detectedSource = detectSourceDir(cwd)

    const docProcessArgv: string[] = ['process-all']

    if (detectedSource) {
      docProcessArgv.push('--source', detectedSource)
    }

    if (typeof argv.mode === 'string' && argv.mode !== 'standard') {
      docProcessArgv.push('--mode', argv.mode)
    }

    if (typeof argv['artifact-language'] === 'string') {
      docProcessArgv.push('--artifact-language', argv['artifact-language'])
    }

    if (typeof argv.feedback === 'string') {
      docProcessArgv.push('--feedback', argv.feedback)
    }

    await runDocumentProcessing(docProcessArgv)
  }
}
