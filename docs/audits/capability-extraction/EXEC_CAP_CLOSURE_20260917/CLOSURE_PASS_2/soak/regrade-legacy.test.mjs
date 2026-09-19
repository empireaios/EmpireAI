import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { assessLegacyRow, EVIDENCE_SEAL, regradeLegacyBytes, SEALED_SOURCE_SHA256, sha256 } from './regrade-legacy.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const cli = join(here, 'regrade-legacy.mjs');
const sourceBytes = readFileSync(join(root, 'SOAK_RESULTS.json'));
const source = JSON.parse(sourceBytes);
const fixture = JSON.parse(readFileSync(join(here, 'fixtures/legacy-semantic-failures.json')));
const report = regradeLegacyBytes(sourceBytes);

test('sealed input is byte-identical and linked to the original evidence seal', () => {
  assert.equal(sha256(sourceBytes), SEALED_SOURCE_SHA256);
  assert.equal(report.source.evidenceSeal, EVIDENCE_SEAL);
  assert.equal(report.source.mutated, false);
  assert.equal(source.pass, true, 'preserve the legacy claim, even though it was insufficient');
  assert.equal(source.failed, 17);
});

test('new regrade does not promote legacy transport PASS into a capability PASS', () => {
  assert.equal(report.legacyReportedTransport.verdict, 'PASS_REPORTED_BY_LEGACY_GATE');
  assert.equal(report.legacyReportedTransport.independentlyRerun, false);
  assert.equal(report.capability.verdict, 'FAIL_BY_REPORTED_CHECKS');
  assert.equal(report.capability.admitted, 181);
  assert.equal(report.capability.substantiveChecks, 35);
  assert.equal(report.capability.substantiveReportedPassed, 18);
  assert.equal(report.capability.substantiveReportedFailed, 17);
  assert.equal(report.capability.fillRows, 146);
  assert.equal(report.capability.freshProductFixOrCertificationProven, false);
  assert.equal(report.verdict, 'NONQUALIFYING_LEGACY_EVIDENCE');
  assert.equal(report.pass, false);
  assert.deepEqual(report.preservedLocks, { waveCredit: 0, birth: 'NOT_BORN', realCommerce: 'locked' });
});

test('fixture covers every reported failed row once without inventing a response tail', () => {
  assert.equal(fixture.source.sha256, SEALED_SOURCE_SHA256);
  assert.equal(fixture.failures.length, 17);
  assert.equal(new Set(fixture.failures.map((row) => row.requestId)).size, 17);
  assert.deepEqual(fixture.failures.map((row) => row.sourceRowIndex), report.failures.map((row) => row.sourceRowIndex));
  for (const row of fixture.failures) {
    const { sourceRowIndex, completeResponseRetained, textHeadPotentiallyTruncated, ...originalFields } = row;
    assert.deepEqual(originalFields, source.results[sourceRowIndex]);
    assert.equal(completeResponseRetained, false);
    assert.equal(textHeadPotentiallyTruncated, true);
    assert.equal(Object.hasOwn(row, 'fullResponse'), false);
  }
});

for (const row of fixture.failures) {
  test(`reported failure remains nonqualifying: ${row.id} / ${row.requestId}`, () => {
    const assessment = assessLegacyRow(row, row.sourceRowIndex);
    assert.equal(assessment.gateQualifies, false);
    assert.equal(assessment.legacyReportedOk, false);
    assert.ok(assessment.reasons.includes('LEGACY_REPORTED_CHECK_FAILED'));
    assert.ok(assessment.reasons.includes('COMPLETE_RESPONSE_NOT_RETAINED'));
    assert.equal(assessment.textHead, source.results[row.sourceRowIndex].textHead);
    assert.equal(assessment.independentOracleRegrade, 'NOT_POSSIBLE_WITH_RETAINED_EVIDENCE');
    assert.equal(assessment.completeResponseRetained, false);
    assert.equal(assessment.textHeadPotentiallyTruncated, true);
  });
}

test('even a passing legacy row cannot replace missing complete evidence', () => {
  const row = source.results.find((candidate) => candidate.ok === true);
  const assessment = assessLegacyRow(row, source.results.indexOf(row));
  assert.equal(assessment.legacyReportedOk, true);
  assert.equal(assessment.gateQualifies, false);
  assert.equal(assessment.reasons.includes('LEGACY_REPORTED_CHECK_FAILED'), false);
  assert.ok(assessment.reasons.includes('VERSIONED_EXPECTED_CHECK_AND_ORACLE_TRACE_NOT_RETAINED'));
});

