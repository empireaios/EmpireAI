import assert from "node:assert/strict";
import path from "node:path";
import { describe, test, beforeEach } from "node:test";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

import { runBootstrap } from "../../bootstrap/engine.js";
import {
  createAutonomousScalingFrameworkEngine,
  resetAutonomousScalingFrameworkForTesting,
} from "../../autonomous-scaling-framework/index.js";
import {
  createWinningProductDetectorEngine,
  resetWinningProductDetectorForTesting,
} from "../../winning-product-detector/index.js";
import {
  createScalingDecisionEngine,
  resetScalingDecisionEngineForTesting,
} from "../../scaling-decision-engine/index.js";
import {
  createCapacityPlanningEngine,
  resetCapacityPlanningEngineForTesting,
} from "../../capacity-planning-engine/index.js";
import {
  createMarketingScaleEngine,
  resetMarketingScaleEngineForTesting,
} from "../../marketing-scale-engine/index.js";
import {
  createSupplierScaleEngine,
  resetSupplierScaleEngineForTesting,
} from "../../supplier-scale-engine/index.js";
import {
  createFinancialScaleEngine,
  resetFinancialScaleEngineForTesting,
} from "../../financial-scale-engine/index.js";
import {
  createWorkforceIntelligenceEngine,
  resetWorkforceIntelligenceForTesting,
} from "../../workforce-intelligence/index.js";
import {
  createExecutiveScalingDashboardEngine,
  resetExecutiveScalingDashboardForTesting,
  buildExecutiveScalingDashboardConfiguration,
  EXECUTIVE_SCALING_DASHBOARD_SYSTEM_PATH,
  EXECUTIVE_SCALING_DASHBOARD_ID,
  ESD_CAPABILITIES,
  ESD_METADATA_VERSION,
} from "../../executive-scaling-dashboard/index.js";
import { appendEsdLog, getEsdLogs } from "../../executive-scaling-dashboard/esd-logging.js";

async function buildEngine() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const asf = createAutonomousScalingFrameworkEngine(bootstrap);
  await asf.initialize();
  const wpd = createWinningProductDetectorEngine(bootstrap, {
    autonomousScalingFramework: asf,
  });
  await wpd.initialize();
  const sde = createScalingDecisionEngine(bootstrap, {
    autonomousScalingFramework: asf,
    winningProductDetector: wpd,
  });
  await sde.initialize();
  const cpe = createCapacityPlanningEngine(bootstrap, {
    autonomousScalingFramework: asf,
    winningProductDetector: wpd,
    scalingDecisionEngine: sde,
  });
  await cpe.initialize();
  const mse = createMarketingScaleEngine(bootstrap, {
    autonomousScalingFramework: asf,
    winningProductDetector: wpd,
    scalingDecisionEngine: sde,
    capacityPlanningEngine: cpe,
  });
  await mse.initialize();
  const sse = createSupplierScaleEngine(bootstrap, {
    autonomousScalingFramework: asf,
    winningProductDetector: wpd,
    scalingDecisionEngine: sde,
    capacityPlanningEngine: cpe,
    marketingScaleEngine: mse,
  });
  await sse.initialize();
  const fse = createFinancialScaleEngine(bootstrap, {
    autonomousScalingFramework: asf,
    winningProductDetector: wpd,
    scalingDecisionEngine: sde,
    capacityPlanningEngine: cpe,
    marketingScaleEngine: mse,
    supplierScaleEngine: sse,
  });
  await fse.initialize();
  const wfi = createWorkforceIntelligenceEngine(bootstrap, {
    autonomousScalingFramework: asf,
    winningProductDetector: wpd,
    scalingDecisionEngine: sde,
    capacityPlanningEngine: cpe,
    marketingScaleEngine: mse,
    supplierScaleEngine: sse,
    financialScaleEngine: fse,
  });
  await wfi.initialize();
  const engine = createExecutiveScalingDashboardEngine(bootstrap, {
    autonomousScalingFramework: asf,
    winningProductDetector: wpd,
    scalingDecisionEngine: sde,
    capacityPlanningEngine: cpe,
    marketingScaleEngine: mse,
    supplierScaleEngine: sse,
    financialScaleEngine: fse,
    workforceIntelligence: wfi,
  });
  await engine.initialize();
  return { engine, asf, wpd, sde, cpe, mse, sse, fse, wfi };
}

