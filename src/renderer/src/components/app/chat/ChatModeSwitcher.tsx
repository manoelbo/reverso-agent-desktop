"use client"

import type { JSX } from "react"

import { cn } from "@/lib/utils"
import type { ChatMode } from "@/components/app/chat/types"

const chatModes: ChatMode[] = ["Ask", "Plan", "Agent"]

type ChatModeSwitcherProps = {
  activeMode: ChatMode
}

export function ChatModeSwitcher({
  activeMode,
}: ChatModeSwitcherProps): JSX.Element {
  return (
    <div className="inline-flex rounded-md border border-border/70 bg-muted/40 p-0.5">
      {chatModes.map((mode) => (
        <button
          key={mode}
          type="button"
          className={cn(
            "rounded px-2 py-1 text-[11px] font-medium transition-colors",
            activeMode === mode
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {mode}
        </button>
      ))}
    </div>
  )
}

