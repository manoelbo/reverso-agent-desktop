"use client"

export type ChatMode = "Ask" | "Plan" | "Agent"

export type ChatSurface = "cursor-dark" | "notion-light" | "hybrid-reverso"

export type ChatComposerState =
  | "idle"
  | "focused"
  | "multiline"
  | "with-attachments"

export type ChatMessageRole = "user" | "assistant" | "system"

export type ChatActivityTone = "thought" | "build" | "review"

export type ChatTimelineItem =
  | {
      id: string
      type: "message"
      role: ChatMessageRole
      content: string
      meta?: string
    }
  | {
      id: string
      type: "activity"
      tone: ChatActivityTone
      title: string
      body: string
      meta?: string
    }

