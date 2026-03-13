"use client"

import type { JSX } from "react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import {
  MoreHorizontalCircle01Icon,
  PanelRightIcon,
} from "@hugeicons/core-free-icons"

import { ChatModeSwitcher } from "@/components/app/chat/ChatModeSwitcher"
import type { ChatMode } from "@/components/app/chat/types"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type ChatSidebarHeaderProps = {
  title?: string
  subtitle?: string
  activeMode: ChatMode
  showCloseButton?: boolean
}

export function ChatSidebarHeader({
  title = "New AI chat",
  subtitle = "Chat-First Workspace",
  activeMode,
  showCloseButton = true,
}: ChatSidebarHeaderProps): JSX.Element {
  return (
    <header className="flex min-h-12 shrink-0 items-center justify-between border-b border-border/60 px-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{title}</p>
        <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
      </div>

      <div className="ml-3 flex items-center gap-2">
        <ChatModeSwitcher activeMode={activeMode} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
              aria-label="More chat actions"
            >
              <HugeiconsIcon
                icon={MoreHorizontalCircle01Icon as IconSvgElement}
                size={16}
                strokeWidth={1.8}
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Chat actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Clear conversation</DropdownMenuItem>
            <DropdownMenuItem>Export markdown</DropdownMenuItem>
            <DropdownMenuItem>Open transcript</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {showCloseButton ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-foreground"
            aria-label="Hide right sidebar"
          >
            <HugeiconsIcon
              icon={PanelRightIcon as IconSvgElement}
              size={16}
              strokeWidth={1.8}
            />
          </Button>
        ) : null}
      </div>
    </header>
  )
}

