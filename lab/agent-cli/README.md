# Reverso CLI

CLI do agente investigativo Reverso — OSINT com LLM. Processa documentos, gera entendimento e conduz investigações com leads, allegations e findings rastreáveis.

## Instalação

**Recomendado — instalação global** (evita conflitos com dependências do projeto):

```bash
# npm
npm install -g @reverso-agent/cli

# pnpm
pnpm add -g @reverso-agent/cli
```

Para usar como dependência local do projeto, use `--ignore-scripts` (a dependência `yargs` pode falhar em scripts de build em alguns ambientes):

```bash
npm i @reverso-agent/cli --ignore-scripts
# ou
pnpm add @reverso-agent/cli --ignore-scripts
```

Requisitos: Node.js >= 18.

Verificar:

```bash
reverso --version
reverso --help
```

## Configuração

É obrigatória uma chave de API do OpenRouter. Use uma das opções abaixo (em ordem de prioridade):

**Opção A — Variável de ambiente (recomendado)**

```bash
export OPENROUTER_API_KEY=sk-...
# ou adicione ao ~/.zshrc / ~/.bashrc
```

**Opção B — Arquivo global**

```bash
mkdir -p ~/.reverso
echo "OPENROUTER_API_KEY=sk-..." > ~/.reverso/.env
```

**Opção C — Por projeto (diretório atual)**

Crie `.env` ou `.env.local` no diretório em que você executa o CLI, com:

```bash
OPENROUTER_API_KEY=sk-...
```

Ordem de resolução efetiva da chave:

1. variável de ambiente já exportada no shell (`OPENROUTER_API_KEY`);
2. `~/.reverso/.env`;
3. `./.env` (diretório atual);
4. `./.env.local` (diretório atual).

Modelo padrão: `google/gemini-2.5-flash` (alterável via `--model` onde disponível).

## Primeiros passos

Fluxo recomendado numa pasta de investigação:

1. **init** — Lê previews em `.artifacts` (a partir de `sources/`, `source/` ou root), gera entendimento inicial e cria `agent.md`.
2. **agent-setup** — Ajusta instruções do agente (ex.: foco em pessoa ou tema).
3. **dig** — Encontra possíveis leads a partir dos previews (top 3 sugestões, comparação com leads existentes).
4. **create-lead** — Registra um lead com Inquiry Plan em `investigation/leads`.
5. **inquiry** — Executa a investigação do lead e gera allegations/findings e conclusão.

O CLI detecta automaticamente a pasta de investigação e as fontes (ordem padrão: `sources/`, `source/`, depois PDFs no root). Para forçar um caminho: `reverso --filesystem /caminho/para/root <comando>`.

### Exemplo completo

```bash
mkdir minha-investigacao && cd minha-investigacao
mkdir sources
# Copie PDFs para sources/ (ou deixe os PDFs no root)

reverso process-all                # processa PDFs e atualiza artifacts + dossier
reverso init                       # gera entendimento
reverso agent-setup --text "Foco na pessoa X"
reverso dig                        # encontra leads
reverso create-lead --idea "cartel combinacao"
reverso inquiry --lead cartel-combinacao
```

## Comandos

