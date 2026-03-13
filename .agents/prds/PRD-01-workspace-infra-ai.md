# PRD-01: Workspace, Infraestrutura & AI Engine

> **Domínio:** Workspace, Infra & AI Engine
> **PRD Master:** `PRD-00-master.md`
> **Depende de:** —
> **Consumido por:** Sources, Dossier, Chat/Agent

---

## 1. Visão do Domínio

Este domínio cobre a **fundação técnica** do Reverso Agent: setup do Electron, comunicação IPC, storage local, integração com provedores de IA, roteamento de modelos, sistema de temas, e toda a infraestrutura que os outros domínios consomem.

## 1.1 Estado Atual vs Arquitetura Alvo (Mar/2026)

### Estado atual implementado
- Núcleo funcional do agente está em `lab/agent/src/**` (CLI investigativo com fluxo stateful).
- `src/main/index.ts` e renderer estão em evolução incremental, sem toda a arquitetura de serviços originalmente proposta.
- Integração com modelos está operacional via OpenRouter no Agent Lab.

### Arquitetura alvo (ainda em construção)
- Consolidar serviços em `src/main/{ipc,ai,db,fs,services}` com contratos estáveis para app desktop.
- Unificar runtime do app com o core já validado no `lab/agent`.

### Legado / Transição
- Trechos deste documento que descrevem estrutura completa no `src/main/**` representam direção-alvo.
- Não interpretar essas seções como “já implementadas” enquanto não houver paridade no código do app.

---

## 2. User Stories

1. **Como** jornalista, **quero** criar um workspace isolado ("Investigation Desk") **para** manter cada investigação completamente separada.
2. **Como** jornalista, **quero** colar minha API Key do OpenRouter e começar a trabalhar imediatamente **para** não perder tempo com configuração complexa.
3. **Como** jornalista, **quero** escolher quais modelos usar para cada tipo de tarefa (processamento, escrita, raciocínio) **para** otimizar custo vs qualidade.
4. **Como** jornalista, **quero** alternar entre tema claro e escuro **para** trabalhar confortavelmente em sessões longas de leitura.
5. **Como** desenvolvedor, **quero** que toda comunicação entre main e renderer seja type-safe **para** evitar bugs de runtime em IPC.

---

## 3. Especificações Técnicas

### 3.1 Electron Setup (target architecture)

**Stack:**
- `electron-vite` (boilerplate + build tool)
- `electron-builder` (packaging + distribuição)
- TypeScript strict em todo o projeto

**Estrutura de diretórios:**

```
reverso-agent/
├── electron.vite.config.ts
├── package.json
├── src/
│   ├── main/                    # Main process (Node.js)
│   │   ├── index.ts             # Entry point, window creation
│   │   ├── ipc/                 # IPC handlers (tipado com Zod)
│   │   │   ├── schema.ts        # Zod schemas para todos os IPC channels
│   │   │   ├── handlers.ts      # Handler registry
│   │   │   ├── workspace.ts     # Workspace CRUD
│   │   │   ├── files.ts         # File operations
│   │   │   ├── ai.ts            # AI engine calls
│   │   │   ├── settings.ts      # Preferences
│   │   │   └── db.ts            # Database queries
│   │   ├── ai/                  # AI Engine
│   │   │   ├── engine.ts        # OpenAI SDK → OpenRouter setup
│   │   │   ├── openrouter.ts    # OpenRouter config
│   │   │   ├── models.ts        # Model routing logic
│   │   │   └── agent/           # Agent loop (domínio Chat)
│   │   ├── db/                  # Database
│   │   │   ├── schema.ts        # Kysely type definitions
│   │   │   └── index.ts         # Connection setup
│   │   ├── fs/                  # File system operations
│   │   │   ├── workspace.ts     # Workspace manager
│   │   │   ├── watcher.ts       # Chokidar setup
│   │   │   └── paths.ts         # Path utilities
│   │   └── services/            # Business logic
│   ├── preload/                 # Preload script
│   │   └── index.ts             # contextBridge + typed IPC expose
│   ├── shared/                  # Shared types (main + renderer)
│   │   └── ipc-schema.ts        # Zod schemas para IPC channels
│   └── renderer/                # Renderer process (React)
│       ├── index.html
│       ├── main.tsx             # React entry
│       ├── App.tsx
│       ├── components/
│       │   ├── ui/              # shadcn/ui primitives
│       │   └── app/             # Product components
│       ├── stores/              # Zustand stores
│       ├── hooks/               # Custom hooks (useIPC, etc.)
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

### 3.3 IPC Tipado com Zod

**Shared schema (shared/ipc-schema.ts):**

```typescript
import { z } from 'zod'

