# Etapa 11: Persistência de sessão de chat

## Objetivo

Manter o histórico da conversa entre recarregamentos da página, usando uma sessão única (`"default"`) persistida em disco no servidor.

Ao recarregar, o frontend busca a sessão existente e popula o store com as mensagens anteriores.

---

## Escopo

### Servidor (`lab/agent`)

1. **Criar `src/server/chat-session.ts`**
   - Tipo `PersistedMessage`: `{ id, role: 'user' | 'assistant', text: string, timestamp: string }`
   - Tipo `PersistedSession`: `{ id: string, createdAt: string, updatedAt: string, messages: PersistedMessage[] }`
   - `SESSION_DIR = lab/agent/filesystem/sessions/chat/`
   - `SESSION_ID = 'default'`
   - `loadChatSession(id: string): Promise<PersistedSession>` — lê `{SESSION_DIR}/{id}.json`; retorna sessão vazia se arquivo não existe
   - `appendChatTurn(id: string, userMsg: PersistedMessage, assistantMsg: PersistedMessage): Promise<void>` — carrega sessão existente (ou vazia), adiciona os dois novos messages, salva de volta

2. **Atualizar `src/server/routes/chat.ts`**
   - Ler `sessionId` do body (default: `"default"`)
   - Após emitir `done`, antes de `res.end()`, chamar `appendChatTurn` com:
     - `userMsg`: `{ id: randomUUID(), role: 'user', text, timestamp }`
     - `assistantMsg`: `{ id: messageId (mesmo do done event), role: 'assistant', text: fullText, timestamp }`
   - O `messageId` já é gerado antes do `done` — apenas extrair para reusar

3. **Adicionar `GET /api/session` em `src/server/index.ts`**
   - Chama `loadChatSession(SESSION_ID)` e retorna `{ id, messages }`
   - Se ocorrer erro de leitura, retorna `{ id: 'default', messages: [] }` sem erro 500

### Frontend (`lab/agent/interface`)

4. **Atualizar `src/lib/agent-transport.ts`**
   - Adicionar `getSession(): Promise<PersistedMessage[]>` à interface `AgentTransport`
   - Implementar em `HttpAgentTransport`: `GET /api/session` → retorna `data.messages`
   - Tipo `PersistedMessage` replicado em `types.ts` (ou importado de um arquivo compartilhado — por agora, redeclara no frontend por simplicidade)

5. **Atualizar `src/lib/types.ts`**
   - Adicionar tipo exportado `PersistedMessage`: `{ id: string; role: 'user' | 'assistant'; text: string; timestamp: string }`

6. **Atualizar `src/stores/agent-chat-store.ts`**
   - Adicionar ação `loadPersistedMessages(messages: PersistedMessage[]): void`
   - Converte cada `PersistedMessage` para `ChatMessage` (partes `[{ type: 'text', text }]`) e seta `messages`

7. **Atualizar `src/hooks/use-agent-chat.ts`**
   - Adicionar `sessionLoaded: boolean` (via `useRef` ou estado Zustand separado)
   - Adicionar `loadSession(): Promise<void>` — chama `transport.getSession()`, despacha `store.loadPersistedMessages`
   - Expor `loadSession` e `sessionLoaded` no retorno do hook

8. **Atualizar `src/App.tsx`**
   - Importar `loadSession` e `sessionLoaded` de `useAgentChat()`
   - `useEffect(() => { loadSession() }, [])` no mount do `ChatShell`
   - Enquanto `!sessionLoaded`, mostrar estado de loading sutil (ex.: `Loader` do AI Elements, ou `Shimmer` na lista de mensagens)

---

## Arquivos a criar / modificar

| Arquivo | Ação |
|---------|------|
| `lab/agent/src/server/chat-session.ts` | **Criar** — lógica de persistência |
| `lab/agent/src/server/routes/chat.ts` | **Modificar** — salvar turno após `done` |
| `lab/agent/src/server/index.ts` | **Modificar** — `GET /api/session` |
| `lab/agent/interface/src/lib/types.ts` | **Modificar** — adicionar `PersistedMessage` |
| `lab/agent/interface/src/lib/agent-transport.ts` | **Modificar** — `getSession()` |
| `lab/agent/interface/src/stores/agent-chat-store.ts` | **Modificar** — `loadPersistedMessages` |
| `lab/agent/interface/src/hooks/use-agent-chat.ts` | **Modificar** — `loadSession`, `sessionLoaded` |
| `lab/agent/interface/src/App.tsx` | **Modificar** — `useEffect` de carregamento |

---

## Decisões técnicas

| Decisão | Escolha | Justificativa |
|---------|---------|---------------|
| Formato de persistência | `PersistedMessage` (text-only) | Simples, sem dependência de rich parts; Etapa 12 usará esse texto para contexto LLM |
| Quando salvar | Após emit `done` no server | Garante que só turnos completos são persistidos |
| Ricas partes (tool-call, plan, etc.) | Não persistidas nesta etapa | Apenas o `text` final da resposta; visual enriquecido aparece só no turno atual |
| SessionId | `"default"` fixo | Sessão única — extensível para multi-sessão depois |
| Estado de loading | `sessionLoaded: boolean` | Evita flash de conversa vazia antes do carregamento; compatível com Etapa 16 (Electron) |
| Diretório | `filesystem/sessions/chat/` | Segue padrão do agent lab; pasta `sessions/` já existe |

---

## Contexto a ler antes de implementar

- `lab/agent/src/server/routes/chat.ts` — ponto de entrada do turn; onde `messageId` e `fullText` são gerados
- `lab/agent/src/server/index.ts` — onde adicionar `GET /api/session`
- `lab/agent/interface/src/lib/agent-transport.ts` — interface `AgentTransport` atual
- `lab/agent/interface/src/stores/agent-chat-store.ts` — store Zustand atual
- `lab/agent/interface/src/hooks/use-agent-chat.ts` — hook atual
- `lab/agent/interface/src/App.tsx` — `ChatShell` onde `useEffect` vai entrar

---

## Validation Commands

```bash
# 1. Typecheck servidor
cd lab/agent && pnpm typecheck

# 2. Typecheck frontend
cd lab/agent/interface && pnpm typecheck

# 3. Reiniciar servidor
cd lab/agent && pnpm serve

# 4. Teste manual
# - Abrir http://localhost:5173
# - Enviar 2–3 mensagens
# - curl http://localhost:3210/api/session → ver messages no JSON
# - Recarregar a página → mensagens anteriores devem aparecer
```

---

## Validação

Conversar com o agente → recarregar a página → mensagens anteriores aparecem como texto na UI, mantendo a continuidade visual da sessão.
