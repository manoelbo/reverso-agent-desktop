# Feature: ChatPanel AI Elements estatico com 5 cenarios no Interface Lab

The following plan should be complete, but it is important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils, types and models. Import from the right files etc.

## Feature Description

Construir no `lab/agent/interface` uma pagina unica com **5 ChatPainel estaticos** (um abaixo do outro), baseados em **AI Elements** e com a mesma base visual do app atual (tokens, fontes, tema). Cada painel deve manter a mesma estrutura:

- **Body**: combinacoes de componentes AI Elements para simular estados reais de conversa/agente.
- **Footer**: `PromptInput` completo com `Context` integrado dentro do footer.

O objetivo e validar encaixe visual, densidade de informacao e composicao dos componentes no stack atual antes da integracao com runtime real (Electron + IPC + stream).

## User Story

As a desenvolvedor do Reverso Agent
I want uma tela unica no sandbox com 5 variacoes estaticas de ChatPainel usando AI Elements
So that eu valide rapidamente UX, hierarquia visual e compatibilidade de estilos antes de integrar no app Electron.

## Problem Statement

- O sandbox atual em `lab/agent/interface` ja replica tema/tokens, mas ainda esta em demonstracoes genericas e nao cobre a composicao completa de um ChatPainel AI-native.
- O pedido exige paridade com exemplos do AI Elements e um layout de exploracao comparativa (5 cenarios) para decisao de produto/UI.
- Sem um plano estruturado, existe risco de:
  - misturar padroes antigos de chat com padroes AI Elements;
  - montar cenarios sem aderencia ao output do `lab/agent`;
  - dificultar migracao futura para Electron por falta de separacao entre camada estatica e futura camada de transporte.

## Solution Statement

Adotar um plano em camadas dentro do sandbox:

1. **Foundation AI Elements no `interface`**: completar o conjunto de componentes AI Elements faltantes, mantendo os existentes (`prompt-input`, `attachments`, `model-selector`) e adicionando os demais de forma modular.
2. **Modelagem estatica de dados**: criar fixtures de mensagens, tools, reasoning, queue, terminal e erros inspirados no formato real de eventos do `lab/agent`.
3. **Composicao de ChatPainel reutilizavel**: criar shell `Body + Footer` e montar 5 cenarios na mesma pagina (stack vertical), com footer consistente.
4. **Validacao visual e tecnica**: typecheck/build/dev smoke no sandbox e checklist visual para garantir aderencia de estilo e proximidade com exemplos AI Elements.

## Feature Metadata

**Feature Type**: Enhancement  
**Estimated Complexity**: High  
**Primary Systems Affected**: `lab/agent/interface`, `lab/agent` (apenas como referencia de fixtures), estilos compartilhados do renderer  
**Dependencies**: AI Elements package/registry, `ai`, `@ai-sdk/react` (para tipos/compatibilidade futura), `lucide-react`, `nanoid`, `cmdk`, `ansi-to-react`, `react-jsx-parser`, `streamdown`, `tokenlens` (para `Context`)

---

## CONTEXT REFERENCES

### Relevant Codebase Files -- IMPORTANT: YOU MUST READ THESE BEFORE IMPLEMENTING!

- `lab/agent/interface/src/App.tsx` (lines 1-228) - Tela atual do sandbox; sera substituida por pagina de cenarios ChatPainel.
- `lab/agent/interface/src/assets/main.css` (lines 1-164) - Fonte/tokens/tailwind theme de referencia para manter paridade visual com app principal.
- `lab/agent/interface/src/main.tsx` (lines 1-12) - Entrypoint atual; ponto de montagem permanece.
- `lab/agent/interface/vite.config.ts` (lines 1-18) - Alias e `server.fs.allow`; manter ao expandir componentes.
- `lab/agent/interface/package.json` (lines 1-12) - Scripts locais; recebera dependencias necessarias para AI Elements completo.
- `lab/agent/interface/src/lib/utils.ts` (lines 1-6) - `cn()` padrao que deve ser reutilizado.
- `lab/agent/interface/src/components/ai-elements/prompt-input.tsx` (lines 1-1464) - Componente ja existente e robusto; deve ser mantido como base do Footer.
- `lab/agent/interface/src/components/ai-elements/attachments.tsx` (lines 1-427) - Padrao de anexos AI Elements ja disponivel no sandbox.
- `lab/agent/interface/src/components/ai-elements/model-selector.tsx` (lines 1-214) - Exemplo de composicao AI Elements local, util para manter consistencia.
- `src/renderer/src/components/app/ChatPanel.tsx` (lines 1-79) - Contrato de layout atual do painel (`header/timeline/composer`) para orientar shell Body/Footer.
- `src/renderer/src/components/app/chat/mock-data.ts` (lines 1-93) - Padrão de fixtures de estados de chat usado no projeto.
- `lab/storybook/stories/screens/chat-panel.stories.tsx` (lines 1-221) - Matriz de variacoes visuais que inspira os 5 cenarios na mesma tela.
- `lab/agent/src/runner/run-agent.ts` (lines 193-380) - Semantica do feedback (`step`, `info`, `final_summary`) para desenhar dados estaticos realistas.
- `lab/agent/filesystem/events/agent-2026-03-12T18-14-51-728Z.jsonl` (lines 1-7) - Exemplo real de output de sessao para fixture de terminal/queue/summary.

