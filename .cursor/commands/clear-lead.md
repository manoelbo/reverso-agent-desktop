---
description: Limpar leads da investigação (alias de clear leads)
---

# Clear Lead

Executar a limpeza do alvo `leads` do comando `/clear`.

## Escopo

- Limpar `lab/agent/filesystem/investigation/leads/*`.
- Preservar PDFs em `lab/agent/filesystem/source`.

## Instrução

1. Executar exatamente a lógica de `/clear leads`.
2. Recriar `lab/agent/filesystem/investigation/leads` se necessário.
3. Reportar o que foi limpo e confirmar que nenhum PDF foi removido.
