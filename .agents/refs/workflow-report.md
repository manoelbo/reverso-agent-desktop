# Workflow Report — Agente Reverso

> **Data:** 2026-03-14
> **Objetivo:** Avaliar o estado atual da implementação em relação ao design de workflow (`agente-workflow-design.md`) e ao plano mestre (`workflow-master-plan.md`), identificar gaps remanescentes e sugerir próximos passos.

---

## 1. Resumo Executivo

O projeto seguiu fielmente o `workflow-master-plan.md`: todas as 13 etapas de implementação foram codificadas, cobrindo a totalidade dos 11 caminhos de interação definidos no `agente-workflow-design.md`. A infraestrutura de backend (state detection, roteamento LLM-driven, fila, abort/retry, novos endpoints) e a camada de UI (AI Elements, componentes específicos, SSE event handling, upload de arquivos) estão funcionais.

4 dos 9 sprints têm validação formal registrada em `test-registry.md` (Sprints 1, 2, 3 e 8). Os demais (Sprints 4–7 e 9) foram implementados mas não tiveram seus cenários registrados.

Restam **6 gaps de completude** — nenhum bloqueia o uso do agente, mas alguns afetam resiliência e polimento da experiência.

### Scorecard

| Dimensão | Status |
|----------|--------|
| Caminhos de workflow (A–K + extras) | 15/15 cobertos |
| Etapas de implementação (E1–E13) | 12 completas, 1 parcial (E13) |
| Sprints com teste formal | 4/9 |
| Gaps críticos de UX | 0 |
| Gaps de resiliência/polish | 6 |

---

## 2. Cobertura por Etapa (E1–E13)

| Etapa | Descrição | Backend | Frontend | Teste Formal |
|-------|-----------|:-------:|:--------:|:------------:|
| **E1** | State Detection (`state-detector.ts`) | ✅ | — | Sprint 1 ✅ |
| **E2** | Intents LLM expandidos (7 novos intents) | ✅ | — | Sprint 1 ✅ |
| **E3** | Pré-routing state-aware + Fila + Abort + Retry | ✅ | ✅ | Sprint 2 ✅ |
| **E4** | Greeting handler + Source vazio (Caminhos A/B) | ✅ | ✅ | Sprint 3 ✅ |
| **E5** | File Upload + Detecção de duplicados | ✅ | ✅ | — |
| **E6** | Processamento de documentos via interface | ✅ | ✅ | — |
| **E7** | Enhanced Init: agent.md como Artifact + continuidade | ✅ | ✅ | — |
| **E8** | Deep Dive Enhanced UX: fontes + LeadCard interativo | ✅ | ✅ | — |
| **E9** | Lead a partir de hipótese do usuário | ✅ | ✅ | — |
| **E10** | Inquiry Enhanced UX: alegações + findings interativos | ✅ | ✅ | — |
| **E11** | Quick Research (Caminho G) | ✅ | ✅ | Sprint 8 ✅ |
| **E12** | Consulta e Visualização de Dados (Caminho K) | ✅ | ✅ | Sprint 8 ✅ |
| **E13** | Agent.md verbal + Sugestões dinâmicas + Polish | ✅ parcial | ✅ parcial | — |

### Detalhes por etapa

**E1 — State Detection**
`state-detector.ts` implementa `detectSystemState()` com todos os campos previstos: `sourceEmpty`, `unprocessedFiles`, `processedFiles`, `failedFiles`, `hasAgentContext`, `isFirstVisit`, `hasDeepDiveSession`, `sessionStage`, `leads`, `hasPreviewsWithoutInit`, `lastSessionTimestamp`. O `GET /api/context` expõe o estado completo. `RoutingContext` inclui `systemState`.

**E2 — Intents LLM expandidos**
`agent-router.ts` em `src/prompts/` define os 7 novos intents: `greeting`, `quick_research`, `view_data`, `update_agent_context`, `process_documents`, `general_chat`, `abort_current`. O `buildAgentRouterUserPrompt` inclui estado do source. `heuristicAgentIntent` trata `abort_current` antes do LLM. `decideAgentRoute` em `run-agent.ts` mapeia todos os intents.

