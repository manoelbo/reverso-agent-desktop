# Feature: P2 Escala e sofisticacao do inquiry (paralelizacao, verificacao semantica, observabilidade e dados sensiveis)

The following plan should be complete, but it is important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils, types and models. Import from the right files etc.

## Feature Description

Implementar a fase P2 do backlog editorial/operacional para o Agent Lab, com foco em escalar `inquiry` com seguranca e governanca. O escopo inclui quatro frentes integradas: (1) executar inquiries em lote com concorrencia limitada e lock para evitar colisao de sessao/lead, (2) evoluir a verificacao de evidencia para um modo semantico complementar ao matching textual, (3) instrumentar metricas operacionais por etapa para auditoria e melhoria continua, e (4) aplicar politica de redacao/mascaramento de dados sensiveis antes de enviar contexto ao LLM.

## User Story

As an editor-investigador operando multiplos leads
I want executar inquiries em paralelo com verificacao mais robusta e observabilidade completa
So that eu escale throughput sem perder confiabilidade editorial, rastreabilidade e seguranca de dados.

## Problem Statement

O fluxo atual executa lote de inquiry de forma sequencial, com verificacao de evidencia majoritariamente baseada em matching textual/localizacao, pouca telemetria agregada para diagnostico de retrabalho e sem politica centralizada de redacao de dados sensiveis antes de chamadas LLM. Isso limita escala, aumenta risco de vazamento acidental de dados e dificulta iteracao operacional baseada em metricas.

## Solution Statement

Adicionar um executor de batch concorrente com lock por lead e limite de workers configuravel; introduzir um `semantic evidence mode` que combina sinais lexicais existentes com score semantico e justificativa de verificacao; emitir metricas operacionais estruturadas em arquivo/feedback para cada run de inquiry; e criar uma camada de sanitizacao sensivel reutilizavel para prompts/contextos enviados ao modelo, com modos configuraveis (`off|warn|strict`) e trilha auditavel.

## Feature Metadata

**Feature Type**: Enhancement  
**Estimated Complexity**: High  
**Primary Systems Affected**: `lab/agent/src/runner`, `lab/agent/src/core`, `lab/agent/src/config`, `lab/agent/src/index.ts`, testes do Agent Lab  
**Dependencies**: Node.js fs/promises, OpenRouter client existente, infraestrutura de feedback/eventos existente

---

## CONTEXT REFERENCES

### Relevant Codebase Files — IMPORTANT: YOU MUST READ THESE BEFORE IMPLEMENTING!

- `lab/agent/src/runner/run-agent.ts` (lines 70-79, 268-366) - Why: já possui `executeInquiryBatch` sequencial e ponto natural para introduzir scheduler concorrente.
- `lab/agent/src/runner/run-inquiry.ts` (lines 236-383, 452-606) - Why: orquestra PEV, gates, compliance/checkpoint; ponto de coleta de metricas por etapa e sanitizacao de contexto de prompt.
- `lab/agent/src/core/evidence-verifier.ts` (lines 11-66) - Why: baseline da verificacao atual (score/location + confidence) a ser estendido com modo semantico.
- `lab/agent/src/core/evidence-locator.ts` (arquivo completo) - Why: fonte do score textual/localizacao; usar como sinal lexical no verificador hibrido.
- `lab/agent/src/core/tool-registry.ts` (lines 15-45, 153-211) - Why: matriz de capacidade/risco para politicas e possivel metrica por capacidade.
- `lab/agent/src/config/env.ts` (lines 58-218) - Why: padrao de flags/env vars para toggles de runtime.
- `lab/agent/src/index.ts` (lines 43-311) - Why: parse/propagacao de flags CLI.
- `lab/agent/src/cli/events.ts` (lines 1-139) - Why: contratos de eventos; base para estender observabilidade sem quebrar renderer.
- `lab/agent/src/tools/document-processing/queue-runner.ts` (lines 24-56, 215-531) - Why: referencia de controle de estado de lote, retries e sumario operacional.
- `lab/agent/src/core/deep-dive-session-store.ts` (lines 16-118) - Why: referencia de isolamento por sessao e persistencia atomica de estado.
- `lab/agent/src/tools/document-processing/openrouter-client.ts` (lines 71-97, 215-227) - Why: exemplo de sanitizacao para debug payload, util para padrao de redacao sensivel.
- `lab/agent/tests/inquiry-p1-structural.test.ts` (arquivo completo) - Why: molde de teste estrutural end-to-end para ampliar cobertura P2.
- `lab/agent/tests/agent-loop.test.ts` (lines 94-121) - Why: padrao de asserts para stop reasons e comportamento auditavel.

