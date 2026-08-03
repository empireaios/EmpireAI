import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { buildEmpireOptimizationEngineConfiguration, createEmpireOptimizationEngine, EOE_CAPABILITIES, resetEmpireOptimizationEngineForTesting } from "../../empire-optimization-engine/index.js";
import { createEmpireIntelligenceFrameworkEngine } from "../../empire-intelligence-framework/engine.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");
async function buildEngine(withFramework = false) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const framework = withFramework ? createEmpireIntelligenceFrameworkEngine(bootstrap) : null;
  if (framework) await framework.initialize();
  const engine = createEmpireOptimizationEngine(bootstrap, { empireIntelligenceFramework: framework });
  await engine.initialize(); engine.connectEmpireOptimizationEngine(); return { engine, framework };
}
describe("X5-04 Empire Optimization Engine", () => {
  beforeEach(resetEmpireOptimizationEngineForTesting);
  test("locks every optimization safety flag", () => { const config = buildEmpireOptimizationEngineConfiguration(REPO_ROOT, { neverExposeCredentials: false as never, neverExecuteUnapprovedOptimizationActionsAutomatically: false as never }); assert.equal(config.neverExposeCredentials, true); assert.equal(config.neverExecuteUnapprovedOptimizationActionsAutomatically, true); assert.equal(config.preserveOptimizationTraceability, true); });
  test("initializes PILLOW-EOE-001 doctrine for X5-04", async () => { const { engine } = await buildEngine(); assert.equal(engine.getState().engineVersion, "PILLOW-EOE-001"); assert.equal(engine.getState().missionId, "X5-04"); });
  test("monitors enterprise-wide performance", async () => assert.notEqual((await buildEngine()).engine.monitorEnterpriseWidePerformance({ validated: true }).validation.decision, "fail"));
  test("analyzes cross-company efficiency", async () => assert.equal((await buildEngine()).engine.analyzeCrossCompanyEfficiency({ validated: true }).validation.decision, "pass"));
  test("identifies optimization opportunities", async () => assert.equal((await buildEngine()).engine.identifyOptimizationOpportunities({ validated: true }).optimizationRecords[0]?.optimizationCategory, "optimization_opportunity"));
  test("detects operational bottlenecks and duplicated effort", async () => { const { engine } = await buildEngine(); assert.equal(engine.detectOperationalBottlenecks({ validated: true }).validation.decision, "pass"); assert.equal(engine.detectDuplicatedEffort({ validated: true }).validation.decision, "pass"); });
  test("identifies resource optimization opportunities", async () => assert.equal((await buildEngine()).engine.identifyResourceOptimizationOpportunities({ validated: true }).validation.decision, "pass"));
  test("ranks priorities and recommends optimizations", async () => { const { engine } = await buildEngine(); engine.identifyOptimizationOpportunities({ validated: true, priorityScore: 90 }); assert.equal(engine.rankOptimizationPriorities().validation.decision, "pass"); assert.ok(engine.recommendEnterpriseOptimization().recommendations.length); });
  test("never auto-executes unapproved optimization actions", async () => { const { engine } = await buildEngine(); const record = engine.identifyOptimizationOpportunities({ validated: true }).optimizationRecords[0]!; assert.equal(record.neverExecuteUnapprovedOptimizationActionsAutomatically, true); assert.equal(record.approvedForExecution, false); });
  test("connects and registers with EIF", async () => { const { engine, framework } = await buildEngine(true); assert.ok(engine.getEngineRecord()?.frameworkModuleId); assert.ok(framework?.getFrameworkRecords().some((record) => record.intelligenceModuleIdentifier === "empire-optimization-engine")); assert.equal(engine.validateForSupervisorSync().valid, true); assert.ok(EOE_CAPABILITIES.includes("optimization_validation")); });
});
