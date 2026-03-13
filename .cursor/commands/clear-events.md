---
description: Limpar logs de eventos do agente
---

# Clear Events

Executar a limpeza do alvo `events` do comando `/clear`.

## Escopo

- Limpar `lab/agent/filesystem/events/*`.
- Preservar PDFs em `lab/agent/filesystem/source`.

## Instrução

1. Executar exatamente a lógica de `/clear events`.
2. Recriar `lab/agent/filesystem/events` se necessário.
3. Reportar o que foi limpo e confirmar que nenhum PDF foi removido.
