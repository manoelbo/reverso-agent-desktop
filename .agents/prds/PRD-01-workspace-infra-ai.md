# PRD-01: Workspace, Infraestrutura & AI Engine

> **Domínio:** Workspace, Infra & AI Engine
> **PRD Master:** `PRD-00-master.md`
> **Depende de:** —
> **Consumido por:** Sources, Dossier, Chat/Agent

---

## 1. Visão do Domínio

Este domínio cobre a **fundação técnica** do Capybara Agent: setup do Electron, comunicação IPC, storage local, integração com provedores de IA, roteamento de modelos, sistema de temas, e toda a infraestrutura que os outros domínios consomem.

---

## 2. User Stories

1. **Como** jornalista, **quero** criar um workspace isolado ("Investigation Desk") **para** manter cada investigação completamente separada.
2. **Como** jornalista, **quero** colar minha API Key do OpenRouter e começar a trabalhar imediatamente **para** não perder tempo com configuração complexa.
3. **Como** jornalista, **quero** escolher quais modelos usar para cada tipo de tarefa (processamento, escrita, raciocínio) **para** otimizar custo vs qualidade.
4. **Como** jornalista, **quero** alternar entre tema claro e escuro **para** trabalhar confortavelmente em sessões longas de leitura.
5. **Como** desenvolvedor, **quero** que toda comunicação entre main e renderer seja type-safe **para** evitar bugs de runtime em IPC.

---

## 3. Especificações Técnicas

### 3.1 Electron Setup

**Stack:**
- `electron-vite` (boilerplate + build tool)
- `electron-builder` (packaging + distribuição)
- TypeScript strict em todo o projeto

**Estrutura de diretórios:**

```
capybara-agent/
├── electron.vite.config.ts
├── package.json
├── src/
│   ├── main/                    # Main process (Node.js)
│   │   ├── index.ts             # Entry point, window creation
│   │   ├── trpc/                # tRPC router (IPC handlers)
│   │   │   ├── router.ts
│   │   │   ├── workspace.ts     # Workspace CRUD
│   │   │   ├── files.ts         # File operations
│   │   │   ├── ai.ts            # AI engine calls
│   │   │   ├── settings.ts      # Preferences
│   │   │   └── db.ts            # Database queries
│   │   ├── ai/                  # AI Engine
│   │   │   ├── engine.ts        # Vercel AI SDK setup
│   │   │   ├── openrouter.ts    # OpenRouter provider config
│   │   │   ├── models.ts        # Model routing logic
│   │   │   └── agent/           # Agent loop (domínio Chat)
│   │   ├── db/                  # Database
│   │   │   ├── schema.ts        # Drizzle schema
│   │   │   ├── migrations/
│   │   │   └── index.ts         # Connection setup
│   │   ├── fs/                  # File system operations
│   │   │   ├── workspace.ts     # Workspace manager
│   │   │   ├── watcher.ts       # Chokidar setup
│   │   │   └── paths.ts         # Path utilities
│   │   └── services/            # Business logic
│   ├── preload/                 # Preload script
│   │   └── index.ts             # contextBridge + tRPC expose
│   └── renderer/                # Renderer process (React)
│       ├── index.html
│       ├── main.tsx             # React entry
│       ├── App.tsx
│       ├── components/
│       │   ├── ui/              # shadcn/ui primitives
│       │   └── app/             # Product components
│       ├── stores/              # Zustand stores
│       ├── hooks/               # Custom hooks (trpc, etc.)
│       ├── lib/                 # Utilities
│       ├── styles/
│       │   └── globals.css      # Tailwind + theme + @font-face
│       └── assets/
│           └── fonts/           # IBM Plex .woff2
├── resources/                   # App icons, native assets
└── tests/
    ├── unit/                    # Vitest
    └── e2e/                     # Playwright
```

### 3.2 Frameless Window

```typescript
// macOS first — titleBarStyle: 'hiddenInset' for native traffic lights
const mainWindow = new BrowserWindow({
  titleBarStyle: 'hiddenInset',
  trafficLightPosition: { x: 12, y: 12 },
  width: 1440,
  height: 900,
  minWidth: 1024,
  minHeight: 600,
  webPreferences: {
    preload: join(__dirname, '../preload/index.js'),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: false // necessário para better-sqlite3
  }
})
```

### 3.3 IPC com electron-trpc

**Main process (router):**

```typescript
import { initTRPC } from '@trpc/server'
import { z } from 'zod'

const t = initTRPC.create()

export const appRouter = t.router({
  workspace: workspaceRouter,
  files: filesRouter,
  ai: aiRouter,
  settings: settingsRouter,
  db: dbRouter,
})

export type AppRouter = typeof appRouter
```

**Preload:**

```typescript
import { exposeElectronTRPC } from 'electron-trpc/main'
exposeElectronTRPC()
```

**Renderer (hook):**

```typescript
import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '../../main/trpc/router'

export const trpc = createTRPCReact<AppRouter>()
```

### 3.4 Workspace Manager

Cada "Investigation Desk" é uma pasta no filesystem com estrutura fixa:

```
~/CapybaraWorkspaces/
├── minha-investigacao/
│   ├── .capybara/              # Configuração do workspace
│   │   ├── config.json         # Settings (modelos, tema, etc.)
│   │   └── capybara.db         # SQLite (índice, chat, backlinks)
│   ├── sources/                # Documentos originais + processados
│   │   ├── contrato-01/
│   │   │   ├── contrato-01.pdf     # Original (imutável)
│   │   │   ├── preview.md
│   │   │   ├── metadata.md
│   │   │   └── replica.md
│   │   └── ...
│   ├── dossier/                # Dossiê
│   │   ├── dossier.md          # Config do dossiê
│   │   ├── people/
│   │   ├── groups/
│   │   ├── places/
│   │   └── timeline/
│   └── investigations/         # Linhas investigativas
│       ├── corporate-cluster/
│       │   ├── investigation.md
│       │   └── clues/
│       └── ...
```

