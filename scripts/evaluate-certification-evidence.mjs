#!/usr/bin/env node
// Offline coverage verification only. This module never changes Birth or commerce authority.
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const PHASES = ['engineering', 'sandbox', 'runtime', 'owner-ui', 'real-pilot'];
const ID = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const SHA = /^[a-f0-9]{64}$/;
const COMMIT = /^[a-f0-9]{40}$/;
const MAX_FILE = 2 * 1024 * 1024;
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const assert = (ok, message) => { if (!ok) throw new Error(message); };
function object(value, keys, optional = []) {
  assert(value && typeof value === 'object' && !Array.isArray(value), 'Expected object');
  assert(Object.keys(value).every(k => [...keys, ...optional].includes(k)) && keys.every(k => Object.hasOwn(value, k)), 'Unknown or missing fields');
}
function list(value, maximum, minimum = 0) { assert(Array.isArray(value) && value.length >= minimum && value.length <= maximum, 'Invalid bounded list'); }
function ids(value, maximum, minimum = 0) {
  list(value, maximum, minimum); assert(value.every(v => typeof v === 'string' && ID.test(v)) && new Set(value).size === value.length, 'Invalid or duplicate identities');
}
function text(value, maximum) { assert(typeof value === 'string' && value.length > 0 && value.length <= maximum, 'Invalid bounded text'); }
function scope(value) {
  object(value, ['workspaceId', 'environmentId', 'deploymentIds']);
  for (const v of [value.workspaceId, value.environmentId]) assert(typeof v === 'string' && ID.test(v), 'Invalid scope identity');
  assert(value.deploymentIds && typeof value.deploymentIds === 'object' && !Array.isArray(value.deploymentIds), 'Invalid deployment map');
  const entries = Object.entries(value.deploymentIds);
  assert(entries.length > 0 && entries.length <= 8 && entries.every(([k, v]) => ID.test(k) && typeof v === 'string' && ID.test(v)), 'Invalid deployment identities');
}
// Walk every component and then use a no-follow open and inode comparison. The trusted
// checkout/evidence directory must not be concurrently writable by hostile processes.
export function readSafe(root, relative, maximum = MAX_FILE) {
  assert(typeof relative === 'string' && relative.length <= 512 && !path.isAbsolute(relative) &&
    !relative.includes('\\') && !relative.includes(':') && !relative.includes('\0'), 'Unsafe artifact path');
  const parts = relative.split('/');
  assert(parts.length && parts.every(p => p && p !== '.' && p !== '..'), 'Unsafe artifact path');
  const absoluteRoot = path.resolve(root);
  let current = path.parse(absoluteRoot).root;
  for (const part of path.relative(current, absoluteRoot).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    assert(!fs.lstatSync(current).isSymbolicLink(), 'Symlink root rejected');
  }
  assert(fs.statSync(absoluteRoot).isDirectory(), 'Root must be a directory');
  current = absoluteRoot;
  for (const part of parts) {
    current = path.join(current, part);
    assert(!fs.lstatSync(current).isSymbolicLink(), 'Symlink artifact rejected');
  }
  const before = fs.lstatSync(current);
  assert(before.isFile() && before.size <= maximum, 'Nonregular or oversized artifact');
  const fd = fs.openSync(current, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
  try {
    const opened = fs.fstatSync(fd);
    assert(opened.isFile() && opened.size <= maximum && opened.ino === before.ino && opened.dev === before.dev, 'Artifact changed during open');
    const bytes = fs.readFileSync(fd);
    assert(bytes.length <= maximum, 'Oversized artifact');
    return bytes;
  } finally { fs.closeSync(fd); }
}
function load(root, relative) { return JSON.parse(readSafe(root, relative).toString('utf8')); }
function validateManifest(m) {
  assert(m?.schemaVersion === 1 && ID.test(m.manifestId), 'Invalid manifest');
  list(m.phases, 5, 5);
  assert(new Set(m.phases.map(p => p.id)).size === 5 && PHASES.every(id => m.phases.some(p => p.id === id)), 'Manifest must separate all five phases');
  list(m.requirements, 256, 1);
  assert(new Set(m.requirements.map(r => r.id)).size === m.requirements.length, 'Duplicate requirement');
  for (const r of m.requirements) {
    assert(ID.test(r.id) && PHASES.includes(r.phase) && r.mandatory === true, 'Invalid mandatory requirement');
    list(r.acceptanceCriteria, 64, 1); r.acceptanceCriteria.forEach(c => text(c, 4096));
  }
}
function validateReceipt(r) {
  object(r, ['schemaVersion', 'receiptId', 'requirementId', 'phase', 'manifestSha256', 'sourceCommit', 'scope', 'verifierId', 'outcome', 'observedAt', 'artifacts', 'supersedes'], ['heldOut']);
  assert(r.schemaVersion === 1 && [r.receiptId, r.requirementId, r.verifierId].every(v => typeof v === 'string' && ID.test(v)), 'Invalid receipt identity');
  assert(PHASES.includes(r.phase) && SHA.test(r.manifestSha256) && COMMIT.test(r.sourceCommit), 'Invalid receipt binding');
  scope(r.scope);
  assert(['PASS', 'FAIL', 'BLOCKED', 'NOT_EVALUATED', 'REVOKED'].includes(r.outcome), 'Invalid outcome');
  assert(typeof r.observedAt === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(r.observedAt) && Number.isFinite(Date.parse(r.observedAt)), 'Invalid observation time');
  ids(r.supersedes, 256);
  list(r.artifacts, 32, 1);
  const seen = new Set();
  for (const a of r.artifacts) {
    object(a, ['path', 'sha256']); text(a.path, 512); assert(SHA.test(a.sha256) && !seen.has(a.path), 'Invalid or duplicate artifact'); seen.add(a.path);
  }
  if (r.heldOut !== undefined) {
    object(r.heldOut, ['caseSetSha256', 'oracleSha256', 'caseIds']);
    assert(SHA.test(r.heldOut.caseSetSha256) && SHA.test(r.heldOut.oracleSha256), 'Invalid oracle commitment'); ids(r.heldOut.caseIds, 64, 3);
  }
}
function validateRegistry(registry, manifest) {
  object(registry, ['schemaVersion', 'manifestSha256', 'sourceCommits', 'verifiers']);
  list(registry.sourceCommits, 64, 1); assert(registry.sourceCommits.every(v => COMMIT.test(v)) && new Set(registry.sourceCommits).size === registry.sourceCommits.length, 'Invalid reviewed source allowlist');
  assert(registry.schemaVersion === 1 && SHA.test(registry.manifestSha256), 'Invalid verifier registry');
  list(registry.verifiers, 256);
  assert(new Set(registry.verifiers.map(v => v.id)).size === registry.verifiers.length, 'Duplicate verifier');
  for (const v of registry.verifiers) {
    object(v, ['id', 'module', 'sha256', 'requirements']); assert(ID.test(v.id) && SHA.test(v.sha256), 'Invalid verifier identity');
    assert(typeof v.module === 'string' && /^scripts\/certification-verifiers\/[A-Za-z0-9_-]+\.mjs$/.test(v.module), 'Verifier must be repository-governed');
    list(v.requirements, 256, 1); assert(new Set(v.requirements.map(r => r.id)).size === v.requirements.length, 'Duplicate verifier requirement');
    for (const r of v.requirements) {
      object(r, ['id'], ['caseSetSha256', 'oracleSha256']);
      assert(manifest.requirements.some(m => m.id === r.id), 'Unknown verifier requirement');
      if (r.id.startsWith('CAP-')) assert(SHA.test(r.caseSetSha256) && SHA.test(r.oracleSha256), 'Capability verifier needs precommitted cases and oracle');
    }
  }
}
function gitRead(root, args, binary = false) {
  const result = spawnSync('git', ['-c', `safe.directory=${path.resolve(root).replaceAll('\\', '/')}`, '-c', 'core.fsmonitor=false', '-C', path.resolve(root), ...args],
    { encoding: binary ? undefined : 'utf8', timeout: 10000, maxBuffer: 3 * 1024 * 1024, windowsHide: true });
  assert(!result.error && result.status === 0, 'Trusted Git snapshot is unavailable or mismatched');
  return binary ? result.stdout : result.stdout.trim();
}
function committedBytes(root, commit, relative, maximum = MAX_FILE) {
  const current = readSafe(root, relative, maximum);
  const committed = gitRead(root, ['show', `${commit}:${relative}`], true);
  assert(committed.length <= maximum && current.equals(committed), 'File differs from trusted committed bytes');
  return committed;
}
function verifyAnchor(root, commit, sourceCommit, manifestPath, registryPath, ledgerPath, manifest, receipts) {
  assert(COMMIT.test(commit) && registryPath && ledgerPath, 'Reviewed Git anchor, registry and ledger required');
  assert(gitRead(root, ['rev-parse', 'HEAD']) === commit, 'Checkout is not at trusted commit');
  assert(gitRead(root, ['status', '--porcelain=v1', '--untracked-files=all']) === '', 'Trusted checkout must be clean');
  assert(gitRead(root, ['rev-parse', `${sourceCommit}^{commit}`]) === sourceCommit, 'Source is not an exact known Git commit');

  committedBytes(root, commit, manifestPath);
  const trustedRegistry = JSON.parse(committedBytes(root, commit, registryPath).toString('utf8'));
  assert(trustedRegistry.sourceCommits.includes(sourceCommit), 'Source commit is absent from reviewed release allowlist');
  const ledgerBytes = committedBytes(root, commit, ledgerPath);
  const ledger = JSON.parse(ledgerBytes.toString('utf8'));
  object(ledger, ['schemaVersion', 'entries']); assert(ledger.schemaVersion === 1, 'Invalid trusted receipt ledger'); list(ledger.entries, 1000);
  const entries = new Map();
  for (const entry of ledger.entries) {
    object(entry, ['receiptId', 'sha256']); assert(ID.test(entry.receiptId) && SHA.test(entry.sha256) && !entries.has(entry.receiptId), 'Invalid trusted ledger identity'); entries.set(entry.receiptId, entry.sha256);
  }
  assert(entries.size === receipts.length && receipts.every(r => entries.get(r.receiptId) === sha(JSON.stringify(r))), 'Evidence index omits or changes trusted ledger history');
  list(manifest.historicalSources, 64);
  for (const item of manifest.historicalSources) {
    assert(SHA.test(item.sha256), 'Historical source has no frozen hash');
    assert(sha(committedBytes(root, commit, item.path)) === item.sha256, 'Historical source hash mismatch');
  }
  return sha(ledgerBytes);
}
function assertSelfContainedVerifier(source) {
  const text = source.toString('utf8');
  // Deliberately conservative: false positives require simplifying/reviewing the
  // verifier, never relaxing the boundary to app-selected dependency execution.
  assert(!/\b(?:import\s*\(|require\s*\(|eval\s*\(|Function\s*\(|getBuiltinModule\s*\(|createRequire\s*\(|mainModule\b)/.test(text), 'Dynamic verifier loading is forbidden');
  const imports = [...text.matchAll(/\b(?:import|export)\s+(?:[^;'"\n]*?\s+from\s*)?['"]([^'"]+)['"]/g)];
  const allowed = new Set(['node:crypto', 'node:fs', 'node:path']);
  assert((text.match(/\bimport\b/g) ?? []).length === imports.length && !/\bexport\b/.test(text), 'Verifier must use simple static imports only');
  for (const match of imports) assert(allowed.has(match[1]), 'Verifier imports an unpinned dependency');
}
function runVerifier(root, evidenceRoot, verifier, receipt, requirement, budgetMs, trustCommit) {
  const source = committedBytes(root, trustCommit, verifier.module, 256 * 1024);
  assertSelfContainedVerifier(source);
  assert(sha(source) === verifier.sha256, 'Verifier code hash mismatch');
  const binding = verifier.requirements.find(r => r.id === requirement.id);
  assert(binding, 'Verifier not approved for requirement');
  if (requirement.id.startsWith('CAP-')) {
    assert(receipt.heldOut && receipt.heldOut.caseSetSha256 === binding.caseSetSha256 && receipt.heldOut.oracleSha256 === binding.oracleSha256, 'Held-out oracle commitment mismatch');
  }
  // Only reviewed hash-pinned modules execute. No caller-selected command or argv.
  // This is NOT an OS/network sandbox; registry modules are trusted engineering code.
  const result = spawnSync(process.execPath, [path.resolve(root, verifier.module)], {
    cwd: path.resolve(root), timeout: Math.min(10000, budgetMs), maxBuffer: 65536, encoding: 'utf8',
    env: { NODE_ENV: 'test', ...(process.platform === 'win32' ? { SystemRoot: process.env.SystemRoot ?? 'C:\\Windows' } : {}) },
    input: JSON.stringify({ protocol: 'pillow-independent-verifier-v1', receipt, requirement, evidenceRoot: path.resolve(evidenceRoot) }),
    windowsHide: true,
  });
  assert(!result.error && result.status === 0, 'Independent verifier failed or timed out');
  const proof = JSON.parse(result.stdout);
  object(proof, ['protocol', 'receiptId', 'checks'], ['heldOutCases']);
  assert(proof.protocol === 'pillow-independent-verifier-v1' && proof.receiptId === receipt.receiptId, 'Verifier identity mismatch');
  list(proof.checks, 64, requirement.acceptanceCriteria.length);
  assert(proof.checks.length === requirement.acceptanceCriteria.length, 'Incomplete criterion coverage');
  const checked = new Set();
  for (const c of proof.checks) {
    object(c, ['criterion', 'pass']); assert(Number.isInteger(c.criterion) && c.criterion >= 1 && c.criterion <= requirement.acceptanceCriteria.length && c.pass === true && !checked.has(c.criterion), 'Failed or duplicate criterion'); checked.add(c.criterion);
  }
  if (requirement.id.startsWith('CAP-')) {
    ids(proof.heldOutCases, 64, 3);
    assert(proof.heldOutCases.length === receipt.heldOut.caseIds.length && proof.heldOutCases.every(id => receipt.heldOut.caseIds.includes(id)), 'Incomplete held-out verification');
  } else assert(proof.heldOutCases === undefined, 'Unexpected held-out proof');
}
export function evaluate(options) {
  const { repositoryRoot, manifestPath, evidenceRoot, sourceCommit, expectedScope, phase = 'all', registryPath, ledgerPath, trustCommit, indexPath = 'receipts.json' } = options;
  assert(COMMIT.test(sourceCommit), 'Exact source commit required'); scope(expectedScope);
  assert(phase === 'all' || PHASES.includes(phase), 'Unknown phase');
  const manifestBytes = readSafe(repositoryRoot, manifestPath);
  const manifest = JSON.parse(manifestBytes.toString('utf8')); validateManifest(manifest);
  const manifestSha256 = sha(manifestBytes);
  const result = { schemaVersion: 1, manifestId: manifest.manifestId, manifestSha256, sourceCommit, scope: expectedScope, phase,
    status: 'BLOCKED', certificationAccepted: false, birthAuthorized: false, liveCommerceAuthorized: false,
    verifiedRequirements: [], missingRequirements: [], blockers: [], receipts: [], registrySha256: null, evidenceIndexSha256: null, trustCommit: trustCommit ?? null, ledgerSha256: null };
  const requirements = manifest.requirements.filter(r => phase === 'all' || r.phase === phase);
  let receipts = [], registry = null;
  if (registryPath) {
    const bytes = readSafe(repositoryRoot, registryPath); registry = JSON.parse(bytes.toString('utf8')); validateRegistry(registry, manifest);
    assert(registry.manifestSha256 === manifestSha256, 'Verifier registry manifest mismatch'); result.registrySha256 = sha(bytes);
  }
  if (evidenceRoot) {
    const bytes = readSafe(evidenceRoot, indexPath); const index = JSON.parse(bytes.toString('utf8')); object(index, ['schemaVersion', 'receipts']);
    assert(index.schemaVersion === 1, 'Invalid evidence index'); list(index.receipts, 1000); receipts = index.receipts; result.evidenceIndexSha256 = sha(bytes);
  }
  const seen = new Map();
  for (const r of receipts) {
    validateReceipt(r); assert(!seen.has(r.receiptId), 'Duplicate/conflicting receipt identity');
    const requirement = manifest.requirements.find(q => q.id === r.requirementId);
    assert(requirement && requirement.phase === r.phase, 'Unknown or mismatched receipt requirement'); seen.set(r.receiptId, r);
  }
  for (const r of receipts) for (const priorId of r.supersedes) {
    const prior = seen.get(priorId);
    assert(prior && prior.requirementId === r.requirementId && Date.parse(prior.observedAt) < Date.parse(r.observedAt), 'Missing, cross-requirement or cyclic supersession');
  }
  result.history = receipts.map(r => ({ receiptId: r.receiptId, requirementId: r.requirementId, outcome: r.outcome, supersedes: r.supersedes,
    currentSource: r.sourceCommit === sourceCommit, currentManifest: r.manifestSha256 === manifestSha256 }));
  // Retained failures and revoked/superseded receipts must keep intact artifacts too.
  // A bounded bundle cannot hide a broken historical artifact behind a newer PASS.
  if (receipts.length) {
    try { result.ledgerSha256 = verifyAnchor(repositoryRoot, trustCommit, sourceCommit, manifestPath, registryPath, ledgerPath, manifest, receipts); }
    catch (error) {
      result.blockers.push({ reason: 'TRUSTED_SNAPSHOT_UNAVAILABLE', detail: String(error.message).slice(0, 256) });
      result.missingRequirements = requirements.map(r => r.id); return result;
    }
  }
  const retained = new Map(); let retainedBytes = 0;
  try {
    for (const r of receipts) for (const a of r.artifacts) {
      if (!retained.has(a.path)) {
        assert(retained.size < 1024, 'Too many retained artifacts');
        const bytes = readSafe(evidenceRoot, a.path);
        retainedBytes += bytes.length; assert(retainedBytes <= 32 * 1024 * 1024, 'Evidence bundle exceeds byte budget');
        retained.set(a.path, sha(bytes));
      }
      assert(retained.get(a.path) === a.sha256, 'Retained artifact bytes do not match');
    }
  } catch (error) {
    result.blockers.push({ reason: 'RETAINED_EVIDENCE_INVALID', detail: String(error.message).slice(0, 256) });
    result.missingRequirements = requirements.map(r => r.id); return result;
  }
  if (!requirements.length) {
    result.blockers.push({ reason: 'NO_MANDATORY_REQUIREMENTS_IN_PHASE' }); return result;
  }
  const deadline = Date.now() + 120000;
  for (const requirement of requirements) {
    const matches = receipts.filter(r => r.requirementId === requirement.id && r.manifestSha256 === manifestSha256 && r.sourceCommit === sourceCommit &&
      r.scope.workspaceId === expectedScope.workspaceId && r.scope.environmentId === expectedScope.environmentId &&
      JSON.stringify(Object.entries(r.scope.deploymentIds).sort()) === JSON.stringify(Object.entries(expectedScope.deploymentIds).sort()));
    const superseded = new Set(matches.flatMap(r => r.supersedes));
    const active = matches.filter(r => !superseded.has(r.receiptId));
    let valid = false;
    if (active.length !== 1) result.blockers.push({ requirementId: requirement.id, reason: active.length ? 'AMBIGUOUS_ACTIVE_RECEIPTS' : 'MISSING_CURRENT_EVIDENCE' });
    else {
      const receipt = active[0];
      result.receipts.push({ receiptId: receipt.receiptId, requirementId: requirement.id, outcome: receipt.outcome, supersedes: receipt.supersedes });
      if (receipt.outcome !== 'PASS') result.blockers.push({ requirementId: requirement.id, reason: receipt.outcome });
      else try {
        for (const artifact of receipt.artifacts) assert(sha(readSafe(evidenceRoot, artifact.path)) === artifact.sha256, 'Artifact bytes do not match');
        const verifier = registry?.verifiers.find(v => v.id === receipt.verifierId);
        assert(verifier, 'Independent rerunnable verifier is not registered');
        assert(Date.now() < deadline, 'Evaluation time budget exhausted');
        runVerifier(repositoryRoot, evidenceRoot, verifier, receipt, requirement, deadline - Date.now(), trustCommit);
        // Recheck bytes after the trusted verifier to detect changed evidence/code.
        for (const artifact of receipt.artifacts) assert(sha(readSafe(evidenceRoot, artifact.path)) === artifact.sha256, 'Artifact changed during verification');
        assert(sha(readSafe(repositoryRoot, verifier.module, 256 * 1024)) === verifier.sha256, 'Verifier changed during execution');
        valid = true;
      } catch (error) { result.blockers.push({ requirementId: requirement.id, reason: 'INDEPENDENT_VERIFICATION_FAILED', detail: String(error.message).slice(0, 256) }); }
    }
    (valid ? result.verifiedRequirements : result.missingRequirements).push(requirement.id);
  }
  if (!result.missingRequirements.length) {
    try {
      // The reviewed snapshot must still be intact after all harness executions.
      verifyAnchor(repositoryRoot, trustCommit, sourceCommit, manifestPath, registryPath, ledgerPath, manifest, receipts);
      result.status = 'EVIDENCE_COMPLETE_UNACCEPTED';
    } catch (error) {
      result.blockers.push({ reason: 'TRUSTED_SNAPSHOT_CHANGED', detail: String(error.message).slice(0, 256) });
      result.verifiedRequirements = []; result.missingRequirements = requirements.map(r => r.id);
    }
  }
  result.history = receipts.map(r => ({ receiptId: r.receiptId, requirementId: r.requirementId, outcome: r.outcome, supersedes: r.supersedes,
    currentSource: r.sourceCommit === sourceCommit, currentManifest: r.manifestSha256 === manifestSha256 }));
  return result;
}
function cli(argv) {
  const allowed = new Set(['--manifest', '--source-commit', '--workspace', '--environment', '--deployment', '--frontend-deployment', '--phase', '--registry', '--ledger', '--trust-commit', '--evidence-dir', '--index']);
  const args = {};
  for (let i = 0; i < argv.length; i += 2) { assert(allowed.has(argv[i]) && argv[i + 1] && !Object.hasOwn(args, argv[i]), 'Unknown, duplicate or missing CLI argument'); args[argv[i]] = argv[i + 1]; }
  const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  return evaluate({ repositoryRoot, manifestPath: args['--manifest'] ?? 'docs/governance/PILLOW_REPLACEMENT_CERTIFICATION_V1.json',
    sourceCommit: args['--source-commit'], expectedScope: { workspaceId: args['--workspace'], environmentId: args['--environment'], deploymentIds: { backend: args['--deployment'], ...(args['--frontend-deployment'] ? { frontend: args['--frontend-deployment'] } : {}) } },
    phase: args['--phase'] ?? 'all', registryPath: args['--registry'], ledgerPath: args['--ledger'], trustCommit: args['--trust-commit'], evidenceRoot: args['--evidence-dir'], indexPath: args['--index'] ?? 'receipts.json' });
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { const result = cli(process.argv.slice(2)); console.log(JSON.stringify(result, null, 2)); process.exitCode = result.status === 'BLOCKED' ? 2 : 0; }
  catch (error) { console.log(JSON.stringify({ status: 'BLOCKED', certificationAccepted: false, birthAuthorized: false, liveCommerceAuthorized: false, error: String(error.message).slice(0, 256) })); process.exitCode = 2; }
}