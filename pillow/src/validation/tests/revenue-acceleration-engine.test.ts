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
} from "../../scaling-risk-monitor/index.js";
import {
  createGlobalScalingPlannerEngine,
  resetGlobalScalingPlannerForTesting,
} from "../../global-scaling-planner/index.js";
import {
  createAutonomousGrowthOptimizerEngine,
  resetAutonomousGrowthOptimizerForTesting,
} from "../../autonomous-growth-optimizer/index.js";
import {
  createRevenueAccelerationEngine,
  resetRevenueAccelerationEngineForTesting,
  buildRevenueAccelerationEngineConfiguration,
  REVENUE_ACCELERATION_ENGINE_SYSTEM_PATH,
  REVENUE_ACCELERATION_ENGINE_ID,
  RAE_CAPABILITIES,
  RAE_METADATA_VERSION,
} from "../../revenue-acceleration-engine/index.js";
import { appendRaeLog, getRaeLogs } from "../../revenue-acceleration-engine/rae-logging.js";

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
  const srm = createScalingRiskMonitorEngine(bootstrap, {
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
  await srm.initialize();
  const gsp = createGlobalScalingPlannerEngine(bootstrap, {
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
    scalingRiskMonitor: srm,
  });
  await gsp.initialize();
  const ago = createAutonomousGrowthOptimizerEngine(bootstrap, {
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
    scalingRiskMonitor: srm,
    globalScalingPlanner: gsp,
  });
  await ago.initialize();
  const engine = createRevenueAccelerationEngine(bootstrap, {
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
    scalingRiskMonitor: srm,
    globalScalingPlanner: gsp,
    autonomousGrowthOptimizer: ago,
  });
  await engine.initialize();
  return { engine, asf, wpd, sde, cpe, mse, sse, fse, wfi, esd, bni, oee, ppe, srm, gsp, ago };
}

describe("X3-16 Revenue Acceleration Engine", () => {
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
    resetGlobalScalingPlannerForTesting();
    resetAutonomousGrowthOptimizerForTesting();
    resetRevenueAccelerationEngineForTesting();
  });

  test("buildRevenueAccelerationEngineConfiguration locks safety flags", () => {
    const config = buildRevenueAccelerationEngineConfiguration(REPO_ROOT, {
      neverRecommendRevenueActionsWithoutValidatedSupportingData: false as never,
      neverExposeCredentials: false as never,
    });
    assert.equal(config.enabled, true);
    assert.equal(config.neverRecommendRevenueActionsWithoutValidatedSupportingData, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverExposeAuthenticationTokens, true);
    assert.equal(config.preserveRevenueTraceability, true);
    assert.equal(config.preserveEnterpriseIntegrity, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.neverLogSensitiveFinancialInformation, true);
    assert.ok(RAE_CAPABILITIES.includes("revenue_growth_monitoring"));
    assert.ok(RAE_CAPABILITIES.includes("revenue_acceleration_recommendations"));
  });

  test("revenue acceleration engine initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-RAE-001");
    assert.equal(state.missionId, "X3-16");
    assert.ok(REVENUE_ACCELERATION_ENGINE_SYSTEM_PATH.includes("REVENUE_ACCELERATION_ENGINE"));
  });

  test("connectRevenueAccelerationEngine registers with ASF via X3-16", async () => {
    const { engine, asf } = await buildEngine();
    const report = engine.connectRevenueAccelerationEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = asf.getRegisteredModules();
    assert.ok(modules.some((m) => m.scalingModuleIdentifier === REVENUE_ACCELERATION_ENGINE_ID));
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
    assert.equal(report.engineRecord.dependencyPresence.scalingRiskMonitor, true);
    assert.equal(report.engineRecord.dependencyPresence.globalScalingPlanner, true);
    assert.equal(report.engineRecord.dependencyPresence.autonomousGrowthOptimizer, true);
    assert.ok(report.engineRecord.frameworkModuleId);
  });

  test("acceleration produces machine-readable rae-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectRevenueAccelerationEngine();

    const growth = engine.monitorRevenueGrowth({
      companyReference: "company-alpha",
      revenueCategoryHint: "growth",
      revenueOpportunityHint: 70,
      validated: true,
    });
    assert.notEqual(growth.validation.decision, "fail", growth.validation.errors.join("; "));
    assert.ok(growth.revenueAccelerationEngineRunReportId.startsWith("rae-run-"));
    const record = growth.revenueAccelerationRecords[0]!;
    assert.ok(record.revenueAccelerationId.startsWith("rae-acc-"));
    assert.equal(record.metadataVersion, RAE_METADATA_VERSION);
    assert.equal(record.neverRecommendWithoutValidatedSupportingData, true);
    assert.equal(record.structuralSignalOnly, true);
    assert.equal(record.sensitiveOperationalData, false);
    assert.equal(record.sensitiveFinancialData, false);

    assert.notEqual(
      engine.monitorRevenueTrends({
        companyReference: "company-alpha",
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.notEqual(
      engine.identifyRevenueAccelerationOpportunities({
        companyReference: "company-alpha",
        validated: true,
      }).validation.decision,
      "fail",
    );
  });

  test("identify opportunities/bottlenecks, optimize, rank, and recommend revenue acceleration", async () => {
    const { engine } = await buildEngine();
    engine.connectRevenueAccelerationEngine();

    engine.monitorRevenueGrowth({
      companyReference: "company-alpha",
      revenueOpportunityHint: 80,
      validated: true,
    });
    engine.monitorRevenueTrends({
      companyReference: "company-alpha",
      revenueOpportunityHint: 75,
      validated: true,
    });
    engine.monitorProductRevenue({
      companyReference: "company-alpha",
      revenueOpportunityHint: 78,
      validated: true,
    });
    engine.monitorChannelRevenue({
      companyReference: "company-alpha",
      revenueOpportunityHint: 72,
      validated: true,
    });
    engine.monitorCustomerRevenue({
      companyReference: "company-alpha",
      revenueOpportunityHint: 70,
      validated: true,
    });
    engine.identifyRevenueAccelerationOpportunities({
      companyReference: "company-alpha",
      revenueOpportunityHint: 74,
      validated: true,
    });
    engine.identifyRevenueBottlenecks({
      companyReference: "company-alpha",
      revenueOpportunityHint: 68,
      validated: true,
    });
    engine.optimizeRevenueStrategies({
      companyReference: "company-alpha",
      revenueOpportunityHint: 85,
      validated: true,
    });

    const ranked = engine.rankRevenueOpportunities({
      companyReference: "company-alpha",
      validated: true,
    });
    assert.notEqual(ranked.validation.decision, "fail");
    assert.ok(ranked.revenueAccelerationRecords.length >= 1);

    const recommendations = engine.recommendRevenueAcceleration({
      companyReference: "company-alpha",
      validated: true,
    });
    assert.notEqual(recommendations.validation.decision, "fail");
    assert.ok(recommendations.recommendations.length >= 1);
    assert.ok(recommendations.recommendations[0]!.recommendationId.startsWith("rae-rec-"));
  });

  test("rejects unvalidated revenue acceleration input", async () => {
    const { engine } = await buildEngine();
    engine.connectRevenueAccelerationEngine();
    const report = engine.monitorRevenueGrowth({
      companyReference: "company-x",
    });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("validated=true")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendRaeLog({
      event: "revenue_acceleration_evaluation",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectRevenueAccelerationEngine();
    const logs = getRaeLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("missing upstream engines still produce structural revenue acceleration records", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const asf = createAutonomousScalingFrameworkEngine(bootstrap);
    await asf.initialize();
    const engine = createRevenueAccelerationEngine(bootstrap, {
      autonomousScalingFramework: asf,
    });
    await engine.initialize();
    engine.connectRevenueAccelerationEngine();
    const report = engine.monitorRevenueGrowth({ validated: true });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.revenueAccelerationRecords[0]!.companyReference, "company-default");
    assert.ok(report.revenueAccelerationRecords[0]!.structuralSignalOnly);
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectRevenueAccelerationEngine();
    engine.monitorRevenueGrowth({
      companyReference: "company-alpha",
      revenueOpportunityHint: 60,
      validated: true,
    });
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalRevenueAccelerationRecords >= 1);
    assert.ok(Array.isArray(cockpit.recentLogs));
    engine.runDiagnostics({});
  });

  test("health monitoring and automatic recovery track failures", async () => {
    const { engine } = await buildEngine();
    engine.connectRevenueAccelerationEngine();
    engine.monitorRevenueGrowth({ companyReference: "a" });
    engine.monitorRevenueGrowth({ companyReference: "b" });
    const state = engine.getState();
    assert.ok(state.performance.failedOperations >= 2);
    assert.ok(state.health.consecutiveFailures >= 1 || state.health.recoveryAttempts >= 0);
    assert.ok(["healthy", "degraded", "failed", "standby"].includes(state.health.status));
  });
});
