"use client"

import { useEffect, useMemo, useRef, useState, type JSX } from "react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import {
  CancelCircleIcon,
  PlayIcon,
} from "@hugeicons/core-free-icons"

import {
  subscribeAgentCliEvents,
  isAgentCliApiAvailable,
  runAgentCli,
  stopAgentCli,
} from "@/components/app/agent-cli/client"
import type { AgentCliAllowedCommand } from "../../../../shared/agent-cli-ipc"
import {
  Terminal,
  TerminalContent,
  TerminalHeader,
  TerminalStatus,
  TerminalTitle,
} from "@/components/ai-elements/terminal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type ChatPanelProps = {
  title?: string
  subtitle?: string
  widthClassName?: string
  initialCommand?: string
  commandDraft?: string | null
  commandDraftVersion?: number
}

const DEFAULT_PANEL_WIDTH = 600
const MIN_PANEL_WIDTH = 360
const MAX_PANEL_WIDTH = 1100

const ALLOWED_COMMANDS: AgentCliAllowedCommand[] = [
  "help",
  "process",
  "process-all",
  "process-selected",
  "process-queue",
  "queue-status",
  "queue-clear",
  "rerun",
  "init",
  "dig",
  "deep-dive",
  "create-lead",
  "inquiry",
  "inquiry-all",
]

type ParsedCommand =
  | {
      ok: true
      command: AgentCliAllowedCommand
      args: string[]
    }
  | {
      ok: false
      reason: string
    }

type RunStatus = "idle" | "running" | "stopping" | "done" | "error"

const ANSI = {
  reset: "\u001b[0m",
  dim: "\u001b[2m",
  cyan: "\u001b[36m",
  yellow: "\u001b[33m",
  red: "\u001b[31m",
  green: "\u001b[32m",
} as const

function colorize(text: string, color: string): string {
  return `${color}${text}${ANSI.reset}`
}

function formatExitLine(code: number | null, signal: string | null): string {
  const label = `[exit] code=${code ?? "null"} signal=${signal ?? "none"}`
  if (code === 0) return colorize(label, ANSI.green)
  return colorize(label, ANSI.yellow)
}