### 3.5 SQLite Schema (Drizzle)

```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const sources = sqliteTable('sources', {
  id: text('id').primaryKey(),
  filename: text('filename').notNull(),
  originalPath: text('original_path').notNull(),
  format: text('format').notNull(),
  status: text('status').notNull().default('unprocessed'),
  pages: integer('pages'),
  processedAt: text('processed_at'),
  estimatedCost: real('estimated_cost'),
  createdAt: text('created_at').notNull(),
})

export const entities = sqliteTable('entities', {
  id: text('id').primaryKey(),
  type: text('type').notNull(), // person | group | place | event
  name: text('name').notNull(),
  filePath: text('file_path').notNull(),
  category: text('category'),
  tags: text('tags'), // JSON array
  createdAt: text('created_at').notNull(),
})

export const backlinks = sqliteTable('backlinks', {
  id: text('id').primaryKey(),
  sourceFile: text('source_file').notNull(),
  targetEntity: text('target_entity').notNull(),
  context: text('context'),
})

// Chat sessions — MVP: in-memory only (Zustand store)
// Post-MVP: persist to SQLite with these tables:
//
// export const chatSessions = sqliteTable('chat_sessions', { ... })
// export const chatMessages = sqliteTable('chat_messages', { ... })

export const searchIndex = sqliteTable('search_index', {
  id: text('id').primaryKey(),
  filePath: text('file_path').notNull(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  preview: text('preview'),
  tags: text('tags'),
  updatedAt: text('updated_at').notNull(),
})
```

### 3.6 AI Engine — Vercel AI SDK + OpenRouter

```typescript
import { openrouter } from '@openrouter/ai-sdk-provider'

export const modelRouting = {
  processing: 'google/gemini-2.5-flash-lite', // alt: 'mistralai/mistral-ocr'
  writing: 'google/gemini-3-flash',
  reasoning: 'google/gemini-3-pro',
}

export function getModel(task: keyof typeof modelRouting) {
  const modelId = modelRouting[task]
  return openrouter(modelId)
}
```

### 3.7 File Watcher

```typescript
import chokidar from 'chokidar'

export function watchWorkspace(workspacePath: string) {
  const watcher = chokidar.watch(workspacePath, {
    ignored: /(^|[\/\\])\.capybara/,
    persistent: true,
    ignoreInitial: true,
  })

  watcher
    .on('add', path => notifyRenderer('file:added', path))
    .on('change', path => notifyRenderer('file:changed', path))
    .on('unlink', path => notifyRenderer('file:removed', path))

  return watcher
}
```

### 3.8 Settings & Preferences

Persistido em `.capybara/config.json` dentro de cada workspace:

```json
{
  "name": "Investigação Prefeitura SP",
  "theme": "dark",
  "openrouterApiKey": "sk-or-...",
  "models": {
    "processing": "google/gemini-2.5-flash-lite",
    "writing": "google/gemini-3-flash",
    "reasoning": "google/gemini-3-pro"
  },
  "tokenLimit": 150000,  // range: 1k–1M (depends on model; default 150k for cost/perf balance)
  "createdAt": "2026-03-01T10:00:00Z"
}
```

### 3.9 Tema — Light/Dark Mode

```typescript
// src/renderer/lib/theme.ts
export function setTheme(mode: 'light' | 'dark') {
  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(mode)
}

export function getTheme(): 'light' | 'dark' {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}
```

Persistido via tRPC → main process → config.json. Carregado no startup antes do React render.

---

## 4. Dependências deste domínio

```json
{
  "dependencies": {
    "electron-trpc": "^0.6",
    "@trpc/server": "^11",
    "@trpc/client": "^11",
    "@trpc/react-query": "^11",
    "@tanstack/react-query": "^5",
    "zod": "^3",
    "better-sqlite3": "^11",
    "drizzle-orm": "^0.36",
    "chokidar": "^5",
    "ai": "^4",
    "@openrouter/ai-sdk-provider": "^2",
    "zustand": "^5",
    "electron-store": "^10"
  },
  "devDependencies": {
    "electron": "^34",
    "electron-vite": "^3",
    "electron-builder": "^25",
    "drizzle-kit": "^0.30",
    "vitest": "^3",
    "@playwright/test": "^1.50"
  }
}
```

---

## 5. Contratos com outros domínios

### → Para UI & Interaction (PRD-05)
- Frameless window + drag regions — ver PRD-05 §3
- Theme toggle (light/dark) — ver PRD-05 §11
- Onboarding screen — ver PRD-05 §13
- Layout master constraints (sidebar ~260px, chat ~380px) — ver PRD-05 §3
- Keyboard shortcuts — ver PRD-05 §12

### → Para Sources & Document Processing
- `trpc.files.*` — CRUD de arquivos no workspace
- `trpc.ai.streamText()` — Chamada ao LLM para processamento
- `trpc.db.sources.*` — Status de processamento no SQLite
- File watcher emite eventos de criação/modificação

### → Para Dossier & Investigations
- `trpc.files.*` — Leitura/escrita de arquivos de dossiê
- `trpc.db.entities.*` — Indexação de entidades
- `trpc.db.backlinks.*` — Registro de [[wikilinks]]

### → Para Chat & Agent
- `trpc.ai.*` — Engine de AI (streaming, tool calling)
- `trpc.db.searchIndex.*` — Busca para autocomplete de menções
- Chat sessions: in-memory (Zustand) no MVP; SQLite persistence pós-MVP
