/**
 * GATE-001: pure, fail-closed scoring for the frozen Pillow soak.
 *
 * This module does not run requests, load credentials, read files, or certify
 * Birth/Waves/commerce. A passing score is engineering evidence only. The caller
 * must obtain the response, terminal retrieval, deployment identity and oracle
 * verdict from their actual sources; this module checks their consistency.
 */
import { createHash } from 'node:crypto';

export const EVIDENCE_SCHEMA_VERSION = 2;
export const GATE_VERSION = 'GATE-001/v2';
const SHA256 = /^[a-f0-9]{64}$/i;
const SHA1 = /^[a-f0-9]{40}$/i;
const KINDS = new Set(['ordinary', 'mission', 'fill']);
const NON_COMPLETION_KINDS = new Set([
  'durable_pending', 'terminal_infrastructure', 'PILLOW_RESULT_PENDING',
  'pending', 'error', 'failed',
]);
const IDENTITY_FIELDS = ['candidateSha', 'runnerSha', 'deploymentId', 'observedSha'];
const hasText = value => typeof value === 'string' && value.trim().length > 0;
const nonnegative = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const opaque = value => hasText(value) && !/^(unknown|undefined|null|none|pending|unverified|not[_ -]?(?:found|verified)|n\/a)$/i.test(value.trim());
const commitSha = value => typeof value === 'string' && SHA1.test(value) && !/^0{40}$/.test(value);

