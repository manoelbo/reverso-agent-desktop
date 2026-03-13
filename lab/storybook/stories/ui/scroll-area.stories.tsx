import React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { ScrollArea } from "@/components/ui/scroll-area"

const meta = {
  title: "ui/ScrollArea",
  component: ScrollArea,
} satisfies Meta<typeof ScrollArea>

export default meta
type Story = StoryObj<typeof meta>

const items = Array.from({ length: 32 }).map((_, index) => `Item de evidence #${index + 1}`)

export const Default: Story = {
  render: () => (
    <div className="p-6">
      <ScrollArea className="h-72 w-full max-w-md rounded-md border border-border/60 bg-card">
        <div className="space-y-2 p-4">
          {items.map((item) => (
            <div key={item} className="rounded-md border border-border/50 px-3 py-2 text-sm">
              {item}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  ),
}
