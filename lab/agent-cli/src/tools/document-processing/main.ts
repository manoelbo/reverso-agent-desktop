// @ts-nocheck
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { resolveLabConfig } from './config.js'
import { processSingleDocument } from './pipeline.js'
import { runStandardDossierFromReplica, runStandardProcess } from './standard/pipeline.js'
import { resolvePathsFromCwd } from '../../core/paths.js'
import { isSourceSubcommand, runCli } from './cli.js'
import type { RunReport } from './types.js'
import { createFeedbackController } from '../../cli/renderer.js'
import { DEFAULT_FEEDBACK_MODE } from '../../core/feedback.js'
import { mergeUsage } from './lib/merge-usage.js'

async function runLegacy(argv: string[]): Promise<void> {
  const startedAt = new Date()
  const config = await resolveLabConfig(argv)

  if (config.mode === 'standard') {
    // Standard Process: envia PDF inteiro ao Gemini com cache entre etapas
    let labPaths = null
    try {
      labPaths = await resolvePathsFromCwd()
    } catch {}

    const filesystemDir = labPaths?.filesystemDir ?? path.dirname(config.outputDir)
    const investigationDir = labPaths?.investigationDir ?? path.join(filesystemDir, 'investigation')
    const dossierDir = labPaths?.dossierDir ?? path.join(filesystemDir, 'dossier')

    const feedback = await createFeedbackController({
      mode: DEFAULT_FEEDBACK_MODE,
      eventsDir: path.join(filesystemDir, 'events'),
      sessionName: 'doc-process-standard'
    })
    feedback.systemInfo(`Standard Process: ${config.inputPdfPath}`)

    const result = await runStandardProcess({
      pdfPath: config.inputPdfPath,
      artifactDir: config.outputDir,
      dossierPeopleDir: labPaths?.dossierPeopleDir ?? path.join(dossierDir, 'people'),
      dossierGroupsDir: labPaths?.dossierGroupsDir ?? path.join(dossierDir, 'groups'),
      dossierPlacesDir: labPaths?.dossierPlacesDir ?? path.join(dossierDir, 'places'),
      dossierTimelineDir: labPaths?.dossierTimelineDir ?? path.join(dossierDir, 'timeline'),
      apiKey: config.apiKey,
      model: config.model,
          artifactLanguage: config.artifactLanguage ?? 'source',
      resume: config.resume,
      onStepStart: (step) => feedback.stepStart(step, `[${step}]`, 'iniciando'),
      onStepDone: (step) => feedback.stepComplete(step, 'concluído'),
      onStepError: (step, err) => feedback.stepError(step, err.message),
      onInfo: (message) => feedback.systemInfo(message)
    })
    feedback.summary('Standard Process concluído', [
      `Arquivo: ${config.inputPdfPath}`,
      `Usage: ${JSON.stringify(result.usage)}`
    ])
    await feedback.flush()
    return
  }

  // Deep Process (modo legado): Mistral OCR -> replica.md
  const partial = await processSingleDocument({
    apiKey: config.apiKey,
    pdfPath: config.inputPdfPath,
    outputDir: config.outputDir,
    chunksDir: config.chunksDir,
    checkpointPath: config.checkpointPath,
    replicaPath: config.replicaPath,
    previewPath: config.previewPath,
    metadataPath: config.metadataPath,
    reportPath: config.reportPath,
    model: config.model,
    previewModel: config.previewModel,
    artifactLanguage: config.artifactLanguage ?? 'source',
    maxPages: config.maxPages,
    chunkPages: config.chunkPages,
    concurrency: config.concurrency,
    resume: config.resume,
    providerSort: config.providerSort,
    debugOpenRouter: config.debugOpenRouter
  })
  let labPaths = null
  try {
    labPaths = await resolvePathsFromCwd()
  } catch {}
  const filesystemDir = labPaths?.filesystemDir ?? path.dirname(config.outputDir)
  const dossierDir = labPaths?.dossierDir ?? path.join(filesystemDir, 'dossier')
  const replicaMarkdown = await readFile(config.replicaPath, 'utf8')
  const dossierResult = await runStandardDossierFromReplica({
    replicaMarkdown,
    sourceFileName: path.basename(config.inputPdfPath),
    artifactDir: config.outputDir,
    dossierPeopleDir: labPaths?.dossierPeopleDir ?? path.join(dossierDir, 'people'),
    dossierGroupsDir: labPaths?.dossierGroupsDir ?? path.join(dossierDir, 'groups'),
    dossierPlacesDir: labPaths?.dossierPlacesDir ?? path.join(dossierDir, 'places'),
    dossierTimelineDir: labPaths?.dossierTimelineDir ?? path.join(dossierDir, 'timeline'),
    apiKey: config.apiKey,
    model: config.model,
    artifactLanguage: config.artifactLanguage ?? 'source'
  })

  const report: RunReport = {
    ...partial,
    usage: mergeUsage([partial.usage, dossierResult.usage]),
    startedAt: startedAt.toISOString(),
    finishedAt: new Date().toISOString(),
    elapsedMs: new Date().getTime() - startedAt.getTime()
  }

  await writeFile(config.reportPath, JSON.stringify(report, null, 2), 'utf8')
  const feedback = await createFeedbackController({
    mode: DEFAULT_FEEDBACK_MODE,
    eventsDir: path.join(path.dirname(config.outputDir), 'events'),
    sessionName: 'doc-process-deep'
  })
  feedback.systemInfo(`Relatório gerado: ${config.reportPath}`)
  await feedback.flush()
}

export async function runDocumentProcessingCommand(argv: string[]): Promise<void> {
  if (isSourceSubcommand(argv)) {
    const handled = await runCli(argv)
    if (handled) return
  }
  await runLegacy(argv)
}
