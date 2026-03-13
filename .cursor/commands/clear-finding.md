---
description: Limpar findings da investigação (alias de clear findings)
---

# Clear Finding

Executar a limpeza do alvo `findings` do comando `/clear`.

## Escopo

- Limpar `lab/agent/filesystem/investigation/findings/*`.
- Preservar PDFs em `lab/agent/filesystem/source`.

## Instrução

1. Executar exatamente a lógica de `/clear findings`.
2. Recriar `lab/agent/filesystem/investigation/findings` se necessário.
3. Reportar o que foi limpo e confirmar que nenhum PDF foi removido.
