import test from 'node:test';
import assert from 'node:assert/strict';
import { createScrubber, hashText, makeEvidenceRow, evaluateGate } from './soak-gate.mjs';

const identity = {
  candidateSha: 'a'.repeat(40), runnerSha: 'b'.repeat(40),
  deploymentId: 'deployment-under-test', observedSha: 'a'.repeat(40),
};

function fixture() {
  const required = Array.from({ length: 24 }, (_, i) => ({
    id: `O${String(i + 1).padStart(2, '0')}`, kind: 'ordinary', checkId: `ordinary-${i + 1}/v1`,
  }));
  for (let mission = 1; mission <= 3; mission++) {
    for (let step = 1; step <= 3; step++) {
      required.push({ id: `M${mission}_s${step}`, kind: 'mission', checkId: `mission-${mission}-${step}/v1`, missionId: `M${mission}`, step });
    }
  }
  required.push({ id: '__fill__', kind: 'fill', checkId: 'fill-locks/v1' });
  for (const item of required) item.prompt = `Full synthetic prompt for ${item.id}`;
  const executed = [...required.filter(item => item.kind !== 'fill'), { ...required.at(-1), id: 'FILL_1' }];
  const inputs = executed.map((item, index) => ({
    ...item,
    prompt: item.prompt,
    text: `Full synthetic correct response for ${item.id}`,
    resultKind: 'answer', requestId: `pcr_fixture_${index}`,
    sessionId: item.missionId ? `session-${item.missionId}` : 'ordinary-session',
    latencyMs: 5_000, http: 200, terminalStatus: 'COMPLETED', oraclePassed: true,
    identity: { ...identity },
    retrieval: {
      requestId: `pcr_fixture_${index}`,
      sessionId: item.missionId ? `session-${item.missionId}` : 'ordinary-session',
      deploymentId: identity.deploymentId,
      http: 200, status: 'COMPLETED', text: `Full synthetic correct response for ${item.id}`,
    },
  }));
  const rows = inputs.map(makeEvidenceRow);
  const proof = {
    requestId: rows[0].requestId, sessionId: rows[0].sessionId, deploymentId: rows[0].identity.deploymentId,
    http: 200, status: 'COMPLETED', response: rows[0].response, responseHash: rows[0].responseHash, match: true,
  };
  return {
    required,
    inputs,
    state: {
      durationMin: 120.16, results: rows, identity: { ...identity },
      transportErrors: 0, lostAdmitted: 0, duplicateSubmissions: 0,
      unsafeResponseClaims: 0, contradictoryResponseClaims: 0,
      workerRestart: { ...proof, restartObserved: true }, browserReconnect: { ...proof },
      boundaries: { birthStatus: 'NOT_BORN', modeDefault: 'SYNTHETIC', realCommerceAuthorized: false },
    },
  };
}

function replaceRow(f, index, updates) {
  f.inputs[index] = { ...f.inputs[index], ...updates };
  f.state.results[index] = makeEvidenceRow(f.inputs[index]);
}

test('synthetic complete evidence passes the engineering gate, without granting Birth or commerce', () => {
  const f = fixture();
  const gate = evaluateGate(f.state, f.required);
  assert.equal(gate.pass, true, JSON.stringify(gate.failures));
  assert.equal(gate.metrics.transportCompleted, 34);
  assert.equal(gate.metrics.semanticPassed, 34);
  assert.equal(gate.metrics.durableRate, 1);
  assert.equal(gate.birthAuthorized, undefined);
  assert.equal(gate.waveCredit, undefined);
});

test('transport completion does not imply correctness, even for nonempty durable responses', () => {
  const f = fixture();
  replaceRow(f, 1, { oraclePassed: false });
  assert.equal(f.state.results[1].transportCompleted, true);
  assert.equal(f.state.results[1].durableRetrieved, true);
  assert.equal(f.state.results[1].semanticPassed, false);
  const gate = evaluateGate(f.state, f.required);
  assert.equal(gate.pass, false);
  assert.equal(gate.criteria.allTransportCompleted, true);
  assert.equal(gate.criteria.zeroSemanticFailures, false);
  assert.equal(gate.criteria.allRequiredOrdinaryPass, false);
});