### New Files to Create

- `lab/agent/src/runner/inquiry-batch-runner.ts` - scheduler concorrente com lock por lead e resumo por worker.
- `lab/agent/src/core/inquiry-lock.ts` - lockfile utilitario por lead/session (acquire/release/heartbeat opcional).
- `lab/agent/src/core/evidence-semantic-verifier.ts` - verificador semantico/hibrido com contratos de score e rationale.
- `lab/agent/src/core/inquiry-observability.ts` - agregacao e persistencia de metricas operacionais por run.
- `lab/agent/src/core/sensitive-data-policy.ts` - redacao/mascaramento e relatorio de campos sensiveis detectados.
- `lab/agent/tests/inquiry-batch-runner.test.ts` - testes de concorrencia limitada + lock.
- `lab/agent/tests/evidence-semantic-verifier.test.ts` - testes de modo semantico/hibrido.
- `lab/agent/tests/inquiry-observability.test.ts` - testes de metricas, agregacao e escrita de artefato.
- `lab/agent/tests/sensitive-data-policy.test.ts` - testes de redacao/mascaramento e modos de politica.
- `lab/agent/tests/inquiry-p2-scale.test.ts` - teste de integracao cobrindo os 4 pilares.

### Relevant Documentation — YOU SHOULD READ THESE BEFORE IMPLEMENTING! (optional; add if Context7 was used)

- N/A (sem pesquisa Context7 nesta fase de planejamento)

### Patterns to Follow

**Naming Conventions:**  
- `run-*.ts` para orquestradores (`run-inquiry.ts`, `run-agent.ts`).  
- `core/*.ts` para contratos/regras reutilizaveis (`evidence-verifier.ts`, `tool-registry.ts`).  
- Flags de runtime no formato `p1XEnabled`/`...Mode` em `env.ts`.

**Error Handling:**  
- Preferir erro tipado via mensagens claras, sem throw silencioso.  
- Em lotes, degradar por item (capturar falha por lead) em vez de abortar o batch inteiro.

**Logging Pattern:**  
- Usar `feedback.step/info/warn/finalSummary` para trilha operacional humana.  
- Usar artefatos JSON/MD em `events/` para rastreabilidade run-level.

**Other Relevant Patterns:**  
- Persistencia atomica via `writeJsonAtomic`/`writeUtf8Atomic`.  
- Testes via `node --import tsx --test` com fixtures temporarios (`mkdtemp`).  
- Compatibilidade retroativa por flags (`off` por default).

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation
**Tasks:** criar contratos/flags P2 (batch concurrency, semantic verify mode, observability, sensitive data policy), locks por lead e esqueleto de scheduler.

### Phase 2: Core Implementation
**Tasks:** implementar runner concorrente com lock, verificador semantico hibrido e redacao sensivel aplicada aos prompts/contextos de inquiry.

### Phase 3: Integration
**Tasks:** integrar no `run-agent`/`run-inquiry`, emitir metricas operacionais por etapa e garantir backward compatibility com defaults atuais.

### Phase 4: Testing & Validation
**Tasks:** adicionar suites unitarias/integracao P2, validar cenarios de corrida de lote, regressao P0/P1 e smoke de CLI.

---

## STEP-BY-STEP TASKS

Execute every task in order, top to bottom. Each task is atomic and independently testable.

**Task format guidelines:** CREATE | UPDATE | ADD | REMOVE | REFACTOR | MIRROR

### CREATE `lab/agent/src/core/inquiry-lock.ts`
- **IMPLEMENT**: Implementar lock por lead (`acquireInquiryLock`, `releaseInquiryLock`, `withInquiryLock`) com arquivo em `investigation/locks/lead-<slug>.lock.json`, owner/runId, TTL opcional e limpeza segura.
- **PATTERN**: `lab/agent/src/core/deep-dive-session-store.ts:97-118`
- **IMPORTS**: `node:path`, `node:fs/promises`, `./fs-io.js`
- **GOTCHA**: Evitar deadlock em crash; lock expirado deve ser recuperavel sem `rm -rf`.
- **VALIDATE**: `node node_modules/tsx/dist/cli.mjs --test lab/agent/tests/investigation-checkpoint.test.ts`

