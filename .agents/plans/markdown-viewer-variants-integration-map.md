# Markdown Viewer — Mapeamento de Integração por Variante

## Como usar este documento

Depois de escolher uma variante no Storybook (`pnpm lab:storybook:dev`, grupo `blocks/Markdown/DocumentViewer`), indique qual variante preferiu. A integração no Electron consiste em **refatorar `DossierMarkdownDocumentPanel.tsx`** usando a story escolhida como fonte de verdade.

O engine de transformação (`markdown-engine.ts`) e o componente `ReversoMarkdown.tsx` **não precisam ser alterados** em nenhuma variante.

---

## Novos componentes instalados (já em `src/renderer/src/components/ui/`)

- `card.tsx` — usado por Variant 2
- `tabs.tsx` — usado por Variant 5

---

## Mapa de integração por variante

### Variant 1 — Editorial Longform

**Arquivos a modificar:**
- `src/renderer/src/components/app/viewer/DossierMarkdownDocumentPanel.tsx`

**O que muda:**
- Remove o `section` com header colorido por seção
- Remove o `Badge` de seção com ícone
- Adiciona header editorial: eyebrow (domain/section), `h1` grande com `text-4xl`, strip de badges (type/status/category)
- Adiciona strip de metadados secundários (key-value em linha, font-size xs)
- Substitui `border + rounded` do container por `bg-background` sem borda
- `ReversoMarkdown` continua com `variant={visual.variant}` existente → mudar para `variant="editorial"` fixo
- Mantém `ScrollArea`, loading/error states, wikilink logic

**Componentes shadcn usados:** `Badge`, `Button`, `Separator`, `ScrollArea`, `Skeleton`

**Prop de `ReversoMarkdown`:** `variant="editorial"`

---

### Variant 2 — Editorial Dossier Card

**Arquivos a modificar:**
- `src/renderer/src/components/app/viewer/DossierMarkdownDocumentPanel.tsx`

**O que muda:**
- Substitui o container `section` por `Card` com `CardHeader`, `CardContent`, `CardFooter`
- `CardHeader` ganha gradient de fundo por seção (mantém o esquema de cores já existente em `sectionVisualMap`)
- Adiciona ribbon de metadados scrollável horizontalmente (`overflow-x-auto`, flex row com key-value pairs)
- `CardContent` wraps o `ReversoMarkdown`
- `CardFooter` exibe path + última atualização + botão Refresh
- `ReversoMarkdown` com `variant="editorial"` fixo

**Componentes shadcn usados:** `Card`, `CardHeader`, `CardContent`, `CardFooter`, `Badge`, `Button`, `Separator`, `ScrollArea`, `Skeleton`

**Prop de `ReversoMarkdown`:** `variant="editorial"`

---

### Variant 3 — Evidence Workbench

**Arquivos a modificar:**
- `src/renderer/src/components/app/viewer/DossierMarkdownDocumentPanel.tsx`

**O que muda:**
- Container vira `font-mono` com borda forte
- Header: path como monospace + type badge estilo terminal + status badge com cor semântica
- Substitui o header atual por grid de metadados visível (sem frontmatter panel colapsado — expõe os campos direto no header)
- Status bar no rodapé: word count, section count, domain label
- `ReversoMarkdown` com `variant="analyst"` fixo
- Remove gradiente de fundo por seção

**Componentes shadcn usados:** `Badge`, `Button`, `Separator`, `ScrollArea`, `Skeleton`

**Prop de `ReversoMarkdown`:** `variant="analyst"`

---

### Variant 4 — Evidence Timeline Rail

**Arquivos a modificar:**
- `src/renderer/src/components/app/viewer/DossierMarkdownDocumentPanel.tsx`
- `src/renderer/src/components/app/ViewerPanel.tsx` (pequeno ajuste no container `max-w-368` — passa a ser sem max-w para permitir o split layout)

**O que muda:**
- Container vira split layout: `flex min-h-0 flex-1` com `aside` (200px, fixo) + `main` (flex-1)
- `aside` = nav rail com H2 headings extraídos via `extractH2Headings()` (helper inline) + metadados compactos no rodapé do rail
- Header compacto de 44px com breadcrumb + badges
- `main` usa `ScrollArea` + `ReversoMarkdown`
- `ReversoMarkdown` com `variant="evidence"` fixo

**Componentes shadcn usados:** `Badge`, `Button`, `Separator`, `ScrollArea`, `Skeleton`, `Collapsible`

**Prop de `ReversoMarkdown`:** `variant="evidence"`

**Nota:** O `ViewerPanel` usa `max-w-368` no container de documento — isso precisará ser removido/ajustado para o split layout ter largura total.

---

### Variant 5 — Experimental Split Focus

**Arquivos a modificar:**
- `src/renderer/src/components/app/viewer/DossierMarkdownDocumentPanel.tsx`

**O que muda:**
- Container vira `Tabs` (Document | Metadata | Source)
- Tab `document`: `ScrollArea` com `ReversoMarkdown` centrado, max-w-2xl, sem chrome
- Tab `metadata`: lista vertical de todos os campos do frontmatter (`dl` estilizado)
- Tab `source`: informações do arquivo (path, domain, section, word count)
- Top bar minimal: dot colorido por domain + section + title truncado + status badge
- Remove header atual com gradiente e badges por seção

**Componentes shadcn usados:** `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, `Badge`, `Button`, `Separator`, `ScrollArea`, `Skeleton`

**Prop de `ReversoMarkdown`:** `variant="analyst"`

---

## Referências após escolha

| Elemento | Fonte de verdade |
|---|---|
| JSX da variante escolhida | Story em `lab/storybook/stories/blocks/markdown/document-viewer.stories.tsx` |
| Componente a refatorar | `src/renderer/src/components/app/viewer/DossierMarkdownDocumentPanel.tsx` |
| Engine (não mexer) | `src/renderer/src/components/app/markdown/markdown-engine.ts` |
| Renderer (não mexer) | `src/renderer/src/components/app/markdown/ReversoMarkdown.tsx` |
| FrontmatterPanel (não mexer) | `src/renderer/src/components/app/markdown/FrontmatterPanel.tsx` |
| Viewer shell externo | `src/renderer/src/components/app/ViewerPanel.tsx` (ajuste menor em Variant 4) |
