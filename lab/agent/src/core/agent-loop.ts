import type { ToolContext } from '../tools/investigative/context.js'
import { createHash } from 'node:crypto'
import {
  executeToolCall,
  getToolDefinition,
  type ToolCall,
  type ToolResult
} from './tool-registry.js'
import {
  clampConfidence,
  createLoopBudget,
  estimateTokensFromText,
  type LoopBudget,
  type StopReason,
  type VerificationResult
} from './orchestration.js'

export interface AgentLoopStep {
  step: number
  selectedTool: string
  observation: string
  reflectedNextAction: string
  result: ToolResult
  retryCount: number
  durationMs: number
  inputHash: string
}

export interface AgentLoopRun {
  steps: AgentLoopStep[]
  failures: number
  stopReason: StopReason
  budget: LoopBudget
  usage: {
    steps: number
    toolCalls: number
    elapsedMs: number
    estimatedTokens: number
  }
  confidence: number
}

export async function runAgentLoop(args: {
  actions: ToolCall[]
  ctx: ToolContext
  maxSteps?: number
  budget?: Partial<LoopBudget>
  confidenceThreshold?: number
  verifier?: (input: {
    step: number
    action: ToolCall | undefined
    result: ToolResult | undefined
    steps: AgentLoopStep[]
  }) => Promise<VerificationResult> | VerificationResult
  hooks?: {
    onBudgetUpdated?: (input: {
      step: number
      usage: { steps: number; toolCalls: number; elapsedMs: number; estimatedTokens: number }
      budget: LoopBudget
    }) => void
    onVerificationResult?: (input: {
      step: number
      ok: boolean
      confidence: number
      reason: string
      gaps: string[]
    }) => void
    onToolCall?: (input: {
      step: number
      tool: string
      inputSummary: string
    }) => void
    onToolResult?: (input: {
      step: number
      tool: string
      ok: boolean
      outputSummary: string
      durationMs: number
      retryCount: number
      errorCode?: ToolResult['errorCode']
    }) => void
    onStopped?: (input: { step: number; failures: number; stopReason: StopReason }) => void
  }
}): Promise<AgentLoopRun> {
  const budget = createLoopBudget({
    ...(args.budget ?? {}),
    ...(typeof args.maxSteps === 'number' ? { maxSteps: args.maxSteps } : {})
  })
  const confidenceThreshold = clampConfidence(args.confidenceThreshold, 0.75)
  const startedAt = Date.now()
  const steps: AgentLoopStep[] = []
  let toolCalls = 0
  let estimatedTokens = 0
  let stopReason: StopReason = 'insufficient_evidence'
  let confidence = 0
  let repeatedActionCount = 0
  let lastActionKey = ''

  for (let index = 0; index < args.actions.length; index += 1) {
    const elapsedMsBefore = Date.now() - startedAt
    if (steps.length >= budget.maxSteps) {
      stopReason = 'max_steps_reached'
      break
    }
    if (toolCalls >= budget.maxToolCalls) {
      stopReason = 'budget_exceeded'
      break
    }
    if (elapsedMsBefore >= budget.maxElapsedMs) {
      stopReason = 'timeout'
      break
    }
    if (typeof budget.maxTokens === 'number' && estimatedTokens >= budget.maxTokens) {
      stopReason = 'budget_exceeded'
      break
    }

    const action = args.actions[index]
    if (!action) {
      stopReason = 'insufficient_evidence'
      break
    }
    const inputSummary = JSON.stringify(action.input ?? {})
    const inputHash = createHash('sha1').update(inputSummary).digest('hex')
    const actionKey = `${action.tool}:${inputHash}`
    if (actionKey === lastActionKey) {
      repeatedActionCount += 1
    } else {
      repeatedActionCount = 1
      lastActionKey = actionKey
    }
    if (repeatedActionCount >= 3) {
      stopReason = 'no_progress'
      break
    }

    args.hooks?.onToolCall?.({
      step: steps.length + 1,
      tool: action.tool,
      inputSummary: summarizeJson(inputSummary)
    })

    const startedAtMs = Date.now()
    let attempts = 0
    let result: ToolResult
    do {
      attempts += 1
      result = await executeToolCall(action, args.ctx)
    } while (shouldRetryToolCall(action, result, attempts))

    const retryCount = Math.max(0, attempts - 1)
    const durationMs = Date.now() - startedAtMs
    toolCalls += 1
    estimatedTokens += estimateTokensFromText(inputSummary)
    estimatedTokens += estimateTokensFromText(JSON.stringify(result.output ?? result.error ?? ''))

    const observation = result.ok
      ? 'execucao_ok'
      : `erro:${result.errorCode ?? 'unknown'}:${result.error ?? 'desconhecido'}`
    const reflectedNextAction = result.ok ? 'seguir_proxima_tool' : 'seguir_com_resiliencia'

    args.hooks?.onToolResult?.({
      step: steps.length + 1,
      tool: action.tool,
      ok: result.ok,
      outputSummary: summarizeJson(JSON.stringify(result.output ?? result.error ?? '')),
      durationMs,
      retryCount,
      ...(result.errorCode ? { errorCode: result.errorCode } : {})
    })

    steps.push({
      step: steps.length + 1,
      selectedTool: action.tool,
      observation,
      reflectedNextAction,
      result,
      retryCount,
      durationMs,
      inputHash
    })

    const usage = {
      steps: steps.length,
      toolCalls,
      elapsedMs: Date.now() - startedAt,
      estimatedTokens
    }
    args.hooks?.onBudgetUpdated?.({ step: steps.length, usage, budget })

    const verification = args.verifier
      ? await args.verifier({ step: steps.length, action, result, steps })
      : {
          ok: result.ok,
          confidence: result.ok ? 0.8 : 0.4,
          reason: result.ok ? 'progress_observed' : 'tool_error',
          gaps: result.ok ? [] : [result.errorCode ?? 'tool_error']
        }
    confidence = clampConfidence(verification.confidence, confidence)
    args.hooks?.onVerificationResult?.({
      step: steps.length,
      ok: verification.ok,
      confidence,
      reason: verification.reason,
      gaps: verification.gaps
    })

    if (!verification.ok && verification.reason === 'insufficient_evidence') {
      stopReason = 'insufficient_evidence'
      break
    }
    if (!verification.ok && verification.reason === 'tool_error') {
      stopReason = 'tool_error'
      break
    }

    const isLastAction = index === args.actions.length - 1
    if (isLastAction) {
      stopReason = verification.ok ? 'goal_reached' : 'insufficient_evidence'
      break
    }
    if (verification.ok && confidence >= confidenceThreshold) {
      stopReason = 'goal_reached'
      break
    }
  }

  if (steps.length === 0 && args.actions.length === 0) {
    stopReason = 'insufficient_evidence'
  }

  const finalUsage = {
    steps: steps.length,
    toolCalls,
    elapsedMs: Date.now() - startedAt,
    estimatedTokens
  }
  if (finalUsage.steps >= budget.maxSteps && stopReason === 'insufficient_evidence') {
    stopReason = 'max_steps_reached'
  }
  args.hooks?.onStopped?.({
    step: finalUsage.steps,
    failures: steps.filter((step) => !step.result.ok).length,
    stopReason
  })

  return {
    steps,
    failures: steps.filter((step) => !step.result.ok).length,
    stopReason,
    budget,
    usage: finalUsage,
    confidence
  }
}

function shouldRetryToolCall(action: ToolCall, result: ToolResult, attempts: number): boolean {
  if (result.ok) return false
  if (attempts >= 2) return false
  if (result.errorCode !== 'runtime_exception') return false
  const definition = getToolDefinition(action.tool)
  return definition?.sideEffects === 'read_only'
}

function summarizeJson(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return '(empty)'
  if (trimmed.length <= 180) return trimmed
  return `${trimmed.slice(0, 177)}...`
}

