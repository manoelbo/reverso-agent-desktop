---
description: Limpar artefatos da source sem apagar PDFs
---

# Clear Source Artifacts

Executar a limpeza do alvo `source-artifacts` do comando `/clear`.

## Escopo

- Limpar `lab/agent/filesystem/source/.artifacts/*`.
- Remover `lab/agent/filesystem/source/source-checkpoint.json`.
- Preservar todos os PDFs em `lab/agent/filesystem/source`.

## Instrução

1. Executar exatamente a lógica de `/clear source-artifacts`.
2. Recriar `lab/agent/filesystem/source/.artifacts` se necessário.
3. Reportar o que foi limpo e confirmar que nenhum PDF foi removido.
