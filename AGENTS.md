# AGENTS.md — learned preferences and workspace facts

## Learned User Preferences

- Sempre responder em Português Brasileiro.
- Ao executar `continual-learning`, usar processamento incremental via `.cursor/hooks/state/continual-learning-index.json`, atualizando entradas existentes no `AGENTS.md` (não apenas append) e removendo do índice transcripts deletados.
- Preferir feedback de execução no estilo agente (streaming/progresso no terminal) e deixar a conclusão/instrução final na resposta de chat.
- Em tarefas de UI (Storybook, `lab/agent/interface` e Electron), adotar abordagem shadcn-first: buscar/importar primeiro em `shadcn/ui` e `shadcnblocks`, depois validar por inspeção no navegador (snapshot/árvore/texto), sem screenshot no fluxo diário.
- Na UI do produto, padronizar textos visíveis em inglês por padrão.
- Em UI, explorar múltiplas variações no Storybook e só aplicar no componente real após escolha explícita; quando pedir algo diferente, priorizar importar/testar outros blocos/componentes antes de redesenhar do zero.
- Para doc-process (process-all, process-queue, rerun, watch), usar por padrão o modo de feedback "visual" (caixas no terminal), como em init/dig/create-lead.
- Do not write "proximos passos" or next-step guidance into Markdown artifact files; return that guidance only in terminal/conversation feedback.
- Do not implement token budgeting for `dig` (or similar incremental preview processing); process available previews until they run out.
- Para a V1, priorizar interface no Electron orientada a comandos de CLI (ChatPanel command-driven): sem chat livre, input `/comando` e saída no terminal da UI; usar o CLI como backend de execução da interface.
- Checkpoint/Revert System foi explicitamente excluído dos planos — não implementar nem re-sugerir em sprints futuros.
- No Electron, wikilinks/backlinks devem aparecer também em `sources/preview.md`; links clicados devem abrir o documento renderizado alvo (não a home da seção), e o pós-`inquiry-all` deve orientar revisão de `allegations/findings` com verificação nas fontes originais.

## Learned Workspace Facts

- Agent Lab investigation flow is split into stages: `init` -> `deep-dive` (legacy alias: `dig`) -> `create-lead` (planning only) -> `inquiry` (execution).
- `create-lead` must produce only lead context + Inquiry Plan; allegations/findings are generated later by `inquiry`.
- Inquiry outputs are stored globally under `lab/agent/filesystem/investigation/allegations/` and `lab/agent/filesystem/investigation/findings/`, linked back to the lead.
- `document-processing` tem dois modos: `standard` (padrão — gera `preview.md`, `index.md`, `metadata.md`) e `deep` (gera `replica.md` com máxima fidelidade, um documento por vez).
- O projeto possui um laboratório de Storybook em `lab/storybook`, com stories para `ui`, `blocks` e `screens`, usado para experimentar componentes antes da integração final.
- Existe um ambiente isolado para interface do agente em `lab/agent/interface`, usado para prototipar e validar UI antes da integração no app principal; telas de referência vão em `lab/agent/interface/src/screens/`.
- O CLI do Agent Lab possui entrada conversacional direta: `pnpm reverso agent --text/--prompt` e `pnpm reverso --text/--prompt`, com roteamento por sessão (`deep-dive-session`) e estado de leads.
- Na integração de Sources do app Electron, o backend local opera no `workspaceRoot/sources` (com scaffold automático de `sources/`, `sources/.artifacts/` e `source-checkpoint.json`) sem fallback para `output_examples`.
- Na integração de Leads, o backend usa `investigation/leads/lead-checkpoint.json` como fonte de verdade de status (`planned`, `in_progress`, `done`, `blocked`) para manter UI e runners sincronizados.
- O fluxo de `inquiry`/`inquiry-all` da versão atual opera sem bloqueio por aprovação explícita; arquivos auxiliares (`*.inquiry-diagnostics.md`, `*.evidence-review.md`) não devem ser tratados como leads reais.
- `output_examples/` é o ambiente padrão para smoke tests reais do agente; é permitido limpar artefatos/outputs gerados, mas nunca apagar PDFs originais em `output_examples/sources/`.
- Test mode usa `filesystem_test/` (cópia de `filesystem/`) para todos os testes — o `filesystem/` real nunca é tocado. Ativado via `AGENT_FILESYSTEM_DIR=filesystem_test` e `AGENT_TEST_MODE=true`; scripts: `pnpm serve:test`, `pnpm reset:chat|investigation|sources-artefacts|all`, `pnpm <comando>:test` (ex.: `pnpm dig:test`). O script `src/scripts/reset-test.ts` faz reset direto sem precisar do servidor.
