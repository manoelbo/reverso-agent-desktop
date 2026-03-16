# Rendering — Documentação e Changelog

Este arquivo documenta como a renderização de Markdown funciona **hoje no app principal**
(`src/renderer/src/`), serve como referência base para o que é testado neste lab, e registra
cada mudança feita aqui antes de ser portada.

---

## Estado atual do app principal (snapshot inicial)

### Pipeline de renderização (`markdown-engine.ts`)

```
raw string
  → parseFrontmatter()       extrai YAML entre --- e --- do topo
  → sanitize HTML            replaceAll("<", "&lt;"), replaceAll(">", "&gt;")
  → transformEventBlocks()   regex :::event...\n---\n...:::: → HTML customizado
  → markdown-it.render()     com plugin wikiLinksPlugin
  → ReversoMarkdownDocument  { frontmatter, html }
```

**Configuração do markdown-it:**
```ts
new MarkdownIt({ html: true, linkify: true, breaks: true })
```

### Plugins

| Plugin | Arquivo | Sintaxe | Output |
|--------|---------|---------|--------|
| **frontmatter** | `plugins/frontmatter.ts` | `---\nkey: value\n---` | `Record<string, unknown>` |
| **event-block** | `plugins/event-block.ts` | `:::event\ndate: ...\n---\nbody\n::::` | HTML com classes `.reverso-event*` |
| **wiki-links** | `plugins/wiki-links.ts` | `[[Entidade]]` | `<a class="reverso-wikilink" data-wikilink="...">` |

### Componente `ReversoMarkdown`

Localização no app: `src/renderer/src/components/app/markdown/ReversoMarkdown.tsx`

**Variantes disponíveis:**

| Variante | Uso | Tipografia | Estilo |
|----------|-----|------------|--------|
| `default` | Geral | h1 2xl, p leading-7 | Card com borda, bg-card/65 |
| `editorial` | Dossier entities | h1 3xl tracking-tight, p leading-8, max-w-74ch | Card bg-background, shadow |
| `evidence` | Timeline, achados | h3 uppercase tracking-wide | Borda primary/25 |
| `analyst` | Places, compacto | h1 xl, p text-sm leading-6 | Compacto, code inline |

Estilos aplicados via `[&_element]` selectors do Tailwind no `className` do `<article>`.
Nenhum CSS dedicado — tudo via utility classes.

### `FrontmatterPanel`

- Exibe metadados do frontmatter em destaque (featured keys por variante) + grid de detalhes
- **Featured keys por variante:**
  - `default`: title, name, type, status
  - `editorial`: name, alias, role, category
  - `evidence`: status, confidence, source, updated_at
  - `analyst`: type, category, source, updated_at

### `DossierMarkdownDocumentPanel` (app Electron)

Localização: `src/renderer/src/components/app/viewer/DossierMarkdownDocumentPanel.tsx`

Mapeamento section → config visual:

| Seção | Cor | Variante MD | Ícone |
|-------|-----|-------------|-------|
| `people` | indigo | `editorial` | UserGroupIcon |
| `groups` | sky | `default` | Building05Icon |
| `places` | emerald | `analyst` | Location01Icon |
| `timeline` | amber | `evidence` | Calendar02Icon |

O painel carrega conteúdo via IPC (`readDossierDocument`) e inscreve mudanças em tempo real
(`subscribeDossierChanges`). No lab este mecanismo é substituído por `import.meta.glob`.

### Classes CSS geradas pelos plugins

| Classe | Gerada por | Uso |
|--------|------------|-----|
| `.reverso-wikilink` | wiki-links | Container do link |
| `.reverso-wikilink-label` | wiki-links | Texto do link |
| `.reverso-wikilink-icon` | wiki-links | Ícone ↗ |
| `.reverso-wikilink-self` | wiki-links | Texto simples quando o alvo é o documento atual (sem link) |
| `.reverso-event` | event-block | Container raiz do evento (Card shadcn) |
| `.reverso-event-header` | event-block | Header: data + tipo (Badge) + referência de fonte |
| `.reverso-event-date` | event-block | Data em `<time>`, font-semibold tabular-nums |
| `.reverso-event-badge` | event-block | Tipo com cor semântica por tipo de evento |
| `.reverso-event-source` | event-block | Fonte + página (header direito) |
| `.reverso-event-meta` | event-block | Faixa de actors (chips de texto) |
| `.reverso-event-meta-label` | event-block | Label "ACTORS" em uppercase/tracking |
| `.reverso-event-actor` | event-block | Chip de actor (inline, border, bg-background) |
| `.reverso-event-follows` | event-block | Faixa "Follows" opcional |
| `.reverso-event-body` | event-block | Corpo em markdown (px-4 py-3) |

**Estrutura HTML do bloco de evento (Card shadcn):**

