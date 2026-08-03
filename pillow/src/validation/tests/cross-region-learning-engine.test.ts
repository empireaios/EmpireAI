import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { buildCrossRegionLearningEngineConfiguration, createCrossRegionLearningEngine, CRL_CAPABILITIES, resetCrossRegionLearningEngineForTesting } from "../../cross-region-learning-engine/index.js";
const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");
async function buildEngine() { const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true }); const engine = createCrossRegionLearningEngine(bootstrap, {}); await engine.initialize(); engine.connectCrossRegionLearningEngine(); return engine; }
describe("X4-16 Cross-Region Learning Engine", () => {
  beforeEach(resetCrossRegionLearningEngineForTesting);
  test("locks all learning safety flags", () => { const c = buildCrossRegionLearningEngineConfiguration(REPO_ROOT, { neverExposeCredentials: false as never, neverDistributeUnvalidatedOperationalKnowledge: false as never }); assert.equal(c.neverExposeCredentials, true); assert.equal(c.neverDistributeUnvalidatedOperationalKnowledge, true); assert.equal(c.preserveLearningTraceability, true); });
  test("initializes PILLOW-CRL-001 for X4-16", async () => { const e = await buildEngine(); assert.equal(e.getState().engineVersion, "PILLOW-CRL-001"); assert.equal(e.getState().missionId, "X4-16"); });
  test("captures regional best practices", async () => assert.notEqual((await buildEngine()).captureRegionalBestPractices({ validated: true }).validation.decision, "fail"));
  test("captures operational lessons", async () => assert.notEqual((await buildEngine()).captureOperationalLessons({ validated: true }).validation.decision, "fail"));
  test("captures successful growth strategies", async () => assert.notEqual((await buildEngine()).captureSuccessfulGrowthStrategies({ validated: true }).validation.decision, "fail"));
  test("captures risk mitigation strategies", async () => assert.notEqual((await buildEngine()).captureRiskMitigationStrategies({ validated: true }).validation.decision, "fail"));
  test("does not distribute unvalidated operational knowledge", async () => assert.equal((await buildEngine()).shareKnowledgeAcrossRegions({ validated: false }).validation.decision, "fail"));
  test("detects reusable patterns and strategies", async () => { const e = await buildEngine(); assert.notEqual(e.detectReusableOperationalPatterns({ validated: true }).validation.decision, "fail"); assert.notEqual(e.detectTransferableBusinessStrategies({ validated: true }).validation.decision, "fail"); });
  test("ranks knowledge and recommends validated learning", async () => { const e = await buildEngine(); e.captureRegionalBestPractices({ validated: true }); assert.notEqual(e.rankKnowledgeValue({ validated: true }).validation.decision, "fail"); assert.notEqual(e.recommendLearning({ validated: true }).validation.decision, "fail"); });
  test("reports records, diagnostics, and supervisor readiness", async () => { const e = await buildEngine(); e.captureRegionalBestPractices({ validated: true }); assert.ok(e.getLearningRecords().length); assert.notEqual(e.runDiagnostics().validation.decision, "fail"); assert.equal(e.validateForSupervisorSync().valid, true); assert.ok(CRL_CAPABILITIES.includes("learning_validation")); });
});