- **reverso setup** — Setup guiado do workspace investigativo e configuração inicial.
- **reverso process** — Alias de alto nível: detecta PDFs em `sources/`, `source/` ou root e dispara `process-all`.
- **reverso process-all** — Processa todos os PDFs pendentes.
- **reverso process-selected** — Processa PDFs selecionados no checkpoint; com `--files`, processa lista explícita (CSV ou JSON array).
- **reverso process-source** — Reprocessa um único PDF por nome (`--file`) em `standard` ou `deep`.
- **reverso process-queue** — Processa apenas documentos já enfileirados.
- **reverso queue-status** — Mostra a fila de processamento.
- **reverso queue-clear** — Limpa a fila (inteira ou por `--files`).
- **reverso watch** — Observa a pasta de fontes e atualiza checkpoint/queue.
- **reverso select** — Marca/desmarca PDFs para `process-selected`.
- **reverso rerun** — Limpa artefatos do modo e reprocessa (`--all` ou `--input`).
- **reverso delete-source** — Remove um PDF de `source`, remove `source/.artifacts/<docId>` e substitui o nome do arquivo por `deleted` em artefatos investigativos gerados.
- **reverso init** — Entendimento inicial a partir dos previews. Saída: `agent.md`.
- **reverso agent-setup** — Atualiza `agent.md` com novas instruções (`--text "..."`).
- **reverso dig** — Deep-dive nos previews, sugere leads. Saída: relatório em `reports/dig-<timestamp>.md`.
- **reverso create-lead** — Cria lead com Inquiry Plan (`--idea "..."` opcional). Saída: `investigation/leads/lead-<slug>.md`.
- **reverso inquiry** — Executa a investigação de um lead sem fluxo de aprovação manual. Saída: allegations, findings e conclusão no lead.
- **reverso inquiry-all** — Executa investigação em lote para múltiplos leads no contexto atual.
- **reverso doc-process** — Namespace legado para compatibilidade (`reverso doc-process <subcomando>`). Prefira comandos diretos.

Flags globais: `--filesystem <path>`, `--feedback plain|compact|visual` (padrão: visual). Use `reverso <comando> --help` para opções de cada comando.

Observação de modo: `standard` é o padrão e não faz troca automática para `deep`; `deep` só é usado quando solicitado explicitamente via `--mode deep`.

Exemplos rápidos de source direcionado:

```bash
# process-selected com lista explícita
reverso process-selected --files "a.pdf,b.pdf"
reverso process-selected --files "[\"a.pdf\",\"b.pdf\"]" --mode deep

# reprocessar um único arquivo
reverso process-source --file "a.pdf"
reverso process-source --file "a.pdf" --mode deep

# excluir arquivo e higienizar referências
reverso delete-source --file "a.pdf"
```

## Saídas esperadas

Estrutura típica após o fluxo (relativa ao root da investigação):

- **process / process-all / rerun**: `sources/.artifacts/*`, `dossier/people`, `dossier/groups`, `dossier/places`, `dossier/timeline`, `events/*`
- **init / agent-setup**: `agent.md`
- **dig**: `reports/dig-<timestamp>.md`
- **create-lead**: `investigation/leads/lead-<slug>.md`
- **inquiry**: `investigation/allegations/*.md`, `investigation/findings/*.md`, e conclusão atualizada no lead

## Troubleshooting

- **Erro `DOMMatrix is not defined` no `reverso process`**
  - Causa comum: parsing local de PDF grande em ambiente sem suporte de runtime para canvas/DOMMatrix.
  - Mitigacao imediata: rode em modo OCR deep (o CLI mantém atualização do `dossier` também nesse caminho).

```bash
reverso process --mode deep
# ou
reverso process-all --mode deep
```

- **Processamento parece "travado"**
  - Veja o status da fila com `reverso queue-status`.
  - Se uma execução for interrompida, entradas `*_paused` no checkpoint são retomadas normalmente em `reverso process-all` e `reverso process-queue`.
  - Para limpar fila antiga: `reverso queue-clear`.

## Publicação e atualização sem navegador

Pacote *scoped* (`@reverso-agent/cli`). Para fluxo nao interativo, use token granular no ambiente:

```bash
export NPM_TOKEN=npm_xxxxxxxxx
```

O token deve ter permissao de publish e bypass de 2FA.

Guia completo (login, 2FA/OTP, erros comuns, CI): **[PUBLISH-NPM.md](./PUBLISH-NPM.md)**.

Resumo do ciclo oficial:

```bash
cd lab/agent-cli
pnpm run release:publish-global
```

Este comando executa: `typecheck -> build -> check README/help -> version patch -> publish -> npm i -g @reverso-agent/cli@latest -> reverso --version/--help`.
