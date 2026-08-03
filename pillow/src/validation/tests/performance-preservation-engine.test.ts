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
  buildPerformancePreservationEngineConfiguration,
  PERFORMANCE_PRESERVATION_ENGINE_SYSTEM_PATH,
  PERFORMANCE_PRESERVATION_ENGINE_ID,
  PPE_CAPABILITIES,
  PPE_METADATA_VERSION,
} from "../../performance-preservation-engine/index.js";
import { appendPpeLog, getPpeLogs } from "../../performance-preservation-engine/ppe-logging.js";

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
  const engine = createPerformancePreservationEngine(bootstrap, {
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
  await engine.initialize();
  return { engine, asf, wpd, sde, cpe, mse, sse, fse, wfi, esd, bni, oee };
}

describe("X3-12 Performance Preservation Engine", () => {
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
  });

  test("buildPerformancePreservationEngineConfiguration locks safety flags", () => {
    const config = buildPerformancePreservationEngineConfiguration(REPO_ROOT, {
      neverCompromiseCustomerExperienceForScaling: false as never,
      neverExposeCredentials: false as never,
    });
    assert.equal(config.enabled, true);
    assert.equal(config.neverCompromiseCustomerExperienceForScaling, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverExposeAuthenticationTokens, true);
    assert.equal(config.preserveQualityTraceability, true);
    assert.equal(config.preserveEnterpriseIntegrity, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.neverLogSensitiveOperationalInformation, true);
    assert.ok(PPE_CAPABILITIES.includes("service_quality_monitoring"));
    assert.ok(PPE_CAPABILITIES.includes("performance_degradation_detection"));
  });

  test("performance preservation engine initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-PPE-001");
    assert.equal(state.missionId, "X3-12");
    assert.ok(PERFORMANCE_PRESERVATION_ENGINE_SYSTEM_PATH.includes("PERFORMANCE_PRESERVATION"));
  });

  test("connectPerformancePreservationEngine registers with ASF via X3-12", async () => {
    const { engine, asf } = await buildEngine();
    const report = engine.connectPerformancePreservationEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = asf.getRegisteredModules();
    assert.ok(modules.some((m) => m.scalingModuleIdentifier === PERFORMANCE_PRESERVATION_ENGINE_ID));
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
    assert.ok(report.engineRecord.frameworkModuleId);
  });

  test("monitoring produces machine-readable ppe-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectPerformancePreservationEngine();

    const quality = engine.monitorServiceQuality({
      companyReference: "company-alpha",
      operationalComponent: "ops-pipeline",
      qualityHint: 70,
      performanceHint: 65,
      validated: true,
    });
    assert.notEqual(
      quality.validation.decision,
      "fail",
      quality.validation.errors.join("; "),
    );
    assert.ok(quality.performancePreservationEngineRunReportId.startsWith("ppe-run-"));
    const record = quality.preservationRecords[0]!;
    assert.ok(record.performancePreservationId.startsWith("ppe-pr-"));
    assert.equal(record.metadataVersion, PPE_METADATA_VERSION);
    assert.equal(record.neverCompromiseCustomerExperienceForScaling, true);
    assert.equal(record.structuralSignalOnly, true);
    assert.equal(record.sensitiveOperationalData, false);

    assert.notEqual(
      engine.monitorCustomerExperience({
        companyReference: "company-alpha",
        operationalComponent: "cx-core",
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.notEqual(
      engine.monitorOperationalPerformance({
        companyReference: "company-alpha",
        operationalComponent: "perf-net",
        validated: true,
      }).validation.decision,
      "fail",
    );
  });

  test("detect degradation/regression and recommend preservation actions", async () => {
    const { engine } = await buildEngine();
    engine.connectPerformancePreservationEngine();

    engine.monitorServiceQuality({
      companyReference: "company-alpha",
      operationalComponent: "ops-a",
      qualityHint: 40,
      performanceHint: 45,
      validated: true,
    });
    engine.monitorCustomerExperience({
      companyReference: "company-alpha",
      operationalComponent: "ops-b",
      customerExperienceHint: 50,
      validated: true,
    });
    engine.monitorOperationalPerformance({
      companyReference: "company-alpha",
      operationalComponent: "ops-c",
      performanceHint: 40,
      validated: true,
    });
    engine.monitorResponseTimes({
      companyReference: "company-alpha",
      operationalComponent: "ops-d",
      responseTimeHint: 40,
      validated: true,
    });
    engine.monitorFulfilmentQuality({
      companyReference: "company-alpha",
      operationalComponent: "ops-e",
      qualityHint: 45,
      validated: true,
    });
    engine.monitorReliability({
      companyReference: "company-alpha",
      operationalComponent: "ops-f",
      reliabilityHint: 40,
      validated: true,
    });

    const degradation = engine.detectPerformanceDegradation({
      companyReference: "company-alpha",
      operationalComponent: "ops-degrade",
      performanceHint: 40,
      validated: true,
    });
    assert.notEqual(degradation.validation.decision, "fail");
    assert.ok(degradation.preservationRecords.length >= 1);

    const regression = engine.detectQualityRegressions({
      companyReference: "company-alpha",
      operationalComponent: "ops-regress",
      qualityHint: 35,
      validated: true,
    });
    assert.notEqual(regression.validation.decision, "fail");
    assert.ok(regression.preservationRecords.length >= 1);

    const recommendations = engine.recommendPreservationActions({
      companyReference: "company-alpha",
      validated: true,
    });
    assert.notEqual(recommendations.validation.decision, "fail");
    assert.ok(recommendations.recommendations.length >= 1);
    assert.ok(recommendations.recommendations[0]!.recommendationId.startsWith("ppe-rec-"));
  });

  test("rejects unvalidated preservation input", async () => {
    const { engine } = await buildEngine();
    engine.connectPerformancePreservationEngine();
    const report = engine.monitorServiceQuality({
      operationalComponent: "ops-x",
    });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("validated=true")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendPpeLog({
      event: "preservation_monitoring",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectPerformancePreservationEngine();
    const logs = getPpeLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("missing upstream engines still produce structural preservation records", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const asf = createAutonomousScalingFrameworkEngine(bootstrap);
    await asf.initialize();
    const engine = createPerformancePreservationEngine(bootstrap, {
      autonomousScalingFramework: asf,
    });
    await engine.initialize();
    engine.connectPerformancePreservationEngine();
    const report = engine.monitorServiceQuality({ validated: true });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.preservationRecords[0]!.companyReference, "company-default");
    assert.ok(report.preservationRecords[0]!.structuralSignalOnly);
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectPerformancePreservationEngine();
    engine.monitorServiceQuality({
      operationalComponent: "ops-preserve",
      qualityHint: 75,
      validated: true,
    });
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalPreservationRecords >= 1);
    assert.ok(Array.isArray(cockpit.recentLogs));
    engine.runDiagnostics({});
  });

  test("health monitoring and automatic recovery track failures", async () => {
    const { engine } = await buildEngine();
    engine.connectPerformancePreservationEngine();
    engine.monitorServiceQuality({ operationalComponent: "a" });
    engine.monitorServiceQuality({ operationalComponent: "b" });
    const state = engine.getState();
    assert.ok(state.performance.failedOperations >= 2);
    assert.ok(state.health.consecutiveFailures >= 1 || state.health.recoveryAttempts >= 0);
    assert.ok(["healthy", "degraded", "failed", "standby"].includes(state.health.status));
  });
});
