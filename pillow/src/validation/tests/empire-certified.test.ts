import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { CERTIFIED_MODULE_IDS, PROGRAMME_ANCHOR_IDS } from "../../empire-certified/paths.js";
import { createEmpireCertified, resetEmpireCertifiedForTesting } from "../../empire-certified/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const dependencies = Object.fromEntries(
    [...PROGRAMME_ANCHOR_IDS, ...CERTIFIED_MODULE_IDS].map((id) => [id, { getState: () => ({ id }) }]),
  ) as any;
  const engine = createEmpireCertified(bootstrap, dependencies);
  await engine.initialize();
  return engine;
}

describe("X5-20 Empire Certified", () => {
  beforeEach(resetEmpireCertifiedForTesting);

  test("locks safety guards", async () => {
    const engine = await build();
    const c = engine.getState().configuration;
    assert.equal(c.safeTestMode, true);
    assert.equal(c.neverExposeCredentials, true);
    assert.equal(c.preserveConstitutionalIntegrity, true);
  });

  test("initializes with governance doctrine", async () => {
    assert.equal((await build()).getState().missionId, "X5-20");
  });

  test("connects empire certification", async () => {
    assert.equal((await build()).connectEmpireCertified().validation.decision, "pass");
  });

  test("validates X1 through X5 programmes and nineteen empire modules", async () => {
    const r = (await build()).validateAllProgrammes({ validated: true });
    const report = r.certificationReports[0]!;
    assert.equal(report.validationResultsX1ThroughX5.length, 5);
    assert.equal(report.validationResultsEmpireIntelligenceModules.length, 19);
    assert.equal(r.validation.decision, "pass");
  });

  test("validates cross-programme integration", async () => {
    assert.equal((await build()).validateCrossProgrammeIntegration({ validated: true }).validation.decision, "pass");
  });

  test("validates constitutional governance", async () => {
    assert.equal((await build()).validateConstitutionalGovernance({ validated: true }).validation.decision, "pass");
  });

  test("validates enterprise intelligence and end-to-end workflow", async () => {
    const engine = await build();
    assert.equal(engine.validateEnterpriseIntelligenceCapability({ validated: true }).validation.decision, "pass");
    assert.equal(engine.validateEndToEndEnterpriseWorkflow({ validated: true }).validation.decision, "pass");
  });

  test("generates a certified report", async () => {
    const r = (await build()).generateCertificationReport({ validated: true });
    assert.equal(r.certificationReports[0]!.certificationStatus, "certified");
    assert.equal(r.certificationReports[0]!.metadataVersion, "EC-001-v1");
  });

  test("rejects unvalidated operation", async () => {
    assert.equal((await build()).validateAllProgrammes({ validated: false }).validation.decision, "fail");
  });

  test("reports health and recovery-safe diagnostics", async () => {
    const e = await build();
    e.connectEmpireCertified();
    assert.equal(e.runDiagnostics().validation.decision, "pass");
    assert.equal(e.validateForSupervisorSync().health, "healthy");
  });
});
