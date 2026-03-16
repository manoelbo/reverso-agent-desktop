# Arquitetura: Agent + Interface Connected

> Documento de referência para integrar o backend do Reverso Agent (`lab/agent/src/`) com a interface React (`lab/agent/interface/`) usando AI Elements como camada visual.
>
> **Referências de pesquisa:** Arquitetura validada contra Cline (Protobus/postMessage, partial messages, ChatRow), Void (IPC Electron, ThreadStreamState, tool lifecycle) e open-cowork (Zustand, TracePanel, streaming deltas). Padrões incorporados estão marcados com `[ref:cline]`, `[ref:void]` ou `[ref:open-cowork]`.

---

## 1. Visão Geral

```
┌──────────────────────────────────────────────────────────┐
│                     Interface (React)                     │
│  ┌─────────┐  ┌──────────┐  ┌────────────────────────┐   │
│  │PromptIn │→ │ Transport │→ │   Conversation UI      │   │
│  │  put    │  │  Layer    │  │   (AI Elements)        │   │
│  └─────────┘  └────┬─────┘  └────────────────────────┘   │
│                     │         ┌────────────────────────┐   │
│  ┌──────────────┐   │         │  Zustand Store         │   │
│  │ streamingMsg │◄──┤         │  messages, streamState │   │
│  │ (isolated)   │   │         │  session, config       │   │
│  └──────────────┘   │         └────────────────────────┘   │
└─────────────────────┼────────────────────────────────────┘
                      │ HTTP + SSE (lab)
                      │ IPC (Electron — futuro)
┌─────────────────────┼────────────────────────────────────┐
│                 Agent Server                              │
│  ┌────────────┐  ┌──┴───────┐  ┌─────────────────┐       │
│  │  Router    │→ │  Runner  │→ │ OpenRouter LLM   │       │
│  │ (intent)   │  │          │  │ (streaming SSE)  │       │
│  └────────────┘  └──────────┘  └─────────────────┘       │
│  ┌────────────┐  ┌──────────┐  ┌─────────────────┐       │
│  │  Tools     │  │ Session  │  │   Filesystem     │       │
│  │ Registry   │  │  Store   │  │   (artifacts)    │       │
│  └────────────┘  └──────────┘  └─────────────────┘       │
└──────────────────────────────────────────────────────────┘
```

### Princípios

1. **Adaptar, não reescrever** — o backend já funciona; criamos apenas a camada de comunicação (server HTTP) e o adapter no frontend.
2. **Streaming-first** — toda resposta LLM chega via SSE para o frontend renderizar em tempo real.
3. **Texto acumulado** `[ref:cline,void]` — cada evento de streaming envia o texto completo acumulado (não apenas o delta), simplificando o frontend: basta substituir, não acumular.
4. **Eventos estruturados** — o server emite eventos tipados (text-delta, tool-call, route-decision, plan, status) que o frontend mapeia para AI Elements.
5. **Transport abstrato** — a camada de comunicação é um adapter (`AgentTransport`) que no lab usa HTTP/SSE e no Electron vira IPC, sem mudar a UI.
6. **Streaming message isolada** `[ref:cline]` — a mensagem em streaming é separada do array de mensagens finalizadas, evitando re-render da lista inteira a cada chunk.
7. **Sessão única** — primeira versão trabalha com uma sessão de chat por vez, persistida em disco.

---

## 2. Camada de Comunicação

### 2.1 Agent HTTP Server (novo)

Um servidor HTTP mínimo em Node.js (sem framework, usando `http` nativo ou `Hono` se preferir leveza) que expõe:

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `POST /api/chat` | POST | Recebe mensagem do usuário, retorna stream SSE com eventos do agente |
| `GET /api/session` | GET | Retorna estado da sessão ativa (stage, leads, metadata) |
| `GET /api/health` | GET | Health check |

**Localização:** `lab/agent/src/server/` (novo diretório)

**Arquivos:**

```
lab/agent/src/server/
├── index.ts            # bootstrap do servidor HTTP
├── routes/
│   ├── chat.ts         # handler POST /api/chat — orquestra runner + stream
│   └── session.ts      # handler GET /api/session
├── sse-emitter.ts      # utilidade para emitir eventos SSE formatados
└── event-types.ts      # tipos dos eventos SSE
```

### 2.2 Protocolo SSE — Eventos

O stream SSE do `POST /api/chat` emite eventos com `event:` e `data:` (JSON):

| Evento | Payload | Quando |
|--------|---------|--------|
| `route-decision` | `{ intent, route, confidence }` | Após `classifyAgentIntent` |
| `status` | `{ phase: StreamPhase, label, detail? }` | Mudanças de estado (ver 2.3) |
| `text-delta` | `{ delta, fullText }` | Cada chunk de texto do LLM — `fullText` é o texto acumulado `[ref:cline,void]` |
| `text-done` | `{ fullText }` | Texto final completo (confirmação) |
| `reasoning` | `{ delta, fullText, isStreaming }` | Raciocínio do modelo — acumulado como texto `[ref:void]` |
| `plan` | `{ title, steps[], isStreaming }` | PEV execution plan |
| `tool-call` | `{ toolId, toolName, input, lifecycle }` | Tool com lifecycle state (ver 2.4) |
| `tool-result` | `{ toolId, toolName, output, error?, lifecycle }` | Resultado de tool com lifecycle |
| `approval-request` | `{ actionId, toolName, action, context }` | Critical write gate pedindo aprovação |
| `source-reference` | `{ docId, page?, highlight? }` | Referência a documento fonte |
| `session-update` | `{ stage, leads?, summary? }` | Mudança no estado da sessão |
| `error` | `{ message, code? }` | Erro na execução |
| `done` | `{ messageId }` | Fim do stream |

### 2.3 Stream Phase — Status granular `[ref:void]`

Inspirado no `ThreadStreamState.isRunning` do Void, o evento `status` usa um `phase` explícito que determina o tipo de atividade atual:

