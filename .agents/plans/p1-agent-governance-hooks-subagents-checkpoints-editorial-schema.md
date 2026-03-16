# Feature: P1 Agent Structural Governance (Hooks + Subagentes + Checkpoints + Schema Editorial)

The following plan should be complete, but it is important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils, types and models. Import from the right files etc.

## Feature Description

Implementar o pacote P1 definido em `.agents/refs/agente-improvments-ideas.md` (linhas 153-163), adicionando governanca estrutural ao `lab/agent` em quatro frentes: hooks de compliance no ciclo de tools, protocolo de subagentes por dominio, checkpoints restauraveis de investigacao e metadados editoriais ampliados nos artefatos Markdown.

O objetivo e transformar o fluxo atual em um pipeline mais auditavel, recuperavel e seguro para operacao jornalistica real, sem perder compatibilidade com a base atual do Agent Lab.

## User Story

As a jornalista investigativo usando o Reverso Agent
I want que o agente valide compliance antes/depois de cada tool, consiga delegar leitura por dominio com consolidacao central, restaure checkpoints de investigacao e persista governanca editorial explicita
So that eu consiga conduzir apuracoes longas com mais confianca juridica/editorial, menos retrabalho e trilha de auditoria completa

## Problem Statement

Mesmo com melhorias de confiabilidade do P0, ainda faltam pilares estruturais para escala editorial:

- Nao existe mecanismo padrao de compliance por chamada de tool (`PreToolUse` / `PostToolUse`).
- O fluxo de orquestracao e monolitico; nao ha isolamento de contexto por dominio investigativo.
- Nao ha checkpoint/restaure do estado de investigacao para retomada controlada apos falhas, pausas ou revisao humana.
- O schema de frontmatter de `lead/allegation/finding` nao contem campos formais de aprovacao/publicacao exigidos por governanca editorial.

## Solution Statement

Introduzir um pacote P1 em quatro blocos integrados:

1. **Compliance Hooks Layer** no `runAgentLoop` com politica configuravel (`allow|warn|deny`) e motivo auditavel.
2. **Domain Subagents Protocol** no `run-inquiry` para executar subplanos read-only por dominio (ex.: societario, contratos, cronologia) e consolidar evidencias por coordenador.
3. **Investigation Checkpoints** para snapshot/restaure de plano, progresso de loop, gate state e pendencias de revisao.
4. **Editorial Governance Schema** em Markdown/frontmatter com campos obrigatorios de aprovacao/publicacao e validacao pre-write dedicada.

## Feature Metadata

**Feature Type**: Enhancement
**Estimated Complexity**: High
**Primary Systems Affected**: loop de orquestracao, runner `run-inquiry`, persistencia investigativa Markdown, validacao pre-write, testes de integracao
**Dependencies**: infraestrutura atual de `FeedbackController`, `tool-registry`, `writeJsonAtomic`, validacoes em `run-inquiry` e testes `node:test` via `tsx`

---

## CONTEXT REFERENCES

### Relevant Codebase Files — IMPORTANT: YOU MUST READ THESE BEFORE IMPLEMENTING!

- `lab/agent/src/core/agent-loop.ts` (lines 43-84, 137-206, 241-255) - Ponto central para inserir `PreToolUse`/`PostToolUse` sem quebrar o ciclo de execucao.
- `lab/agent/src/core/tool-registry.ts` (lines 35-45, 56-89, 119-151, 153-211) - Fonte de metadados de risco/capability para politica de compliance.
- `lab/agent/src/runner/run-inquiry.ts` (lines 199-297, 367-415, 867-973, 1213-1241) - Orquestracao PEV, gate de escrita, repair state e diagnostico; principal alvo para subagentes/checkpoints.
- `lab/agent/src/core/orchestration.ts` (arquivo completo) - Tipos de plano/budget/stop reasons usados na consolidacao do coordenador.
- `lab/agent/src/core/pre-write-validation.ts` (arquivo completo) - Base para adicionar validacao de governanca editorial antes de persistir artefatos criticos.
- `lab/agent/src/tools/investigative/create-lead-file.ts` (lines 216-321, 337-462, 464-547) - Escrita de `lead/allegation/finding/review` e frontmatter atual.
- `lab/agent/src/config/env.ts` (lines 11-33, 36-55, 142-176, 205-217) - Padrao para novas flags de compliance/subagentes/checkpoints/governanca.
- `lab/agent/src/index.ts` (lines 38-47, 54-71, 194-235, 308-313) - Propagacao de flags CLI para `runInquiry`/`runAgent`.
- `lab/agent/src/tools/document-processing/source-checkpoint.ts` (lines 12-48, 53-81, 86-133) - Referencia de padrao para persistencia/restaure de checkpoint.
- `lab/agent/src/core/deep-dive-session-store.ts` (lines 16-30, 66-79, 97-133) - Referencia de store por escopo e fallback legado.
- `lab/agent/src/core/contracts.ts` (lines 3-5, 61-67, 75-131) - Tipos de evidencias/findings e contratos do dominio investigativo.
- `lab/agent/tests/inquiry-p0-flow.test.ts` (lines 9-35) - Base de testes de politica/gate para estender em P1.
- `lab/agent/tests/agent-loop.test.ts` (lines 47-95) - Base de testes do loop para hooks e telemetria.

