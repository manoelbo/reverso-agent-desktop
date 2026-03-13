import React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

const meta = {
  title: "ui/Sheet",
  component: Sheet,
} satisfies Meta<typeof Sheet>

export default meta
type Story = StoryObj<typeof meta>

export const RightPanel: Story = {
  render: () => (
    <div className="p-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button>Abrir painel</Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Painel lateral</SheetTitle>
            <SheetDescription>Exemplo de uso para painel contextual no estilo da aplicação.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>
    </div>
  ),
}