test('legacy 181-admitted/164-completed/17-failed summary cannot self-authorize PASS', () => {
  const f = fixture();
  const legacy = {
    ...f.state, pass: true, admitted: 181, completed: 164, failed: 17,
    durationMin: 120.16, durableRate: 1, p95LatencyMs: 5586,
    results: Array.from({ length: 181 }, (_, i) => ({
      id: `legacy-${i}`, kind: i < 26 ? 'ordinary' : i < 35 ? 'mission' : 'fill',
      ok: i >= 17, admitted: true, useful: true, retrieved: true,
      requestId: `legacy-request-${i}`, textHead: 'Plausible truncated response', latencyMs: 5586,
    })),
  };
  const gate = evaluateGate(legacy, f.required);
  assert.equal(gate.pass, false);
  assert.equal(gate.criteria.completeScrubbedEvidence, false);
  assert.equal(gate.criteria.zeroSemanticFailures, false);
  assert.equal(gate.criteria.noRunError, false);
  assert.equal(gate.criteria.durableRetrieval100Percent, false);
});

test('17 failed substantive checks remain blocking among 146 successful fillers', () => {
  const f = fixture();
  for (let i = 0; i < 17; i++) replaceRow(f, i, { oraclePassed: false });
  for (let i = 2; i <= 146; i++) {
    const input = { ...f.inputs.at(-1), id: `FILL_${i}`, requestId: `fill-request-${i}` };
    input.retrieval = { ...input.retrieval, requestId: input.requestId };
    f.state.results.push(makeEvidenceRow(input));
  }
  const gate = evaluateGate(f.state, f.required);
  assert.equal(gate.metrics.semanticFailed, 17);
  assert.equal(gate.criteria.allTransportCompleted, true);
  assert.equal(gate.criteria.zeroSemanticFailures, false);
  assert.equal(gate.pass, false);
});

test('a single filler failure blocks release and cannot be waived as useful transport', () => {
  const f = fixture();
  replaceRow(f, f.inputs.length - 1, { oraclePassed: false });
  const gate = evaluateGate(f.state, f.required);
  assert.equal(gate.criteria.allFillChecksPass, false);
  assert.equal(gate.criteria.zeroSemanticFailures, false);
  assert.equal(gate.pass, false);
});

test('all required mission steps must pass, not merely have an attempted mission counter', () => {
  const f = fixture();
  replaceRow(f, 25, { oraclePassed: false });
  f.state.missionCount = 3;
  const gate = evaluateGate(f.state, f.required);
  assert.equal(gate.criteria.allRequiredMissionStepsPass, false);
  assert.equal(gate.pass, false);
});

test('missing mission step, session reset, or reordering blocks mission certification', () => {
  for (const mutation of [
    f => f.state.results.splice(25, 1),
    f => replaceRow(f, 25, { sessionId: 'reconnected-new-session' }),
    f => ([f.state.results[24], f.state.results[25]] = [f.state.results[25], f.state.results[24]]),
    f => replaceRow(f, 25, { step: 1 }),
    f => replaceRow(f, 25, { sessionScope: 'different-mission' }),
  ]) {
    const f = fixture();
    mutation(f);
    const gate = evaluateGate(f.state, f.required);
    assert.equal(gate.criteria.missionSessionScope, false);
    assert.equal(gate.pass, false);
  }
});

test('duplicate logical case is rejected even with a different requestId', () => {
  const f = fixture();
  const input = { ...f.inputs[1], requestId: 'new-id-same-logical-case' };
  input.retrieval = { ...input.retrieval, requestId: input.requestId };
  f.state.results.push(makeEvidenceRow(input));
  const gate = evaluateGate(f.state, f.required);
  assert.equal(gate.criteria.noDuplicateLogicalCases, false);
  assert.equal(gate.criteria.noDuplicateRequestIds, true);
  assert.equal(gate.pass, false);
});

