"use client"

import type { JSX } from "react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ChatActivityTone } from "@/components/app/chat/types"

type ChatActivityBlockProps = {
  tone: ChatActivityTone
  title: string
  body: string
  meta?: string
}

const toneLabel: Record<ChatActivityTone, string> = {
  thought: "Thought",
  build: "Build",
  review: "Review",
}

const toneClass: Record<ChatActivityTone, string> = {
  thought: "border-border/70 bg-muted/30",
  build: "border-border/70 bg-card/70",
  review: "border-border/70 bg-background/80",
}

export function ChatActivityBlock({
  tone,
  title,
  body,
  meta,
}: ChatActivityBlockProps): JSX.Element {
  return (
    <article className={cn("rounded-xl border p-3", toneClass[tone])}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <Badge variant="outline" className="text-[10px] tracking-[0.08em] uppercase">
          {toneLabel[tone]}
        </Badge>
        {meta ? <span className="text-[11px] text-muted-foreground">{meta}</span> : null}
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p>
    </article>
  )
}

