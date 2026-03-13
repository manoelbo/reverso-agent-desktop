# Feature: P0 Inquiry Reliability Hardening

The following plan should be complete, but it is important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils, types and models. Import from the right files etc.

## Feature Description

Implementar o pacote P0 definido em `.agents/refs/agente-improvments-ideas.md` (linhas 131-152) para elevar a robustez do fluxo investigativo do Agent Lab: isolamento de sessao por investigacao, gate forte de escrita para artefatos criticos, fallback observavel em quebra de contrato, melhor sinalizacao de no-progress no inquiry e testes E2E de inquiry.

O objetivo e reduzir risco editorial/factual e aumentar previsibilidade operacional no fluxo `deep-dive -> plan -> inquiry -> persistencia`.

## User Story

As a jornalista investigativo usando o Reverso Agent
I want que o agente so persista allegations/findings/conclusion quando houver evidencias validas e estado de sessao confiavel
So that eu tenha trilha auditavel, menor risco de erro factual e execucoes reproduziveis mesmo em fluxos longos

## Problem Statement

Hoje o `lab/agent` possui pontos de fragilidade no caminho mais critico da investigacao:

- Sessao deep-dive global unica (`deep-dive-session.json`) sujeita a colisao.
- Persistencia critica pode ocorrer sem gate forte explicito de permissao operacional.
- Fallback de contrato no inquiry pode degradar silenciosamente para resultado negativo.
- Detecao de `no_progress` existe no loop, mas falta transformar isso em acao orientada no fluxo inquiry.
- Testes existentes cobrem partes do parser/loop, mas nao exercitam ponta a ponta o fluxo PEV + gates + persistencia.

## Solution Statement

Introduzir um hardening P0 em cinco frentes:

1. Sessao por investigacao (session_id) com compatibilidade com fluxo atual.
2. Write gate forte para persistencia de artifacts criticos (allegation/finding/conclusion).
3. Fallback observavel de contrato com estado auditavel (`needs_repair`) em vez de silencio.
4. Tratamento explicito de no-progress no inquiry com recomendacao automatica de estrategia alternativa.
5. Testes P0 focados em `runInquiry` end-to-end (plan -> tools -> evidence gate -> pre-write -> persistencia).

## Feature Metadata

**Feature Type**: Enhancement
**Estimated Complexity**: High
**Primary Systems Affected**: `run-inquiry`, sessao deep-dive, runtime config/CLI flags, persistencia investigativa, testes
**Dependencies**: OpenRouter client existente; infra de testes Node/tsx existente (`pnpm --dir lab/agent run test`)

---

## CONTEXT REFERENCES

### Relevant Codebase Files — IMPORTANT: YOU MUST READ THESE BEFORE IMPLEMENTING!

- `lab/agent/src/core/deep-dive-session.ts` (lines 6-50) - Estado de sessao atual e persistencia global em arquivo unico.
- `lab/agent/src/runner/run-dig.ts` (lines 259-267) - Ponto onde sessao deep-dive e criada/salva.
- `lab/agent/src/runner/run-deep-dive-next.ts` (lines 78-107, 203-206, 280-283) - Carregamento e transicoes de sessao.
- `lab/agent/src/runner/run-agent.ts` (lines 130-140, 334-343) - Roteamento conversa -> sessao, inclusive short-circuit por sessao ativa.
- `lab/agent/src/runner/run-inquiry.ts` (lines 184-282, 308-419, 499-614, 1069-1089) - Fluxo PEV, gate, fallback de contrato, persistencia final.
- `lab/agent/src/core/agent-loop.ts` (lines 99-135, 217-225) - Critica para no-progress e razoes de parada.
- `lab/agent/src/core/tool-registry.ts` (lines 56-89, 153-211) - Definicoes/riscos/capabilities usadas no planejamento e validacao.
- `lab/agent/src/config/env.ts` (lines 11-32, 34-51, 100-160) - Runtime flags e defaults para gates de confiabilidade.
- `lab/agent/src/tools/investigative/create-lead-file.ts` (lines 329-445, 447-470) - Persistencia de allegations/findings/review/conclusion.
- `lab/agent/src/index.ts` (lines 39-47, 54-68, 186-207) - Flags de CLI e propagacao para `runInquiry`.
- `lab/agent/tests/inquiry.test.ts` (lines 36-42, 94-130) - Base atual de fallback/recuperacao de findings.
- `lab/agent/tests/agent-loop.test.ts` (lines 46-65) - Base atual de no-progress no loop.
- `lab/agent/tests/deep-dive-flow.test.ts` (lines 170-224) - Base para evoluir cobertura de selecao/sessao.

