import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  AIE_CAPABILITIES,
  buildAutonomousInvestmentEngineConfiguration,
  createAutonomousInvestmentEngine,
  resetAutonomousInvestmentEngineForTesting,
} from "../../autonomous-investment-engine/index.js";
import { createEmpireIntelligenceFrameworkEngine } from "../../empire-intelligence-framework/engine.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function buildEngine(withFramework = false) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const framework = withFramework ? createEmpireIntelligenceFrameworkEngine(bootstrap) : null;
  if (framework) await framework.initialize();
  const engine = createAutonomousInvestmentEngine(bootstrap, { empireIntelligenceFramework: framework });
  await engine.initialize();
  engine.connectAutonomousInvestmentEngine();
  return { engine, framework };
}

describe("X5-12 Autonomous Investment Engine", () => {
  beforeEach(resetAutonomousInvestmentEngineForTesting);

  test("1 locks mandatory safety flags", () => {
    const c = buildAutonomousInvestmentEngineConfiguration(REPO_ROOT, {
      neverExecuteInvestmentsWithoutGovernanceApproval: false as never,
    });
    assert.equal(c.neverExecuteInvestmentsWithoutGovernanceApproval, true);
    assert.equal(c.neverExposeCredentials, true);
    assert.equal(c.neverExposeAuthenticationTokens, true);
  });

  test("2 initializes PILLOW-AIE-001 for X5-12", async () => {
    const state = (await buildEngine()).engine.getState();
    assert.equal(state.missionId, "X5-12");
    assert.equal(state.engineVersion, "PILLOW-AIE-001");
  });

  test("3 discovers and evaluates investment opportunities", async () => {
    const { engine } = await buildEngine();
    assert.equal(engine.discoverInvestmentOpportunities({ validated: true, investmentTarget: "Region Alpha" }).validation.decision, "pass");
    const evaluated = engine.evaluateInvestmentOpportunities({ validated: true, expectedReturn: 18 });
    assert.equal(evaluated.investmentRecords[0]?.expectedReturn, 18);
  });

  test("4 estimates returns and assesses risks", async () => {
    const { engine } = await buildEngine();
    assert.equal(engine.estimateExpectedInvestmentReturns({ validated: true, expectedReturn: 22 }).investmentRecords[0]?.expectedReturn, 22);
    assert.equal(engine.assessInvestmentRisks({ validated: true, riskScore: 35 }).investmentRecords[0]?.riskScore, 35);
  });

  test("5 prioritizes and recommends strategies", async () => {
    const { engine } = await buildEngine();
    engine.prioritizeInvestmentOpportunities({ validated: true, investmentPriority: 80, investmentTarget: "Beta Fund" });
    assert.equal(engine.recommendInvestmentStrategies().recommendations.length, 1);
  });

  test("6 blocks execution without governance approval", async () => {
    const record = (await buildEngine()).engine.executeGovernanceApprovedInvestmentStrategies({
      validated: true,
      governanceApproved: false,
      investmentTarget: "Gamma Venture",
    }).investmentRecords[0]!;
    assert.equal(record.executionStatus, "blocked");
    assert.equal(record.executedWithoutGovernanceApproval, false);
    assert.equal(record.neverExecuteInvestmentsWithoutGovernanceApproval, true);
  });

  test("7 executes governance-approved investment strategies", async () => {
    const report = (await buildEngine()).engine.executeGovernanceApprovedInvestmentStrategies({
      validated: true,
      governanceApproved: true,
      riskScore: 20,
      investmentTarget: "Delta Expansion",
    });
    assert.equal(report.validation.decision, "pass");
    assert.equal(report.investmentRecords[0]?.executionStatus, "executed");
    assert.equal(report.investmentRecords[0]?.governanceApproved, true);
    assert.equal(report.investmentRecords[0]?.executedWithoutGovernanceApproval, false);
  });

  test("8 monitors performance and detects underperformance", async () => {
    const { engine } = await buildEngine();
    assert.equal(engine.monitorInvestmentPerformance({ validated: true }).validation.decision, "pass");
    assert.equal(
      engine.detectUnderperformingInvestments({ validated: true, underperformingHint: true }).investmentRecords[0]?.executionStatus,
      "underperforming",
    );
  });

  test("9 preserves investment traceability", async () => {
    const record = (await buildEngine()).engine.discoverInvestmentOpportunities({ validated: true }).investmentRecords[0]!;
    assert.ok(record.investmentTraceId.startsWith("aie-trace-"));
    assert.equal(record.preserveInvestmentTraceability, true);
    assert.equal(record.maskSensitiveValues, true);
  });

  test("10 registers with EIF and provides diagnostics", async () => {
    const { engine, framework } = await buildEngine(true);
    assert.equal(engine.getInvestmentRecords().length, 0);
    assert.ok(engine.getEngineRecord()?.frameworkModuleId);
    assert.ok(framework?.getFrameworkRecords().some((r) => r.intelligenceModuleIdentifier === "autonomous-investment-engine"));
    assert.notEqual(engine.runDiagnostics().validation.decision, "fail");
    assert.equal(engine.validateForSupervisorSync().valid, true);
    assert.ok(engine.getCockpitSnapshot().frameworkRegistered);
    assert.ok(AIE_CAPABILITIES.includes("investment_validation"));
  });
});
