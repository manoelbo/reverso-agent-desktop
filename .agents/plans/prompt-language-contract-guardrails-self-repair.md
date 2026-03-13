# Feature: Contrato estrito de prompts + política de idioma unificada + guardrails + critique/repair

The following plan should be complete, but it is important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils, types and models. Import from the right files etc.

## Feature Description

Elevar a robustez do agente no `lab/agent` ao reduzir texto livre e aumentar previsibilidade em quatro frentes:

1. **Contrato de saída por tarefa**: todos os estágios relevantes (`dig`, `create-lead`, `inquiry`, e planning do `inquiry`) devem exigir JSON estrito, com validação estrutural e fallback controlado.
2. **Política de idioma unificada por contexto**:
   - `responseLanguage`: idioma do texto do usuário (fallback `en`).
   - `artifactLanguage`: idioma do source (fallback `source`) com override explícito.
3. **Guardrails por estágio**:
   - `dig`: explicitar hipóteses, lacunas e recomendações de próximo passo.
   - `inquiry`: permitir apenas conclusões suportadas por evidência rastreável.
4. **Autocorreção antes de persistir**: rodada curta de “critique and repair” para validar/ajustar payload final antes de gravar artifacts.

## User Story

As a jornalista investigativo usando o Agent Lab
I want respostas com JSON estrito, idioma consistente por contexto, guardrails por estágio e autocorreção antes de persistir
So that o fluxo fique mais confiável, auditável e resistente a alucinação/formatação inválida.

## Problem Statement

- O fluxo atual mistura prompts com instruções de formato, mas ainda depende de parsing permissivo e fallback silencioso em vários pontos.
- A política de idioma já avançou, porém a aplicação por contexto não está centralizada com contrato explícito de entrada/saída por tarefa.
- `dig` ainda permite saída em texto livre para etapas críticas, dificultando validação automática.
- `inquiry` já pede evidências, mas falta uma etapa sistemática de crítica/reparo antes da persistência em disco.

## Solution Statement

- Introduzir uma camada comum de **JSON contract + validator** para prompts do agent loop.
- Consolidar política de idioma em um resolvedor por contexto (`response` vs `artifact`) reutilizado por runners e pipeline de documentos.
- Reescrever guardrails de prompt por estágio com foco em sinais úteis:
  - `dig`: hipóteses + lacunas + ações sugeridas.
  - `inquiry`: conclusões somente se sustentadas por `source/page/excerpt`.
- Adicionar um passo rápido de **critique and repair** (1 rodada) imediatamente antes de persistir `lead/allegations/findings` e relatórios finais.

## Feature Metadata

**Feature Type**: Enhancement  
**Estimated Complexity**: High  
**Primary Systems Affected**: `lab/agent` (prompts, runners, language policy, parsing/validation, persistence)  
**Dependencies**: OpenRouter client existente, contratos em `core/contracts.ts`, loop/orquestração em `core/agent-loop.ts`

---

## CONTEXT REFERENCES

### Relevant Codebase Files — IMPORTANT: YOU MUST READ THESE BEFORE IMPLEMENTING!