```typescript
type StreamPhase =
  | "routing"          // classifyAgentIntent em andamento
  | "streaming-llm"    // recebendo texto do LLM
  | "executing-tool"   // tool em execução
  | "awaiting-approval" // esperando aprovação do usuário (critical write gate)
  | "processing"       // processamento genérico (runner fazendo trabalho local)
  | "idle"             // turno encerrado
```

O frontend usa `phase` para decidir que feedback visual mostrar:
- `routing` → `ChainOfThoughtStep` com spinner
- `streaming-llm` → `Shimmer` no texto + cursor pulsante
- `executing-tool` → `Tool` com `ToolHeader` em estado loading
- `awaiting-approval` → `Confirmation` com botões ativados
- `processing` → `Loader` genérico
- `idle` → nenhum indicador de atividade

### 2.4 Tool Lifecycle States `[ref:void]`

Inspirado no `ToolMessage.type` do Void (`tool_request → running_now → success → tool_error → rejected`), cada tool call passa por um ciclo de vida explícito:

```typescript
type ToolLifecycle =
  | "requested"     // LLM decidiu chamar a tool (input recebido)
  | "running"       // tool em execução
  | "success"       // tool concluiu com sucesso
  | "error"         // tool falhou
  | "rejected"      // usuário rejeitou (via approval gate)
```

O server emite `tool-call` com `lifecycle: "requested"` quando o LLM decide chamar, atualiza para `"running"` ao iniciar execução, e emite `tool-result` com `lifecycle: "success"` ou `"error"`. Se houver `approval-request` e o usuário rejeitar, emite `tool-result` com `lifecycle: "rejected"`.

### 2.3 Transport Adapter (frontend)

```typescript
// lab/agent/interface/src/lib/agent-transport.ts

interface AgentEvent {
  type: string
  data: Record<string, unknown>
}

interface AgentTransport {
  sendMessage(text: string): AsyncIterable<AgentEvent>
  getSession(): Promise<SessionState>
  approveAction(actionId: string, approved: boolean): Promise<void>
}

// Implementação HTTP (lab)
class HttpAgentTransport implements AgentTransport { ... }

// Futura implementação IPC (Electron)  
// class IpcAgentTransport implements AgentTransport { ... }
```

O adapter consome a SSE response do server e produz um `AsyncIterable<AgentEvent>` que o React consome via hook.

---

## 3. Estado e Sessão

### 3.1 Modelo de conversa

```typescript
// lab/agent/interface/src/lib/types.ts

type ToolLifecycle = "requested" | "running" | "success" | "error" | "rejected"  // [ref:void]

type StreamPhase = "routing" | "streaming-llm" | "executing-tool"
                 | "awaiting-approval" | "processing" | "idle"  // [ref:void]

type MessagePartType =
  | { type: "text"; text: string }
  | { type: "reasoning"; text: string }
  | { type: "tool-call"; toolId: string; toolName: string; input: unknown; lifecycle: ToolLifecycle; output?: unknown; error?: string }
  | { type: "plan"; title: string; steps: PlanStep[] }
  | { type: "source-reference"; docId: string; page?: number; highlight?: string }

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  parts: MessagePartType[]
  routeDecision?: { intent: string; route: string }
  timestamp: string
}

interface ChatSession {
  id: string
  messages: ChatMessage[]
  agentSession?: DeepDiveSessionState
  createdAt: string
  updatedAt: string
}
```

### 3.2 Persistência (servidor)

- Conversas ficam em `lab/agent/filesystem/sessions/chat/{sessionId}.json`
- O servidor mantém a sessão em memória durante a execução e persiste no final de cada turno
- Ao iniciar, carrega a última sessão ou cria uma nova
- A sessão de chat referencia a sessão do deep-dive (se existir) via `agentSession`

### 3.3 Contexto do LLM

Para manter contexto na conversa:

1. **Mensagens anteriores** — enviadas como `messages[]` no prompt do LLM (janela deslizante com limite de tokens)
2. **agent.md** — contexto investigativo (já existe, carregado pelo runner)
3. **Sessão deep-dive** — estado dos leads e progresso (já existe)

O servidor monta o prompt completo combinando:
- System prompt (do runner atual)
- Contexto de `agent.md` (resumo)
- Histórico de mensagens (últimas N, dentro do budget de tokens)
- Mensagem atual do usuário

---

## 4. Mapeamento: Conceitos do Agente → AI Elements

Esta é a tabela central que define como cada conceito/evento do backend se traduz em componente visual.

### 4.1 Fluxo Conversacional

| Conceito do Agente | AI Element | Componente | Detalhes |
|---------------------|------------|------------|----------|
| Mensagem do usuário | **Message** | `<Message from="user">` | Texto simples com `MessageContent > MessageResponse` |
| Resposta do agente (texto) | **Message** | `<Message from="assistant">` | `MessageResponse` com markdown rendering; streaming via substituição de `fullText` `[ref:cline,void]` |
| Estado "pensando" (pré-streaming) | **Loader** | `<Loader />` | 3 pontos animados enquanto `streamState.phase === "routing"` |
| Texto sendo recebido (streaming) | **Shimmer** | `<Shimmer>` wrapping `<MessageResponse>` | Efeito shimmer enquanto `streamState.phase === "streaming-llm"` |
| Conversa vazia | **ConversationEmptyState** | `<ConversationEmptyState>` | Título + descrição + `Suggestions` |
| Sugestões contextuais | **Suggestion** | `<Suggestions>` + `<Suggestion>` | Sugestões iniciais e pós-resposta baseadas no contexto |
| Scroll automático | **ConversationScrollButton** | `<ConversationScrollButton>` | Já implementado |

### 4.2 Roteamento e Decisão

