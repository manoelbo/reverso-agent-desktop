import React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const meta = {
  title: "ui/Tooltip",
  component: Tooltip,
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="p-8">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline">Passe o mouse</Button>
          </TooltipTrigger>
          <TooltipContent>Tooltip do Reverso Agent</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  ),
}