- `lab/agent/src/core/language.ts` (lines 1-104) - Núcleo da política de idioma (`responseLanguage`, `artifactLanguage`, detecção e instruções).
- `lab/agent/src/config/env.ts` (lines 11-89) - Defaults/runtime flags para idioma e loop settings.
- `lab/agent/src/index.ts` (lines 32-167) - Surface de CLI flags e passagem de opções por comando.
- `lab/agent/src/prompts/dig.ts` (lines 25-131) - Prompts do `dig` ainda com formato textual em etapas finais.
- `lab/agent/src/prompts/create-lead.ts` (lines 5-77) - Prompt JSON de lead; base para contrato estrito.
- `lab/agent/src/prompts/inquiry.ts` (lines 1-177) - Prompt final e prompt de planejamento de `inquiry` (já JSON-oriented).
- `lab/agent/src/runner/run-dig.ts` (lines 54-172) - Fluxo incremental atual com respostas textuais e relatório markdown final.
- `lab/agent/src/runner/run-create-lead.ts` (lines 48-207) - Parser/fallback de create-lead e resolução de idioma por ideia.
- `lab/agent/src/runner/run-inquiry.ts` (lines 65-498) - PEV, parse de inquiry, persistência de artifacts e stop reason.
- `lab/agent/src/tools/investigative/create-lead-file.ts` (lines 150-383) - Persistência de lead/allegations/findings e conclusão.
- `lab/agent/src/llm/openrouter-client.ts` (lines 39-151) - Cliente de LLM e ponto para helper JSON robusto (sem side effects).
- `lab/agent/tests/create-lead.test.ts` (lines 10-62) - Testes atuais de parsing/prompt de create-lead.
- `lab/agent/tests/inquiry.test.ts` (lines 5-39) - Testes atuais de parsing/fallback do inquiry.

### New Files to Create

- `lab/agent/src/core/json-contract.ts` - Contratos e utilitários de validação estrita por estágio.
- `lab/agent/src/prompts/critique-repair.ts` - Prompt curto de autocorreção de payload (critique and repair).
- `lab/agent/tests/json-contract.test.ts` - Cobertura da validação estrita e reparo básico.

### Relevant Documentation — YOU SHOULD READ THESE BEFORE IMPLEMENTING! (optional; add if Context7 was used)

- Não aplicável neste plano (sem consulta Context7 obrigatória).

### Patterns to Follow

**Naming Conventions:** `run-<command>.ts` para orquestração; `prompts/<stage>.ts` para instruções de modelo; utilitários em `core/`.  
**Error Handling:** fallback explícito e observável; evitar fallback silencioso que mascara resposta inválida.  
**Logging Pattern:** manter `feedback.step/warn/finalSummary` e eventos de loop já existentes.  
**Other Relevant Patterns:** manter prompts em inglês; conteúdo de resposta/artifact controlado por instrução de idioma.

---

## IMPLEMENTATION PLAN

### Phase 1: Contrato JSON Estrito por Estágio
**Tasks:** criar contratos de saída por tarefa, validador comum e normalização mínima sem texto livre.

### Phase 2: Política de Idioma Unificada por Contexto
**Tasks:** centralizar resolução de idioma de resposta/artifact e padronizar consumo nos runners.

### Phase 3: Prompt Guardrails por Estágio
**Tasks:** reforçar instruções de `dig` (hipóteses/lacunas) e `inquiry` (somente evidência suportada).

### Phase 4: Critique and Repair antes de Persistência
**Tasks:** inserir rodada curta de crítica/reparo no caminho final de `dig` e `inquiry`.

### Phase 5: Testes e Rollout Seguro
**Tasks:** atualizar testes existentes, criar novos testes, validar CLI e regressão.

---

## STEP-BY-STEP TASKS

Execute every task in order, top to bottom. Each task is atomic and independently testable.

### CREATE `lab/agent/src/core/json-contract.ts`
- **IMPLEMENT**: Definir interfaces/guards para payloads de `dig`, `create-lead`, `inquiry`, `inquiry planning`; expor helpers `parseStrictJson`, `validate<Stage>Payload`, `formatContractErrors`.
- **PATTERN**: `parseInquiryResponse` e `parseCreateLeadResponse` como baseline de normalização.
- **IMPORTS**: utilitários existentes de `core/markdown.ts` (`stripCodeFence`), tipos de `core/contracts.ts` e `prompts/*`.
- **GOTCHA**: Rejeitar chaves obrigatórias ausentes e tipos inválidos; não aceitar texto fora do JSON.
- **VALIDATE**: `pnpm --dir lab/agent run typecheck`

### UPDATE `lab/agent/src/prompts/dig.ts`
- **IMPLEMENT**: Trocar contratos textuais por JSON estrito para:
  - conclusão incremental (`summary`, `keyFindings`, `hypotheses`, `gaps`),
  - linhas sugeridas (`lines[]` com rank e justificativa),
  - comparação final com existentes (`topLines[]`, `recommendation`, `overlapNotes`).
