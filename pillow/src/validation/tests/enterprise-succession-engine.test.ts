import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  buildEnterpriseSuccessionEngineConfiguration,
  createEnterpriseSuccessionEngine,
  ESE_CAPABILITIES,
  resetEnterpriseSuccessionEngineForTesting,
} from "../../enterprise-succession-engine/index.js";
import { createEmpireIntelligenceFrameworkEngine } from "../../empire-intelligence-framework/engine.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function buildEngine(withFramework = false) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const framework = withFramework ? createEmpireIntelligenceFrameworkEngine(bootstrap) : null;
  if (framework) await framework.initialize();
  const engine = createEnterpriseSuccessionEngine(bootstrap, { empireIntelligenceFramework: framework });
  await engine.initialize();
  engine.connectEnterpriseSuccessionEngine();
  return { engine, framework };
}

describe("X5-13 Enterprise Succession Engine", () => {
  beforeEach(resetEnterpriseSuccessionEngineForTesting);

  test("1 locks mandatory safety flags", () => {
    const c = buildEnterpriseSuccessionEngineConfiguration(REPO_ROOT, {
      neverModifyGovernanceApprovedSuccessionPlansAutomatically: false as never,
    });
    assert.equal(c.neverModifyGovernanceApprovedSuccessionPlansAutomatically, true);
    assert.equal(c.neverExposeCredentials, true);
    assert.equal(c.neverExposeAuthenticationTokens, true);
  });

  test("2 initializes PILLOW-ESE-001 for X5-13", async () => {
    const state = (await buildEngine()).engine.getState();
    assert.equal(state.missionId, "X5-13");
    assert.equal(state.engineVersion, "PILLOW-ESE-001");
  });

  test("3 manages enterprise and executive succession plans", async () => {
    const { engine } = await buildEngine();
    assert.equal(engine.manageEnterpriseContinuityPlans({ validated: true, organizationalUnit: "Alpha Division" }).validation.decision, "pass");
    const executive = engine.manageExecutiveSuccessionPlans({ validated: true, successionCategory: "executive succession" });
    assert.equal(executive.successionRecords[0]?.successionCategory, "executive succession");
  });

  test("4 preserves knowledge governance and operational continuity", async () => {
    const { engine } = await buildEngine();
    assert.equal(engine.preserveOrganizationalKnowledge({ validated: true }).validation.decision, "pass");
    assert.equal(engine.preserveGovernanceContinuity({ validated: true }).validation.decision, "pass");
    assert.equal(engine.preserveOperationalContinuity({ validated: true }).validation.decision, "pass");
  });

  test("5 detects succession risks and continuity gaps", async () => {
    const { engine } = await buildEngine();
    assert.equal(engine.detectSuccessionRisks({ validated: true, successionRiskHint: true }).successionRecords[0]?.continuityStatus, "at_risk");
    assert.equal(engine.detectContinuityGaps({ validated: true, gapHint: true }).successionRecords[0]?.continuityStatus, "gap_detected");
  });

  test("6 evaluates succession readiness", async () => {
    const record = (await buildEngine()).engine.evaluateSuccessionReadiness({
      validated: true,
      readinessScore: 92,
    }).successionRecords[0]!;
    assert.equal(record.readinessScore, 92);
    assert.equal(record.continuityStatus, "ready");
  });

  test("7 generates continuity recommendations", async () => {
    const { engine } = await buildEngine();
    engine.detectContinuityGaps({ validated: true, gapHint: true, readinessScore: 20 });
    assert.equal(engine.generateContinuityRecommendations().recommendations.length, 1);
  });

  test("8 never modifies governance-approved succession plans automatically", async () => {
    const report = (await buildEngine()).engine.manageExecutiveSuccessionPlans({
      validated: true,
      modifyGovernanceApprovedPlan: true,
    });
    assert.equal(report.validation.decision, "fail");
    assert.equal(report.successionRecords[0]?.modifiedGovernanceApprovedSuccessionPlan, false);
    assert.equal(report.successionRecords[0]?.neverModifyGovernanceApprovedSuccessionPlansAutomatically, true);
  });

  test("9 preserves succession traceability", async () => {
    const record = (await buildEngine()).engine.manageEnterpriseContinuityPlans({ validated: true }).successionRecords[0]!;
    assert.ok(record.successionTraceId.startsWith("ese-trace-"));
    assert.equal(record.preserveSuccessionTraceability, true);
    assert.equal(record.maskSensitiveValues, true);
  });

  test("10 registers with EIF and provides diagnostics", async () => {
    const { engine, framework } = await buildEngine(true);
    assert.equal(engine.getSuccessionRecords().length, 0);
    assert.ok(engine.getEngineRecord()?.frameworkModuleId);
    assert.ok(framework?.getFrameworkRecords().some((r) => r.intelligenceModuleIdentifier === "enterprise-succession-engine"));
    assert.notEqual(engine.runDiagnostics().validation.decision, "fail");
    assert.equal(engine.validateForSupervisorSync().valid, true);
    assert.ok(engine.getCockpitSnapshot().frameworkRegistered);
    assert.ok(ESE_CAPABILITIES.includes("succession_validation"));
  });
});
