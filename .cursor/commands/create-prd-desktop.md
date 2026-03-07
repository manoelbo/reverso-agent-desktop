---
description: Criar Documento de Requisitos de Produto (PRD) para aplicativo desktop
argument-hint: [nome-do-arquivo-saida]
---

# Criar PRD: Gerar Documento de Requisitos de Produto para App Desktop

## Visão geral

Gerar um Documento de Requisitos de Produto (PRD) completo com base no contexto da conversa e nos requisitos discutidos. Use a estrutura e as seções abaixo para um PRD profissional, adaptado a **aplicativos desktop** (valor entregue no dispositivo do usuário, ciclo de vida de janelas, integração com SO, uso offline, etc.).

## Arquivo de saída

Escrever o PRD em: `$ARGUMENTS` (padrão: `PRD.md`)

## Estrutura do PRD

Criar um PRD bem estruturado com as seções abaixo. Ajuste profundidade e detalhe conforme as informações disponíveis.

### Seções obrigatórias

**1. Resumo executivo**
- Visão concisa do produto (2–3 parágrafos)
- Proposta de valor central
- Objetivo do MVP (ex.: "primeira versão instalável e utilizável no desktop")

**2. Missão**
- Declaração de missão do produto
- Princípios centrais (3–5)

**3. Usuários-alvo**
- Personas principais
- Nível de conforto técnico
- Necessidades e dores principais

**4. Escopo do MVP**
- **No escopo:** Funcionalidade central do MVP (use ✅)
- **Fora do escopo:** Itens para fases futuras (use ❌)
- Agrupar por: Funcionalidade principal, Técnico, Integração com SO/ecossistema, Distribuição/instalação

**5. User stories**
- 5–8 user stories no formato: "Como [usuário], quero [ação], para [benefício]"
- Exemplos concretos por história
- Incluir user stories técnicas quando fizer sentido (ex.: atualização automática, permissões de sistema)

**6. Arquitetura e padrões**
- Abordagem de arquitetura de alto nível (ex.: processo principal vs renderer, IPC, estado local)
- Estrutura de diretórios (se aplicável)
- Padrões de design e princípios
- Padrões específicos para app desktop (janelas, menus, atalhos, persistência local)

**7. Ferramentas / Funcionalidades**
- Especificação detalhada das funcionalidades
- Para agente interno: desenho de "ferramentas" com propósito, operações e características
- Para app: quebra das funcionalidades principais (UI, fluxos, integrações)

**8. Stack tecnológica**
- Tecnologias de backend/frontend com versões
- Dependências e bibliotecas
- Dependências opcionais
- Integrações de terceiros (APIs, serviços)

**9. Segurança e configuração**
- Autenticação/autorização (se houver)
- Gestão de configuração (variáveis de ambiente, arquivos de configuração, preferências do usuário)
- Escopo de segurança (no escopo e fora do escopo)
- Considerações de distribuição e atualização

**10. Especificação de API** (se aplicável)
- Definição de endpoints (serviços externos ou APIs locais)
- Formato de requisição/resposta
- Requisitos de autenticação
- Exemplos de payload

**11. Critérios de sucesso**
- Definição de sucesso do MVP
- Requisitos funcionais (✅)
- Indicadores de qualidade
- Objetivos de experiência do usuário (performance, responsividade, uso de recursos)

**12. Fases de implementação**
- 3–4 fases
- Cada fase: Objetivo, Entregas (✅), Critérios de validação
- Estimativas de prazo realistas

**13. Considerações futuras**
- Melhorias pós-MVP
- Oportunidades de integração (outros apps, ecossistema)
- Funcionalidades avançadas para fases posteriores

**14. Riscos e mitigações**
- 3–5 riscos principais com estratégias de mitigação

**15. Anexos** (se aplicável)
- Documentos relacionados
- Dependências importantes com links
- Estrutura do repositório/projeto

## Instruções

### 1. Extrair requisitos
- Revisar todo o histórico da conversa
- Identificar requisitos explícitos e necessidades implícitas
- Anotar restrições e preferências técnicas
- Capturar metas do usuário e critérios de sucesso

### 2. Sintetizar informações
- Organizar requisitos nas seções apropriadas
- Preencher suposições razoáveis onde faltar detalhe
- Manter consistência entre seções
- Garantir viabilidade técnica para app desktop

### 3. Escrever o PRD
- Linguagem clara e profissional
- Incluir exemplos e especificidades
- Usar formatação markdown (títulos, listas, blocos de código, checkboxes)
- Incluir trechos de código nas seções técnicas quando ajudar
- Manter o resumo executivo conciso e completo

### 4. Verificações de qualidade
- ✅ Todas as seções obrigatórias presentes
- ✅ User stories com benefício claro
- ✅ Escopo do MVP realista e bem definido
- ✅ Escolhas tecnológicas justificadas
- ✅ Fases de implementação acionáveis
- ✅ Critérios de sucesso mensuráveis
- ✅ Terminologia consistente

## Diretrizes de estilo

- **Tom:** Profissional, claro, orientado à ação
- **Formato:** Usar markdown (títulos, listas, blocos de código, tabelas)
- **Checkboxes:** ✅ no escopo, ❌ fora do escopo
- **Especificidade:** Preferir exemplos concretos a descrições abstratas
- **Extensão:** Completo mas escaneável (em geral 30–60 "blocos" de conteúdo)

## Confirmação da saída

Após criar o PRD:
1. Confirmar o caminho do arquivo gerado
2. Resumir brevemente o conteúdo
3. Destacar suposições feitas por falta de informação
4. Sugerir próximos passos (revisão, refinamento, planejamento)

## Notas

- Se faltar informação crítica, fazer perguntas de esclarecimento antes de gerar
- Ajustar a profundidade das seções conforme o nível de detalhe disponível
- Para produtos muito técnicos, enfatizar arquitetura e stack
- Para produtos orientados ao usuário, enfatizar user stories e experiência
- Este comando contém a estrutura completa do template de PRD; não é necessário referência externa.
- Contexto desktop: considerar sempre janelas, menus, atalhos, armazenamento local, atualizações, permissões e distribuição (instalador/empacotamento).
