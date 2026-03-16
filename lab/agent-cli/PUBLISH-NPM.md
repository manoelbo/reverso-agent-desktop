# Publicar `@reverso-agent/cli` no npm

Passo a passo para publicar este pacote no registry npm, com base na [documentação oficial npm](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages) e no Context7.

## Pré-requisitos

1. **Conta npm** — [Criar em npmjs.com/signup](https://www.npmjs.com/signup) se ainda não tiver.
2. **Escopo `@reverso-agent`** — Pacote é *scoped* (`@reverso-agent/cli`). Você precisa:
   - ser **dono** da organização `@reverso-agent` no npm, ou
   - ter sido adicionado como membro com permissão de publicar.
3. **Autenticação para publicar** — O npm exige **uma** das opções:
   - **2FA (two-factor authentication)** ativada na conta — ao publicar, o npm pede um código de uso único (OTP); ou
   - **Token granular** com "Bypass 2FA for publish" (útil para CI/CD).

Se aparecer erro **EOTP** ao publicar, é porque a conta tem 2FA e o npm está pedindo o código OTP.

---

## Fluxo oficial (sem navegador)

O fluxo recomendado deste projeto usa token no ambiente e um comando unico:

```bash
cd lab/agent-cli
export NPM_TOKEN=npm_xxxxxxxxx
pnpm run release:publish-global
```

O script `release:publish-global` executa, nesta ordem:

1. `pnpm typecheck`
2. `pnpm build`
3. validacao de sincronia `README` vs `--help` (`check:readme-help`)
4. `npm version patch --no-git-tag-version`
5. `npm publish --access public` (via `NODE_AUTH_TOKEN=$NPM_TOKEN`)
6. `npm i -g @reverso-agent/cli@latest`
7. validacao local com `reverso --version` e `reverso --help`

## Passo a passo (manual)

### 1. Login no npm (opcional)

```bash
npm login
```

Informe usuário, senha e e-mail. Se já estiver logado, confira com:

```bash
npm whoami
```

### 2. Ir para o diretório do pacote

A partir da raiz do repositório:

```bash
cd lab/agent-cli
```

### 3. Revisar conteúdo e versão

- Confira se não há dados sensíveis (chaves, senhas) no código ou em `.env*`.
- O campo `files` no `package.json` define o que entra no tarball: `bin`, `dist`, `README.md`. O restante fica de fora.
- Veja a versão publicada atual (se o pacote já existir):

  ```bash
  npm view @reverso-agent/cli version
  ```

- A versão no `package.json` deve ser **maior** que a publicada (ex.: se no registry está `0.2.0`, use `0.2.1` ou `0.2.4`).

### 4. Typecheck e build

```bash
pnpm typecheck
pnpm build
```

Se estiver **fora do monorepo** (só a pasta `lab/agent-cli`), instale dependências antes: `pnpm install`. O script `typecheck` usa o TypeScript do monorepo (`../../node_modules/typescript`); dentro do monorepo isso já funciona.

### 5. Testar o pacote localmente (recomendado)

```bash
npm pack
npm install -g ./reverso-agent-cli-*.tgz
reverso --version
reverso --help
```

Teste em outra pasta se quiser: `mkdir /tmp/test-reverso && cd /tmp/test-reverso && reverso --help`.

### 6. Atualizar a versão (se necessário)

```bash
npm version patch   # 0.2.4 → 0.2.5
# ou
npm version minor   # 0.2.4 → 0.3.0
# ou
npm version major   # 0.2.4 → 1.0.0
```

Isso altera o `package.json` e pode criar uma tag no Git (dependendo da config do npm).

### 7. Publicar (scoped = publico)

Pacotes *scoped* sao privados por padrao. Para publicar como **publico** use `--access public`. O `package.json` ja tem `"publishConfig": { "access": "public" }`, mas o npm ainda recomenda passar no comando na primeira publicacao:

```bash
npm publish --access public
```

**Se sua conta tiver 2FA ativada**, o npm vai pedir o **one-time password (OTP)** quando nao houver token com bypass:

- Abra o app autenticador (Google Authenticator, Authy, etc.) e use o código de 6 dígitos.
- Quando o npm pedir **Enter one-time password:**, digite o código e Enter.

Alternativa: passar o OTP no comando (código válido por poucos segundos):

```bash
npm publish --access public --otp=123456
```

Substitua `123456` pelo código atual do seu app.

### 8. Conferir

- Página do pacote: [https://www.npmjs.com/package/@reverso-agent/cli](https://www.npmjs.com/package/@reverso-agent/cli)
- Instalação: `npm install -g @reverso-agent/cli`

---

## Erros comuns

| Erro | Causa | Solução |
|------|--------|---------|
| **EOTP** / "This operation requires a one-time password" | 2FA ativada na conta | Informe o código OTP quando o npm pedir, ou use `--otp=CODIGO`. |
| **E403** / "You do not have permission to publish" | Escopo `@reverso-agent` não é seu ou você não é membro | Crie a org `@reverso-agent` no npm ou peça a um admin que te adicione com permissão de publicar. |
| **E401** / "Unauthorized" | Não está logado ou token inválido | Rode `npm login` e tente de novo. |
| **E402** / "Cannot publish over existing version" | A versão no `package.json` já existe no registry | Use `npm version patch` (ou minor/major) e publique de novo. |
| **Falha no `prepublishOnly` (typecheck)** | Script usa `../../node_modules/typescript` e você não está no monorepo | Rode a publicação a partir do repositório completo (com `node_modules` na raiz) ou instale dependências em `lab/agent-cli` e ajuste o script para usar `pnpm exec tsc` ou `npx tsc`. |

---

## Publicacao sem prompt (CI / token com bypass 2FA)

Para publicar em CI sem interação (sem digitar OTP):

1. No npm: **Account → Access Tokens → Generate New Token**.
2. Escolha **Granular Access Token**.
3. Permissões: **Packages → Read and write**; em **Packages and scopes** associe ao escopo `@reverso-agent` (ou ao pacote `@reverso-agent/cli`).
4. Marque **Bypass 2FA for publish** (ou equivalente).
5. Gere o token e guarde em segredo (ex.: secret no GitHub Actions).
6. No CI, prefira usar variavel de ambiente:
   - `NODE_AUTH_TOKEN=$NPM_TOKEN npm publish --access public`
   - ou configurar em runtime: `npm config set //registry.npmjs.org/:_authToken $NPM_TOKEN`

Assim o publish não pede OTP.

---

## Resumo rapido

```bash
cd lab/agent-cli
export NPM_TOKEN=npm_xxxxxxxxx
pnpm run release:publish-global
```

Documentação de referência: [Creating and publishing scoped public packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages), [npm publish](https://docs.npmjs.com/cli/v11/commands/npm-publish), [About two-factor authentication](https://docs.npmjs.com/about-two-factor-authentication).
