---
description: Limpar toda a investigação (leads, allegations, findings, notes)
---

# Clear Investigation

Executar a limpeza do alvo `investigation` do comando `/clear`.

## Escopo

- Limpar:
  - `lab/agent/filesystem/investigation/leads/*`
  - `lab/agent/filesystem/investigation/allegations/*`
  - `lab/agent/filesystem/investigation/findings/*`
  - `lab/agent/filesystem/investigation/notes/*`
- Preservar PDFs em `lab/agent/filesystem/source`.

## Instrução

1. Executar exatamente a lógica de `/clear investigation`.
2. Recriar diretórios-base da investigação se necessário.
3. Reportar o que foi limpo e confirmar que nenhum PDF foi removido.
