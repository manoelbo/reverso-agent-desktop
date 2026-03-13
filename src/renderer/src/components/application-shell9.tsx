"use client"

import * as React from "react"
import {
  CaretRight,
  ChatsCircle,
  Files,
  FolderOpen,
  GearSix,
  Graph,
  MagnifyingGlass,
  SidebarSimple,
  Sparkle,
} from "@phosphor-icons/react"

import logoUrl from "@/assets/logo-gray-transparent.svg"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type ReversoModule = "explorer" | "search" | "graph" | "settings"

type ModuleItem = {
  id: ReversoModule
  label: string
  icon: typeof Files
  placement?: "top" | "bottom"
}

type SidebarSection = {
  title: string
  items: string[]
  icon: typeof FolderOpen
}

const modules: ModuleItem[] = [
  { id: "explorer", label: "Explorer", icon: Files },
  { id: "search", label: "Search", icon: MagnifyingGlass },
  { id: "graph", label: "Graph", icon: Graph },
  { id: "settings", label: "Settings", icon: GearSix, placement: "bottom" },
]

const moduleMeta: Record<ReversoModule, { label: string }> = {
  explorer: {
    label: "Explorer",
  },
  search: {
    label: "Search",
  },
  graph: {
    label: "Graph",
  },
  settings: {
    label: "Settings",
  },
}

const moduleSections: Record<ReversoModule, SidebarSection[]> = {
  explorer: [
    {
      title: "Sources",
      icon: FolderOpen,
      items: ["contract-bid-01.pdf", "email-dump.eml", "photoset-briefing.zip"],
    },
    {
      title: "Investigations",
      icon: MagnifyingGlass,
      items: ["Corporate Cluster", "Procurement Trail", "Public Works Overbilling"],
    },
    {
      title: "Dossier",
      icon: Sparkle,
      items: ["People", "Organizations", "Timeline"],
    },
  ],
  search: [
    {
      title: "Saved Queries",
      icon: MagnifyingGlass,
      items: ["\"same CNPJ\" + contract", "\"offshore\" + board", "\"intermediary\" + agency"],
    },
    {
      title: "Recent Results",
      icon: FolderOpen,
      items: ["email-dump.eml", "timeline/2024.md", "source-note-17.md"],
    },
  ],
  graph: [
    {
      title: "Graph Views",
      icon: Graph,
      items: ["Full Graph", "People Cluster", "Companies + Contracts"],
    },
    {
      title: "Highlights",
      icon: Sparkle,
      items: ["3 new weak ties", "2 unresolved entities", "1 temporal anomaly"],
    },
  ],
  settings: [
    {
      title: "Workspace",
      icon: GearSix,
      items: ["Profile", "Appearance", "Keybindings"],
    },
    {
      title: "AI",
      icon: Sparkle,
      items: ["Default model", "Reasoning mode", "Citation policy"],
    },
  ],
}

