import path from 'node:path'
import { readFile } from 'node:fs/promises'
import { writeJsonAtomic } from './fs-io.js'

export type LeadRuntimeStatus = 'planned' | 'in_progress' | 'done' | 'blocked'

type LeadCheckpointEntry = {
  slug: string
  status: LeadRuntimeStatus
  updatedAt: string
  lastError?: string
}

type LeadCheckpoint = {
  version: 1
  updatedAt: string
  leads: LeadCheckpointEntry[]
}

const LEAD_CHECKPOINT_FILE = 'lead-checkpoint.json'

function getCheckpointPath(leadsDir: string): string {
  return path.join(leadsDir, LEAD_CHECKPOINT_FILE)
}

function normalizeCheckpoint(input: unknown): LeadCheckpoint {
  if (!input || typeof input !== 'object') {
    return { version: 1, updatedAt: new Date().toISOString(), leads: [] }
  }
  const rawLeads = Array.isArray((input as { leads?: unknown }).leads)
    ? ((input as { leads: unknown[] }).leads)
    : []
  const leads: LeadCheckpointEntry[] = rawLeads
    .map((item) => {
      if (!item || typeof item !== 'object') return undefined
      const slug = typeof (item as { slug?: unknown }).slug === 'string'
        ? (item as { slug: string }).slug.trim()
        : ''
      const statusRaw = typeof (item as { status?: unknown }).status === 'string'
        ? (item as { status: string }).status.trim()
        : ''
      const status: LeadRuntimeStatus | undefined =
        statusRaw === 'planned' || statusRaw === 'in_progress' || statusRaw === 'done' || statusRaw === 'blocked'
          ? statusRaw
          : undefined
      if (!slug || !status) return undefined
      const updatedAt = typeof (item as { updatedAt?: unknown }).updatedAt === 'string'
        ? (item as { updatedAt: string }).updatedAt
        : new Date().toISOString()
      const lastError = typeof (item as { lastError?: unknown }).lastError === 'string'
        ? (item as { lastError: string }).lastError
        : undefined
      return { slug, status, updatedAt, ...(lastError ? { lastError } : {}) }
    })
    .filter((item): item is LeadCheckpointEntry => Boolean(item))
  return {
    version: 1,
    updatedAt: typeof (input as { updatedAt?: unknown }).updatedAt === 'string'
      ? (input as { updatedAt: string }).updatedAt
      : new Date().toISOString(),
    leads
  }
}

export async function readLeadCheckpoint(leadsDir: string): Promise<LeadCheckpoint> {
  const checkpointPath = getCheckpointPath(leadsDir)
  try {
    const raw = await readFile(checkpointPath, 'utf8')
    return normalizeCheckpoint(JSON.parse(raw))
  } catch {
    return { version: 1, updatedAt: new Date().toISOString(), leads: [] }
  }
}

export async function upsertLeadCheckpointStatus(input: {
  leadsDir: string
  slug: string
  status: LeadRuntimeStatus
  lastError?: string
}): Promise<void> {
  const checkpoint = await readLeadCheckpoint(input.leadsDir)
  const now = new Date().toISOString()
  const next = checkpoint.leads.filter((item) => item.slug !== input.slug)
  next.push({
    slug: input.slug,
    status: input.status,
    updatedAt: now,
    ...(input.lastError ? { lastError: input.lastError } : {})
  })
  next.sort((a, b) => a.slug.localeCompare(b.slug))
  await writeJsonAtomic(getCheckpointPath(input.leadsDir), {
    version: 1,
    updatedAt: now,
    leads: next
  })
}

