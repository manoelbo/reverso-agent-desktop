---
description: Limpar reports gerados pelo agente
---

# Clear Reports

Executar a limpeza do alvo `reports` do comando `/clear`.

## Escopo

- Limpar `lab/agent/filesystem/reports/*`.
- Preservar PDFs em `lab/agent/filesystem/source`.

## Instrução

1. Executar exatamente a lógica de `/clear reports`.
2. Recriar `lab/agent/filesystem/reports` se necessário.
3. Reportar o que foi limpo e confirmar que nenhum PDF foi removido.
