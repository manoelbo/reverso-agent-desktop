---
description: Limpar artefatos do Agent Lab por alvo (sem apagar PDFs de source)
argument-hint: [allegation|allegations|finding|findings|lead|leads|investigation|dossier|source-artifacts|reports|events|agent]
---

# Clear

## Objetivo

Limpar artefatos gerados pelo agente no `lab/agent/filesystem` por escopo, preservando sempre os PDFs da pasta `source`.

## Regras de seguranca (obrigatorias)

- Nunca apagar arquivos `*.pdf` em `lab/agent/filesystem/source`.
- Nao apagar a pasta `source`.
- Pode remover `source/.artifacts` e `source/source-checkpoint.json`.
- Sempre recriar diretorios-base apos limpeza, quando aplicavel.

## Alvos aceitos

- `allegation`, `allegations`
- `finding`, `findings`
- `lead`, `leads`
- `investigation`
- `dossier`
- `source-artifacts`
- `reports`
- `events`
- `agent`

## Execucao

1. Ler `$ARGUMENTS`, normalizar para lowercase e validar.
2. Executar limpeza do alvo correspondente:
   - `allegation|allegations` -> limpar `lab/agent/filesystem/investigation/allegations/*`
   - `finding|findings` -> limpar `lab/agent/filesystem/investigation/findings/*`
   - `lead|leads` -> limpar `lab/agent/filesystem/investigation/leads/*`
   - `investigation` -> limpar `lab/agent/filesystem/investigation/{leads,allegations,findings,notes}/*`
   - `dossier` -> limpar `lab/agent/filesystem/dossier/{people,groups,places,timeline}/*`
   - `source-artifacts` -> limpar `lab/agent/filesystem/source/.artifacts/*` e remover `lab/agent/filesystem/source/source-checkpoint.json`
   - `reports` -> limpar `lab/agent/filesystem/reports/*`
   - `events` -> limpar `lab/agent/filesystem/events/*`
   - `agent` -> executar limpeza combinada de `investigation + dossier + source-artifacts + reports + events`
3. Garantir existencia dos diretorios-base:
   - `lab/agent/filesystem/investigation/{leads,allegations,findings,notes}`
   - `lab/agent/filesystem/dossier/{people,groups,places,timeline}`
   - `lab/agent/filesystem/source/.artifacts`
   - `lab/agent/filesystem/events`
   - `lab/agent/filesystem/reports`
4. Reportar no final:
   - alvo executado;
   - caminhos limpos;
   - confirmacao explicita de que os PDFs em `source` foram preservados.

## Se o argumento vier vazio ou invalido

Responder com erro objetivo e mostrar os alvos aceitos, sem executar limpeza.
