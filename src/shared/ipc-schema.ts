export type AgentStepStatus = 'pending' | 'in_progress' | 'completed' | 'blocked'
export type AgentFileChangeType = 'new' | 'edited' | 'deleted'

export type AgentSessionEvent =
  | {
      type: 'agent_step'
      label: string
      status: AgentStepStatus
      details?: string
      ts: string
      seq: number
    }
  | {
      type: 'assistant_text_delta'
      text: string
      ts: string
      seq: number
    }
  | {
      type: 'tool_call'
      tool: string
      inputSummary?: string
      ts: string
      seq: number
    }
  | {
      type: 'tool_result'
      tool: string
      status: 'success' | 'error'
      outputSummary?: string
      ts: string
      seq: number
    }
  | {
      type: 'file_change'
      path: string
      changeType: AgentFileChangeType
      addedLines?: number
      removedLines?: number
      preview?: string
      ts: string
      seq: number
    }
  | {
      type: 'system_event'
      level: 'info' | 'warning' | 'error'
      message: string
      ts: string
      seq: number
    }
  | {
      type: 'final_summary'
      title: string
      lines: string[]
      ts: string
      seq: number
    }

export interface AgentSessionStreamPayload {
  sessionId: string
  source: 'lab-cli' | 'electron-renderer' | 'electron-main'
  events: AgentSessionEvent[]
}

export * from './workspace-markdown'

