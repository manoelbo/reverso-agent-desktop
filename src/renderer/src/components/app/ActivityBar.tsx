"use client"

import type { JSX } from "react"
import { Files, GearSix, Graph, MagnifyingGlass } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export type AppModule = "explorer" | "search" | "graph" | "settings"

type ActivityBarProps = {
  activeModule: AppModule
  onModuleChange: (module: AppModule) => void
}

type ModuleItem = {
  id: AppModule
  label: string
  icon: typeof Files
  placement?: "top" | "bottom"
}

const modules: ModuleItem[] = [
  { id: "explorer", label: "Explorer", icon: Files },
  { id: "search", label: "Search", icon: MagnifyingGlass },
  { id: "graph", label: "Graph", icon: Graph },
  { id: "settings", label: "Settings", icon: GearSix, placement: "bottom" },
]

function ModuleButton({
  item,
  isActive,
  onSelect,
}: {
  item: ModuleItem
  isActive: boolean
  onSelect: (module: AppModule) => void
}): JSX.Element {
  const Icon = item.icon

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={item.label}
          data-active={isActive}
          onClick={() => onSelect(item.id)}
          className={cn(
            "size-10 rounded-lg border border-transparent text-muted-foreground transition-colors",
            "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            "data-[active=true]:border-sidebar-border data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
          )}
        >
          <Icon className="size-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={10}>
        {item.label}
      </TooltipContent>
    </Tooltip>
  )
}

export function ActivityBar({
  activeModule,
  onModuleChange,
}: ActivityBarProps): JSX.Element {
  const topModules = modules.filter((module) => module.placement !== "bottom")
  const bottomModule = modules.find((module) => module.placement === "bottom")

  return (
    <aside className="flex h-screen w-12 shrink-0 flex-col items-center border-r border-sidebar-border/60 bg-sidebar py-3 pt-14">
      <div className="flex w-full flex-col items-center gap-2">
        {topModules.map((module) => (
          <ModuleButton
            key={module.id}
            item={module}
            isActive={activeModule === module.id}
            onSelect={onModuleChange}
          />
        ))}
      </div>

      {bottomModule ? (
        <div className="mt-auto">
          <ModuleButton
            item={bottomModule}
            isActive={activeModule === bottomModule.id}
            onSelect={onModuleChange}
          />
        </div>
      ) : null}
    </aside>
  )
}
