/**
 * Reconcile the immutable Pass 2 receipt with GATE-001's evidence requirements.
 * This is an evidence regrade, not a new soak or a replay of capability oracles.
 * Importing this module performs no I/O. The CLI prints by default; --output
 * creates a new file exclusively and never overwrites an existing receipt.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const EVIDENCE_SEAL = '21384342c401def948926904913840e63c18dff7';
export const SEALED_SOURCE_SHA256 = '6141a7b91ab5932f4e22c5613ef3a95c002d7c8db800c4f342c2c8236bfbd45f';
export const LEGACY_SOURCE_PATH = 'docs/audits/capability-extraction/EXEC_CAP_CLOSURE_20260917/CLOSURE_PASS_2/SOAK_RESULTS.json';
export const PRIOR_AUDIT = Object.freeze({
  url: 'https://github.com/empireaios/EmpireAI/blob/644afc6685b1b7d5723cc14049e925f9fae78bdd/docs/audits/pillow-birth/PILLOW_BIRTH_REPOSITORY_AUDIT_20260919.md',
  sha256: '6c917814bbdfdae85122c382ba60a3b6658ab92089be3cb9f0cd818addf754d8',
  section: 'All 17 failed rows',
  scope: 'Prior repository-audit diagnosis, not independent full-response regrading in GATE-001',
});

const SPECIAL_DIAGNOSES = Object.freeze({
  pcr_dd9f952ef51740cc: ['HARNESS_FAILURE', 'Duplicate logical O08 submission after artifact-write failure'],
  pcr_00473d45437a4e1d: ['HARNESS_FAILURE', 'M3 step 1 has a contradictory two-line-plus-token contract'],
  pcr_e2c89fac9a5142a1: ['DOWNSTREAM_INCONCLUSIVE', 'M2 step 1 failed before continuation'],
  pcr_b00b10a8e38c40fd: ['DOWNSTREAM_INCONCLUSIVE', 'M3 step 1 did not establish a valid checkpoint'],
});

const PRODUCT_REQUEST_IDS = new Set([
  'pcr_66f12b4c89324cd3', 'pcr_e11c0845ae5c4fe9', 'pcr_99d1bd420fd44bbc',
  'pcr_841d0f52a84a4390', 'pcr_3f940d6ac9014970', 'pcr_e818e6bd4466431e',
  'pcr_c579eaa3e6a54963', 'pcr_e61e59f6877747a2', 'pcr_aec775c9e1fe470d',
  'pcr_7e80d296b2704fcf', 'pcr_adedce4fd8b544b8', 'pcr_c5b858308c534e9a',
  'pcr_377648d5ab724eb1',
]);

export function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

/** No oracle is executed against textHead: an omitted tail cannot be recovered. */
export function assessLegacyRow(row, sourceRowIndex) {
  return {
    sourceRowIndex,
    logicalCaseId: row.id,
    requestId: row.requestId ?? null,
    kind: row.kind,
    legacyReportedOk: row.ok === true,
    legacyReportedAdmitted: row.admitted === true,
    legacyReportedUseful: row.useful === true,
    textHead: row.textHead ?? null,
    responseEvidence: 'TEXT_HEAD_ONLY_TRUNCATED_OR_UNPROVEN',
    completeResponseRetained: false,
    textHeadPotentiallyTruncated: true,
    independentOracleRegrade: 'NOT_POSSIBLE_WITH_RETAINED_EVIDENCE',
    gateQualifies: false,
    reasons: [
      ...(row.ok === false ? ['LEGACY_REPORTED_CHECK_FAILED'] : []),
      'COMPLETE_RESPONSE_NOT_RETAINED',
      'VERSIONED_EXPECTED_CHECK_AND_ORACLE_TRACE_NOT_RETAINED',
      'PER_CASE_RESPONSE_HASH_AND_EXECUTION_TUPLE_NOT_RETAINED',
    ],
  };
}

function priorDiagnosis(row) {
  const special = SPECIAL_DIAGNOSES[row.requestId];
  if (special) return { classification: special[0], detail: special[1], basis: 'PRIOR_REPOSITORY_AUDIT' };
  if (PRODUCT_REQUEST_IDS.has(row.requestId)) {
    return { classification: 'PRODUCT_FAILURE', detail: 'Classified as a confirmed product failure by the prior repository audit', basis: 'PRIOR_REPOSITORY_AUDIT' };
  }
  return { classification: 'REPORTED_NOT_DIAGNOSED', detail: 'No matching diagnosis in the referenced prior audit', basis: 'LEGACY_REPORTED_RESULT_ONLY' };
}