function ActivityRail({
  activeModule,
  onModuleChange,
}: {
  activeModule: ReversoModule
  onModuleChange: (moduleId: ReversoModule) => void
}) {
  const topModules = modules.filter((module) => module.placement !== "bottom")
  const bottomModules = modules.filter((module) => module.placement === "bottom")

  return (
    <aside className="flex h-full w-12 shrink-0 flex-col items-center border-r border-sidebar-border/60 bg-sidebar pt-14 pb-3">
      <div className="flex w-full flex-col items-center gap-2">
        {topModules.map((module) => (
          <Tooltip key={module.id}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={module.label}
                data-active={activeModule === module.id}
                onClick={() => onModuleChange(module.id)}
                className={cn(
                  "size-10 rounded-lg border border-transparent text-sidebar-foreground/70 transition-colors",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  "data-[active=true]:border-sidebar-border data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                )}
              >
                <module.icon className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>
              {module.label}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      <div className="mt-auto flex w-full flex-col items-center gap-2">
        {bottomModules.map((module) => (
          <Tooltip key={module.id}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={module.label}
                data-active={activeModule === module.id}
                onClick={() => onModuleChange(module.id)}
                className={cn(
                  "size-10 rounded-lg border border-transparent text-sidebar-foreground/70 transition-colors",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  "data-[active=true]:border-sidebar-border data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground"
                )}
              >
                <module.icon className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>
              {module.label}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </aside>
  )
}

function WorkspaceSidebar({ activeModule }: { activeModule: ReversoModule }) {
  const sections = moduleSections[activeModule]

  return (
    <Sidebar
      collapsible="offcanvas"
      className="left-12 border-r border-sidebar-border/60 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
    >
      <SidebarHeader className="gap-3 border-b border-sidebar-border/60 px-4 pt-14 pb-4">
        <p className="truncate text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {moduleMeta[activeModule].label}
        </p>
      </SidebarHeader>

      <SidebarContent className="gap-2 px-2 py-3">
        {sections.map((section, index) => (
          <Collapsible
            key={section.title}
            defaultOpen={index === 0}
            className="group/collapsible rounded-md border border-transparent px-1 py-1"
          >
            <SidebarGroup className="gap-1 px-1 py-1">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sidebar-foreground hover:bg-sidebar-accent"
                >
                  <CaretRight className="size-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                  <section.icon className="size-4 text-muted-foreground" />
                  <SidebarGroupLabel className="cursor-pointer p-0 text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    {section.title}
                  </SidebarGroupLabel>
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu className="pl-7">
                    {section.items.map((item) => (
                      <SidebarMenuItem key={item}>
                        <SidebarMenuButton className="h-8">
                          <span className="truncate text-sm">{item}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/60 p-3">
        <Button
          variant="outline"
          className="h-9 w-full justify-between rounded-md bg-background/70"
        >
          <span>Open Full Graph</span>
          <Graph className="size-4" />
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}

function ViewerSurface({ withChatOpen }: { withChatOpen: boolean }) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-1 items-center justify-center bg-muted/20",
        withChatOpen && "border-r border-border/60"
      )}
    >
      <img
        src={logoUrl}
        alt="Reverso"
        className="pointer-events-none w-56 max-w-[40%] select-none opacity-10"
      />
    </section>
  )
}

type ChatMode = "Ask" | "Plan" | "Agent"

const chatModes: ChatMode[] = ["Ask", "Plan", "Agent"]

function ChatPanel({
  activeMode,
  onModeChange,
  onClose,
}: {
  activeMode: ChatMode
  onModeChange: (mode: ChatMode) => void
  onClose: () => void
}) {
  return (
    <aside className="flex h-full w-[380px] shrink-0 flex-col bg-background">
      <header className="flex h-12 items-center justify-between border-b border-border/60 px-4">
        <div className="flex items-center gap-2">
          <ChatsCircle className="size-4" />
          <span className="text-sm font-semibold">Chat</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border border-border bg-muted/30 p-0.5">
            {chatModes.map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onModeChange(mode)}
                className={cn(
                  "rounded px-2 py-1 text-[11px] font-medium transition-colors",
                  activeMode === mode
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {mode}
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Hide chat panel"
          >
            <SidebarSimple className="size-4 -scale-x-100" />
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          <div className="rounded-xl border border-border/70 bg-muted/40 p-3 text-sm text-muted-foreground">
            O historico de mensagens aparecera aqui com respostas do agente e acoes executadas.
          </div>
        </div>
      </ScrollArea>

      <div className="border-t border-border/60 p-4">
        <div className="rounded-lg border border-border bg-background p-3">
          <textarea
            rows={4}
            placeholder="Pergunte ao Reverso Agent..."
            className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>
    </aside>
  )
}

export function ApplicationShell9() {
  const [activeModule, setActiveModule] = React.useState<ReversoModule>("explorer")
  const [isChatOpen, setIsChatOpen] = React.useState(true)
  const [chatMode, setChatMode] = React.useState<ChatMode>("Ask")

  return (
    <SidebarProvider
      className="h-svh overflow-hidden"
      style={{ "--sidebar-width": "16.25rem" } as React.CSSProperties}
    >
      <div className="hidden h-full w-full overflow-hidden md:flex">
        <ActivityRail activeModule={activeModule} onModuleChange={setActiveModule} />
        <WorkspaceSidebar activeModule={activeModule} />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="drag-region flex h-12 items-center justify-between border-b border-border/60 px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger
                variant="ghost"
                size="icon-sm"
                className="no-drag text-muted-foreground hover:text-foreground"
              />
              <nav className="flex items-center gap-1 text-sm">
                <span className="font-medium">Reverso Agent</span>
                <CaretRight className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">{moduleMeta[activeModule].label}</span>
              </nav>
            </div>

            <div className="no-drag flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5"
                onClick={() => setIsChatOpen((current) => !current)}
              >
                <SidebarSimple className={cn("size-4", !isChatOpen && "-scale-x-100")} />
                <span>{isChatOpen ? "Hide Chat" : "Show Chat"}</span>
              </Button>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 overflow-hidden">
            <ViewerSurface withChatOpen={isChatOpen} />
            {isChatOpen ? (
              <ChatPanel
                activeMode={chatMode}
                onModeChange={setChatMode}
                onClose={() => setIsChatOpen(false)}
              />
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center md:hidden">
        <img src={logoUrl} alt="Reverso" className="size-12 opacity-70" />
        <h2 className="text-lg font-semibold">Application Shell 9 adaptada</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          A versao desktop (md+) contem o layout completo com Activity Bar, Sidebar, Viewer e Chat.
        </p>
      </div>
    </SidebarProvider>
  )
}
