# Reverso Agent — PRD Master

> **Versão:** 0.2 (estado real + alvo)
> **Autor:** Manoel Brasil Orlandi
> **Data:** Março 2026
> **Deadline MVP:** ~13 de Março de 2026 (1 semana, agentic coding)
> **Desenvolvedor:** Solo (com agentic coding — Cursor/Claude)
> **Plataforma MVP:** macOS first (DMG)
> **Idioma UI:** Inglês
> **Documento de referência:** `.agents/refs/Reverso_agent_project.md`

---

## 1. Resumo Executivo

O **Reverso Agent** é um aplicativo desktop open source que utiliza LLMs de forma agêntica para apoiar e desenvolver investigações jornalísticas. O app ingere documentos brutos (PDFs, e-mails, imagens, textos), transforma-os em formatos estruturados e rastreáveis, e organiza tudo em dossiês Markdown interconectados com graph view — enquanto o jornalista mantém controle total sobre verificação de fatos e publicação.

O produto é construído com Electron.js para rodar localmente, garantindo que dados sensíveis permaneçam na máquina do usuário. A integração inicial com LLMs é feita via OpenRouter, permitindo acesso a centenas de modelos com uma única API key.

**Objetivo do MVP (v0.1):** Uma primeira versão instalável onde o jornalista consegue (1) importar documentos, (2) processá-los via LLM em Markdown estruturado, (3) ter dossiês organizados automaticamente pelo agente, (4) visualizar conexões num graph interativo, e (5) interagir com o agente via chat para conduzir linhas investigativas — tudo com rastreabilidade completa de volta às fontes originais.

---

## 2. Missão

**Declaração:** Democratizar o acesso a ferramentas de investigação jornalística avançadas, tornando a análise de documentos complexos rápida, transparente e acessível a qualquer jornalista, independente de conhecimento técnico.

**Princípios centrais:**

1. **Transparência total** — O jornalista vê tudo que o agente faz; nenhuma conclusão sem fonte rastreável
2. **Controle humano** — A IA faz o trabalho pesado, mas o jornalista decide o que é válido
3. **Acessibilidade** — Interface simples o suficiente para quem não sabe programar
4. **Privacidade por design** — Dados ficam locais; nenhum servidor intermediário
5. **Open source e auditável** — Ferramentas de jornalismo devem ser tão accountable quanto o jornalismo que apoiam

---

## 3. Usuários-Alvo

### Persona 1: Thiago — O Watchdog orientado a dados
- **Perfil:** Jornalista investigativo, São Paulo
- **Tech:** Alta (confortável com bancos de dados, APIs)
- **Dor:** Milhares de páginas de contratos públicos; meses de leitura manual; risco de processo por erro
- **Necessidade:** Processamento massivo de PDFs, extração de tabelas, cross-referência, rastreabilidade para prova judicial

### Persona 2: Linn — A Rastreadora financeira
- **Perfil:** Jornalista financeira, Estocolmo
- **Tech:** Baixa (não programa, não usa terminal)
- **Dor:** Dump massivo de e-mails, precisa filtrar conexões específicas (Suécia) num oceano de dados
- **Necessidade:** Busca inteligente por linguagem natural, organização automática, interface amigável

---

## 4. Mapa do Produto — Domínios

O Reverso Agent é dividido em **5 domínios** que se interconectam:

```
┌─────────────────────────────────────────────────────────────────┐
│                     WORKSPACE, INFRA & AI ENGINE                │
│         (Electron, IPC, Storage, OpenRouter, Model Routing)     │
├──────────────┬──────────────────────────┬───────────────────────┤
│   SOURCES &  │  DOSSIER, INVESTIGAÇÕES  │   CHAT, AGENT &       │
│   DOCUMENT   │       & GRAPH VIEW       │   CAPYBARA MARKDOWN   │
│  PROCESSING  │                          │                       │
│              │  ◄── consome ────────►   │  ◄── orquestra ──►    │
│  produz ──►  │  entidades, annotations  │  agent loop, tools    │
│  metadata,   │  clues, [[links]],       │  streaming, menções   │
│  preview,    │  graph view              │  dialeto markdown,    │
│  replica     │                          │  renderer             │
├──────────────┴──────────────────────────┴───────────────────────┤
│                    UI, INTERAÇÃO & SCREENS                       │
│   Layout master, sidebar, viewer templates, Chat-First Principle │
│   Contextual Action Bar, screen map, keyboard shortcuts          │
└─────────────────────────────────────────────────────────────────┘
```