function tokenize(value: string): string[] {
  const matches = value.match(/"[^"]*"|'[^']*'|\S+/g) ?? []
  return matches.map((token) => token.replace(/^["']|["']$/g, ""))
}

function normalizeCommandAliasAndArgs(command: string, args: string[]): { command: string; args: string[] } {
  const aliasedCommand = command === "rerun-all" ? "rerun" : command === "deep-dive" ? "dig" : command
  const supportsModeShortcut =
    aliasedCommand === "process" ||
    aliasedCommand === "process-all" ||
    aliasedCommand === "process-selected" ||
    aliasedCommand === "rerun"
  const nextArgs: string[] = []

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index]
    if (supportsModeShortcut && token === "--deep") {
      nextArgs.push("--mode", "deep")
      continue
    }
    if (supportsModeShortcut && token === "--standard") {
      nextArgs.push("--mode", "standard")
      continue
    }
    nextArgs.push(token)
  }

  if (command === "rerun-all" && !nextArgs.includes("--all")) {
    nextArgs.unshift("--all")
  }

  return { command: aliasedCommand, args: nextArgs }
}

function parseCommandInput(value: string): ParsedCommand {
  const trimmed = value.trim()
  if (!trimmed.length) {
    return { ok: false, reason: "Type a command to run." }
  }

  const tokens = tokenize(trimmed)
  const first = tokens[0]
  if (!first?.startsWith("/")) {
    return { ok: false, reason: "Use /command format (e.g. /process-all)." }
  }

  const commandToken = first.slice(1)
  const rawArgs = tokens.slice(1)
  const normalizedInput = normalizeCommandAliasAndArgs(commandToken, rawArgs)
  const normalizedCommand = normalizedInput.command as AgentCliAllowedCommand
  const isAllowed = ALLOWED_COMMANDS.includes(normalizedCommand)
  if (!isAllowed) {
    return { ok: false, reason: `Command not allowed: ${normalizedCommand}` }
  }

  const mentions = normalizedInput.args.filter((token) => token.startsWith("@")).map((token) => token.slice(1))
  const argsWithoutMentions = normalizedInput.args.filter((token) => !token.startsWith("@"))

  if (normalizedCommand === "rerun" && mentions.length > 0 && !argsWithoutMentions.includes("--input")) {
    return { ok: true, command: normalizedCommand, args: [...argsWithoutMentions, "--input", mentions[0]] }
  }
  if (normalizedCommand === "queue-clear" && mentions.length > 0 && !argsWithoutMentions.includes("--files")) {
    return { ok: true, command: normalizedCommand, args: [...argsWithoutMentions, "--files", mentions.join(",")] }
  }

  return { ok: true, command: normalizedCommand, args: [...argsWithoutMentions, ...mentions] }
}

export function ChatPanel({
  title = "Agent CLI",
  subtitle = "Command-driven execution",
  widthClassName = "",
  initialCommand = "",
  commandDraft = null,
  commandDraftVersion = 0,
}: ChatPanelProps): JSX.Element {
  const [commandInput, setCommandInput] = useState(initialCommand)
  const [runStatus, setRunStatus] = useState<RunStatus>("idle")
  const [currentRunId, setCurrentRunId] = useState<string | null>(null)
  const [terminalOutput, setTerminalOutput] = useState("")
  const [validationError, setValidationError] = useState<string | null>(null)
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_WIDTH)
  const [isResizing, setIsResizing] = useState(false)
  const apiReady = isAgentCliApiAvailable()
  const resizeStateRef = useRef<{ startX: number; startWidth: number } | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeAgentCliEvents((event) => {
      if (!currentRunId || event.runId !== currentRunId) return

      if (event.type === "started") {
        setRunStatus("running")
        setTerminalOutput((prev) => `${prev}${prev ? "\n" : ""}${colorize(event.commandLine, ANSI.cyan)}\n`)
        return
      }
      if (event.type === "stdout" || event.type === "stderr") {
        setTerminalOutput((prev) => `${prev}${event.chunk}`)
        return
      }
      if (event.type === "error") {
        setRunStatus("error")
        setTerminalOutput((prev) => `${prev}\n${colorize(`[error] ${event.message}`, ANSI.red)}\n`)
        return
      }
      if (event.type === "exit") {
        setRunStatus(event.code === 0 ? "done" : "error")
        setTerminalOutput((prev) => `${prev}\n${formatExitLine(event.code, event.signal)}\n`)
      }
    })
    return unsubscribe
  }, [currentRunId])

  const canRun = useMemo(() => runStatus !== "running" && runStatus !== "stopping" && apiReady, [runStatus, apiReady])

  useEffect(() => {
    if (!commandDraft || !commandDraft.trim().length) return
    setCommandInput(commandDraft.trim())
    setValidationError(null)
  }, [commandDraft, commandDraftVersion])

  const handleRun = async (): Promise<void> => {
    setValidationError(null)
    const parsed = parseCommandInput(commandInput)
    if (!parsed.ok) {
      setValidationError(parsed.reason)
      return
    }

    const runId = crypto.randomUUID()
    setCurrentRunId(runId)
    setRunStatus("running")
    setTerminalOutput("")

    try {
      await runAgentCli({
        runId,
        command: parsed.command,
        rawInput: commandInput.trim(),
        args: parsed.args,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setRunStatus("error")
      setTerminalOutput((prev) => `${prev}${prev ? "\n" : ""}${colorize(`[ipc-error] ${message}`, ANSI.red)}\n`)
    }
  }

  const handleStop = async (): Promise<void> => {
    if (!currentRunId) return
    setRunStatus("stopping")
    try {
      await stopAgentCli({ runId: currentRunId })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setTerminalOutput((prev) => `${prev}\n${colorize(`[stop-error] ${message}`, ANSI.red)}\n`)
      setRunStatus("error")
    }
  }

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (event: MouseEvent): void => {
      const resizeState = resizeStateRef.current
      if (!resizeState) return
      const deltaX = resizeState.startX - event.clientX
      const nextWidth = Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, resizeState.startWidth + deltaX))
      setPanelWidth(nextWidth)
    }

    const handleMouseUp = (): void => {
      resizeStateRef.current = null
      setIsResizing(false)
    }

    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing])

  return (
    <aside
      className={cn(
        "relative flex h-full shrink-0 flex-col border-l border-sidebar-border bg-sidebar text-sidebar-foreground",
        widthClassName,
        isResizing && "select-none",
      )}
      style={{ width: `${panelWidth}px` }}
    >
      <div
        className="absolute left-0 top-0 z-20 h-full w-1 cursor-col-resize bg-transparent hover:bg-sidebar-border/70"
        onMouseDown={(event) => {
          event.preventDefault()
          resizeStateRef.current = { startX: event.clientX, startWidth: panelWidth }
          setIsResizing(true)
        }}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panel"
      />

      <header className="relative flex items-center justify-between border-b border-sidebar-border px-3 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{title}</p>
          <p className="truncate text-[11px] text-sidebar-foreground/70">{subtitle}</p>
        </div>
        <Badge variant={runStatus === "error" ? "destructive" : "secondary"} className="ml-3 capitalize">
          {runStatus}
        </Badge>
      </header>

      <div className="min-h-0 flex-1 flex flex-col">
        <div className="min-h-0 flex-1">
          <Terminal
            output={terminalOutput || colorize("[idle] No command executed yet.", ANSI.dim)}
            isStreaming={runStatus === "running" || runStatus === "stopping"}
            onClear={() => setTerminalOutput("")}
            className="h-full rounded-none border-0"
          >
            <TerminalHeader>
              <TerminalTitle>Reverso CLI Output</TerminalTitle>
              <TerminalStatus>
                {runStatus === "running" ? "Streaming" : runStatus === "stopping" ? "Stopping..." : null}
              </TerminalStatus>
            </TerminalHeader>
            <TerminalContent />
          </Terminal>
        </div>

        <div className="flex flex-col gap-2 border-t border-sidebar-border p-3">
          <div className="w-full">
            <Input
              value={commandInput}
              onChange={(event) => setCommandInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return
                event.preventDefault()
                if (!canRun) return
                void handleRun()
              }}
              placeholder="Use /command and optional @file.pdf"
              className="h-9 border-sidebar-border bg-sidebar text-sidebar-foreground placeholder:text-sidebar-foreground/50"
              aria-label="CLI command input"
            />
          </div>

          {validationError ? <p className="w-full text-xs text-destructive">{validationError}</p> : null}
          {!apiReady ? (
            <p className="w-full text-xs text-destructive">Agent CLI API unavailable in preload.</p>
          ) : null}

          <div className="flex w-full items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={runStatus !== "running" && runStatus !== "stopping"}
              onClick={() => {
                void handleStop()
              }}
            >
              <HugeiconsIcon icon={CancelCircleIcon as IconSvgElement} size={14} strokeWidth={1.8} />
              Stop
            </Button>
            <Button
              type="button"
              disabled={!canRun}
              onClick={() => {
                void handleRun()
              }}
            >
              <HugeiconsIcon icon={PlayIcon as IconSvgElement} size={14} strokeWidth={1.8} />
              Run
            </Button>
          </div>
        </div>
      </div>
    </aside>
  )
}
