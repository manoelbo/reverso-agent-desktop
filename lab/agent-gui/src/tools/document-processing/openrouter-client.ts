// @ts-nocheck
import type { OpenRouterChatResult, OpenRouterUsage } from './types.js'
import { writeFile } from 'node:fs/promises'

export type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }

export interface FileAnnotation {
  type: 'file'
  file: {
    hash?: string
    name?: string
    content?: ContentPart[]
  }
}

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content:
    | string
    | Array<
        | { type: 'text'; text: string }
        | { type: 'image_url'; image_url: { url: string } }
        | { type: 'file'; file: { filename: string; file_data: string } }
      >
  annotations?: FileAnnotation[]
}

interface OpenRouterRequest {
  model: string
  messages: OpenRouterMessage[]
  temperature?: number
  timeoutMs?: number
  maxTokens?: number
  plugins?: Array<{ id: string; pdf?: { engine: string } }>
  /** OpenRouter provider routing: sort by "latency" | "throughput" | "price". */
  provider?: { sort?: 'latency' | 'throughput' | 'price' }
}

function normalizeUsage(rawUsage: any): OpenRouterUsage {
  return {
    promptTokens: rawUsage?.prompt_tokens,
    completionTokens: rawUsage?.completion_tokens,
    totalTokens: rawUsage?.total_tokens
  }
}

function parseMessageContent(content: unknown): string {
  if (typeof content === 'string') return content.trim()
  if (Array.isArray(content)) {
    return content
      .map((item) => (typeof item?.text === 'string' ? item.text : ''))
      .join('\n')
      .trim()
  }
  return ''
}

