#!/usr/bin/env node
// Wrapper para satisfazer validação do npm: bin deve apontar para um arquivo em bin/
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const entry = path.join(__dirname, '..', 'dist', 'index.js')
await import(pathToFileURL(entry).href)