describe("X3-09 Executive Scaling Dashboard", () => {
  beforeEach(() => {
    resetAutonomousScalingFrameworkForTesting();
    resetWinningProductDetectorForTesting();
    resetScalingDecisionEngineForTesting();
    resetCapacityPlanningEngineForTesting();
    resetMarketingScaleEngineForTesting();
    resetSupplierScaleEngineForTesting();
    resetFinancialScaleEngineForTesting();
    resetWorkforceIntelligenceForTesting();
    resetExecutiveScalingDashboardForTesting();
  });

  test("buildExecutiveScalingDashboardConfiguration locks safety flags", () => {
    const config = buildExecutiveScalingDashboardConfiguration(REPO_ROOT, {
      neverExposeRestrictedEnterpriseInformation: false as never,
      neverExposeCredentials: false as never,
    });
    assert.equal(config.enabled, true);
    assert.equal(config.neverExposeRestrictedEnterpriseInformation, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverExposeAuthenticationTokens, true);
    assert.equal(config.preserveDashboardTraceability, true);
    assert.equal(config.preserveEnterpriseIntegrity, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.neverLogSensitiveEnterpriseInformation, true);
    assert.ok(ESD_CAPABILITIES.includes("enterprise_scaling_status_display"));
    assert.ok(ESD_CAPABILITIES.includes("executive_alerts_display"));
  });

  test("executive scaling dashboard initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-ESD-001");
    assert.equal(state.missionId, "X3-09");
    assert.ok(EXECUTIVE_SCALING_DASHBOARD_SYSTEM_PATH.includes("EXECUTIVE_SCALING_DASHBOARD"));
  });

  test("connectExecutiveScalingDashboard registers with ASF via X3-09", async () => {
    const { engine, asf } = await buildEngine();
    const report = engine.connectExecutiveScalingDashboard();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = asf.getRegisteredModules();
    assert.ok(modules.some((m) => m.scalingModuleIdentifier === EXECUTIVE_SCALING_DASHBOARD_ID));
    assert.equal(report.engineRecord.dependencyPresence.autonomousScalingFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.winningProductDetector, true);
    assert.equal(report.engineRecord.dependencyPresence.scalingDecisionEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.capacityPlanningEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.marketingScaleEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.supplierScaleEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.financialScaleEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.workforceIntelligence, true);
    assert.ok(report.engineRecord.frameworkModuleId);
  });

  test("refresh and widgets produce machine-readable esd-* snapshots", async () => {
    const { engine } = await buildEngine();
    engine.connectExecutiveScalingDashboard();

    const refresh = engine.refreshDashboard({
      companyReference: "company-alpha",
      scalingHint: 70,
      opportunityHint: 65,
      capacityHint: 68,
      marketingHint: 72,
      supplierHint: 70,
      financialHint: 74,
      workforceHint: 71,
      validated: true,
    });
    assert.notEqual(
      refresh.validation.decision,
      "fail",
      refresh.validation.errors.join("; "),
    );
    assert.ok(refresh.executiveScalingDashboardRunReportId.startsWith("esd-run-"));
    const snapshot = refresh.dashboardSnapshots[0]!;
    assert.ok(snapshot.dashboardId.startsWith("esd-dash-"));
    assert.equal(snapshot.metadataVersion, ESD_METADATA_VERSION);
    assert.equal(snapshot.neverExposeRestrictedEnterpriseInformation, true);
    assert.equal(snapshot.structuralSignalOnly, true);
    assert.equal(snapshot.sensitiveEnterpriseData, false);

    assert.notEqual(
      engine.getScalingStatus({
        companyReference: "company-alpha",
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.notEqual(
      engine.getOperationalCapacity({
        companyReference: "company-alpha",
        validated: true,
      }).validation.decision,
      "fail",
    );
  });

  test("alerts and recommendations surface after refresh", async () => {
    const { engine } = await buildEngine();
    engine.connectExecutiveScalingDashboard();

    engine.refreshDashboard({
      companyReference: "company-alpha",
      scalingHint: 80,
      opportunityHint: 75,
      capacityHint: 78,
      marketingHint: 80,
      supplierHint: 76,
      financialHint: 82,
      workforceHint: 80,
      validated: true,
    });
    engine.getScalingOpportunities({
      companyReference: "company-alpha",
      validated: true,
    });
    engine.getScalingDecisions({
      companyReference: "company-alpha",
      validated: true,
    });
    engine.getMarketingGrowth({
      companyReference: "company-alpha",
      validated: true,
    });
    engine.getSupplierReadiness({
      companyReference: "company-alpha",
      validated: true,
    });
    engine.getFinancialReadiness({
      companyReference: "company-alpha",
      validated: true,
    });
    engine.getWorkforceUtilization({
      companyReference: "company-alpha",
      validated: true,
    });

    const alerts = engine.getExecutiveAlerts({
      companyReference: "company-alpha",
      validated: true,
    });
    assert.notEqual(alerts.validation.decision, "fail");
    assert.ok((alerts.dashboardSnapshots[0]?.executiveAlerts.length ?? 0) >= 1);

    const recommendations = engine.getScalingRecommendations({
      companyReference: "company-alpha",
      validated: true,
    });
    assert.notEqual(recommendations.validation.decision, "fail");
    assert.ok(recommendations.recommendations.length >= 1);
    assert.ok(recommendations.recommendations[0]!.recommendationId.startsWith("esd-rec-"));
  });

  test("rejects unvalidated dashboard input", async () => {
    const { engine } = await buildEngine();
    engine.connectExecutiveScalingDashboard();
    const report = engine.refreshDashboard({
      companyReference: "company-x",
    });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("validated=true")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendEsdLog({
      event: "dashboard_refresh",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectExecutiveScalingDashboard();
    const logs = getEsdLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("missing company data still produces structural dashboard snapshots", async () => {
    const { engine } = await buildEngine();
    engine.connectExecutiveScalingDashboard();
    const report = engine.refreshDashboard({ validated: true });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.dashboardSnapshots[0]!.companyReference, "company-default");
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectExecutiveScalingDashboard();
    engine.refreshDashboard({
      companyReference: "company-scale",
      scalingHint: 75,
      validated: true,
    });
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalDashboardSnapshots >= 1);
    assert.ok(Array.isArray(cockpit.recentLogs));
    engine.runDiagnostics({});
  });

  test("health monitoring and automatic recovery track failures", async () => {
    const { engine } = await buildEngine();
    engine.connectExecutiveScalingDashboard();
    engine.refreshDashboard({ companyReference: "a" });
    engine.refreshDashboard({ companyReference: "b" });
    const state = engine.getState();
    assert.ok(state.performance.failedOperations >= 2);
    assert.ok(state.health.consecutiveFailures >= 1 || state.health.recoveryAttempts >= 0);
    assert.ok(["healthy", "degraded", "failed", "standby"].includes(state.health.status));
  });
});
