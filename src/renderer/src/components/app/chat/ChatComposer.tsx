"use client"

import type { JSX } from "react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import {
  AiMagicIcon,
  ArrowDown01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ChatComposerState, ChatMode } from "@/components/app/chat/types"
import { cn } from "@/lib/utils"

type ChatComposerProps = {
  mode: ChatMode
  state?: ChatComposerState
  placeholder?: string
}

function composerRows(state: ChatComposerState): number {
  if (state === "multiline") {
    return 6
  }

  if (state === "with-attachments") {
    return 4
  }

  return 3
}

export function ChatComposer({
  mode,
  state = "idle",
  placeholder = "Do anything with AI...",
}: ChatComposerProps): JSX.Element {
  return (
    <div className="border-t border-border/60 p-3">
      <div
        className={cn(
          "rounded-2xl border border-border/70 bg-card/70 p-3 transition-colors",
          state === "focused" && "border-ring/70 ring-2 ring-ring/20"
        )}
      >
        {state === "with-attachments" ? (
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline">Reunioes</Badge>
            <Badge variant="outline">Documentos</Badge>
          </div>
        ) : null}

        <textarea
          rows={composerRows(state)}
          placeholder={placeholder}
          className="w-full resize-none border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Button type="button" variant="ghost" size="icon-xs" aria-label="Add context">
              <HugeiconsIcon
                icon={AiMagicIcon as IconSvgElement}
                size={14}
                strokeWidth={1.8}
              />
            </Button>
            <Button type="button" variant="ghost" size="icon-xs" aria-label="Prompt options">
              <HugeiconsIcon
                icon={Search01Icon as IconSvgElement}
                size={14}
                strokeWidth={1.8}
              />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="ghost">{mode}</Badge>
            <Button type="button" size="icon-xs" aria-label="Send prompt">
              <HugeiconsIcon
                icon={ArrowDown01Icon as IconSvgElement}
                size={14}
                strokeWidth={1.8}
                className="-rotate-180"
              />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

