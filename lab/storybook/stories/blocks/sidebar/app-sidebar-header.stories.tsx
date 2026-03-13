import React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { HugeiconsIcon } from "@hugeicons/react"
import { MoreHorizontalCircle01Icon, RoboticIcon, SecurityLockIcon } from "@hugeicons/core-free-icons"

import { AppSidebarHeader } from "@/components/app/sidebar/AppSidebarHeader"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Sidebar, SidebarProvider } from "@/components/ui/sidebar"

const meta = {
  title: "blocks/sidebar/AppSidebarHeader",
  component: AppSidebarHeader,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AppSidebarHeader>

export default meta
type Story = StoryObj<typeof meta>

function HeaderFrame({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="h-screen w-[320px] bg-background">
        <Sidebar collapsible="none">{children}</Sidebar>
      </div>
    </SidebarProvider>
  )
}

export const Variant1Current: Story = {
  render: () => (
    <HeaderFrame>
      <AppSidebarHeader />
    </HeaderFrame>
  ),
}

export const Variant2StatusBadge: Story = {
  render: () => (
    <HeaderFrame>
      <header className="relative flex items-center justify-between border-b border-sidebar-border/60 px-4 py-3">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-sidebar-foreground">Reverso Agent</p>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">Desk Title</p>
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
              LIVE
            </Badge>
          </div>
        </div>
        <Badge variant="outline" className="text-[10px] tracking-[0.12em]">
          v0.4
        </Badge>
      </header>
    </HeaderFrame>
  ),
}

export const Variant3Identity: Story = {
  render: () => (
    <HeaderFrame>
      <header className="relative border-b border-sidebar-border/60 px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            <AvatarFallback>RA</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">Reverso Agent</p>
            <p className="truncate text-xs text-muted-foreground">Investigation Workspace</p>
          </div>
        </div>
      </header>
    </HeaderFrame>
  ),
}

export const Variant4Actions: Story = {
  render: () => (
    <HeaderFrame>
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
            <DropdownMenuItem>Delete </DropdownMenuItem>

          </DropdownMenuContent>
        </DropdownMenu>
      </header>
    </HeaderFrame >
  ),
}

export const Variant5Editorial: Story = {
  render: () => (
    <HeaderFrame>
      <header className="relative border-b border-sidebar-border/60 px-4 py-3">
        <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Investigation Desk</p>
        <p className="mt-1 text-base font-semibold text-sidebar-foreground">Reverso Agent</p>
        <div className="mt-2 flex items-center gap-2">
          <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
            <HugeiconsIcon icon={RoboticIcon} size={10} strokeWidth={2} />
            IA
          </Badge>
          <Badge variant="ghost" className="h-4 px-1.5 text-[10px]">
            <HugeiconsIcon icon={SecurityLockIcon} size={10} strokeWidth={2} />
            Local-first
          </Badge>
        </div>
        <Separator className="mt-3" />
      </header>
    </HeaderFrame>
  ),
}

export const Default = Variant1Current
