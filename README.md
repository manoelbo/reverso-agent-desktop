# Reverso Agent Desktop

Reverso Agent Desktop is an Electron-based investigation app (OSINT-oriented) with a local-first workflow.
It combines a desktop interface with an agent CLI pipeline that processes source documents, builds dossier data,
and supports lead-driven inquiries.

## What is in this repository

- `src/`: Electron app (`main`, `preload`, `renderer`).
- `lab/agent-cli`: current investigation core and command-line workflow (actively used).
- `lab/agent-gui`: ambitious experimental agent UI/server lab (partially implemented, paused).
- `lab/markdown-mortor`: isolated Markdown rendering sandbox.

## Prerequisites (from zero)

If you are starting on a fresh machine, install these tools first.

### 1) Install Git

- Download from [git-scm.com](https://git-scm.com/downloads)
- Verify:

```bash
git --version
```

### 2) Install Node.js (includes npm)

- Install Node.js LTS from [nodejs.org](https://nodejs.org/)
- Verify:

```bash
node --version
npm --version
```

### 3) Enable Corepack and pnpm

```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm --version
```

### 4) Clone and install dependencies

```bash
git clone https://github.com/manoelbo/reverso-agent-desktop.git
cd reverso-agent-desktop
pnpm install
```

## Environment setup

Create local environment variables from the template:

```bash
cp .env.example .env.local
```

At minimum, set:

```bash
OPENROUTER_API_KEY=your_openrouter_api_key
```

You can also set:

```bash
AGENT_LAB_MODEL=google/gemini-2.5-flash
```

## OpenRouter setup (step by step)

1. Go to [OpenRouter](https://openrouter.ai/).
2. Click **Sign up** (top-right) and create your account (Google/GitHub/email).
3. After login, open **Keys** (direct link: [openrouter.ai/keys](https://openrouter.ai/keys)).
4. Click **Create key** (or **New API Key**) and give it a name like `reverso-local`.
5. Copy the generated key immediately (you may not be able to see it again in full).
6. In your project root, open `.env.local` and set:

```bash
OPENROUTER_API_KEY=sk-or-v1-...
```

7. Save the file.
8. Optional but recommended: on OpenRouter, confirm your account has available credits/quota.

Quick validation command:

```bash
pnpm reverso --help
```

If this command runs without env/key errors, your setup is ready.

## Run the desktop app

### Development mode

```bash
pnpm dev
```

### Development mode with Chrome DevTools remote debugging

```bash
pnpm dev:cdp
```

### Production builds

```bash
pnpm build:mac
pnpm build:win
pnpm build:linux
```

## Suggested first tests (reproducibility checklist)

### Test A: CLI help and command surface

```bash
pnpm reverso --help
pnpm reverso process-all --help
```

### Test B: Process documents and build dossier data

Use a clean investigation workspace outside the repo (recommended):

```bash
mkdir -p ~/reverso-smoke/sources
cd ~/reverso-smoke
# copy a few PDF files into ./sources
```

Then run:

```bash
pnpm --dir "/absolute/path/to/reverso-agent-desktop" reverso process-all
pnpm --dir "/absolute/path/to/reverso-agent-desktop" reverso init
pnpm --dir "/absolute/path/to/reverso-agent-desktop" reverso dig
pnpm --dir "/absolute/path/to/reverso-agent-desktop" reverso create-lead --idea "test lead"
pnpm --dir "/absolute/path/to/reverso-agent-desktop" reverso inquiry --lead test-lead
```

Expected outputs in your workspace:

- `sources/.artifacts/`
- `dossier/people`, `dossier/groups`, `dossier/places`, `dossier/timeline`
- `investigation/leads`, `investigation/allegations`, `investigation/findings`
- `reports/`

### Test C: Desktop app smoke

With `pnpm dev` running:

1. Open the app.
2. Confirm the window loads without boot/runtime errors.
3. Trigger a basic investigation command flow from the app integration.
4. Confirm generated markdown/artifacts are persisted in the workspace filesystem.

## Lab guide

### `lab/agent-cli` (current core)

This is the current and recommended investigation engine.
It was intentionally built to make CLI-driven testing and reproducible workflows easy.

Run only the CLI (from project root):

```bash
pnpm reverso --help
pnpm reverso init
pnpm reverso process-all
```

Run it directly from its package folder:

```bash
cd lab/agent-cli
pnpm dev --help
pnpm typecheck
pnpm build
```

### `lab/agent-gui` (experimental future direction)

This module is the more ambitious agent interface project (copilot-like interaction + richer system controls).
It was started as the future UI direction, but development was paused mid-way.
You can still test it as an experimental lab.

Useful commands:

```bash
pnpm --dir lab/agent-gui run typecheck
pnpm --dir lab/agent-gui run test
pnpm --dir lab/agent-gui run serve:test
pnpm --dir lab/agent-gui run reset:all
```

Notes:

- Treat this as experimental.
- Prefer `agent-cli` for stable/reproducible investigation runs.

### `lab/markdown-mortor`

A sandbox for Markdown rendering experiments before porting changes to the main renderer.

```bash
pnpm lab:markdown-mortor:dev
```

## Additional quality checks

```bash
pnpm typecheck
pnpm test
```

## License

This project is open source and distributed under the MIT License.