### New Files to Create

- `lab/agent/src/core/compliance-hooks.ts` - Contratos `PreToolUse`/`PostToolUse`, avaliacao de politica e resultado auditavel.
- `lab/agent/src/core/domain-subagents.ts` - Protocolo de subagentes por dominio e consolidacao de outputs.
- `lab/agent/src/core/investigation-checkpoint.ts` - Persistencia/restaure de checkpoint de inquiry.
- `lab/agent/src/core/editorial-governance.ts` - Schema/tipos de governanca editorial e validacoes.
- `lab/agent/tests/compliance-hooks.test.ts` - Testes unitarios da camada de compliance.
- `lab/agent/tests/domain-subagents.test.ts` - Testes do protocolo de subagentes/coordenador.
- `lab/agent/tests/investigation-checkpoint.test.ts` - Testes de snapshot/restaure e compatibilidade.
- `lab/agent/tests/editorial-governance.test.ts` - Testes de schema e validacao pre-write de governanca.
- `lab/agent/tests/inquiry-p1-structural.test.ts` - Teste de integracao do fluxo P1 (hooks + subagentes + checkpoint + persistencia governada).

### Relevant Documentation — YOU SHOULD READ THESE BEFORE IMPLEMENTING! (optional; add if Context7 was used)

Context7 nao foi utilizado neste plano. O planejamento usa apenas padroes e codigo local do repositorio.

### Patterns to Follow

**Naming Conventions:** manter o padrao existente `runX`, `resolveX`, `load/saveX`, `validateX`, `buildXRecommendation` e tipos exportados explicitos.

**Error Handling:** usar erros explicitos + `feedback.warn/step/finalSummary`; evitar fallback silencioso em caminhos criticos de compliance/governanca.

**Logging Pattern:** manter `FeedbackController` como trilha operacional principal; para novos blocos, produzir mensagens curtas com reason/status deterministico.

**Other Relevant Patterns:**

- Persistencia atomica e recuperavel (`writeJsonAtomic`, estrutura versionada de checkpoint).
- Compatibilidade backward-first (fallback para formatos legados quando aplicavel).
- Validacao antes de side effects (input validation + pre-write + critical gate).
- Testes focados sem dependencia externa (fixtures temporarias e mocks locais).

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation
**Tasks:** criar modulos base de compliance hooks, protocolo de subagentes e checkpoint de investigacao com tipos bem definidos e sem alterar ainda o fluxo principal.

### Phase 2: Core Implementation
**Tasks:** integrar compliance e subagentes em `run-inquiry`/`agent-loop`; adicionar restore/save de checkpoint por etapa; expandir schema editorial no frontmatter e validacao de governanca.

### Phase 3: Integration
**Tasks:** propagar novas flags de runtime/CLI; integrar validacoes pre-write e regras de bloqueio; manter compatibilidade com artefatos existentes e fluxo atual.

### Phase 4: Testing & Validation
**Tasks:** adicionar suites unitarias e de integracao P1; validar typecheck, testes focados e suite completa do `lab/agent`.

---

## STEP-BY-STEP TASKS

Execute every task in order, top to bottom. Each task is atomic and independently testable.

**Task format guidelines:** CREATE | UPDATE | ADD | REMOVE | REFACTOR | MIRROR

### CREATE `lab/agent/src/core/compliance-hooks.ts`
- **IMPLEMENT**: definir contratos de hooks (`preToolUse`, `postToolUse`), contexto da tool (tool/capability/risk/inputHash), decisao (`allow|warn|deny`) e helper de avaliacao.
- **PATTERN**: `lab/agent/src/core/tool-registry.ts:35`, `lab/agent/src/core/agent-loop.ts:55`
- **IMPORTS**: tipos de `tool-registry`, utilitarios locais de resumo/hash quando necessario.
- **GOTCHA**: design deve permitir politica por risco/capability sem acoplar a regras editoriais especificas.
- **VALIDATE**: `pnpm --dir lab/agent run typecheck`

