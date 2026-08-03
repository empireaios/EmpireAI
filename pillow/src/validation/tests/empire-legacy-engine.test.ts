import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  buildEmpireLegacyEngineConfiguration,
  createEmpireLegacyEngine,
  ELE_CAPABILITIES,
  resetEmpireLegacyEngineForTesting,
} from "../../empire-legacy-engine/index.js";
import { createEmpireIntelligenceFrameworkEngine } from "../../empire-intelligence-framework/engine.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function buildEngine(withFramework = false) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const framework = withFramework ? createEmpireIntelligenceFrameworkEngine(bootstrap) : null;
  if (framework) await framework.initialize();
  const engine = createEmpireLegacyEngine(bootstrap, { empireIntelligenceFramework: framework });
  await engine.initialize();
  engine.connectEmpireLegacyEngine();
  return { engine, framework };
}

describe("X5-14 Empire Legacy Engine", () => {
  beforeEach(resetEmpireLegacyEngineForTesting);

  test("1 locks mandatory safety flags", () => {
    const c = buildEmpireLegacyEngineConfiguration(REPO_ROOT, {
      neverModifyValidatedHistoricalRecordsWithoutAuthorization: false as never,
    });
    assert.equal(c.neverModifyValidatedHistoricalRecordsWithoutAuthorization, true);
    assert.equal(c.neverExposeCredentials, true);
    assert.equal(c.neverExposeAuthenticationTokens, true);
  });

  test("2 initializes PILLOW-ELE-001 for X5-14", async () => {
    const state = (await buildEngine()).engine.getState();
    assert.equal(state.missionId, "X5-14");
    assert.equal(state.engineVersion, "PILLOW-ELE-001");
  });

  test("3 preserves strategic and operational decisions", async () => {
    const { engine } = await buildEngine();
    assert.equal(engine.preserveStrategicDecisions({ validated: true, companyReference: "Alpha Holdings" }).validation.decision, "pass");
    assert.equal(engine.preserveOperationalDecisions({ validated: true }).validation.decision, "pass");
  });

  test("4 preserves governance milestones achievements and lessons", async () => {
    const { engine } = await buildEngine();
    assert.equal(engine.preserveGovernanceHistory({ validated: true }).validation.decision, "pass");
    assert.equal(engine.preserveEnterpriseMilestones({ validated: true, historicalSignificance: "major" }).legacyRecords[0]?.historicalSignificance, "major");
    assert.ok(engine.preserveAchievements({ validated: true, achievementReference: "ACH-001" }).legacyRecords[0]?.achievementReference.includes("ACH-001"));
    assert.equal(engine.preserveLessonsLearned({ validated: true }).validation.decision, "pass");
  });

  test("5 maintains chronological enterprise history", async () => {
    const record = (await buildEngine()).engine.maintainChronologicalEnterpriseHistory({
      validated: true,
      historicalEventReference: "EVT-CHRONO-1",
    }).legacyRecords[0]!;
    assert.equal(record.historicalEventReference, "EVT-CHRONO-1");
    assert.ok(record.timestamp.length > 0);
  });

  test("6 detects missing historical records", async () => {
    const record = (await buildEngine()).engine.detectMissingHistoricalRecords({
      validated: true,
      missingHistoryHint: true,
    }).legacyRecords[0]!;
    assert.ok(record.historicalEventReference.startsWith("missing-"));
  });

  test("7 generates historical intelligence recommendations", async () => {
    const { engine } = await buildEngine();
    engine.preserveEnterpriseMilestones({ validated: true, historicalSignificance: "foundational" });
    assert.equal(engine.generateHistoricalIntelligenceRecommendations().recommendations.length, 1);
  });

  test("8 never modifies validated historical records without authorization", async () => {
    const report = (await buildEngine()).engine.preserveStrategicDecisions({
      validated: true,
      attemptModifyValidatedHistory: true,
      authorizedToModifyValidatedHistory: false,
    });
    assert.equal(report.validation.decision, "fail");
    assert.equal(report.legacyRecords[0]?.modifiedValidatedHistoricalRecordWithoutAuthorization, false);
    assert.equal(report.legacyRecords[0]?.neverModifyValidatedHistoricalRecordsWithoutAuthorization, true);
  });

  test("9 preserves historical traceability", async () => {
    const record = (await buildEngine()).engine.preserveStrategicDecisions({ validated: true }).legacyRecords[0]!;
    assert.ok(record.legacyTraceId.startsWith("ele-trace-"));
    assert.equal(record.preserveHistoricalTraceability, true);
    assert.equal(record.maskSensitiveValues, true);
  });

  test("10 registers with EIF and provides diagnostics", async () => {
    const { engine, framework } = await buildEngine(true);
    assert.equal(engine.getLegacyRecords().length, 0);
    assert.ok(engine.getEngineRecord()?.frameworkModuleId);
    assert.ok(framework?.getFrameworkRecords().some((r) => r.intelligenceModuleIdentifier === "empire-legacy-engine"));
    assert.notEqual(engine.runDiagnostics().validation.decision, "fail");
    assert.equal(engine.validateForSupervisorSync().valid, true);
    assert.ok(engine.getCockpitSnapshot().frameworkRegistered);
    assert.ok(ELE_CAPABILITIES.includes("legacy_validation"));
  });
});