### New Files to Create

- `lab/agent/interface/src/components/ai-elements/conversation.tsx` - Primitive de conversa e scroll.
- `lab/agent/interface/src/components/ai-elements/message.tsx` - Suite completa de mensagens (branch/actions/response).
- `lab/agent/interface/src/components/ai-elements/plan.tsx` - Componente de plano colapsavel.
- `lab/agent/interface/src/components/ai-elements/queue.tsx` - Lista de tarefas/pendencias colapsavel.
- `lab/agent/interface/src/components/ai-elements/reasoning.tsx` - Bloco de reasoning com estado streaming estatico.
- `lab/agent/interface/src/components/ai-elements/sources.tsx` - Citacoes/fontes.
- `lab/agent/interface/src/components/ai-elements/tool.tsx` - Estados de tool invocation.
- `lab/agent/interface/src/components/ai-elements/code-block.tsx` - Bloco de codigo para markdown gerado.
- `lab/agent/interface/src/components/ai-elements/jsx-preview.tsx` - Preview de JSX estatico.
- `lab/agent/interface/src/components/ai-elements/stack-trace.tsx` - Render de erro com stack.
- `lab/agent/interface/src/components/ai-elements/terminal.tsx` - Terminal com output ANSI.
- `lab/agent/interface/src/components/ai-elements/suggestion.tsx` - Sugestoes clicaveis.
- `lab/agent/interface/src/components/ai-elements/context.tsx` - Context window/custos para embutir no footer.
- `lab/agent/interface/src/mock/chatpanel-scenarios.ts` - Dados estaticos dos 5 cenarios.
- `lab/agent/interface/src/components/chat-panel/ChatPanelShell.tsx` - Shell `Body + Footer`.
- `lab/agent/interface/src/components/chat-panel/ChatPanelScenarioCard.tsx` - Container visual por cenario.
- `lab/agent/interface/src/components/chat-panel/ChatPanelBody*.tsx` - Blocos de body por cenario.

### Relevant Documentation -- YOU SHOULD READ THESE BEFORE IMPLEMENTING! (optional; add if Context7 was used)

