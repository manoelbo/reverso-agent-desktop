"use client"

import type { JSX } from "react"

import { ChatActivityBlock } from "@/components/app/chat/ChatActivityBlock"
import { ChatEmptyState } from "@/components/app/chat/ChatEmptyState"
import { ChatMessageBubble } from "@/components/app/chat/ChatMessageBubble"
import type { ChatTimelineItem } from "@/components/app/chat/types"
import { ScrollArea } from "@/components/ui/scroll-area"

type ChatMessageListProps = {
  items: ChatTimelineItem[]
  emptyTitle?: string
  emptyDescription?: string
  emptySuggestions?: string[]
}

export function ChatMessageList({
  items,
  emptyTitle,
  emptyDescription,
  emptySuggestions,
}: ChatMessageListProps): JSX.Element {
  return (
    <ScrollArea className="flex-1">
      {items.length === 0 ? (
        <ChatEmptyState
          title={emptyTitle}
          description={emptyDescription}
          suggestions={emptySuggestions}
        />
      ) : (
        <div className="space-y-3 px-3 py-4">
          {items.map((item) =>
            item.type === "message" ? (
              <ChatMessageBubble
                key={item.id}
                role={item.role}
                content={item.content}
                meta={item.meta}
              />
            ) : (
              <ChatActivityBlock
                key={item.id}
                tone={item.tone}
                title={item.title}
                body={item.body}
                meta={item.meta}
              />
            )
          )}
        </div>
      )}
    </ScrollArea>
  )
}

