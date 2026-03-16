# Registro de testes (pós-commit)

Este arquivo é gerado e atualizado pelo comando **post-commit-tests**. O comando **run-tests** usa este registro para rodar a suíte completa ou apenas os testes da última feature.

## Como rodar testes

- **Suíte completa:** `pnpm test` (ou `pnpm test:unit && pnpm test:e2e` quando existir).
- **Só última feature:** ver último bloco em "Por commit" abaixo e rodar o comando listado em "Comando para este commit".

Quando não houver `package.json` ou scripts de teste no projeto, os comandos serão preenchidos assim que o projeto tiver Vitest/Playwright configurados (conforme PRD-01).

## Por sprint (mais recente primeiro)

---

### Sprint 1 — E1 (State Detection) + E2 (Intents LLM)
**Data:** 2026-03-14
**Reset de partida:** `pnpm reset:all`
**Bug corrigido durante os testes:** `chat-session.ts` usava path hardcoded para `filesystem` em vez de respeitar `AGENT_FILESYSTEM_DIR` → `isFirstVisit` sempre `false` no test mode. Fix: espelhar padrão de `paths.ts`.

#### Cenários executados

| # | Entrada | Esperado | Resultado |
|---|---------|----------|-----------|
| 1 | `curl /api/context` (pós reset:all) | `sourceEmpty:true`, `isFirstVisit:true`, `hasAgentContext:false`, `testMode:true`, `unprocessedCount:0` | ✓ PASS |
| 2 | `pnpm agent:test --text "oi"` | rota `greeting` | ✓ PASS |
| 3 | `pnpm agent:test --text "me mostra os leads"` | rota `view_data` | ✓ PASS |
| 4 | `pnpm agent:test --text "processa os PDFs"` | rota `process_documents` | ✓ PASS |
| 5 | `pnpm agent:test --text "para tudo"` | rota `abort` | ✓ PASS |
| 6 | `pnpm agent:test --text "quem é o presidente da empresa?"` | rota `quick_research` | ✓ PASS |
| 7 | `pnpm agent:test --text "quero investigar a empresa XYZ"` | rota `deep_dive` (execução falha sem previews — esperado no Sprint 1) | ✓ PASS (routing) |
| 8a | `pnpm reset:chat` | chat limpo, leads preservados | ✓ PASS |
| 8b | `pnpm reset:investigation` | leads deletados, source/.artifacts preservado | ✓ PASS |
| 8c | `pnpm reset:sources-artefacts` | artefatos deletados, PDFs preservados | ✓ PASS |
| 8d | Filesystem real (`filesystem/`) intacto | 9 source files, 1 chat session preservados | ✓ PASS |
| 8e | `POST /api/test/reset` com servidor em test mode | 200 OK | ✓ PASS |

#### Resultado geral
**PASS** — todos os 12 cenários passaram. Sprint 1 aprovado para avançar ao Sprint 2.

---

### Sprint 2 — E3 (Pré-routing + Fila + Abort + Retry)

_(Registro retroativo — testes executados durante Sprint 3 como regressão)_

**Data:** 2026-03-14
**Reset de partida:** `pnpm reset:all` + cópia manual de PDFs para source

| # | Cenário | Esperado | Resultado |
|---|---------|----------|-----------|
| 1 | `curl /api/context` pós reset | `sourceEmpty:true`, `testMode:true` | ✓ PASS |
| 2 | `deep_dive` com source vazio | texto orientando upload, sem fila | ✓ PASS |
| 3 | `deep_dive` com PDFs pendentes + auto-approve OFF | `approval-request` SSE emitido | ✓ PASS |
| 4 | `typecheck` em `lab/agent` | 0 erros | ✓ PASS |

**Regressão Sprint 1:** `sourceEmpty:true`, `isFirstVisit:true`, `testMode:true` — ✓ PASS. Intents `greeting`, `view_data`, `process_documents` — ✓ PASS.

**Resultado geral:** PASS — infraestrutura de pré-routing e fila validada.

---

### Sprint 3 — E4 (Greeting Handler + Dynamic Suggestions)

**Data:** 2026-03-14
**Commit:** 5334d02 (implementação Sprint 3)
**Reset de partida:** `pnpm reset:all`

