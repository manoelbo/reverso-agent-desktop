# PRD-02: Sources & Document Processing

> **Domínio:** Sources & Document Processing
> **PRD Master:** `PRD-00-master.md`
> **Depende de:** Workspace, Infra & AI Engine
> **Consumido por:** Dossier & Investigations, Chat & Agent

---

## 1. Visão do Domínio

Este domínio cobre a **ingestão, transformação e enriquecimento de documentos**. O Capybara Agent recebe documentos brutos (PDFs, e-mails, imagens, textos) e os transforma em artefatos Markdown estruturados e rastreáveis que alimentam o Dossier e o Graph View.

---

## 2. User Stories

1. **Como** jornalista, **quero** arrastar documentos para o app **para** importá-los sem processo complexo.
2. **Como** jornalista, **quero** que PDFs sejam convertidos página a página em Markdown fiel **para** poder ler e buscar o conteúdo sem abrir o PDF.
3. **Como** jornalista, **quero** ver um resumo (preview) e metadata enriquecida automaticamente **para** decidir rapidamente se um documento é relevante.
4. **Como** jornalista, **quero** processar vários documentos de uma vez **para** trabalhar com datasets grandes.
5. **Como** jornalista, **quero** saber o custo estimado antes de processar **para** controlar gastos com API.
6. **Como** jornalista, **quero** ver o status de processamento em tempo real **para** saber o que já está pronto.
7. **Como** agente AI, **quero** acessar preview.md e metadata.md para decidir se preciso ler o documento completo **para** economizar tokens de contexto.

---

## 3. Arquitetura de Fontes

### 3.1 Estrutura por Source

Cada documento importado gera uma pasta com artefatos:

```
sources/
└── contrato-emergencial-042/
    ├── contrato-emergencial-042.pdf    # Original (IMUTÁVEL)
    ├── preview.md                       # Resumo AI-generated
    ├── metadata.md                      # Metadata enriquecida
    └── replica.md                       # (somente PDFs) Reprodução page-by-page
```

### 3.2 Formato dos Artefatos

**preview.md:**

```markdown
---
type: source_preview
original_file: contrato-emergencial-042.pdf
format: pdf
pages: 147
processed_at: 2026-03-15T14:30:00Z
tags: [contrato, emergencial, obras, prefeitura]
summary: >
  Contrato emergencial #042 entre a Prefeitura de São Paulo e
  Construtora XYZ para reparos em ponte na zona leste.
  Valor total: R$ 47 milhões. Vigência: 12 meses.
---

## Visão Geral

Este documento é um contrato emergencial firmado entre a Prefeitura
de São Paulo e a Construtora XYZ para execução de obras de reparo...

## Pontos-Chave

- Valor: R$ 47.000.000,00
- Modalidade: Dispensa de licitação por emergência
- Representante legal: [[João Silva]]
- Empresa: [[Construtora XYZ]]
```

**metadata.md:**

```markdown
---
type: source_metadata
original_file: contrato-emergencial-042.pdf
entities_mentioned:
  - name: João Silva
    type: person
    role: legal_representative
  - name: Construtora XYZ
    type: group
    category: company
    registration_id: "12.345.678/0001-99"
  - name: Prefeitura de São Paulo
    type: group
    category: government
dates_found:
  - "2024-03-15"
  - "2024-03-22"
locations:
  - name: São Paulo
    type: city
  - name: Zona Leste
    type: region
tags: [contrato, emergencial, dispensa-licitacao, obras-publicas]
monetary_values:
  - amount: 47000000
    currency: BRL
    context: "Valor total do contrato"
---

## Entidades Identificadas

### Pessoas
- **[[João Silva]]** — Representante legal da Construtora XYZ (p. 2)

### Organizações
- **[[Construtora XYZ]]** — Contratada (CNPJ: 12.345.678/0001-99)
- **[[Prefeitura de São Paulo]]** — Contratante

### Locais
- São Paulo, Zona Leste — Local das obras

## Datas Relevantes
- 2024-03-15 — Abertura da licitação emergencial
- 2024-03-22 — Resultado e assinatura do contrato

## Valores Monetários
- R$ 47.000.000,00 — Valor total do contrato
- R$ 4.200,00/m² — Preço unitário (lot 22)
```

