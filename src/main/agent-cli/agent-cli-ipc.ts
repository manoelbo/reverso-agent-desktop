import { ipcMain, type BrowserWindow } from 'electron'
import { execa, type Subprocess } from 'execa'
import path from 'node:path'
import {
  AGENT_CLI_CHANNELS,
  type AgentCliAllowedCommand,
  type AgentCliEvent,
  type AgentCliRunRequest,
  type AgentCliRunResponse,
  type AgentCliStopRequest,
  type AgentCliStopResponse,
} from '../../shared/agent-cli-ipc'
import { resetRunningSourceStatuses, resolveSourcesRootPath } from '../workspace/source-index'

type RunningProcess = {
  process: Subprocess
  commandLine: string
  command: AgentCliAllowedCommand
}

const runningByRunId = new Map<string, RunningProcess>()
const stoppedByUserRunIds = new Set<string>()

const DOC_PROCESS_COMMANDS: AgentCliAllowedCommand[] = [
  'process',
  'process-all',
  'process-selected',
  'process-queue',
  'rerun',
  'queue-status',
  'queue-clear',
]

function isAllowedCommand(command: string): command is AgentCliAllowedCommand {
  return [
    'help',
    'process',
    ...DOC_PROCESS_COMMANDS,
    'init',
    'dig',
    'deep-dive',
    'create-lead',
    'inquiry',
    'inquiry-all',
  ].includes(command as AgentCliAllowedCommand)
}

function buildCliArgs(command: AgentCliAllowedCommand, args: string[]): string[] {
  if (command === 'help') {
    return ['--help', ...args]
  }
  return [command, ...args]
}

function emit(mainWindow: BrowserWindow, event: AgentCliEvent): void {
  if (mainWindow.isDestroyed()) return
  mainWindow.webContents.send(AGENT_CLI_CHANNELS.event, event)
}

function now(): string {
  return new Date().toISOString()
}

function getWorkspaceRoot(): string {
  return path.resolve(__dirname, '../../..')
}

function getFilesystemRoot(): string {
  return path.dirname(resolveSourcesRootPath())
}

function withFilesystemArg(args: string[], filesystemRoot: string): string[] {
  const hasFilesystemArg = args.includes('--filesystem')
  if (hasFilesystemArg) {
    return args
  }
  return [...args, '--filesystem', filesystemRoot]
}

export function registerAgentCliIpc(mainWindow: BrowserWindow): () => void {
  ipcMain.handle(
    AGENT_CLI_CHANNELS.run,
    async (_event, request: AgentCliRunRequest): Promise<AgentCliRunResponse> => {
      const { runId, command, rawInput } = request
      const rawArgs = Array.isArray(request.args) ? request.args : []
      const filesystemRoot = getFilesystemRoot()
      const cwd =
        typeof request.cwd === 'string' && request.cwd.length > 0 ? path.resolve(request.cwd) : filesystemRoot

      if (!runId || typeof runId !== 'string') {
        throw new Error('runId invalido.')
      }
      if (!isAllowedCommand(command)) {
        throw new Error(`Comando nao permitido: ${command}`)
      }
      if (runningByRunId.has(runId)) {
        throw new Error('Ja existe uma execucao ativa com este runId.')
      }

      const cliArgs = withFilesystemArg(buildCliArgs(command, rawArgs), filesystemRoot)
      const commandLine = ['reverso', ...cliArgs].join(' ')
      const subprocess = execa('reverso', cliArgs, {
        cwd,
        env: {
          ...process.env,
          FORCE_COLOR: '1',
          REVERSO_FILESYSTEM: filesystemRoot,
        },
      })

      runningByRunId.set(runId, {
        process: subprocess,
        commandLine,
        command,
      })

      emit(mainWindow, {
        type: 'started',
        runId,
        pid: subprocess.pid,
        commandLine: rawInput?.trim().length ? `${rawInput}\n$ ${commandLine}` : `$ ${commandLine}`,
        ts: now(),
      })

      subprocess.stdout?.on('data', (chunk) => {
        emit(mainWindow, {
          type: 'stdout',
          runId,
          chunk: String(chunk),
          ts: now(),
        })
      })

      subprocess.stderr?.on('data', (chunk) => {
        emit(mainWindow, {
          type: 'stderr',
          runId,
          chunk: String(chunk),
          ts: now(),
        })
      })

      subprocess.on('error', (error) => {
        emit(mainWindow, {
          type: 'error',
          runId,
          message: error.message,
          ts: now(),
        })
      })

      subprocess.on('close', (code, signal) => {
        runningByRunId.delete(runId)
        if (stoppedByUserRunIds.has(runId) && DOC_PROCESS_COMMANDS.includes(command)) {
          stoppedByUserRunIds.delete(runId)
          void resetRunningSourceStatuses('Interrupted by user (Stop).')
        }
        emit(mainWindow, {
          type: 'exit',
          runId,
          code,
          signal,
          ts: now(),
        })
      })

      return { accepted: true }
    }
  )

  ipcMain.handle(
    AGENT_CLI_CHANNELS.stop,
    async (_event, request: AgentCliStopRequest): Promise<AgentCliStopResponse> => {
      const running = runningByRunId.get(request.runId)
      if (!running) {
        return { stopped: false }
      }

      if (DOC_PROCESS_COMMANDS.includes(running.command)) {
        try {
          await resetRunningSourceStatuses('Interrupted by user (Stop).')
          stoppedByUserRunIds.add(request.runId)
        } catch {
          // Best-effort checkpoint reconciliation on stop.
        }
      }

      running.process.kill('SIGINT')
      return { stopped: true }
    }
  )

  return () => {
    runningByRunId.forEach((running, runId) => {
      running.process.kill('SIGTERM')
      runningByRunId.delete(runId)
    })
    ipcMain.removeHandler(AGENT_CLI_CHANNELS.run)
    ipcMain.removeHandler(AGENT_CLI_CHANNELS.stop)
  }
}
