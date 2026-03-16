export const peopleMarkdownExample = `---
type: person
name: "Alessandra Araújo do Vale"
category: public_servant
---

# Alessandra Araújo do Vale

## Resumo

Fiscal do contrato, responsável por acompanhar a execução da obra.

## Papel nos documentos

| Documento | Papel | Páginas |
| --- | --- | --- |
| REL-008 ANÁLISE TÉCNICA | Fiscal do contrato | 2 |

## Connections

- [[Secretaria Municipal de Saude]]
- [[Pedro Martin Fernandes]]
`

export const groupsMarkdownExample = `---
type: group
name: "Secretaria Municipal de Saude"
category: government
---

# Secretaria Municipal de Saude

## Resumo

Órgão público citado em contratos e decisões administrativas.

## Relações

- Atua com [[Alessandra Araújo do Vale]]
- Relacionada ao local [[Alameda Madeira, 162]]
`

export const placesMarkdownExample = `---
type: place
name: "Alameda Madeira, 162"
city: Barueri
country: Brasil
---

# Alameda Madeira, 162

## Contexto

Endereço citado em documentos de contratação e medição.

## Links

- [[ABCON CONSULTORIA E ENGENHARIA EIRELI]]
- [[Secretaria Municipal de Saude]]
`

export const timelineMarkdownExample = `---
type: timeline
year: 2021
month: 5
---

# 2021-05

:::event
date: 2021-05-10
actors: [[Pedro Martin Fernandes]]
type: other
source: documento_anexado.pdf
page: 3
---
Pedro Martin Fernandes, Diretor de Obras de Drenagem Urbana, assina eletronicamente o documento.
:::

:::event
date: 2021-05-26
actors: [[ABCON CONSULTORIA E ENGENHARIA EIRELI]]
type: other
source: documento_anexado.pdf
page: 18
---
Certidão de inexistência de registros no CADIN para a empresa.
:::
`

export const investigationMarkdownExample = `---
type: lead
slug: lead-consistency-and-justification-of-direct-emergency-contracting
title: "Consistency and Justification of Direct Emergency Contracting"
---

# Context

Investigate recurring direct emergency contracting for civil works.

## Allegations Index

- [[allegation-1]]
- [[allegation-2]]

## Findings Index

- [[finding-1]]
- [[finding-2]]
`

export const sourceArtifactMarkdownExample = `## Page 1

**Content type:** image
**Summary:** Primeira página do edital com objeto e critérios.

**Structured data:**

- **Pregão Eletrônico Nº:** 09/2021-COBES
- **PROCESSO:** 6013.2021/0002896-5
- **OBJETO:** Fornecimento de café torrado e moído

**Investigative relevance:** high
`
