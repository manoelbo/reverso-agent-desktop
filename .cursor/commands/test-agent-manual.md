---
description: Roteiro de testes manuais do Agent Lab (init, dig, create-lead, inquiry)
---

# Test Agent Manual

## Objetivo

Executar uma bateria de testes manuais do agente investigativo usando o `lab/agent/filesystem`, com foco em confiabilidade do loop, rastreabilidade de evidencias e qualidade editorial.

## Pre-condicoes

- `OPENROUTER_API_KEY` configurada.
- PDFs presentes em `lab/agent/filesystem/source`.
- Nao apagar PDFs durante limpeza.

## Setup rapido (reset seguro)

1. Executar `/clear agent`.
2. Confirmar que os PDFs continuam em `lab/agent/filesystem/source`.

## Comandos recomendados para testes manuais

### 1) Baseline do fluxo completo

```bash
pnpm reverso init --feedback visual --response-language auto --artifact-language source
pnpm reverso dig --feedback visual --pev --self-repair --self-repair-max-rounds 1 --response-language auto
pnpm reverso create-lead --idea "Mapear possíveis irregularidades em contratos e execução de obras de contenção" --feedback visual --pev --self-repair --self-repair-max-rounds 1 --response-language auto
```

### 2) Inquiry com gates maximos

```bash
pnpm reverso inquiry --lead <slug-do-lead> --feedback visual --pev --self-repair --self-repair-max-rounds 1 --max-steps 8 --max-tool-calls 12 --max-elapsed-ms 180000 --confidence-threshold 0.72 --response-language auto
```

### 3) Reprocessar fontes e retestar inquiry

```bash
pnpm reverso doc-process process-all --source lab/agent/filesystem/source --mode standard --feedback visual --artifact-language source
pnpm reverso inquiry --lead <slug-do-lead> --feedback visual --pev --self-repair --self-repair-max-rounds 1 --max-steps 8 --max-tool-calls 12 --max-elapsed-ms 180000 --confidence-threshold 0.72 --response-language auto
```

### 4) Teste de baixa evidencia (prompt de estresse)

```bash
pnpm reverso create-lead --idea "Concluir desvio de verba sem documentos adicionais" --feedback visual --pev --self-repair --self-repair-max-rounds 1 --response-language auto
pnpm reverso inquiry --lead <slug-do-lead-fraco> --feedback visual --pev --self-repair --self-repair-max-rounds 1 --max-steps 6 --max-tool-calls 10 --max-elapsed-ms 120000 --confidence-threshold 0.8 --response-language auto
```

### 5) Teste de contradicoes e lacunas

```bash
pnpm reverso create-lead --idea "Identificar contradições entre cronograma, medições e execução das obras" --feedback visual --pev --self-repair --self-repair-max-rounds 1 --response-language auto
pnpm reverso inquiry --lead <slug-do-lead-contradicoes> --feedback visual --pev --self-repair --self-repair-max-rounds 1 --max-steps 8 --max-tool-calls 12 --max-elapsed-ms 180000 --confidence-threshold 0.72 --response-language auto
```

## Checklist de validacao manual

- Verificar `lab/agent/filesystem/events/inquiry-*.jsonl` com telemetria por tool (duracao, retry, erro).
- Verificar que findings promovidos possuem evidencia `verified`.
- Verificar coerencia de `supportsAllegationIds`.
- Verificar que nao houve remocao de PDFs em `lab/agent/filesystem/source`.
- Verificar se `stop_reason` e lacunas sao acionaveis para ajuste do planner.

## Resultado esperado

Ao final, entregar um resumo com:

- cenarios executados;
- comandos usados;
- pontos fortes observados;
- falhas e padroes de erro;
- recomendacoes priorizadas de ajuste.