### New Files to Create

- `lab/agent/src/core/deep-dive-session-store.ts` - Store com sessao por `sessionId` + ponteiro de sessao ativa.
- `lab/agent/tests/deep-dive-session-store.test.ts` - Testes de persistencia, isolamento e compatibilidade.
- `lab/agent/tests/inquiry-p0-flow.test.ts` - Testes E2E locais do fluxo P0 de inquiry com gates.

### Relevant Documentation — YOU SHOULD READ THESE BEFORE IMPLEMENTING! (optional; add if Context7 was used)

Context7 nao foi utilizado neste plano. Referencias vieram apenas de codebase local e das inspiracoes permitidas.

### Patterns to Follow

**Naming Conventions:** manter padrao atual (`runX`, `resolveX`, `normalizeX`, `validateX`, `save/loadX`) e tipos explícitos exportados em `core/*`.

**Error Handling:** padrao atual de erros com mensagens explicitas e `feedback.warn/step/finalSummary`; evitar swallow silencioso em pontos criticos.

**Logging Pattern:** usar `FeedbackController` como trilha operacional principal (eventos + resumo final), evitando logs ad-hoc.

**Other Relevant Patterns:**

- Contratos JSON estritos via `parseStrictJson` + `validate*Payload`.
- Reparo controlado com `buildCritiqueRepair*`.
- Escrita atomica via `writeUtf8Atomic` / `writeJsonAtomic`.
- Stop reasons do loop devem ser propagados para a camada de produto (`run-inquiry` final summary).

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation
**Tasks:** introduzir store de sessao por investigacao com `sessionId`; manter compatibilidade de leitura para sessao legada global; propagar no `run-dig`, `run-deep-dive-next` e `run-agent`.

### Phase 2: Core Implementation
**Tasks:** implementar write gate forte no `run-inquiry`; trocar fallback silencioso por estado observavel `needs_repair`; melhorar tratamento de `no_progress` com recomendacao automatica no resumo final.

### Phase 3: Integration
**Tasks:** atualizar `env.ts` e `index.ts` para flags/config de gate; integrar novos estados em persistencia (`lead` e/ou review artifact) sem quebrar consumers existentes.

### Phase 4: Testing & Validation
**Tasks:** criar suite P0 com foco em inquiry ponta a ponta + sessao isolada + regressao de parser/loop; validar com typecheck e testes focados + suite completa do lab.

---

## STEP-BY-STEP TASKS

Execute every task in order, top to bottom. Each task is atomic and independently testable.

**Task format guidelines:** CREATE | UPDATE | ADD | REMOVE | REFACTOR | MIRROR

### CREATE `lab/agent/src/core/deep-dive-session-store.ts`
- **IMPLEMENT**: criar API de store com `createSession`, `loadSession`, `saveSession`, `setActiveSession`, `loadActiveSession`; persistir em subdiretorio por sessao (`filesystem/sessions/deep-dive/{sessionId}.json`) + ponteiro ativo.
- **PATTERN**: `lab/agent/src/core/deep-dive-session.ts:28`, `lab/agent/src/core/fs-io.ts:171`
- **IMPORTS**: `node:path`, `node:fs/promises`, `writeJsonAtomic`
- **GOTCHA**: manter compatibilidade com `deep-dive-session.json` legado (fallback de leitura) para nao quebrar sessoes existentes.
- **VALIDATE**: `pnpm --dir lab/agent run typecheck`

### REFACTOR `lab/agent/src/core/deep-dive-session.ts`
- **IMPLEMENT**: transformar modulo atual em facade compativel, delegando para o novo store e preservando assinatura publica enquanto migra chamadas.
- **PATTERN**: `lab/agent/src/core/deep-dive-session.ts:32`
- **IMPORTS**: novo `deep-dive-session-store.ts`
- **GOTCHA**: nao quebrar `RunAgent`/`RunDeepDiveNext` que dependem de `loadDeepDiveSession(paths)`.
- **VALIDATE**: `pnpm --dir lab/agent run typecheck`

