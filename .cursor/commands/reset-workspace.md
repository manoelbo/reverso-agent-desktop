---
description: Resetar workspace local para estado inicial (zero)
---

# Reset Workspace

## Objetivo

Zerar o workspace local da aplicacao para iniciar o fluxo do zero, removendo dados gerados de investigacao, processamento e sessao, incluindo arquivos em `sources/`.

## Regras de seguranca (obrigatorias)

- Operar apenas dentro do diretório raiz do projeto atual (`$PWD`).
- Nunca apagar codigo-fonte, configs do projeto, nem arquivos fora de:
  - `sources/`
  - `dossier/`
  - `investigation/`
  - `events/`
  - `reports/`
  - `sessions/`
- Se algum caminho nao existir, seguir sem falhar.

## Escopo da limpeza

- Remover totalmente os conteudos de:
  - `sources/*` (inclui PDFs e artifacts)
  - `dossier/*`
  - `investigation/*`
  - `events/*`
  - `reports/*`
  - `sessions/*`
- Recriar estrutura base vazia:
  - `sources/.artifacts/`
  - `dossier/`
  - `investigation/`
  - `events/`
  - `reports/`
  - `sessions/`
- Recriar `sources/source-checkpoint.json` vazio com formato:
  - `version: 1`
  - `sourceDir: "<workspace>/sources"`
  - `updatedAt: <ISO string atual>`
  - `queueStatus: "idle"`
  - `files: []`

## Execucao

1. Confirmar diretório atual com `pwd` e garantir que é a raiz do projeto.
2. Executar limpeza dos diretórios de runtime.
3. Recriar diretórios-base e checkpoint inicial.
4. Reportar no final:
   - caminhos limpos;
   - caminhos recriados;
   - confirmacao de workspace vazio para novo processo.

## Resultado esperado

- A tela `Sources` abre sem documentos.
- Fila vazia pronta para novos uploads.
- Workspace local pronto para rodar `/process` a partir do zero.