### CREATE `lab/agent/src/runner/inquiry-batch-runner.ts`
- **IMPLEMENT**: Criar executor concorrente (`runInquiryBatchConcurrent`) com `maxConcurrency`, fila de leads, isolamento por lock e resultado agregado (`succeededLeads`, `failedLeads`, `skippedLeads`, tempos).
- **PATTERN**: `lab/agent/src/runner/run-agent.ts:348-366` e `lab/agent/src/tools/document-processing/queue-runner.ts:276-507`
- **IMPORTS**: `../core/inquiry-lock.js`, tipos de `run-agent.ts` e `run-inquiry.ts`
- **GOTCHA**: Preservar ordenacao deterministica no sumario final mesmo com execucao paralela.
- **VALIDATE**: `node node_modules/tsx/dist/cli.mjs --test lab/agent/tests/inquiry-batch-runner.test.ts`

### CREATE `lab/agent/src/core/evidence-semantic-verifier.ts`
- **IMPLEMENT**: Implementar verificador hibrido com modo `lexical|semantic|hybrid`; no modo semantic/hybrid calcular `semanticScore` (provider via callback) e emitir `verification_rationale`; manter compatibilidade com `FindingEvidence`.
- **PATTERN**: `lab/agent/src/core/evidence-verifier.ts:11-61`
- **IMPORTS**: `./evidence-verifier.js`, `./contracts.js`
- **GOTCHA**: Modo `lexical` deve reproduzir comportamento atual para evitar regressao.
- **VALIDATE**: `node node_modules/tsx/dist/cli.mjs --test lab/agent/tests/evidence-semantic-verifier.test.ts`

### CREATE `lab/agent/src/core/sensitive-data-policy.ts`
- **IMPLEMENT**: Criar politica de dados sensiveis com detectores (email, telefone, CPF/CNPJ, chave/API token padrao), estrategias `mask|redact|hash`, e relatorio de ocorrencias; expor `sanitizeForLlm`.
- **PATTERN**: `lab/agent/src/tools/document-processing/openrouter-client.ts:71-97`
- **IMPORTS**: `node:crypto` (se hash), tipos utilitarios de core
- **GOTCHA**: Nao alterar arquivos persistidos; redacao deve ocorrer apenas no payload enviado ao modelo e nos logs de debug.
- **VALIDATE**: `node node_modules/tsx/dist/cli.mjs --test lab/agent/tests/sensitive-data-policy.test.ts`

### CREATE `lab/agent/src/core/inquiry-observability.ts`
- **IMPLEMENT**: Definir contratos de metricas (tempo por etapa, retries, stopReason, taxa de retrabalho, findings por lead, gate outcomes) e writer atomico em `filesystem/events/inquiry-metrics-<runId>.json`.
- **PATTERN**: `lab/agent/src/cli/events.ts:53-102` e `lab/agent/src/tools/document-processing/queue-runner.ts:240-245`
- **IMPORTS**: `./fs-io.js`, `node:path`
- **GOTCHA**: Campos devem ser append-friendly e estaveis para dashboards futuros.
- **VALIDATE**: `node node_modules/tsx/dist/cli.mjs --test lab/agent/tests/inquiry-observability.test.ts`

### UPDATE `lab/agent/src/config/env.ts`
- **IMPLEMENT**: Adicionar flags P2:
  - `p2InquiryBatchConcurrency` (default 1),
  - `p2EvidenceVerificationMode` (`lexical` default),
  - `p2ObservabilityEnabled` (default true),
  - `p2SensitiveDataPolicyMode` (`off|warn|strict`, default `warn`).
- **PATTERN**: `lab/agent/src/config/env.ts:161-218`
- **IMPORTS**: tipos dos novos modulos core
- **GOTCHA**: defaults devem manter comportamento atual quando feature nao configurada.
- **VALIDATE**: `pnpm typecheck`

