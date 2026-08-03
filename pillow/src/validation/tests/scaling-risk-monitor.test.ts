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
} from "../../executive-scaling-dashboard/index.js";
import {
  createBottleneckIntelligenceEngine,
  resetBottleneckIntelligenceForTesting,
} from "../../bottleneck-intelligence/index.js";
import {
  createOperationalElasticityEngine,
  resetOperationalElasticityEngineForTesting,
} from "../../operational-elasticity-engine/index.js";
import {
  createPerformancePreservationEngine,
  resetPerformancePreservationEngineForTesting,
} from "../../performance-preservation-engine/index.js";
import {
  createScalingRiskMonitorEngine,
  resetScalingRiskMonitorForTesting,
  buildScalingRiskMonitorConfiguration,
  SCALING_RISK_MONITOR_SYSTEM_PATH,
  SCALING_RISK_MONITOR_ID,
  SRM_CAPABILITIES,
  SRM_METADATA_VERSION,
} from "../../scaling-risk-monitor/index.js";
import { appendSrmLog, getSrmLogs } from "../../scaling-risk-monitor/srm-logging.js";

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
  const esd = createExecutiveScalingDashboardEngine(bootstrap, {
    autonomousScalingFramework: asf,
    winningProductDetector: wpd,
    scalingDecisionEngine: sde,
    capacityPlanningEngine: cpe,
    marketingScaleEngine: mse,
    supplierScaleEngine: sse,
    financialScaleEngine: fse,
    workforceIntelligence: wfi,
  });
  await esd.initialize();
  const bni = createBottleneckIntelligenceEngine(bootstrap, {
    autonomousScalingFramework: asf,
    winningProductDetector: wpd,
    scalingDecisionEngine: sde,
    capacityPlanningEngine: cpe,
    marketingScaleEngine: mse,
    supplierScaleEngine: sse,
    financialScaleEngine: fse,
    workforceIntelligence: wfi,
    executiveScalingDashboard: esd,
  });
  await bni.initialize();
  const oee = createOperationalElasticityEngine(bootstrap, {
    autonomousScalingFramework: asf,
    winningProductDetector: wpd,
    scalingDecisionEngine: sde,
    capacityPlanningEngine: cpe,
    marketingScaleEngine: mse,
    supplierScaleEngine: sse,
    financialScaleEngine: fse,
    workforceIntelligence: wfi,
    executiveScalingDashboard: esd,
    bottleneckIntelligence: bni,
  });
  await oee.initialize();
  const ppe = createPerformancePreservationEngine(bootstrap, {
    autonomousScalingFramework: asf,
    winningProductDetector: wpd,
    scalingDecisionEngine: sde,
    capacityPlanningEngine: cpe,
    marketingScaleEngine: mse,
    supplierScaleEngine: sse,
    financialScaleEngine: fse,
    workforceIntelligence: wfi,
    executiveScalingDashboard: esd,
    bottleneckIntelligence: bni,
    operationalElasticityEngine: oee,
  });
  await ppe.initialize();
  const engine = createScalingRiskMonitorEngine(bootstrap, {
    autonomousScalingFramework: asf,
    winningProductDetector: wpd,
    scalingDecisionEngine: sde,
    capacityPlanningEngine: cpe,
    marketingScaleEngine: mse,
    supplierScaleEngine: sse,
    financialScaleEngine: fse,
    workforceIntelligence: wfi,
    executiveScalingDashboard: esd,
    bottleneckIntelligence: bni,
    operationalElasticityEngine: oee,
    performancePreservationEngine: ppe,
  });
  await engine.initialize();
  return { engine, asf, wpd, sde, cpe, mse, sse, fse, wfi, esd, bni, oee, ppe };
}