| Conceito do Agente | AI Element | Componente | Detalhes |
|---------------------|------------|------------|----------|
| Decisão de rota (`classifyAgentIntent`) | **ChainOfThought** | `<ChainOfThoughtStep>` | Step com label "Analisando intenção", description com a rota escolhida, icon de routing |
| Raciocínio do modelo | **Reasoning** | `<Reasoning>` | Bloco colapsável com o raciocínio (se modelo suportar extended thinking) |
| Transição de fase (init → dig → ...) | **ChainOfThought** | `<ChainOfThoughtHeader>` + steps | Header com fase atual, steps para sub-etapas |

### 4.3 Ferramentas (Tools) — com Lifecycle `[ref:void]`

Cada tool call na UI reflete o `ToolLifecycle` atual via estados visuais do componente `Tool`:

| Lifecycle | ToolHeader `state` | Visual |
|-----------|-------------------|--------|
| `requested` | `input-available` | Header com ícone + nome, input visível, sem output |
| `running` | `input-streaming` | Header com spinner de loading, input visível |
| `success` | `output-available` | Header com check, input + output visíveis |
| `error` | `output-error` | Header com ícone de erro, input + error text |
| `rejected` | `output-error` | Header com ícone de bloqueio, mensagem "Rejeitado pelo usuário" |

| Conceito do Agente | AI Element | Componente | Detalhes |
|---------------------|------------|------------|----------|
| Tool call (qualquer fase) | **Tool** | `<Tool>` + `<ToolHeader state={lifecycle}>` | Estado visual muda conforme lifecycle |
| Input da tool (parâmetros) | **Tool** | `<ToolInput input={...}>` | JSON dos parâmetros formatado |
| Resultado da tool (sucesso) | **Tool** | `<ToolOutput output={...}>` | Resultado formatado |
| Resultado da tool (erro) | **Tool** | `<ToolOutput errorText={...}>` | Erro formatado |
| `createDossierEntity` | **Tool** + ícone customizado | Header: "Criando entidade no dossiê" | Output: nome, tipo, tags da entidade criada |
| `createTimelineEvent` | **Tool** + ícone customizado | Header: "Registrando evento na timeline" | Output: data, atores, descrição |
| `linkEntities` | **Tool** + ícone customizado | Header: "Conectando entidades" | Output: entidades ligadas |
| `processSourceTool` | **Tool** + ícone customizado | Header: "Processando fonte" | Output: resumo do processamento |

### 4.4 PEV (Plan → Execute → Verify)

| Conceito do Agente | AI Element | Componente | Detalhes |
|---------------------|------------|------------|----------|
| Execution Plan (inquiry) | **Plan** | `<Plan>` | `PlanTitle` com objetivo, `PlanContent` com lista de ações, `PlanFooter` com critérios de sucesso |
| Progresso do agent loop | **Queue** | `<QueueSection>` com `<QueueItem>` por ação | `QueueItemIndicator completed` conforme ação é executada |
| Verificação de evidências | **ChainOfThought** | `<ChainOfThoughtStep status="complete/error">` | Step para cada verificação do evidence gate |
| Critical write gate | **Confirmation** | `<Confirmation>` | `ConfirmationRequest` com contexto + `ConfirmationActions` (aprovar/rejeitar) |

### 4.5 Conteúdo Rico

| Conceito do Agente | AI Element | Componente | Detalhes |
|---------------------|------------|------------|----------|
| Código/dados estruturados | **CodeBlock** | `<CodeBlock>` | JSON, YAML, dados do agente |
| Markdown do agente (relatórios) | **MessageResponse** | Rendering nativo do `MessageResponse` | GFM, tabelas, listas |
| Referências a documentos | **Sources** | `<Sources>` + `<Source>` | Lista de documentos citados com link/preview |
| Citações inline | **InlineCitation** | `<InlineCitationCardTrigger>` | Hover com contexto do trecho citado |
| Estrutura de arquivos | **FileTree** | `<FileTree>` | Mostrar filesystem do agente (dossier, leads, etc.) |
| Artefatos gerados (lead, allegation) | **Artifact** | `<Artifact>` | Título + conteúdo markdown + ações (abrir, copiar) |
| Output de terminal/CLI | **Terminal** | `<Terminal>` | Para feedback estilo CLI quando relevante |
| Stack trace (erro) | **StackTrace** | `<StackTrace>` | Erros de execução com frames |

### 4.6 Informação e Status

| Conceito do Agente | AI Element | Componente | Detalhes |
|---------------------|------------|------------|----------|
| Uso de tokens | **Context** | `<Context>` no footer | Input/output/reasoning tokens e custo |
| Estado da sessão (stage) | **Plan** ou badge custom | Header ou sidebar | `awaiting_plan_decision`, `awaiting_inquiry_execution`, etc. |
| Leads sugeridos | **Queue** | `<QueueSection>` | Lista de leads com status (planned, in_progress, completed) |
| Allegations/findings counts | **Badge** (shadcn) | No header do lead | Contadores visuais |

### 4.7 Trace / Execution Visibility `[ref:open-cowork]`

Inspirado no `TracePanel` do open-cowork, um painel colapsável mostra o trace de execução do turno atual, dando visibilidade ao que o agente está fazendo internamente — complementar ao `Queue` (que mostra o plano) e ao `ChainOfThought` (que mostra raciocínio).

| Conceito do Agente | AI Element | Componente | Detalhes |
|---------------------|------------|------------|----------|
| Trace de execução do turno | **ChainOfThought** | `<ChainOfThoughtHeader>` + steps dinâmicos | Cada step = uma ação do agente (routing, LLM call, tool call, verification) |
| Step de routing | **ChainOfThoughtStep** | `status="complete"` | Mostra rota escolhida |
| Step de LLM call | **ChainOfThoughtStep** | `status="loading"` durante, `"complete"` após | Modelo + tokens usados |
| Step de tool call | **ChainOfThoughtStep** | Status segue `ToolLifecycle` | Tool name + resultado resumido |
| Step de verification | **ChainOfThoughtStep** | `status="complete"` ou `"error"` | Resultado do evidence gate |

