// @ts-nocheck
/**
 * CLI com subcomandos: process-all, process-selected, process-queue, queue-status, queue-clear, watch, select, rerun.
 */
import path from 'node:path'
import { runQueue } from './queue-runner.js'
import { runRerun } from './rerun.js'
import { runDeleteSource } from './delete-source.js'
import { watchSource } from './source-watcher.js'
import {
  setSourceSelected,
  loadSourceCheckpoint,
  upsertSourceFileEntries,
  setSourceQueued
} from './source-checkpoint.js'
import { computeDocId, scanSourceFiles, toSourceFileEntries } from './source-indexer.js'
import { parseArtifactLanguage } from '../../core/language.js'
import { resolvePathsFromCwd } from '../../core/paths.js'
import { loadCliEnv } from '../../config/env.js'
import { DEFAULT_FEEDBACK_MODE } from '../../core/feedback.js'
import { printNextCommand } from '../../core/next-command.js'

const SUBCOMMANDS = [
  'process-all',
  'process-selected',
  'process-source',
  'process-queue',
  'queue-status',
  'queue-clear',
  'watch',
  'select',
  'rerun',
  'delete-source'
] as const
const DEFAULT_MODE = 'standard'
const DEFAULT_MODEL_STANDARD = 'google/gemini-2.0-flash-lite-001'
const DEFAULT_MODEL_DEEP = 'openai/gpt-5-nano'
const DEFAULT_MODEL = DEFAULT_MODEL_STANDARD
const DEFAULT_PREVIEW_MODEL = 'google/gemini-2.5-flash'
const DEFAULT_CHUNK_PAGES = 5
const DEFAULT_CONCURRENCY = 15
function getFeedbackMode(
  args: Record<string, string>,
  _processingMode: 'standard' | 'deep'
): 'visual' | 'compact' | 'plain' | undefined {
  const explicit =
    args.feedback === 'visual' || args.feedback === 'compact' || args.feedback === 'plain'
      ? args.feedback
      : undefined
  if (explicit) return explicit
  return DEFAULT_FEEDBACK_MODE
}

function parseKeyValueArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {}
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (!token.startsWith('--')) continue
    const key = token.slice(2).replace(/-/g, '')
    const value = argv[i + 1]
    if (!value || value.startsWith('--')) {
      args[key] = 'true'
      continue
    }
    args[key] = value
    i += 1
  }
  return args
}