export function regradeLegacyBytes(sourceBytes) {
  const digest = sha256(sourceBytes);
  if (digest !== SEALED_SOURCE_SHA256) throw new Error(`SEALED_SOURCE_HASH_MISMATCH: expected ${SEALED_SOURCE_SHA256}, received ${digest}`);
  const source = JSON.parse(sourceBytes.toString('utf8'));
  if (!Array.isArray(source.results)) throw new Error('LEGACY_RESULTS_MISSING');
  const substantive = source.results.filter((row) => row.kind === 'ordinary' || row.kind === 'mission');
  const failures = source.results.flatMap((row, sourceRowIndex) => row.ok === false
    ? [{ ...assessLegacyRow(row, sourceRowIndex), priorAuditDiagnosis: priorDiagnosis(row) }]
    : []);
  const grouped = new Map();
  source.results.forEach((row, sourceRowIndex) => {
    const occurrences = grouped.get(row.id) ?? [];
    occurrences.push({ sourceRowIndex, requestId: row.requestId ?? null, legacyReportedOk: row.ok === true });
    grouped.set(row.id, occurrences);
  });
  const duplicateLogicalCases = [...grouped].filter(([, rows]) => rows.length > 1)
    .map(([logicalCaseId, occurrences]) => ({ logicalCaseId, occurrences }));
  const classificationCounts = Object.fromEntries(['PRODUCT_FAILURE', 'HARNESS_FAILURE', 'DOWNSTREAM_INCONCLUSIVE', 'REPORTED_NOT_DIAGNOSED']
    .map((classification) => [classification, failures.filter((row) => row.priorAuditDiagnosis.classification === classification).length]));
  return {
    schemaVersion: 'gate-001-historical-regrade/v1',
    regradeId: 'GATE-001-PASS2-SEALED-HISTORICAL-REGRADE',
    source: { path: LEGACY_SOURCE_PATH, evidenceSeal: EVIDENCE_SEAL, sha256: digest, mutated: false },
    priorAudit: PRIOR_AUDIT,
    method: 'Count retained rows, reconcile reported criteria, and apply current evidence sufficiency rules. No production calls, fresh soak, full-response reconstruction, or independent capability certification.',
    verdict: 'NONQUALIFYING_LEGACY_EVIDENCE',
    pass: false,
    legacyReportedTransport: {
      verdict: source.pass === true ? 'PASS_REPORTED_BY_LEGACY_GATE' : 'FAIL_REPORTED_BY_LEGACY_GATE',
      independentlyRerun: false,
      durationMinutes: source.elapsedMin,
      lostAdmitted: source.lostAdmitted,
      p95Milliseconds: source.stats.p95,
      durableRetrievableRate: source.stats.durableRetrievableRate,
      restartRetrievalStatus: source.workerRestart.retrieveAfter.status,
      candidateSha: source.workerRestart.before.sha,
      deploymentId: source.workerRestart.before.deployId,
      originalCriteria: source.criteria,
    },
    capability: {
      verdict: 'FAIL_BY_REPORTED_CHECKS',
      admitted: source.results.filter((row) => row.admitted).length,
      substantiveChecks: substantive.length,
      substantiveReportedPassed: substantive.filter((row) => row.ok === true).length,
      substantiveReportedFailed: substantive.filter((row) => row.ok === false).length,
      ordinaryRows: source.results.filter((row) => row.kind === 'ordinary').length,
      missionStepRows: source.results.filter((row) => row.kind === 'mission').length,
      fillRows: source.results.filter((row) => row.kind === 'fill').length,
      failedRows: failures.length,
      classificationCounts,
      freshProductFixOrCertificationProven: false,
    },
    currentGateFailures: [
      'SEVENTEEN_REPORTED_SUBSTANTIVE_CHECK_FAILURES',
      'REQUIRED_MISSION_STEPS_DID_NOT_ALL_PASS',
      'THREE_DUPLICATED_LOGICAL_CASE_IDS_WITH_DIFFERENT_REQUEST_IDS',
      'COMPLETE_SCRUBBED_RESPONSES_AND_RESPONSE_HASHES_NOT_RETAINED',
      'VERSIONED_CHECK_IDS_ORACLE_TRACES_RESULT_KINDS_AND_PER_CASE_EXECUTION_TUPLES_NOT_RETAINED',
    ],
    duplicateLogicalCases,
    failures,
    preservedLocks: { waveCredit: 0, birth: 'NOT_BORN', realCommerce: 'locked' },
    nextAction: 'Repair the identified capability families and harness cases; prove local semantic fixtures before a separately authorized live soak. Transport PASS alone is not engineering-candidate readiness or Birth certification.',
  };
}

export function main(args = process.argv.slice(2)) {
  if (args.length !== 0 && !(args.length === 2 && args[0] === '--output' && args[1])) {
    throw new Error('Usage: node regrade-legacy.mjs [--output NEW_FILE.json]');
  }
  const sourcePath = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'SOAK_RESULTS.json');
  const text = `${JSON.stringify(regradeLegacyBytes(readFileSync(sourcePath)), null, 2)}\n`;
  if (args.length === 0) process.stdout.write(text);
  else writeFileSync(resolve(args[1]), text, { flag: 'wx', encoding: 'utf8' });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
