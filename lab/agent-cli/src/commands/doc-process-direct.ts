import type { Argv, CommandModule } from 'yargs'
import { runDocumentProcessing } from '../runner/run-document-processing.js'

type DirectDocProcessName =
  | 'process-all'
  | 'process-selected'
  | 'process-source'
  | 'process-queue'
  | 'queue-status'
  | 'queue-clear'
  | 'watch'
  | 'select'
  | 'rerun'
  | 'delete-source'

interface DirectDocProcessDefinition {
  name: DirectDocProcessName
  describe: string
  examples: Array<{ command: string; description: string }>
}

const DOC_PROCESS_DIRECT_DEFINITIONS: DirectDocProcessDefinition[] = [
  {
    name: 'process-all',
    describe: 'Processa todos os PDFs pendentes (sources/source/root).',
    examples: [
      { command: 'reverso process-all', description: 'Processar todos os PDFs pendentes' },
      { command: 'reverso process-all --mode deep', description: 'Rodar em modo deep (replica)' }
    ]
  },
  {
    name: 'process-selected',
    describe: 'Processa PDFs selecionados no checkpoint ou via --files explícito.',
    examples: [{ command: 'reverso process-selected', description: 'Processar só selecionados' }]
  },
  {
    name: 'process-source',
    describe: 'Reprocessa um único PDF informado.',
    examples: [
      { command: 'reverso process-source --file "a.pdf"', description: 'Reprocessar um PDF (standard)' },
      {
        command: 'reverso process-source --file "a.pdf" --mode deep',
        description: 'Reprocessar um PDF em modo deep'
      }
    ]
  },
  {
    name: 'process-queue',
    describe: 'Processa somente os itens já enfileirados.',
    examples: [{ command: 'reverso process-queue', description: 'Consumir fila atual' }]
  },
  {
    name: 'queue-status',
    describe: 'Mostra status da fila de processamento.',
    examples: [{ command: 'reverso queue-status', description: 'Listar itens pendentes' }]
  },
  {
    name: 'queue-clear',
    describe: 'Remove documentos da fila atual.',
    examples: [
      { command: 'reverso queue-clear', description: 'Limpar fila inteira' },
      { command: 'reverso queue-clear --files "a.pdf,b.pdf"', description: 'Remover só arquivos informados' }
    ]
  },
  {
    name: 'watch',
    describe: 'Observa a pasta de fontes e atualiza checkpoint automaticamente.',
    examples: [
      { command: 'reverso watch', description: 'Monitorar sem processar automaticamente' },
      { command: 'reverso watch --auto-process all --process-queue-every 30', description: 'Monitorar e processar em lote' }
    ]
  },
  {
    name: 'select',
    describe: 'Marca/desmarca PDFs para processamento seletivo.',
    examples: [
      { command: 'reverso select --files "a.pdf,b.pdf" --value true', description: 'Selecionar arquivos' },
      { command: 'reverso select --files "a.pdf" --value false', description: 'Remover arquivo da seleção' }
    ]
  },
  {
    name: 'rerun',
    describe: 'Reseta artefatos do modo e reprocessa documentos.',
    examples: [
      { command: 'reverso rerun --all', description: 'Reprocessar todos os PDFs' },
      { command: 'reverso rerun --input "meu.pdf"', description: 'Reprocessar apenas um PDF' }
    ]
  },
  {
    name: 'delete-source',
    describe: 'Deleta um PDF da source, artefatos e referências nos arquivos gerados.',
    examples: [
      { command: 'reverso delete-source --file "a.pdf"', description: 'Excluir PDF e artefatos relacionados' }
    ]
  }
]