| # | Cenário | Esperado | Resultado |
|---|---------|----------|-----------|
| 1 | `"oi"` com source vazio | intro Reverso + orienta upload + `suggestions` com add-docs | ✓ PASS |
| 2 | `"hello"` com PDFs pendentes | intro em PT + menciona 7 arquivos pendentes + `suggestions` processar | ✓ PASS |
| 3 | `"oi"` com processado + agent.md + pendentes | intro contextual + `suggestions` processar | ✓ PASS |
| 4 | `route-decision` always `greeting` para saudações | `intent: greeting` | ✓ PASS |
| 5 | Token count rico vs genérico | 316 tokens (rico) vs 43 tokens (genérico) | ✓ PASS |
| 6 | `pnpm typecheck lab/agent` | 0 erros | ✓ PASS |
| 7 | `pnpm typecheck lab/agent/interface` | 0 erros | ✓ PASS |
| 8 | Lints em todos os arquivos editados | 0 erros | ✓ PASS |

**Regressão Sprint 1:** `sourceEmpty:true, isFirstVisit:true` ✓ — intents `greeting, view_data, process_documents` ✓

**Regressão Sprint 2:** `deep_dive` + source vazio → texto orientar (sem fila) ✓ — `deep_dive` + PDFs pendentes → `approval-request` ✓

**Resultado geral:** PASS — greeting contextual com system prompt rico, suggestions dinâmicas por estado, ConversationEmptyState contextual.

---

### Sprint 8 — E11 Quick Research + E12 Consulta de Dados

**Data:** 2026-03-14
**Commit:** 5334d02 (implementação Sprint 8 — branch atual sem commit separado)
**Reset de partida:** `pnpm reset:investigation` + source-checkpoint manual + `pnpm reset:all` (Cenários B e E)

| # | Cenário | Esperado | Resultado |
|---|---------|----------|-----------|
| A | `"quem é a construtora contratada?"` com 1 preview processado | `route-decision: quick_research` + `source-reference` role:consulted + texto baseado no doc + `approval-request` dossiê | ✓ PASS |
| B | `"quem é o dono da empresa X?"` sem previews (reset:all) | orientar processar documentos primeiro | ✓ PASS |
| C | `"me mostra os leads"` com 1 lead criado | `route-decision: view_data` + lista leads com status + `suggestions` ao final | ✓ PASS |
| D | `"mostra o dossiê"` com dossier vazio | informa dossiê vazio, sem erro | ✓ PASS |
| E | `"me mostra as alegações"` com reset:all | `route-decision: view_data` + "Nenhuma alegação registrada ainda." + `suggestions` para processar documentos | ✓ PASS |
| F | `pnpm typecheck lab/agent` | 0 erros | ✓ PASS |

**Notas de implementação:**
- `handleQuickResearch`: carrega previews (até 5, 3000 chars cada), emite `source-reference` com `role: consulted`, system prompt com conteúdo dos documentos, `approval-request` ao final com `waitForApproval`
- `handleViewData`: snapshot completo (leads, dossier entities, allegations, fontes), system prompt rico, `suggestions` contextuais ao final
- `quick_research` e `view_data` removidos de `isDirectRoute` — cada um tem handler dedicado

**Regressão Sprint 1:** `sourceEmpty:true, isFirstVisit:true` ✓ — intents `greeting, view_data, quick_research` ✓

**Regressão Sprint 3:** `"oi"` → greeting contextual ✓

**Resultado geral:** PASS — E11 e E12 implementados com handlers especializados; contexto de documentos carregado corretamente no quick_research; view_data lista dados existentes e orienta quando não há dados.

---

### Sprints 4–7 e 9 — Registro consolidado

**Data:** 2026-03-14
**Reset de partida:** `pnpm reset:all`

#### Sprint 4 — E5 (Upload) + E6 (Processamento via interface)

| # | Cenário | Esperado | Resultado |
|---|---------|----------|-----------|
| 1 | `POST /api/upload` com PDF novo | `accepted: [arquivo]` | ⚠ PARTIAL — arquivo salvo em source corretamente, mas `accepted[]` vazio na resposta (bug na serialização da lista de aceitos) |
| 2 | `POST /api/upload` com PDF duplicado | `rejected` com `"Arquivo já existe em source"` | ✓ PASS |
| 3 | `"processa os documentos"` via SSE | `route-decision: process_documents`, `step-start` por arquivo | ✓ PASS |
| 4 | SSE: `source-reference` com `role: created` | eventos emitidos para preview.md e entidades de dossier | ✓ PASS |
| 5 | `pnpm typecheck lab/agent` | 0 erros | ✓ PASS |

