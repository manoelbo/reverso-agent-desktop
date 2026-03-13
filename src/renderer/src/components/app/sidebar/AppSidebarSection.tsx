"use client"

import type { JSX, ReactNode } from "react"

import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu } from "@/components/ui/sidebar"

type AppSidebarSectionProps = {
  label: string
  children: ReactNode
}

export function AppSidebarSection({ label, children }: AppSidebarSectionProps): JSX.Element {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="px-2 text-[11px] uppercase tracking-[0.2em]">{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>{children}</SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
