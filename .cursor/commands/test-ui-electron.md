---
description: Testar fluxo visual no app Electron com snapshot, screenshots e relatório de erros
argument-hint: [fluxo-ou-objetivo]
---

# Test UI Electron

## Objetivo

Executar um teste visual/interativo no app Electron para reproduzir problemas de interface, capturar evidências (snapshot + screenshot) e reportar erros com contexto técnico.

## Pré-requisito obrigatório: app com CDP ativo

O Test UI Electron **só funciona** se o app estiver rodando com a porta de remote debugging aberta. Sem isso, o agent-browser não consegue conectar e o teste fica **bloqueado por ambiente**.

### Como subir o app com CDP (escolha uma opção)

**Opção 1 – Script npm (recomendado para teste rápido)**  
No terminal, em vez de `pnpm dev`, use:

```bash
pnpm run dev:cdp
```

Isso sobe o app com `--remoteDebuggingPort 9222`. Deixe esse terminal aberto.

**Opção 2 – VS Code**  
1. Abra o painel Run and Debug (Ctrl/Cmd+Shift+D).  
2. Selecione a configuração **"Debug Main Process"** (não "Debug All").  
3. Inicie com F5.  
O `launch.json` já define `REMOTE_DEBUGGING_PORT=9222` no ambiente.

**Opção 3 – Linha de comando explícita**  
Se quiser usar `pnpm dev` com a flag na mão:

```bash
pnpm exec electron-vite dev --remoteDebuggingPort 9222
```

**Importante:**  
- Se o app já estiver rodando com `pnpm dev` (sem CDP), **feche essa instância** e suba de novo com uma das opções acima.  
- A porta **9222** precisa estar livre. Se estiver em uso, feche o processo que a usa ou use outra porta (e ajuste o comando de conexão abaixo).

## Fluxo de execução (skill electron)

1. Ler e seguir `.cursor/skills/electron/SKILL.md`.
2. **Antes de conectar:** confirmar que o app está no ar com CDP (via `dev:cdp`, Debug Main Process ou comando explícito acima).
3. Conectar o agent-browser na porta CDP:
   ```bash
   npx agent-browser connect 9222
   ```
   (Se tiver usado outra porta, use esse número no lugar de 9222.)
4. Rodar o fluxo de teste:
   - `agent-browser snapshot -i` para mapear elementos interativos.
   - Interagir com a UI para reproduzir o cenário de `$ARGUMENTS`.
   - Novo snapshot após cada mudança relevante de estado.
5. Tirar screenshots:
   - Estado inicial.
   - Estado no momento do erro (quando reproduzido).
   - Estado final após tentativa de recuperação (se aplicável).

## Entrada

Usar `$ARGUMENTS` como cenário de teste. Exemplos:

- `chat: enviar mensagem e validar renderização markdown`
- `sidebar: abrir/fechar, navegação e estado ativo`
- `viewer: abrir documento e verificar quebra de layout`

Se `$ARGUMENTS` vier vazio, assumir um smoke test básico da tela principal.

## O que validar

- Erros visuais (layout quebrado, overflow, clipping, contraste, estados incorretos).
- Erros de interação (clique sem ação, foco incorreto, travamento de fluxo).
- Divergências de UX no fluxo solicitado.

## Relatório de saída

Entregar no chat:

### Cenário executado
- Fluxo usado (com base em `$ARGUMANTS`).
- Ambiente (porta CDP, app/rota/tela testada).

### Evidências
- Lista dos screenshots gerados (nomes/caminhos).
- Resumo dos snapshots relevantes.

### Achados
- Bugs encontrados (passos para reproduzir, comportamento esperado vs atual).
- Severidade sugerida (alta, média, baixa).
- Hipótese de causa (se houver sinal técnico claro).

### Resultado
- Status final: `sem erros`, `erros reproduzidos` ou `bloqueado por ambiente`.
- Se bloqueado: indicar exatamente o motivo (ex.: “app não estava com CDP na porta 9222”) e repetir as instruções de “Como subir o app com CDP” acima.
