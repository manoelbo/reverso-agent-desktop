import React from "react"
import type { Meta, StoryObj } from "@storybook/react-vite"
import { ChatPanel } from "../../../../src/renderer/src/components/app/ChatPanel"
import {
  chatBusyConversation,
  chatLongConversation,
  chatShortConversation,
} from "../../../../src/renderer/src/components/app/chat/mock-data"

const meta = {
  title: "screens/ChatPanel",
  component: ChatPanel,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Exploracao visual Storybook-first do sidebar direito de chat (inspiracao Cursor + Notion), priorizando interface e estados.",
      },
    },
  },
} satisfies Meta<typeof ChatPanel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    surface: "hybrid-reverso",
    mode: "Ask",
    items: chatShortConversation,
  },
  render: (args) => (
    <div className="h-screen w-full bg-background">
      <div className="ml-auto h-full w-[380px]">
        <ChatPanel {...args} />
      </div>
    </div>
  ),
}

export const CursorDarkDefault: Story = {
  args: {
    surface: "cursor-dark",
    mode: "Ask",
    title: "Markdown Interface",
    subtitle: "Agente em contexto",
    items: chatShortConversation,
  },
  render: (args) => (
    <div className="h-screen w-full bg-background">
      <div className="ml-auto h-full w-[380px]">
        <ChatPanel {...args} />
      </div>
    </div>
  ),
}

export const CursorDarkLongConversation: Story = {
  args: {
    surface: "cursor-dark",
    mode: "Agent",
    title: "Inspiracao para IDE com Electron",
    subtitle: "Sessao ativa",
    items: chatLongConversation,
    composerState: "multiline",
  },
  render: (args) => (
    <div className="h-screen w-full bg-background">
      <div className="ml-auto h-full w-[380px]">
        <ChatPanel {...args} />
      </div>
    </div>
  ),
}

export const NotionLightDefault: Story = {
  args: {
    surface: "notion-light",
    mode: "Plan",
    title: "Revisar tutorial Figma Mac",
    subtitle: "Workspace notes",
    items: chatShortConversation,
  },
  render: (args) => (
    <div className="h-screen w-full bg-background">
      <div className="ml-auto h-full w-[380px]">
        <ChatPanel {...args} />
      </div>
    </div>
  ),
}

export const HybridReverso: Story = {
  args: {
    surface: "hybrid-reverso",
    mode: "Ask",
    title: "New AI chat",
    subtitle: "Reverso Agent",
    items: chatShortConversation,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Direcao visual recomendada para integracao no app: equilibrio entre densidade estilo Cursor e legibilidade estilo Notion.",
      },
    },
  },
  render: (args) => (
    <div className="h-screen w-full bg-background">
      <div className="ml-auto h-full w-[380px]">
        <ChatPanel {...args} />
      </div>
    </div>
  ),
}

export const EmptyStateNewChat: Story = {
  args: {
    surface: "hybrid-reverso",
    mode: "Ask",
    title: "New AI chat",
    subtitle: "Do anything with AI",
    items: [],
    emptyTitle: "Meow... what's your request?",
    emptyDescription:
      "Foque em interface primeiro: escolha uma sugestao rapida para iniciar o chat.",
  },
  render: (args) => (
    <div className="h-screen w-full bg-background">
      <div className="ml-auto h-full w-[380px]">
        <ChatPanel {...args} />
      </div>
    </div>
  ),
}

export const BusyStateAgentWorking: Story = {
  args: {
    surface: "cursor-dark",
    mode: "Agent",
    title: "Markdown Interface",
    subtitle: "Working...",
    items: chatBusyConversation,
    composerState: "focused",
  },
  render: (args) => (
    <div className="h-screen w-full bg-background">
      <div className="ml-auto h-full w-[380px]">
        <ChatPanel {...args} />
      </div>
    </div>
  ),
}

export const InputStates: Story = {
  render: () => (
    <div className="grid h-screen w-full grid-cols-4 gap-3 bg-background p-3">
      <div className="h-full min-h-0">
        <ChatPanel
          title="Idle"
          subtitle="Composer state"
          items={chatShortConversation}
          composerState="idle"
          widthClassName="w-full"
          showCloseButton={false}
        />
      </div>
      <div className="h-full min-h-0">
        <ChatPanel
          title="Focused"
          subtitle="Composer state"
          items={chatShortConversation}
          composerState="focused"
          widthClassName="w-full"
          showCloseButton={false}
        />
      </div>
      <div className="h-full min-h-0">
        <ChatPanel
          title="Multiline"
          subtitle="Composer state"
          items={chatShortConversation}
          composerState="multiline"
          widthClassName="w-full"
          showCloseButton={false}
        />
      </div>
      <div className="h-full min-h-0">
        <ChatPanel
          title="Attachments"
          subtitle="Composer state"
          items={chatShortConversation}
          composerState="with-attachments"
          widthClassName="w-full"
          showCloseButton={false}
        />
      </div>
    </div>
  ),
}

export const NarrowWidthCompact: Story = {
  args: {
    surface: "cursor-dark",
    mode: "Ask",
    title: "Compact mode",
    subtitle: "Narrow sidebar",
    items: chatShortConversation,
    widthClassName: "w-[320px]",
  },
  render: (args) => (
    <div className="h-screen w-full bg-background">
      <div className="ml-auto h-full w-[320px]">
        <ChatPanel {...args} />
      </div>
    </div>
  ),
}
