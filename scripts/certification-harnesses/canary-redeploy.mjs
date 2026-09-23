import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const probe = require('../../deployment/canary-runtime-probe.cjs');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const PROD_SERVICE = 'c3c89cbb-3e10-414a-98a2-f9ec4f1f840e';
const HASH = /^[a-f0-9]{64}$/, COMMIT = /^[a-f0-9]{40}$/;
const UUID = /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/;
const finiteTime = v => typeof v === 'string' && Number.isFinite(Date.parse(v));
const named = (receipt, name) => receipt.checks.find(c => c.name === name);
function must(value, label) { if (!value) throw new Error(label); }
function phaseReceipt(r, phase, expected) {
  must(r?.schema === 'empireai-bounded-canary-probe-v2' && r.phase === phase, 'CANONICAL_PROBE_SHAPE_REQUIRED');
  must(r.service === expected.serviceId && r.service !== PROD_SERVICE && UUID.test(r.service) &&
    r.commit === expected.sourceCommit && COMMIT.test(r.commit) && r.probeSha === expected.probeSha256, 'SOURCE_OR_SERVICE_MISMATCH');
  must(Array.isArray(r.checks) && r.checks.length <= 100 && r.checks.every(c => c && typeof c.name === 'string' && c.pass === true), 'FAILED_OR_MALFORMED_CHECK');
  const summary = probe.summarize(phase, r.checks);
  must(summary.passed && r.passed === true && JSON.stringify(r.requiredChecks) === JSON.stringify(probe.REQUIRED[phase]) &&
    Array.isArray(r.missingRequiredChecks) && r.missingRequiredChecks.length === 0 &&
    Array.isArray(r.duplicateChecks) && r.duplicateChecks.length === 0, 'MISSING_DUPLICATE_OR_FORGED_SUMMARY');
  must(r.checks.length === probe.REQUIRED[phase].length &&
    r.checks.every(c => probe.REQUIRED[phase].includes(c.name)), 'UNKNOWN_CHECK');
  must(r.birthCertificationGranted === false && r.commerceAuthorized === false &&
    r.productionReadiness === 'NOT_PROVEN' && Object.values(r.additionalRequiredProof ?? {}).length === 6 &&
    Object.values(r.additionalRequiredProof).every(v => v === 'NOT_PROVEN'), 'SCOPE_OVERCLAIM');
  must(finiteTime(r.startedAt) && finiteTime(r.finishedAt) && finiteTime(r.expiresAt) &&
    Date.parse(r.startedAt) <= Date.parse(r.finishedAt) && Date.parse(r.finishedAt) < Date.parse(r.expiresAt), 'INVALID_TIME_BOUND');
  must(UUID.test(r.deploymentId) && r.nodeVersion === '22.23.2', 'RUNTIME_IDENTITY_MISMATCH');
  const scope = named(r, 'scope_and_runtime'), launch = named(r, 'launcher_identity');
  must(scope.actualProbeSha256 === expected.probeSha256 && scope.actualNodeVersion === r.nodeVersion &&
    launch.launcherSha256 === expected.launcherSha256 && UUID.test(launch.launchId) &&
    Number.isInteger(launch.childPid) && launch.childPid > 0, 'LAUNCH_IDENTITY_MISMATCH');
}
function observations(r, raw, marker) {
  must(raw && raw.schema === 'canary-sanitized-observations-v1', 'SANITIZED_RAW_OBSERVATIONS_REQUIRED');
  must(raw.deploymentId === r.deploymentId && raw.serviceId === r.service && raw.sourceCommit === r.commit &&
    raw.probeSha256 === r.probeSha, 'OBSERVATION_SCOPE_MISMATCH');
  for (const role of ['founder', 'admin']) {
    must(typeof marker.accountIds?.[role] === 'string' && typeof marker.databaseAccountIds?.[role] === 'string', 'MISSING_ACCOUNT_IDENTITIES');
    must(raw.accounts?.primary?.[role]?.id === marker.accountIds[role] &&
      raw.accounts.primary[role].role === role &&
      raw.accounts?.worker?.[role]?.id === marker.databaseAccountIds[role] &&
      raw.accounts.worker[role].role === role, 'AUTHENTICATED_ACCOUNT_IDENTITY_MISMATCH');
  }
  must(marker.accountIds.founder !== marker.accountIds.admin &&
    marker.databaseAccountIds.founder !== marker.databaseAccountIds.admin, 'ROLE_IDENTITY_COLLISION');
  must(probe.birthPass(raw.birth) && probe.readinessPass(raw.readiness), 'RAW_AUTHORITY_OR_READINESS_FAILED');
  must(raw.missionSha256 === marker.missionDigest && probe.unchangedMission(raw.mission, { ...marker, missionDigest: sha(JSON.stringify(raw.mission)) }), 'RAW_MISSION_CHANGED');
  must(raw.native?.integrity === 'ok' && HASH.test(raw.native.envelopeSha256) &&
    Number.isInteger(raw.native.bytes) && raw.native.bytes > 0 &&
    raw.native.missionSha256 === marker.missionDigest && probe.unchangedMission(raw.native.mission, { ...marker, missionDigest: sha(JSON.stringify(raw.native.mission)) }), 'RAW_NATIVE_MISSION_INVALID');
  const nativeCheck = named(r, 'native_mission_history');
  must(nativeCheck.envelopeSha256 === raw.native.envelopeSha256 && nativeCheck.revision === raw.native.revision &&
    nativeCheck.bytes === raw.native.bytes, 'NATIVE_SUMMARY_MISMATCH');
  must(probe.authorityPass(raw.authority, marker.requestId, marker.accountIds.founder), 'RAW_AUTHORITY_RESULT_FAILED');
  must(probe.failurePass(raw.failure, marker.failedRequestId, marker.accountIds.founder), 'RAW_EXPECTED_FAILURE_FAILED');
  must(raw.authorityResultSha256 === marker.authorityDigest, 'AUTHORITY_DIGEST_MISMATCH');
  const q = raw.failure.data.request;
  must(raw.failureResultSha256 === marker.failureDigest, 'FAILURE_DIGEST_MISMATCH');
  must(raw.requestOwnerIsolationStatus === 404 && raw.crossWorkspaceStatus === 403, 'RAW_ISOLATION_FAILED');
}
export function verifyRedeployPair(bundle, expected) {
  const errors = [];
  const result = { schema:'pillow-canary-redeploy-support-v1', scope:'same-source orderly application redeploy only',
    supportingEvidenceVerified:false, certificationCredit:0, birthAuthorized:false, commerceAuthorized:false,
    fullRequirementAcceptance:false, unproven:['old-production-quiescence','redis-restart','abrupt-kill','power-loss',
      'coordinated-volume-restore','unattended-soak','same-binary-image','model-quality','real-commerce'], errors };
  try {
    must(bundle?.schema === 'pillow-canary-redeploy-bundle-v1', 'BUNDLE_SCHEMA_REQUIRED');
    must(expected && COMMIT.test(expected.sourceCommit) && UUID.test(expected.serviceId) &&
      HASH.test(expected.probeSha256) && HASH.test(expected.launcherSha256), 'TRUSTED_EXPECTED_IDENTITY_REQUIRED');
    const { before, after } = bundle;
    const marker = bundle.marker ?? before.restartMarker;
    phaseReceipt(before, 'before', expected); phaseReceipt(after, 'after', expected);
    must(before.deploymentId !== after.deploymentId && named(before,'launcher_identity').launchId !== named(after,'launcher_identity').launchId,
      'NEW_DEPLOYMENT_AND_BOOT_REQUIRED');
    must(before.expiresAt === after.expiresAt && Date.parse(before.finishedAt) < Date.parse(after.startedAt), 'PAIR_TIME_OR_EXPIRY_MISMATCH');
    must(marker?.schema === 'canary-restart-marker-v2' && marker.beforePassed === true &&
      marker.service === before.service && marker.commit === before.commit && marker.probeSha === before.probeSha &&
      marker.expiresAt === before.expiresAt && marker.beforeDeploymentId === before.deploymentId &&
      marker.beforeLaunchId === named(before,'launcher_identity').launchId, 'MARKER_SCOPE_MISMATCH');
    const restart = named(after,'same_candidate_restarted');
    must(restart.beforeDeploymentId === before.deploymentId && restart.afterDeploymentId === after.deploymentId, 'RESTART_CHECK_MISMATCH');
    observations(before, (bundle.observations?.before ?? before.observations), marker);
    observations(after, (bundle.observations?.after ?? after.observations), marker);
    must(probe.preservesHistory(marker.nativeBefore, (bundle.observations?.before ?? before.observations).native) &&
      probe.preservesHistory((bundle.observations?.before ?? before.observations).native, (bundle.observations?.after ?? after.observations).native), 'NATIVE_HISTORY_LOST');
    const shutdown = bundle.shutdown;
    must(shutdown?.serviceId === before.service && shutdown.deploymentId === before.deploymentId &&
      Array.isArray(shutdown.records) && shutdown.records.length > 0 && shutdown.records.length <= 10000, 'SCOPED_SHUTDOWN_LOG_REQUIRED');
    const events = shutdown.records;
    must(events.every(e => finiteTime(e.timestamp)), 'SHUTDOWN_TIMESTAMP_REQUIRED');
    const stopped = events.filter(e => e.event === 'bounded_canary_stopped');
    const completed = events.filter(e => (e.event ?? e.msg) === 'primary_shutdown_complete');
    must(stopped.length === 1 && completed.length === 1 && stopped[0].reason === 'signal' &&
      stopped[0].childExitCode === 0 && stopped[0].childSignal === null &&
      stopped[0].forcedTermination === false && stopped[0].forcedSignal === null, 'ORDERLY_SHUTDOWN_NOT_PROVEN');
    must(Date.parse(before.finishedAt) <= Date.parse(completed[0].timestamp) &&
      Date.parse(completed[0].timestamp) <= Date.parse(stopped[0].timestamp) &&
      Date.parse(stopped[0].timestamp) < Date.parse(after.startedAt), 'SHUTDOWN_ORDER_INVALID');
    must(!events.some(e => /shutdown_failed|deadline_exceeded|disconnect_failed/.test(e.event ?? e.msg ?? '') ||
      e.forcedTermination === true || e.signal === 'SIGKILL'), 'FAILED_SHUTDOWN_PRESERVED');
    result.supportingEvidenceVerified = true;
  } catch (error) { errors.push(error instanceof Error ? error.message : 'VERIFICATION_FAILED'); }
  return result;
}
function localJson(filename) {
  const st = fs.lstatSync(filename);
  must(st.isFile() && !st.isSymbolicLink() && st.size <= 8 * 1024 * 1024, 'BOUNDED_REGULAR_ARTIFACT_REQUIRED');
  return JSON.parse(fs.readFileSync(filename, 'utf8'));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [bundlePath, serviceId] = process.argv.slice(2);
    must(bundlePath && UUID.test(serviceId ?? ''), 'USAGE: node scripts/certification-harnesses/canary-redeploy.mjs BUNDLE_JSON SERVICE_UUID');
    const root = fileURLToPath(new URL('../../', import.meta.url));
    const git = spawnSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',windowsHide:true});
    must(git.status === 0, 'SOURCE_COMMIT_UNAVAILABLE');
    const sourceCommit = git.stdout.trim();
    const probeBytes = fs.readFileSync(path.join(root,'deployment/canary-runtime-probe.cjs'));
    const launcherBytes = fs.readFileSync(path.join(root,'deployment/canary-launcher.cjs'));
    for (const [name,bytes] of [['canary-runtime-probe.cjs',probeBytes],['canary-launcher.cjs',launcherBytes]]) {
      const committed = spawnSync('git',['show',sourceCommit + ':deployment/' + name],{cwd:root,maxBuffer:1024*1024,windowsHide:true});
      must(committed.status === 0 && sha(committed.stdout) === sha(bytes), 'CHECKOUT_SOURCE_BYTES_MISMATCH');
    }
    const result = verifyRedeployPair(localJson(path.resolve(bundlePath)),{
      serviceId,sourceCommit,probeSha256:sha(probeBytes),launcherSha256:sha(launcherBytes)});
    console.log(JSON.stringify(result,null,2)); process.exitCode = result.supportingEvidenceVerified ? 0 : 1;
  } catch(error) { console.log(JSON.stringify({supportingEvidenceVerified:false,certificationCredit:0,error:error.message})); process.exitCode=1; }
}