### UPDATE `lab/agent/src/runner/run-dig.ts`
- **IMPLEMENT**: gerar `sessionId` por rodada (ex.: timestamp + hash curto) e salvar sessao com ponteiro ativo; incluir metadado no feedback final.
- **PATTERN**: `lab/agent/src/runner/run-dig.ts:241`, `lab/agent/src/runner/run-dig.ts:261`
- **IMPORTS**: helpers do novo store
- **GOTCHA**: manter comportamento atual de UX (deep-dive ja pronto para deep-dive-next) sem exigir novo comando do usuario.
- **VALIDATE**: `pnpm --dir lab/agent run test`

### UPDATE `lab/agent/src/runner/run-agent.ts` and `lab/agent/src/runner/run-deep-dive-next.ts`
- **IMPLEMENT**: carregar sessao ativa por ponteiro; adicionar fallback seguro se ponteiro invalido; reduzir risco de sequestro de rota quando sessao estiver stale/completed.
- **PATTERN**: `lab/agent/src/runner/run-agent.ts:334`, `lab/agent/src/runner/run-deep-dive-next.ts:78`
- **IMPORTS**: API nova de sessao
- **GOTCHA**: preservar heuristicas atuais de continuidade e mensagens de clarificacao.
- **VALIDATE**: `pnpm --dir lab/agent run test`

### UPDATE `lab/agent/src/config/env.ts` and `lab/agent/src/index.ts`
- **IMPLEMENT**: adicionar flags/config para write gate forte (ex.: `criticalWriteGateEnabled`, `requireExplicitWriteApproval`) e plugar em `runInquiry`.
- **PATTERN**: `lab/agent/src/config/env.ts:100`, `lab/agent/src/index.ts:63`
- **IMPORTS**: parse helpers existentes (`parseBooleanFlag`)
- **GOTCHA**: defaults devem ser seguros para investigacao (gate ligado por padrao para persistencia critica).
- **VALIDATE**: `pnpm --dir lab/agent run typecheck`

### UPDATE `lab/agent/src/runner/run-inquiry.ts`
- **IMPLEMENT**:
  - bloquear persistencia critica sem gate aprovado;
  - converter fallback de contrato invalido para estado observavel (`needs_repair`) com feedback e artifact de diagnostico;
  - quando `loopRun.stopReason === 'no_progress'`, retornar recomendacao operacional explicita no resumo final.
- **PATTERN**: `lab/agent/src/runner/run-inquiry.ts:291`, `lab/agent/src/runner/run-inquiry.ts:595`, `lab/agent/src/runner/run-inquiry.ts:1069`
- **IMPORTS**: runtime flags novos, helper de artifact de diagnostico (se criado)
- **GOTCHA**: nao perder o comportamento atual de safety fallback; trocar silencio por observabilidade mantendo robustez.
- **VALIDATE**: `pnpm --dir lab/agent run typecheck`

### UPDATE `lab/agent/src/tools/investigative/create-lead-file.ts`
- **IMPLEMENT**: incluir campos minimos de auditoria de write gate/repair state no frontmatter de artifacts criticos (sem quebrar consumidores atuais).
- **PATTERN**: `lab/agent/src/tools/investigative/create-lead-file.ts:379`, `lab/agent/src/tools/investigative/create-lead-file.ts:424`
- **IMPORTS**: tipos atuais de contracts
- **GOTCHA**: manter backward compatibility dos arquivos Markdown ja existentes.
- **VALIDATE**: `pnpm --dir lab/agent run test`

### ADD `lab/agent/tests/deep-dive-session-store.test.ts`
- **IMPLEMENT**: cobrir criacao, carregamento, ponteiro ativo, compatibilidade com sessao legada, e isolamento de duas sessoes paralelas.
- **PATTERN**: `lab/agent/tests/deep-dive-flow.test.ts:112`
- **IMPORTS**: `node:test`, `node:assert/strict`, fixtures temporarias (`mkdtemp`, `rm`)
- **GOTCHA**: evitar dependencias externas; tudo em FS temporario.
- **VALIDATE**: `pnpm --dir lab/agent exec tsx --test tests/deep-dive-session-store.test.ts`

### ADD `lab/agent/tests/inquiry-p0-flow.test.ts`
- **IMPLEMENT**: teste de fluxo P0 `plan -> execute -> verify -> persist` com cenarios:
  - gate de escrita bloqueia persistencia sem aprovacao;
  - contrato invalido gera estado `needs_repair` observavel;
  - `no_progress` resulta em recomendacao de estrategia no resumo.