### UPDATE `lab/agent/src/index.ts`
- **IMPLEMENT**: Parsear e propagar novas flags CLI (`--p2-batch-concurrency`, `--p2-evidence-mode`, `--p2-observability`, `--p2-sensitive-data-policy`, `--p2-sensitive-data-strict` opcional alias).
- **PATTERN**: `lab/agent/src/index.ts:68-105` e `:228-311`
- **IMPORTS**: nenhum novo fora parser/runner
- **GOTCHA**: manter help/usage sincronizados com parser.
- **VALIDATE**: `node node_modules/tsx/dist/cli.mjs lab/agent/src/index.ts inquiry --help`

### REFACTOR `lab/agent/src/runner/run-agent.ts`
- **IMPLEMENT**: Substituir caminho sequencial de `executeInquiryBatch` por `runInquiryBatchConcurrent` quando `p2InquiryBatchConcurrency > 1`; manter fallback sequencial.
- **PATTERN**: `lab/agent/src/runner/run-agent.ts:268-343` e `:348-366`
- **IMPORTS**: `./inquiry-batch-runner.js`
- **GOTCHA**: preservar mensagens finais para UX atual e nao quebrar automacoes existentes.
- **VALIDATE**: `node node_modules/tsx/dist/cli.mjs --test lab/agent/tests/inquiry-batch-runner.test.ts lab/agent/tests/inquiry-p0-flow.test.ts`

### UPDATE `lab/agent/src/runner/run-inquiry.ts`
- **IMPLEMENT**: Integrar:
  1) sanitizacao de dados sensiveis antes de montar prompt/contextos para LLM;
  2) selecao do modo de verificacao lexical/semantic/hybrid;
  3) emissao de metricas por etapa (plan/execute/verify/persist).
- **PATTERN**: `lab/agent/src/runner/run-inquiry.ts:236-383` e `:452-606`
- **IMPORTS**: `../core/sensitive-data-policy.js`, `../core/evidence-semantic-verifier.js`, `../core/inquiry-observability.js`
- **GOTCHA**: em modo `strict`, bloquear envio ao LLM quando detectar dado sensivel nao redatado; em `warn`, apenas auditar.
- **VALIDATE**: `node node_modules/tsx/dist/cli.mjs --test lab/agent/tests/inquiry-p1-structural.test.ts lab/agent/tests/inquiry-p2-scale.test.ts`

### ADD tests `lab/agent/tests/inquiry-batch-runner.test.ts`
- **IMPLEMENT**: Cobrir concorrencia limitada (ex.: 3 leads com maxConcurrency=2), lock collision (mesmo lead em duplicidade), falha parcial e determinismo do resumo.
- **PATTERN**: `lab/agent/tests/inquiry-p1-structural.test.ts:59-177`
- **IMPORTS**: `node:test`, `node:assert/strict`, fixtures temporarios
- **GOTCHA**: evitar testes flaky por temporizacao; usar sincronizacao controlada.
- **VALIDATE**: `node node_modules/tsx/dist/cli.mjs --test lab/agent/tests/inquiry-batch-runner.test.ts`

### ADD tests `lab/agent/tests/evidence-semantic-verifier.test.ts`
- **IMPLEMENT**: Cobrir modos `lexical`, `semantic`, `hybrid`, thresholds e rationale.
- **PATTERN**: `lab/agent/tests/editorial-governance.test.ts:43-88`
- **IMPORTS**: verificador novo + contratos de evidence
- **GOTCHA**: garantir baseline identico no modo lexical.
- **VALIDATE**: `node node_modules/tsx/dist/cli.mjs --test lab/agent/tests/evidence-semantic-verifier.test.ts`

### ADD tests `lab/agent/tests/inquiry-observability.test.ts`
- **IMPLEMENT**: Cobrir agregacao por etapa, taxa de retrabalho e escrita de artefato JSON.
- **PATTERN**: `lab/agent/tests/investigation-checkpoint.test.ts:14-63`
- **IMPORTS**: writer de observabilidade, fs fixture
- **GOTCHA**: padronizar timestamps para assercoes estaveis.
- **VALIDATE**: `node node_modules/tsx/dist/cli.mjs --test lab/agent/tests/inquiry-observability.test.ts`

### ADD tests `lab/agent/tests/sensitive-data-policy.test.ts`
- **IMPLEMENT**: Cobrir detectores e estrategias de redacao/mascara/hash, inclusive falsos positivos comuns.
- **PATTERN**: `lab/agent/tests/compliance-hooks.test.ts:5-62`
- **IMPORTS**: `sensitive-data-policy.ts`
- **GOTCHA**: evitar regex excessivamente agressiva que degrade texto jornalistico normal.
- **VALIDATE**: `node node_modules/tsx/dist/cli.mjs --test lab/agent/tests/sensitive-data-policy.test.ts`

