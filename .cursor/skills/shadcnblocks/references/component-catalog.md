# Catálogo de componentes (guia prático)

Guia de escolha para componentes reutilizáveis que costumam aparecer nos blocos `@shadcnblocks`.

> Para APIs e composição final, consultar também o skill `shadcn`.

## Formulários

- Inputs, textareas, selects, radios, checkboxes, switches, validação.
- Quando usar:
  - Captura de dados em auth, settings e checkout.

## Data display

- Tabelas, cards, badges, avatares, listas de atividade.
- Quando usar:
  - Dashboards, backoffice e painéis analíticos.

## Navegação

- Sidebar, tabs, breadcrumb, pagination, menus.
- Quando usar:
  - Estruturas de app com múltiplas áreas funcionais.

## Overlays e interação

- Dialog, sheet, drawer, popover, tooltip, dropdown.
- Quando usar:
  - Ações contextuais e fluxos sem troca de página.

## Feedback e estados

- Alert, toast, progress, skeleton, empty states.
- Quando usar:
  - Confirmações, loading, erros, sucesso e ausência de dados.

## Mídia e conteúdo rico

- Galerias, blocos com imagem, prévias e cartões editoriais.
- Quando usar:
  - Landing pages, blog e storytelling visual.

## Checklist de compatibilidade

- Imports respeitam os aliases do `components.json`.
- Ícones seguem `iconLibrary` do projeto.
- Classes usam tokens semânticos, evitando cores hardcoded.
- Composição segue regras do skill `shadcn`.