**E3 — Pré-routing + Fila + Abort + Retry**
`chat.ts` faz pré-checks: source vazio, PDFs pendentes (com/sem auto-approve), previews sem init. `QueuedOperation` (process_documents, init, original_intent) executada em sequência no mesmo request SSE, com `signal.aborted` entre steps e `withRetry` por step. `request-registry.ts` gerencia `AbortController` por request. `retry-handler.ts` com backoff exponencial (2s→4s→8s) e distinção de erros retriáveis/não retriáveis. `POST /api/cancel` funcional. Frontend: `QueueProgress`, `RetryIndicator`, botão cancel no PromptInput durante streaming.

**E4 — Greeting + Source vazio**
`handleGreeting` usa `streamDirectChat` com system prompt rico (identidade Reverso, fluxo em 5 passos, estado atual do source). Inclui aviso de PDFs pendentes, arquivos com falha, orientação de upload. Emite `suggestions` event com sugestões contextuais. `ConversationEmptyState` é contextualizado com `sessionContext`. Frontend renderiza `DynamicSuggestions` após resposta.

**E5 — File Upload**
`POST /api/upload` aceita multipart/form-data, verifica duplicados por nome, rejeita com aviso, copia novos para `source/`, atualiza `source-checkpoint` com `not_processed`. Frontend: input oculto para PDFs, botão de clipe, drag & drop na textarea, `FileAttachmentPreview`, `UploadFeedbackBanner` com aceitos/rejeitados. Fluxo: upload → mensagem automática → agente detecta PDFs pendentes.

**E6 — Processamento via Interface**
`handleProcessDocuments` via `runDocumentProcessingWithFeedback` processa arquivos com `SseUiFeedback`. Emite `step-start`/`step-complete`/`step-error` por arquivo. Continua em caso de erro individual. Emite `source-reference` com `role: created` para artefatos gerados. Emite `artifact` com preview. Se tem `agent.md`, emite `approval-request` para atualizar. Aceita `AbortSignal`.

**E7 — Enhanced Init**
`runInit` emite `artifact` com conteúdo do `agent.md` via `SseUiFeedback.artifact()`. Texto explicativo inclui como atualizar verbalmente e via `/init`. Init automático (pré-check) continua para intent original após concluir. Re-init sobrescreve com novo `artifact`. Frontend: `ArtifactDisplay` renderiza com título, caminho e botão copiar.

**E8 — Deep Dive Enhanced UX**
`runDig` emite `source-reference` com `role: consulted` para previews selecionados. Verifica leads duplicados antes de sugerir. Emite `lead-suggestion` com inquiry plan incluso. `POST /api/leads/:slug/action` aceita/rejeita leads. Pós-rejeição: emite `suggestions` com opções (novo deep-dive, criar lead próprio). Frontend: `LeadCard` com inquiry plan colapsável, botões "Investigar" e "Rejeitar". Clicar "Investigar" envia mensagem automática ao chat.

**E9 — Lead a partir de hipótese**
`runCreateLead` emite `lead-suggestion` com inquiry plan. Verifica se lead similar já existe. Se sim, emite `approval-request`. Frontend: mesmo `LeadCard` de E8. Botão "Alterar" abre campo de texto para o usuário modificar o lead.

**E10 — Inquiry Enhanced UX**
`runInquiry` emite `allegation` events com findings ao concluir. Doom loop: `agent-loop.ts` detecta 3 tool calls idênticos (`repeatedActionCount >= 3`) e quebra com `no_progress`; `run-inquiry.ts` captura em `onStopped` e chama `feedback.requestApproval(...)` com "Loop detectado". Retry automático via `withRetry` em cada step da fila. `POST /api/allegations/:id/action` e `POST /api/findings/:id/action` persistem status. Multi-inquiry usa `inquiryBatchRunner`. Frontend: `AllegationDisplay` com aceitar/recusar, `FindingItem` com estados verificado/recusado/inverificado, sugestões pós-inquiry.

**E11 — Quick Research**
`handleQuickResearch`: carrega até 5 previews (3000 chars cada), emite `source-reference` com `role: consulted`, system prompt com conteúdo dos documentos, `approval-request` para criar/atualizar dossiê via `waitForApproval`. Sem previews: orienta processar primeiro. Com auto-approve: dossiê criado direto.