describe("X3-13 Scaling Risk Monitor", () => {
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
    resetBottleneckIntelligenceForTesting();
    resetOperationalElasticityEngineForTesting();
    resetPerformancePreservationEngineForTesting();
    resetScalingRiskMonitorForTesting();
  });

  test("buildScalingRiskMonitorConfiguration locks safety flags", () => {
    const config = buildScalingRiskMonitorConfiguration(REPO_ROOT, {
      neverSuppressCriticalScalingRisks: false as never,
      neverExposeCredentials: false as never,
    });
    assert.equal(config.enabled, true);
    assert.equal(config.neverSuppressCriticalScalingRisks, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverExposeAuthenticationTokens, true);
    assert.equal(config.preserveRiskTraceability, true);
    assert.equal(config.preserveEnterpriseIntegrity, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.neverLogSensitiveOperationalInformation, true);
    assert.ok(SRM_CAPABILITIES.includes("scaling_risk_monitoring"));
    assert.ok(SRM_CAPABILITIES.includes("uncontrolled_expansion_detection"));
  });

  test("scaling risk monitor initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-SRM-001");
    assert.equal(state.missionId, "X3-13");
    assert.ok(SCALING_RISK_MONITOR_SYSTEM_PATH.includes("SCALING_RISK_MONITOR"));
  });

  test("connectScalingRiskMonitor registers with ASF via X3-13", async () => {
    const { engine, asf } = await buildEngine();
    const report = engine.connectScalingRiskMonitor();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = asf.getRegisteredModules();
    assert.ok(modules.some((m) => m.scalingModuleIdentifier === SCALING_RISK_MONITOR_ID));
    assert.equal(report.engineRecord.dependencyPresence.autonomousScalingFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.winningProductDetector, true);
    assert.equal(report.engineRecord.dependencyPresence.scalingDecisionEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.capacityPlanningEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.marketingScaleEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.supplierScaleEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.financialScaleEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.workforceIntelligence, true);
    assert.equal(report.engineRecord.dependencyPresence.executiveScalingDashboard, true);
    assert.equal(report.engineRecord.dependencyPresence.bottleneckIntelligence, true);
    assert.equal(report.engineRecord.dependencyPresence.operationalElasticityEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.performancePreservationEngine, true);
    assert.ok(report.engineRecord.frameworkModuleId);
  });

  test("monitoring produces machine-readable srm-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectScalingRiskMonitor();

    const scaling = engine.monitorScalingRisks({
      companyReference: "company-alpha",
      riskProbabilityHint: 70,
      validated: true,
    });
    assert.notEqual(
      scaling.validation.decision,
      "fail",
      scaling.validation.errors.join("; "),
    );
    assert.ok(scaling.scalingRiskMonitorRunReportId.startsWith("srm-run-"));
    const record = scaling.scalingRiskRecords[0]!;
    assert.ok(record.scalingRiskId.startsWith("srm-risk-"));
    assert.equal(record.metadataVersion, SRM_METADATA_VERSION);
    assert.equal(record.neverSuppressCriticalScalingRisks, true);
    assert.equal(record.structuralSignalOnly, true);
    assert.equal(record.sensitiveOperationalData, false);

    assert.notEqual(
      engine.monitorOperationalRisks({
        companyReference: "company-alpha",
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.notEqual(
      engine.monitorFinancialRisks({
        companyReference: "company-alpha",
        validated: true,
      }).validation.decision,
      "fail",
    );
  });

  test("detect uncontrolled expansion, rank risks, and recommend mitigations", async () => {
    const { engine } = await buildEngine();
    engine.connectScalingRiskMonitor();

    engine.monitorScalingRisks({
      companyReference: "company-alpha",
      riskProbabilityHint: 80,
      validated: true,
    });
    engine.monitorOperationalRisks({
      companyReference: "company-alpha",
      riskProbabilityHint: 75,
      validated: true,
    });
    engine.monitorFinancialRisks({
      companyReference: "company-alpha",
      riskProbabilityHint: 85,
      validated: true,
    });
    engine.monitorSupplierRisks({
      companyReference: "company-alpha",
      riskProbabilityHint: 70,
      validated: true,
    });
    engine.monitorMarketingRisks({
      companyReference: "company-alpha",
      riskProbabilityHint: 65,
      validated: true,
    });
    engine.monitorWorkforceRisks({
      companyReference: "company-alpha",
      riskProbabilityHint: 72,
      validated: true,
    });
    engine.monitorInfrastructureRisks({
      companyReference: "company-alpha",
      riskProbabilityHint: 78,
      validated: true,
    });

    const expansion = engine.detectUncontrolledExpansion({
      companyReference: "company-alpha",
      expansionPressureHint: 90,
      validated: true,
    });
    assert.notEqual(expansion.validation.decision, "fail");
    assert.ok(expansion.scalingRiskRecords.length >= 1);

    const ranked = engine.rankScalingRisks({
      companyReference: "company-alpha",
      validated: true,
    });
    assert.notEqual(ranked.validation.decision, "fail");
    assert.ok(ranked.scalingRiskRecords.length >= 1);

    const recommendations = engine.recommendRiskMitigations({
      companyReference: "company-alpha",
      validated: true,
    });
    assert.notEqual(recommendations.validation.decision, "fail");
    assert.ok(recommendations.recommendations.length >= 1);
    assert.ok(recommendations.recommendations[0]!.recommendationId.startsWith("srm-rec-"));
  });

  test("rejects unvalidated scaling risk input", async () => {
    const { engine } = await buildEngine();
    engine.connectScalingRiskMonitor();
    const report = engine.monitorScalingRisks({
      companyReference: "company-x",
    });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("validated=true")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendSrmLog({
      event: "scaling_risk_monitoring",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectScalingRiskMonitor();
    const logs = getSrmLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("missing upstream engines still produce structural scaling risk records", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const asf = createAutonomousScalingFrameworkEngine(bootstrap);
    await asf.initialize();
    const engine = createScalingRiskMonitorEngine(bootstrap, {
      autonomousScalingFramework: asf,
    });
    await engine.initialize();
    engine.connectScalingRiskMonitor();
    const report = engine.monitorScalingRisks({ validated: true });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.scalingRiskRecords[0]!.companyReference, "company-default");
    assert.ok(report.scalingRiskRecords[0]!.structuralSignalOnly);
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectScalingRiskMonitor();
    engine.monitorScalingRisks({
      companyReference: "company-alpha",
      riskProbabilityHint: 60,
      validated: true,
    });
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalScalingRiskRecords >= 1);
    assert.ok(Array.isArray(cockpit.recentLogs));
    engine.runDiagnostics({});
  });

  test("health monitoring and automatic recovery track failures", async () => {
    const { engine } = await buildEngine();
    engine.connectScalingRiskMonitor();
    engine.monitorScalingRisks({ companyReference: "a" });
    engine.monitorScalingRisks({ companyReference: "b" });
    const state = engine.getState();
    assert.ok(state.performance.failedOperations >= 2);
    assert.ok(state.health.consecutiveFailures >= 1 || state.health.recoveryAttempts >= 0);
    assert.ok(["healthy", "degraded", "failed", "standby"].includes(state.health.status));
  });
});
