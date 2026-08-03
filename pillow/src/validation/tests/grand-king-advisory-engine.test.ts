import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  buildGrandKingAdvisoryEngineConfiguration,
  createGrandKingAdvisoryEngine,
  GKA_CAPABILITIES,
  resetGrandKingAdvisoryEngineForTesting,
} from "../../grand-king-advisory-engine/index.js";
import { createEmpireIntelligenceFrameworkEngine } from "../../empire-intelligence-framework/engine.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function buildEngine(withFramework = false) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const framework = withFramework ? createEmpireIntelligenceFrameworkEngine(bootstrap) : null;
  if (framework) await framework.initialize();
  const engine = createGrandKingAdvisoryEngine(bootstrap, { empireIntelligenceFramework: framework });
  await engine.initialize();
  engine.connectGrandKingAdvisoryEngine();
  return { engine, framework };
}

describe("X5-15 Grand King Advisory Engine", () => {
  beforeEach(resetGrandKingAdvisoryEngineForTesting);

  test("1 locks mandatory safety flags", () => {
    const c = buildGrandKingAdvisoryEngineConfiguration(REPO_ROOT, {
      neverExecuteExecutiveDecisionsAutomaticallyWithoutApprovedGovernance: false as never,
    });
    assert.equal(c.neverExecuteExecutiveDecisionsAutomaticallyWithoutApprovedGovernance, true);
    assert.equal(c.neverExposeCredentials, true);
    assert.equal(c.neverExposeAuthenticationTokens, true);
  });

  test("2 initializes PILLOW-GKA-001 for X5-15", async () => {
    const state = (await buildEngine()).engine.getState();
    assert.equal(state.missionId, "X5-15");
    assert.equal(state.engineVersion, "PILLOW-GKA-001");
  });

  test("3 analyzes enterprise performance", async () => {
    assert.equal((await buildEngine()).engine.analyzeEnterprisePerformance({ validated: true }).validation.decision, "pass");
  });

  test("4 identifies strategic opportunities and risks", async () => {
    const { engine } = await buildEngine();
    assert.ok(engine.identifyStrategicOpportunities({ validated: true }).advisoryRecords[0]?.strategicCategory.includes("opportunit"));
    assert.ok(engine.identifyStrategicRisks({ validated: true }).advisoryRecords[0]?.strategicCategory.includes("risk"));
  });

  test("5 prioritizes executive decisions", async () => {
    const record = (await buildEngine()).engine.prioritizeExecutiveDecisions({
      validated: true,
      priorityScore: 90,
    }).advisoryRecords[0]!;
    assert.equal(record.priorityScore, 90);
    assert.equal(record.priorityLevel, "critical");
  });

  test("6 recommends capital growth optimization and governance actions", async () => {
    const { engine } = await buildEngine();
    assert.equal(engine.recommendCapitalAllocationStrategies({ validated: true }).validation.decision, "pass");
    assert.equal(engine.recommendGrowthInitiatives({ validated: true }).validation.decision, "pass");
    assert.equal(engine.recommendOptimizationInitiatives({ validated: true }).validation.decision, "pass");
    assert.equal(engine.recommendGovernanceActions({ validated: true }).validation.decision, "pass");
  });

  test("7 tracks outcomes and generates ranked recommendations", async () => {
    const { engine } = await buildEngine();
    engine.prioritizeExecutiveDecisions({ validated: true, priorityScore: 80 });
    assert.equal(engine.trackAdvisoryOutcomes({ validated: true }).validation.decision, "pass");
    assert.equal(engine.generateRankedRecommendations().recommendations.length, 1);
  });

  test("8 never executes executive decisions automatically without approved governance", async () => {
    const report = (await buildEngine()).engine.recommendGovernanceActions({
      validated: true,
      executeDecisionAutomatically: true,
      governanceApproved: false,
    });
    assert.equal(report.validation.decision, "fail");
    assert.equal(report.advisoryRecords[0]?.executedExecutiveDecisionAutomatically, false);
    assert.equal(report.advisoryRecords[0]?.neverExecuteExecutiveDecisionsAutomaticallyWithoutApprovedGovernance, true);
  });

  test("9 preserves advisory traceability", async () => {
    const record = (await buildEngine()).engine.analyzeEnterprisePerformance({ validated: true }).advisoryRecords[0]!;
    assert.ok(record.advisoryTraceId.startsWith("gka-trace-"));
    assert.equal(record.preserveAdvisoryTraceability, true);
    assert.equal(record.maskSensitiveValues, true);
  });

  test("10 registers with EIF and provides diagnostics", async () => {
    const { engine, framework } = await buildEngine(true);
    assert.equal(engine.getAdvisoryRecords().length, 0);
    assert.ok(engine.getEngineRecord()?.frameworkModuleId);
    assert.ok(framework?.getFrameworkRecords().some((r) => r.intelligenceModuleIdentifier === "grand-king-advisory-engine"));
    assert.notEqual(engine.runDiagnostics().validation.decision, "fail");
    assert.equal(engine.validateForSupervisorSync().valid, true);
    assert.ok(engine.getCockpitSnapshot().frameworkRegistered);
    assert.ok(GKA_CAPABILITIES.includes("advisory_validation"));
  });
});
