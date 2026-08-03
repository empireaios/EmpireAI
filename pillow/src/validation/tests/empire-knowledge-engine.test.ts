import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { buildEmpireKnowledgeEngineConfiguration, createEmpireKnowledgeEngine, EKE_CAPABILITIES, resetEmpireKnowledgeEngineForTesting } from "../../empire-knowledge-engine/index.js";
import { createEmpireIntelligenceFrameworkEngine } from "../../empire-intelligence-framework/engine.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");
async function buildEngine(withFramework = false) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const framework = withFramework ? createEmpireIntelligenceFrameworkEngine(bootstrap) : null;
  if (framework) await framework.initialize();
  const engine = createEmpireKnowledgeEngine(bootstrap, { empireIntelligenceFramework: framework });
  await engine.initialize(); engine.connectEmpireKnowledgeEngine(); return { engine, framework };
}
describe("X5-02 Empire Knowledge Engine", () => {
  beforeEach(resetEmpireKnowledgeEngineForTesting);
  test("locks every knowledge safety flag", () => { const config = buildEmpireKnowledgeEngineConfiguration(REPO_ROOT, { neverExposeCredentials: false as never, neverDistributeUnvalidatedEnterpriseKnowledge: false as never }); assert.equal(config.neverExposeCredentials, true); assert.equal(config.neverDistributeUnvalidatedEnterpriseKnowledge, true); assert.equal(config.preserveKnowledgeTraceability, true); });
  test("initializes distinct PILLOW-ENK-001 doctrine for X5-02", async () => { const { engine } = await buildEngine(); assert.equal(engine.getState().engineVersion, "PILLOW-ENK-001"); assert.equal(engine.getState().missionId, "X5-02"); });
  test("builds a cross-enterprise knowledge graph", async () => assert.notEqual((await buildEngine()).engine.buildCrossEnterpriseKnowledgeGraph({ validated: true }).validation.decision, "fail"));
  test("captures company knowledge", async () => assert.notEqual((await buildEngine()).engine.captureKnowledgeFromCompany({ sourceCompany: "alpha", validated: true }).validation.decision, "fail"));
  test("blocks unvalidated cross-company sharing", async () => assert.equal((await buildEngine()).engine.shareValidatedKnowledgeAcrossCompanies({ validated: false }).validation.decision, "fail"));
  test("maps enterprise relationships", async () => assert.notEqual((await buildEngine()).engine.mapRelationships({ relationshipType: "supplier", validated: true }).validation.decision, "fail"));
  test("detects reusable business knowledge", async () => assert.notEqual((await buildEngine()).engine.detectReusableBusinessKnowledge({ validated: true }).validation.decision, "fail"));
  test("detects duplicates and knowledge gaps", async () => { const { engine } = await buildEngine(); assert.notEqual(engine.detectDuplicatedKnowledge({ validated: true }).validation.decision, "fail"); assert.notEqual(engine.detectKnowledgeGaps({ validated: true }).validation.decision, "fail"); });
  test("recommends only validated enterprise knowledge", async () => { const { engine } = await buildEngine(); engine.captureKnowledgeFromCompany({ validated: true }); assert.notEqual(engine.recommendEnterpriseKnowledge({ validated: true }).validation.decision, "fail"); assert.ok(engine.getRecommendations().length); });
  test("connects and registers with EIF", async () => { const { engine, framework } = await buildEngine(true); assert.ok(engine.getEngineRecord()?.frameworkModuleId); assert.ok(framework?.getFrameworkRecords().some((record) => record.intelligenceModuleIdentifier === "empire-knowledge-engine")); assert.equal(engine.validateForSupervisorSync().valid, true); assert.ok(EKE_CAPABILITIES.includes("knowledge_validation")); });
});