test('one duplicate requestId is enough to block; no greater-than-three tolerance', () => {
  const f = fixture();
  replaceRow(f, 1, { requestId: f.inputs[2].requestId, retrieval: { ...f.inputs[1].retrieval, requestId: f.inputs[2].requestId } });
  const gate = evaluateGate(f.state, f.required);
  assert.equal(gate.criteria.noDuplicateRequestIds, false);
  assert.equal(gate.pass, false);
});

test('complete response and prompt hashes are recomputed, not trusted flags', () => {
  for (const mutation of [
    f => { f.state.results[1].response += ' tampered'; },
    f => { f.state.results[1].prompt += ' tampered'; },
    f => { delete f.state.results[1].response; f.state.results[1].textHead = 'not full evidence'; },
    f => { f.state.results[1].semanticPassed = false; },
    f => { f.state.results[1].oracle.checkId = 'different-check'; },
  ]) {
    const f = fixture();
    mutation(f);
    const gate = evaluateGate(f.state, f.required);
    assert.equal(gate.criteria.completeScrubbedEvidence, false);
    assert.equal(gate.pass, false);
  }
});

test('inline responses and a retrieved boolean cannot substitute for terminal GET proof', () => {
  for (const mutation of [
    { retrieved: true, retrieval: undefined },
    { retrieval: { requestId: 'pcr_fixture_1', status: 'RUNNING', text: 'Full synthetic correct response for O02' } },
    { retrieval: { requestId: 'wrong-request', status: 'COMPLETED', text: 'Full synthetic correct response for O02' } },
    { retrieval: { requestId: 'pcr_fixture_1', status: 'COMPLETED', text: 'A changed answer' } },
    { retrieval: { requestId: 'pcr_fixture_1', http: 500, status: 'COMPLETED', text: 'Full synthetic correct response for O02' } },
  ]) {
    const f = fixture();
    replaceRow(f, 1, mutation);
    const gate = evaluateGate(f.state, f.required);
    assert.equal(gate.criteria.durableRetrieval100Percent, false);
    assert.equal(gate.pass, false);
  }
});

test('retrieval hash tampering is rejected', () => {
  const f = fixture();
  f.state.results[1].retrieval.response += ' corruption';
  const gate = evaluateGate(f.state, f.required);
  assert.equal(gate.criteria.completeScrubbedEvidence, false);
  assert.equal(gate.criteria.durableRetrieval100Percent, false);
});

test('durability binds observed GET request, session and deployment without synthesizing missing IDs', () => {
  for (const name of ['requestId', 'sessionId', 'deploymentId']) {
    for (const value of [undefined, null, '', `different-${name}`]) {
      const f = fixture();
      replaceRow(f, 1, { retrieval: { ...f.inputs[1].retrieval, [name]: value } });
      assert.equal(f.state.results[1].durableRetrieved, false, `${name}=${String(value)}`);
      assert.equal(f.state.results[1].retrieval[name], value ?? null);
      const gate = evaluateGate(f.state, f.required);
      assert.equal(gate.criteria.durableRetrieval100Percent, false);
      assert.equal(gate.pass, false);
    }
  }
});

test('restart and browser proof must bind the same stored request and exact hash', () => {
  for (const name of ['workerRestart', 'browserReconnect']) {
    for (const mutation of [
      proof => { proof.status = 'RUNNING'; },
      proof => { proof.responseHash = 'c'.repeat(64); },
      proof => { proof.requestId = 'unknown-request'; },
      proof => { proof.match = false; },
      proof => { delete proof.response; },
      proof => { proof.response += ' corruption'; },
      proof => { proof.http = 500; },
      proof => { delete proof.http; },
      proof => { delete proof.sessionId; },
      proof => { delete proof.deploymentId; },
      proof => { proof.sessionId = 'different-session'; },
      proof => { proof.deploymentId = 'different-deployment'; },
    ]) {
      const f = fixture();
      mutation(f.state[name]);
      const gate = evaluateGate(f.state, f.required);
      assert.equal(gate.criteria[name === 'workerRestart' ? 'restartRetrievalVerified' : 'browserReconnectRetrievalVerified'], false);
      assert.equal(gate.pass, false);
    }
  }
  const f = fixture();
  f.state.workerRestart.restartObserved = false;
  assert.equal(evaluateGate(f.state, f.required).criteria.restartRetrievalVerified, false);
});

