# Feature: Electron Dossier Markdown Source of Truth

The following plan should be complete, but it is important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils, types and models. Import from the right files etc.

## Feature Description

Implementar no app Electron um fluxo de leitura de Markdown do `lab/agent/filesystem/dossier` como fonte de verdade, preservando as homes atuais do dossier (listas, busca, filtros e estrutura visual), e adicionando uma visualizacao de documento no estilo Obsidian quando o usuario clicar em arquivo/titulo.

O resultado esperado e: a sidebar e as listas de dossier refletem os `.md` reais do filesystem, e o painel central renderiza o documento selecionado com `ReversoMarkdown` (wikilinks, frontmatter e `:::event`), com atualizacao automatica quando o arquivo muda em disco.

## User Story

As a investigative journalist using Reverso Agent
I want dossier lists and document views to be driven by real Markdown files from the local workspace
So that I can browse quickly and open reliable, always-updated dossier documents in an Obsidian-like reading experience.

## Problem Statement

Hoje o app renderer usa dados mockados/hardcoded para sidebar e tabelas de dossier, com preview markdown estatico de exemplos em memoria. Isso quebra o modelo de source of truth desejado, dificulta confianca editorial e impede fluxo real de “arquivo local mudou -> UI atualizou”. O renderer tambem nao possui API IPC para leitura/watch de markdown.

## Solution Statement

Criar uma camada de dados de workspace no processo `main` (scan + leitura + watch dos markdowns do dossier), expor contratos tipados no `preload`, e consumir no `renderer` para:
1) preencher sidebar e homes com arquivos reais;
2) abrir documento Markdown ao clicar em itens de lista/tree;
3) manter as homes atuais como padrao visual;
4) atualizar o viewer automaticamente via eventos de mudanca de arquivo.

## Feature Metadata

**Feature Type**: Enhancement  
**Estimated Complexity**: High  
**Primary Systems Affected**: Electron main IPC, preload bridge, renderer AppLayout/Sidebar/Viewer panels, markdown rendering flow  
**Dependencies**: Node `fs`/`path` (built-in), existing `markdown-it` stack; optional `chokidar` only if native watch recursion proves unreliable

---

## CONTEXT REFERENCES

### Relevant Codebase Files — IMPORTANT: YOU MUST READ THESE BEFORE IMPLEMENTING!

- `src/renderer/src/components/app/AppLayout.tsx` (lines 27-48, 88-93) - Why: controla `activeView`, `dossierFilter` e composicao principal `AppSidebar + ViewerPanel`; ponto ideal para estado de documento selecionado.
- `src/renderer/src/components/app/AppSidebar.tsx` (lines 45-93, 95-129) - Why: `dossierSections` estatico e wiring atual da arvore de dossier; deve migrar para dados vindos do filesystem.
- `src/renderer/src/components/app/sidebar/AppSidebarCollapsibleMenuItem.tsx` (lines 25-39, 41-62, 64-121, 124-170) - Why: clique em arquivos ainda nao abre documento; hoje só aplica filtro por pasta.
- `src/renderer/src/components/app/sidebar/types.ts` (lines 14-43) - Why: tipos de arvore/filtro existentes que serao estendidos para metadata de arquivo e selecao de documento.
- `src/renderer/src/components/app/ViewerPanel.tsx` (lines 115-119, 163-198) - Why: roteamento das views de dossier; manter homes atuais e acoplar document viewer sem regressao.
- `src/renderer/src/components/app/viewer/PeopleViewPanel.tsx` (lines 131-150, 152-164, 211-264) - Why: padrao de home com busca/tabela e preview estatico; deve continuar como home, mas com open-document real.
- `src/renderer/src/components/app/viewer/GroupsViewPanel.tsx` (lines 127-156, 173-177, 219-272) - Why: mesmo padrao de home; ja possui coluna "View" pronta para virar acao de abrir markdown real.
- `src/renderer/src/components/app/viewer/PlacesViewPanel.tsx` (lines 132-177, 217-221, 326-383) - Why: mesma estrategia com filtros hierarquicos e coluna "View".
- `src/renderer/src/components/app/viewer/TimelineViewPanel.tsx` (lines 131-166, 205-209, 288-343) - Why: home timeline com filtros por pasta; deve abrir arquivos reais por ano/mes.
- `src/renderer/src/components/app/markdown/markdown-engine.ts` (lines 16-39) - Why: engine atual `markdown-it` + transform `:::event` + sanitize simples; reuso direto para render do documento selecionado.
- `src/renderer/src/components/app/markdown/ReversoMarkdown.tsx` (lines 99-154) - Why: componente base de render com variantes visuais e clique de wikilink; sera o viewer principal do documento aberto.
- `src/renderer/src/components/app/markdown/plugins/frontmatter.ts` (lines 82-106) - Why: parser browser-safe de frontmatter, evitando dependencia Node-only no renderer.
- `src/main/index.ts` (lines 52-73) - Why: main process ainda sem servicos de workspace/IPC (apenas ping); ponto de entrada para registrar handlers reais.
- `src/preload/index.ts` (lines 10-14) - Why: bridge atual expoe API vazia (`api = {}`); precisa contratos tipados para markdown workspace.
- `src/preload/index.d.ts` (lines 3-8) - Why: typing global do `window.api` hoje e `unknown`; precisa tipos concretos para consumo no renderer.
- `src/shared/ipc-schema.ts` (lines 1-65) - Why: local ideal para centralizar contratos/DTOs compartilhados entre main/preload/renderer.
- `lab/agent/filesystem/dossier/groups/2ss-construcoes-eireli.md` (lines 1-48) - Why: exemplo real com frontmatter, tabela, wikilinks e sections usadas na UI.
- `lab/agent/filesystem/dossier/timeline/2021/2021-05.md` (lines 1-30) - Why: exemplo real de `:::event` com atores e metadata.

