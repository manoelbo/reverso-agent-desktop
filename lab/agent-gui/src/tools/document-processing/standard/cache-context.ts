import { readFile } from 'node:fs/promises'
import type { FileAnnotation, OpenRouterMessage } from '../openrouter-client.js'
import { OpenRouterClient } from '../openrouter-client.js'
import type { OpenRouterUsage } from '../types.js'
import { extractTextFromPdf } from '../pdf-text-extractor.js'

const NATIVE_PDF_PLUGIN = [{ id: 'file-parser', pdf: { engine: 'native' as const } }]
const MAX_INLINE_BASE64_BYTES = 30 * 1024 * 1024
const MAX_EXTRACTED_TEXT_CHARS = 200_000

export interface CacheContext {
  /** Mensagem user original contendo o PDF em base64. */
  pdfUserMessage: OpenRouterMessage
  /** Resposta assistant da Etapa 1, com annotations do PDF parseado. */
  firstAssistantMessage: OpenRouterMessage
  annotations: FileAnnotation[]
  model: string
  sourceFileName: string
}

export interface BuildCacheContextParams {
  pdfPath: string
  sourceFileName: string
  model: string
  systemPrompt: string
  userPrompt: string
  client: OpenRouterClient
  timeoutMs?: number
  onTextDelta?: (chunk: string) => void
}

export interface CacheContextResult {
  ctx: CacheContext
  content: string
  usage: OpenRouterUsage
}

/**
 * Etapa 1: envia o PDF inteiro ao Gemini com engine "native" + prompt inicial.
 * Retorna o CacheContext com o prefixo da conversa para reutilizar nas etapas 2-7.
 *
 * O mecanismo de cache funciona via sticky routing implicito do OpenRouter:
 * ao reenviar o mesmo prefixo (pdfUserMessage + firstAssistantMessage) nas
 * chamadas seguintes, o provider reutiliza o contexto ja processado e aplica
 * desconto automatico nos tokens do prefixo.
 */
export async function buildCacheContext(
  params: BuildCacheContextParams
): Promise<CacheContextResult> {
  const pdfBytes = await readFile(params.pdfPath)
  let pdfUserMessage: OpenRouterMessage
  let result: {
    content: string
    usage: OpenRouterUsage
    annotations: FileAnnotation[]
  }

  if (pdfBytes.byteLength <= MAX_INLINE_BASE64_BYTES) {
    const base64 = pdfBytes.toString('base64')
    const fileData = `data:application/pdf;base64,${base64}`
    pdfUserMessage = {
      role: 'user',
      content: [
        { type: 'text', text: params.userPrompt },
        { type: 'file', file: { filename: params.sourceFileName, file_data: fileData } }
      ]
    }
    const pdfRequest = {
      model: params.model,
      messages: [
        { role: 'system' as const, content: params.systemPrompt },
        pdfUserMessage
      ],
      temperature: 0.1,
      timeoutMs: params.timeoutMs ?? 180_000,
      plugins: NATIVE_PDF_PLUGIN
    }
    if (params.onTextDelta) {
      result = await params.client.chatStreamCached(pdfRequest, params.onTextDelta)
    } else {
      result = await params.client.chatWithPdf(pdfRequest)
    }
  } else {
    const extractedText = await extractTextFromPdf(params.pdfPath)
    const truncatedText =
      extractedText.length > MAX_EXTRACTED_TEXT_CHARS
        ? `${extractedText.slice(0, MAX_EXTRACTED_TEXT_CHARS)}\n\n...(documento truncado para processamento)`
        : extractedText
    pdfUserMessage = {
      role: 'user',
      content: [
        {
          type: 'text',
          text: `${params.userPrompt}\n\n--- DOCUMENT TEXT ---\n\n${truncatedText}`
        }
      ]
    }
    const textRequest = {
      model: params.model,
      messages: [
        { role: 'system' as const, content: params.systemPrompt },
        pdfUserMessage
      ],
      temperature: 0.1,
      timeoutMs: params.timeoutMs ?? 180_000
    }
    if (params.onTextDelta) {
      const streamResult = await params.client.chatStreamMarkdown(textRequest, params.onTextDelta)
      result = { content: streamResult.content, usage: streamResult.usage, annotations: [] }
    } else {
      const markdownResult = await params.client.chatMarkdown(textRequest)
      result = { content: markdownResult.content, usage: markdownResult.usage, annotations: [] }
    }
  }

  const firstAssistantMessage: OpenRouterMessage = {
    role: 'assistant',
    content: result.content,
    annotations: result.annotations
  }

  const ctx: CacheContext = {
    pdfUserMessage,
    firstAssistantMessage,
    annotations: result.annotations,
    model: params.model,
    sourceFileName: params.sourceFileName
  }

  return { ctx, content: result.content, usage: result.usage }
}

/**
 * Monta o array de mensagens para chamadas subsequentes usando o contexto cacheado.
 * O prefixo identico maximiza cache hits implicitos do Gemini no OpenRouter.
 */
export function buildCachedMessages(
  ctx: CacheContext,
  systemPrompt: string,
  newInstruction: string
): OpenRouterMessage[] {
  return [
    { role: 'system', content: systemPrompt },
    ctx.pdfUserMessage,
    ctx.firstAssistantMessage,
    { role: 'user', content: newInstruction }
  ]
}

/**
 * Executa uma chamada usando o contexto cacheado do PDF.
 * Se onTextDelta for fornecido, usa streaming e chama o callback para cada chunk.
 */
export async function callWithCache(
  ctx: CacheContext,
  client: OpenRouterClient,
  systemPrompt: string,
  instruction: string,
  timeoutMs = 120_000,
  maxTokens?: number,
  onTextDelta?: (chunk: string) => void,
): Promise<{ content: string; usage: OpenRouterUsage }> {
  const messages = buildCachedMessages(ctx, systemPrompt, instruction)
  const request = {
    model: ctx.model,
    messages,
    temperature: 0.1,
    timeoutMs,
    ...(typeof maxTokens === 'number' ? { maxTokens } : {}),
  }
  if (onTextDelta) {
    return client.chatStreamCached(request, onTextDelta)
  }
  return client.chatCached(request)
}