- **PATTERN**: estilo “Return ONLY valid JSON” já usado em `create-lead`/`inquiry`.
- **GOTCHA**: Manter prompts em inglês e limitar campos para evitar verbosidade.
- **VALIDATE**: `pnpm --dir lab/agent run typecheck`

### UPDATE `lab/agent/src/prompts/inquiry.ts`
- **IMPLEMENT**: Endurecer guardrails para exigir que conclusão e findings só usem alegações suportadas por evidência (`source`, `page?`, `excerpt`), com regra explícita de “se não houver evidência, não promover para finding”.
- **PATTERN**: regras mandatórias já existentes no `buildInquirySystemPrompt`.
- **GOTCHA**: manter compatibilidade com cenário `plan_another_inquiry`.
- **VALIDATE**: `pnpm --dir lab/agent run typecheck`

### CREATE `lab/agent/src/prompts/critique-repair.ts`
- **IMPLEMENT**: Prompt compacto para crítica/reparo de payload JSON (`input_json`, `contract_name`, `hard_rules`), retornando JSON corrigido sem texto adicional.
- **PATTERN**: temperatura baixa (0.0-0.1) e instrução objetiva.
- **VALIDATE**: `pnpm --dir lab/agent run typecheck`

### UPDATE `lab/agent/src/runner/run-dig.ts`
- **IMPLEMENT**: Migrar etapas de resposta para payload JSON validado por `json-contract`; persistir relatório final com dados estruturados e render markdown derivado.
- **PATTERN**: manter fluxo incremental atual e `feedback` existente.
- **GOTCHA**: se validação falhar, executar 1 rodada de `critique and repair`; se persistir inválido, interromper com erro claro.
- **VALIDATE**: `pnpm --dir lab/agent run typecheck`

### UPDATE `lab/agent/src/runner/run-create-lead.ts`
- **IMPLEMENT**: Substituir parser permissivo por validação contratual estrita; manter fallback apenas para campos opcionais, nunca para estrutura obrigatória.
- **PATTERN**: política de idioma atual (`resolveResponseLanguage`) deve continuar.
- **GOTCHA**: preservar compatibilidade com `--idea` ausente.
- **VALIDATE**: `pnpm --dir lab/agent run typecheck`

### UPDATE `lab/agent/src/runner/run-inquiry.ts`
- **IMPLEMENT**:
  - Aplicar contrato estrito no planning e na resposta final.
  - Inserir etapa `critique and repair` antes de `persistInquiryArtifacts` e `appendLeadConclusion`.
  - Bloquear persistência quando claims/finding não tiverem evidência válida.
- **PATTERN**: reaproveitar `confidenceThreshold`, `stopReason` e eventos de loop.
- **GOTCHA**: manter `executionContext` e comportamento PEV intactos.
- **VALIDATE**: `pnpm --dir lab/agent run typecheck`

### UPDATE `lab/agent/src/core/language.ts`
- **IMPLEMENT**: Introduzir resolvedores de contexto explícitos (ex.: `resolveResponseLanguageForPrompt`, `resolveArtifactLanguageForSource`) e unificar fallback em `en`/`source`.
- **PATTERN**: não quebrar assinaturas atuais sem migração nos runners.
- **GOTCHA**: manter override por env/CLI já existente.
- **VALIDATE**: `pnpm --dir lab/agent run typecheck`

### UPDATE `lab/agent/src/config/env.ts` e `lab/agent/src/index.ts`
- **IMPLEMENT**: adicionar flags/envs para controlar autocorreção e idioma de forma explícita, por exemplo:
  - `--self-repair` / `AGENT_LAB_SELF_REPAIR_ENABLED`
  - `--self-repair-max-rounds` / `AGENT_LAB_SELF_REPAIR_MAX_ROUNDS` (default 1)
