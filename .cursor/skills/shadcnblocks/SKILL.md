---
name: shadcnblocks
description: Selects, installs, and adapts premium shadcnblocks sections/components in projects that already use shadcn/ui. Use when the user asks for @shadcnblocks blocks, premium page sections, dashboard/ecommerce layouts, or mentions SHADCNBLOCKS_API_KEY and shadcnblocks registry setup.
user-invocable: false
---

# shadcnblocks

Extensão prática para projetos com `shadcn/ui` que também usam o registry `@shadcnblocks`.

## Referências

- Índice de seleção inteligente: [references/block-index.md](./references/block-index.md)
- Catálogo de blocos: [references/block-catalog.md](./references/block-catalog.md)
- Catálogo de componentes: [references/component-catalog.md](./references/component-catalog.md)
- Guia de setup: [references/setup-guide.md](./references/setup-guide.md)

## Objetivo

Quando o pedido envolver blocos prontos (hero, pricing, dashboard, ecommerce, auth, etc.), priorizar `@shadcnblocks` antes de implementar UI do zero.

## Pré-requisitos

1. Projeto já inicializado com `shadcn` (`components.json` existente).
2. Registry `@shadcnblocks` configurado no `components.json`.
3. Variável de ambiente disponível no shell:

```bash
SHADCNBLOCKS_API_KEY=seu_token_aqui
```

Opcional (se usar 1Password CLI):

```bash
OP_SHADCNBLOCKS_REF=op://Vault/Item/credential
```

## Workflow recomendado

1. Confirmar contexto do projeto:
   - `npx shadcn@latest info`
2. Buscar opções prontas:
   - `npx shadcn@latest search @shadcnblocks -q "<objetivo>"`
3. Inspecionar item antes de instalar:
   - `npx shadcn@latest view @shadcnblocks/<item>`
4. Instalar bloco/componente:
   - `npx shadcn@latest add @shadcnblocks/<item>`
5. Revisar e adaptar ao projeto:
   - Corrigir imports/aliases conforme `components.json`
   - Ajustar ícones para `iconLibrary` do projeto
   - Alinhar tokens de tema e padrões locais
6. Validar:
   - typecheck/lint/testes focados no escopo alterado

## Regras de uso

- Sempre tentar composição com blocos existentes antes de criar layout custom.
- Nunca commitar API key real em arquivos versionados.
- Quando não houver item adequado em `@shadcnblocks`, cair para `@shadcn` ou composição manual.
- Em dúvidas de API/composição base, seguir também as regras do skill `shadcn`.

## Comandos rápidos

```bash
# Buscar blocos
npx shadcn@latest search @shadcnblocks -q "dashboard"

# Ver detalhes do bloco
npx shadcn@latest view @shadcnblocks/dashboard-01

# Instalar bloco
npx shadcn@latest add @shadcnblocks/dashboard-01
```

## Scripts utilitários

- Resolver API key a partir de env/1Password: `scripts/get-api-key.sh`
- Configurar registry `@shadcnblocks` no projeto: `scripts/setup-shadcnblocks.sh`

## Setup automático (opcional)

```bash
bash .cursor/skills/shadcnblocks/scripts/setup-shadcnblocks.sh .
```