O trace é acumulado durante o turno via eventos SSE e renderizado como uma sequência de `ChainOfThoughtStep` dentro de um `ChainOfThought` colapsável. Diferente do open-cowork (que usa um painel separado), aqui ele é inline na conversa para manter o fluxo visual dos AI Elements.

**Implementação:** Etapa futura (após etapas core). O trace pode ser construído a partir dos eventos SSE já existentes (`route-decision`, `status`, `tool-call`, `tool-result`) sem novos eventos no protocolo.

---

## 5. Arquitetura de Componentes React

### 5.1 Árvore de componentes alvo

```
App
└── AgentProvider (transport)
    └── TooltipProvider
        └── div (flex h-screen flex-col)
            ├── ChatHeader (sessão, modelo, streamState.phase)
            │   └── ModelSelector (opcional)
            ├── Conversation
            │   ├── ConversationContent
            │   │   ├── [vazio] ConversationEmptyState + Suggestions
            │   │   └── [com mensagens]
            │   │       ├── messages[] (iteração — estável, não re-renderiza durante streaming)
            │   │       │   ├── [role=user] Message > MessageContent > MessageResponse
            │   │       │   └── [role=assistant] AssistantMessage
            │   │       │       ├── [route-decision] ChainOfThoughtStep
            │   │       │       ├── [reasoning] Reasoning
            │   │       │       ├── [plan] Plan > PlanContent + Queue
            │   │       │       ├── [tool-call] ToolCallDisplay (com lifecycle visual)
            │   │       │       ├── [approval] Confirmation
            │   │       │       ├── [source-ref] SourcesDisplay
            │   │       │       ├── [text] MessageContent > MessageResponse
            │   │       │       └── [artifact] Artifact
            │   │       │
            │   │       └── streamingMessage (isolada — re-renderiza a cada chunk) [ref:cline]
            │   │           └── AssistantMessage (mesma composição acima, com Shimmer)
            │   │
            │   ├── [streamState.phase !== "idle"] StreamStateIndicator
            │   │   ├── [routing] Loader + "Analisando..."
            │   │   ├── [streaming-llm] (nenhum — Shimmer está no texto)
            │   │   ├── [executing-tool] Loader + "Executando {toolName}..."
            │   │   ├── [awaiting-approval] (nenhum — Confirmation está inline)
            │   │   └── [processing] Loader + "Processando..."
            │   └── ConversationScrollButton
            └── ChatFooter
                └── PromptInput
                    ├── PromptInputBody > PromptInputTextarea
                    └── PromptInputFooter
                        ├── PromptInputTools > Context
                        └── PromptInputSubmit
```

### 5.2 Componentes novos a criar

| Componente | Local | Responsabilidade |
|------------|-------|-----------------|
| `AgentProvider` | `src/providers/agent-provider.tsx` | Context React com transport instanciado |
| `useAgentChatStore` | `src/stores/agent-chat-store.ts` | Store Zustand: messages, streamState, session, actions `[ref:open-cowork]` |
| `useAgentChat` | `src/hooks/use-agent-chat.ts` | Hook fino que expõe store + actions com transport |
| `AssistantMessage` | `src/components/chat/assistant-message.tsx` | Renderiza parts heterogêneas de uma mensagem do assistente |
| `ChatHeader` | `src/components/chat/chat-header.tsx` | Mostra sessão ativa, modelo, status |
| `ChatFooter` | `src/components/chat/chat-footer.tsx` | Extrai lógica do PromptInput do App.tsx |
| `ToolCallDisplay` | `src/components/chat/tool-call-display.tsx` | Wrapper que mapeia tool calls do agente para o componente Tool com lifecycle |
| `PlanDisplay` | `src/components/chat/plan-display.tsx` | Wrapper que mapeia PEV plan para Plan + Queue |
| `SourcesDisplay` | `src/components/chat/sources-display.tsx` | Wrapper que mapeia referências para Sources |

### 5.3 Estrutura de pastas final

```
lab/agent/interface/src/
├── App.tsx                          # Shell principal (simplificado)
├── components/
│   ├── ai-elements/                 # AI Elements (já existe, não muda)
│   ├── ui/                          # shadcn (já existe, não muda)
│   └── chat/                        # Novos componentes de chat (novo)
│       ├── assistant-message.tsx
│       ├── chat-header.tsx
│       ├── chat-footer.tsx
│       ├── tool-call-display.tsx
│       ├── plan-display.tsx
│       └── sources-display.tsx
├── stores/
│   └── agent-chat-store.ts          # Zustand store do chat [ref:open-cowork] (novo)
├── hooks/
│   └── use-agent-chat.ts            # Hook principal do chat (novo)
├── lib/
│   ├── agent-transport.ts           # Transport adapter (novo)
│   ├── types.ts                     # Tipos compartilhados (novo)
│   └── sse-parser.ts               # Parser de eventos SSE (novo)
├── providers/
│   └── agent-provider.tsx           # Context provider (novo)
├── mock/
│   └── chat-panel-mocks.ts         # Mocks existentes (manter para referência)
└── screens/
    └── ChatPanelsReference.tsx      # Referência existente (manter)
```

---

## 6. Store e Hook — Contrato `[ref:open-cowork,cline,void]`

### 6.1 Zustand Store (`agent-chat-store.ts`)

O estado central usa Zustand para consistência com o app Electron (que já usa Zustand em `src/renderer/`). O store separa **mensagens finalizadas** de **mensagem em streaming**, evitando re-render da lista inteira a cada chunk `[ref:cline]`.

