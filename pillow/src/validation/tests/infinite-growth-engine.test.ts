import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  buildInfiniteGrowthEngineConfiguration,
  createInfiniteGrowthEngine,
  IGE_CAPABILITIES,
  resetInfiniteGrowthEngineForTesting,
} from "../../infinite-growth-engine/index.js";
import { createEmpireIntelligenceFrameworkEngine } from "../../empire-intelligence-framework/engine.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function buildEngine(withFramework = false) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const framework = withFramework ? createEmpireIntelligenceFrameworkEngine(bootstrap) : null;
  if (framework) await framework.initialize();
  const engine = createInfiniteGrowthEngine(bootstrap, { empireIntelligenceFramework: framework });
  await engine.initialize();
  engine.connectInfiniteGrowthEngine();
  return { engine, framework };
}

describe("X5-19 Infinite Growth Engine", () => {
  beforeEach(resetInfiniteGrowthEngineForTesting);

  test("1 locks mandatory safety flags", () => {
    const c = buildInfiniteGrowthEngineConfiguration(REPO_ROOT, {
      neverSacrificeConstitutionalGovernanceForGrowth: false as never,
      neverReduceOperationalQualityToIncreaseGrowth: false as never,
    });
    assert.equal(c.neverSacrificeConstitutionalGovernanceForGrowth, true);
    assert.equal(c.neverReduceOperationalQualityToIncreaseGrowth, true);
    assert.equal(c.neverExposeCredentials, true);
  });

  test("2 initializes PILLOW-IGE-001 for X5-19", async () => {
    const state = (await buildEngine()).engine.getState();
    assert.equal(state.missionId, "X5-19");
    assert.equal(state.engineVersion, "PILLOW-IGE-001");
  });

  test("3 monitors long-term enterprise growth", async () => {
    assert.equal((await buildEngine()).engine.monitorLongTermEnterpriseGrowth({ validated: true }).validation.decision, "pass");
  });

  test("4 evaluates scalability governance and operational sustainability", async () => {
    const { engine } = await buildEngine();
    assert.equal(engine.evaluateEnterpriseScalability({ validated: true, sustainabilityScore: 80 }).growthRecords[0]?.sustainabilityScore, 80);
    assert.equal(engine.evaluateGovernanceSustainability({ validated: true, governanceScore: 90 }).growthRecords[0]?.governanceScore, 90);
    assert.equal(engine.evaluateOperationalSustainability({ validated: true, operationalScore: 85 }).growthRecords[0]?.operationalScore, 85);
  });

  test("5 detects growth constraints and governance operational risks", async () => {
    const { engine } = await buildEngine();
    assert.ok(engine.detectLongTermGrowthConstraints({ validated: true }).growthRecords[0]?.growthCategory.includes("constraint"));
    assert.ok(engine.detectLongTermGovernanceRisks({ validated: true }).growthRecords[0]?.governanceScore <= 55);
    assert.ok(engine.detectLongTermOperationalRisks({ validated: true }).growthRecords[0]?.operationalScore <= 55);
  });

  test("6 ranks opportunities and generates recommendations", async () => {
    const { engine } = await buildEngine();
    engine.rankSustainableGrowthOpportunities({ validated: true, growthPriority: 80 });
    assert.equal(engine.generateLongTermGrowthRecommendations().recommendations.length, 1);
  });

  test("7 never sacrifices governance or operational quality for growth", async () => {
    const report = (await buildEngine()).engine.monitorLongTermEnterpriseGrowth({
      validated: true,
      sacrificeGovernanceForGrowth: true,
      reduceOperationalQualityForGrowth: true,
    });
    assert.equal(report.validation.decision, "fail");
    assert.equal(report.growthRecords[0]?.sacrificedConstitutionalGovernanceForGrowth, false);
    assert.equal(report.growthRecords[0]?.reducedOperationalQualityForGrowth, false);
    assert.equal(report.growthRecords[0]?.neverSacrificeConstitutionalGovernanceForGrowth, true);
    assert.equal(report.growthRecords[0]?.neverReduceOperationalQualityToIncreaseGrowth, true);
  });

  test("8 produces machine-readable growth records", async () => {
    const record = (await buildEngine()).engine.evaluateEnterpriseScalability({
      validated: true,
      enterpriseScope: "global portfolio",
    }).growthRecords[0]!;
    assert.equal(record.enterpriseScope, "global portfolio");
    assert.ok(record.growthRecordId.startsWith("ige-"));
  });

  test("9 preserves growth traceability", async () => {
    const record = (await buildEngine()).engine.monitorLongTermEnterpriseGrowth({ validated: true }).growthRecords[0]!;
    assert.ok(record.growthTraceId.startsWith("ige-trace-"));
    assert.equal(record.preserveGrowthTraceability, true);
    assert.equal(record.maskSensitiveValues, true);
  });

  test("10 registers with EIF and provides diagnostics", async () => {
    const { engine, framework } = await buildEngine(true);
    assert.equal(engine.getGrowthRecords().length, 0);
    assert.ok(engine.getEngineRecord()?.frameworkModuleId);
    assert.ok(framework?.getFrameworkRecords().some((r) => r.intelligenceModuleIdentifier === "infinite-growth-engine"));
    assert.notEqual(engine.runDiagnostics().validation.decision, "fail");
    assert.equal(engine.validateForSupervisorSync().valid, true);
    assert.ok(engine.getCockpitSnapshot().frameworkRegistered);
    assert.ok(IGE_CAPABILITIES.includes("growth_validation"));
  });
});
