import type {
  AgentCliApi,
  AgentCliEvent,
  AgentCliRunRequest,
  AgentCliRunResponse,
  AgentCliStopRequest,
  AgentCliStopResponse,
} from '../../../../../shared/agent-cli-ipc'

type WorkspaceApiShape = {
  agentCli?: AgentCliApi
}

function getWorkspaceApi(): WorkspaceApiShape | null {
  if (typeof window === 'undefined') return null
  return (window as { api?: WorkspaceApiShape }).api ?? null
}

export function isAgentCliApiAvailable(): boolean {
  const api = getWorkspaceApi()?.agentCli
  return Boolean(api)
}

export async function runAgentCli(request: AgentCliRunRequest): Promise<AgentCliRunResponse> {
  const api = getWorkspaceApi()?.agentCli
  if (!api) {
    throw new Error('Agent CLI API indisponivel.')
  }
  return api.run(request)
}

export async function stopAgentCli(request: AgentCliStopRequest): Promise<AgentCliStopResponse> {
  const api = getWorkspaceApi()?.agentCli
  if (!api) {
    throw new Error('Agent CLI API indisponivel.')
  }
  return api.stop(request)
}

export function subscribeAgentCliEvents(listener: (event: AgentCliEvent) => void): () => void {
  const api = getWorkspaceApi()?.agentCli
  if (!api) {
    return () => undefined
  }
  return api.subscribeEvents(listener)
}