```typescript
// lab/agent/interface/src/stores/agent-chat-store.ts

interface StreamState {                           // [ref:void ThreadStreamState]
  phase: StreamPhase
  llm?: { fullText: string; fullReasoning: string }
  tool?: { toolId: string; toolName: string; lifecycle: ToolLifecycle }
  error?: { message: string; code?: string }
}

interface AgentChatState {
  // Mensagens finalizadas (só muda no fim do turno)
  messages: ChatMessage[]

  // Mensagem em streaming (muda a cada chunk, isolada) [ref:cline partial message]
  streamingMessage: ChatMessage | null

  // Estado de streaming granular [ref:void]
  streamState: StreamState

  // Sessão e configuração
  session: ChatSession | null
  input: string
  isConnected: boolean

  // Actions
  setInput: (value: string) => void
  addUserMessage: (message: ChatMessage) => void
  setStreamingMessage: (message: ChatMessage | null) => void
  updateStreamingText: (fullText: string) => void
  updateStreamingReasoning: (fullText: string) => void
  updateToolLifecycle: (toolId: string, lifecycle: ToolLifecycle, output?: unknown, error?: string) => void
  finalizeStreamingMessage: () => void    // move streamingMessage → messages
  setStreamState: (state: Partial<StreamState>) => void
  setSession: (session: ChatSession | null) => void
  loadMessages: (messages: ChatMessage[]) => void
  setError: (error: { message: string; code?: string } | null) => void
  reset: () => void
}
```

**Separação streaming vs mensagens finalizadas:**

- `messages[]` — array estável; só muda quando uma mensagem é **finalizada** (evento `done`) ou quando a sessão é carregada. Componentes que renderizam mensagens passadas subscrevem apenas a este slice.
- `streamingMessage` — objeto isolado que muda a cada chunk de streaming. Apenas o componente que renderiza a mensagem atual do assistente subscrevem a este slice. Quando o turno termina (`done`), `finalizeStreamingMessage()` move `streamingMessage` para `messages[]` e seta `streamingMessage = null`.

Isso é o equivalente ao padrão do Cline que separa `subscribeToState` (estado completo) de `subscribeToPartialMessage` (apenas a mensagem parcial).

### 6.2 Hook `useAgentChat`

Hook fino que conecta o store ao transport e expõe a API para os componentes.

```typescript
interface UseAgentChatReturn {
  // Do store (subscriptions seletivas)
  messages: ChatMessage[]
  streamingMessage: ChatMessage | null
  streamState: StreamState
  input: string
  setInput: (value: string) => void
  session: ChatSession | null
  isConnected: boolean
  error: { message: string; code?: string } | null

  // Computed
  allMessages: ChatMessage[]              // messages + streamingMessage (para renderização)
  isStreaming: boolean                     // streamState.phase !== "idle"

  // Actions (usam transport internamente)
  sendMessage: (text: string) => void
  stopStreaming: () => void
  approveAction: (actionId: string, approved: boolean) => void
}

function useAgentChat(): UseAgentChatReturn
```

**Fluxo interno:**

1. `sendMessage(text)` → store `addUserMessage` → `setStreamState({ phase: "routing" })` → chama `transport.sendMessage(text)`
2. Itera sobre `AsyncIterable<AgentEvent>`:
   - `status` → `setStreamState({ phase })` — feedback visual muda conforme a fase
   - `text-delta` → `updateStreamingText(fullText)` — substitui texto acumulado (não append) `[ref:cline,void]`
   - `reasoning` → `updateStreamingReasoning(fullText)` — idem para raciocínio
   - `tool-call` → `updateToolLifecycle(toolId, lifecycle)` + adiciona part ao `streamingMessage`
   - `tool-result` → `updateToolLifecycle(toolId, lifecycle, output, error)`
   - `plan` → adiciona part de plan ao `streamingMessage`
   - `route-decision` → atualiza `routeDecision` no `streamingMessage`
   - `done` → `finalizeStreamingMessage()` + `setStreamState({ phase: "idle" })`
3. Em caso de erro → `setStreamState({ phase: "idle", error })` + `finalizeStreamingMessage()`

---

## 7. Memória e Contexto da Conversa

### 7.1 Primeira versão (sessão única)

- O servidor mantém um array de mensagens `ChatMessage[]` em memória
- Ao receber `POST /api/chat`, o servidor:
  1. Carrega `agent.md` como contexto base
  2. Carrega sessão deep-dive ativa (se houver)
  3. Monta `messages[]` para o LLM: system prompt + contexto + histórico + nova mensagem
  4. Envia para `OpenRouterClient.chatTextStream` com `onChunk` emitindo SSE
  5. Após conclusão, persiste a sessão de chat em disco
- O frontend exibe todas as mensagens da sessão ao carregar

### 7.2 Janela de contexto

- Budget de tokens configurável (default: 80% do max do modelo)
- Mensagens mais antigas são resumidas ou descartadas quando o budget é excedido
- `agent.md` sempre incluído (prioridade alta)
- Mensagens do usuário e últimas respostas têm prioridade sobre mensagens antigas

### 7.3 Futuramente

- Múltiplas sessões com seletor
- Resumo automático de sessões longas
- Busca semântica no histórico

---

## 8. Streaming — Fluxo Detalhado

