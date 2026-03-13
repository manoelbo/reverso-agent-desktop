import React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { CaretDown } from "@phosphor-icons/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

const meta = {
  title: "ui/Collapsible",
  component: Collapsible,
} satisfies Meta<typeof Collapsible>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(true)

    return (
      <div className="max-w-md p-6">
        <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border border-border/60 bg-card">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between rounded-b-none rounded-t-lg">
              Mostrar detalhes
              <CaretDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-2 p-4 text-sm text-muted-foreground">
              <p>Componente ideal para sessões de metadados e árvore de dossiê.</p>
              <p>Estado atual: {open ? "aberto" : "fechado"}.</p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    )
  },
}