### Fluxo de dados entre domínios

1. **Sources** produz `preview.md`, `metadata.md`, `replica.md` → alimenta **Dossier**
2. **Dossier** consome metadata, organiza entidades, cria `[[links]]` → alimenta **Graph View**
3. **Chat & Agent** orquestra tudo: processa Sources, popula Dossier, cria Clues, faz web search
4. **Reverso Markdown** é o formato unificado: todos os domínios leem e escrevem nele
5. **Workspace & Infra** fornece IPC, storage, AI SDK e file watching para todos os domínios

### PRDs de Domínio

| # | Domínio | Arquivo | Resumo |
|---|---------|---------|--------|
| 1 | Workspace, Infra & AI Engine | `PRD-01-workspace-infra-ai.md` | Electron, IPC, storage, OpenRouter, model routing, temas, distribuição |
| 2 | Sources & Document Processing | `PRD-02-sources-processing.md` | Ingestão de arquivos, PDF→MD, OCR, metadata, preview, replica, batch |
| 3 | Dossier, Investigações & Graph View | `PRD-03-dossier-investigations-graph.md` | Entidades, annotations, clues, linhas investigativas, graph, traceability |
| 4 | Chat, Agent & Reverso Markdown | `PRD-04-chat-agent-markdown.md` | Chat UI, agent loop, tools, modos, dialeto markdown, renderer |
| 5 | UI, Interação & Screens | `PRD-05-ui-interaction-screens.md` | Layout master, sidebar, viewer templates, Chat-First Principle, action bar, screen map, CAN/CANNOT, keyboard shortcuts |

---

## 5. Escopo Atual (Mar/2026) — Implementado vs Pendente

### Implementado (estado real)

**Agent Lab (CLI, `lab/agent`)**
- Entrada conversacional unificada: `pnpm reverso agent --text/--prompt` e fallback raiz `pnpm reverso --text/--prompt`.
- Fluxo stateful por sessão e intenção: `init -> deep-dive (alias legado: dig) -> deep-dive-next -> create-lead -> inquiry`.
- Deep-dive com geração de leads draft, deduplicação (exata + semântica básica), seleção por índice/slug/título.
- Roteamento híbrido (heurística + fallback LLM com JSON estrito) para continuidade em linguagem natural.
- Inquiry com `plan -> execute -> verify` (PEV), orçamento/stop_reason, evidence gate e pre-write validation.
- Persistência editorial local em Markdown/JSON dentro de `lab/agent/filesystem`.

**App Electron (`src/`)**
- Shell visual base (Application Shell 9), sidebar/viewer/activity bar e painéis iniciais.
- Estrutura de preload e schema compartilhado.
- Componentização progressiva da UI (ex.: `AppSidebar` quebrado em subcomponentes).

### Pendente (funcionalidades principais)

- Chat operacional completo no renderer (streaming real, action pills funcionais, contexto vivo com tools).
- Integração plena app <-> engine do agente (IPC/serviços/main) além do laboratório CLI.
- Graph View completo (fullscreen com filtros e interações avançadas) e integração real com dados.
- Alinhamento final de iconografia e idioma da UI em todas as telas.
- E2E conversacional ponta-a-ponta com validação de artefatos no app.

### Legado / Transição

