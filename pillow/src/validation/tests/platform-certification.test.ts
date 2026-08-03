import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { PLATFORM_MISSIONS, buildPlatformCertificationConfiguration, createPlatformCertification, resetPlatformCertificationForTesting } from "../../platform-certification/index.js";

const ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");
const controlledWorker = () => ({ getState: () => ({ ready: true }), diagnostics: () => ({ healthy: true }), runPlatformCertificationScenario: () => ({ success: true }), evaluateAccess: () => false, authenticate: () => ({ accepted: false }) });
function completeDependencies() {
  return Object.fromEntries(PLATFORM_MISSIONS.map((m) => [m.dependencyKey, controlledWorker()]));
}
async function build(dependencies = completeDependencies()) {
  const bootstrap = await runBootstrap({ repositoryRoot: ROOT, skipHeavyScans: true });
  const engine = createPlatformCertification(bootstrap, { dependencies });
  await engine.initialize(); engine.connect(); return engine;
}
describe("Q6-15 Platform Certification", () => {
  beforeEach(resetPlatformCertificationForTesting);
  test("1 locks mandatory boundaries", () => {
    const c = buildPlatformCertificationConfiguration(ROOT, { neverFabricateCertificationSuccess: false as never, neverImplementQ7OrLater: false as never });
    assert.equal(c.neverFabricateCertificationSuccess, true); assert.equal(c.neverImplementQ7OrLater, true);
  });
  test("2 initializes PILLOW-PFC-001 Q6-15", async () => { const e = await build(); assert.equal(e.getState().missionId, "Q6-15"); assert.equal(e.getState().engineVersion, "PILLOW-PFC-001"); });
  test("3 mission matrix covers Q6-01 through Q6-14", async () => { assert.equal((await (await build()).verifyMissions()).length, 14); });
  test("4 missing worker cannot be Certified", async () => {
    const deps = completeDependencies(); delete deps.authenticationWorker;
    const row = (await (await build(deps)).verifyMissions()).find((m) => m.missionId === "Q6-07")!;
    assert.notEqual(row.status, "Certified");
  });
  test("5 repository evidence includes all mission rows", async () => { assert.equal((await (await build()).collectRepositoryEvidence()).size, 14); });
  test("6 negative unauthorized boundary is checked fail-closed", async () => { const checks = await (await build()).runNegativeChecks(); assert.ok(checks.find((c) => c.checkId === "pfc-chk-unauthorized_access")!.passed); });
  test("7 deployment failure safety is checked", async () => { const checks = await (await build()).runNegativeChecks(); assert.ok(checks.find((c) => c.checkId === "pfc-chk-deployment_failure")!.safetyBehavior); });
  test("8 rejects fabricated certification success", async () => { const e = await build(); assert.equal(e.validate({ fabricateCertificationSuccess: true }).valid, false); });
  test("9 controlled full-worker end-to-end observes critical outcomes", async () => { const outcomes = await (await build()).runEndToEndScenario(); assert.ok(outcomes.every((outcome) => outcome.passed)); });
  test("10 gates never certify critical failure", async () => { const e = await build(); const matrix = await e.verifyMissions(); matrix[0]!.status = "Failed"; assert.notEqual(e.evaluateCertificationGates(matrix, [], []), "Certified"); });
  test("11 report has required fields and matrix", async () => { const report = await (await build()).producePlatformCertificationReport(); assert.ok(report.certificationId.startsWith("pfc-cert-")); assert.equal(report.missionVerificationMatrix.length, 14); assert.equal(report.metadataVersion, "PFC-001-v1"); });
  test("12 rejects Q7 and exposes Q6-15 cockpit", async () => { const e = await build(); assert.equal(e.validate({ missionId: "Q7-01" }).valid, false); assert.equal(e.getCockpitSnapshot().missionId, "Q6-15"); });
  test("13 submit report records ERR result when available", async () => {
    const deps = { ...completeDependencies(), executiveReportingRuntime: { submitWorkerReport: () => ({ records: [{ reportId: "ert-pfc-001" }] }) } };
    const report = await (await build(deps)).submitReport(); assert.equal(report.submittedToExecutiveReporting, true); assert.equal(report.executiveReportId, "ert-pfc-001");
  });
});