**replica.md (somente PDFs):**

```markdown
---
type: source_replica
original_file: contrato-emergencial-042.pdf
pages: 147
generated_at: 2026-03-15T14:32:00Z
model: google/gemini-2.5-flash-lite
---

<!-- Page 1 -->
# CONTRATO EMERGENCIAL Nº 042/2024

**CONTRATANTE:** Prefeitura do Município de São Paulo...

---
<!-- Page 2 -->

## CLÁUSULA PRIMEIRA — DO OBJETO

O presente contrato tem por objeto a execução de obras de reparo...
João Silva, representante legal da Construtora XYZ, doravante...

---
<!-- Page 3 -->
...
```

### 3.3 Processamento por Tipo de Arquivo

| Tipo | Processamento | Artefatos gerados |
|------|---------------|-------------------|
| **PDF** | Chunk page-by-page → LLM transcreve cada página → monta replica.md | preview.md, metadata.md, replica.md |
| **Imagem** (jpg, png) | Envia para LLM com vision → gera descrição e metadata | preview.md, metadata.md |
| **E-mail** (.eml) | Parseia headers + body → gera preview com contexto | preview.md, metadata.md |
| **HTML** | Extrai texto limpo → gera preview e metadata | preview.md, metadata.md |
| **Texto** (.txt, .md, .doc) | Leitura direta → gera preview e metadata | preview.md, metadata.md |

---

## 4. Pipeline de Processamento

### 4.1 Fluxo para PDFs

```
                          ┌─────────────────┐
   Drag & drop ──────►   │  Copiar para     │
                          │  sources/[name]/ │
                          └────────┬─────────┘
                                   │
                          ┌────────▼─────────┐
                          │  Extrair páginas  │
                          │  (pdf.js ou       │
                          │   pdf-parse)      │
                          └────────┬─────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │  Para cada página (chunk):   │
                    │  → Enviar texto/imagem ao    │
                    │    modelo de PROCESSING      │
                    │  → Receber markdown fiel     │
                    │  → Concatenar em replica.md  │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │  Enviar replica completa ao  │
                    │  modelo de WRITING:          │
                    │  → Gerar preview.md (resumo) │
                    │  → Gerar metadata.md         │
                    │    (entidades, datas, etc.)   │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │  Atualizar status no SQLite  │
                    │  status: 'processed'         │
                    │  Notificar renderer           │
                    └──────────────────────────────┘
```

### 4.2 Ferramentas Técnicas

| Etapa | Ferramenta | Por quê |
|-------|-----------|---------|
| Extrair texto bruto de PDF | `pdf-parse` (baseado em pdf.js) | Leve, Node.js nativo, extrai texto e metadata básica |
| Transcrição page-by-page | Vercel AI SDK → modelo de processing | LLM preserva formatação, tabelas, layout |
| Imagens dentro de PDFs | Vercel AI SDK com vision | Modelo multimodal analisa imagens embutidas |
| Geração de metadata | Vercel AI SDK → modelo de writing | Structured output (JSON mode) para entities_mentioned |
| Status tracking | SQLite (tabela `sources`) | Query rápida de status de batch |

### 4.3 Estimativa de Custo

Antes de processar, calcular custo estimado:

```typescript
function estimateProcessingCost(source: Source): CostEstimate {
  const tokensPerPage = 800 // média estimada
  const totalInputTokens = source.pages * tokensPerPage
  const totalOutputTokens = totalInputTokens * 1.2 // replica é ~20% maior

  const processingCost = calculateModelCost(
    modelRouting.processing,
    totalInputTokens,
    totalOutputTokens
  )

  const writingCost = calculateModelCost(
    modelRouting.writing,
    totalOutputTokens * 0.3, // preview+metadata usa ~30% da replica
    totalOutputTokens * 0.15
  )

  return {
    totalTokens: totalInputTokens + totalOutputTokens,
    estimatedCostUSD: processingCost + writingCost,
    estimatedTimeMinutes: Math.ceil(source.pages / 10),
  }
}
```