- `dig` permanece apenas como alias de compatibilidade para `deep-dive`.
- Descrições antigas de “chat-first pleno no app” e “graph completo” passam a ser **alvo**, não status concluído.
- Referências a caminhos de saída em `lab/agent/output/...` foram descontinuadas; usar `lab/agent/filesystem/...`.

---

## 6. Stack Tecnológica — Decisões e Recomendações

### Decisões já tomadas

| Camada | Tecnologia | Status |
|--------|-----------|--------|
| Framework desktop | Electron.js | ✅ Decidido |
| UI framework | React | ✅ Decidido (via shadcn/ui) |
| CSS | Tailwind CSS | ✅ Decidido (via shadcn/ui) |
| Componentes | shadcn/ui + shadcnblocks (Pro) | ✅ Decidido |
| Blocos estendidos | shadcnblocks.com (assinatura Pro) | ✅ Decidido |
| Application Shell | Application Shell 9 (IDE-Style File Explorer) | ✅ Decidido |
| Tema | Reverso 0 (tweakcn) | ✅ Decidido |
| Fontes | IBM Plex Sans Thai, Mono, Sans JP | ✅ Decidido |
| Ícones | Phosphor Icons (`@phosphor-icons/react`) | ✅ Decidido |
| AI gateway | OpenRouter (v0.1) | ✅ Decidido |
| Cores | OKLCH-based tokens | ✅ Decidido |

### Decisões pendentes — Recomendações

As decisões abaixo foram pesquisadas e avaliadas. Para cada uma, apresento a **recomendação** com justificativa.

#### 6.1 Build Tool / Boilerplate Electron

| Opção | Prós | Contras |
|-------|------|---------|
| **electron-vite** | Vite (build rápido, HMR), template React pronto, popular (4.8k stars) | Usa electron-builder (não oficial), mais decisões manuais |
| electron-forge | Oficial do Electron, all-in-one CLI, plugin Vite disponível | Plugin Vite experimental, mais opinativo |

**→ Recomendação: `electron-vite`**
Motivo: DX superior com Vite (HMR instantâneo, builds rápidos), template React pronto, comunidade ativa. O electron-builder integrado resolve packaging e distribuição.

#### 6.2 Gerenciamento de Estado

| Opção | Prós | Contras |
|-------|------|---------|
| **Zustand** | 3KB, sem Provider, API simples, 18M downloads/semana | Menos opinionado para times grandes |
| Jotai | Atômico, derivações reativas | Mais complexo para estado global |
| Redux Toolkit | DevTools excelentes, padrão para enterprise | 15KB, boilerplate, over-engineering para projeto solo |

**→ Recomendação: `Zustand`**
Motivo: Minimalista, sem boilerplate, perfeito para Electron (sem SSR). Stores separados por domínio (workspace store, chat store, viewer store, etc.).

#### 6.3 AI SDK / Integração com LLMs

| Opção | Prós | Contras |
|-------|------|---------|
| **OpenAI SDK apontando para OpenRouter** | API OpenAI-compatible madura, tool calling confiável, streaming via SSE padrão, controle total do agent loop | Agent loop manual (~150-200 linhas) |
| Vercel AI SDK + @openrouter/ai-sdk-provider | API unificada, streaming nativo | Bugs críticos em tool calling no provider OpenRouter (v2.2.3), otimizado para Next.js/não para agent loops em Node.js puro |
| Mastra | Suporte explícito a Electron, multi-model, MCP built-in | Dependência grande, menos controle |
| LangChain.js | 1000+ integrações, agent patterns maduros | Pesado, Python-first, overengineered |

**→ Recomendação: `OpenAI SDK` apontando para OpenRouter**
Motivo: O OpenRouter expõe uma API OpenAI-compatible madura. Usar o `openai` SDK diretamente (com `baseURL` apontando para OpenRouter) garante tool calling confiável, streaming via SSE padrão, e controle total do agent loop (~150-200 linhas de código). O Vercel AI SDK + provider OpenRouter tem bugs ativos em tool calling (lifecycle events de tools silenciosamente dropados durante streaming) que são deal-breakers para agent loops robustos.