test('candidate, runner and observed deployment identities are required and consistent', () => {
  for (const mutation of [
    f => { f.state.identity = undefined; },
    f => { f.state.identity.candidateSha = 'a'.repeat(8); },
    f => { f.state.results[1].identity.deploymentId = 'different-deployment'; },
    f => { f.state.results[1].identity.observedSha = 'c'.repeat(40); },
    f => { f.state.results[1].identity.runnerSha = null; },
    f => { f.state.identity.deploymentId = 'UNKNOWN'; },
    f => { f.state.identity.deploymentId = 'UNVERIFIED'; },
    f => { f.state.identity.candidateSha = '0'.repeat(40); f.state.identity.observedSha = '0'.repeat(40); },
  ]) {
    const f = fixture();
    mutation(f);
    const gate = evaluateGate(f.state, f.required);
    assert.equal(gate.criteria.exactCandidateDeploymentTuple, false);
    assert.equal(gate.pass, false);
  }
});

test('latencies are calculated from every result, not a claimed percentile', () => {
  const f = fixture();
  f.state.p95LatencyMs = 1;
  replaceRow(f, 1, { latencyMs: 90_001 });
  let gate = evaluateGate(f.state, f.required);
  assert.equal(gate.criteria.everyLatencyAtMost90s, false);
  assert.equal(gate.pass, false);
  replaceRow(f, 1, { latencyMs: null });
  gate = evaluateGate(f.state, f.required);
  assert.equal(gate.criteria.allLatencyEvidencePresent, false);
  assert.equal(gate.pass, false);
});

test('duration and mandatory zero counters cannot be omitted or coerced', () => {
  for (const name of ['transportErrors', 'lostAdmitted', 'duplicateSubmissions', 'unsafeResponseClaims', 'contradictoryResponseClaims']) {
    for (const value of [undefined, 1, '0']) {
      const f = fixture();
      f.state[name] = value;
      assert.equal(evaluateGate(f.state, f.required).pass, false, `${name}=${String(value)}`);
    }
  }
  const f = fixture();
  f.state.durationMin = 119.999;
  assert.equal(evaluateGate(f.state, f.required).criteria.durationAtLeast120m, false);
});

test('Birth, synthetic mode and commerce locks must remain unchanged', () => {
  for (const boundaries of [undefined, { birthStatus: 'BORN', modeDefault: 'SYNTHETIC', realCommerceAuthorized: false },
    { birthStatus: 'NOT_BORN', modeDefault: 'LIVE', realCommerceAuthorized: false },
    { birthStatus: 'NOT_BORN', modeDefault: 'SYNTHETIC', realCommerceAuthorized: true }]) {
    const f = fixture();
    f.state.boundaries = boundaries;
    assert.equal(evaluateGate(f.state, f.required).criteria.reportedSafetyBoundariesUnchanged, false);
  }
});

test('gate measures response claims, and does not assert knowledge of external commerce effects', () => {
  const f = fixture();
  f.state.unauthorizedEffects = 0;
  f.state.duplicateEffects = 0;
  const gate = evaluateGate(f.state, f.required);
  assert.equal(gate.criteria.zeroUnauthorizedEffects, undefined);
  assert.equal(gate.criteria.zeroDuplicateEffects, undefined);
  assert.equal(gate.criteria.safetyBoundariesUnchanged, undefined);
  assert.equal(gate.criteria.zeroUnsafeResponseClaims, true);
  assert.equal(gate.criteria.zeroContradictoryResponseClaims, true);
  assert.equal(gate.criteria.reportedSafetyBoundariesUnchanged, true);
  f.state.unsafeResponseClaims = 1;
  assert.equal(evaluateGate(f.state, f.required).pass, false);
  delete f.state.unsafeResponseClaims;
  assert.equal(evaluateGate(f.state, f.required).pass, false);
});

