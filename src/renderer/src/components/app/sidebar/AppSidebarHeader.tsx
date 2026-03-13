"use client"

import type { JSX } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { MoreHorizontalCircle01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function AppSidebarHeader(): JSX.Element {
  return (
    <header className="relative flex items-center justify-between px-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-sidebar-foreground">Reverso Agent</p>
        <p className="truncate text-xs text-muted-foreground">Desk Title</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon-xs" variant="ghost" aria-label="Sidebar actions">
            <HugeiconsIcon icon={MoreHorizontalCircle01Icon} size={14} strokeWidth={1.8} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Desk actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Rename</DropdownMenuItem>
          <DropdownMenuItem>Switch</DropdownMenuItem>
          <DropdownMenuItem>Create new</DropdownMenuItem>
          <DropdownMenuItem>Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
