# AGENTS.md — learned preferences and workspace facts

## Learned User Preferences

- Sempre responder em Português Brasileiro.
- Ao executar `continual-learning`, usar processamento incremental via `.cursor/hooks/state/continual-learning-index.json`, atualizando entradas existentes no `AGENTS.md` (não apenas append) e removendo do índice transcripts deletados.
- Preferir feedback de execução no estilo agente (streaming/progresso no terminal) e deixar a conclusão/instrução final na resposta de chat.
- Em tarefas de UI (Storybook, `lab/agent/interface` e Electron), adotar abordagem shadcn-first: buscar/importar primeiro em `shadcn/ui` e `shadcnblocks`, depois validar por inspeção no navegador (snapshot/árvore/texto), sem screenshot no fluxo diário.
- Em UI, explorar múltiplas variações no Storybook e só aplicar no componente real após escolha explícita; quando pedir algo diferente, priorizar importar/testar outros blocos/componentes antes de redesenhar do zero.
- No chat do agente, usar AI Elements (Vercel) como base padrão de componentes, com composição antes de customização.
- Em refactors de UI, preferir quebrar componentes grandes em subcomponentes menores e expor cada parte em stories isoladas.
- Para doc-process (process-all, process-queue, rerun, watch), usar por padrão o modo de feedback "visual" (caixas no terminal), como em init/dig/create-lead.
- Do not write "proximos passos" or next-step guidance into Markdown artifact files; return that guidance only in terminal/conversation feedback.
- Do not implement token budgeting for `dig` (or similar incremental preview processing); process available previews until they run out.
- Tratar o agente como 100% interface-driven; CLI (`pnpm reverso`) é apenas para testes. Ao criar ou refazer a camada de feedback, partir de uma implementação nova orientada à UI — nunca adaptar a implementação CLI existente.
- Checkpoint/Revert System foi explicitamente excluído dos planos — não implementar nem re-sugerir em sprints futuros.

## Learned Workspace Facts

- Agent Lab investigation flow is split into stages: `init` -> `deep-dive` (legacy alias: `dig`) -> `create-lead` (planning only) -> `inquiry` (execution).
- `create-lead` must produce only lead context + Inquiry Plan; allegations/findings are generated later by `inquiry`.
- Inquiry outputs are stored globally under `lab/agent/filesystem/investigation/allegations/` and `lab/agent/filesystem/investigation/findings/`, linked back to the lead.
- `document-processing` tem dois modos: `standard` (padrão — gera `preview.md`, `index.md`, `metadata.md`) e `deep` (gera `replica.md` com máxima fidelidade, um documento por vez).
- O projeto possui um laboratório de Storybook em `lab/storybook`, com stories para `ui`, `blocks` e `screens`, usado para experimentar componentes antes da integração final.
- Existe um ambiente isolado para interface do agente em `lab/agent/interface`, usado para prototipar e validar UI antes da integração no app principal; telas de referência vão em `lab/agent/interface/src/screens/`.
- O `AppSidebar` foi modularizado em subcomponentes em `src/renderer/src/components/app/sidebar/` (header, section, menu item, collapsible menu item e footer).
- O comando `/storybook-variants` repete o fluxo: especificar componente(s) e objetivo → agente cria variações no Storybook (pequenas e grandes) → usuário escolhe qual → agente implementa no componente real usando a story como fonte de verdade (respeitando edições feitas no Storybook).
- O CLI do Agent Lab possui entrada conversacional direta: `pnpm reverso agent --text/--prompt` e `pnpm reverso --text/--prompt`, com roteamento por sessão (`deep-dive-session`) e estado de leads.
- A shell de chat em `lab/agent/interface` usa AI Elements: `Conversation > ConversationContent > ConversationEmptyState` (vazio) ou `Message > MessageContent > MessageResponse` (mensagens), `Loader` para status submitted, `Suggestions` no estado vazio; `PromptInput` sem `PromptInputProvider` usa `value`/`onChange` controlados no `PromptInputTextarea` e o handler de submit lê `(message.text || input).trim()` como fallback. O componente `Loader` não existe no registry e deve ser criado manualmente em `src/components/ai-elements/loader.tsx`.
- O servidor de integração agente-interface fica em `lab/agent/src/server/` (HTTP + SSE, porta 3210); a camada de feedback é `UiFeedbackController` / `SseUiFeedback`, emitindo eventos semânticos: `route-decision`, `status`, `text-delta`, `step-start`, `step-complete`, `step-error`, `tool-call`, `tool-result`, `plan`, `plan-step-update`, `source-reference`, `approval-request`, `token-usage`, `done`, `error`; sessões persistidas em `filesystem/sessions/chat/{id}.json`; `approval-gate.ts` bloqueia SSE com Promise até o frontend responder via `POST /api/approval/:requestId`.
- Test mode usa `filesystem_test/` (cópia de `filesystem/`) para todos os testes — o `filesystem/` real nunca é tocado. Ativado via `AGENT_FILESYSTEM_DIR=filesystem_test` e `AGENT_TEST_MODE=true`; scripts: `pnpm serve:test`, `pnpm reset:chat|investigation|sources-artefacts|all`, `pnpm <comando>:test` (ex.: `pnpm dig:test`). O script `src/scripts/reset-test.ts` faz reset direto sem precisar do servidor.