**E12 — Consulta e Visualização**
`handleViewData`: snapshot completo de leads, dossier (people, groups, places), allegations, fontes. System prompt rico com dados existentes. Emite `suggestions` contextuais ao final. Dados inexistentes: informa e orienta como criar.

**E13 — Polish (parcial)**
Implementado: `handleUpdateAgentContext` com `approval-request` antes de modificar, `runAgentSetup`, `artifact` com agent.md atualizado. `shouldCaptureInvestigationContext` como side effect em `run-agent.ts` para captura verbal implícita. `DynamicSuggestions` no final de cada fluxo. `ChatErrorBoundary` global e inline por part. Auto-approve integrado nos approval-requests.

Parcialmente ausente: reconexão SSE automática com backoff, botões "Retry Now"/"Cancel" no `RetryIndicator`, restauração de rich parts na sessão persistida.

---

## 3. Cobertura por Caminho do Workflow Design

| Caminho | Descrição | Implementado em | Status |
|---------|-----------|-----------------|:------:|
| **A** | Saudação contextual | E4 (`handleGreeting`) | ✅ |
| **B** | Source vazio — orientar upload | E4 (`handleGreeting`) | ✅ |
| **C** | Upload de PDFs no chat + duplicados | E5 (`POST /api/upload`) | ✅ |
| **D** | Source com PDFs não processados | E3 (pré-routing + fila) + E6 | ✅ |
| **E** | Processamento em si (feedback, Shimmer, Artifact) | E6 (`handleProcessDocuments`) | ✅ |
| **F** | Init automático: previews sem agent.md | E7 (`runInit` + artifact event) | ✅ |
| **G** | Roteamento por intenção (todos os runners) | E2 (intents) + handlers específicos | ✅ |
| **H** | Explorar sem init (fila: init → deep-dive) | E3 (fila) + E7 + E8 | ✅ |
| **I** | Explorar sem nada (fila: upload → process → init → deep-dive) | E3 + E5 + E6 + E7 + E8 | ✅ |
| **J** | Deep Dive em si (fontes, leads interativos, pós-rejeição) | E8 (`runDig` + `LeadCard`) | ✅ |
| **K** | Consulta e visualização de dados existentes | E12 (`handleViewData`) | ✅ |
| — | Quick research (perguntas factuais) | E11 (`handleQuickResearch`) | ✅ |
| — | Lead a partir de hipótese do usuário | E9 (`runCreateLead`) | ✅ |
| — | Inquiry (um ou vários leads) | E10 (`runInquiry` + batch) | ✅ |
| — | Continuidade de sessão deep-dive | `deep-dive-next` + `routing-context` | ✅ |

---

## 4. Regras Gerais do Workflow Design

| Regra | Descrição | Status | Observação |
|-------|-----------|:------:|------------|
| Auto-accept | Sem auto-approve: pede permissão; com auto-approve: executa direto | ✅ | Toggle no `ChatHeader`; todos os `approval-request` checam auto-approve no `use-agent-chat.ts` |
| Sources (role) | Fontes consultadas aparecem em Sources; artefatos criados não aparecem | ✅ | `SourcesDisplay` filtra por `role !== 'created'`; `source-reference` tem `role?: 'consulted' \| 'created'` |
| Chain of Thought | Exibe CoT que vem do modelo; não inventa passos | ✅ | `ChainOfThought` do AI Elements; alimentado por `reasoning` event do SSE |
| Feedback em texto | Agente diz o que vai fazer antes de executar | ✅ | Todos os handlers emitem `text-delta` explicativo antes de iniciar operações |
| Resumo final + sugestões | Cada fluxo termina com resumo MD + sugestões | ✅ | `suggestions` event + `DynamicSuggestions` no final de cada handler |
| Shimmer | Durante geração longa (preview, réplica): Shimmer; ao terminar, CodeBlock/Artifact | ✅ | `AssistantMessage` usa Shimmer enquanto streaming; ArtifactDisplay ao final |
| Verificação de arquivos | A cada conversa, conferir PDFs processados; pendentes → perguntar | ✅ | Pré-routing em `chat.ts` faz check antes de qualquer runner |
| Contexto início do projeto | Primeira experiência: explicar plataforma antes de sugerir processar | ✅ | `isFirstVisit` no `SystemState`; `handleGreeting` e pré-routing incluem contexto explicativo |
| Após init (sem pedido) | Orientar próximo passo: deep-dive; mencionar `/init` | ✅ | `runInit` emite sugestões contextuais ao final |
| Atualização do agent.md | Verbal ou via comando; pedir permissão antes de alterar | ✅ | `handleUpdateAgentContext` com `approval-request`; `shouldCaptureInvestigationContext` como side effect |
| Upload em projeto existente | Processar novos PDFs + oferecer atualizar agent.md | ✅ | E6: `approval-request` pós-processamento quando `hasAgentContext` |
| Fila (queuing) | Encadear processamento → pedido original | ✅ | `executeQueue` em `chat.ts` |
| Loop autorreflexão | Tentar resolver em loop antes de reportar falha | ✅ | PEV no `agent-loop.ts`; doom loop detection com `approval-request` |
| Detecção de idioma | Responder no idioma do usuário | ✅ | LLM detecta e adapta; mencionado nos system prompts |