export const ipcSchema = {
  'workspace:create': {
    input: z.object({ name: z.string(), apiKey: z.string() }),
    output: z.object({ path: z.string() }),
  },
  'files:read': {
    input: z.object({ path: z.string() }),
    output: z.string(),
  },
  'files:write': {
    input: z.object({ path: z.string(), content: z.string() }),
    output: z.object({ success: z.boolean() }),
  },
  'ai:chat': {
    input: z.object({
      messages: z.array(z.object({ role: z.string(), content: z.string() })),
      mode: z.enum(['question', 'planning', 'agent']),
      model: z.string(),
    }),
    output: z.string(),
  },
  'settings:get': {
    input: z.object({}),
    output: z.record(z.unknown()),
  },
  'settings:set': {
    input: z.object({ key: z.string(), value: z.unknown() }),
    output: z.object({ success: z.boolean() }),
  },
} as const

export type IpcSchema = typeof ipcSchema
export type IpcChannel = keyof IpcSchema
```

**Preload (typed bridge):**

```typescript
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  invoke: <T>(channel: string, data?: unknown): Promise<T> =>
    ipcRenderer.invoke(channel, data),
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args))
  },
  off: (channel: string, callback: (...args: unknown[]) => void) => {
    ipcRenderer.removeListener(channel, callback)
  },
})
```

**Main process (handler registry):**

```typescript
import { ipcMain } from 'electron'
import { ipcSchema, type IpcChannel } from '../shared/ipc-schema'

function registerHandler<C extends IpcChannel>(
  channel: C,
  handler: (input: z.infer<typeof ipcSchema[C]['input']>) =>
    Promise<z.infer<typeof ipcSchema[C]['output']>>
) {
  ipcMain.handle(channel, async (_event, rawInput) => {
    const input = ipcSchema[channel].input.parse(rawInput)
    return handler(input)
  })
}
```

Para streaming de respostas do agente, usar eventos IPC tipados:

```typescript
// Main → Renderer streaming via typed events
mainWindow.webContents.send('ai:stream-chunk', { text: chunk })
mainWindow.webContents.send('ai:stream-done', { toolCalls: [...] })
```

### 3.4 Workspace Manager

Cada "Investigation Desk" é uma pasta no filesystem com estrutura fixa:

```
~/ReversoWorkspaces/
├── minha-investigacao/
│   ├── .reverso/              # Configuração do workspace
│   │   ├── config.json         # Settings (modelos, tema, etc.)
│   │   └── reverso.db         # SQLite (índice, chat, backlinks)
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

### 3.5 SQLite Schema (target architecture)

```typescript
import { Kysely, SqliteDialect } from 'kysely'
import Database from 'better-sqlite3'

interface SourcesTable {
  id: string
  filename: string
  original_path: string
  format: string
  status: 'unprocessed' | 'processing' | 'processed' | 'error'
  pages: number | null
  processed_at: string | null
  estimated_cost: number | null
  created_at: string
}

interface EntitiesTable {
  id: string
  type: 'person' | 'group' | 'place' | 'event'
  name: string
  file_path: string
  category: string | null
  tags: string | null // JSON array
  created_at: string
}

interface BacklinksTable {
  id: string
  source_file: string
  target_entity: string
  context: string | null
}

interface SearchIndexTable {
  id: string
  file_path: string
  type: string
  title: string
  preview: string | null
  tags: string | null
  updated_at: string
}

// Chat sessions — MVP: in-memory only (Zustand store)
// Post-MVP: persist to SQLite with ChatSessions + ChatMessages tables

interface ReversoDB {
  sources: SourcesTable
  entities: EntitiesTable
  backlinks: BacklinksTable
  search_index: SearchIndexTable
}

export function createDatabase(dbPath: string) {
  const dialect = new SqliteDialect({
    database: new Database(dbPath),
  })
  return new Kysely<ReversoDB>({ dialect })
}
```

