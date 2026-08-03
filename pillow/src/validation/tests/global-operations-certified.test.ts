import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { CERTIFIED_MODULE_IDS } from "../../global-operations-certified/paths.js";
import { createGlobalOperationsCertified, resetGlobalOperationsCertifiedForTesting } from "../../global-operations-certified/index.js";
const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");
async function build() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const dependencies = Object.fromEntries(CERTIFIED_MODULE_IDS.map((id) => [id, { getState: () => ({ id }) }])) as any;
  const engine = createGlobalOperationsCertified(bootstrap, dependencies); await engine.initialize(); return engine;
}
describe("X4-19 Global Operations Certified", () => {
  beforeEach(resetGlobalOperationsCertifiedForTesting);
  test("locks safety guards", async () => { const engine = await build(); const c = engine.getState().configuration; assert.equal(c.safeTestMode, true); assert.equal(c.neverExposeCredentials, true); });
  test("initializes with governance doctrine", async () => { assert.equal((await build()).getState().missionId, "X4-19"); });
  test("connects global operations certification", async () => { assert.equal((await build()).connectGlobalOperationsCertified().validation.decision, "pass"); });
  test("validates all eighteen modules", async () => { const r = (await build()).validateAllModules({ validated: true }); assert.equal(r.certificationReports[0]!.validationResultsX401ToX418.length, 18); });
  test("validates cross-module integration", async () => { assert.equal((await build()).validateCrossModuleIntegration({ validated: true }).validation.decision, "pass"); });
  test("validates end-to-end global workflow", async () => { assert.equal((await build()).validateEndToEndGlobalWorkflow({ validated: true }).validation.decision, "pass"); });
  test("validates executive governance", async () => { assert.equal((await build()).validateExecutiveGovernance({ validated: true }).validation.decision, "pass"); });
  test("generates a certified report", async () => { const r = (await build()).generateCertificationReport({ validated: true }); assert.equal(r.certificationReports[0]!.overallCertificationStatus, "certified"); });
  test("rejects unvalidated operation", async () => { assert.equal((await build()).validateAllModules({ validated: false }).validation.decision, "fail"); });
  test("reports health and recovery-safe diagnostics", async () => { const e = await build(); e.connectGlobalOperationsCertified(); assert.equal(e.runDiagnostics().validation.decision, "pass"); assert.equal(e.validateForSupervisorSync().health, "healthy"); });
});
