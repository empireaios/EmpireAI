import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { buildEmpireMemoryEngineConfiguration, createEmpireMemoryEngine, EME_CAPABILITIES, resetEmpireMemoryEngineForTesting } from "../../empire-memory-engine/index.js";
import { createEmpireIntelligenceFrameworkEngine } from "../../empire-intelligence-framework/engine.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");
async function buildEngine(withFramework = false) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const framework = withFramework ? createEmpireIntelligenceFrameworkEngine(bootstrap) : null;
  if (framework) await framework.initialize();
  const engine = createEmpireMemoryEngine(bootstrap, { empireIntelligenceFramework: framework });
  await engine.initialize(); engine.connectEmpireMemoryEngine(); return { engine, framework };
}
describe("X5-03 Empire Memory Engine", () => {
  beforeEach(resetEmpireMemoryEngineForTesting);
  test("locks every memory safety flag", () => { const config = buildEmpireMemoryEngineConfiguration(REPO_ROOT, { neverExposeCredentials: false as never, neverAlterValidatedHistoricalRecordsWithoutAuthorization: false as never }); assert.equal(config.neverExposeCredentials, true); assert.equal(config.neverAlterValidatedHistoricalRecordsWithoutAuthorization, true); assert.equal(config.preserveHistoricalTraceability, true); });
  test("initializes PILLOW-EME-001 doctrine for X5-03", async () => { const { engine } = await buildEngine(); assert.equal(engine.getState().engineVersion, "PILLOW-EME-001"); assert.equal(engine.getState().missionId, "X5-03"); });
  test("persists organizational memory", async () => assert.notEqual((await buildEngine()).engine.persistLongTermOrganizationalMemory({ validated: true }).validation.decision, "fail"));
  test("records strategic and operational decisions", async () => { const { engine } = await buildEngine(); assert.equal(engine.recordStrategicDecision({ validated: true }).validation.decision, "pass"); assert.equal(engine.recordOperationalDecision({ validated: true }).validation.decision, "pass"); });
  test("records outcomes and lessons", async () => { const { engine } = await buildEngine(); assert.equal(engine.recordBusinessOutcome({ validated: true }).validation.decision, "pass"); assert.equal(engine.recordLessonLearned({ validated: true }).validation.decision, "pass"); });
  test("records historical events and milestones", async () => { const { engine } = await buildEngine(); assert.equal(engine.recordHistoricalEvent({ validated: true }).validation.decision, "pass"); assert.equal(engine.recordEnterpriseMilestone({ validated: true }).validation.decision, "pass"); });
  test("rejects alteration of validated historical records without authorization", async () => { const { engine } = await buildEngine(); const record = engine.recordHistoricalEvent({ validated: true }).memoryRecords[0]!; assert.equal(engine.recordHistoricalEvent({ memoryRecordId: record.memoryRecordId, validated: true }).validation.decision, "fail"); });
  test("detects duplicate and conflicting memory", async () => { const { engine } = await buildEngine(); engine.recordHistoricalEvent({ validated: true, eventReference: "event-1" }); assert.equal(engine.detectDuplicateMemory({ eventReference: "event-1" }).validation.decision, "partial"); assert.equal(engine.detectMemoryConflicts({ eventReference: "event-1", memoryCategory: "enterprise_milestone" }).validation.decision, "partial"); });
  test("recommends only validated organizational memory", async () => { const { engine } = await buildEngine(); engine.persistLongTermOrganizationalMemory({ validated: true }); assert.equal(engine.recommendOrganizationalMemory().validation.decision, "pass"); assert.ok(engine.getRecommendations().length); });
  test("connects and registers with EIF", async () => { const { engine, framework } = await buildEngine(true); assert.ok(engine.getEngineRecord()?.frameworkModuleId); assert.ok(framework?.getFrameworkRecords().some((record) => record.intelligenceModuleIdentifier === "empire-memory-engine")); assert.equal(engine.validateForSupervisorSync().valid, true); assert.ok(EME_CAPABILITIES.includes("memory_validation")); });
});
