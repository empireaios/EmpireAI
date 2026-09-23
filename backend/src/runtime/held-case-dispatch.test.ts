import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { dispatchHeldCase, heldMessagesSha256, type HeldDispatchPolicy, type HeldDispatchRequest, type HeldDispatchDependencies } from './held-case-dispatch.js';
import { HeldCaseBudgetLedger } from './held-case-budget-ledger.js';

function fixture(t: { after(fn: () => void): void }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'held-dispatch-'));
  const filename = path.join(dir, 'ledger.sqlite'), ledger = new HeldCaseBudgetLedger(filename);
  t.after(() => { try { ledger.close(); } catch {} assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir()) + path.sep)); fs.rmSync(dir, { recursive: true, force: true }); });
  const request: HeldDispatchRequest = { campaignId: 'offline', caseId: 'synthetic-one', step: 0, workspaceId: 'offline-ws', serviceId: 'test-service', sourceCommit: 'a'.repeat(40), caseSetSha256: 'b'.repeat(64), provider: 'synthetic', model: 'fake-model', messages: [{ role: 'user', content: 'unfamiliar synthetic prompt' }], maxOutputTokens: 20 };
  const policy: HeldDispatchPolicy = { campaignId: request.campaignId, approvalReference: 'synthetic-test-not-owner-approval', workspaceId: request.workspaceId, serviceId: request.serviceId, sourceCommit: request.sourceCommit, caseSetSha256: request.caseSetSha256, provider: request.provider, model: request.model,
    capMicroUsd: 100, expiresAt: new Date(Date.now() + 60000).toISOString(), timeoutMs: 1000, maxInputBytes: 4096, maxOutputBytes: 4096, maxOutputTokens: 20,
    pricing: { provenanceSha256: 'c'.repeat(64), validUntil: new Date(Date.now() + 120000).toISOString(), inputMicroUsdPerMillion: 1000000, outputMicroUsdPerMillion: 1000000, otherChargeUpperMicroUsd: 0 },
    steps: [{ caseId: request.caseId, step: 0, messagesSha256: heldMessagesSha256(request.messages), inputTokenUpperBound: 40 }] };
  let calls = 0;
  const dependencies: HeldDispatchDependencies = { ledger, verifyApprovedPolicy: async () => policy, actualScope: () => ({ workspaceId: request.workspaceId, serviceId: request.serviceId, sourceCommit: request.sourceCommit, caseSetSha256: request.caseSetSha256 }),
    adapter: { provider: request.provider, model: request.model, automaticRetries: 0, supportsAbort: true, dispatch: async () => { calls++; return { provider: request.provider, model: request.model, content: 'offline answer' }; } } };
  return { request, policy, dependencies, ledger, filename, calls: () => calls };
}
test('unconfigured or denied trusted verifier cannot dispatch; client permission fields are forbidden', async t => {
  const f = fixture(t);
  await assert.rejects(dispatchHeldCase(f.request, { ledger: f.ledger }), /UNCONFIGURED/);
  await assert.rejects(dispatchHeldCase(f.request, { ...f.dependencies, verifyApprovedPolicy: async () => null }), /UNAVAILABLE/);
  await assert.rejects(dispatchHeldCase({ ...f.request, approved: true } as HeldDispatchRequest, f.dependencies), /UNEXPECTED/);
  assert.equal(f.calls(), 0);
});
test('success retains full reservation; duplicate request and reopen never redispatch', async t => {
  const f = fixture(t); const result = await dispatchHeldCase(f.request, f.dependencies);
  assert.equal(result.status, 'COMPLETED_UNRECONCILED'); assert.equal(result.providerEnforcementProven, false);
  assert.equal(f.ledger.snapshot(result.identity).chargedOrReservedMicroUsd, '60');
  assert.equal(f.ledger.snapshot(result.identity).attempts[0]!.state, 'RESERVED');
  await assert.rejects(dispatchHeldCase(f.request, f.dependencies), /MUST_NOT_REDISPATCH/);
  f.ledger.close(); const reopened = new HeldCaseBudgetLedger(f.filename);
  try { await assert.rejects(dispatchHeldCase(f.request, { ...f.dependencies, ledger: reopened }), /MUST_NOT_REDISPATCH/); assert.equal(reopened.snapshot(result.identity).chargedOrReservedMicroUsd, '60'); }
  finally { reopened.close(); }
  assert.equal(f.calls(), 1);
});
test('timeout aborts one attempt and preserves uncertain full hold without retry', async t => {
  const f = fixture(t); f.policy.timeoutMs = 10; let calls = 0, aborted = false;
  f.dependencies.adapter!.dispatch = async request => new Promise((_resolve, reject) => { calls++; request.signal.addEventListener('abort', () => { aborted = true; reject(request.signal.reason); }); });
  await assert.rejects(dispatchHeldCase(f.request, f.dependencies), /UNCERTAIN_RESERVATION_RETAINED/);
  await assert.rejects(dispatchHeldCase(f.request, f.dependencies), /MUST_NOT_REDISPATCH/);
  assert.equal(calls, 1); assert.equal(aborted, true);
  const readback = new DatabaseSync(f.filename, { readOnly: true });
  try {
    const row = readback.prepare('SELECT charge_micro_usd,state,uncertainty FROM attempts').get();
    assert.equal(row!.charge_micro_usd, 60); assert.equal(row!.state, 'UNCERTAIN'); assert.equal(row!.uncertainty, 'TIMEOUT');
  } finally { readback.close(); }
});
test('provider/model mismatch, tools, fallback and prompt mutation are rejected before dispatch', async t => {
  const f = fixture(t);
  await assert.rejects(dispatchHeldCase({ ...f.request, model: 'other' }, f.dependencies), /BINDING/);
  await assert.rejects(dispatchHeldCase({ ...f.request, tools: [] } as HeldDispatchRequest, f.dependencies), /UNEXPECTED/);
  await assert.rejects(dispatchHeldCase({ ...f.request, fallback: true } as HeldDispatchRequest, f.dependencies), /UNEXPECTED/);
  await assert.rejects(dispatchHeldCase({ ...f.request, messages: [{ role: 'user', content: 'changed' }] }, f.dependencies), /UNAPPROVED_PROMPT/);
  f.dependencies.adapter!.model = 'wrong'; await assert.rejects(dispatchHeldCase(f.request, f.dependencies), /SINGLE_ATTEMPT/);
  assert.equal(f.calls(), 0);
});
test('missing/expired pricing or unknown other costs cannot reserve or dispatch', async t => {
  const f = fixture(t);
  f.policy.pricing.otherChargeUpperMicroUsd = Number.NaN;
  await assert.rejects(dispatchHeldCase(f.request, f.dependencies));
  f.policy.pricing.otherChargeUpperMicroUsd = 0; f.policy.pricing.validUntil = new Date(0).toISOString();
  await assert.rejects(dispatchHeldCase(f.request, f.dependencies), /PRICING/);
  f.policy.pricing.validUntil = new Date(Date.now() + 120000).toISOString(); f.policy.pricing.inputMicroUsdPerMillion = 0;
  await assert.rejects(dispatchHeldCase(f.request, f.dependencies), /INVALID_BOUNDED/);
  assert.equal(f.calls(), 0);
});
test('independent ledger connections racing distinct steps cannot overspend campaign cap', async t => {
  const f = fixture(t); const second = new HeldCaseBudgetLedger(f.filename);
  f.policy.steps.push({ ...f.policy.steps[0]!, caseId: 'synthetic-two' });
  try {
    const results = await Promise.allSettled([dispatchHeldCase(f.request, f.dependencies), dispatchHeldCase({ ...f.request, caseId: 'synthetic-two' }, { ...f.dependencies, ledger: second })]);
    assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
    assert.equal(results.filter(r => r.status === 'rejected').length, 1); assert.equal(f.calls(), 1);
  } finally { second.close(); }
});
test('provider response violation retains hold and a policy revision cannot reset prior spend', async t => {
  const f = fixture(t); f.dependencies.adapter!.dispatch = async () => ({ provider: 'wrong', model: f.request.model, content: 'offline' });
  await assert.rejects(dispatchHeldCase(f.request, f.dependencies), /UNCERTAIN/);
  f.policy.pricing.outputMicroUsdPerMillion = 999999;
  await assert.rejects(dispatchHeldCase(f.request, f.dependencies), /CAMPAIGN_IMMUTABLE/);
});
test('actual scope, output bound, expiry and pre-aborted calls fail before dispatch', async t => {
  const f = fixture(t);
  await assert.rejects(dispatchHeldCase(f.request, { ...f.dependencies, actualScope: () => ({ workspaceId: 'wrong', serviceId: f.request.serviceId, sourceCommit: f.request.sourceCommit, caseSetSha256: f.request.caseSetSha256 }) }), /SCOPE/);
  await assert.rejects(dispatchHeldCase({ ...f.request, maxOutputTokens: 21 }, f.dependencies), /BOUND/);
  const controller = new AbortController(); controller.abort(); await assert.rejects(dispatchHeldCase(f.request, f.dependencies, controller.signal));
  f.policy.expiresAt = new Date(0).toISOString(); await assert.rejects(dispatchHeldCase(f.request, f.dependencies), /EXPIRED/);
  assert.equal(f.calls(), 0);
});
test('retained verifier references and mutable originals cannot change the approved dispatch snapshot', async t => {
  const f = fixture(t); let retained: Readonly<HeldDispatchRequest> | undefined;
  const originalPrompt = f.request.messages[0]!.content;
  f.dependencies.verifyApprovedPolicy = async request => {
    retained = request;
    f.request.messages[0]!.content = 'mutated caller original';
    return f.policy;
  };
  f.dependencies.adapter!.dispatch = async request => {
    assert.ok(Object.isFrozen(retained)); assert.ok(Object.isFrozen(retained!.messages)); assert.ok(Object.isFrozen(retained!.messages[0]));
    assert.throws(() => { retained!.messages[0]!.content = 'late verifier mutation'; }, TypeError);
    assert.throws(() => { retained!.messages.push({ role: 'user', content: 'late injected prompt' }); }, TypeError);
    f.policy.maxOutputTokens = 1000;
    f.policy.pricing.inputMicroUsdPerMillion = 1;
    assert.equal(request.messages[0]!.content, originalPrompt); assert.equal(request.maxTokens, 20);
    return { provider: f.request.provider, model: f.request.model, content: 'offline answer' };
  };
  const result = await dispatchHeldCase(f.request, f.dependencies);
  assert.equal(result.reservedMicroUsd, 60);
  assert.equal(f.ledger.snapshot(result.identity).chargedOrReservedMicroUsd, '60');
});