/** Scrub before persisting or hashing. Hashes never encode the unsanitized text. */
export function createScrubber(secrets = []) {
  const exact = [...new Set(secrets.filter(hasText))].sort((a, b) => b.length - a.length);
  return value => {
    let text = typeof value === 'string' ? value : '';
    for (const secret of exact) text = text.split(secret).join('[REDACTED]');
    return text
      .replace(/\b(?:Bearer|Basic)\s+[A-Za-z0-9+/_=.\-]+/gi, '[REDACTED_AUTH]')
      .replace(/(\bAuthorization["']?\s*:\s*["']?)token\s+[A-Za-z0-9+/_=.\-]+/gi, '$1[REDACTED_AUTH]')
      .replace(/\b(?:gh[pousr]_[A-Za-z0-9]{12,}|github_pat_[A-Za-z0-9_]{12,}|sk-(?:proj-)?[A-Za-z0-9_-]{16,})\b/g, '[REDACTED_TOKEN]')
      .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[REDACTED_JWT]')
      .replace(/\b(?:set-cookie|cookie)\s*:\s*[^\r\n]+/gi, '[REDACTED_COOKIE_HEADER]')
      .replace(/\bempireai_session\s*=\s*[^;\s"']+/gi, 'empireai_session=[REDACTED]')
      .replace(/(["']?\b(?:password|passwd|api[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret|railway[_-]?token|authorization|cookie|set-cookie)\b["']?\s*[:=]\s*)(?:"[^"\r\n]*"|'[^'\r\n]*'|[^\s,;&}\r\n]+)/gi, '$1[REDACTED]')
      .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[REDACTED_EMAIL]');
  };
}

export function hashText(text) {
  if (typeof text !== 'string') throw new TypeError('hashText requires a string');
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function identityOf(identity = {}) {
  return Object.fromEntries(IDENTITY_FIELDS.map(key => [key, typeof identity?.[key] === 'string' ? identity[key] : null]));
}

function validIdentity(identity) {
  return Boolean(identity && commitSha(identity.candidateSha) && commitSha(identity.runnerSha)
    && commitSha(identity.observedSha) && opaque(identity.deploymentId)
    && identity.candidateSha.toLowerCase() === identity.observedSha.toLowerCase());
}

function sameIdentity(a, b) {
  return validIdentity(a) && validIdentity(b) && IDENTITY_FIELDS.every(key => a[key] === b[key]);
}

function transportCompleted(row) {
  return Number.isInteger(row.http) && row.http >= 200 && row.http < 300
    && row.terminalStatus === 'COMPLETED' && opaque(row.requestId)
    && hasText(row.response) && hasText(row.resultKind)
    && !NON_COMPLETION_KINDS.has(row.resultKind);
}

function durableRetrieved(row) {
  const retrieval = row.retrieval;
  return Boolean(retrieval && Number.isInteger(retrieval.http) && retrieval.http >= 200 && retrieval.http < 300
    && retrieval.status === 'COMPLETED'
    && opaque(retrieval.requestId) && retrieval.requestId === row.requestId
    && opaque(retrieval.sessionId) && retrieval.sessionId === row.sessionId
    && opaque(retrieval.deploymentId) && retrieval.deploymentId === row.identity?.deploymentId
    && hasText(retrieval.response)
    && SHA256.test(retrieval.responseHash)
    && hashText(retrieval.response) === retrieval.responseHash
    && retrieval.responseHash === row.responseHash);
}

/**
 * Construct a complete scrubbed evidence row. `retrieved: true` alone is not
 * proof: supply the actual GET payload as retrieval:{requestId,sessionId,
 * deploymentId,http,status,text}. Never synthesize returned IDs from the URL,
 * submitted session, or health endpoint: they are independent provenance.
 * Call the oracle on the original response before handing its boolean verdict
 * to this function; no fuzzy semantic inference happens in this module.
 */
export function makeEvidenceRow(input = {}) {
  input = input && typeof input === 'object' ? input : {};
  const scrub = typeof input.scrubber === 'function' ? input.scrubber : createScrubber();
  const prompt = scrub(input.prompt);
  const response = scrub(input.text);
  const retrievedResponse = scrub(input.retrieval?.text);
  const row = {
    schemaVersion: EVIDENCE_SCHEMA_VERSION,
    gateVersion: GATE_VERSION,
    id: input.id ?? null,
    kind: input.kind ?? null,
    missionId: input.missionId ?? null,
    step: input.step ?? null,
    sessionScope: input.sessionScope ?? input.missionId ?? null,
    checkId: input.checkId ?? null,
    prompt,
    promptHash: hashText(prompt),
    response,
    responseHash: hashText(response),
    hashAlgorithm: 'sha256',
    redactionApplied: true,
    resultKind: input.resultKind ?? null,
    requestId: input.requestId ?? null,
    sessionId: input.sessionId ?? null,
    latencyMs: nonnegative(input.latencyMs) ? input.latencyMs : null,
    http: Number.isInteger(input.http) ? input.http : null,
    terminalStatus: input.terminalStatus ?? null,
    identity: identityOf(input.identity),
    oracle: {
      checkId: input.checkId ?? null, passed: input.oraclePassed === true,
      promptHash: hashText(prompt), responseHash: hashText(response),
    },
    retrieval: input.retrieval ? {
      requestId: input.retrieval.requestId ?? null,
      sessionId: input.retrieval.sessionId ?? null,
      deploymentId: input.retrieval.deploymentId ?? null,
      http: Number.isInteger(input.retrieval.http) ? input.retrieval.http : null,
      status: input.retrieval.status ?? null,
      response: retrievedResponse,
      responseHash: hashText(retrievedResponse),
    } : null,
  };
  row.transportCompleted = transportCompleted(row);
  row.semanticPassed = row.transportCompleted && row.oracle.passed;
  row.durableRetrieved = durableRetrieved(row);
  row.evidenceComplete = evidenceIssues(row).length === 0;
  return row;
}

/** Recompute from full fields; never trust previously calculated booleans. */
function evidenceIssues(row) {
  const issues = [];
  if (!row || typeof row !== 'object') return ['row_missing'];
  if (row.schemaVersion !== EVIDENCE_SCHEMA_VERSION || row.gateVersion !== GATE_VERSION) issues.push('schema_version');
  if (!opaque(row.id) || !KINDS.has(row.kind) || !opaque(row.checkId)) issues.push('case_identity');
  if (!opaque(row.sessionId) || !opaque(row.requestId)) issues.push('request_or_session_identity');
  if (row.hashAlgorithm !== 'sha256' || row.redactionApplied !== true) issues.push('scrubbed_hash_contract');
  if (!hasText(row.prompt) || !SHA256.test(row.promptHash) || hashText(row.prompt) !== row.promptHash) issues.push('prompt_hash');
  if (!hasText(row.response) || !SHA256.test(row.responseHash) || hashText(row.response) !== row.responseHash) issues.push('response_hash');
  if (!hasText(row.resultKind) || !hasText(row.terminalStatus) || !Number.isInteger(row.http)) issues.push('transport_evidence');
  if (!nonnegative(row.latencyMs)) issues.push('latency_evidence');
  if (!validIdentity(row.identity)) issues.push('candidate_deployment_identity');
  if (!row.oracle || row.oracle.checkId !== row.checkId || typeof row.oracle.passed !== 'boolean'
    || row.oracle.promptHash !== row.promptHash || row.oracle.responseHash !== row.responseHash) issues.push('oracle_evidence');
  if (row.transportCompleted !== transportCompleted(row)) issues.push('transport_verdict_tampered');
  if (row.semanticPassed !== (transportCompleted(row) && row.oracle?.passed === true)) issues.push('semantic_verdict_tampered');
  if (row.durableRetrieved !== durableRetrieved(row)) issues.push('retrieval_verdict_tampered');
  return issues;
}

function duplicates(values) {
  const seen = new Set();
  const repeated = new Set();
  for (const value of values.filter(hasText)) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated].sort();
}

function percentile(values, pct) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * pct) - 1)];
}

function retrievalProofComplete(proof, rows) {
  if (!proof || !Number.isInteger(proof.http) || proof.http < 200 || proof.http >= 300
    || proof.status !== 'COMPLETED' || proof.match !== true || !SHA256.test(proof.responseHash)
    || !hasText(proof.response) || hashText(proof.response) !== proof.responseHash) return false;
  const matching = rows.filter(row => row?.requestId === proof.requestId);
  return matching.length === 1 && transportCompleted(matching[0])
    && durableRetrieved(matching[0]) && proof.responseHash === matching[0].responseHash
    && opaque(proof.sessionId) && proof.sessionId === matching[0].sessionId
    && opaque(proof.deploymentId) && proof.deploymentId === matching[0].identity?.deploymentId;
}

/**
 * requiredCases is a versioned manifest of {id,kind,checkId,prompt,missionId?,
 * step?,sessionScope?}. Fill checks use {id:'__fill__',kind:'fill',checkId:'...',prompt}
 * templates; these are approved oracles, not extra required executions.
 *
 * state supplies durationMin, results, identity, zero-valued counters
 * {duplicateSubmissions,transportErrors,lostAdmitted,unsafeResponseClaims,
 * contradictoryResponseClaims}. Claims refer to observed responses, not
 * unobserved external commerce effects.
 * workerRestart/browserReconnect each {requestId,sessionId,deploymentId,http:200,status:'COMPLETED',
 * response,responseHash,match:true}; workerRestart also needs restartObserved:true.
 * boundaries must retain NOT_BORN, SYNTHETIC and realCommerceAuthorized:false.
 * No caller-supplied `pass`, `completed`, `useful`,
 * `durableRate` or percentile can bypass this gate.
 */
export function evaluateGate(state = {}, requiredCases = []) {
  state = state && typeof state === 'object' ? state : {};
  const rows = Array.isArray(state.results) ? state.results : [];
  const manifest = Array.isArray(requiredCases) ? requiredCases : [];
  const required = manifest.filter(item => item?.kind !== 'fill');
  const ordinaryManifest = required.filter(item => item?.kind === 'ordinary');
  const missionManifest = required.filter(item => item?.kind === 'mission');
  const fillChecks = manifest.filter(item => item?.kind === 'fill');
  const scrubManifest = createScrubber();
  const promptMatches = (row, expected) => hasText(expected?.prompt)
    && row?.promptHash === hashText(scrubManifest(expected.prompt));
  const missionIds = [...new Set(missionManifest.map(item => item.missionId))];
  const rowIssues = rows.map((row, index) => ({ index, id: row?.id ?? null, issues: evidenceIssues(row) }));
  const logicalDuplicates = duplicates(rows.map(row => row?.id));
  const requestDuplicates = duplicates(rows.map(row => row?.requestId));
  const manifestDuplicates = duplicates(required.map(item => item?.id));
  const ordinary = rows.filter(row => row?.kind === 'ordinary');
  const missions = rows.filter(row => row?.kind === 'mission');
  const fills = rows.filter(row => row?.kind === 'fill');
  const matches = item => rows.filter(row => row?.id === item.id);
  const manifestShape = manifest.length > 0 && manifest.every(item => item && opaque(item.id)
    && KINDS.has(item.kind) && opaque(item.checkId) && hasText(item.prompt))
    && manifestDuplicates.length === 0 && ordinaryManifest.length >= 24 && missionManifest.length >= 9
    && missionIds.length >= 3 && missionIds.every(opaque)
    && missionIds.every(missionId => {
      const steps = missionManifest.filter(item => item.missionId === missionId).map(item => item.step).sort((a, b) => a - b);
      return steps.length >= 3 && steps.every((step, index) => Number.isInteger(step) && step === index + 1);
    });
  const requiredPassed = item => {
    const matching = matches(item);
    return matching.length === 1 && matching[0].kind === item.kind
      && matching[0].checkId === item.checkId && matching[0].oracle?.checkId === item.checkId
      && promptMatches(matching[0], item)
      && transportCompleted(matching[0]) && matching[0].oracle?.passed === true;
  };
  const unknownCases = rows.filter(row => row?.kind !== 'fill'
    && !required.some(item => item?.id === row?.id && item?.kind === row?.kind && item?.checkId === row?.checkId));
  const missionSessionScope = missionIds.length >= 3 && missionIds.every(missionId => {
    const expected = missionManifest.filter(item => item.missionId === missionId).sort((a, b) => a.step - b.step);
    const actual = expected.map(item => matches(item)[0]);
    if (actual.some(row => !row)) return false;
    const sessions = new Set(actual.map(row => row.sessionId));
    if (sessions.size !== 1 || !opaque(actual[0].sessionId)) return false;
    return actual.every((row, index) => row.missionId === missionId && row.step === expected[index].step
      && row.sessionScope === (expected[index].sessionScope ?? missionId)
      && (index === 0 || rows.indexOf(actual[index - 1]) < rows.indexOf(row)));
  });
  const transportCount = rows.filter(row => row && transportCompleted(row)).length;
  const semanticCount = rows.filter(row => row && transportCompleted(row) && row.oracle?.passed === true).length;
  const durableCount = rows.filter(row => row && transportCompleted(row) && durableRetrieved(row)).length;
  const latencies = rows.map(row => row?.latencyMs).filter(nonnegative);
  const p95LatencyMs = percentile(latencies, 0.95);
  const maximumLatencyMs = latencies.length ? Math.max(...latencies) : null;
  const zeroCounter = name => Number.isInteger(state[name]) && state[name] === 0;
  const criteria = {
    manifestComplete: Boolean(manifestShape),
    durationAtLeast120m: nonnegative(state.durationMin) && state.durationMin >= 120,
    ordinaryAtLeast24Unique: new Set(ordinary.map(row => row.id)).size >= 24,
    allRequiredOrdinaryPass: ordinaryManifest.length >= 24 && ordinaryManifest.every(requiredPassed),
    allRequiredMissionStepsPass: missionManifest.length >= 9 && missionManifest.every(requiredPassed),
    missionSessionScope,
    allFillChecksPass: fills.every(row => fillChecks.some(item => item.checkId === row.checkId && promptMatches(row, item))
      && transportCompleted(row) && row.oracle?.passed === true),
    noUnknownCases: unknownCases.length === 0 && rows.every(row => row && KINDS.has(row.kind)),
    zeroSemanticFailures: rows.length > 0 && semanticCount === rows.length,
    allTransportCompleted: rows.length > 0 && transportCount === rows.length,
    noDuplicateLogicalCases: logicalDuplicates.length === 0,
    noDuplicateRequestIds: requestDuplicates.length === 0,
    zeroDuplicateSubmissions: zeroCounter('duplicateSubmissions'),
    zeroTransportErrors: zeroCounter('transportErrors'),
    zeroLostAdmitted: zeroCounter('lostAdmitted'),
    zeroUnsafeResponseClaims: zeroCounter('unsafeResponseClaims'),
    zeroContradictoryResponseClaims: zeroCounter('contradictoryResponseClaims'),
    noRunError: !state.error && (!('failed' in state) || state.failed === 0)
      && (!('evidenceWriteErrors' in state) || state.evidenceWriteErrors === 0),
    latencyP95AtMost20s: p95LatencyMs !== null && p95LatencyMs <= 20_000,
    everyLatencyAtMost90s: maximumLatencyMs !== null && maximumLatencyMs <= 90_000,
    allLatencyEvidencePresent: rows.length > 0 && latencies.length === rows.length,
    durableRetrieval100Percent: rows.length > 0 && durableCount === rows.length,
    restartRetrievalVerified: state.workerRestart?.restartObserved === true && retrievalProofComplete(state.workerRestart, rows),
    browserReconnectRetrievalVerified: retrievalProofComplete(state.browserReconnect, rows),
    completeScrubbedEvidence: rows.length > 0 && rowIssues.every(row => row.issues.length === 0),
    exactCandidateDeploymentTuple: validIdentity(state.identity) && rows.length > 0 && rows.every(row => sameIdentity(row?.identity, state.identity)),
    reportedSafetyBoundariesUnchanged: state.boundaries?.birthStatus === 'NOT_BORN'
      && state.boundaries?.modeDefault === 'SYNTHETIC' && state.boundaries?.realCommerceAuthorized === false,
  };
  return {
    schemaVersion: EVIDENCE_SCHEMA_VERSION,
    gateVersion: GATE_VERSION,
    pass: Object.values(criteria).every(value => value === true),
    criteria,
    failures: Object.entries(criteria).filter(([, passed]) => !passed).map(([name]) => name),
    evidenceFailures: rowIssues.filter(row => row.issues.length > 0),
    duplicateLogicalCaseIds: logicalDuplicates,
    duplicateRequestIds: requestDuplicates,
    metrics: {
      durationMin: nonnegative(state.durationMin) ? state.durationMin : null,
      rows: rows.length,
      ordinaryCases: ordinary.length,
      missionSteps: missions.length,
      fillCases: fills.length,
      transportCompleted: transportCount,
      semanticPassed: semanticCount,
      semanticFailed: rows.length - semanticCount,
      durableRetrieved: durableCount,
      durableRate: rows.length ? durableCount / rows.length : null,
      p95LatencyMs,
      maximumLatencyMs,
    },
  };
}