test('manifest omissions, arbitrary filler oracle, and unknown rerun IDs fail closed', () => {
  for (const mutate of [
    f => { f.required = []; },
    f => { f.required.splice(25, 1); },
    f => { f.required.push({ ...f.required[0] }); },
    f => replaceRow(f, 33, { checkId: 'unapproved-filler' }),
    f => replaceRow(f, 25, { id: 'M1_late_s2' }),
    f => replaceRow(f, 1, { prompt: 'Wrong easier prompt with same expected check ID' }),
    f => replaceRow(f, 33, { prompt: 'Wrong filler prompt' }),
    f => { delete f.required[1].prompt; },
  ]) {
    const f = fixture();
    mutate(f);
    assert.equal(evaluateGate(f.state, f.required).pass, false);
  }
});

test('pending/error terminal results cannot be semantic passes', () => {
  for (const update of [{ terminalStatus: 'RUNNING' }, { http: 500 }, { resultKind: 'durable_pending' }, { resultKind: null }]) {
    const f = fixture();
    replaceRow(f, 1, update);
    assert.equal(f.state.results[1].transportCompleted, false);
    assert.equal(f.state.results[1].semanticPassed, false);
    assert.equal(evaluateGate(f.state, f.required).pass, false);
  }
});

test('scrubber removes configured secrets, credentials, tokens and emails before hashing full evidence', () => {
  const scrubber = createScrubber(['top secret with spaces', 'specific-cookie-secret']);
  const original = 'owner@example.com password="top secret with spaces" Authorization: Bearer TOKEN123\n'
    + 'Cookie: empireai_session=specific-cookie-secret; another=hidden\n'
    + 'api_key=sk-abcdefghijklmnop123456789\n'
    + 'github_pat_abcdefghijklmnopqrstuvwxyz\n'
    + 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoia2luZyJ9.signature';
  const clean = scrubber(original);
  for (const value of ['owner@example.com', 'top secret with spaces', 'specific-cookie-secret', 'TOKEN123',
    'another=hidden', 'sk-abcdefghijklmnop123456789', 'github_pat_abcdefghijklmnopqrstuvwxyz', 'eyJhbGciOiJIUzI1NiJ9']) {
    assert.equal(clean.includes(value), false, value);
  }
  const f = fixture();
  const row = makeEvidenceRow({ ...f.inputs[0], text: original, prompt: original, scrubber,
    retrieval: { ...f.inputs[0].retrieval, text: original } });
  assert.equal(row.response, clean);
  assert.equal(row.prompt, clean);
  assert.equal(row.responseHash, hashText(clean));
  assert.notEqual(row.responseHash, hashText(original));
  assert.equal(row.retrieval.response, clean);
  assert.equal(row.durableRetrieved, true);
});

test('evidence construction does not echo unknown input fields or raw secrets', () => {
  const f = fixture();
  const row = makeEvidenceRow({ ...f.inputs[0], password: 'must-not-escape', raw: { secret: 'must-not-escape' } });
  assert.equal(JSON.stringify(row).includes('must-not-escape'), false);
});

test('scrubbing preserves synthetic checkpoint tokens while removing token-scheme credentials', () => {
  const scrub = createScrubber();
  assert.equal(scrub('Remember checkpoint token SOAK_CP_M3.'), 'Remember checkpoint token SOAK_CP_M3.');
  assert.equal(scrub('Authorization: token abcdefSecret').includes('abcdefSecret'), false);
  assert.equal(scrub('{"Cookie":"one=secret1; two=secret2"}').includes('secret'), false);
});

test('missing or malformed rows/manifests produce a failed gate without throwing', () => {
  for (const state of [null, {}, { results: [null, {}, 1] }]) {
    for (const manifest of [null, [], [null, {}]]) {
      assert.equal(evaluateGate(state, manifest).pass, false);
    }
  }
  assert.equal(makeEvidenceRow(null).evidenceComplete, false);
});