### UPDATE `lab/agent/src/core/agent-loop.ts`
- **IMPLEMENT**: plugar `PreToolUse` antes de `executeToolCall` e `PostToolUse` apos resultado; em caso `deny`, interromper com motivo auditavel e `stopReason` consistente.
- **PATTERN**: `lab/agent/src/core/agent-loop.ts:137`, `lab/agent/src/core/agent-loop.ts:162`
- **IMPORTS**: novo `compliance-hooks.ts`.
- **GOTCHA**: nao quebrar hooks existentes (`onToolCall`, `onToolResult`, `onStopped`) e manter semantica de retries.
- **VALIDATE**: `pnpm --dir lab/agent exec tsx --test tests/agent-loop.test.ts`

### CREATE `lab/agent/src/core/domain-subagents.ts`
- **IMPLEMENT**: modelar dominios investigativos, contrato de subplano read-only, executor por dominio e consolidacao coordenada com dedupe de evidencias.
- **PATTERN**: `lab/agent/src/runner/run-inquiry.ts:808`, `lab/agent/src/core/orchestration.ts`
- **IMPORTS**: tipos de `contracts.ts` e plano estruturado de `orchestration.ts`.
- **GOTCHA**: subagentes devem ser deterministicos e limitados (budget/timeout), sem escrita direta de artefatos.
- **VALIDATE**: `pnpm --dir lab/agent run typecheck`

### CREATE `lab/agent/src/core/investigation-checkpoint.ts`
- **IMPLEMENT**: persistir checkpoint versionado por `lead` com estado minimo: plano reparado, progresso do loop, gates, repair state e fila de revisao; incluir `load`, `save`, `clear`, `restore`.
- **PATTERN**: `lab/agent/src/tools/document-processing/source-checkpoint.ts:12`, `lab/agent/src/core/deep-dive-session-store.ts:97`
- **IMPORTS**: `writeJsonAtomic`, `node:fs/promises`, `node:path`.
- **GOTCHA**: incluir campo `version` e estrategia de migração/fallback para formatos futuros.
- **VALIDATE**: `pnpm --dir lab/agent exec tsx --test tests/investigation-checkpoint.test.ts`

### CREATE `lab/agent/src/core/editorial-governance.ts`
- **IMPLEMENT**: definir schema de governanca editorial (`approver`, `approved_at`, `editorial_status`, `publication_criteria`, `legal_notes`) e validadores utilitarios.
- **PATTERN**: `lab/agent/src/core/contracts.ts:61`, `lab/agent/src/core/pre-write-validation.ts`
- **IMPORTS**: tipos de dominio existentes e utilitarios de validacao.
- **GOTCHA**: manter compatibilidade com artefatos antigos sem campos novos (modo migracao soft + warnings).
- **VALIDATE**: `pnpm --dir lab/agent run typecheck`

### UPDATE `lab/agent/src/runner/run-inquiry.ts`
- **IMPLEMENT**:
  - executar subagentes por dominio no bloco PEV (antes da sintese final);
  - salvar checkpoints em marcos do fluxo (planejamento, pos-execucao tools, pre-persistencia, pos-persistencia);
  - restaurar checkpoint quando explicitamente solicitado por flag;
  - integrar compliance hooks no ciclo de tools e refletir motivos no resumo final.
- **PATTERN**: `lab/agent/src/runner/run-inquiry.ts:199`, `lab/agent/src/runner/run-inquiry.ts:367`, `lab/agent/src/runner/run-inquiry.ts:467`
- **IMPORTS**: `compliance-hooks.ts`, `domain-subagents.ts`, `investigation-checkpoint.ts`.
- **GOTCHA**: evitar alteracao de comportamento default quando flags P1 estiverem desativadas.
- **VALIDATE**: `pnpm --dir lab/agent exec tsx --test tests/inquiry-p1-structural.test.ts`