Criação das tabelas via SQL direto no startup (sem ferramenta de migrations):

```typescript
async function initializeSchema(db: Kysely<ReversoDB>) {
  await db.schema
    .createTable('sources')
    .ifNotExists()
    .addColumn('id', 'text', col => col.primaryKey())
    .addColumn('filename', 'text', col => col.notNull())
    .addColumn('original_path', 'text', col => col.notNull())
    .addColumn('format', 'text', col => col.notNull())
    .addColumn('status', 'text', col => col.notNull().defaultTo('unprocessed'))
    .addColumn('pages', 'integer')
    .addColumn('processed_at', 'text')
    .addColumn('estimated_cost', 'real')
    .addColumn('created_at', 'text', col => col.notNull())
    .execute()

  // ... similarly for entities, backlinks, search_index
}
```

### 3.6 AI Engine — OpenRouter (target + transição)

```typescript
import OpenAI from 'openai'

export function createOpenRouterClient(apiKey: string) {
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
  })
}

export const modelRouting = {
  processing: 'google/gemini-2.5-flash-lite',
  writing: 'google/gemini-3-flash',
  reasoning: 'google/gemini-3-pro',
}

export function getModelId(task: keyof typeof modelRouting): string {
  return modelRouting[task]
}
```

### 3.7 File Watcher

```typescript
import chokidar from 'chokidar'

export function watchWorkspace(workspacePath: string) {
  const watcher = chokidar.watch(workspacePath, {
    ignored: /(^|[\/\\])\.reverso/,
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

Persistido em `.reverso/config.json` dentro de cada workspace:

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

Persistido via IPC → main process → config.json. Carregado no startup antes do React render.

---

## 4. Dependências deste domínio (target)

```json
{
  "dependencies": {
    "openai": "^4",
    "zod": "^3",
    "better-sqlite3": "^11",
    "kysely": "^0.27",
    "chokidar": "^5",
    "zustand": "^5",
    "electron-store": "^10"
  },
  "devDependencies": {
    "electron": "^34",
    "electron-vite": "^3",
    "electron-builder": "^25",
    "vitest": "^3",
    "@playwright/test": "^1.50"
  }
}
```

---

## 5. Contratos com outros domínios (target)

### → Para UI & Interaction (PRD-05)
- Frameless window + drag regions — ver PRD-05 §3
- Theme toggle (light/dark) — ver PRD-05 §11
- Onboarding screen — ver PRD-05 §13
- Layout master constraints (sidebar ~260px, chat ~380px) — ver PRD-05 §3
- Keyboard shortcuts — ver PRD-05 §12

### → Para Sources & Document Processing
- `ipc:files.*` — CRUD de arquivos no workspace
- `ipc:ai.stream` — Chamada ao LLM para processamento (streaming via eventos IPC)
- `ipc:db.sources.*` — Status de processamento no SQLite
- File watcher emite eventos de criação/modificação

### → Para Dossier & Investigations
- `ipc:files.*` — Leitura/escrita de arquivos de dossiê
- `ipc:db.entities.*` — Indexação de entidades
- `ipc:db.backlinks.*` — Registro de [[wikilinks]]

### → Para Chat & Agent
- `ipc:ai.*` — Engine de AI (streaming, tool calling)
- `ipc:db.searchIndex.*` — Busca para autocomplete de menções
- Chat sessions: in-memory (Zustand) no MVP; SQLite persistence pós-MVP