```
User clica Submit
       │
       ▼
 [Frontend]  streamState.phase = "routing"
             streamingMessage = { id, role: "assistant", parts: [] }
             <Loader /> aparece
       │
  POST /api/chat (corpo: { text, sessionId })
       │
       ▼
 [Server]  classifyAgentIntent
       │
   SSE: route-decision { intent, route }
       │                                    [Frontend] ChainOfThoughtStep aparece
       ▼
 [Server]  runner inicia (ex: runDig)
       │
   SSE: status { phase: "streaming-llm" }
       │                                    [Frontend] streamState.phase = "streaming-llm"
       ▼                                               <Loader /> some, <Shimmer> aparece
 [Server]  chatTextStream → onChunk (acumula texto)
       │
   SSE: text-delta { delta: "Olá", fullText: "Olá" }
   SSE: text-delta { delta: " mu",  fullText: "Olá mu" }
   SSE: text-delta { delta: "ndo",  fullText: "Olá mundo" }
       │                                    [Frontend] updateStreamingText(fullText)
       │                                               MessageResponse renderiza fullText
       │                                               (substituição, não append) [ref:cline,void]
       ▼
 [Server]  tool call (se PEV)
       │
   SSE: status { phase: "executing-tool" }
   SSE: plan { title, steps }               [Frontend] Plan aparece
   SSE: tool-call { toolId, toolName,
        input, lifecycle: "requested" }     [Frontend] Tool com header "requested"
   SSE: tool-call { toolId, toolName,
        input, lifecycle: "running" }       [Frontend] Tool com spinner "running"
   SSE: tool-result { toolId, output,
        lifecycle: "success" }              [Frontend] Tool com check "success"
       │
       ▼
 [Server]  mais texto...
       │
   SSE: status { phase: "streaming-llm" }
   SSE: text-delta { delta: "...", fullText: "Olá mundo. Resultado: ..." }
       │
       ▼
   SSE: done { messageId }                  [Frontend] finalizeStreamingMessage()
                                                       streamingMessage → messages[]
                                                       streamState.phase = "idle"
```

**Otimização de re-render `[ref:cline]`:** Durante streaming, apenas o componente que renderiza `streamingMessage` re-renderiza a cada chunk. Os componentes que renderizam `messages[]` (mensagens anteriores) não são afetados, pois `messages` só muda no `finalizeStreamingMessage()`. Isso replica o padrão do Cline de `sendPartialMessageEvent` (leve) vs `postStateToWebview` (pesado).

---

## 9. Preparação para Electron

A arquitetura foi desenhada para que a migração para Electron seja uma troca de transport:

| Aspecto | Lab (HTTP) | Electron (IPC) |
|---------|-----------|----------------|
| Transport | `HttpAgentTransport` | `IpcAgentTransport` |
| Server | Processo separado (porta 3210) | Main process |
| Comunicação | `fetch` + `EventSource` | `ipcRenderer.invoke` + `ipcRenderer.on` |
| Streaming | SSE (`text/event-stream`) | IPC messages sequenciais |
| Sessão | Arquivo JSON em filesystem | Mesmo, via main process |

O que muda:
- `AgentTransport` ganha implementação IPC
- Server HTTP é desligado; lógica migra para handlers IPC no main process
- Frontend continua idêntico (consome `AgentTransport`)

---

## 10. Estratégia de Implementação — Etapas

Cada etapa é autônoma, testável e corresponde a um ciclo `plan → execute-plan`.

### Etapa 1: Server HTTP mínimo + health check

**Objetivo:** Criar a infraestrutura do servidor sem lógica de agente.

**Escopo:**
- Criar `lab/agent/src/server/index.ts` com servidor HTTP (porta 3210)
- Endpoint `GET /api/health` retornando `{ ok: true }`
- Script `pnpm serve` no `package.json` do agent
- CORS habilitado para `http://localhost:5173` (vite dev)

**Validação:** `curl http://localhost:3210/api/health` retorna 200.

---

### Etapa 2: Endpoint POST /api/chat com echo SSE + fullText

**Objetivo:** Estabelecer o fluxo SSE completo com dados mockados, usando texto acumulado.

**Escopo:**
- Criar `lab/agent/src/server/sse-emitter.ts`
- Criar `lab/agent/src/server/event-types.ts` com tipos dos eventos incluindo `StreamPhase` e `ToolLifecycle`
- Endpoint `POST /api/chat` que recebe `{ text }` e retorna SSE com:
  - `status { phase: "routing" }` → `route-decision` (mock)
  - `status { phase: "streaming-llm" }` → `text-delta { delta, fullText }` (ecoa o texto, acumulando char por char com delay) `[ref:cline,void]`
  - `done`

**Validação:** `curl -X POST -d '{"text":"hello"}' http://localhost:3210/api/chat` retorna stream SSE com `fullText` acumulado em cada `text-delta`.

---

### Etapa 3: Transport adapter + Zustand store + useAgentChat no frontend

**Objetivo:** Conectar o frontend ao server via transport adapter com Zustand e streaming message isolada.

**Escopo:**
- Criar `src/lib/agent-transport.ts` (`HttpAgentTransport`)
- Criar `src/lib/sse-parser.ts` (parser de eventos SSE)
- Criar `src/lib/types.ts` (tipos compartilhados: `StreamPhase`, `ToolLifecycle`, `ChatMessage`, `MessagePartType`, etc.)
- Criar `src/stores/agent-chat-store.ts` (Zustand store com `messages`, `streamingMessage`, `streamState`) `[ref:open-cowork]`
- Criar `src/hooks/use-agent-chat.ts` (hook que conecta store ao transport)
- Criar `src/providers/agent-provider.tsx`
- Atualizar `App.tsx` para usar `useAgentChat` no lugar de `useState` manual
- Frontend usa `fullText` do SSE para renderizar (substituição, não append) `[ref:cline,void]`
- `streamingMessage` isolada de `messages[]` — só o componente atual re-renderiza durante streaming `[ref:cline]`

**Validação:** Enviar mensagem na UI → ver resposta ecoada via SSE → texto aparece via streaming → após `done`, mensagem move de `streamingMessage` para `messages[]`.

---

### Etapa 4: Conectar agent router real

**Objetivo:** Substituir mock por roteamento real do agente.

**Escopo:**
- No server, integrar `classifyAgentIntent` e `decideAgentRoute`
- Emitir `route-decision` real
- Carregar `RuntimeConfig` e `LabPaths`
- Não executar runner ainda — retornar texto descrevendo a rota escolhida

**Validação:** Enviar prompts variados → ver rota correta no `ChainOfThoughtStep`.

---

### Etapa 5: Streaming de texto LLM real

**Objetivo:** Conectar ao OpenRouter e fazer streaming de texto real com texto acumulado.