#### 6.4 IPC Type-Safe (Main ↔ Renderer)

| Opção | Prós | Contras |
|-------|------|---------|
| **IPC tipado com Zod** | ~50 linhas de código, zero deps extras, type-safe, streaming via `ipcRenderer.on()` | Pode ficar desorganizado sem disciplina; migração para framework se o projeto crescer |
| electron-trpc (fork mat-sz/trpc-electron) | Leverages tRPC v11, queries/mutations/subscriptions | Fork com adoção modesta (42 stars); electron-trpc original NÃO suporta tRPC v11 |
| Hono RPC | Alternativa moderna para Electron | Emergente, menos documentação |

**→ Recomendação: `IPC tipado com Zod` (MVP)**
Motivo: Para um MVP de 1 semana com projeto solo, tRPC é over-engineering. IPC tipado com Zod dá type-safety com ~50 linhas de código. Para streaming, `ipcRenderer.on()` com typed events é mais direto que subscriptions do tRPC. Todos os schemas ficam centralizados em `shared/ipc-schema.ts`. Se o projeto crescer, migração para tRPC ou Hono RPC é natural.

#### 6.5 Banco de Dados Local

| Opção | Prós | Contras |
|-------|------|---------|
| **better-sqlite3 + Kysely** | Performance (11.7x mais rápido que sqlite3), sync API, Kysely dá type-safety mais forte sem overhead de ORM | Native module (rebuild para Electron) |
| better-sqlite3 + Drizzle ORM | Performance + ORM maduro com migrations | Overhead de migrations/drizzle-kit desnecessário para MVP com ~5 tabelas |
| sql.js | Pure WASM, sem native module | Mais lento, carrega DB inteiro na memória |
| Arquivos JSON/MD puros | Simples, sem dependência | Sem queries complexas, sem indexação |

**→ Recomendação: `better-sqlite3` + `Kysely`**
Motivo: Para indexar backlinks, buscar entidades, rastrear status de processamento — SQLite é ideal. Kysely oferece type-safety mais forte que Drizzle para projetos pequenos, com query builder expressivo e sem overhead de migrations/schema declarations. Para um MVP com ~5 tabelas, Kysely dá o equilíbrio ideal entre type-safety e simplicidade. Os dados editoriais (dossiê, fontes) continuam em Markdown no filesystem; o SQLite serve como índice de busca e metadata operacional.

#### 6.6 Busca Full-Text

| Opção | Prós | Contras |
|-------|------|---------|
| MiniSearch | 767K downloads, leve, fuzzy, autocomplete, zero deps | Menos rápido que FlexSearch em datasets enormes |
| **FlexSearch** | Mais rápido, phonetic matching, web workers | API mais complexa, mais pesado |

**→ Recomendação: `MiniSearch`**
Motivo: Autocomplete em tempo real para menções (@source, @dossier, !investigation), fuzzy matching, levíssimo. O volume de dados por workspace (centenas a poucos milhares de docs) está bem dentro da capacidade do MiniSearch.

#### 6.7 Markdown Rendering (Reverso Markdown)

| Componente | Lib recomendada |
|-----------|-----------------|
| Renderer base | `react-markdown` |
| Parser de directives (:::annotation, :::clue, :::event) | `remark-directive` + `remark-directive-rehype` |
| Wikilinks [[entity]] | Plugin remark custom (ou `remark-wiki-link`) |
| YAML frontmatter | `gray-matter` (3.9M downloads, battle-tested) |
| Source references →[source] | Plugin rehype custom |
| Syntax highlighting | `rehype-highlight` ou `rehype-prism-plus` |
| Math (se necessário) | `remark-math` + `rehype-katex` |

