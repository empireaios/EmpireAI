import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { buildEmpireCapitalAllocationConfiguration, createEmpireCapitalAllocation, ECA_CAPABILITIES, resetEmpireCapitalAllocationForTesting } from "../../empire-capital-allocation/index.js";
import { createEmpireIntelligenceFrameworkEngine } from "../../empire-intelligence-framework/engine.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");
async function buildEngine(withFramework = false) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const framework = withFramework ? createEmpireIntelligenceFrameworkEngine(bootstrap) : null;
  if (framework) await framework.initialize();
  const engine = createEmpireCapitalAllocation(bootstrap, { empireIntelligenceFramework: framework });
  await engine.initialize(); engine.connectEmpireCapitalAllocation(); return { engine, framework };
}
describe("X5-05 Empire Capital Allocation", () => {
  beforeEach(resetEmpireCapitalAllocationForTesting);
  test("locks every capital safety flag", () => { const config = buildEmpireCapitalAllocationConfiguration(REPO_ROOT, { neverExposeCredentials: false as never, neverExecuteCapitalTransfersAutomaticallyWithoutApprovedGovernance: false as never }); assert.equal(config.neverExposeCredentials, true); assert.equal(config.neverExecuteCapitalTransfersAutomaticallyWithoutApprovedGovernance, true); assert.equal(config.preserveAllocationTraceability, true); });
  test("initializes PILLOW-ECA-001 doctrine for X5-05", async () => { const { engine } = await buildEngine(); assert.equal(engine.getState().engineVersion, "PILLOW-ECA-001"); assert.equal(engine.getState().missionId, "X5-05"); });
  test("monitors available enterprise capital", async () => assert.notEqual((await buildEngine()).engine.monitorAvailableEnterpriseCapital({ validated: true, availableCapital: 200 }).validation.decision, "fail"));
  test("monitors capital utilization", async () => assert.equal((await buildEngine()).engine.monitorCapitalUtilization({ validated: true }).validation.decision, "pass"));
  test("evaluates investment opportunities", async () => assert.equal((await buildEngine()).engine.evaluateInvestmentOpportunities({ validated: true, investmentOpportunity: "market entry" }).capitalAllocationRecords[0]?.investmentOpportunity, "market entry"));
  test("estimates return on investment", async () => assert.equal((await buildEngine()).engine.estimateExpectedReturnOnInvestment({ validated: true, expectedRoi: 42 }).capitalAllocationRecords[0]?.expectedRoi, 42));
  test("detects underperformance and capital shortages", async () => { const { engine } = await buildEngine(); assert.equal(engine.detectUnderperformingInvestments({ validated: true }).validation.decision, "pass"); assert.equal(engine.detectCapitalShortages({ validated: true }).validation.decision, "pass"); });
  test("ranks priorities and recommends reallocation", async () => { const { engine } = await buildEngine(); engine.evaluateInvestmentOpportunities({ validated: true, allocationPriority: 90 }); assert.equal(engine.rankCapitalAllocationPriorities().validation.decision, "pass"); assert.ok(engine.recommendCapitalReallocation().recommendations.length); });
  test("never auto-executes capital transfers", async () => { const { engine } = await buildEngine(); const record = engine.evaluateInvestmentOpportunities({ validated: true }).capitalAllocationRecords[0]!; assert.equal(record.neverExecuteCapitalTransfersAutomaticallyWithoutApprovedGovernance, true); assert.equal(record.approvedForTransfer, false); });
  test("connects and registers with EIF", async () => { const { engine, framework } = await buildEngine(true); assert.ok(engine.getEngineRecord()?.frameworkModuleId); assert.ok(framework?.getFrameworkRecords().some((record) => record.intelligenceModuleIdentifier === "empire-capital-allocation")); assert.equal(engine.validateForSupervisorSync().valid, true); assert.ok(ECA_CAPABILITIES.includes("capital_validation")); });
});