### New Files to Create

- `src/shared/workspace-markdown.ts` - Contratos compartilhados de IPC para indice, leitura de documento e eventos de mudanca.
- `src/main/workspace/dossier-index.ts` - Scanner/indexador do `lab/agent/filesystem/dossier` (folders + files + metadata basica).
- `src/main/workspace/dossier-watch.ts` - Watcher de mudancas de arquivo e emissao de eventos para o renderer.
- `src/main/workspace/dossier-ipc.ts` - Registro de handlers `ipcMain.handle/on` para listagem, leitura e subscribe.
- `src/renderer/src/components/app/viewer/DossierMarkdownDocumentPanel.tsx` - Painel de leitura markdown (header + caminho + `ReversoMarkdown`).
- `src/renderer/src/components/app/dossier/workspace-client.ts` - Cliente renderer para chamadas `window.api` e subscription de eventos.
- `src/renderer/src/components/app/dossier/types.ts` - Tipos de UI para estado de selecao de documento e indices do dossier.

### Relevant Documentation — YOU SHOULD READ THESE BEFORE IMPLEMENTING! (optional; add if Context7 was used)

Nao utilizado nesta fase. O plano foi construido com base no codebase atual e padroes internos ja existentes.

### Patterns to Follow

**Naming Conventions:**  
- Componentes React em PascalCase (`PeopleViewPanel`, `ReversoMarkdown`).  
- Tipos com sufixo claro (`...Props`, `...Row`, `...Filter`).  
- IDs de view em kebab-case (`dossier-people`, `dossier-timeline`).

**Error Handling:**  
- No `main`, log explicito com `console.error` e retorno seguro (padrao usado em `source-watcher` no lab).  
- No renderer, fallback visual claro quando nao houver arquivo/documento.

**Logging Pattern:**  
- Main process usa logs simples (`console.log` / `console.error`) sem framework de logging.

**Other Relevant Patterns:**  
- `contextIsolation: true` + `nodeIntegration: false` em `BrowserWindow`; acesso a FS deve ficar no `main` e ser exposto via `preload`.  
- Evitar Node-only libs no renderer (ja houve incompatibilidade com `gray-matter`).  
- Manter layout/home visual existente (cards, tabelas, busca e filtros) e adicionar viewer documental sem quebrar UX atual.

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation
**Tasks:** definir contratos compartilhados e IPC para index/read/watch de markdown; construir scanner de dossier no `main`; expor API tipada no preload.

### Phase 2: Core Implementation
**Tasks:** substituir dados estaticos da sidebar e homes por dados do filesystem; implementar abertura de documento ao clicar em arquivo/titulo; renderizar com `ReversoMarkdown`.

### Phase 3: Integration
**Tasks:** integrar estado de selecao no `AppLayout/ViewerPanel`, preservar homes atuais, conectar atualizacao automatica por eventos de arquivo alterado e re-render somente do necessario.

### Phase 4: Testing & Validation
**Tasks:** validar typecheck/lint/build, smoke no Electron em fluxo real (abrir pasta, selecionar arquivo, editar markdown em disco, confirmar refresh), e regressao visual das homes de dossier.

