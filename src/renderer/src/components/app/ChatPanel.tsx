"use client"

import type { JSX } from "react"

import { ChatComposer } from "@/components/app/chat/ChatComposer"
import { ChatMessageList } from "@/components/app/chat/ChatMessageList"
import { chatNewSessionSuggestions } from "@/components/app/chat/mock-data"
import { ChatSidebarHeader } from "@/components/app/chat/ChatSidebarHeader"
import { getChatSurfaceClasses } from "@/components/app/chat/surfaces"
import type {
  ChatComposerState,
  ChatMode,
  ChatSurface,
  ChatTimelineItem,
} from "@/components/app/chat/types"
import { cn } from "@/lib/utils"

export type ChatPanelProps = {
  title?: string
  subtitle?: string
  mode?: ChatMode
  surface?: ChatSurface
  items?: ChatTimelineItem[]
  composerState?: ChatComposerState
  widthClassName?: string
  emptyTitle?: string
  emptyDescription?: string
  emptySuggestions?: string[]
  showCloseButton?: boolean
}

export function ChatPanel({
  title = "New AI chat",
  subtitle = "Chat-First Workspace",
  mode = "Ask",
  surface = "hybrid-reverso",
  items = [],
  composerState = "idle",
  widthClassName = "w-[380px]",
  emptyTitle,
  emptyDescription,
  emptySuggestions = chatNewSessionSuggestions,
  showCloseButton = true,
}: ChatPanelProps): JSX.Element {
  const surfaceClasses = getChatSurfaceClasses(surface)

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-l border-border/60",
        widthClassName,
        surfaceClasses.panel
      )}
    >
      <div className={cn(surfaceClasses.header)}>
        <ChatSidebarHeader
          title={title}
          subtitle={subtitle}
          activeMode={mode}
          showCloseButton={showCloseButton}
        />
      </div>

      <div className={cn("min-h-0 flex-1", surfaceClasses.timeline)}>
        <ChatMessageList
          items={items}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
          emptySuggestions={emptySuggestions}
        />
      </div>

      <div className={cn("shrink-0", surfaceClasses.composer)}>
        <ChatComposer mode={mode} state={composerState} />
      </div>
    </aside>
  )
}
