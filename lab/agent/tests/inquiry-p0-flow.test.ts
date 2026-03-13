import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildNoProgressRecommendation,
  deriveNeedsRepairReasons,
  resolveCriticalWriteGateDecision
} from '../src/runner/run-inquiry.js'

test('P0: write gate bloqueia persistencia sem aprovacao explicita', () => {
  const blocked = resolveCriticalWriteGateDecision({
    gateEnabled: true,
    requireExplicitWriteApproval: true,
    hasPersistActionPlanned: false,
    orchestrationStopReason: 'insufficient_evidence'
  })
  assert.equal(blocked.approved, false)
  assert.equal(blocked.mode, 'blocked')
  assert.match(blocked.reason, /missing_explicit_persist_approval/)
})

test('P0: contrato invalido gera estado needs_repair observavel', () => {
  const reasons = deriveNeedsRepairReasons({
    droppedFindings: 2,
    rawFindings: 3,
    parsedFindings: 1
  })
  assert.equal(reasons[0], 'contract_validation_failed')
  assert.ok(reasons.includes('dropped_findings:2'))
})

test('P0: no_progress gera recomendacao operacional explicita', () => {
  const recommendation = buildNoProgressRecommendation()
  assert.match(recommendation.toLowerCase(), /no-progress/)
  assert.match(recommendation.toLowerCase(), /deep-dive complementar/)
})
