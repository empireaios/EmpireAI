import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { buildEmpireInnovationEngineConfiguration, createEmpireInnovationEngine, EIN_CAPABILITIES, resetEmpireInnovationEngineForTesting } from "../../empire-innovation-engine/index.js";
import { createEmpireIntelligenceFrameworkEngine } from "../../empire-intelligence-framework/engine.js";
const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");
async function buildEngine(withFramework = false) { const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true }); const framework = withFramework ? createEmpireIntelligenceFrameworkEngine(bootstrap) : null; if (framework) await framework.initialize(); const engine = createEmpireInnovationEngine(bootstrap, { empireIntelligenceFramework: framework }); await engine.initialize(); engine.connectEmpireInnovationEngine(); return { engine, framework }; }
describe("X5-07 Empire Innovation Engine", () => {
  beforeEach(resetEmpireInnovationEngineForTesting);
  test("locks every safety flag", () => { const c = buildEmpireInnovationEngineConfiguration(REPO_ROOT, { neverPromoteUnvalidatedInnovationsIntoProductionAutomatically: false as never }); assert.equal(c.neverPromoteUnvalidatedInnovationsIntoProductionAutomatically, true); assert.equal(c.neverExposeCredentials, true); });
  test("initializes PILLOW-EIN-001 for X5-07", async () => { const { engine } = await buildEngine(); assert.equal(engine.getState().missionId, "X5-07"); });
  test("generates product ideas", async () => assert.equal((await buildEngine()).engine.generateNewProductIdeas({ validated: true }).validation.decision, "pass"));
  test("generates service ideas", async () => assert.equal((await buildEngine()).engine.generateNewServiceIdeas({ validated: true }).validation.decision, "pass"));
  test("generates business models", async () => assert.equal((await buildEngine()).engine.generateNewBusinessModels({ validated: true }).validation.decision, "pass"));
  test("discovers opportunities and trends", async () => { const { engine } = await buildEngine(); assert.equal(engine.identifyInnovationOpportunities({ validated: true }).validation.decision, "pass"); assert.equal(engine.detectInnovationTrends({ validated: true }).validation.decision, "pass"); });
  test("combines knowledge and evaluates potential", async () => { const { engine } = await buildEngine(); engine.combineKnowledgeAcrossCompanies({ validated: true }); assert.equal(engine.evaluateInnovationPotential({ validated: true }).validation.decision, "pass"); });
  test("ranks innovation opportunities", async () => { const { engine } = await buildEngine(); engine.generateNewProductIdeas({ validated: true, innovationScore: 90 }); assert.equal(engine.rankInnovationOpportunities().validation.decision, "pass"); });
  test("never auto-promotes unvalidated innovations", async () => { const { engine } = await buildEngine(); const record = engine.generateNewProductIdeas({ innovationScore: 90 }).innovationRecords[0]!; assert.equal(record.approvedForProduction, false); assert.equal(engine.recommendInnovations().recommendations.length, 0); });
  test("registers with EIF and supports supervisor sync", async () => { const { engine, framework } = await buildEngine(true); assert.ok(engine.getEngineRecord()?.frameworkModuleId); assert.ok(framework?.getFrameworkRecords().some((r) => r.intelligenceModuleIdentifier === "empire-innovation-engine")); assert.equal(engine.validateForSupervisorSync().valid, true); assert.ok(EIN_CAPABILITIES.includes("innovation_validation")); });
});