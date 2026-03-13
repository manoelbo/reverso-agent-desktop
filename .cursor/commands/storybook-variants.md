---
description: Criar variações de componente no Storybook, escolher a favorita e implementar no código real
argument-hint: [componente(s) e objetivo, ex. AppSidebarHeader e AppSidebarFooter com 5 variações cada]
---

# Storybook Variants — Explorar variações e implementar a escolhida

## Objetivo

Repetir o fluxo: **você especifica o que quer** → **o agente cria variações no Storybook** (pequenas e grandes) → **você diz qual(is) gostou** → **o agente implementa no componente real**, usando a versão que está na story como fonte de verdade (incluindo edições que você fez no Storybook).

## Pré-requisitos

- Storybook em `lab/storybook` (rodar com `pnpm lab:storybook:dev` para visualizar).
- Componentes já existentes em `src/renderer/src` e, quando fizer sentido, stories em `lab/storybook/stories/` (ex.: `blocks/sidebar/`).
- Preferir componentes do shadcn/ui; buscar e instalar via MCP quando necessário.

## Entrada do usuário ($ARGUMENTS)

Usar **$ARGUMENTS** para entender:

- **Quais componentes** (ex.: AppSidebarHeader, AppSidebarFooter, AppSidebarCollapsibleMenuItem).
- **O que fazer** (ex.: “5 variações cada”, “explorar header com ações e status”, “footer com modelo/crédito”).
- **Tipo de variações** quando você especificar: algumas pequenas (sutis), outras grandes (mudanças de estrutura/estilo). Se não especificar, o agente deve propor um mix.

Se $ARGUMENTS estiver vazio, o agente pergunta: componentes alvo, número de variações por componente e se quer mix de mudanças pequenas/grandes.

## Fluxo em 3 fases

### Fase 1 — Criar variações no Storybook

1. **Confirmar escopo** com você (quais componentes, quantas variações, direção visual se relevante).
2. **Garantir dependências UI**: buscar/instalar componentes shadcn/ui via MCP se forem usados nas variações.
3. **Criar ou atualizar stories** em `lab/storybook/stories/` (ex.: `blocks/sidebar/app-sidebar-header.stories.tsx`), uma story por variação (Variant1… VariantN).
4. **Variedade**:
   - Algumas variações com **mudanças pequenas** (cor, ícone, label, densidade).
   - Outras com **mudanças grandes** (nova estrutura, outro padrão de ações, badges, layout diferente).
5. **Validar**: rodar `pnpm lab:storybook:build` (ou dev) e verificar no navegador que todas as variações renderizam sem erro.

Ao final da Fase 1, o agente lista as variações criadas e onde vê-las no Storybook (ex.: “AppSidebarHeader: Variant1Current, Variant2StatusBadge, …”).

### Fase 2 — Sua escolha

Você indica qual variação (ou quais) quer para cada componente (ex.: “Header → Variant4”, “Footer → Variant5”). Se você **editou** alguma variação direto na story no Storybook, dizer isso na resposta (ex.: “use a Variant4 como está no Storybook, eu mudei o dropdown”).

### Fase 3 — Implementar no componente real

1. **Fonte de verdade**: o código a aplicar é o que está **na story da variação escolhida** no Storybook, não uma réplica genérica. Se você tiver editado a story, o agente deve ler o arquivo da story atual e extrair dali o JSX/comportamento para o componente real.
2. **Atualizar** o(s) arquivo(s) do componente real em `src/renderer/src/` (ex.: `AppSidebarHeader.tsx`, `AppSidebarFooter.tsx`) para refletir exatamente a variação escolhida (com suas edições, se houver).
3. **Manter** a API pública do componente (props, integração com pai, ex.: `AppSidebar`) para não quebrar uso existente.
4. **Validar**: build do app e, se possível, abrir o app e o Storybook para confirmar que o componente real e as stories continuam consistentes.

## Critérios de pronto

- Variações criadas e visíveis no Storybook, com mix de mudanças pequenas e grandes conforme combinado.
- Você escolheu uma variação por componente (ou confirmou que não quer aplicar nenhuma).
- Componente(s) real(is) atualizado(s) com o conteúdo da story escolhida (incluindo suas edições).
- Build do projeto e do Storybook passando; sem regressão na integração (ex.: `AppSidebar` continua funcional).

## Relatório de saída

- **Fase 1**: lista de componentes, número de variações por componente, caminho das stories e comando para abrir o Storybook.
- **Fase 2**: resumo da sua escolha (qual Variant para qual componente; se há edições suas na story).
- **Fase 3**: arquivos alterados; confirmação de que a fonte usada foi a story (e não uma versão genérica).

## Notas

- Se você quiser repetir o fluxo depois para outros componentes, use este comando de novo com $ARGUMENTS descrevendo o novo alvo e tipo de variações.
- Manter preferências do AGENTS.md: workflow de exploração no Storybook primeiro e aplicar no real só após escolha explícita; ao aplicar, usar a story como fonte de verdade para não sobrescrever suas edições.