- **PATTERN**: `lab/agent/tests/inquiry.test.ts:36`, `lab/agent/tests/agent-loop.test.ts:46`
- **IMPORTS**: mocks locais de client/feedback onde necessario.
- **GOTCHA**: manter teste deterministico; evitar dependencias de rede/API.
- **VALIDATE**: `pnpm --dir lab/agent exec tsx --test tests/inquiry-p0-flow.test.ts`

### UPDATE `lab/agent/tests/inquiry.test.ts` and `lab/agent/tests/agent-loop.test.ts`
- **IMPLEMENT**: ajustar asserts para novo comportamento observavel (sem fallback silencioso) e no-progress orientado.
- **PATTERN**: `lab/agent/tests/inquiry.test.ts:36`, `lab/agent/tests/agent-loop.test.ts:63`
- **IMPORTS**: existentes
- **GOTCHA**: manter cobertura de backward compatibility quando aplicavel.
- **VALIDATE**: `pnpm --dir lab/agent run test`

---

## TESTING STRATEGY

### Unit Tests
- `deep-dive-session-store` com FS temporario.
- Parser/repair do inquiry com payloads validos/invalidos.
- Gate de escrita e politica de bloqueio sem aprovacao.

### Integration Tests
- `runInquiry` com plano PEV + loop + gate de evidencia + pre-write + persistencia.
- Fluxo `runDig -> session -> runDeepDiveNext` validando continuidade por `sessionId`.

### Edge Cases
- Sessao ativa inexistente/corrompida.
- Fallback de contrato com findings parcialmente validos.
- Loop encerrando por `no_progress` sem erro de tool.
- Execucao com `preWriteValidationStrict=true`.

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
- `pnpm --dir lab/agent run typecheck`

### Level 2: Unit Tests
- `pnpm --dir lab/agent exec tsx --test tests/deep-dive-session-store.test.ts`
- `pnpm --dir lab/agent exec tsx --test tests/inquiry.test.ts`
- `pnpm --dir lab/agent exec tsx --test tests/agent-loop.test.ts`

### Level 3: Integration Tests
- `pnpm --dir lab/agent exec tsx --test tests/inquiry-p0-flow.test.ts`
- `pnpm --dir lab/agent exec tsx --test tests/deep-dive-flow.test.ts`

### Level 4: Manual Validation
- `pnpm reverso deep-dive`
- `pnpm reverso deep-dive-next --text "plano de todos"`
- `pnpm reverso deep-dive-next --text "executa todos"`
- Verificar se:
  - sessao ativa aponta para `sessionId` correto;
  - persistencia critica exige gate/aprovacao configurada;
  - falha de contrato gera estado observavel e nao silencio;
  - no-progress orienta proximo passo investigativo.

### Level 5: Additional (e.g. MCP)
- N/A para esta feature (sem dependencia MCP nova).

---

## ACCEPTANCE CRITERIA

- [ ] Deep-dive session deixa de ser global unica e passa a suportar sessao por investigacao com ponteiro ativo.
- [ ] Persistencia de allegation/finding/conclusion respeita write gate forte configuravel e seguro por padrao.
- [ ] Quebra de contrato no inquiry gera estado observavel (`needs_repair` ou equivalente auditavel), sem fallback silencioso.
- [ ] `no_progress` no inquiry produz recomendacao operacional explicita no resumo final.
- [ ] Testes P0 cobrem fluxo ponta a ponta de inquiry com gates e persistencia.
- [ ] `pnpm --dir lab/agent run typecheck` e `pnpm --dir lab/agent run test` passam sem regressao.

---

## VISUAL / E2E CHECKS (opcional — preencher quando a feature tiver UI ou Electron)

**Tipo de teste:** [ ] Electron (CDP)  [ ] Web (localhost/URL)

Nao aplicavel. A feature e de runtime/CLI do Agent Lab sem mudanca de interface visual.

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

- Trade-off principal: write gate mais rigido pode reduzir fluidez em cenarios exploratorios; em troca, aumenta confiabilidade editorial e auditabilidade.
- A migracao de sessao deve priorizar backward compatibility para nao quebrar fluxos existentes em `deep-dive-next`.
- Inspiracoes aplicadas:
  - `cline`: separacao forte plan/act + checkpoints e governanca de execucao.
  - `opencode`: politica de permissao `allow/ask/deny` e disciplina read-before-write.
  - `learn-claude-code`: isolamento de contexto/sessao e evolucao incremental com estado em disco.
