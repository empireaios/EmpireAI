import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { buildEmpireSelfImprovementEngineConfiguration, createEmpireSelfImprovementEngine, ESI_CAPABILITIES, resetEmpireSelfImprovementEngineForTesting } from "../../empire-self-improvement-engine/index.js";
import { createEmpireIntelligenceFrameworkEngine } from "../../empire-intelligence-framework/engine.js";
const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");
async function buildEngine(withFramework = false) { const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true }); const framework = withFramework ? createEmpireIntelligenceFrameworkEngine(bootstrap) : null; if (framework) await framework.initialize(); const engine = createEmpireSelfImprovementEngine(bootstrap, { empireIntelligenceFramework: framework }); await engine.initialize(); engine.connectEmpireSelfImprovementEngine(); return { engine, framework }; }
describe("X5-09 Empire Self-Improvement Engine", () => {
  beforeEach(resetEmpireSelfImprovementEngineForTesting);
  test("locks every safety flag", () => { const c = buildEmpireSelfImprovementEngineConfiguration(REPO_ROOT, { neverModifyGovernanceApprovedArchitectureAutomatically: false as never }); assert.equal(c.neverModifyGovernanceApprovedArchitectureAutomatically, true); assert.equal(c.neverExposeCredentials, true); });
  test("initializes PILLOW-ESI-001 for X5-09", async () => assert.equal((await buildEngine()).engine.getState().missionId, "X5-09"));
  test("monitors enterprise performance", async () => assert.equal((await buildEngine()).engine.monitorEnterprisePerformance({ validated: true }).validation.decision, "pass"));
  test("monitors operational efficiency", async () => assert.equal((await buildEngine()).engine.monitorOperationalEfficiency({ validated: true }).validation.decision, "pass"));
  test("identifies improvement opportunities", async () => assert.equal((await buildEngine()).engine.identifyImprovementOpportunities({ validated: true }).validation.decision, "pass"));
  test("evaluates improvement proposals", async () => assert.equal((await buildEngine()).engine.evaluateImprovementProposals({ validated: true }).validation.decision, "pass"));
  test("learns and tracks continuous evolution", async () => { const { engine } = await buildEngine(); assert.equal(engine.learnFromPreviousImprovements({ validated: true }).validation.decision, "pass"); assert.equal(engine.trackContinuousEvolution({ validated: true }).validation.decision, "pass"); });
  test("recommends ranked improvements", async () => { const { engine } = await buildEngine(); engine.rankImprovementPriorities({ priorityScore: 90 }); assert.equal(engine.recommendSelfImprovements().recommendations.length, 1); });
  test("never auto-modifies governance-approved architecture", async () => { const record = (await buildEngine()).engine.identifyImprovementOpportunities({ approvedForArchitectureModification: true }).selfImprovementRecords[0]!; assert.equal(record.approvedForArchitectureModification, false); assert.equal(record.neverModifyGovernanceApprovedArchitectureAutomatically, true); });
  test("never bypasses constitutional governance and registers EIF", async () => { const { engine, framework } = await buildEngine(true); assert.equal(engine.getSelfImprovementRecords().length, 0); assert.ok(engine.getEngineRecord()?.frameworkModuleId); assert.ok(framework?.getFrameworkRecords().some((r) => r.intelligenceModuleIdentifier === "empire-self-improvement-engine")); assert.equal(engine.validateForSupervisorSync().valid, true); assert.ok(ESI_CAPABILITIES.includes("improvement_validation")); });
});