### ADD integration test `lab/agent/tests/inquiry-p2-scale.test.ts`
- **IMPLEMENT**: E2E de P2: batch concorrente + lock + verificacao semantica + metricas + policy sensivel (warn/strict).
- **PATTERN**: `lab/agent/tests/inquiry-p1-structural.test.ts:59-177`
- **IMPORTS**: `runAgent`, `runInquiry`, modulos P2
- **GOTCHA**: fixture deve isolar side effects em diretario temporario unico.
- **VALIDATE**: `node node_modules/tsx/dist/cli.mjs --test lab/agent/tests/inquiry-p2-scale.test.ts`

---

## TESTING STRATEGY

### Unit Tests
- `inquiry-lock`: acquire/release, lock expirado, lock reentrante por mesmo owner (se suportado).
- `evidence-semantic-verifier`: modos, thresholds, merge de score lexical+semantic.
- `sensitive-data-policy`: detectores, sanitizacao e relatorio de ocorrencias.
- `inquiry-observability`: agregacao e serializacao de metricas.

### Integration Tests
- `inquiry-batch-runner`: concorrencia e resiliencia por lead.
- `inquiry-p2-scale`: fluxo completo com flags P2 habilitadas e sem regressao de persistencia.

### Edge Cases
- Lead duplicado no mesmo batch.
- Batch com 1 sucesso e N falhas.
- Timeout no provedor semantico.
- Politica sensivel em `strict` bloqueando prompt.
- Ambiente sem flags P2 (comportamento legacy intacto).

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
- `pnpm typecheck`
- `pnpm lint`

### Level 2: Unit Tests
- `node node_modules/tsx/dist/cli.mjs --test lab/agent/tests/evidence-semantic-verifier.test.ts lab/agent/tests/sensitive-data-policy.test.ts lab/agent/tests/inquiry-observability.test.ts lab/agent/tests/inquiry-batch-runner.test.ts`

### Level 3: Integration Tests
- `node node_modules/tsx/dist/cli.mjs --test lab/agent/tests/inquiry-p2-scale.test.ts lab/agent/tests/inquiry-p1-structural.test.ts`
- `node node_modules/tsx/dist/cli.mjs --test lab/agent/tests/inquiry-p0-flow.test.ts lab/agent/tests/inquiry.test.ts`

### Level 4: Manual Validation
- `pnpm reverso agent --text "investigue todos os leads" --p2-batch-concurrency 2 --p2-evidence-mode hybrid --p2-sensitive-data-policy warn`
- Verificar em `lab/agent/filesystem/events/` a criacao de artefato `inquiry-metrics-*.json`.
- Executar run com input contendo dado sensivel e validar mascaramento em logs/prompt debug.

### Level 5: Additional (e.g. MCP)
- N/A

---

## ACCEPTANCE CRITERIA

- [ ] Batch de inquiry suporta concorrencia configuravel com lock por lead e sem colisao.
- [ ] Modo de verificacao semantica/hibrida melhora rastreio de evidencia sem quebrar modo lexical.
- [ ] Metricas operacionais por etapa sao persistidas e legiveis para auditoria.
- [ ] Politica de dados sensiveis redige/mascara antes do envio ao LLM e gera trilha auditavel.
- [ ] Execucao sem flags P2 permanece funcional e compativel com P0/P1.

---

## VISUAL / E2E CHECKS (opcional — preencher quando a feature tiver UI ou Electron)

**Tipo de teste:** [ ] Electron (CDP)  [ ] Web (localhost/URL)  
Nao aplicavel nesta feature (escopo CLI/core).

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

- Trade-off principal: verificacao semantica aumenta custo/latencia; mitigar com modo `hybrid` default e fallback lexical em timeout.
- Lock por lead deve priorizar simplicidade operacional (file lock) em vez de infra externa, mantendo portabilidade local.
- Observabilidade deve ser suficiente para tomada editorial sem coletar payloads sensiveis em claro.
- Politica sensivel em `strict` pode reduzir throughput; iniciar rollout em `warn` com metricas de impacto.
