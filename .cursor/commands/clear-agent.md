---
description: Resetar artefatos do agente (preservando PDFs em source)
---

# Clear Agent

Executar a limpeza total do alvo `agent` do comando `/clear`.

## Escopo

- Limpar investigação:
  - `lab/agent/filesystem/investigation/leads/*`
  - `lab/agent/filesystem/investigation/allegations/*`
  - `lab/agent/filesystem/investigation/findings/*`
  - `lab/agent/filesystem/investigation/notes/*`
- Limpar dossier:
  - `lab/agent/filesystem/dossier/people/*`
  - `lab/agent/filesystem/dossier/groups/*`
  - `lab/agent/filesystem/dossier/places/*`
  - `lab/agent/filesystem/dossier/timeline/*`
- Limpar source derivada:
  - `lab/agent/filesystem/source/.artifacts/*`
  - `lab/agent/filesystem/source/source-checkpoint.json`
- Limpar:
  - `lab/agent/filesystem/events/*`
  - `lab/agent/filesystem/reports/*`
- Preservar todos os PDFs em `lab/agent/filesystem/source`.

## Instrução

1. Executar exatamente a lógica de `/clear agent`.
2. Recriar os diretórios-base do agente se necessário.
3. Reportar o que foi limpo e confirmar que nenhum PDF foi removido.
