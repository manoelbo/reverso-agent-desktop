"use client"

import type { JSX } from "react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { AiMagicIcon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"

type ChatEmptyStateProps = {
  title?: string
  description?: string
  suggestions?: string[]
}

export function ChatEmptyState({
  title = "Meow... what's your request?",
  description = "Vamos focar primeiro na interface: escolha uma sugestao ou escreva um prompt.",
  suggestions = [],
}: ChatEmptyStateProps): JSX.Element {
  return (
    <div className="flex min-h-full flex-col justify-center px-4 py-6">
      <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-5">
        <div className="mb-3 flex items-center gap-2">
          <HugeiconsIcon icon={AiMagicIcon as IconSvgElement} size={16} strokeWidth={1.8} />
          <p className="text-sm font-semibold text-foreground">{title}</p>
        </div>

        <p className="text-sm leading-6 text-muted-foreground">{description}</p>

        {suggestions.length > 0 ? (
          <div className="mt-4 grid gap-2">
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion}
                type="button"
                variant="ghost"
                className="h-8 justify-start rounded-md border border-border/60 bg-background/70 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