function parsePdfList(raw: string | undefined): string[] {
  if (!raw) return []
  const trimmed = raw.trim()
  if (!trimmed) return []
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (!Array.isArray(parsed)) {
        throw new Error('`--files` em JSON precisa ser um array.')
      }
      const normalized = parsed
        .map((item) => String(item).trim())
        .filter((item) => item.length > 0)
      return Array.from(new Set(normalized))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Não foi possível interpretar --files como JSON array: ${message}`)
    }
  }
  return Array.from(
    new Set(
      trimmed
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    )
  )
}

function resolveApiKey(cwd: string): string {
  loadCliEnv(cwd)
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error(
      'OPENROUTER_API_KEY not found. Set it in your shell, ~/.reverso/.env, ./.env or ./.env.local.'
    )
  }
  return apiKey
}

export function isSourceSubcommand(argv: string[]): boolean {
  const first = argv[0]
  return SUBCOMMANDS.some((c) => c === first)
}

export async function runCli(argv: string[]): Promise<boolean> {
  const sub = argv[0]
  if (!SUBCOMMANDS.includes(sub as (typeof SUBCOMMANDS)[number])) {
    return false
  }
  const rest = argv.slice(1)
  const args = parseKeyValueArgs(rest)
  const cwd = process.cwd()
  const resolvedPaths = await resolvePathsFromCwd({
    cwd,
    ...(args.filesystem ? { filesystem: args.filesystem } : {})
  })
  const sourceDir = args.source ? path.resolve(cwd, args.source) : resolvedPaths.sourceDir

  if (sub === 'process-all' || sub === 'process-selected' || sub === 'process-queue') {
    const apiKey = resolveApiKey(cwd)
    const queueMode = sub === 'process-all' ? 'all' : sub === 'process-selected' ? 'selected' : 'queue'
    if (sub === 'process-selected' && args.files) {
      const requestedFiles = parsePdfList(args.files)
      if (requestedFiles.length === 0) {
        throw new Error(
          'process-selected com --files exige pelo menos um PDF (CSV ou JSON array).'
        )
      }
      let checkpoint = await loadSourceCheckpoint(sourceDir)
      const scanned = await scanSourceFiles(sourceDir)
      const existingByDocId = checkpoint?.files
        ? new Map(checkpoint.files.map((f) => [f.docId, f]))
        : undefined
      const entries = toSourceFileEntries(scanned, existingByDocId)
      checkpoint = await upsertSourceFileEntries(sourceDir, entries)
      const pdfEntries = checkpoint.files.filter((f) => f.fileType === 'pdf')
      if (pdfEntries.length === 0) {
        throw new Error('Nenhum PDF encontrado para process-selected.')
      }
      const byName = new Map(pdfEntries.map((f) => [f.originalFileName, f]))
      const missing = requestedFiles.filter((name) => !byName.has(name))
      if (missing.length > 0) {
        throw new Error(
          `PDF(s) não encontrado(s) em source: ${missing.join(', ')}.`
        )
      }
      const allPdfDocIds = pdfEntries.map((f) => f.docId)
      const selectedDocIds = requestedFiles.map((name) => byName.get(name)!.docId)
      // Seleção estrita: desmarca todos os PDFs e marca apenas a lista explícita.
      await setSourceSelected(sourceDir, allPdfDocIds, false)
      await setSourceSelected(sourceDir, selectedDocIds, true)
    }
    const processingMode = args.mode === 'deep' ? 'deep' : 'standard'
    const defaultModel = processingMode === 'deep' ? DEFAULT_MODEL_DEEP : DEFAULT_MODEL_STANDARD
    const artifactLanguage = parseArtifactLanguage(args['artifactlanguage']) ?? 'source'
    await runQueue({
      sourceDir,
      mode: queueMode,
      processingMode,
      apiKey,
      model: args.model ?? defaultModel,
      previewModel: args['previewmodel'] ?? DEFAULT_PREVIEW_MODEL,
      maxPages: args['maxpages'] ? Number(args['maxpages']) : undefined,
      chunkPages: Number(args['chunkpages'] ?? DEFAULT_CHUNK_PAGES),
      concurrency: Number(args.concurrency ?? DEFAULT_CONCURRENCY),
      resume: args.resume !== 'false' && args.resume !== '0',
      providerSort:
        args['providersort'] === 'latency' ||
        args['providersort'] === 'throughput' ||
        args['providersort'] === 'price'
          ? args['providersort']
          : undefined,
      debugOpenRouter: args['debugopenrouter'] === 'true' || args['debugopenrouter'] === '1'
      ,
      feedbackMode: getFeedbackMode(args, processingMode),
      artifactLanguage
    })
    if (sub === 'process-all' || sub === 'process-queue') {
      printNextCommand({
        command: 'reverso init',
        description: 'Update investigation context after processing sources.'
      })
    }
    return true
  }

  if (sub === 'process-source') {
    const apiKey = resolveApiKey(cwd)
    const processingMode = args.mode === 'deep' ? 'deep' : 'standard'
    const defaultModel = processingMode === 'deep' ? DEFAULT_MODEL_DEEP : DEFAULT_MODEL_STANDARD
    const artifactLanguage = parseArtifactLanguage(args['artifactlanguage']) ?? 'source'
    const inputPath = args.file ?? args.input ?? args.inputpath
    if (!inputPath) {
      throw new Error('process-source exige --file "nome.pdf".')
    }
    await runRerun({
      sourceDir,
      mode: processingMode,
      all: false,
      inputPath,
      apiKey,
      model: args.model ?? defaultModel,
      previewModel: args['previewmodel'] ?? DEFAULT_PREVIEW_MODEL,
      maxPages: args['maxpages'] ? Number(args['maxpages']) : undefined,
      chunkPages: Number(args['chunkpages'] ?? DEFAULT_CHUNK_PAGES),
      concurrency: Number(args.concurrency ?? DEFAULT_CONCURRENCY),
      resume: args.resume !== 'false' && args.resume !== '0',
      providerSort:
        args['providersort'] === 'latency' ||
        args['providersort'] === 'throughput' ||
        args['providersort'] === 'price'
          ? args['providersort']
          : undefined,
      debugOpenRouter: args['debugopenrouter'] === 'true' || args['debugopenrouter'] === '1',
      feedbackMode: getFeedbackMode(args, processingMode),
      artifactLanguage
    })
    printNextCommand({
      command: 'reverso init',
      description: 'Update investigation context after single source processing.'
    })
    return true
  }

  if (sub === 'rerun') {
    const apiKey = resolveApiKey(cwd)
    const processingMode = args.mode === 'deep' ? 'deep' : 'standard'
    const defaultModel = processingMode === 'deep' ? DEFAULT_MODEL_DEEP : DEFAULT_MODEL_STANDARD
    const artifactLanguage = parseArtifactLanguage(args['artifactlanguage']) ?? 'source'
    const inputPath = args.input ?? args.inputpath
    const all = args.all === 'true' || args.all === '1' || !inputPath
    await runRerun({
      sourceDir,
      mode: processingMode,
      all,
      inputPath,
      apiKey,
      model: args.model ?? defaultModel,
      previewModel: args['previewmodel'] ?? DEFAULT_PREVIEW_MODEL,
      maxPages: args['maxpages'] ? Number(args['maxpages']) : undefined,
      chunkPages: Number(args['chunkpages'] ?? DEFAULT_CHUNK_PAGES),
      concurrency: Number(args.concurrency ?? DEFAULT_CONCURRENCY),
      resume: args.resume !== 'false' && args.resume !== '0',
      providerSort:
        args['providersort'] === 'latency' ||
        args['providersort'] === 'throughput' ||
        args['providersort'] === 'price'
          ? args['providersort']
          : undefined,
      debugOpenRouter: args['debugopenrouter'] === 'true' || args['debugopenrouter'] === '1',
      feedbackMode: getFeedbackMode(args, processingMode),
      artifactLanguage
    })
    printNextCommand({
      command: 'reverso init',
      description: 'Update investigation context after document rerun.'
    })
    return true
  }

  if (sub === 'queue-status') {
    let checkpoint = await loadSourceCheckpoint(sourceDir)
    const scanned = await scanSourceFiles(sourceDir)
    const existingByDocId = checkpoint?.files
      ? new Map(checkpoint.files.map((f) => [f.docId, f]))
      : undefined
    const entries = toSourceFileEntries(scanned, existingByDocId)
    checkpoint = await upsertSourceFileEntries(sourceDir, entries)
    const pending = checkpoint.files.filter((f) => f.queuedAt != null && f.status !== 'done')
    if (pending.length === 0) {
      console.log('No documents in queue (queued and not completed).')
      return true
    }
    console.log(`Queue: ${pending.length} pending document(s)\n`)
    for (const f of pending) {
      const err = f.lastError ? ` — ${f.lastError}` : ''
      console.log(`  ${f.originalFileName} (${f.docId}) — ${f.status}${err}`)
    }
    return true
  }

  if (sub === 'queue-clear') {
    let checkpoint = await loadSourceCheckpoint(sourceDir)
    const scanned = await scanSourceFiles(sourceDir)
    const existingByDocId = checkpoint?.files
      ? new Map(checkpoint.files.map((f) => [f.docId, f]))
      : undefined
    const entries = toSourceFileEntries(scanned, existingByDocId)
    checkpoint = await upsertSourceFileEntries(sourceDir, entries)
    const filesRaw = args.files
    let docIdsToClear: string[]
    if (filesRaw) {
      const names = new Set(filesRaw.split(',').map((s) => s.trim()))
      docIdsToClear = checkpoint.files
        .filter((f) => names.has(f.originalFileName))
        .map((f) => f.docId)
    } else {
      docIdsToClear = checkpoint.files.filter((f) => f.queuedAt != null).map((f) => f.docId)
    }
    if (docIdsToClear.length === 0) {
      console.log('No documents to remove from queue.')
      return true
    }
    await setSourceQueued(sourceDir, docIdsToClear, null)
    console.log(`${docIdsToClear.length} document(s) removed from queue.`)
    return true
  }

  if (sub === 'watch') {
    const autoProcess =
      args['autoprocess'] === 'all'
        ? 'all'
        : args['autoprocess'] === 'selected'
          ? 'selected'
          : 'none'
    const processQueueEverySec = args['processqueueevery'] ? Number(args['processqueueevery']) : 0
    const stop = watchSource({
      sourceDir,
      autoProcess,
      onCheckpointUpdated: () => {
        console.log('Checkpoint updated.')
      }
    })
    let queueInterval: ReturnType<typeof setInterval> | null = null
    if (processQueueEverySec > 0) {
      let queueRunning = false
      const watchProcessingMode = args.mode === 'deep' ? 'deep' : 'standard'
      const watchDefaultModel = watchProcessingMode === 'deep' ? DEFAULT_MODEL_DEEP : DEFAULT_MODEL_STANDARD
      const artifactLanguage = parseArtifactLanguage(args['artifactlanguage']) ?? 'source'
      const runProcessQueue = (): void => {
        if (queueRunning) return
        queueRunning = true
        runQueue({
          sourceDir,
          mode: 'queue',
          processingMode: watchProcessingMode,
          apiKey: resolveApiKey(cwd),
          model: args.model ?? watchDefaultModel,
          previewModel: args['previewmodel'] ?? DEFAULT_PREVIEW_MODEL,
          maxPages: args['maxpages'] ? Number(args['maxpages']) : undefined,
          chunkPages: Number(args['chunkpages'] ?? DEFAULT_CHUNK_PAGES),
          concurrency: Number(args.concurrency ?? DEFAULT_CONCURRENCY),
          resume: args.resume !== 'false' && args.resume !== '0',
          providerSort:
            args['providersort'] === 'latency' ||
            args['providersort'] === 'throughput' ||
            args['providersort'] === 'price'
              ? args['providersort']
              : undefined,
          debugOpenRouter: args['debugopenrouter'] === 'true' || args['debugopenrouter'] === '1'
          ,
          feedbackMode: getFeedbackMode(args, watchProcessingMode),
          artifactLanguage
        })
          .catch((err) => console.error('process-queue (watch):', err))
          .finally(() => {
            queueRunning = false
          })
      }
      queueInterval = setInterval(runProcessQueue, processQueueEverySec * 1000)
      console.log(`process-queue every ${processQueueEverySec}s`)
    }
    console.log(`Watching ${sourceDir}. Press Ctrl+C to stop.`)
    process.on('SIGINT', () => {
      if (queueInterval) clearInterval(queueInterval)
      stop()
      process.exit(0)
    })
    return new Promise<boolean>(() => {})
  }

  if (sub === 'select') {
    const filesRaw = args.files
    const value = args.value === 'true' || args.value === '1'
    if (!filesRaw) {
      throw new Error('select exige --files "a.pdf,b.pdf" e --value true|false')
    }
    const names = filesRaw.split(',').map((s) => s.trim())
    let checkpoint = await loadSourceCheckpoint(sourceDir)
    const scanned = await scanSourceFiles(sourceDir)
    const existingByDocId = checkpoint?.files
      ? new Map(checkpoint.files.map((f) => [f.docId, f]))
      : undefined
    const entries = toSourceFileEntries(scanned, existingByDocId)
    checkpoint = await upsertSourceFileEntries(sourceDir, entries)
    const docIds = names.map((name) => computeDocId(name))
    const existingDocIds = checkpoint.files.map((f) => f.docId)
    const toSet = docIds.filter((id) => existingDocIds.includes(id))
    if (toSet.length === 0) {
      console.log('No checkpoint files match the provided list.')
      return true
    }
    await setSourceSelected(sourceDir, toSet, value)
    console.log(`Selection updated: ${toSet.length} file(s) -> ${value}`)
    return true
  }

  if (sub === 'delete-source') {
    const targetFile = args.file ?? args.input ?? args.inputpath
    if (!targetFile) {
      throw new Error('delete-source exige --file "nome.pdf".')
    }
    const result = await runDeleteSource({
      sourceDir,
      filesystemRoot: resolvedPaths.filesystemDir,
      fileName: targetFile
    })
    console.log(
      `delete-source concluído: ${targetFile} removido; ${result.updatedFiles} arquivo(s) atualizado(s), ${result.replacements} substituição(ões).`
    )
    return true
  }

  return false
}