---

## STEP-BY-STEP TASKS

Execute every task in order, top to bottom. Each task is atomic and independently testable.

**Task format guidelines:** CREATE | UPDATE | ADD | REMOVE | REFACTOR | MIRROR

### CREATE `src/shared/workspace-markdown.ts`
- **IMPLEMENT**: Definir DTOs/contratos: item de arquivo, no de arvore, indice por secao (people/groups/places/timeline), payload de documento e evento de mudanca (`changed`, `deleted`, `renamed` quando detectavel).
- **PATTERN**: `src/shared/ipc-schema.ts:1-65`
- **IMPORTS**: tipos TS puros (sem runtime deps)
- **GOTCHA**: contratos devem ser serializaveis e estaveis para IPC.
- **VALIDATE**: `pnpm typecheck:node`

### CREATE `src/main/workspace/dossier-index.ts`
- **IMPLEMENT**: Scanner recursivo de `lab/agent/filesystem/dossier`, com normalizacao de caminhos relativos, secao por raiz e ordenacao deterministica.
- **PATTERN**: `lab/agent/src/core/fs-io.ts:131-149` (read/list files) e `lab/agent/src/tools/document-processing/source-watcher.ts:27-36` (refresh flow)
- **IMPORTS**: `node:fs/promises`, `node:path`, tipos de `src/shared/workspace-markdown.ts`
- **GOTCHA**: suportar acentos/UTF-8 em paths (`São Paulo`) sem perder mapeamento de clique.
- **VALIDATE**: `pnpm typecheck:node`

### CREATE `src/main/workspace/dossier-watch.ts`
- **IMPLEMENT**: Watch dos diretorios do dossier com debounce e callback para notificar janela principal; incluir fallback seguro quando watch recursivo nao estiver disponivel.
- **PATTERN**: `lab/agent/src/tools/document-processing/source-watcher.ts:13-68`
- **IMPORTS**: `node:fs`, `node:path`
- **GOTCHA**: evitar flood de eventos e leaks de listeners ao recriar janela/reload.
- **VALIDATE**: `pnpm typecheck:node`

### CREATE `src/main/workspace/dossier-ipc.ts`
- **IMPLEMENT**: registrar canais `ipcMain.handle` para `listDossierIndex`, `readDossierDocument`, e canal de evento para mudancas; validar path para impedir leitura fora da raiz dossier.
- **PATTERN**: `src/main/index.ts:52-67` (registro de IPC)
- **IMPORTS**: `electron`, modulos novos de `workspace`, tipos compartilhados
- **GOTCHA**: harden de seguranca: path traversal (`..`, absolutos) bloqueado no main.
- **VALIDATE**: `pnpm typecheck:node`

### UPDATE `src/main/index.ts`
- **IMPLEMENT**: integrar `registerDossierIpc(mainWindow)` e lifecycle do watcher no startup/shutdown da janela.
- **PATTERN**: `src/main/index.ts:6-47` (createWindow lifecycle)
- **IMPORTS**: funcoes dos novos modulos `workspace`
- **GOTCHA**: garantir cleanup de watcher ao fechar app/janela.
- **VALIDATE**: `pnpm typecheck:node`

### UPDATE `src/preload/index.ts` and `src/preload/index.d.ts`
- **IMPLEMENT**: expor API tipada em `window.api.workspaceMarkdown` com metodos `listDossierIndex`, `readDossierDocument`, `subscribeDossierChanges`.
- **PATTERN**: `src/preload/index.ts:10-22`
- **IMPORTS**: `ipcRenderer`, tipos de `src/shared/workspace-markdown.ts`
- **GOTCHA**: manter `contextIsolation` (sem acesso direto de FS no renderer).
- **VALIDATE**: `pnpm typecheck`

### UPDATE `src/shared/ipc-schema.ts`
- **IMPLEMENT**: consolidar exports de contratos de workspace markdown (direto ou re-export), mantendo compat com tipos atuais de stream do agente.
- **PATTERN**: `src/shared/ipc-schema.ts:1-65`
- **IMPORTS**: tipos novos de shared workspace
- **GOTCHA**: nao quebrar tipagens existentes que consumam `AgentSessionEvent`.
- **VALIDATE**: `pnpm typecheck`