---

## 5. Componentes de Interface

| Expectativa do Design | Componente Implementado | Status |
|-----------------------|-------------------------|:------:|
| Resposta do assistente | `Message`, `MessageContent`, `MessageResponse` | ✅ |
| Sugestões no vazio | `Suggestion`, `Suggestions` (AI Elements) | ✅ |
| Raciocínio do modelo | `ChainOfThought` (AI Elements) | ✅ |
| Anexos no input | `Attachments` (AI Elements) + drag & drop no App | ✅ |
| Confirmação (aprovar/rejeitar) | `Confirmation` (AI Elements) + `ConfirmationDisplay` | ✅ |
| Processando/pensando | `Shimmer` (AI Elements) | ✅ |
| Chamada/resultado de tool | `Tool` (AI Elements) + `ToolCallDisplay` | ✅ |
| Arquivo gerado (preview, agent.md) | `ArtifactDisplay` (CodeBlock + título + copiar) | ✅ parcial¹ |
| Fontes consultadas | `SourcesDisplay` (filtra por role) | ✅ |
| Lead sugerido (Inquiry / Rejeitar) | `LeadCard` com inquiry plan colapsável + botões | ✅ |
| Alegações com findings | `AllegationDisplay` + `FindingItem` (3 estados) | ✅ |
| Dados existentes (consulta) | `ArtifactDisplay` (dossiê, agent.md) | ✅ |
| Fila / progresso de execução | `QueueProgress` | ✅ |
| Sugestões dinâmicas pós-fluxo | `DynamicSuggestions` | ✅ |
| Retry com contagem regressiva | `RetryIndicator` | ✅ parcial² |
| Error boundary | `ChatErrorBoundary` global + inline por part | ✅ |
| Loader enquanto submetendo | `Loader` (AI Elements) | ✅ |

¹ `ArtifactDisplay` tem copiar mas falta ação "abrir" no viewer/editor.
² `RetryIndicator` exibe contagem regressiva e snippet de erro, mas não tem botões "Retry Now" e "Cancel".

---

## 6. Gaps e Pendências

### Severidade: Média (impacto na resiliência)

**G1 — Reconexão SSE automática**

O transport usa `fetch` + `parseSseResponse` (POST). Se o stream cair (rede instável, servidor reiniciado), a UI não reconecta automaticamente. O plano previa um `EventSource` wrapper com retry + backoff exponencial.

- Impacto: conversa interrompida por falha de rede não se recupera sem ação manual do usuário.
- Ação sugerida: implementar wrapper de reconexão em `HttpAgentTransport` com backoff exponencial (1s→2s→4s→8s), enviando `Last-Event-ID` na reconexão para o servidor poder reemitir eventos perdidos ou iniciar stream fresco.

**G2 — Persistência de rich parts na sessão**

`loadPersistedMessages` em `agent-chat-store.ts` restaura apenas parts do tipo `text`. Ao recarregar a interface, parts de `artifact`, `lead-suggestion`, `allegation`, `queue`, `suggestions` e `retry` são perdidos.