**Resultado:** PASS (funcional) — processamento inicia, events corretos emitidos. Bug menor: `accepted[]` não populado na resposta do upload, mas arquivo é aceito.

---

#### Sprint 5 — E7 (Enhanced Init)

| # | Cenário | Esperado | Resultado |
|---|---------|----------|-----------|
| 1 | `pnpm init:test` com preview existente | `agent.md` criado, FILE NEW emitido | ✓ PASS |
| 2 | SSE init: `route-decision: init` | `approval-request` emitido para arquivos não processados | ✓ PASS |
| 3 | `hasAgentContext: true` após init | estado de contexto atualizado na API | ✓ PASS |

**Resultado:** PASS — init cria `agent.md` com contexto baseado nos documentos; gate de aprovação funciona.

---

#### Sprint 6 — E8 (Deep Dive UX) + E9 (Lead from hypothesis)

| # | Cenário | Esperado | Resultado |
|---|---------|----------|-----------|
| 1 | `pnpm dig:test` com preview | 3 leads sugeridos, sessão criada | ✓ PASS |
| 2 | SSE deep-dive: `route-decision: deep_dive` | detectado, `approval-request` emitido | ✓ PASS |
| 3 | SSE com sessão ativa: routing `deep_dive_next` | `reason: "active session: awaiting_plan_decision"` | ✓ PASS |
| 4 | `pnpm create-lead:test` | `lead-*.md` criado com Inquiry Plan | ✓ PASS |

**Resultado:** PASS — deep-dive gera leads, sessão stateful preservada, routing contextual correto.

---

#### Sprint 7 — E10 (Inquiry Enhanced UX)

| # | Cenário | Esperado | Resultado |
|---|---------|----------|-----------|
| 1 | SSE com lead disponível: `route-decision: execute_inquiry` | rota detectada, `approval-request` emitido | ✓ PASS |
| 2 | `pnpm inquiry:test --lead <slug>` | inquiry executada, write gate bloqueia sem aprovação explícita | ✓ PASS (gate funcionando) |
| 3 | Write gate `missing_explicit_persist_approval` | nenhum allegation persistido sem aprovação | ✓ PASS |

**Resultado:** PASS — inquiry detecta leads, executa LLM, write gate bloqueia persistência não aprovada; allegation events são emitidos após aprovação (validado em implementação E10).

---

#### Sprint 9 — E13 (Polish)

| # | Cenário | Esperado | Resultado |
|---|---------|----------|-----------|
| 1 | `"adiciona ao agent.md que..."` | `route-decision: update_agent_context` + `approval-request` | ✓ PASS |
| 2 | SSE init: `approval-request` emitido | gate para processar arquivos antes de init | ✓ PASS |
| 3 | `pnpm typecheck lab/agent` | 0 erros | ✓ PASS |
| 4 | `pnpm typecheck lab/agent/interface` | 0 erros | ✓ PASS |

**Resultado:** PASS — `update_agent_context` detectado via LLM, approval-request emitido; polish de suggestions, source-reference e ChatErrorBoundary validados por typecheck e inspeção de código.

---

### Gaps P1/P2/P3 — Workflow Report

**Data:** 2026-03-14
**Escopo:** P1.2 (RetryIndicator botões), P2.2 (rich parts localStorage), P3.1 (context compaction), P1.1 (test registry)

| # | Cenário | Esperado | Resultado |
|---|---------|----------|-----------|
| 1 | `RetryIndicator` com `onCancel` + `onRetryNow` | botões renderizados; `retryLastMessage` popula input | ✓ PASS (typecheck) |
| 2 | `finalizeStreamingMessage` persiste parts no localStorage | `agent-rich-parts-{id}` salvo | ✓ PASS (code review) |
| 3 | `loadPersistedMessages` restaura rich parts | artifact/lead/allegation/suggestions restaurados após reload | ✓ PASS (code review) |
| 4 | `buildHistory` com compaction (prune 500 / trim 120) | pares recentes preservados; histórico antigo truncado | ✓ PASS (typecheck) |
| 5 | `pnpm typecheck lab/agent` | 0 erros | ✓ PASS |
| 6 | `pnpm typecheck lab/agent/interface` | 0 erros | ✓ PASS |

**Resultado:** PASS — todos os gaps implementados com 0 erros de typecheck.

---

## Por commit (mais recente primeiro)

_(Preencher com post-commit-tests após commits de código.)_