```html
<article class="reverso-event my-5 overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10" data-event-type="[tipo]">
  <header class="reverso-event-header flex items-center gap-2 border-b border-border/50 bg-muted/20 px-4 py-2.5">
    <time class="reverso-event-date ...">2020-07-23</time>
    <span class="reverso-event-badge inline-flex h-5 items-center rounded-full border px-2.5 text-[11px] font-medium [cor-por-tipo]">other</span>
    <div class="reverso-event-source ml-auto ...">document · p. 12</div>
  </header>
  <div class="reverso-event-meta flex flex-wrap items-center gap-1.5 border-b px-4 py-2">
    <span class="reverso-event-meta-label ...">ACTORS</span>
    <span class="reverso-event-actor ...">HENRIQUE LERRO RUPP</span>
    ...
  </div>
  <!-- optional: reverso-event-follows -->
  <div class="reverso-event-body px-4 py-3 text-sm leading-relaxed">
    <!-- body em markdown renderizado -->
  </div>
</article>
```

**Mapeamento de cores por tipo de evento** (em `event-block.ts`):

| Tipo | Classe badge |
|------|-------------|
| `contract`, `legal` | `border-sky-500/25 bg-sky-500/10 text-sky-700` |
| `allegation` | `border-amber-500/25 bg-amber-500/10 text-amber-700` |
| `finding` | `border-emerald-500/25 bg-emerald-500/10 text-emerald-700` |
| `transfer` | `border-violet-500/25 bg-violet-500/10 text-violet-700` |
| `other` (default) | `border-border/60 bg-muted/60 text-muted-foreground` |

**Estilos em `ReversoMarkdown.tsx`:**  
Os seletores `.reverso-event*` foram reduzidos a apenas `[&_.reverso-event]:my-X` para controlar margem vertical por variante. Todo o visual interno vem das classes Tailwind embutidas no HTML pelo plugin.

---

## Arquivos locais do lab (cópias editáveis)

| Arquivo do lab | Origem no app |
|---------------|---------------|
| `src/markdown/markdown-engine.ts` | `src/renderer/src/components/app/markdown/markdown-engine.ts` |
| `src/markdown/ReversoMarkdown.tsx` | `src/renderer/src/components/app/markdown/ReversoMarkdown.tsx` |
| `src/markdown/FrontmatterPanel.tsx` | `src/renderer/src/components/app/markdown/FrontmatterPanel.tsx` |
| `src/markdown/plugins/frontmatter.ts` | `src/renderer/src/components/app/markdown/plugins/frontmatter.ts` |
| `src/markdown/plugins/event-block.ts` | `src/renderer/src/components/app/markdown/plugins/event-block.ts` |
| `src/markdown/plugins/wiki-links.ts` | `src/renderer/src/components/app/markdown/plugins/wiki-links.ts` |
| `src/ui/{badge,button,card,separator,scroll-area,tooltip}.tsx` | `src/renderer/src/components/ui/` |
| `src/lib/utils.ts` | `src/renderer/src/lib/utils.ts` |
| `src/assets/main.css` | `src/renderer/src/assets/main.css` |

---

## Templates do lab

| Template | ID | Variações | Descrição |
|----------|----|-----------|-----------|
| Editorial Dossier | `editorial-dossier` | dossier (indigo), investigation (amber), source (emerald) | Header com gradiente, ribbon de metadados, corpo em MD |
| Raw Markdown | `raw-markdown` | default, editorial, evidence, analyst | ReversoMarkdown direto sem estrutura adicional |

---

## Changelog do lab

> Registre aqui toda mudança significativa feita no lab antes de portar para o app.
> Formato: `### [data] — [o que mudou]` com status: **testado** | **aprovado** | **portado**

### [2026-03-14] — Event block redesenhado com markup Card/Badge shadcn — **testado**

- `event-block.ts`: `buildEventHtml()` reescrito com estrutura de Card (ring-1, rounded-xl, bg-card) e Badge por tipo de evento com cor semântica.
- Actors exibidos como chips (inline border/bg-background) em vez de `[[wikilinks]]` no header.
- Referência de fonte (source + page) movida para o lado direito do header.
- `ReversoMarkdown.tsx`: seletores `.reverso-event*` removidos — apenas `[&_.reverso-event]:my-X` por variante.
- `ui/card.tsx` adicionado ao lab (cópia do app principal) para referência de design system.
- `wiki-links.ts` + `ReversoMarkdown.tsx`: suporte a `currentRelativePath` para suprimir o link quando o alvo é o próprio documento atual (renderiza como `.reverso-wikilink-self`).

---

## Fluxo lab → app

1. **Experimentar** no lab (editar `src/markdown/`, criar templates em `src/templates/`)
2. **Documentar** a mudança neste arquivo (seção Changelog)
3. **Validar** visualmente no lab (`pnpm lab:markdown-mortor:dev`)
4. **Portar** para `src/renderer/src/` somente após aprovação explícita
5. **Atualizar** status no Changelog para "portado"