**→ Recomendação: Unified ecosystem (`react-markdown` + `remark-directive` + `remark-directive-rehype` + plugins custom)**
Motivo: O Reverso Markdown tem extensões não-triviais (:::annotation, [[links]], →[source]). O unified ecosystem (remark/rehype) é feito exatamente para isso: parse → AST → transform → render. Cada extensão é um plugin isolado e testável.

#### 6.8 Graph View

| Opção | Prós | Contras |
|-------|------|---------|
| **react-force-graph** | React-nativo, force-directed (estilo Obsidian), 2D/3D/VR | Menos algoritmos de layout |
| Cytoscape.js | Algoritmos avançados, WebGPU (3M edges), clustering | Não é React-nativo, API mais complexa |
| D3.js force | Máxima customização | Muito low-level, integração React manual |

**→ Recomendação: `react-force-graph` (2D)**
Motivo: O graph view do Reverso é inspirado no Obsidian — force-directed, interativo, nós clicáveis. react-force-graph entrega exatamente isso, é React-nativo, e suporta Canvas/WebGL para performance. Para o MVP, é a opção com menor friction.

#### 6.9 Chat Input (Menções e Autocomplete)

| Opção | Prós | Contras |
|-------|------|---------|
| **react-mentions-ts** | TypeScript-first, múltiplos triggers (@, !) nativos, ~10-20KB, zero learning curve | Menos extensível para rich text futuro |
| Tiptap | Extensão de mentions built-in, headless, ProseMirror base | 50-70KB, overkill para input de chat simples |
| Lexical | Meta-backed, imutável | Mentions requerem mais implementação custom |
| textarea simples + custom | Zero deps | Muito trabalho para @, !, / triggers |

**→ Recomendação: `react-mentions-ts` para menções + `cmdk` para slash commands**
Motivo: O chat input precisa de 3 coisas: @mentions, !mentions, e /commands. Isso é um textarea com popup de autocomplete, não um editor rich text. react-mentions-ts é TypeScript-first, suporta múltiplos triggers nativamente, e pesa ~10-20KB vs 50-70KB do Tiptap. Para `/` commands, cmdk (já no plano via shadcn) continua como solução separada. Se no futuro o input precisar de rich text (bold, links), migrar para Tiptap.

#### 6.10 Command Palette / Slash Commands

**→ Recomendação: `cmdk`**
Motivo: shadcn/ui já tem um componente Command baseado em cmdk. Zero configuração extra. Perfeito para o menu de slash commands (/) e para busca global.

#### 6.11 Token Counting

**→ Recomendação: `gpt-tokenizer`**
Motivo: Pure JS (sem WASM), síncrono, `isWithinTokenLimit` para check rápido sem encoding completo, `estimateCost` built-in, suporta todos os encodings modernos. Ideal para o token counter em tempo real no chat.

#### 6.12 File Watching

**→ Recomendação: `chokidar`**
Motivo: 113M downloads/semana, cross-platform confiável, standard para Electron. Necessário para detectar quando o agente cria/modifica arquivos no workspace e atualizar a sidebar e o viewer automaticamente.

#### 6.13 Web Research (Agente)

| Opção | Prós | Contras |
|-------|------|---------|
| **Playwright (embutido)** | Controle total, scraping de qualquer site, sem custo recorrente | Aumenta tamanho do app (~50MB+), complexo |
| SERP API (Tavily, SerpAPI) | Simples, resultados limpos, sem manutenção | Custo por request, dependência de terceiro |

**→ Recomendação: `Tavily API` para busca web no MVP + `Cheerio` para scraping de URLs específicas**
Motivo: Embutir Playwright no Electron aumenta muito o tamanho do app. Para o MVP, Tavily (ou similar) é mais prático para buscas web. Cheerio (parser HTML leve) resolve scraping de páginas específicas sem browser headless. Playwright pode entrar em versão futura.

#### 6.14 Packaging e Distribuição

**→ Recomendação: `electron-builder`**
Motivo: Auto-update via electron-updater (para versão futura), builds para macOS (DMG), Windows (NSIS), Linux (AppImage). Mais maduro que Electron Forge para distribuição.

