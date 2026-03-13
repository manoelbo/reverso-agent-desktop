# AGENTS.md — learned preferences and workspace facts

## Learned User Preferences

- Sempre responder em Português Brasileiro.
- Ao executar `continual-learning`, usar processamento incremental via `.cursor/hooks/state/continual-learning-index.json`, atualizando entradas existentes no `AGENTS.md` (não apenas append) e removendo do índice transcripts deletados.
- Preferir feedback de execução no estilo agente (streaming/progresso no terminal) e deixar a conclusão/instrução final na resposta de chat.
- Em tarefas de UI, validar navegando no app (Electron) e, quando for trabalho de componente, validar também no Storybook antes de concluir.
- Em UI, preferir workflow de exploração com múltiplas variações no Storybook e só aplicar no componente real após escolha explícita.
- Em refactors de UI, preferir quebrar componentes grandes em subcomponentes menores e expor cada parte em stories isoladas.
- Para doc-process (process-all, process-queue, rerun, watch), usar por padrão o modo de feedback "visual" (caixas no terminal), como em init/dig/create-lead.
- Do not write "proximos passos" or next-step guidance into Markdown artifact files; return that guidance only in terminal/conversation feedback.
- Do not implement token budgeting for `dig` (or similar incremental preview processing); process available previews until they run out.

## Learned Workspace Facts

- Agent Lab investigation flow is split into stages: `init` -> `deep-dive` (legacy alias: `dig`) -> `create-lead` (planning only) -> `inquiry` (execution).
- `create-lead` must produce only lead context + Inquiry Plan; allegations/findings are generated later by `inquiry`.
- Inquiry outputs are stored globally under `lab/agent/filesystem/investigation/allegations/` and `lab/agent/filesystem/investigation/findings/`, linked back to the lead.
- `document-processing` has two operation modes: `standard` (default pipeline) and `deep` (replica generation with maximum fidelity, typically one document at a time).
- In `standard`, `preview.md`, `index.md`, and `metadata.md` are artifact-level outputs; `replica.md` remains a `deep` output and should be preserved.
- O comando `/test-ui-electron` e o fluxo padrão de teste visual no app Electron, com snapshots/screenshots e dependência de CDP ativo.
- O projeto possui um laboratório de Storybook em `lab/storybook`, com stories para `ui`, `blocks` e `screens`, usado para experimentar componentes antes da integração final.
- O `AppSidebar` foi modularizado em subcomponentes em `src/renderer/src/components/app/sidebar/` (header, section, menu item, collapsible menu item e footer).
- O comando `/storybook-variants` repete o fluxo: especificar componente(s) e objetivo → agente cria variações no Storybook (pequenas e grandes) → usuário escolhe qual → agente implementa no componente real usando a story como fonte de verdade (respeitando edições feitas no Storybook).
- O CLI do Agent Lab possui entrada conversacional direta: `pnpm reverso agent --text/--prompt` e `pnpm reverso --text/--prompt`, com roteamento por sessão (`deep-dive-session`) e estado de leads.