**Escopo:**
- No server, integrar `OpenRouterClient.chatTextStream` com `onChunk`:
  - Acumular texto no server: `fullText += chunk`
  - Emitir `text-delta { delta: chunk, fullText }` a cada chunk `[ref:cline,void]`
  - Emitir `status { phase: "streaming-llm" }` antes do streaming
- Começar com runner mais simples (chat genérico / resposta direta)
- Montar prompt com system + contexto de `agent.md` + mensagem do usuário

**Validação:** Enviar pergunta → ver resposta do LLM aparecendo palavra por palavra na UI → `streamingMessage` atualiza com `fullText` (substituição) → após `done`, move para `messages[]`.

---

### Etapa 6: AssistantMessage com partes heterogêneas

**Objetivo:** Renderizar diferentes tipos de conteúdo na resposta do assistente.

**Escopo:**
- Criar `src/components/chat/assistant-message.tsx`
- Mapear `MessagePartType` para AI Elements:
  - `text` → `MessageResponse` (com markdown)
  - `reasoning` → `Reasoning`
  - `route-decision` → `ChainOfThoughtStep`
- Atualizar `App.tsx` para usar `AssistantMessage`

**Validação:** Resposta com texto + reasoning renderiza ambos os componentes corretamente.

---

### Etapa 7: Feedback de tools com lifecycle

**Objetivo:** Mostrar tool calls do agente na UI com ciclo de vida visual.

**Escopo:**
- Criar `src/components/chat/tool-call-display.tsx` com mapeamento `ToolLifecycle → ToolHeader state` `[ref:void]`
- No server, emitir `tool-call` com `lifecycle: "requested"` → `"running"` e `tool-result` com `lifecycle: "success"` ou `"error"`
- No server, emitir `status { phase: "executing-tool" }` durante execução
- No frontend, mapear para `Tool > ToolHeader + ToolInput + ToolOutput` com estado visual:
  - `requested` → header com ícone + nome (input visível)
  - `running` → header com spinner
  - `success` → header com check + output
  - `error` → header com ícone de erro + error text
  - `rejected` → header com bloqueio + "Rejeitado"
- Adicionar part `tool-call` ao `AssistantMessage` via `streamingMessage`

**Validação:** Trigger um fluxo com tool → ver transição visual `requested → running → success` no Tool component.

---

### Etapa 8: PEV Plan + Queue de progresso

**Objetivo:** Mostrar o plano de execução PEV e progresso.

**Escopo:**
- Criar `src/components/chat/plan-display.tsx`
- No server, emitir `plan` com steps do `StructuredExecutionPlan`
- No frontend, renderizar `Plan` com título + `Queue` com items
- Atualizar `QueueItemIndicator` conforme tools são executadas

**Validação:** Trigger inquiry → ver Plan com steps → cada step marca como concluído.

---

### Etapa 9: Referências a fontes (Sources)

**Objetivo:** Mostrar documentos citados pelo agente.

**Escopo:**
- Criar `src/components/chat/sources-display.tsx`
- No server, emitir `source-reference` quando o agente cita documentos
- No frontend, agrupar e renderizar como `Sources > Source`
- Hover mostra preview do documento

**Validação:** Resposta que cita documentos → Sources aparece com lista clicável.

---

### Etapa 10: Confirmation para critical write gate

**Objetivo:** Permitir que o usuário aprove/rejeite ações críticas.

**Escopo:**
- No server, emitir `approval-request` quando `resolveCriticalWriteGateDecision` é chamado
- Pausar stream até receber resposta
- No frontend, renderizar `Confirmation` com `ConfirmationActions`
- Hook `approveAction` envia decisão de volta ao server

**Validação:** Inquiry com write gate → Confirmation aparece → aprovar → continua → rejeitar → para.

---

### Etapa 11: Persistência de sessão de chat

**Objetivo:** Manter conversa entre recarregamentos da página.

**Escopo:**
- No server, persistir `ChatSession` em `filesystem/sessions/chat/{id}.json`
- Endpoint `GET /api/session` retorna mensagens anteriores
- No frontend, carregar mensagens no mount via `useEffect`
- Hook `useAgentChat` popula `messages` a partir da sessão carregada

**Validação:** Conversar → recarregar página → mensagens anteriores aparecem.

---

### Etapa 12: Contexto de conversa para o LLM

**Objetivo:** Enviar histórico de mensagens para o LLM manter contexto.

**Escopo:**
- No server, montar `messages[]` com histórico da sessão + nova mensagem
- Implementar janela deslizante com budget de tokens
- Incluir `agent.md` como contexto permanente
- Incluir sessão deep-dive como contexto (resumo)

**Validação:** Conversa multi-turno → agente demonstra memória das mensagens anteriores.

---

### Etapa 13: Header com estado da sessão

**Objetivo:** Mostrar informações da sessão e modelo no header.

**Escopo:**
- Criar `src/components/chat/chat-header.tsx`
- Mostrar: modelo ativo, stage da sessão, contagem de leads
- Badge com status (connected/disconnected)
- Opcional: `ModelSelector` para trocar modelo

**Validação:** Header mostra informações corretas e atualiza em tempo real.

---

### Etapa 14: Contexto de tokens no footer

**Objetivo:** Mostrar uso real de tokens e custo.

**Escopo:**
- No server, emitir `token-usage` ao final de cada turno (dados do OpenRouter response)
- No frontend, popular `Context` com dados reais (substituindo mock `footerContext`)
- Acumular por sessão

**Validação:** Footer mostra tokens reais usados na última resposta e acumulado.

---

### Etapa 15: Execution Trace inline `[ref:open-cowork]`

**Objetivo:** Mostrar trace de execução do turno como `ChainOfThought` colapsável.

**Escopo:**
- Construir array de `TraceStep` a partir dos eventos SSE já existentes (`route-decision`, `status`, `tool-call`, `tool-result`)
- Renderizar como `ChainOfThought > ChainOfThoughtHeader + ChainOfThoughtStep[]`
- Colapsável por default, expandível pelo usuário
- Cada step mostra: tipo de ação, nome, duração, resultado resumido