#### 6.15 Testes

**→ Recomendação: `Vitest` (unit/integration) + `Playwright` (E2E)**
Motivo: Vitest integra nativamente com Vite (mesmo toolchain do electron-vite). Playwright para testes E2E do app Electron.

#### 6.16 Persistência de Chat

**→ Recomendação: `SQLite` (via better-sqlite3/Kysely)**
Motivo: Sessões de chat com milhares de mensagens, token counts, timestamps — relacional é mais adequado que JSON/MD. Queries tipo "todas as sessões deste workspace" são triviais com SQL.

---

## 6bis. shadcnblocks — Biblioteca Estendida de Componentes

### O que é

O **shadcnblocks** (shadcnblocks.com) é uma biblioteca estendida com 500+ blocos e componentes production-ready compatíveis com shadcn/ui. O projeto possui assinatura **Pro**, dando acesso a todos os blocos premium.

### Application Shell 9 — Base do Layout

O bloco **Application Shell 9** ("IDE-Style File Explorer Shell") é a base estrutural do app. Ele implementa:

- **Activity Bar** (barra lateral esquerda estreita) — ícones de módulos (Sources, Investigations, Dossier, Graph, Settings)
- **File Explorer Sidebar** — árvore de arquivos colapsável com pastas, badges de contagem e botão de ações
- **Panel Toggle** — controle de painéis secundários (chat, graph)
- **Dark-friendly design** — tema escuro nativo

Esse padrão replica o layout do VS Code, que é ideal para o Reverso Agent por ser um app de gerenciamento de arquivos/documentos com múltiplos painéis.

**Dependências do bloco:** `button`, `collapsible`, `drawer`, `scroll-area`, `sidebar` (shadcn/ui) + `@phosphor-icons/react`.

### Configuração do Registry

Em `components.json`, o shadcnblocks é configurado como registry adicional:

```json
{
  "registries": {
    "@shadcnblocks": "https://shadcnblocks.com/r/{name}"
  }
}
```

### shadcn MCP Server

O projeto usa o **shadcn MCP** (Model Context Protocol) para que o agente de coding possa buscar, listar e instalar componentes via linguagem natural. Configurado em `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```

### Processo Obrigatório: Busca de Componentes

> **Regra:** Antes de implementar qualquer componente de UI, o agente **DEVE** buscar nos registries do shadcn/ui oficial e do shadcnblocks se já existe um componente ou bloco pronto que atenda à necessidade.

**Fluxo:**

1. Identificar a necessidade de UI (ex: "precisamos de um sidebar com file tree")
2. Buscar no shadcn/ui oficial (`shadcn@latest` CLI ou MCP)
3. Buscar no shadcnblocks (`@shadcnblocks` registry)
4. Se existe bloco pronto → instalar e adaptar
5. Se não existe → implementar do zero usando primitivos do shadcn/ui

**Exemplos de busca via MCP:**
- "Show me application shell blocks from shadcnblocks"
- "Find sidebar components in shadcn"
- "List file explorer blocks from shadcnblocks"

---

## 7. Arquitetura de Alto Nível