### UPDATE `lab/agent/src/core/pre-write-validation.ts`
- **IMPLEMENT**: incluir validacao de governanca editorial para artifacts criticos quando modo P1 estiver ativo (campos obrigatorios + consistencia temporal/status).
- **PATTERN**: validacoes atuais de `run-inquiry` em `lab/agent/src/runner/run-inquiry.ts:343`
- **IMPORTS**: `editorial-governance.ts`.
- **GOTCHA**: em modo non-strict, retornar warnings acionaveis; em strict, bloquear persistencia.
- **VALIDATE**: `pnpm --dir lab/agent exec tsx --test tests/editorial-governance.test.ts`

### UPDATE `lab/agent/src/tools/investigative/create-lead-file.ts`
- **IMPLEMENT**: estender frontmatter de `lead`, `allegation`, `finding` e `evidence_review_queue` com campos de governanca editorial; preservar campos P0 (`critical_write_gate`, `needs_repair`).
- **PATTERN**: `lab/agent/src/tools/investigative/create-lead-file.ts:243`, `lab/agent/src/tools/investigative/create-lead-file.ts:361`, `lab/agent/src/tools/investigative/create-lead-file.ts:390`
- **IMPORTS**: tipos do novo `editorial-governance.ts`.
- **GOTCHA**: nao quebrar parser simples de frontmatter existente e manter leitura de arquivos antigos.
- **VALIDATE**: `pnpm --dir lab/agent exec tsx --test tests/editorial-governance.test.ts`

### UPDATE `lab/agent/src/config/env.ts` and `lab/agent/src/index.ts`
- **IMPLEMENT**: adicionar flags para habilitar P1 por blocos (compliance hooks, subagentes, checkpoint restore, governanca editorial strict/soft) e propagar para `runInquiry`/`runAgent`.
- **PATTERN**: `lab/agent/src/config/env.ts:142`, `lab/agent/src/index.ts:60`
- **IMPORTS**: helpers de parse boolean/int/number existentes.
- **GOTCHA**: defaults seguros e explicitos; evitar regressao de CLI.
- **VALIDATE**: `pnpm --dir lab/agent run typecheck`

### ADD `lab/agent/tests/compliance-hooks.test.ts`
- **IMPLEMENT**: cobrir cenarios `allow`, `warn`, `deny`, propagacao de reason e integracao com risco/capability da tool.
- **PATTERN**: `lab/agent/tests/agent-loop.test.ts:73`
- **IMPORTS**: `node:test`, `node:assert/strict`.
- **GOTCHA**: manter testes deterministicos sem rede/LLM.
- **VALIDATE**: `pnpm --dir lab/agent exec tsx --test tests/compliance-hooks.test.ts`

### ADD `lab/agent/tests/domain-subagents.test.ts`
- **IMPLEMENT**: validar isolamento de contexto por dominio, consolidacao por coordenador e dedupe de evidencias repetidas.
- **PATTERN**: `lab/agent/src/runner/run-inquiry.ts:808`
- **IMPORTS**: tipos de `contracts.ts`, mocks de executor.
- **GOTCHA**: limitar complexidade de fixture para manter legibilidade.
- **VALIDATE**: `pnpm --dir lab/agent exec tsx --test tests/domain-subagents.test.ts`

### ADD `lab/agent/tests/investigation-checkpoint.test.ts`
- **IMPLEMENT**: cobrir save/load/restore/clear, versionamento e tolerancia a checkpoint corrompido.
- **PATTERN**: `lab/agent/tests/deep-dive-session-store.test.ts:39`, `lab/agent/src/tools/document-processing/source-checkpoint.ts:16`
- **IMPORTS**: FS temporario (`mkdtemp`, `rm`, `writeFile`).
- **GOTCHA**: nao usar `filesystem` real do workspace.
- **VALIDATE**: `pnpm --dir lab/agent exec tsx --test tests/investigation-checkpoint.test.ts`

### ADD `lab/agent/tests/editorial-governance.test.ts`
- **IMPLEMENT**: testar schema obrigatorio, combinacoes invalidas de status/aprovacao e modo compatibilidade para legados.
- **PATTERN**: `lab/agent/tests/inquiry.test.ts:134`
- **IMPORTS**: validadores novos + helpers de persistencia investigativa.
- **GOTCHA**: cobrir caminho strict e non-strict.
- **VALIDATE**: `pnpm --dir lab/agent exec tsx --test tests/editorial-governance.test.ts`

### ADD `lab/agent/tests/inquiry-p1-structural.test.ts`
- **IMPLEMENT**: teste de integracao P1 exercitando sequencia: plan -> hooks -> subagentes -> checkpoint -> pre-write governance -> persistencia.
- **PATTERN**: `lab/agent/tests/inquiry-p0-flow.test.ts:9`
- **IMPORTS**: mocks locais para evitar chamadas reais ao OpenRouter.
- **GOTCHA**: garantir assert em artefatos de diagnostico/checkpoint e frontmatter final.
- **VALIDATE**: `pnpm --dir lab/agent exec tsx --test tests/inquiry-p1-structural.test.ts`