---

## 5. UI — Sources Panel

### 5.1 Drag & Drop

- Drop zone sempre visível na parte inferior da sidebar
- Aceita múltiplos arquivos simultaneamente
- Arquivos são copiados (não movidos) para `sources/[nome-sanitizado]/`
- Feedback visual imediato: arquivo aparece na lista com status `○ Not processed`

### 5.2 Lista de Sources

Cada entrada mostra:
- Checkbox para seleção em batch
- Nome do arquivo
- Badge de status: `○` (gray) | `⟳` (yellow, animated) | `✓` (green)
- Ao clicar: abre preview.md + metadata.md no Viewer

### 5.3 Ações (Chat-First)

| Botão | Comando injetado no chat |
|-------|--------------------------|
| Process Selected (N) | `/process @file1 @file2 ...` |
| Process All Unprocessed | `/process_all unprocessed` com estimativa |
| Reprocess | `/reprocess @filename` |

### 5.4 Source Detail View (Viewer)

```
contrato-emergencial-042.pdf
Status: ✓ Processed  |  Type: PDF  |  Pages: 147
🔗 Open original file
─────────────────────────────────────
[preview.md rendered]
[metadata.md rendered]

── Dossier Connections ──────────────
👤 João Silva (People)
🏛️ Construtora XYZ (Groups)
🏛️ Prefeitura de São Paulo (Groups)
```

---

## 6. Processamento de Imagens (OCR/Vision)

Para imagens (fotos, scans), o pipeline é diferente:

1. Enviar imagem diretamente ao modelo de processing (multimodal/vision)
2. Modelo retorna: descrição textual + entidades identificadas + contexto visual
3. Gerar preview.md com descrição
4. Gerar metadata.md com entidades encontradas na imagem

Modelos recomendados para vision via OpenRouter:
- `google/gemini-2.5-flash-lite` (econômico, bom para scans)
- `anthropic/claude-sonnet-4` (melhor qualidade para fotos complexas)

---

## 7. Contratos com Outros Domínios

### → Produz para Dossier & Investigations
- `metadata.md` → campo `entities_mentioned` alimenta criação de entidades no Dossiê
- `metadata.md` → campo `dates_found` alimenta Timeline
- `metadata.md` → campo `locations` alimenta Places
- Toda `:::annotation` e `:::clue` referencia sources via `→[source]`

### → Produz para Chat & Agent
- `preview.md` → contexto leve para o agente decidir se precisa ler mais
- `metadata.md` → contexto estruturado para o agente
- `replica.md` → texto completo quando o agente precisa de detalhe
- Menção `@source/contrato-01` no chat carrega preview.md + metadata.md

### → Produz para UI & Interaction (PRD-05)
- Status badges (○ ⟳ ✓) para sidebar e source list — ver PRD-05 §4.1
- Drop zone behavior — ver PRD-05 §4.1 e §8
- Source Detail View template — ver PRD-05 §6.3
- Chat-First processing buttons — ver PRD-05 §5.2

### ← Consome de Workspace & Infra
- `trpc.files.*` para ler/escrever artefatos
- `trpc.ai.streamText()` para chamar LLMs
- `trpc.db.sources.*` para tracking de status
- File watcher para detectar novos arquivos

---

## 8. Dependências Específicas

```json
{
  "dependencies": {
    "pdf-parse": "^1.1",
    "gpt-tokenizer": "^3.4"
  }
}
```

`pdf-parse` é a única dependência específica deste domínio. O resto (AI SDK, SQLite, file system) vem do domínio de Infra.