- **PATTERN**: parse e validação de flags conforme helpers existentes (`parseBooleanFlag`, `parseIntegerFlag`).
- **VALIDATE**: `pnpm --dir lab/agent run typecheck`

### CREATE `lab/agent/tests/json-contract.test.ts`
- **IMPLEMENT**: casos de sucesso/falha por estágio; rejeição de payload com campos ausentes/tipo inválido; aceitação de payload válido com `code fence` removido.
- **PATTERN**: `node:test` + `assert/strict` como suite atual.
- **VALIDATE**: `node ../../node_modules/tsx/dist/cli.mjs --test tests/json-contract.test.ts`

### UPDATE `lab/agent/tests/create-lead.test.ts` e `lab/agent/tests/inquiry.test.ts`
- **IMPLEMENT**: ajustar expectativas para contrato estrito, guardrails de evidência e caminho de autocorreção.
- **PATTERN**: preservar cenários de fallback apenas quando realmente previstos pelo novo contrato.
- **VALIDATE**: `node ../../node_modules/tsx/dist/cli.mjs --test tests/create-lead.test.ts tests/inquiry.test.ts`

---

## TESTING STRATEGY

### Unit Tests
- Validação estrita de JSON por estágio com payloads válidos/inválidos.
- Teste de política de idioma por contexto (`response` vs `artifact`, com e sem override).
- Teste de função de “critique and repair” simulando resposta inicialmente inválida.

### Integration Tests
- `dig` com previews reais: verificar JSON intermediário válido e relatório final coerente.
- `create-lead` com e sem `--idea`: confirmar persistência só ocorre após payload válido.
- `inquiry --pev`: verificar bloqueio de finding sem evidência e persistência após reparo.

### Edge Cases
- Modelo retorna markdown + texto fora do JSON.
- `responseLanguage=auto` com texto ambíguo (fallback para `en`).
- `artifactLanguage=source` quando origem não é detectável.
- Self-repair falha na rodada única (sistema deve abortar com erro rastreável).

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
- `pnpm --dir lab/agent run typecheck`

### Level 2: Unit Tests
- `pnpm --dir lab/agent run test`

### Level 3: Integration Tests
- `pnpm --dir lab/agent run dig -- --feedback compact`
- `pnpm --dir lab/agent run create-lead -- --idea "procurement anomaly" --feedback compact`
- `pnpm --dir lab/agent run inquiry -- --lead <slug> --pev --feedback compact`

### Level 4: Manual Validation
- Inspecionar artifacts em `lab/agent/filesystem/investigation/` e confirmar:
  - ausência de finding sem evidência,
  - consistência de idioma por contexto,
  - estrutura persistida conforme contrato.

### Level 5: Additional (Observability)
- Revisar logs de eventos de sessão e confirmar quando houve `self-repair` e motivo de parada.

---

## ACCEPTANCE CRITERIA

- [ ] Cada estágio relevante (`dig`, `create-lead`, `inquiry`, planning de inquiry) usa contrato JSON estrito e validação explícita.
- [ ] `responseLanguage` segue idioma do prompt do usuário (fallback `en`) com override por env/CLI.
- [ ] `artifactLanguage` segue idioma da fonte (fallback `source`) com override por env/CLI.
- [ ] `dig` retorna hipóteses e lacunas no contrato de saída, sem depender de texto livre.
- [ ] `inquiry` não persiste finding/conclusão sem evidência rastreável.
- [ ] Existe rodada de `critique and repair` curta antes da persistência final.
- [ ] Testes unitários e de integração cobrem contratos, idioma e reparo.

---

## VISUAL / E2E CHECKS (opcional — preencher quando a feature tiver UI ou Electron)

Não aplicável (feature de orquestração/prompt no Agent Lab CLI).

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

- Priorizar rollout seguro com flag de self-repair para evitar regressão brusca.
- Para reduzir custo/latência, limitar repair para 1 rodada por estágio e só quando validação falhar.
- Se necessário, fasear migração do `dig` em duas etapas: primeiro contrato JSON interno, depois refinamento do markdown final ao usuário.