- [AI Elements Overview](https://elements.ai-sdk.dev/)
  - Specific section: Overview + component index.
  - Why: Define o inventario oficial de componentes e a estrategia de composicao.
  - **Key takeaways / Essential content:** A biblioteca e baseada em `shadcn/ui`, composable e orientada a AI SDK; componentes podem ser adicionados via CLI com codigo fonte local. Isso favorece aderencia visual e controle total no sandbox.

- [Message](https://elements.ai-sdk.dev/components/message)
  - Specific section: Warning de `streamdown` + features de branching/actions.
  - Why: `MessageResponse` e o centro do Body e tem requisito de estilo adicional.
  - **Key takeaways / Essential content:** Para markdown renderizar corretamente, e necessario incluir `@source "../node_modules/streamdown/dist/*.js"` no CSS global. A suite cobre branch de respostas, actions e markdown/GFM.

- [Plan](https://elements.ai-sdk.dev/components/plan)
  - Specific section: props de `isStreaming` e composicao com header/content.
  - Why: Um dos blocos obrigatorios no Body.
  - **Key takeaways / Essential content:** E um card colapsavel para planos em progresso, com shimmer para streaming; funciona bem para exibir etapas de execucao em estado estatico.

- [Queue](https://elements.ai-sdk.dev/components/queue)
  - Specific section: QueueSection/QueueItem e estados completed/pending.
  - Why: Necessario para simular backlog e progresso do agente.
  - **Key takeaways / Essential content:** Estrutura composable para listas colapsaveis com indicadores de estado, ideal para mapear eventos `agent_step` e tarefas.

- [Reasoning](https://elements.ai-sdk.dev/components/reasoning)
  - Specific section: `isStreaming`, trigger/content e comportamento auto-open.
  - Why: Simular pensamento do agente em alguns cenarios.
  - **Key takeaways / Essential content:** O componente gerencia abertura/fechamento conforme streaming e pode consolidar reasoning em um unico bloco para evitar ruido visual.

- [Sources](https://elements.ai-sdk.dev/components/sources)
  - Specific section: `SourcesTrigger`, `SourcesContent`, `Source`.
  - Why: Exibir citacoes no Body.
  - **Key takeaways / Essential content:** Projetado para parts `source-url`; encaixa com o requisito editorial de rastreabilidade.

- [Tool](https://elements.ai-sdk.dev/components/tool)
  - Specific section: estados `input-streaming`, `input-available`, `output-available`, `output-error`.
  - Why: Simular invocacoes de ferramentas do agente.
  - **Key takeaways / Essential content:** Interface colapsavel com header de status e secoes input/output; permite mostrar sucesso/erro sem inventar UI custom.

- [JSX Preview](https://elements.ai-sdk.dev/components/jsx-preview)
  - Specific section: `isStreaming` e parse de JSX incompleto.
  - Why: Um dos blocos exigidos no Body.
  - **Key takeaways / Essential content:** Usa `react-jsx-parser`; permite injetar componentes custom e renderizar JSX de forma segura em contexto controlado.

- [Stack Trace](https://elements.ai-sdk.dev/components/stack-trace)
  - Specific section: parsing de stack e controle de frames internos.
  - Why: Cenario de erro tecnico do agente.
  - **Key takeaways / Essential content:** Renderiza trace JS/Node com copy/expand e destaque de tipo de erro; ideal para estado "tool output-error".

- [Terminal](https://elements.ai-sdk.dev/components/terminal)
  - Specific section: ANSI support + streaming flag.
  - Why: Simular logs do agente e aproximar da experiencia CLI.
  - **Key takeaways / Essential content:** Parseia ANSI e possui estado de streaming com cursor; encaixa diretamente com fixtures em JSONL/eventos.

- [Suggestion](https://elements.ai-sdk.dev/components/suggestion)
  - Specific section: `Suggestions` + `Suggestion`.
  - Why: Completar UX inicial de input no Body/Footer.
  - **Key takeaways / Essential content:** Fornece linha de sugestoes clicaveis e pode disparar preenchimento de prompt sem logica extra.

- [Prompt Input](https://elements.ai-sdk.dev/components/prompt-input)
  - Specific section: body/footer/tools/select/attachments e hooks.
  - Why: Footer padrao para os 5 cenarios.
  - **Key takeaways / Essential content:** Componente completo para composer com anexos e submit status; suporta composicao de ferramentas no footer.

- [Context](https://elements.ai-sdk.dev/components/context)
  - Specific section: `ContextTrigger`, `ContextContent`, uso de `tokenlens`.
  - Why: Requisito explicito de embutir context no footer do prompt-input.
  - **Key takeaways / Essential content:** Mostra consumo de janela de contexto/tokens/custo por modelo; demanda `modelId` e breakdown de usage para mock estatico realista.

### Patterns to Follow

**Naming Conventions:** manter PascalCase para componentes React, kebab-case para arquivos de plano e mocks por dominio (`chatpanel-scenarios.ts`), hooks iniciando com `use`.

**Error Handling:** seguir padrao de fallback seguro em UI (estado vazio, output-error explicito), sem quebrar render quando faltar parte opcional em fixture.

**Logging Pattern:** no sandbox, nao executar runtime real; espelhar semantica de feedback do `lab/agent` em dados estaticos (step/info/final_summary).

**Other Relevant Patterns:**
- Reutilizar `cn()` e tokens de `main.css`.
- Evitar criar primitives UI do zero quando AI Elements/shadcn ja cobrem o caso.
- Compor cenarios em blocos pequenos para facilitar migracao posterior ao renderer Electron.

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation
**Tasks:** preparar dependencias AI Elements completas e estruturar pastas modulares (`components/ai-elements`, `components/chat-panel`, `mock`).

### Phase 2: Core Implementation
**Tasks:** implementar suite de componentes AI Elements necessarios e shell de ChatPainel (`Body + Footer`), com footer unificado e context integrado.

### Phase 3: Integration
**Tasks:** montar os 5 cenarios estaticos na mesma `App.tsx`, um abaixo do outro, conectando cada body a fixtures inspiradas nos outputs reais do agente.

### Phase 4: Testing & Validation
**Tasks:** executar typecheck/build/smoke visual local e validar checklist de fidelidade (tema, fontes, spacing, estados dos componentes).

---

## STEP-BY-STEP TASKS

Execute every task in order, top to bottom. Each task is atomic and independently testable.

**Task format guidelines:** CREATE | UPDATE | ADD | REMOVE | REFACTOR | MIRROR

### UPDATE `lab/agent/interface/package.json`
- **IMPLEMENT**: adicionar dependencias faltantes para AI Elements completo (`ai`, `@ai-sdk/react`, `lucide-react`, `nanoid`, `cmdk`, `ansi-to-react`, `react-jsx-parser`, `streamdown`, `tokenlens` e correlatas exigidas pelos componentes escolhidos).
- **PATTERN**: `lab/agent/interface/package.json`
- **IMPORTS**: N/A
- **GOTCHA**: manter scripts atuais e evitar conflito com versoes do workspace.
- **VALIDATE**: `pnpm --dir lab/agent/interface install && pnpm --dir lab/agent/interface typecheck`

### UPDATE `lab/agent/interface/src/assets/main.css`
- **IMPLEMENT**: incluir requisitos de estilo adicionais dos componentes AI Elements (especialmente `streamdown` para `MessageResponse`).
- **PATTERN**: `lab/agent/interface/src/assets/main.css` (tokens e tema ja existentes)
- **IMPORTS**: `@source "../node_modules/streamdown/dist/*.js"` (conforme doc do Message)
- **GOTCHA**: nao alterar variaveis base de cor/fonte ja alinhadas ao app principal.
- **VALIDATE**: `pnpm --dir lab/agent/interface build`

### CREATE `lab/agent/interface/src/components/ai-elements/{conversation,message,plan,queue,reasoning,sources,tool,code-block,jsx-preview,stack-trace,terminal,suggestion,context}.tsx`
- **IMPLEMENT**: portar/adicionar componentes AI Elements completos para uso local, mantendo API proxima dos exemplos oficiais.
- **PATTERN**: `lab/agent/interface/src/components/ai-elements/prompt-input.tsx`, `.../attachments.tsx`, `.../model-selector.tsx`
- **IMPORTS**: primitives de `@/components/ui/*`, tipos de `ai`, utilitarios locais.
- **GOTCHA**: manter componentes desacoplados de transporte real (somente render estatico).
- **VALIDATE**: `pnpm --dir lab/agent/interface typecheck`

### CREATE `lab/agent/interface/src/mock/chatpanel-scenarios.ts`
- **IMPLEMENT**: definir 5 cenarios estaticos com dados completos:
  1. Conversa padrao com sugestoes + fontes.
  2. Fluxo com reasoning + plano + queue.
  3. Fluxo com tool running/completed + terminal.
  4. Fluxo de erro com stack-trace + tool error.
  5. Fluxo de geracao markdown/JSX com code-block + jsx-preview.
- **PATTERN**: `src/renderer/src/components/app/chat/mock-data.ts`, `lab/agent/filesystem/events/*.jsonl`
- **IMPORTS**: tipos locais dos novos componentes AI Elements.
- **GOTCHA**: manter footer igual nos 5 cenarios e body variavel por composicao.
- **VALIDATE**: `pnpm --dir lab/agent/interface typecheck`

### CREATE `lab/agent/interface/src/components/chat-panel/ChatPanelShell.tsx`
- **IMPLEMENT**: shell padrao do cenario com estrutura explicita `Body` e `Footer`, recebendo slots/componentes por props.
- **PATTERN**: `src/renderer/src/components/app/ChatPanel.tsx`
- **IMPORTS**: `PromptInput` + `Context` + componentes utilitarios de layout.
- **GOTCHA**: footer identico em todos cenarios (somente dados variam).
- **VALIDATE**: `pnpm --dir lab/agent/interface typecheck`

### CREATE `lab/agent/interface/src/components/chat-panel/ChatPanelBody*.tsx`
- **IMPLEMENT**: componentes de body especializados por cenario, cada um combinando os blocos AI Elements requisitados.
- **PATTERN**: composicao por secoes usada em `lab/agent/interface/src/App.tsx` atual
- **IMPORTS**: novos componentes de `components/ai-elements`
- **GOTCHA**: evitar duplicacao excessiva; extrair blocos reutilizaveis (ex.: bloco de fontes, bloco de terminal, bloco de tool).
- **VALIDATE**: `pnpm --dir lab/agent/interface typecheck`

### UPDATE `lab/agent/interface/src/App.tsx`
- **IMPLEMENT**: substituir demo atual por pagina unica com 5 ChatPainel em coluna (`gap` consistente), com titulo de cada cenario e descricao curta.
- **PATTERN**: layout scrollavel atual em `lab/agent/interface/src/App.tsx` e matriz de estados de `lab/storybook/stories/screens/chat-panel.stories.tsx`
- **IMPORTS**: `ChatPanelShell`, bodies de cenario, fixtures.
- **GOTCHA**: manter toggle de tema global, performance aceitavel e leitura clara de um cenario para outro.
- **VALIDATE**: `pnpm --dir lab/agent/interface build`

### REFACTOR `lab/agent/interface/src/App.tsx` (ajuste final de fidelidade)
- **IMPLEMENT**: ajustar spacing, hierarquia tipografica, bordas e densidade visual para aproximar dos exemplos AI Elements sem quebrar o tema Reverso.
- **PATTERN**: tokens de `main.css` + exemplos de composicao no site AI Elements.
- **IMPORTS**: N/A
- **GOTCHA**: nao descaracterizar identidade visual do projeto (fontes/tokens locais continuam fonte de verdade).
- **VALIDATE**: `pnpm --dir lab/agent/interface dev`

---

## TESTING STRATEGY

### Unit Tests
- Cobrir funcoes utilitarias de fixtures (formatacao de status/tool/result/context usage) se forem extraidas para helpers.

### Integration Tests
- Smoke de render da pagina completa com os 5 cenarios para garantir que todos componentes coexistem sem conflito.

### Edge Cases
- Cenario sem fontes.
- Cenario com `tool output-error`.
- Cenario com markdown incompleto no `MessageResponse`.
- Cenario com payload grande no `Terminal`.
- Cenario com `Context` sem custo (fallback visual).

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
- `pnpm --dir lab/agent/interface typecheck`

### Level 2: Unit Tests
- `pnpm --dir lab/agent/interface typecheck` (na ausencia de suite dedicada no sandbox)

### Level 3: Integration Tests
- `pnpm --dir lab/agent/interface build`

### Level 4: Manual Validation
- `pnpm --dir lab/agent/interface dev`
- Abrir `http://127.0.0.1:<port>` e validar os 5 paineis em sequencia.

### Level 5: Additional (e.g. MCP)
- Conferir visual com tema `light` e `dark` e comparar com exemplos AI Elements para paridade de comportamento.

---

## ACCEPTANCE CRITERIA

- [ ] A pagina `lab/agent/interface/src/App.tsx` renderiza 5 ChatPainel estaticos, um abaixo do outro.
- [ ] Cada ChatPainel segue estrutura fixa `Body + Footer`.
- [ ] O Footer usa `PromptInput` completo e inclui `Context` integrado.
- [ ] Todos os componentes listados pelo usuario aparecem em pelo menos um dos 5 bodies.
- [ ] Estilo/fonte/tema permanecem alinhados com `src/renderer/src/assets/main.css`.
- [ ] Dados exibidos refletem semantica realista do `lab/agent` (steps, tools, summary, erros), mesmo sendo estaticos.

---

## VISUAL / E2E CHECKS (opcional -- preencher quando a feature tiver UI ou Electron)

**Tipo de teste:** [ ] Electron (CDP)  [x] Web (localhost/URL)

**Passos (exemplo):**
1. Subir `pnpm --dir lab/agent/interface dev` e abrir a URL local.
2. Verificar que existem exatamente 5 cards/paineis de cenario em stack vertical.
3. Em cada cenario, validar `Body` (componentes especificos) e `Footer` (PromptInput + Context).
4. Alternar tema `light/dark` e confirmar legibilidade, bordas e contrastes.
5. Tirar screenshot de cada cenario para aprovacao visual.

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

- O sandbox atual ja contem parte de AI Elements (`prompt-input`, `attachments`, `model-selector`), entao a implementacao deve priorizar extensao incremental e nao reescrita total.
- Como o objetivo e "igual aos exemplos", a estrategia recomendada e usar componentes oficiais AI Elements como fonte primaria de estrutura/API e ajustar somente tokens/layout para encaixe no tema local.
- A primeira entrega permanece 100% estatica; o plano nao inclui transporte real (IPC/stream), mas prepara estrutura para migracao futura com baixo retrabalho.
