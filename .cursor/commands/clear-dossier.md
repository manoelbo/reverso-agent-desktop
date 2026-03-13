---
description: Limpar todo o dossier (people, groups, places, timeline)
---

# Clear Dossier

Executar a limpeza do alvo `dossier` do comando `/clear`.

## Escopo

- Limpar:
  - `lab/agent/filesystem/dossier/people/*`
  - `lab/agent/filesystem/dossier/groups/*`
  - `lab/agent/filesystem/dossier/places/*`
  - `lab/agent/filesystem/dossier/timeline/*`
- Preservar PDFs em `lab/agent/filesystem/source`.

## Instrução

1. Executar exatamente a lógica de `/clear dossier`.
2. Recriar diretórios-base do dossier se necessário.
3. Reportar o que foi limpo e confirmar que nenhum PDF foi removido.