### CREATE `src/renderer/src/components/app/dossier/workspace-client.ts` and `src/renderer/src/components/app/dossier/types.ts`
- **IMPLEMENT**: cliente de dados para carregar indice/documento e gerenciar subscription de mudancas; tipos de estado (selected doc, loading, error, stale).
- **PATTERN**: estilo de tipos locais em `src/renderer/src/components/app/sidebar/types.ts:14-43`
- **IMPORTS**: `window.api` typings + contratos shared
- **GOTCHA**: renderer deve ter fallback quando API indisponivel (dev/test).
- **VALIDATE**: `pnpm typecheck:web`

### UPDATE `src/renderer/src/components/app/AppSidebar.tsx` and `src/renderer/src/components/app/sidebar/AppSidebarCollapsibleMenuItem.tsx`
- **IMPLEMENT**: trocar arvore hardcoded por dados dinamicos do indice do dossier; emitir evento de abertura de documento quando clicar em arquivo.
- **PATTERN**: `AppSidebar.tsx:95-149`, `AppSidebarCollapsibleMenuItem.tsx:124-170`
- **IMPORTS**: novos tipos/props para selecao de documento
- **GOTCHA**: manter comportamento de filtro por pasta (places/timeline) e selecao de `activeView`.
- **VALIDATE**: `pnpm typecheck:web`

### UPDATE `src/renderer/src/components/app/AppLayout.tsx`
- **IMPLEMENT**: adicionar estado de documento selecionado (`selectedDossierDocument`) e handlers para abrir/fechar; propagar para `AppSidebar` e `ViewerPanel`.
- **PATTERN**: `AppLayout.tsx:32-48`, `AppLayout.tsx:88-93`
- **IMPORTS**: tipos novos de dossier document state
- **GOTCHA**: ao trocar de view, decidir regra de persistencia (recomendado: limpar doc quando sair de views dossier).
- **VALIDATE**: `pnpm typecheck:web`

### UPDATE `src/renderer/src/components/app/ViewerPanel.tsx`
- **IMPLEMENT**: manter homes atuais do dossier; quando houver documento selecionado, renderizar painel markdown dedicado (inline ou split) sem remover busca/lista.
- **PATTERN**: `ViewerPanel.tsx:115-119`, `ViewerPanel.tsx:163-198`
- **IMPORTS**: novo `DossierMarkdownDocumentPanel`
- **GOTCHA**: nao alterar visual das homes quando nenhum documento estiver aberto.
- **VALIDATE**: `pnpm typecheck:web`

### CREATE `src/renderer/src/components/app/viewer/DossierMarkdownDocumentPanel.tsx`
- **IMPLEMENT**: painel com header contextual (titulo/caminho/updated), acao de fechar e corpo com `ReversoMarkdown`; suporte a loading/error e auto-refresh quando evento de mudanca atingir o arquivo aberto.
- **PATTERN**: visual shell em `ViewerPanel.tsx:121-161` + markdown component `ReversoMarkdown.tsx:119-152`
- **IMPORTS**: `ReversoMarkdown`, componentes `Badge/Button/ScrollArea` conforme padrao da UI existente
- **GOTCHA**: estado de documento deletado deve mostrar alerta e permitir voltar para home.
- **VALIDATE**: `pnpm typecheck:web`

### UPDATE dossier home panels (`PeopleViewPanel.tsx`, `GroupsViewPanel.tsx`, `PlacesViewPanel.tsx`, `TimelineViewPanel.tsx`)
- **IMPLEMENT**: substituir rows mock por indice real da secao correspondente; conectar coluna/botao "View" para abrir markdown real; manter busca/filtros e visual atual.
- **PATTERN**: tabelas e filtros ja existentes nos proprios arquivos (rows/filter logic)
- **IMPORTS**: cliente `workspace-client` + handlers recebidos via props/context
- **GOTCHA**: normalizar nomes de arquivo para labels amigaveis sem perder caminho real.
- **VALIDATE**: `pnpm typecheck:web`

### UPDATE wikilink resolution flow in renderer integration
- **IMPLEMENT**: resolver `[[wikilinks]]` para abrir documento correspondente no dossier (quando existir) em vez de apenas href textual.
- **PATTERN**: callback atual em `ReversoMarkdown.tsx:127-135`
- **IMPORTS**: index map dossier path <-> title
- **GOTCHA**: wikilink ambiguo deve exibir estado de unresolved e nao quebrar navegacao.
- **VALIDATE**: `pnpm typecheck:web`