**Validação:** Turno com routing + LLM + tool → trace mostra 3+ steps com status correto e tempos.

---

### Etapa 16: Polimento e preparação para Electron

**Objetivo:** Cleanup, error handling robusto e adapter IPC stub.

**Escopo:**
- Error boundaries em componentes críticos
- Reconexão automática se server cair
- Criar stub de `IpcAgentTransport` (sem implementação, só interface)
- Documentar pontos de integração para Electron
- Remover mocks e stubs não mais necessários

**Validação:** App funciona end-to-end com todos os componentes → pronto para plan de migração Electron.

---

## 11. Decisões Técnicas

| Decisão | Escolha | Justificativa |
|---------|---------|---------------|
| Protocolo de streaming | SSE (Server-Sent Events) | Unidirecional, nativo do browser, sem dependência extra; suficiente para streaming de LLM |
| Server framework | `http` nativo do Node.js | Zero dependências, o agente já roda em Node; Hono é fallback se precisar de routing complexo |
| Estado no frontend | Zustand `[ref:open-cowork]` | Já usado no app Electron (`src/renderer/`); consistência entre lab e produção; selectors granulares para otimizar re-renders |
| Streaming text format | Texto acumulado (`fullText`) `[ref:cline,void]` | Frontend faz `setText(fullText)` — sem race conditions de append, sem acumulação manual; tanto Cline quanto Void usam esse padrão |
| Streaming message isolation | `streamingMessage` separada de `messages[]` `[ref:cline]` | Só o componente da mensagem atual re-renderiza durante streaming; equivale ao `sendPartialMessageEvent` vs `postStateToWebview` do Cline |
| Stream state granularity | `StreamPhase` com 6 estados `[ref:void]` | Mais preciso que `idle/submitted/streaming`; permite feedback visual diferenciado por tipo de atividade (LLM, tool, approval) |
| Tool lifecycle | 5 estados explícitos `[ref:void]` | Mapeia diretamente para estados visuais do AI Element `Tool`; alinhado com `ToolMessage.type` do Void |
| Persistência de chat | JSON em disco (filesystem) | Consistente com o padrão do agente; migra facilmente para qualquer storage depois |
| Porta do servidor | 3210 | Livre, fácil de lembrar; configurável via env |
| Tipos compartilhados | Arquivo `types.ts` no frontend | Duplicação mínima; quando migrar para Electron, unifica via shared/ |

---

## 12. Referências de Pesquisa — Padrões Incorporados

Resumo dos padrões extraídos de cada projeto de referência e onde foram aplicados neste documento.

### Cline (ide-ai-chat-first-ref)

| Padrão | Descrição | Onde aplicado |
|--------|-----------|---------------|
| **Texto acumulado** | `sendPartialMessageEvent` envia texto completo (não delta), frontend substitui em vez de acumular | §2.2 (`text-delta.fullText`), §8 (fluxo), §11 |
| **Partial message isolada** | `subscribeToPartialMessage` separado de `subscribeToState` para evitar re-render da lista | §6.1 (`streamingMessage` vs `messages`), §8 |
| **Protobus com serviços tipados** | gRPC-like sobre postMessage com services separados (Ui, State, Task, Mcp, Models) | Validação do modelo de eventos tipados em §2.2 |
| **ChatRow com switch por tipo** | Componente único que renderiza tipos diferentes de mensagem | Validação da abordagem `AssistantMessage` com parts |

### Void (ide-ai-electron)

| Padrão | Descrição | Onde aplicado |
|--------|-----------|---------------|
| **ThreadStreamState** | `isRunning: 'LLM' \| 'tool' \| 'awaiting_user' \| 'idle'` define o que está acontecendo | §2.3 (`StreamPhase`), §6.1 (`StreamState`) |
| **Tool lifecycle** | `ToolMessage.type: 'tool_request' \| 'running_now' \| 'success' \| 'tool_error' \| 'rejected'` | §2.4 (`ToolLifecycle`), §4.3 (mapeamento visual) |
| **IPC com requestId** | Callbacks reconstruídos via `requestId` nos dois lados do IPC | Validação do modelo `transport.sendMessage` → `AsyncIterable` |
| **ChatMessage union type** | `role: 'user' \| 'assistant' \| ToolMessage \| CheckpointEntry` | Validação do modelo `MessagePartType` com union |

### open-cowork (desktop-app-chat-ui)

| Padrão | Descrição | Onde aplicado |
|--------|-----------|---------------|
| **Zustand centralizado** | Store único com `sessions`, `messagesBySession`, `partialMessagesBySession` | §6.1 (`AgentChatState`), §11 (decisão de estado) |
| **TracePanel** | Painel colapsável com steps de execução (thinking, text, tool_call, tool_result) | §4.7 (novo — Trace / Execution Visibility) |
| **ContentBlockView por tipo** | Switch de rendering por `block.type` dentro de cada mensagem | Validação de `AssistantMessage` com switch por `part.type` |
| **Streaming com deltas acumuladas** | `setPartialMessage(prev + delta)` no store, mensagem parcial na lista | §6.1 (combinado com fullText do Cline para melhor abordagem) |

---

## 13. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Runners do agente são síncronos/bloqueantes | Server HTTP trava durante execução | Executar runner em worker thread ou processo filho |
| OpenRouter rate limiting | Streaming falha no meio | Retry com backoff + mensagem de erro amigável na UI |
| Contexto de conversa excede janela do modelo | LLM perde contexto | Janela deslizante com summarization de mensagens antigas |
| Mudança de tipos entre server e frontend | Runtime errors | Tipos compartilhados em `event-types.ts`; validação no parser SSE |
| CORS em dev | Frontend não conecta ao server | CORS headers explícitos no server para `localhost:5173` |
