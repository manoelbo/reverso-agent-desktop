import React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon, CoinsDollarIcon, RoboticIcon, SparklesIcon } from "@hugeicons/core-free-icons"

import { AppSidebarFooter } from "@/components/app/sidebar/AppSidebarFooter"
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
  title: "blocks/sidebar/AppSidebarFooter",
  component: AppSidebarFooter,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AppSidebarFooter>

export default meta
type Story = StoryObj<typeof meta>

function FooterFrame({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="h-screen w-[320px] bg-background">
        <Sidebar collapsible="none">
          <div className="flex-1" />
          {children}
        </Sidebar>
      </div>
    </SidebarProvider>
  )
}

export const Variant1Current: Story = {
  render: () => (
    <FooterFrame>
      <AppSidebarFooter />
    </FooterFrame>
  ),
}

export const Variant2Badges: Story = {
  render: () => (
    <FooterFrame>
      <footer className="space-y-2 border-t border-sidebar-border/60 p-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Model</span>
          <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
            gemini-3
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Credit</span>
          <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
            $30,00
          </Badge>
        </div>
      </footer>
    </FooterFrame>
  ),
}

export const Variant3ProfileMenu: Story = {
  render: () => (
    <FooterFrame>
      <footer className="border-t border-sidebar-border/60 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md border border-sidebar-border/60 px-2 py-2 text-left hover:bg-sidebar-accent"
            >
              <Avatar size="sm">
                <AvatarFallback>MB</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-sidebar-foreground">Mane Brasil</p>
                <p className="truncate text-[11px] text-muted-foreground">Investigador</p>
              </div>
              <HugeiconsIcon icon={ArrowRight01Icon} size={14} strokeWidth={1.8} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Workspace</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Configurações</DropdownMenuItem>
            <DropdownMenuItem>Trocar modelo</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </footer>
    </FooterFrame>
  ),
}

export const Variant4Actions: Story = {
  render: () => (
    <FooterFrame>
      <footer className="space-y-2 border-t border-sidebar-border/60 p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <HugeiconsIcon icon={RoboticIcon} size={14} strokeWidth={1.8} />
          Mode: Agent
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button size="xs" variant="outline">
            Model
          </Button>
          <Button size="xs" variant="ghost">
            Billing
          </Button>
        </div>
      </footer>
    </FooterFrame>
  ),
}

export const Variant5SystemStatus: Story = {
  render: () => (
    <FooterFrame>
      <footer className=" p-3">
        <div className="space-y-1.5 text-[11px] text-muted-foreground">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1">
              <HugeiconsIcon icon={RoboticIcon} size={12} strokeWidth={2} />
              Model
            </span>
            <span>gemini-3-flash-preview</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1">
              <HugeiconsIcon icon={CoinsDollarIcon} size={12} strokeWidth={2} />
              Credit
            </span>
            <span>$30,00</span>
          </div>
        </div>
      </footer>
    </FooterFrame>
  ),
}

export const Default = Variant1Current