### ADD smoke tests/manual harness (no app code behavior change)
- **IMPLEMENT**: criar checklist manual executavel para fluxo completo no Electron dev (open file from sidebar/list + watch update); opcionalmente adicionar script utilitario de smoke nao-interativo se viavel.
- **PATTERN**: scripts existentes em `package.json:14-39`
- **IMPORTS**: nenhum obrigatorio
- **GOTCHA**: manter testes nao interativos nos comandos de CI; E2E visual fica no bloco manual.
- **VALIDATE**: `pnpm typecheck && pnpm build`

---

## TESTING STRATEGY

### Unit Tests
- Scanner/indexador do dossier (path mapping, section detection, sort).
- Guard de seguranca de leitura (path traversal, arquivo inexistente, extensao invalida).
- Resolver de wikilinks para paths reais.

### Integration Tests
- Main + preload + renderer contract smoke: `list -> open -> render`.
- Evento de mudanca em arquivo aberto dispara refresh de conteudo no painel.
- Navegacao sidebar/lista abre documento correto e preserva `activeView`.

### Edge Cases
- Arquivo removido enquanto aberto.
- Renomeio com acento/espacos.
- Frontmatter ausente ou invalido.
- Wikilink sem alvo.
- Grande volume de arquivos no dossier (performance de index + debounce).

---

## VALIDATION COMMANDS

### Level 1: Syntax & Style
- `pnpm typecheck:node`
- `pnpm typecheck:web`
- `pnpm lint`

### Level 2: Unit Tests
- `pnpm test`

### Level 3: Integration Tests
- `pnpm build`

### Level 4: Manual Validation
- `pnpm dev:cdp` (app Electron com debug port)
- Navegar para `Dossier` homes (People/Groups/Places/Timeline) e confirmar layout igual ao atual.
- Clicar em arquivo na sidebar e em "View" nas tabelas; confirmar abertura de documento markdown.
- Editar um `.md` real em `lab/agent/filesystem/dossier/...` e confirmar refresh automatico do viewer.
- Clicar em `[[wikilink]]` e validar navegacao para documento interno quando resolvido.

### Level 5: Additional (e.g. MCP)
- Snapshot/screenshot via skill Electron (CDP) para registrar estado final das telas dossier + viewer de documento.

---

## ACCEPTANCE CRITERIA

- [ ] `lab/agent/filesystem/dossier` e a fonte de verdade para sidebar e homes de dossier.
- [ ] Homes atuais do dossier permanecem visualmente equivalentes (lista/busca/filtros sem regressao).
- [ ] Clique em arquivo/titulo abre documento markdown renderizado no painel (estilo leitura Obsidian-like).
- [ ] `ReversoMarkdown` continua suportando frontmatter, `[[wikilinks]]` e `:::event` com comportamento atual.
- [ ] Mudanca em arquivo markdown aberto atualiza visualizacao automaticamente no app.
- [ ] Renderer nao acessa FS direto; leitura/watch ocorre via IPC tipado.
- [ ] Typecheck/lint/build passam.

---

## VISUAL / E2E CHECKS (opcional — preencher quando a feature tiver UI ou Electron)

**Tipo de teste:** [x] Electron (CDP)  [ ] Web (localhost/URL)

**Passos (exemplo):**
1. Abrir app com `pnpm dev:cdp`; conectar via CDP e fazer snapshot da tela inicial.
2. Entrar em `Dossier / People`; verificar tabela/home intacta.
3. Clicar em um arquivo no tree da sidebar; verificar painel markdown com titulo, frontmatter e corpo renderizado.
4. Clicar em `[[wikilink]]`; verificar navegacao para documento interno (ou estado unresolved).
5. Editar o arquivo markdown em disco; aguardar evento de watch e verificar refresh da tela.
6. Capturar screenshot final com home + documento aberto para comparacao.

---

## COMPLETION CHECKLIST

- [ ] All tasks completed in order
- [ ] Each task validation passed
- [ ] All validation commands executed successfully
- [ ] Full test suite passes
- [ ] No linting/type errors
- [ ] Manual testing confirms feature works
- [ ] Acceptance criteria met

---

## NOTES

- Trade-off principal: indexar tudo on-demand simplifica inicio, mas pode crescer custo com 300+ arquivos; manter cache em memoria no main com invalidacao por watch e recomendavel.
- Preservar homes evita regressao de UX; o “modo documento” deve ser aditivo, nao substitutivo.
- Path normalization e requisito critico por conta de acentos/espacos e variacoes (`Brasil` vs `Brazil`, `São Paulo`).
- Se `fs.watch` apresentar inconsistencias multiplataforma para subpastas profundas, adotar `chokidar` como fallback controlado.
