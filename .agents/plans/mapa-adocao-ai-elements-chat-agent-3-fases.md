# Feature: Mapa de adocao AI Elements no Chat Agent (3 fases)

The following plan should be complete, but it is important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils, types and models. Import from the right files etc.

## Feature Description

Adotar AI Elements como camada principal de UI conversacional no painel direito do Reverso Agent, preservando a arquitetura investigativa existente do `lab/agent` e evoluindo a integracao em 3 fases:

1. Storybook-first (UI e estados completos, sem acoplamento forte de runtime).
2. Integracao no renderer com adaptador de eventos do Agent Lab para estrutura de mensagens/parts.
3. Transporte de producao via IPC no Electron (streaming, cancelamento, sessao, confiabilidade).

O plano maximiza reaproveitamento do que ja existe (`ChatPanel`, `AppLayout`, fluxo de feedback/eventos do `lab/agent`) e contempla o uso amplo dos blocos de AI Elements (Conversation, Message, PromptInput, Attachments, Sources, Tool e correlatos).

## User Story

As a usuario do Reverso Agent em investigacoes longas
I want uma experiencia de chat estilo copilot com streaming, tools, fontes e anexos
So that eu acompanhe o progresso do agente em tempo real, com rastreabilidade e UX consistente no app Electron.

## Problem Statement

- A UI atual do chat foi estruturada para exploracao visual, mas ainda e uma implementacao propria parcial, sem o ecossistema completo de componentes AI-native.
- O `lab/agent` ja possui eventos ricos (`agent_step`, `tool_call`, `tool_result`, `final_summary`, etc.), mas ainda nao existe um adaptador formal para renderizacao via AI Elements no app.
- A maioria dos exemplos de AI Elements usa rota web (`/api/chat`), enquanto o projeto final precisa de transporte seguro e stateful no Electron via IPC.
- Sem um mapa de adocao em fases, ha risco de rework de UI e regressao no fluxo investigativo.

## Solution Statement

Executar uma migracao incremental em 3 fases:

- **Fase 1 (UI Storybook):** reconstruir o sidebar de chat com AI Elements cobrindo estados e variacoes principais.
- **Fase 2 (Renderer):** introduzir um adapter de eventos do Agent Lab para mensagens/parts renderizadas por AI Elements.
- **Fase 3 (Electron IPC):** implementar transporte de streaming via main/preload/renderer, com cancelamento e sessao robusta.

Essa abordagem preserva o core atual, melhora UX rapidamente e reduz risco tecnico.

## Feature Metadata

**Feature Type**: Enhancement
**Estimated Complexity**: High
**Primary Systems Affected**: `src/renderer` (chat UI), `lab/storybook`, `src/main` + `src/preload` (IPC), `lab/agent` (adapter de eventos)
**Dependencies**: AI Elements, AI SDK UI (`@ai-sdk/react`/`ai`), componentes shadcn existentes, runtime Electron

---

## CONTEXT REFERENCES

### Relevant Codebase Files -- IMPORTANT: YOU MUST READ THESE BEFORE IMPLEMENTING!

- `src/renderer/src/components/app/ChatPanel.tsx` - Composicao atual do painel direito (header/timeline/composer) e ponto de substituicao por AI Elements.
- `src/renderer/src/components/app/chat/ChatMessageList.tsx` - Lista/scroll da timeline atual; referencia para migrar para `Conversation`.
- `src/renderer/src/components/app/chat/ChatComposer.tsx` - Composer atual; referencia para migrar para `PromptInput`.
- `src/renderer/src/components/app/AppLayout.tsx` - Toggle e encaixe do sidebar direito no shell principal.
- `src/renderer/src/components/app/chat/mock-data.ts` - Fixtures de estado para stories e regressao visual.
- `lab/storybook/stories/screens/chat-panel.stories.tsx` - Matriz atual de variacoes do chat; base para Storybook-first.
- `lab/agent/src/cli/events.ts` - Contrato de eventos do Agent Lab (step/tool/system/summary/loop).
- `lab/agent/src/cli/renderer.ts` - Renderizacao atual de feedback visual/compact e semantica dos eventos.
- `lab/agent/src/runner/run-agent.ts` - Roteamento de fluxo conversacional e pontos de resumo/finalizacao.
- `lab/agent/src/runner/run-inquiry.ts` - Streaming/logica de execucao com ferramentas e sinais ricos para UI.

### New Files to Create