function buildDocProcessBuilder(yargs: Argv<object>): Argv<object> {
  return yargs
    .option('source', {
      type: 'string',
      describe: 'Pasta de entrada dos PDFs (default: sources/, source/ ou root).'
    })
    .option('mode', {
      type: 'string',
      choices: ['standard', 'deep'] as const,
      describe: 'Modo de processamento (standard|deep).'
    })
    .option('artifact-language', {
      type: 'string',
      describe: 'Idioma dos artefatos (source|en|pt|es|fr|de|it).'
    })
    .option('files', {
      type: 'string',
      describe: 'Lista CSV de arquivos PDF (usado em select/queue-clear).'
    })
    .option('file', {
      type: 'string',
      describe: 'Nome de um arquivo PDF único (usado em process-source/delete-source).'
    })
    .option('value', {
      type: 'boolean',
      describe: 'Valor de seleção true|false (usado em select).'
    })
    .option('all', {
      type: 'boolean',
      describe: 'Reprocessa todos os documentos (usado em rerun).'
    })
    .option('input', {
      type: 'string',
      describe: 'PDF específico para rerun.'
    })
    .option('auto-process', {
      type: 'string',
      choices: ['none', 'all', 'selected'] as const,
      describe: 'No watch, define se processa automaticamente novos itens.'
    })
    .option('process-queue-every', {
      type: 'number',
      describe: 'No watch, intervalo em segundos para processar fila automaticamente.'
    })
    .option('model', {
      type: 'string',
      describe: 'Modelo principal para processamento.'
    })
    .option('preview-model', {
      type: 'string',
      describe: 'Modelo para preview/metadata.'
    })
    .option('max-pages', {
      type: 'number',
      describe: 'Limita páginas processadas por PDF.'
    })
    .option('chunk-pages', {
      type: 'number',
      describe: 'Tamanho de chunk em páginas no modo deep.'
    })
    .option('concurrency', {
      type: 'number',
      describe: 'Concorrência de chamadas no modo deep.'
    })
    .option('resume', {
      type: 'boolean',
      describe: 'Retoma do checkpoint quando disponível.'
    })
    .option('provider-sort', {
      type: 'string',
      choices: ['latency', 'throughput', 'price'] as const,
      describe: 'Ordenação de providers OpenRouter.'
    })
    .option('debug-openrouter', {
      type: 'boolean',
      describe: 'Ativa logs de debug do OpenRouter.'
    })
}

function normalizeAliasArgv(argv: Record<string, unknown>, subcommand: DirectDocProcessName): string[] {
  const normalized: string[] = [subcommand]
  const positional = Array.isArray(argv['args']) ? argv['args'] : []
  for (const value of positional) normalized.push(String(value))

  const appendOption = (name: string, value: unknown): void => {
    if (value == null) return
    if (typeof value === 'boolean') {
      if (value) normalized.push(`--${name}`)
      return
    }
    normalized.push(`--${name}`, String(value))
  }

  appendOption('source', argv['source'])
  appendOption('mode', argv['mode'])
  appendOption('artifact-language', argv['artifact-language'])
  appendOption('feedback', argv['feedback'])
  appendOption('files', argv['files'])
  appendOption('file', argv['file'])
  appendOption('value', argv['value'])
  appendOption('all', argv['all'])
  appendOption('input', argv['input'])
  appendOption('auto-process', argv['auto-process'])
  appendOption('process-queue-every', argv['process-queue-every'])
  appendOption('model', argv['model'])
  appendOption('preview-model', argv['preview-model'])
  appendOption('max-pages', argv['max-pages'])
  appendOption('chunk-pages', argv['chunk-pages'])
  appendOption('concurrency', argv['concurrency'])
  appendOption('resume', argv['resume'])
  appendOption('provider-sort', argv['provider-sort'])
  appendOption('debug-openrouter', argv['debug-openrouter'])

  return normalized
}

function makeDirectCommand(
  definition: DirectDocProcessDefinition
): CommandModule<object, Record<string, unknown>> {
  return {
    command: `${definition.name} [args..]`,
    describe: definition.describe,
    builder: (yargs: Argv<object>) => {
      let configured = buildDocProcessBuilder(yargs)
      for (const example of definition.examples) {
        configured = configured.example(example.command, example.description)
      }
      return configured
    },
    handler: async (argv) => {
      const forwarded = normalizeAliasArgv(argv, definition.name)
      await runDocumentProcessing(forwarded)
    }
  }
}

export const docProcessDirectCommands: CommandModule<object, Record<string, unknown>>[] =
  DOC_PROCESS_DIRECT_DEFINITIONS.map(makeDirectCommand)
