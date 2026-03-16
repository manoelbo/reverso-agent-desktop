#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const requiredCommands = [
  'setup',
  'process',
  'process-all',
  'process-selected',
  'process-queue',
  'queue-status',
  'queue-clear',
  'watch',
  'select',
  'rerun',
  'init',
  'agent-setup',
  'dig',
  'create-lead',
  'inquiry',
  'inquiry-all',
  'doc-process'
]

function run(command, args, options = {}) {
  execFileSync(command, args, { stdio: 'inherit', ...options })
}

function output(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    ...options
  })
}

function checkReadmeAndHelp() {
  const helpOutput = output('node', ['./dist/index.js', '--help'])
  const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8')

  const missingInHelp = requiredCommands.filter((commandName) => {
    return !new RegExp(`\\b${commandName}\\b`).test(helpOutput)
  })

  const missingInReadme = requiredCommands.filter((commandName) => {
    return !readme.includes(`reverso ${commandName}`)
  })

  if (!readme.includes('## Comandos')) {
    throw new Error('README sem secao "## Comandos".')
  }

  if (missingInHelp.length > 0) {
    throw new Error(
      `Comandos ausentes em --help: ${missingInHelp.join(', ')}. Atualize os comandos antes do release.`
    )
  }

  if (missingInReadme.length > 0) {
    throw new Error(
      `Comandos ausentes no README: ${missingInReadme.join(', ')}. Atualize a documentacao antes do release.`
    )
  }
}

function requireToken() {
  if (!process.env.NPM_TOKEN) {
    throw new Error(
      'NPM_TOKEN nao definido. Exporte um token granular com permissao de publish e bypass de 2FA.'
    )
  }
}

function release() {
  requireToken()
  run('pnpm', ['typecheck'])
  run('pnpm', ['build'])
  checkReadmeAndHelp()
  run('npm', ['version', 'patch', '--no-git-tag-version'])
  try {
    run('npm', ['publish', '--access', 'public'], {
      env: { ...process.env, NODE_AUTH_TOKEN: process.env.NPM_TOKEN }
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('EOTP') || message.includes('Authenticate your account at:')) {
      throw new Error(
        [
          'Publish bloqueado por autenticacao interativa do npm (EOTP/web auth).',
          'Use o link de autenticacao exibido pelo npm para concluir esta publicacao,',
          'ou gere um token granular com bypass 2FA realmente habilitado para publish.',
          'Depois rode novamente: npm i -g @reverso-agent/cli@latest'
        ].join('\n')
      )
    }
    throw error
  }
  run('npm', ['i', '-g', '@reverso-agent/cli@latest'])
  run('reverso', ['--version'])
  run('reverso', ['--help'])
}

try {
  if (process.argv.includes('--check')) {
    checkReadmeAndHelp()
    process.stdout.write('README e --help estao sincronizados.\n')
  } else {
    release()
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`${message}\n`)
  process.exitCode = 1
}