- `src/renderer/src/components/app/chat-ai-elements/ChatPanelAI.tsx` - Casca de chat baseada em AI Elements.
- `src/renderer/src/components/app/chat-ai-elements/message-part-renderer.tsx` - Renderer de parts (`text`, `tool-*`, `source-url`, anexos).
- `src/renderer/src/components/app/chat-ai-elements/use-agent-chat-adapter.ts` - Adapter de eventos do Agent Lab para estrutura de mensagens da UI.
- `lab/storybook/stories/screens/chat-ai-elements.stories.tsx` - Novas variacoes de Storybook para estados AI Elements.
- `src/shared/ipc-chat.ts` - Contrato tipado de canais IPC do chat (start/delta/tool/source/done/error/cancel).
- `src/main/ipc/chat-stream.ts` - Handler de stream no main process.
- `src/preload/chat-bridge.ts` - Ponte segura para renderer consumir stream e enviar comandos.

### Relevant Documentation -- YOU SHOULD READ THESE BEFORE IMPLEMENTING! (optional; add if Context7 was used)

- [Vercel AI Frontend Stack](https://elements.ai-sdk.dev/docs/vercel-ai-frontend)
  - Specific section: Stack layering + `useChat` + `DefaultChatTransport`
  - Why: Define fronteiras entre UI, SDK e transporte.
  - **Key takeaways / Essential content:** AI Elements e camada de UI composable; AI SDK cuida de streaming/state; transporte pode ser customizado e nao depende obrigatoriamente de Next.js.

- [Conversation Component](https://sdk.vercel.ai/elements/components/conversation)
  - Specific section: composicao de `Conversation`, `ConversationContent`, `ConversationScrollButton`, `ConversationEmptyState`, `ConversationDownload`
  - Why: Base da timeline do chat.
  - **Key takeaways / Essential content:** role de auto-scroll, empty state e acao de download integradas; mapeamento direto da lista de mensagens atual.

- [Prompt Input Component](https://sdk.vercel.ai/elements/components/prompt-input)
  - Specific section: submit/status, attachments, tools, model picker
  - Why: Substituir composer custom atual.
  - **Key takeaways / Essential content:** suporta multiline, drag/drop, anexos, acao custom e status de envio/streaming; excelente para estado de copilot.

- [Message Component](https://sdk.vercel.ai/elements/components/message)
  - Specific section: `Message`, `MessageContent`, `MessageResponse`, actions e markdown streaming
  - Why: Render padrao de mensagens e acoes.
  - **Key takeaways / Essential content:** suporta markdown e acoes de retry/copy; requer integracao de estilo adicional para streamdown conforme doc.

- [Sources Component](https://sdk.vercel.ai/elements/components/sources)
  - Specific section: `Sources`, `SourcesTrigger`, `Source`
  - Why: Exibir citacoes/fontes na resposta do agente.
  - **Key takeaways / Essential content:** usa parts de tipo `source-url`; encaixa no requisito de rastreabilidade editorial.

- [Tool Component](https://sdk.vercel.ai/elements/components/tool)
  - Specific section: estados de ferramenta (pending/running/completed/error)
  - Why: Exibir tool calls/results do Agent Lab com clareza.
  - **Key takeaways / Essential content:** componente colapsavel para input/output de tool; facilita refletir eventos `tool_call` e `tool_result`.

- [Attachments Component](https://sdk.vercel.ai/elements/components)
  - Specific section: variantes `grid`, `inline`, `list`
  - Why: padronizar anexos no input e nas mensagens.
  - **Key takeaways / Essential content:** detecta tipos de midia e oferece preview/remove com UX consistente.

### Patterns to Follow

**Naming Conventions:** manter padrao local (`ChatPanel`, hooks `use*`, arquivos em kebab-case para utilitarios) e separar primitives/adapter.

**Error Handling:** preservar padrao de feedback observavel do agent (`warn/error/finalSummary`), sem swallow silencioso.

**Logging Pattern:** manter o EventBus do `lab/agent` como fonte de verdade; UI apenas projeta estado.

**Other Relevant Patterns:**
- Storybook-first para UI relevante antes de integrar no app.
- Reaproveitar shell atual (`AppLayout`) sem alterar estrutura macro.
- Migracao incremental com fallback (feature flag ou switch local) ate estabilizar.

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation (Storybook + UI primitives AI Elements)
**Tasks:** criar casca de chat AI Elements, mapear fixtures e cobrir todas as variacoes visuais prioritarias.

### Phase 2: Core Implementation (Renderer adapter + event projection)
**Tasks:** ligar eventos do Agent Lab a message parts e renderizar tool/source/summary no painel real.

### Phase 3: Integration (IPC transport Electron)
**Tasks:** implementar canal de streaming via IPC entre renderer/preload/main com sessao e cancelamento.

### Phase 4: Testing & Validation
**Tasks:** validar visualmente no Storybook e no app Electron, garantir typecheck e regressao basica.

---

## STEP-BY-STEP TASKS

Execute every task in order, top to bottom. Each task is atomic and independently testable.

**Task format guidelines:** CREATE | UPDATE | ADD | REMOVE | REFACTOR | MIRROR

### CREATE `src/renderer/src/components/app/chat-ai-elements/ChatPanelAI.tsx`
- **IMPLEMENT**: Compor painel com `Conversation`, `Message`, `PromptInput`, `ConversationScrollButton`, `ConversationEmptyState`.
- **PATTERN**: `src/renderer/src/components/app/ChatPanel.tsx`
- **IMPORTS**: componentes AI Elements + `cn` + tipos locais.
- **GOTCHA**: manter largura, bordas e encaixe visual do shell atual.
- **VALIDATE**: `pnpm typecheck`

### CREATE `lab/storybook/stories/screens/chat-ai-elements.stories.tsx`
- **IMPLEMENT**: Stories cobrindo `empty`, `default`, `long`, `busy`, `attachments`, `sources`, `tool-running`, `tool-error`, `narrow`.
- **PATTERN**: `lab/storybook/stories/screens/chat-panel.stories.tsx`
- **IMPORTS**: fixtures atuais + mocks de parts para tools e sources.
- **GOTCHA**: garantir compatibilidade de imports no workspace Storybook.
- **VALIDATE**: `pnpm lab:storybook:build`

### UPDATE `src/renderer/src/components/app/AppLayout.tsx`
- **IMPLEMENT**: permitir troca controlada entre `ChatPanel` atual e `ChatPanelAI` (feature toggle temporario).
- **PATTERN**: toggle atual de painel direito.
- **IMPORTS**: novo componente AI + tipos.
- **GOTCHA**: nao quebrar fluxo atual de abertura/fechamento lateral.
- **VALIDATE**: `pnpm typecheck`

### CREATE `src/renderer/src/components/app/chat-ai-elements/use-agent-chat-adapter.ts`
- **IMPLEMENT**: adapter que transforma eventos de agente em lista de mensagens/parts para AI Elements.
- **PATTERN**: semantica de eventos em `lab/agent/src/cli/events.ts`.
- **IMPORTS**: tipos compartilhados e utilitarios de normalizacao.
- **GOTCHA**: agrupar deltas de texto, preservar ordem por `seq`, nao perder `final_summary`.
- **VALIDATE**: `pnpm typecheck`

### CREATE `src/renderer/src/components/app/chat-ai-elements/message-part-renderer.tsx`
- **IMPLEMENT**: renderer de parts:
  - `text` -> `MessageResponse`
  - `tool-*` -> `Tool` + `ToolHeader`/`ToolContent`/`ToolInput`/`ToolOutput`
  - `source-url` -> `Sources`
  - anexos -> `Attachments`
- **PATTERN**: componentes AI Elements docs.
- **IMPORTS**: `message`, `tool`, `sources`, `attachments`.
- **GOTCHA**: fallback seguro para parts desconhecidos.
- **VALIDATE**: `pnpm typecheck`

### CREATE `src/shared/ipc-chat.ts`
- **IMPLEMENT**: contrato IPC tipado do chat (requests, streaming events e erros).
- **PATTERN**: convencoes de `src/shared/ipc-schema.ts` (schema + tipagem).
- **IMPORTS**: `zod` e tipos compartilhados.
- **GOTCHA**: incluir cancelamento e `sessionId`.
- **VALIDATE**: `pnpm typecheck`

### CREATE `src/main/ipc/chat-stream.ts`
- **IMPLEMENT**: handler no main que inicia execucao do agent e publica eventos incrementais para renderer.
- **PATTERN**: handlers IPC existentes do projeto (main/preload tipado).
- **IMPORTS**: runtime agent + contrato compartilhado.
- **GOTCHA**: isolamento de sessao, limpeza de listeners e erro terminal sempre emitido.
- **VALIDATE**: `pnpm typecheck`

### CREATE `src/preload/chat-bridge.ts`
- **IMPLEMENT**: API segura no contextBridge para start/send/cancel/subscribe de stream.
- **PATTERN**: preload tipado atual.
- **IMPORTS**: contrato de IPC e wrappers de evento.
- **GOTCHA**: nao expor primitives perigosas; API minima e typed.
- **VALIDATE**: `pnpm typecheck`

### UPDATE `src/renderer/src/components/app/chat-ai-elements/ChatPanelAI.tsx`
- **IMPLEMENT**: trocar mock transport por bridge IPC (fase 3).
- **PATTERN**: integracao incremental com adapter.
- **IMPORTS**: hook adapter + bridge preload.
- **GOTCHA**: status de conexao (`ready/streaming/error`) sincronizado com submit.
- **VALIDATE**: `pnpm typecheck`

### UPDATE `lab/storybook/stories/screens/chat-ai-elements.stories.tsx`
- **IMPLEMENT**: adicionar variacoes equivalentes ao comportamento final (tool retries, source citations, branch de resposta se aplicavel).
- **PATTERN**: matriz de stories atual.
- **IMPORTS**: fixtures finais do adapter.
- **GOTCHA**: manter storys deterministicas e sem dependencia de IPC.
- **VALIDATE**: `pnpm lab:storybook:build`

### REFACTOR `src/renderer/src/components/app/ChatPanel.tsx` (opcional apos estabilizar)
- **IMPLEMENT**: transformar em wrapper da versao AI Elements ou remover gradualmente componentes legados.
- **PATTERN**: migracao incremental sem quebra.
- **IMPORTS**: minimos necessarios.
- **GOTCHA**: manter API de props compativel durante transicao.
- **VALIDATE**: `pnpm typecheck`

---

## TESTING STRATEGY

### Unit Tests
- Testar adapter de eventos -> parts (ordem, merge de delta, mapping de tool states).
- Testar normalizacao de erro/fallback para eventos desconhecidos.

### Integration Tests
- Renderer + preload mock: enviar stream sintetico e validar render final.
- Main IPC handler: start -> delta -> tool -> summary -> done.

### Edge Cases
- Sessao cancelada durante stream.
- Tool com erro sem output.
- Mensagem muito longa com multiplos deltas.
- Reconexao de renderer com stream em andamento.
- Ausencia de sources/anexos sem quebrar layout.

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
- `pnpm typecheck`

### Level 2: Unit Tests
- `pnpm --dir lab/agent run test`

### Level 3: Integration Tests
- `pnpm test` (ou comando equivalente do renderer/main se existir no projeto)

### Level 4: Manual Validation
- `pnpm dev` (app)
- `pnpm lab:storybook` (stories)

### Level 5: Additional (e.g. MCP)
- Validar docs AI Elements atualizadas antes de remover fallback legado.

---

## ACCEPTANCE CRITERIA

- [ ] Chat lateral usa AI Elements como camada principal de UI.
- [ ] Estados essenciais (empty, streaming, tools, sources, attachments) estao cobertos em Storybook.
- [ ] Eventos do Agent Lab aparecem no chat em tempo real com semantica correta.
- [ ] Transporte de producao via IPC no Electron funciona com cancelamento e sessao.
- [ ] Layout da shell permanece estavel (sem regressao de abertura/fechamento do painel direito).

---

## VISUAL / E2E CHECKS (opcional -- preencher quando a feature tiver UI ou Electron)

**Tipo de teste:** [x] Electron (CDP)  [x] Web (localhost/Storybook)

**Passos (Storybook):**
1. Abrir Storybook na story `screens/chat-ai-elements`.
2. Verificar `empty`, `busy`, `tool-running`, `tool-error`, `sources`, `attachments`.
3. Capturar screenshot das variacoes aprovadas.

**Passos (Electron app):**
1. Iniciar app Electron com painel direito aberto e snapshot inicial.
2. Enviar prompt curto; validar transicao `ready -> streaming -> ready`.
3. Disparar fluxo com tool call; validar bloco `Tool` com estado e output.
4. Validar renderizacao de fontes (`Sources`) quando evento/parte existir.
5. Fechar/reabrir painel direito e confirmar preservacao de estado da sessao.
6. Screenshot final do fluxo completo.

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Each task validation passed
- [ ] All validation commands executed successfully
- [ ] Full test suite passes
- [ ] No linting/type errors
- [ ] Manual testing confirms feature works
- [ ] Acceptance criteria met

---

## NOTES

- Inspiracao de produto/ux:
  - **Cline**: foco em fluxo aguentico com observabilidade de tools e contexto.
  - **Void**: referencia de experiencia IDE-like em Electron.
- Como o workspace local nao possui espelho de `.agents/inspirations/` nesta sessao, a referencia de Cline/Void foi consolidada por pesquisa externa e pelos principios do manifesto interno.
- Diretriz arquitetural: AI Elements como camada de apresentacao; EventBus/runner do `lab/agent` continuam como motor de orquestracao e confiabilidade.
