export const AGENT_CLI_CHANNELS = {
  run: 'agent-cli:run',
  stop: 'agent-cli:stop',
  event: 'agent-cli:event',
} as const

export type AgentCliAllowedCommand =
  | 'help'
  | 'process'
  | 'process-all'
  | 'process-selected'
  | 'process-queue'
  | 'rerun'
  | 'queue-status'
  | 'queue-clear'
  | 'init'
  | 'dig'
  | 'deep-dive'
  | 'create-lead'
  | 'inquiry'
  | 'inquiry-all'

export type AgentCliRunRequest = {
  runId: string
  command: AgentCliAllowedCommand
  rawInput: string
  args: string[]
  cwd?: string
}

export type AgentCliRunResponse = {
  accepted: boolean
}

export type AgentCliStopRequest = {
  runId: string
}

export type AgentCliStopResponse = {
  stopped: boolean
}

export type AgentCliEvent =
  | {
      type: 'started'
      runId: string
      pid: number | undefined
      commandLine: string
      ts: string
    }
  | {
      type: 'stdout'
      runId: string
      chunk: string
      ts: string
    }
  | {
      type: 'stderr'
      runId: string
      chunk: string
      ts: string
    }
  | {
      type: 'error'
      runId: string
      message: string
      ts: string
    }
  | {
      type: 'exit'
      runId: string
      code: number | null
      signal: string | null
      ts: string
    }

export interface AgentCliApi {
  run: (request: AgentCliRunRequest) => Promise<AgentCliRunResponse>
  stop: (request: AgentCliStopRequest) => Promise<AgentCliStopResponse>
  subscribeEvents: (listener: (event: AgentCliEvent) => void) => () => void
}