test('logical duplicates are found independently of request IDs or semantic verdict', () => {
  assert.equal(source.duplicateEffects, 0, 'legacy counter did not detect these duplicates');
  assert.deepEqual(report.duplicateLogicalCases.map((row) => row.logicalCaseId), [
    'O08_reordered_r0_7', 'O04_correction_r1_15', 'FILL_78',
  ]);
  for (const duplicate of report.duplicateLogicalCases) {
    assert.equal(duplicate.occurrences.length, 2);
    assert.equal(new Set(duplicate.occurrences.map((row) => row.requestId)).size, 2);
  }
});

test('prior audit diagnoses remain attributed, including harness and inconclusive cases', () => {
  assert.deepEqual(report.capability.classificationCounts, {
    PRODUCT_FAILURE: 13, HARNESS_FAILURE: 2, DOWNSTREAM_INCONCLUSIVE: 2, REPORTED_NOT_DIAGNOSED: 0,
  });
  assert.equal(report.priorAudit.sha256, '6c917814bbdfdae85122c382ba60a3b6658ab92089be3cb9f0cd818addf754d8');
  for (const row of report.failures) assert.equal(row.priorAuditDiagnosis.basis, 'PRIOR_REPOSITORY_AUDIT');
});

test('an edited source cannot masquerade as the sealed historical artifact', () => {
  const altered = structuredClone(source);
  altered.failed = 0;
  assert.throws(() => regradeLegacyBytes(Buffer.from(JSON.stringify(altered))), /SEALED_SOURCE_HASH_MISMATCH/);
  assert.throws(() => regradeLegacyBytes(Buffer.from('{}')), /SEALED_SOURCE_HASH_MISMATCH/);
});

test('checked-in regrade is reproducible from immutable historical bytes', () => {
  const committed = JSON.parse(readFileSync(join(root, 'GATE_001_HISTORICAL_REGRADE.json')));
  assert.deepEqual(committed, report);
});

test('ledger preserves all original entry bytes and appends linked historical dispositions', () => {
  const ledgerText = readFileSync(join(root, 'FAILURE_LEDGER.json'), 'utf8');
  const originalEntries = ledgerText.match(/  "entries": (\[[\s\S]*?\n  \])/)[1];
  assert.equal(sha256(originalEntries), '2826dcc05ab24b3e5c4450bd3202318783b45d11c7b94392184ef2064e3a2dbc');
  const ledger = JSON.parse(ledgerText);
  assert.equal(ledger.entries.length, 5);
  const regrade = ledger.regrades.find((row) => row.regradeId === report.regradeId);
  assert.equal(regrade.source.sha256, SEALED_SOURCE_SHA256);
  assert.equal(regrade.source.evidenceSeal, EVIDENCE_SEAL);
  assert.equal(regrade.reportedFailedCaseLinks.length, 17);
  assert.equal(regrade.priorFailureDispositions.length, 5);
  assert.equal(regrade.noNewExecutionOrIndependentCertification, true);
});

test('CLI is read-only by default and import is silent', () => {
  const beforeLedger = readFileSync(join(root, 'FAILURE_LEDGER.json'));
  const result = spawnSync(process.execPath, [cli], { encoding: 'utf8', timeout: 5000 });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), report);
  assert.deepEqual(readFileSync(join(root, 'SOAK_RESULTS.json')), sourceBytes);
  assert.deepEqual(readFileSync(join(root, 'FAILURE_LEDGER.json')), beforeLedger);
  const imported = spawnSync(process.execPath, ['--input-type=module', '-e', `await import(${JSON.stringify(new URL('./regrade-legacy.mjs', import.meta.url).href)});`], { encoding: 'utf8', timeout: 5000 });
  assert.equal(imported.status, 0, imported.stderr);
  assert.equal(imported.stdout, '');
  assert.equal(imported.stderr, '');
});

test('explicit CLI output is exclusive and cannot overwrite existing evidence', () => {
  const directory = mkdtempSync(join(tmpdir(), 'gate-001-legacy-test-'));
  try {
    const output = join(directory, 'new-regrade.json');
    const first = spawnSync(process.execPath, [cli, '--output', output], { encoding: 'utf8', timeout: 5000 });
    assert.equal(first.status, 0, first.stderr);
    const retained = readFileSync(output);
    const second = spawnSync(process.execPath, [cli, '--output', output], { encoding: 'utf8', timeout: 5000 });
    assert.equal(second.status, 1);
    assert.match(second.stderr, /EEXIST/);
    assert.deepEqual(readFileSync(output), retained);
    const badArgs = spawnSync(process.execPath, [cli, '--replace', output], { encoding: 'utf8', timeout: 5000 });
    assert.equal(badArgs.status, 1);
    assert.match(badArgs.stderr, /Usage:/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
