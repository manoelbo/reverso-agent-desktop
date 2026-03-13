import{R as e}from"./iframe-9S5LuuTj.js";import{a as p,b as s,c as h,C as t}from"./ChatPanel-DgrEItRa.js";import"./preload-helper-PPVm8Dsz.js";import"./utils-vy3jnSxZ.js";import"./HugeiconsIcon-CKUv8V2d.js";import"./badge-D0lAi6qL.js";import"./index-CpxX1EO1.js";import"./index-DXX1l05D.js";import"./button-DcnQ_azB.js";import"./scroll-area-CXdlHIPh.js";import"./index-BErSN80w.js";import"./index-Cco4bJ8O.js";import"./index-afAih3at.js";import"./index-BjMwMsYB.js";import"./dropdown-menu-B720qdt5.js";import"./index-BPTpYtnc.js";import"./index-BnFamXdT.js";import"./index-DjjA1Sw3.js";import"./index-BuP_DP2q.js";const W={title:"screens/ChatPanel",component:t,parameters:{layout:"fullscreen",docs:{description:{component:"Exploracao visual Storybook-first do sidebar direito de chat (inspiracao Cursor + Notion), priorizando interface e estados."}}}},r={args:{surface:"hybrid-reverso",mode:"Ask",items:s},render:a=>e.createElement("div",{className:"h-screen w-full bg-background"},e.createElement("div",{className:"ml-auto h-full w-[380px]"},e.createElement(t,{...a})))},o={args:{surface:"cursor-dark",mode:"Ask",title:"Markdown Interface",subtitle:"Agente em contexto",items:s},render:a=>e.createElement("div",{className:"h-screen w-full bg-background"},e.createElement("div",{className:"ml-auto h-full w-[380px]"},e.createElement(t,{...a})))},n={args:{surface:"cursor-dark",mode:"Agent",title:"Inspiracao para IDE com Electron",subtitle:"Sessao ativa",items:h,composerState:"multiline"},render:a=>e.createElement("div",{className:"h-screen w-full bg-background"},e.createElement("div",{className:"ml-auto h-full w-[380px]"},e.createElement(t,{...a})))},l={args:{surface:"notion-light",mode:"Plan",title:"Revisar tutorial Figma Mac",subtitle:"Workspace notes",items:s},render:a=>e.createElement("div",{className:"h-screen w-full bg-background"},e.createElement("div",{className:"ml-auto h-full w-[380px]"},e.createElement(t,{...a})))},i={args:{surface:"hybrid-reverso",mode:"Ask",title:"New AI chat",subtitle:"Reverso Agent",items:s},parameters:{docs:{description:{story:"Direcao visual recomendada para integracao no app: equilibrio entre densidade estilo Cursor e legibilidade estilo Notion."}}},render:a=>e.createElement("div",{className:"h-screen w-full bg-background"},e.createElement("div",{className:"ml-auto h-full w-[380px]"},e.createElement(t,{...a})))},c={args:{surface:"hybrid-reverso",mode:"Ask",title:"New AI chat",subtitle:"Do anything with AI",items:[],emptyTitle:"Meow... what's your request?",emptyDescription:"Foque em interface primeiro: escolha uma sugestao rapida para iniciar o chat."},render:a=>e.createElement("div",{className:"h-screen w-full bg-background"},e.createElement("div",{className:"ml-auto h-full w-[380px]"},e.createElement(t,{...a})))},m={args:{surface:"cursor-dark",mode:"Agent",title:"Markdown Interface",subtitle:"Working...",items:p,composerState:"focused"},render:a=>e.createElement("div",{className:"h-screen w-full bg-background"},e.createElement("div",{className:"ml-auto h-full w-[380px]"},e.createElement(t,{...a})))},d={render:()=>e.createElement("div",{className:"grid h-screen w-full grid-cols-4 gap-3 bg-background p-3"},e.createElement("div",{className:"h-full min-h-0"},e.createElement(t,{title:"Idle",subtitle:"Composer state",items:s,composerState:"idle",widthClassName:"w-full",showCloseButton:!1})),e.createElement("div",{className:"h-full min-h-0"},e.createElement(t,{title:"Focused",subtitle:"Composer state",items:s,composerState:"focused",widthClassName:"w-full",showCloseButton:!1})),e.createElement("div",{className:"h-full min-h-0"},e.createElement(t,{title:"Multiline",subtitle:"Composer state",items:s,composerState:"multiline",widthClassName:"w-full",showCloseButton:!1})),e.createElement("div",{className:"h-full min-h-0"},e.createElement(t,{title:"Attachments",subtitle:"Composer state",items:s,composerState:"with-attachments",widthClassName:"w-full",showCloseButton:!1})))},u={args:{surface:"cursor-dark",mode:"Ask",title:"Compact mode",subtitle:"Narrow sidebar",items:s,widthClassName:"w-[320px]"},render:a=>e.createElement("div",{className:"h-screen w-full bg-background"},e.createElement("div",{className:"ml-auto h-full w-[320px]"},e.createElement(t,{...a})))};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    surface: "hybrid-reverso",
    mode: "Ask",
    items: chatShortConversation
  },
  render: args => <div className="h-screen w-full bg-background">
      <div className="ml-auto h-full w-[380px]">
        <ChatPanel {...args} />
      </div>
    </div>
}`,...r.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    surface: "cursor-dark",
    mode: "Ask",
    title: "Markdown Interface",
    subtitle: "Agente em contexto",
    items: chatShortConversation
  },
  render: args => <div className="h-screen w-full bg-background">
      <div className="ml-auto h-full w-[380px]">
        <ChatPanel {...args} />
      </div>
    </div>
}`,...o.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    surface: "cursor-dark",
    mode: "Agent",
    title: "Inspiracao para IDE com Electron",
    subtitle: "Sessao ativa",
    items: chatLongConversation,
    composerState: "multiline"
  },
  render: args => <div className="h-screen w-full bg-background">
      <div className="ml-auto h-full w-[380px]">
        <ChatPanel {...args} />
      </div>
    </div>
}`,...n.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    surface: "notion-light",
    mode: "Plan",
    title: "Revisar tutorial Figma Mac",
    subtitle: "Workspace notes",
    items: chatShortConversation
  },
  render: args => <div className="h-screen w-full bg-background">
      <div className="ml-auto h-full w-[380px]">
        <ChatPanel {...args} />
      </div>
    </div>
}`,...l.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    surface: "hybrid-reverso",
    mode: "Ask",
    title: "New AI chat",
    subtitle: "Reverso Agent",
    items: chatShortConversation
  },
  parameters: {
    docs: {
      description: {
        story: "Direcao visual recomendada para integracao no app: equilibrio entre densidade estilo Cursor e legibilidade estilo Notion."
      }
    }
  },
  render: args => <div className="h-screen w-full bg-background">
      <div className="ml-auto h-full w-[380px]">
        <ChatPanel {...args} />
      </div>
    </div>
}`,...i.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    surface: "hybrid-reverso",
    mode: "Ask",
    title: "New AI chat",
    subtitle: "Do anything with AI",
    items: [],
    emptyTitle: "Meow... what's your request?",
    emptyDescription: "Foque em interface primeiro: escolha uma sugestao rapida para iniciar o chat."
  },
  render: args => <div className="h-screen w-full bg-background">
      <div className="ml-auto h-full w-[380px]">
        <ChatPanel {...args} />
      </div>
    </div>
}`,...c.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    surface: "cursor-dark",
    mode: "Agent",
    title: "Markdown Interface",
    subtitle: "Working...",
    items: chatBusyConversation,
    composerState: "focused"
  },
  render: args => <div className="h-screen w-full bg-background">
      <div className="ml-auto h-full w-[380px]">
        <ChatPanel {...args} />
      </div>
    </div>
}`,...m.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <div className="grid h-screen w-full grid-cols-4 gap-3 bg-background p-3">
      <div className="h-full min-h-0">
        <ChatPanel title="Idle" subtitle="Composer state" items={chatShortConversation} composerState="idle" widthClassName="w-full" showCloseButton={false} />
      </div>
      <div className="h-full min-h-0">
        <ChatPanel title="Focused" subtitle="Composer state" items={chatShortConversation} composerState="focused" widthClassName="w-full" showCloseButton={false} />
      </div>
      <div className="h-full min-h-0">
        <ChatPanel title="Multiline" subtitle="Composer state" items={chatShortConversation} composerState="multiline" widthClassName="w-full" showCloseButton={false} />
      </div>
      <div className="h-full min-h-0">
        <ChatPanel title="Attachments" subtitle="Composer state" items={chatShortConversation} composerState="with-attachments" widthClassName="w-full" showCloseButton={false} />
      </div>
    </div>
}`,...d.parameters?.docs?.source}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    surface: "cursor-dark",
    mode: "Ask",
    title: "Compact mode",
    subtitle: "Narrow sidebar",
    items: chatShortConversation,
    widthClassName: "w-[320px]"
  },
  render: args => <div className="h-screen w-full bg-background">
      <div className="ml-auto h-full w-[320px]">
        <ChatPanel {...args} />
      </div>
    </div>
}`,...u.parameters?.docs?.source}}};const q=["Default","CursorDarkDefault","CursorDarkLongConversation","NotionLightDefault","HybridReverso","EmptyStateNewChat","BusyStateAgentWorking","InputStates","NarrowWidthCompact"];export{m as BusyStateAgentWorking,o as CursorDarkDefault,n as CursorDarkLongConversation,r as Default,c as EmptyStateNewChat,i as HybridReverso,d as InputStates,u as NarrowWidthCompact,l as NotionLightDefault,q as __namedExportsOrder,W as default};
