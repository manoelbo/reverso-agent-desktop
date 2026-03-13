"use client"

import type { JSX } from "react"

import { cn } from "@/lib/utils"
import type { ChatMessageRole } from "@/components/app/chat/types"

type ChatMessageBubbleProps = {
  role: ChatMessageRole
  content: string
  meta?: string
}

export function ChatMessageBubble({
  role,
  content,
  meta,
}: ChatMessageBubbleProps): JSX.Element {
  const isUser = role === "user"

  return (
    <article
      className={cn(
        "rounded-xl border px-3 py-2.5",
        isUser
          ? "ml-7 border-border/70 bg-card/70"
          : "mr-3 border-border/60 bg-muted/30"
      )}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px]">
        <span
          className={cn(
            "font-medium",
            role === "assistant"
              ? "text-foreground"
              : role === "user"
                ? "text-muted-foreground"
                : "text-muted-foreground"
          )}
        >
          {role === "assistant" ? "Agent" : role === "user" ? "You" : "System"}
        </span>
        {meta ? <span className="text-muted-foreground">{meta}</span> : null}
      </div>
      <p className="text-sm leading-6 text-foreground">{content}</p>
    </article>
  )
}

