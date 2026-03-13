"use client"

import type { JSX } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CoinsDollarIcon, RoboticIcon } from "@hugeicons/core-free-icons"

import { SidebarFooter } from "@/components/ui/sidebar"

export function AppSidebarFooter(): JSX.Element {
  return (
    <SidebarFooter className="p-3">
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
    </SidebarFooter>
  )
}