- Impacto: o usuário perde referência visual de leads sugeridos, alegações e artefatos gerados em sessões anteriores.
- Ação sugerida: ampliar o schema de `PersistedMessage` no backend (`chat-session.ts`) para serializar parts estruturados relevantes (artifact, lead-suggestion, allegation); atualizar `loadPersistedMessages` para reconstruir o store com todos os tipos.

**G3 — Context compaction avançada**

O contexto de conversa usa apenas sliding-window com `HISTORY_TOKEN_BUDGET = 6_000` tokens. O plano previa 3 níveis: prune (remover outputs completos de tool calls antigos, mantendo nome + resumo), trim (encurtar mensagens antigas para ~120 chars), compact (sumarizar via LLM mensagens mais antigas).

- Impacto: em investigações longas com muitos tool calls, o contexto trunca mensagens recentes antes do ideal.
- Ação sugerida: implementar em `direct-chat.ts`: (1) prune de outputs de tool calls com mais de N mensagens de idade; (2) trim como fallback; (3) compact via LLM como último recurso, com `agent.md` sempre com prioridade máxima.

### Severidade: Baixa (polish / UX secundária)

**G4 — Botões "Retry Now" e "Cancel" no RetryIndicator**

`RetryIndicator` exibe o label de contagem regressiva e o snippet de erro, mas não tem os botões interativos previstos na seção 3.7 do master plan. O usuário não pode acelerar o retry ou cancelar durante a espera.

- Ação sugerida: adicionar dois botões ao `RetryIndicator`: "Tentar agora" (chama `cancelCurrentRequest` para abortar o sleep e forçar retry imediato) e "Cancelar" (aborta a operação inteira). Ambas as ações já têm endpoints no backend.

**G5 — Ação "Abrir" no ArtifactDisplay**

`ArtifactDisplay` tem o botão de copiar mas não tem a ação de abrir o arquivo no viewer/editor do app.

- Ação sugerida: quando o path do artifact corresponder a um arquivo do filesystem (ex.: `agent.md`, preview), emitir um evento IPC para abrir no viewer do Electron. Por ora pode ser um link para o path no sistema de arquivos.

**G6 — `onStop` explícito no PromptInput**

O cancel durante streaming funciona via submit do form (o botão de envio vira ícone de stop), mas o `PromptInput` não recebe `onStop` explicitamente como prop. O fluxo funciona mas não é canônico com o AI Elements.

- Ação sugerida: passar `onStop={cancelCurrentRequest}` ao `PromptInput` para alinhar com a API do componente; remover o workaround via submit.

### Validação: ausência de registros formais

**G7 — Sprints 4, 5, 6, 7 e 9 sem entrada no test-registry**

Os sprints estão implementados mas não possuem cenários registrados em `.agents/test-registry.md`. Sem registro, não é possível rodar regressão acumulada por sprint.

- Ação sugerida: executar os cenários de validação definidos no master plan para cada sprint e registrar em `test-registry.md`. Isso é especialmente importante para os fluxos mais complexos: E5 (upload), E6 (processamento), E7 (init enhanced), E8 (deep dive + LeadCard interativo), E10 (inquiry + alegações).

---

## 7. Testes e Validação

### Status por sprint

| Sprint | Etapas | Data | Resultado | Observação |
|--------|--------|------|-----------|------------|
| Sprint 1 | E1 + E2 | 2026-03-14 | ✅ PASS | 12 cenários; bug corrigido: `chat-session.ts` usava path hardcoded |
| Sprint 2 | E3 | 2026-03-14 | ✅ PASS | 4 cenários + regressão Sprint 1 |
| Sprint 3 | E4 | 2026-03-14 | ✅ PASS | 8 cenários + regressão Sprints 1–2 |
| Sprint 4 | E5 + E6 | — | — | Implementado; sem registro |
| Sprint 5 | E7 | — | — | Implementado; sem registro |
| Sprint 6 | E8 + E9 | — | — | Implementado; sem registro |
| Sprint 7 | E10 | — | — | Implementado; sem registro |
| Sprint 8 | E11 + E12 | 2026-03-14 | ✅ PASS | 6 cenários + regressão Sprints 1–3 |
| Sprint 9 | E13 | — | — | Parcialmente implementado; sem registro |

