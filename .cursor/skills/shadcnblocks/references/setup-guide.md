# Setup do shadcnblocks

Este guia configura o registry `@shadcnblocks` para uso com `shadcn`.

## Pré-requisitos

- Projeto com `components.json` já existente.
- `shadcn` CLI disponível (`npx shadcn@latest`).
- API key válida em:
  - `SHADCNBLOCKS_API_KEY` (recomendado), ou
  - `OP_SHADCNBLOCKS_REF` (opcional, para 1Password CLI).

## 1) Definir variável no ambiente local

Adicione no arquivo de ambiente local do projeto:

```bash
SHADCNBLOCKS_API_KEY=seu_token_aqui
```

Opcional:

```bash
OP_SHADCNBLOCKS_REF=op://SeuVault/SeuItem/credential
```

## 2) Garantir registry no components.json

O bloco esperado é:

```json
{
  "registries": {
    "@shadcnblocks": {
      "url": "https://shadcnblocks.com/r/{name}",
      "headers": {
        "Authorization": "Bearer ${SHADCNBLOCKS_API_KEY}"
      }
    }
  }
}
```

## 3) Testar acesso ao catálogo

```bash
npx shadcn@latest search @shadcnblocks -q "dashboard"
```

Se retornar itens, o setup está funcional.

## 4) Instalar um bloco de teste

```bash
npx shadcn@latest add @shadcnblocks/dashboard-01
```

## Diagnóstico rápido

- Erro 401/403: API key inválida ou ausente no ambiente.
- Registry não encontrado: falta a entrada `@shadcnblocks` no `components.json`.
- Item não encontrado: nome do item incorreto ou indisponível.