```
┌──────────────────────────────────────────────────────────────┐
│                        ELECTRON APP                           │
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                    MAIN PROCESS                           │ │
│  │                                                           │ │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │ │
│  │  │ AI Engine   │  │ File System  │  │ SQLite (DB)    │  │ │
│  │  │ (OpenAI SDK │  │ Manager      │  │ (better-sqlite3│  │ │
│  │  │  → OpenRou- │  │ (chokidar +  │  │  + Kysely)     │  │ │
│  │  │  ter)       │  │  workspace   │  │                │  │ │
│  │  │             │  │  operations)  │  │ - search index │  │ │
│  │  │ - streaming │  │              │  │ - chat sessions│  │ │
│  │  │ - tools     │  │ - read/write │  │ - backlinks    │  │ │
│  │  │ - agent loop│  │ - watch      │  │ - processing   │  │ │
│  │  └──────┬──────┘  └──────┬───────┘  │   status       │  │ │
│  │         │                │          └───────┬────────┘  │ │
│  │         └────────┬───────┘                  │           │ │
│  │                  │ IPC tipado (Zod)          │           │ │
│  │                  ▼                          │           │ │
│  └──────────────────┬──────────────────────────┘           │ │
│                     │                                       │ │
│  ┌──────────────────▼──────────────────────────────────────┐ │
│  │                   RENDERER PROCESS                       │ │
│  │                                                          │ │
│  │  ┌────────────┐  ┌──────────────┐  ┌─────────────────┐ │ │
│  │  │  Sidebar   │  │  Viewer      │  │  Chat Panel     │ │ │
│  │  │  (file     │  │  (Reverso   │  │  (react-mentions│ │ │
│  │  │   tree,    │  │   Markdown   │  │   input,        │ │ │
│  │  │   drag &   │  │   renderer,  │  │   action pills, │ │ │
│  │  │   drop,    │  │   Graph View │  │   cmdk menu,    │ │ │
│  │  │   status)  │  │   widget)    │  │   modes Ask/Plan/Agent)  │ │ │
│  │  └────────────┘  └──────────────┘  └─────────────────┘ │ │
│  │                                                          │ │
│  │  State: Zustand stores (workspace, viewer, chat, graph)  │ │
│  │  Routing: React Router (ou TanStack Router)              │ │
│  └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## 8. Estado de Implementação por Domínio

| Domínio | Implementado agora | Pendente principal |
|---|---|---|
| Workspace / Infra / AI | Base Electron + preload + schema compartilhado; Agent Lab funcional em `lab/agent` | Integrar engine do agente ao main process com contratos estáveis |
| Sources | Pipeline de processamento operacional no Agent Lab (standard/deep, checkpoint, fila) | Integrar fluxo completo na UI final do app |
| Dossier / Investigations | Geração e manutenção de artefatos Markdown (`dossier`, `investigation`, `leads`, `allegations`, `findings`) | Navegação e operações plenas no renderer conectadas ao estado real |
| Chat / Agent | Roteamento conversacional stateful, deep-dive-next, PEV, evidence gate, pre-write validation | Chat runtime completo no renderer (streaming + tools + actions reais) |
| UI / Screens | Shell e componentes base existentes | Polimento de UX final, alinhamento de idioma/iconografia e graph completo |

---

## 9. Critérios de Sucesso (estado atual)

### Funcionais
- ✅ Fluxo investigativo completo funciona no Agent Lab CLI com linguagem natural e estado persistido.
- ✅ Ingestão/processamento e geração de artefatos investigativos são rastreáveis no filesystem local.
- ✅ Inquiry com validações (PEV + evidence gate + pre-write) produz resultado auditável.
- ⏳ Chat e orquestração equivalentes no app renderer ainda estão em evolução.
- ⏳ Graph view de produção (fullscreen + filtros) ainda não está fechado.

### Qualidade
- ✅ Typecheck e suíte de testes focada do Agent Lab estão operacionais.
- ✅ Saídas possuem validação estrutural e trilha de evidência.
- ⏳ Necessário ampliar testes E2E de conversação e integração app<->agent.

### UX
- ✅ CLI fornece feedback guiado por etapa e próximo passo.
- ⏳ UX final no app desktop (chat-first real, ações contextuais e graph completo) permanece como foco principal.

---

## 10. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| **Custo de API OpenRouter** pode surpreender usuários em processamento massivo | Alto | Estimativa de custo antes de processar; alertas de gasto; modelo econômico como default |
| **better-sqlite3 native module** pode causar problemas de rebuild com Electron | Médio | Usar `electron-rebuild`; testar em CI para 3 plataformas; fallback para sql.js se necessário |
| **Qualidade da replica.md** depende do LLM — tabelas complexas podem falhar | Alto | Pipeline vision (páginas como imagens); modelo dedicado para processing; fallback manual |
| **Tamanho do app Electron** pode ser grande (200MB+) | Médio | Não embutir Playwright; otimizar assets; usar fontes subset |
| **Complexidade do Reverso Markdown** — muitas extensões custom podem criar bugs de rendering | Médio | Cada extensão como plugin isolado com testes unitários; fallback para markdown padrão |

---

## 11. Decisões Tomadas

| Pergunta | Resposta |
|----------|---------|
| **Time** | Solo developer com agentic coding (Cursor/Claude) |
| **Timeline** | 1 semana (~13 Março 2026) |
| **Plataformas** | macOS first (Windows/Linux pós-MVP) |
| **Web research** | Simplificado: fetch + Cheerio (sem API externa no MVP) |
| **Chat persistence** | Descartável no MVP (em memória) |
| **Idioma UI** | Inglês |

### Perguntas ainda abertas

1. **Experiência com Electron**: Primeiro projeto Electron, ou já tem experiência?
2. **Distribuição**: GitHub Releases? (Impacta estratégia pós-MVP de auto-update)
3. **Context window default**: 150k tokens — requisito firme ou ajustável?
4. **Agentic loop**: Loop sequencial simples é suficiente para o MVP, ou precisa de sub-agents paralelos?

---

## 12. Considerações Futuras (pós-MVP)

- **v0.3:** Multi-provider (Anthropic, Google direto), extração de tabelas para CSV, Operating Modes avançados
- **v0.4:** Busca semântica com embeddings, dossier customization, enriquecimento web contextual
- **v0.5+:** Auto-update, exportação de dossiê, internacionalização, plugins/extensões, colaboração

## 12.1 Gaps Prioritários (P0 / P1 / P2)

### P0 (crítico)
- Integrar o núcleo do agente (`lab/agent`) ao runtime principal do app com contratos IPC estáveis.
- Implementar chat operacional no renderer com streaming real, execução de ações e contexto vivo.
- Garantir consistência entre estado de sessão/artefatos no CLI e no app (single source of truth).

### P1 (alto)
- Fechar graph view de produção (fullscreen, filtros, navegação consistente).
- Cobertura E2E para fluxos conversacionais completos.
- Revisão completa de linguagem da UI e coerência de iconografia.

### P2 (médio)
- Hardening de concorrência/locks em operações de sessão/artefatos.
- Melhorias de observabilidade e telemetria de execução do agente.
- Recursos avançados (busca semântica, exportações, auto-update, colaboração).

---

## 13. User Journeys de Referência

O documento de referência (`Reverso_agent_project.md`) contém user journeys detalhados que servem como **critérios de aceitação** para cada fase:

| Versão | Persona | Cenário | Seção no doc de referência |
|---|---|---|---|
| v0.1 | Thiago | Setup → ingestão → processamento → AI-driven hypotheses → agentic workflow → dossier population | §User Journey: Version 0.1 |
| v0.1 | Linn | Setup → multi-format ingestion → smart processing → guided line creation → agentic search → graph visualization | §User Journey: Version 0.1 |
| v0.3 | Thiago | Model selection → operating modes → precision table extraction → scaling → comparative analysis → traceability & verification | §User Journey: Version 0.3 |
| v0.4 | Linn | Multi-provider auth → dossier customization → contextual enrichment → fact-checking | §User Journey: Version 0.4 |

Para o MVP, os journeys de v0.1 de Thiago e Linn são os **cenários-chave de validação**.

---

## 14. Anexos

- **Documento de referência completo:** `.agents/refs/Reverso_agent_project.md`
- **Design System (tema Reverso 0):** [tweakcn.com/themes/cmmfid9kr000104jufj121z63](https://tweakcn.com/themes/cmmfid9kr000104jufj121z63)
- **PRDs de domínio:** `.agents/prds/PRD-01-*.md` a `PRD-05-*.md`