### UPDATE `lab/agent/tests/inquiry-p0-flow.test.ts` and `lab/agent/tests/inquiry.test.ts`
- **IMPLEMENT**: ajustar cobertura para coexistencia P0+P1, validando que caminhos antigos continuam estaveis com P1 desabilitado.
- **PATTERN**: `lab/agent/tests/inquiry-p0-flow.test.ts:21`, `lab/agent/tests/inquiry.test.ts:143`
- **IMPORTS**: existentes.
- **GOTCHA**: proteger contra regressao comportamental do P0.
- **VALIDATE**: `pnpm --dir lab/agent run test`

---

## TESTING STRATEGY

### Unit Tests
- Compliance hooks: decisoes por tool/risk/capability.
- Editorial governance schema: campos obrigatorios, status e consistencia temporal.
- Checkpoint service: serializacao, versao, restore seguro.

### Integration Tests
- `runInquiry` com P1 ativo: hooks + subagentes + checkpoint + persistencia governada.
- `runInquiry` com P1 inativo: comportamento P0 preservado.

### Edge Cases
- Hook `deny` em tool de escrita no meio do plano.
- Falha parcial de subagente e consolidacao com degradacao controlada.
- Checkpoint ausente/corrompido durante restore.
- Artefato legado sem campos de governanca em modo strict.

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
- `pnpm --dir lab/agent run typecheck`

### Level 2: Unit Tests
- `pnpm --dir lab/agent exec tsx --test tests/compliance-hooks.test.ts`
- `pnpm --dir lab/agent exec tsx --test tests/domain-subagents.test.ts`
- `pnpm --dir lab/agent exec tsx --test tests/investigation-checkpoint.test.ts`
- `pnpm --dir lab/agent exec tsx --test tests/editorial-governance.test.ts`

### Level 3: Integration Tests
- `pnpm --dir lab/agent exec tsx --test tests/inquiry-p1-structural.test.ts`
- `pnpm --dir lab/agent exec tsx --test tests/inquiry-p0-flow.test.ts`

### Level 4: Manual Validation
- `pnpm reverso inquiry --lead "<slug>" --pev --critical-write-gate --require-explicit-write-approval`
- Reexecutar com flags P1 ativas (hooks/subagentes/checkpoint/governanca) e validar:
  - bloqueios/avisos de compliance no feedback;
  - artefato de checkpoint criado e restauravel;
  - frontmatter de artifacts com metadados editoriais esperados;
  - resumo final explicando decisoes de gate/compliance.

### Level 5: Additional (e.g. MCP)
- N/A para este pacote (sem dependencia MCP nova obrigatoria).

---

## ACCEPTANCE CRITERIA

- [ ] Cada tool call no loop passa por `PreToolUse` e `PostToolUse` com resultado auditavel (`allow|warn|deny` + reason).
- [ ] `runInquiry` suporta protocolo de subagentes por dominio com consolidacao central sem escrita direta pelos subagentes.
- [ ] Estado de investigacao pode ser salvo e restaurado via checkpoint versionado.
- [ ] Artefatos `lead/allegation/finding/review` incluem campos de governanca editorial definidos no P1.
- [ ] Validacao pre-write bloqueia persistencia quando governanca obrigatoria estiver incompleta em modo strict.
- [ ] Suite de testes cobre P1 e confirma nao regressao dos comportamentos P0.

---

## VISUAL / E2E CHECKS (opcional — preencher quando a feature tiver UI ou Electron)

**Tipo de teste:** [ ] Electron (CDP)  [ ] Web (localhost/URL)

Nao aplicavel. Esta feature e estrutural de runtime/CLI e persistencia Markdown no Agent Lab.

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

- Trade-off principal: ligar todos os blocos P1 por default aumenta seguranca, mas pode elevar friccao operacional; recomenda-se rollout por flags com defaults conservadores e migracao progressiva.
- O protocolo de subagentes deve priorizar isolamento e consolidacao deterministica, evitando "mini-agentes" com escrita direta em artefatos editoriais.
- Checkpoint/restaure precisa ter semantica clara de ownership (quem pode restaurar e em qual fase) para evitar retomada em estado inconsistente.
