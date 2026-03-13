"use client"

import type { JSX } from "react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"

import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"

type AppSidebarMenuItemProps = {
  label: string
  icon: IconSvgElement
  active: boolean
  onClick: () => void
}

export function AppSidebarMenuItem({ label, icon, active, onClick }: AppSidebarMenuItemProps): JSX.Element {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton type="button" isActive={active} onClick={onClick}>
        <HugeiconsIcon icon={icon} size={16} strokeWidth={1.8} />
        <span className="min-w-0 flex-1 truncate">{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
