import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  buildCivilizationKnowledgeEngineConfiguration,
  CKE_CAPABILITIES,
  createCivilizationKnowledgeEngine,
  resetCivilizationKnowledgeEngineForTesting,
} from "../../civilization-knowledge-engine/index.js";
import { createEmpireIntelligenceFrameworkEngine } from "../../empire-intelligence-framework/engine.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function buildEngine(withFramework = false) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const framework = withFramework ? createEmpireIntelligenceFrameworkEngine(bootstrap) : null;
  if (framework) await framework.initialize();
  const engine = createCivilizationKnowledgeEngine(bootstrap, { empireIntelligenceFramework: framework });
  await engine.initialize();
  engine.connectCivilizationKnowledgeEngine();
  return { engine, framework };
}

describe("X5-16 Civilization Knowledge Engine", () => {
  beforeEach(resetCivilizationKnowledgeEngineForTesting);

  test("1 locks mandatory safety flags", () => {
    const c = buildCivilizationKnowledgeEngineConfiguration(REPO_ROOT, {
      neverIntegrateUnvalidatedExternalKnowledgeIntoEnterpriseDecisionMakingAutomatically: false as never,
    });
    assert.equal(c.neverIntegrateUnvalidatedExternalKnowledgeIntoEnterpriseDecisionMakingAutomatically, true);
    assert.equal(c.neverExposeCredentials, true);
    assert.equal(c.neverExposeAuthenticationTokens, true);
  });

  test("2 initializes PILLOW-CKE-001 for X5-16", async () => {
    const state = (await buildEngine()).engine.getState();
    assert.equal(state.missionId, "X5-16");
    assert.equal(state.engineVersion, "PILLOW-CKE-001");
  });

  test("3 monitors industries and technologies", async () => {
    const { engine } = await buildEngine();
    assert.equal(engine.monitorIndustries({ validated: true, sourceDomain: "industry" }).validation.decision, "pass");
    assert.equal(engine.monitorTechnologies({ validated: true, sourceDomain: "technology" }).validation.decision, "pass");
  });

  test("4 monitors scientific economic regulatory and innovation domains", async () => {
    const { engine } = await buildEngine();
    assert.equal(engine.monitorScientificDevelopments({ validated: true }).validation.decision, "pass");
    assert.equal(engine.monitorEconomicDevelopments({ validated: true }).validation.decision, "pass");
    assert.equal(engine.monitorRegulatoryDevelopments({ validated: true }).validation.decision, "pass");
    assert.equal(engine.monitorBusinessInnovations({ validated: true }).validation.decision, "pass");
  });

  test("5 identifies emerging strategic knowledge", async () => {
    const record = (await buildEngine()).engine.identifyEmergingStrategicKnowledge({
      validated: true,
      strategicRelevanceScore: 88,
    }).knowledgeRecords[0]!;
    assert.equal(record.strategicRelevanceScore, 88);
    assert.ok(record.knowledgeCategory.includes("emerging"));
  });

  test("6 ranks strategic relevance", async () => {
    const record = (await buildEngine()).engine.rankStrategicRelevance({
      validated: true,
      strategicRelevanceScore: 72,
    }).knowledgeRecords[0]!;
    assert.equal(record.strategicRelevanceScore, 72);
    assert.equal(record.businessImpact, "significant");
  });

  test("7 generates strategic knowledge recommendations", async () => {
    const { engine } = await buildEngine();
    engine.rankStrategicRelevance({ validated: true, strategicRelevanceScore: 80 });
    assert.equal(engine.generateStrategicKnowledgeRecommendations().recommendations.length, 1);
  });

  test("8 never integrates unvalidated external knowledge automatically", async () => {
    const report = (await buildEngine()).engine.monitorIndustries({
      validated: false,
      integrateIntoDecisionMakingAutomatically: true,
    });
    assert.equal(report.validation.decision, "fail");
    assert.equal(report.knowledgeRecords[0]?.integratedUnvalidatedExternalKnowledgeAutomatically, false);
    assert.equal(report.knowledgeRecords[0]?.neverIntegrateUnvalidatedExternalKnowledgeIntoEnterpriseDecisionMakingAutomatically, true);
  });

  test("9 preserves knowledge traceability", async () => {
    const record = (await buildEngine()).engine.monitorTechnologies({ validated: true }).knowledgeRecords[0]!;
    assert.ok(record.knowledgeTraceId.startsWith("cke-trace-"));
    assert.equal(record.preserveKnowledgeTraceability, true);
    assert.equal(record.maskSensitiveValues, true);
  });

  test("10 registers with EIF and provides diagnostics", async () => {
    const { engine, framework } = await buildEngine(true);
    assert.equal(engine.getKnowledgeRecords().length, 0);
    assert.ok(engine.getEngineRecord()?.frameworkModuleId);
    assert.ok(framework?.getFrameworkRecords().some((r) => r.intelligenceModuleIdentifier === "civilization-knowledge-engine"));
    assert.notEqual(engine.runDiagnostics().validation.decision, "fail");
    assert.equal(engine.validateForSupervisorSync().valid, true);
    assert.ok(engine.getCockpitSnapshot().frameworkRegistered);
    assert.ok(CKE_CAPABILITIES.includes("knowledge_validation"));
  });
});