### Testes unitários existentes

A suíte de testes em `lab/agent/tests/` cobre bem as camadas de lógica de investigação:

- `agent-router.test.ts` — classificação de intents e routing
- `agent-loop.test.ts` — PEV, no_progress, tool errors, compliance
- `deep-dive-flow.test.ts`, `create-lead.test.ts`, `inquiry-*.test.ts` (6 arquivos) — fluxo investigativo
- `document-processing/` (5 arquivos) — pipeline de processamento
- `evidence-verifier.test.ts`, `compliance-hooks.test.ts`, `pre-write-validation.test.ts` — camada editorial

Ausentes: testes de integração do servidor HTTP (endpoints REST), testes do fluxo SSE end-to-end, testes da UI (nenhum arquivo de test na `interface/`).

---

## 8. Próximos Passos Sugeridos

### Prioridade 1 — Fechar validação (baixo esforço, alto valor)

**P1.1 — Registrar Sprints 4–7 e 9 no test-registry**
Executar os cenários definidos no master plan (seção 5) para cada sprint usando test mode (`pnpm serve:test` + resets). Registrar resultados e regressão acumulada. Isso fecha a lacuna de validação formal sem implementar nada novo.

**P1.2 — Adicionar botões ao RetryIndicator**
Pequena adição em `retry-indicator.tsx`: dois botões que chamam `transport.cancelRequest` e forçam retry ou cancelam. Esforço: 1–2h.

### Prioridade 2 — Resiliência (médio esforço, alto impacto em produção)

**P2.1 — Reconexão SSE com backoff**
Implementar wrapper em `HttpAgentTransport` que detecta queda do stream e tenta reconectar. Enviar `Last-Event-ID`. Backend pode reemitir estado ou iniciar stream fresco. Esforço: 3–4h.

**P2.2 — Persistência de rich parts**
Ampliar `PersistedMessage` no backend e `loadPersistedMessages` no frontend para restaurar `artifact`, `lead-suggestion` e `allegation` ao recarregar. Esforço: 4–6h.

### Prioridade 3 — Qualidade de código (esforço médio, benefício a longo prazo)

**P3.1 — Context compaction avançada**
Implementar os 3 níveis em `direct-chat.ts` (prune → trim → compact). Prune é o mais simples e já traz benefício imediato. Compact via LLM é opcional a curto prazo. Esforço: 4–8h.

**P3.2 — Ação "Abrir" no ArtifactDisplay**
Adicionar IPC/link para abrir o arquivo no viewer do Electron. Depende do estado atual do viewer no app principal. Esforço: variável.

### Prioridade 4 — Integração com app principal (esforço alto, fase seguinte)

O `lab/agent/interface` é um ambiente isolado de prototipagem. O próximo ciclo natural do projeto é integrar a shell de chat no app Electron principal (`src/renderer`), conectando:

- O servidor HTTP/SSE (`lab/agent/src/server/`) ao IPC do Electron
- O `IpcAgentTransport` (hoje stub) ao `contextBridge` real
- Os componentes de chat ao layout Application Shell 9 (Activity Bar + painel de chat)

Essa integração fecha o ciclo entre protótipo e produto.

---

## 9. Conclusão

O `agente-workflow-design.md` foi implementado em sua totalidade funcional. Todos os 15 caminhos de interação definidos estão cobertos. As 13 etapas do master plan foram executadas, com 12 completas e 1 (E13) em estado parcial. A arquitetura de backend (LLM-driven routing, state detection, fila, abort/retry) e a camada de UI (AI Elements, componentes específicos, SSE event handling) formam uma base sólida.

Os 6 gaps remanescentes são todos de polish ou resiliência — nenhum bloqueia o uso investigativo do agente. A prioridade imediata é fechar a validação formal dos Sprints 4–7 e 9, seguida da reconexão SSE e persistência de rich parts para tornar a experiência robusta em produção.

---

*Relatório gerado em 2026-03-14 com base em inspeção de `lab/agent/src/`, `lab/agent/interface/src/`, `lab/agent/tests/` e `.agents/test-registry.md`.*
