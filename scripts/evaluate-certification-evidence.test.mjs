import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { evaluate, PHASES, readSafe } from './evaluate-certification-evidence.mjs';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
function fixture(t, capability = false) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cert-evaluator-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'scripts/certification-verifiers'), { recursive: true });
  fs.mkdirSync(path.join(root, 'evidence'));
  const write = (name, value) => fs.writeFileSync(path.join(root, name), typeof value === 'string' ? value : JSON.stringify(value));
  const git = (...args) => {
    const r = spawnSync('git', ['-c', 'core.autocrlf=false', '-c', 'user.name=Evaluator Test', '-c', 'user.email=evaluator@example.invalid', '-C', root, ...args], { encoding: 'utf8', windowsHide: true });
    assert.equal(r.status, 0, r.stderr); return r.stdout.trim();
  };
  git('init', '--quiet'); write('.gitignore', 'evidence/\n'); write('SOURCE_TEST_ONLY', 'synthetic test source');
  git('add', '.'); git('commit', '--quiet', '-m', 'synthetic source');
  const sourceCommit = git('rev-parse', 'HEAD'); let trustCommit;
  const requirement = { id: capability ? 'CAP-TEST-01' : 'OPS-TEST-01', phase: 'engineering', mandatory: true, acceptanceCriteria: ['Arithmetic agrees with independent oracle'] };
  const manifest = { schemaVersion: 1, manifestId: 'SYNTHETIC_TEST_ONLY', phases: PHASES.map(id => ({ id })), requirements: [requirement], historicalSources: [] };
  write('manifest.json', manifest);
  // Synthetic protocol fixture only, not an EmpireAI certification harness.
  const verifier = `import fs from 'node:fs'; import path from 'node:path';
const r=JSON.parse(fs.readFileSync(0,'utf8')); const a=JSON.parse(fs.readFileSync(path.join(r.evidenceRoot,r.receipt.artifacts[0].path),'utf8'));
console.log(JSON.stringify({protocol:'pillow-independent-verifier-v1',receiptId:r.receipt.receiptId,checks:[{criterion:1,pass:a.observed===a.operands.reduce((x,y)=>x+y,0)}],...(r.receipt.heldOut?{heldOutCases:r.receipt.heldOut.caseIds}:{})}));`;
  write('scripts/certification-verifiers/synthetic-fixture.mjs', verifier);
  write('evidence/artifact.json', { operands: [17, 25], observed: 42 });
  const expectedScope = { workspaceId: 'owner', environmentId: 'disposable', deploymentIds: { backend: 'test-deployment' } };
  const receipt = { schemaVersion: 1, receiptId: 'test-receipt', requirementId: requirement.id, phase: requirement.phase,
    manifestSha256: hash(fs.readFileSync(path.join(root, 'manifest.json'))), sourceCommit, scope: expectedScope,
    verifierId: 'synthetic-verifier', outcome: 'PASS', observedAt: '2026-01-02T00:00:00Z', supersedes: [],
    artifacts: [{ path: 'artifact.json', sha256: hash(fs.readFileSync(path.join(root, 'evidence/artifact.json'))) }],
    ...(capability ? { heldOut: { caseSetSha256: 'b'.repeat(64), oracleSha256: 'c'.repeat(64), caseIds: ['case1', 'case2', 'case3'] } } : {}) };
  const registry = { schemaVersion: 1, manifestSha256: receipt.manifestSha256, sourceCommits: [sourceCommit], verifiers: [{ id: receipt.verifierId,
    module: 'scripts/certification-verifiers/synthetic-fixture.mjs', sha256: hash(verifier),
    requirements: [{ id: requirement.id, ...(capability ? { caseSetSha256: 'b'.repeat(64), oracleSha256: 'c'.repeat(64) } : {}) }] }] };
  const save = (receipts = [receipt]) => {
    write('evidence/receipts.json', { schemaVersion: 1, receipts }); write('registry.json', registry);
    write('ledger.json', { schemaVersion: 1, entries: receipts.map(r => ({ receiptId: r.receiptId, sha256: hash(JSON.stringify(r)) })) });
    git('add', '.'); git('commit', '--quiet', '--allow-empty', '-m', 'synthetic reviewed anchor'); trustCommit = git('rev-parse', 'HEAD');
  };
  save();
  const options = { repositoryRoot: root, manifestPath: 'manifest.json', evidenceRoot: path.join(root, 'evidence'), registryPath: 'registry.json', ledgerPath: 'ledger.json', get trustCommit() { return trustCommit; }, sourceCommit: receipt.sourceCommit, expectedScope };
  return { root, write, options, receipt, registry, manifest, save, git };
}
test('missing evidence is BLOCKED with full mandatory list, never authority', t => {
  const f = fixture(t); const result = evaluate({ ...f.options, evidenceRoot: undefined, registryPath: undefined });
  assert.equal(result.status, 'BLOCKED'); assert.deepEqual(result.missingRequirements, ['OPS-TEST-01']);
  assert.equal(result.certificationAccepted, false); assert.equal(result.birthAuthorized, false); assert.equal(result.liveCommerceAuthorized, false);
});
test('PASS requires independent rerun; verified coverage remains unaccepted', t => {
  const f = fixture(t);
  assert.equal(evaluate({ ...f.options, registryPath: undefined }).status, 'BLOCKED');
  const result = evaluate(f.options); assert.equal(result.status, 'EVIDENCE_COMPLETE_UNACCEPTED'); assert.equal(result.certificationAccepted, false);
  f.write('evidence/artifact.json', { operands: [17, 25], observed: 999 });
  f.receipt.artifacts[0].sha256 = hash(fs.readFileSync(path.join(f.root, 'evidence/artifact.json'))); f.save();
  assert.equal(evaluate(f.options).status, 'BLOCKED', 'Rehashing a false claim cannot satisfy independent arithmetic verification');
});
test('tampered artifact and verifier code are rejected', t => {
  const f = fixture(t); f.write('evidence/artifact.json', '{}');
  assert.equal(evaluate(f.options).status, 'BLOCKED');
  f.receipt.artifacts[0].sha256 = hash('{}'); f.save();
  f.write('scripts/certification-verifiers/synthetic-fixture.mjs', 'console.log("forged")');
  assert.match(evaluate(f.options).blockers[0].detail, /Verifier code hash|clean/);
});
test('source, workspace, environment and deployment changes cannot reuse coverage', t => {
  const f = fixture(t);
  const changes = [{ sourceCommit: 'd'.repeat(40) },
    ...['workspaceId', 'environmentId'].map(k => ({ expectedScope: { ...f.options.expectedScope, [k]: 'foreign' } })),
    { expectedScope: { ...f.options.expectedScope, deploymentIds: { backend: 'other-deployment' } } }];
  for (const change of changes) assert.equal(evaluate({ ...f.options, ...change }).status, 'BLOCKED');
  f.manifest.requirements[0].acceptanceCriteria.push('new criterion'); f.write('manifest.json', f.manifest);
  assert.throws(() => evaluate(f.options), /manifest mismatch/);
});
test('failures and revocations remain blocking until explicitly superseded with retained history', t => {
  const f = fixture(t);
  const failure = { ...f.receipt, receiptId: 'failed', outcome: 'FAIL', observedAt: '2026-01-01T00:00:00Z' };
  f.save([failure, f.receipt]); assert.equal(evaluate(f.options).status, 'BLOCKED');
  f.receipt.supersedes = ['failed']; f.save([failure, f.receipt]);
  const repaired = evaluate(f.options); assert.equal(repaired.status, 'EVIDENCE_COMPLETE_UNACCEPTED'); assert.equal(repaired.history.length, 2);
  const revoked = { ...f.receipt, receiptId: 'revoked', outcome: 'REVOKED', observedAt: '2026-01-03T00:00:00Z', supersedes: [f.receipt.receiptId] };
  f.save([failure, f.receipt, revoked]); assert.equal(evaluate(f.options).status, 'BLOCKED');
  f.save([f.receipt]); assert.throws(() => evaluate(f.options), /supersession/);
});
test('strict fields, duplicate receipts, incomplete criterion coverage and oversized input fail closed', t => {
  const f = fixture(t); f.save([{ ...f.receipt, certificationAccepted: true }]); assert.throws(() => evaluate(f.options), /fields/);
  f.save([f.receipt, f.receipt]); assert.throws(() => evaluate(f.options), /Duplicate/);
  f.manifest.requirements[0].acceptanceCriteria.push('not verified'); f.write('manifest.json', f.manifest);
  f.receipt.manifestSha256 = hash(fs.readFileSync(path.join(f.root, 'manifest.json'))); f.registry.manifestSha256 = f.receipt.manifestSha256; f.save();
  assert.equal(evaluate(f.options).status, 'BLOCKED');
  f.write('evidence/receipts.json', ' '.repeat(2 * 1024 * 1024 + 1)); assert.throws(() => evaluate(f.options), /oversized/);
});
test('artifact paths reject traversal, absolute paths, alternate streams and symlinks', t => {
  const f = fixture(t);
  for (const name of ['../manifest.json', '/manifest.json', 'C:/secret', 'artifact.json:stream', 'a\\b', './artifact.json']) assert.throws(() => readSafe(path.join(f.root, 'evidence'), name), /Unsafe/);
  const link = path.join(f.root, 'evidence/link');
  fs.symlinkSync(path.join(f.root, 'scripts'), link, process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => readSafe(path.join(f.root, 'evidence'), 'link/certification-verifiers/synthetic-fixture.mjs'), /Symlink/);
});
test('held-out cases require precommitted registry oracle and at least three distinct cases', t => {
  const f = fixture(t, true); assert.equal(evaluate(f.options).status, 'EVIDENCE_COMPLETE_UNACCEPTED');
  f.receipt.heldOut.oracleSha256 = 'd'.repeat(64); f.save(); assert.equal(evaluate(f.options).status, 'BLOCKED');
  f.receipt.heldOut.caseIds = ['one', 'two']; f.save(); assert.throws(() => evaluate(f.options), /list/);
});
test('phase selection cannot imply completion of other phases', t => {
  const f = fixture(t); f.manifest.requirements.push({ id: 'PILOT-01', phase: 'real-pilot', mandatory: true, acceptanceCriteria: ['Reconcile real receipts'] });
  f.write('manifest.json', f.manifest); f.receipt.manifestSha256 = hash(fs.readFileSync(path.join(f.root, 'manifest.json'))); f.registry.manifestSha256 = f.receipt.manifestSha256; f.save();
  assert.equal(evaluate(f.options).status, 'BLOCKED');
  const engineering = evaluate({ ...f.options, phase: 'engineering' }); assert.equal(engineering.status, 'EVIDENCE_COMPLETE_UNACCEPTED'); assert.equal(engineering.phase, 'engineering'); assert.equal(engineering.liveCommerceAuthorized, false);
});
test('superseded failure artifacts cannot be removed or rewritten', t => {
  const f = fixture(t);
  f.write('evidence/prior-failure.json', { observed: 'failed' });
  const prior = { ...f.receipt, receiptId: 'prior-failure', outcome: 'FAIL', observedAt: '2026-01-01T00:00:00Z',
    artifacts: [{ path: 'prior-failure.json', sha256: hash(fs.readFileSync(path.join(f.root, 'evidence/prior-failure.json'))) }] };
  f.receipt.supersedes = [prior.receiptId]; f.save([prior, f.receipt]);
  assert.equal(evaluate(f.options).status, 'EVIDENCE_COMPLETE_UNACCEPTED');
  fs.unlinkSync(path.join(f.root, 'evidence/prior-failure.json'));
  const result = evaluate(f.options); assert.equal(result.status, 'BLOCKED'); assert.equal(result.blockers[0].reason, 'RETAINED_EVIDENCE_INVALID');
  assert.equal(result.history[0].outcome, 'FAIL');
});
test('trusted ledger rejects deleting failure and clearing all supersession references', t => {
  const f = fixture(t);
  const failed = { ...f.receipt, receiptId: 'retained-failure', outcome: 'FAIL', observedAt: '2026-01-01T00:00:00Z' };
  f.receipt.supersedes = [failed.receiptId]; f.save([failed, f.receipt]);
  assert.equal(evaluate(f.options).status, 'EVIDENCE_COMPLETE_UNACCEPTED');
  f.write('evidence/receipts.json', { schemaVersion: 1, receipts: [{ ...f.receipt, supersedes: [] }] });
  const result = evaluate(f.options); assert.equal(result.status, 'BLOCKED'); assert.match(result.blockers[0].detail, /ledger history/);
});
test('trusted registry rejects unpinned imported helpers before they execute', t => {
  const f = fixture(t);
  f.write('scripts/certification-verifiers/helper.mjs', 'throw new Error("MUST_NOT_EXECUTE");');
  const entry = 'scripts/certification-verifiers/synthetic-fixture.mjs';
  f.write(entry, "import './helper.mjs';\n" + fs.readFileSync(path.join(f.root, entry), 'utf8'));
  f.registry.verifiers[0].sha256 = hash(fs.readFileSync(path.join(f.root, entry))); f.save();
  assert.match(evaluate(f.options).blockers[0].detail, /unpinned dependency/);
  f.write('scripts/certification-verifiers/helper.mjs', 'throw new Error("CHANGED_HELPER");');
  assert.match(evaluate(f.options).blockers[0].detail, /clean/);
});
test('trusted historical source hashes reject changed or missing recovered documents', t => {
  const f = fixture(t); f.write('historical.txt', 'original engineering failure');
  f.manifest.historicalSources = [{ path: 'historical.txt', sha256: hash('original engineering failure') }];
  f.write('manifest.json', f.manifest); f.receipt.manifestSha256 = hash(fs.readFileSync(path.join(f.root, 'manifest.json'))); f.registry.manifestSha256 = f.receipt.manifestSha256; f.save();
  assert.equal(evaluate(f.options).status, 'EVIDENCE_COMPLETE_UNACCEPTED');
  f.write('historical.txt', 'rewritten success'); f.save();
  assert.match(evaluate(f.options).blockers[0].detail, /Historical source hash mismatch/);
  fs.unlinkSync(path.join(f.root, 'historical.txt'));
  assert.equal(evaluate(f.options).status, 'BLOCKED');
});
test('trusted snapshot cannot be replaced by dirty rehashed registry or unapproved source commit', t => {
  const f = fixture(t);
  assert.equal(evaluate({ ...f.options, trustCommit: undefined }).status, 'BLOCKED');
  assert.match(evaluate({ ...f.options, sourceCommit: f.options.trustCommit }).blockers[0].detail, /reviewed release allowlist/);
  f.registry.verifiers[0].sha256 = 'f'.repeat(64); f.write('registry.json', f.registry);
  assert.match(evaluate(f.options).blockers[0].detail, /clean/);
});