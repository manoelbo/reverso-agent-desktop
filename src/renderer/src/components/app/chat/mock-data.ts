"use client"

import type { ChatTimelineItem } from "@/components/app/chat/types"

export const chatShortConversation: ChatTimelineItem[] = [
  {
    id: "short-1",
    type: "message",
    role: "user",
    content:
      "Quero revisar esse tutorial e comparar com o app real para achar divergencias visuais.",
    meta: "Agora",
  },
  {
    id: "short-2",
    type: "message",
    role: "assistant",
    content:
      "Posso fazer isso por etapas: mapear telas, listar gaps e propor um patch visual Storybook-first.",
    meta: "Assistente",
  },
]

export const chatLongConversation: ChatTimelineItem[] = [
  {
    id: "long-1",
    type: "message",
    role: "user",
    content:
      "Atualize a regra com Cline como referencia principal, Void para Electron e Aider para CLI.",
    meta: "19:39",
  },
  {
    id: "long-2",
    type: "activity",
    tone: "thought",
    title: "Thought for 1s",
    body: "Mapeando arquivos afetados e identificando texto-alvo para patch.",
    meta: "Explored 1 file",
  },
  {
    id: "long-3",
    type: "activity",
    tone: "build",
    title: "Build markdown-renderer-storybook",
    body: "6 de 6 to-dos completos. Verificando import paths e consistencia visual.",
    meta: "Worked for 14m 31s",
  },
  {
    id: "long-4",
    type: "message",
    role: "assistant",
    content:
      "Atualizei os pontos principais: Cline como primeira referencia, Void para IDE Electron e Aider para terminal/CLI.",
    meta: "Patch pronto",
  },
  {
    id: "long-5",
    type: "activity",
    tone: "review",
    title: "Review",
    body: "1 file changed em reverso-agent-inspiration.mdc",
    meta: "Undo all | Keep all",
  },
]

export const chatBusyConversation: ChatTimelineItem[] = [
  {
    id: "busy-1",
    type: "activity",
    tone: "thought",
    title: "Analisando prints de referencia",
    body: "Extraindo padroes de header, cards de mensagem e composer fixo no rodape.",
    meta: "3 imagens",
  },
  {
    id: "busy-2",
    type: "activity",
    tone: "build",
    title: "Gerando variacoes no Storybook",
    body: "Criando estados: empty, busy, long conversation, input focused e compact width.",
    meta: "Em progresso",
  },
]

export const chatNewSessionSuggestions = [
  "Create custom agent",
  "Analyze data for insights",
  "Create a chart",
  "Filter and sort data",
]

