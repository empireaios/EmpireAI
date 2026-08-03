import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  buildEmpirePerformanceGuardianConfiguration,
  createEmpirePerformanceGuardian,
  EPG_CAPABILITIES,
  resetEmpirePerformanceGuardianForTesting,
} from "../../empire-performance-guardian/index.js";
import { createEmpireIntelligenceFrameworkEngine } from "../../empire-intelligence-framework/engine.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function buildEngine(withFramework = false) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const framework = withFramework ? createEmpireIntelligenceFrameworkEngine(bootstrap) : null;
  if (framework) await framework.initialize();
  const engine = createEmpirePerformanceGuardian(bootstrap, { empireIntelligenceFramework: framework });
  await engine.initialize();
  engine.connectEmpirePerformanceGuardian();
  return { engine, framework };
}

describe("X5-18 Empire Performance Guardian", () => {
  beforeEach(resetEmpirePerformanceGuardianForTesting);

  test("1 locks mandatory safety flags", () => {
    const c = buildEmpirePerformanceGuardianConfiguration(REPO_ROOT, {
      neverSuppressCriticalEnterpriseAlerts: false as never,
    });
    assert.equal(c.neverSuppressCriticalEnterpriseAlerts, true);
    assert.equal(c.neverExposeCredentials, true);
    assert.equal(c.neverExposeAuthenticationTokens, true);
  });

  test("2 initializes PILLOW-EPG-001 for X5-18", async () => {
    const state = (await buildEngine()).engine.getState();
    assert.equal(state.missionId, "X5-18");
    assert.equal(state.engineVersion, "PILLOW-EPG-001");
  });

  test("3 monitors every company and enterprise KPIs", async () => {
    const { engine } = await buildEngine();
    assert.equal(engine.monitorEveryCompany({ validated: true, companyReference: "Alpha Holdings" }).validation.decision, "pass");
    assert.equal(engine.monitorEnterpriseWideKpis({ validated: true }).validation.decision, "pass");
  });

  test("4 monitors operational financial customer and strategic performance", async () => {
    const { engine } = await buildEngine();
    assert.equal(engine.monitorOperationalPerformance({ validated: true }).validation.decision, "pass");
    assert.equal(engine.monitorFinancialPerformance({ validated: true }).validation.decision, "pass");
    assert.equal(engine.monitorCustomerPerformance({ validated: true }).validation.decision, "pass");
    assert.equal(engine.monitorStrategicObjectives({ validated: true }).validation.decision, "pass");
  });

  test("5 detects degradation and critical anomalies", async () => {
    const { engine } = await buildEngine();
    assert.equal(engine.detectPerformanceDegradation({ validated: true }).performanceRecords[0]?.anomalyStatus, "degraded");
    assert.equal(engine.detectCriticalAnomalies({ validated: true }).performanceRecords[0]?.anomalyStatus, "critical");
  });

  test("6 ranks priorities and generates recommendations", async () => {
    const { engine } = await buildEngine();
    engine.rankEnterprisePriorities({ validated: true, priorityScore: 80, healthScore: 40 });
    assert.equal(engine.generatePerformanceRecommendations().recommendations.length, 1);
  });

  test("7 never suppresses critical enterprise alerts", async () => {
    const report = (await buildEngine()).engine.detectCriticalAnomalies({
      validated: true,
      suppressCriticalAlert: true,
    });
    assert.equal(report.validation.decision, "fail");
    assert.equal(report.performanceRecords[0]?.criticalAlertSuppressed, false);
    assert.equal(report.performanceRecords[0]?.neverSuppressCriticalEnterpriseAlerts, true);
  });

  test("8 produces machine-readable performance records", async () => {
    const record = (await buildEngine()).engine.monitorEveryCompany({
      validated: true,
      companyReference: "Beta Co",
      healthScore: 88,
    }).performanceRecords[0]!;
    assert.equal(record.companyReference, "Beta Co");
    assert.equal(record.healthScore, 88);
    assert.ok(record.performanceRecordId.startsWith("epg-"));
  });

  test("9 preserves performance traceability", async () => {
    const record = (await buildEngine()).engine.monitorEnterpriseWideKpis({ validated: true }).performanceRecords[0]!;
    assert.ok(record.performanceTraceId.startsWith("epg-trace-"));
    assert.equal(record.preservePerformanceTraceability, true);
    assert.equal(record.maskSensitiveValues, true);
  });

  test("10 registers with EIF and provides diagnostics", async () => {
    const { engine, framework } = await buildEngine(true);
    assert.equal(engine.getPerformanceRecords().length, 0);
    assert.ok(engine.getEngineRecord()?.frameworkModuleId);
    assert.ok(framework?.getFrameworkRecords().some((r) => r.intelligenceModuleIdentifier === "empire-performance-guardian"));
    assert.notEqual(engine.runDiagnostics().validation.decision, "fail");
    assert.equal(engine.validateForSupervisorSync().valid, true);
    assert.ok(engine.getCockpitSnapshot().frameworkRegistered);
    assert.ok(EPG_CAPABILITIES.includes("performance_validation"));
  });
});
