"use client"

import { cn } from "@/lib/utils"
import type { ChatSurface } from "@/components/app/chat/types"

export function getChatSurfaceClasses(surface: ChatSurface): {
  panel: string
  header: string
  timeline: string
  composer: string
} {
  if (surface === "cursor-dark") {
    return {
      panel: cn("bg-background"),
      header: cn("border-border/60 bg-background/95"),
      timeline: cn("bg-background"),
      composer: cn("border-border/60 bg-background"),
    }
  }

  if (surface === "notion-light") {
    return {
      panel: cn("bg-card/50"),
      header: cn("border-border/60 bg-card/80"),
      timeline: cn("bg-card/30"),
      composer: cn("border-border/60 bg-card/80"),
    }
  }

  return {
    panel: cn("bg-background/95"),
    header: cn("border-border/60 bg-muted/20"),
    timeline: cn("bg-muted/10"),
    composer: cn("border-border/60 bg-background/90"),
  }
}

