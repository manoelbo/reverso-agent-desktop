import React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { Input } from "@/components/ui/input"

const meta = {
  title: "ui/Input",
  component: Input,
  args: {
    placeholder: "Digite aqui...",
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {
  render: (args) => (
    <div className="w-full max-w-md p-6">
      <Input {...args} />
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="grid w-full max-w-md gap-3 p-6">
      <Input placeholder="Default" />
      <Input placeholder="Disabled" disabled />
      <Input placeholder="Com valor" defaultValue="reverso-agent" />
    </div>
  ),
}
