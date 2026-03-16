#!/usr/bin/env bash
set -euo pipefail

# Resolve SHADCNBLOCKS API key from env or 1Password reference.

if [[ -n "${SHADCNBLOCKS_API_KEY:-}" ]]; then
  printf "%s" "$SHADCNBLOCKS_API_KEY"
  exit 0
fi

if [[ -n "${OP_SHADCNBLOCKS_REF:-}" ]]; then
  if ! command -v op >/dev/null 2>&1; then
    echo "Erro: OP_SHADCNBLOCKS_REF definido, mas o comando 'op' nao esta disponivel." >&2
    exit 1
  fi

  op read "$OP_SHADCNBLOCKS_REF"
  exit 0
fi

echo "Erro: defina SHADCNBLOCKS_API_KEY ou OP_SHADCNBLOCKS_REF." >&2
exit 1
