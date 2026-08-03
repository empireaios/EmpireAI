import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { buildEmpireResilienceEngineConfiguration, createEmpireResilienceEngine, ERS_CAPABILITIES, resetEmpireResilienceEngineForTesting } from "../../empire-resilience-engine/index.js";
import { createEmpireIntelligenceFrameworkEngine } from "../../empire-intelligence-framework/engine.js";
const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");
async function buildEngine(withFramework = false) { const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true }); const framework = withFramework ? createEmpireIntelligenceFrameworkEngine(bootstrap) : null; if (framework) await framework.initialize(); const engine = createEmpireResilienceEngine(bootstrap, { empireIntelligenceFramework: framework }); await engine.initialize(); engine.connectEmpireResilienceEngine(); return { engine, framework }; }
describe("X5-08 Empire Resilience Engine", () => {
  beforeEach(resetEmpireResilienceEngineForTesting);
  test("locks every safety flag", () => { const c = buildEmpireResilienceEngineConfiguration(REPO_ROOT, { neverExecuteDestructiveRecoveryActionsWithoutApprovedGovernance: false as never }); assert.equal(c.neverExecuteDestructiveRecoveryActionsWithoutApprovedGovernance, true); assert.equal(c.neverExposeCredentials, true); });
  test("initializes PILLOW-ERS-001 for X5-08", async () => assert.equal((await buildEngine()).engine.getState().missionId, "X5-08"));
  test("monitors enterprise resilience", async () => assert.equal((await buildEngine()).engine.monitorEnterpriseResilience({ validated: true }).validation.decision, "pass"));
  test("detects operational and infrastructure failures", async () => { const { engine } = await buildEngine(); assert.equal(engine.detectOperationalFailures({ validated: true }).validation.decision, "pass"); assert.equal(engine.detectInfrastructureFailures({ validated: true }).validation.decision, "pass"); });
  test("detects business disruptions", async () => assert.equal((await buildEngine()).engine.detectBusinessDisruptions({ validated: true }).validation.decision, "pass"));
  test("detects supply chain disruptions", async () => assert.equal((await buildEngine()).engine.detectSupplyChainDisruptions({ validated: true }).validation.decision, "pass"));
  test("detects financial disruptions", async () => assert.equal((await buildEngine()).engine.detectFinancialDisruptions({ validated: true }).validation.decision, "pass"));
  test("assesses enterprise resilience", async () => assert.equal((await buildEngine()).engine.assessEnterpriseResilience({ validated: true }).validation.decision, "pass"));
  test("never automatically executes destructive recovery", async () => { const { engine } = await buildEngine(); const record = engine.detectOperationalFailures({ approvedForDestructiveRecovery: true }).resilienceRecords[0]!; assert.equal(record.approvedForDestructiveRecovery, false); assert.match(engine.coordinateRecoveryActions().validation.warnings.join(" "), /no destructive action was executed/); });
  test("registers with EIF and supports supervisor sync", async () => { const { engine, framework } = await buildEngine(true); assert.ok(engine.getEngineRecord()?.frameworkModuleId); assert.ok(framework?.getFrameworkRecords().some((r) => r.intelligenceModuleIdentifier === "empire-resilience-engine")); assert.equal(engine.validateForSupervisorSync().valid, true); assert.ok(ERS_CAPABILITIES.includes("resilience_validation")); });
});