function stripCodeFence(markdown: string): string {
  return markdown
    .replace(/^```[a-zA-Z0-9_-]*\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Reduz payload de annotations para debug: substitui base64 de imagens por placeholder. */
function sanitizeMessageForDebug(msg: unknown): unknown {
  if (!msg || typeof msg !== 'object') return msg
  const m = msg as Record<string, unknown>
  const out: Record<string, unknown> = { ...m }
  if (Array.isArray(out.annotations)) {
    out.annotations = (out.annotations as unknown[]).map((ann) => {
      if (!ann || typeof ann !== 'object') return ann
      const a = ann as Record<string, unknown>
      if (a.file && typeof a.file === 'object' && Array.isArray((a.file as Record<string, unknown>).content)) {
        const file = { ...(a.file as Record<string, unknown>) }
        file.content = ((file.content as unknown[]) || []).map((part) => {
          if (part && typeof part === 'object' && (part as Record<string, unknown>).image_url) {
            const p = { ...(part as Record<string, unknown>) }
            const iu = (p.image_url as Record<string, unknown>)?.url
            p.image_url = { url: typeof iu === 'string' ? '[BASE64_IMAGE]' : iu }
            return p
          }
          return part
        })
        return { ...a, file }
      }
      return ann
    })
  }
  return out
}

export interface OpenRouterPdfChatResult {
  content: string
  annotations: FileAnnotation[]
  usage: OpenRouterUsage
  rawModel?: string
}

/**
 * Lê um response SSE do OpenRouter (stream: true), chama onChunk para cada delta
 * de texto, e retorna o conteúdo completo acumulado, usage e annotations (se presentes).
 */
async function readSseStream(
  response: Response,
  onChunk: (text: string) => void,
): Promise<{ content: string; usage: OpenRouterUsage; annotations?: FileAnnotation[] }> {
  const reader = response.body?.getReader()
  if (!reader) throw new Error('Response sem body.')

  const decoder = new TextDecoder()
  let buffer = ''
  let fullContent = ''
  let usage: OpenRouterUsage = {}
  let annotations: FileAnnotation[] | undefined

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const data = trimmed.slice(5).trim()
        if (data === '[DONE]') break

        let parsed: Record<string, unknown>
        try {
          parsed = JSON.parse(data) as Record<string, unknown>
        } catch {
          continue
        }

        // Captura usage do último evento
        if (parsed.usage) {
          usage = normalizeUsage(parsed.usage)
        }

        const choices = parsed.choices as Array<Record<string, unknown>> | undefined
        if (!choices?.length) continue

        const choice = choices[0]

        // Captura annotations do evento final (finish_reason: stop)
        if (choice.finish_reason === 'stop') {
          const msg = choice.message as Record<string, unknown> | undefined
          if (msg && Array.isArray(msg.annotations)) {
            annotations = msg.annotations as FileAnnotation[]
          }
          continue
        }

        const delta = choice.delta as Record<string, unknown> | undefined
        if (!delta) continue

        const chunk = delta.content
        if (typeof chunk === 'string' && chunk.length > 0) {
          fullContent += chunk
          onChunk(chunk)
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  return { content: fullContent, usage, annotations }
}

export class OpenRouterClient {
  constructor(private readonly apiKey: string) {}

  async chatMarkdown(request: OpenRouterRequest, retries = 3): Promise<OpenRouterChatResult> {
    let lastError: Error | undefined
    for (let attempt = 1; attempt <= retries; attempt += 1) {
      const abortController = new AbortController()
      const timeoutMs = request.timeoutMs ?? 90_000
      const timeout = setTimeout(() => abortController.abort(), timeoutMs)
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://reverso.local/examples-lab',
            'X-Title': 'Reverso PDF Lab'
          },
          body: JSON.stringify({
            model: request.model,
            messages: request.messages,
            temperature: request.temperature,
            ...(request.plugins && request.plugins.length > 0 ? { plugins: request.plugins } : {}),
            ...(request.provider?.sort ? { provider: { sort: request.provider.sort } } : {})
          }),
          signal: abortController.signal
        })

        const rawBody = await response.text()
        const json = rawBody ? JSON.parse(rawBody) : null
        if (!response.ok) {
          const errorMessage = json?.error?.message ?? `HTTP ${response.status}`
          throw new Error(`Falha no OpenRouter: ${errorMessage}`)
        }

        const firstChoice = json?.choices?.[0]
        const content = stripCodeFence(parseMessageContent(firstChoice?.message?.content))
        return {
          content,
          usage: normalizeUsage(json?.usage),
          rawModel: json?.model
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          lastError = new Error('Timeout ao chamar OpenRouter.')
        } else {
          lastError = error instanceof Error ? error : new Error(String(error))
        }
        if (attempt < retries) {
          await sleep(800 * attempt)
          continue
        }
      } finally {
        clearTimeout(timeout)
      }
    }

    throw lastError ?? new Error('Falha desconhecida ao chamar OpenRouter.')
  }

  /**
   * Envia PDF para OpenRouter com plugin mistral-ocr (ou outro).
   * Retorna content, annotations (conteúdo parseado do PDF) e usage.
   * Se debugResponsePath for informado, grava a mensagem bruta (sanitizada) nesse arquivo.
   */
  async chatWithPdf(
    request: OpenRouterRequest & {
      plugins: Array<{ id: string; pdf?: { engine: string } }>
      debugResponsePath?: string
    },
    retries = 3
  ): Promise<OpenRouterPdfChatResult> {
    let lastError: Error | undefined
    for (let attempt = 1; attempt <= retries; attempt += 1) {
      const abortController = new AbortController()
      const timeoutMs = request.timeoutMs ?? 120_000
      const timeout = setTimeout(() => abortController.abort(), timeoutMs)
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://reverso.local/examples-lab',
            'X-Title': 'Reverso PDF Lab'
          },
          body: JSON.stringify({
            model: request.model,
            messages: request.messages,
            temperature: request.temperature ?? 0.1,
            ...(request.maxTokens ? { max_tokens: request.maxTokens } : {}),
            plugins: request.plugins,
            ...(request.provider?.sort ? { provider: { sort: request.provider.sort } } : {})
          }),
          signal: abortController.signal
        })

        const rawBody = await response.text()
        const json = rawBody ? JSON.parse(rawBody) : null
        if (!response.ok) {
          const errorMessage = json?.error?.message ?? `HTTP ${response.status}`
          throw new Error(`Falha no OpenRouter: ${errorMessage}`)
        }

        const firstChoice = json?.choices?.[0]
        const msg = firstChoice?.message
        const content = stripCodeFence(parseMessageContent(msg?.content))
        const annotations: FileAnnotation[] = Array.isArray(msg?.annotations) ? msg.annotations : []

        if (request.debugResponsePath) {
          const debugPayload = {
            message: sanitizeMessageForDebug(msg),
            hasAnnotations: Array.isArray(msg?.annotations),
            annotationsLength: msg?.annotations?.length ?? 0,
            usage: json?.usage
          }
          await writeFile(
            request.debugResponsePath,
            JSON.stringify(debugPayload, null, 2),
            'utf8'
          )
        }

        return {
          content,
          annotations,
          usage: normalizeUsage(json?.usage),
          rawModel: json?.model
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          lastError = new Error('Timeout ao chamar OpenRouter.')
        } else {
          lastError = error instanceof Error ? error : new Error(String(error))
        }
        if (attempt < retries) {
          await sleep(1000 * attempt)
          continue
        }
      } finally {
        clearTimeout(timeout)
      }
    }

    throw lastError ?? new Error('Falha desconhecida ao chamar OpenRouter.')
  }

  /**
   * Executa uma chamada com array de mensagens pre-montado (para reutilizar contexto cacheado).
   * Usa chatWithPdf internamente para suportar annotations no assistant message.
   */
  async chatCached(
    request: {
      model: string
      messages: OpenRouterMessage[]
      temperature?: number
      timeoutMs?: number
      maxTokens?: number
    },
    retries = 3
  ): Promise<OpenRouterPdfChatResult> {
    return this.chatWithPdf(
      {
        ...request,
        plugins: [{ id: 'file-parser', pdf: { engine: 'native' } }]
      },
      retries
    )
  }

  /**
   * Versão streaming de chatMarkdown.
   * Lê chunks SSE do OpenRouter e chama onChunk para cada pedaço de texto.
   * Retorna o conteúdo completo acumulado e usage ao final.
   */
  async chatStreamMarkdown(
    request: OpenRouterRequest,
    onChunk: (text: string) => void
  ): Promise<OpenRouterChatResult> {
    const abortController = new AbortController()
    const timeoutMs = request.timeoutMs ?? 90_000
    const timeout = setTimeout(() => abortController.abort(), timeoutMs)

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://reverso.local/examples-lab',
          'X-Title': 'Reverso PDF Lab',
        },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          temperature: request.temperature,
          stream: true,
          ...(request.plugins && request.plugins.length > 0 ? { plugins: request.plugins } : {}),
          ...(request.provider?.sort ? { provider: { sort: request.provider.sort } } : {}),
        }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        const rawBody = await response.text()
        const json = rawBody ? JSON.parse(rawBody) : null
        const errorMessage = json?.error?.message ?? `HTTP ${response.status}`
        throw new Error(`Falha no OpenRouter: ${errorMessage}`)
      }

      const { content, usage } = await readSseStream(response, onChunk)
      return { content: stripCodeFence(content), usage, rawModel: undefined }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Timeout ao chamar OpenRouter.')
      }
      throw error instanceof Error ? error : new Error(String(error))
    } finally {
      clearTimeout(timeout)
    }
  }

  /**
   * Versão streaming de chatCached (steps 2-7 e preview com PDF plugin).
   * Lê chunks SSE do OpenRouter e chama onChunk para cada pedaço de texto.
   * Retorna conteúdo completo, usage e annotations (quando presentes no stream).
   */
  async chatStreamCached(
    request: {
      model: string
      messages: OpenRouterMessage[]
      temperature?: number
      timeoutMs?: number
      maxTokens?: number
      plugins?: Array<{ id: string; pdf?: { engine: string } }>
    },
    onChunk: (text: string) => void
  ): Promise<OpenRouterPdfChatResult> {
    const abortController = new AbortController()
    const timeoutMs = request.timeoutMs ?? 120_000
    const timeout = setTimeout(() => abortController.abort(), timeoutMs)

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://reverso.local/examples-lab',
          'X-Title': 'Reverso PDF Lab',
        },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          temperature: request.temperature ?? 0.1,
          stream: true,
          ...(request.maxTokens ? { max_tokens: request.maxTokens } : {}),
          ...(request.plugins && request.plugins.length > 0 ? { plugins: request.plugins } : {}),
        }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        const rawBody = await response.text()
        const json = rawBody ? JSON.parse(rawBody) : null
        const errorMessage = json?.error?.message ?? `HTTP ${response.status}`
        throw new Error(`Falha no OpenRouter: ${errorMessage}`)
      }

      const { content, usage, annotations } = await readSseStream(response, onChunk)
      return {
        content: stripCodeFence(content),
        usage,
        annotations: annotations ?? [],
        rawModel: undefined,
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Timeout ao chamar OpenRouter.')
      }
      throw error instanceof Error ? error : new Error(String(error))
    } finally {
      clearTimeout(timeout)
    }
  }
}
