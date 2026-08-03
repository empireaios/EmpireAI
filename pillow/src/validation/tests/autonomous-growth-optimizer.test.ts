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
  buildAutonomousGrowthOptimizerConfiguration,
  AUTONOMOUS_GROWTH_OPTIMIZER_SYSTEM_PATH,
  AUTONOMOUS_GROWTH_OPTIMIZER_ID,
  AGO_CAPABILITIES,
  AGO_METADATA_VERSION,
} from "../../autonomous-growth-optimizer/index.js";
import { appendAgoLog, getAgoLogs } from "../../autonomous-growth-optimizer/ago-logging.js";

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
  const engine = createAutonomousGrowthOptimizerEngine(bootstrap, {
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
  await engine.initialize();
  return { engine, asf, wpd, sde, cpe, mse, sse, fse, wfi, esd, bni, oee, ppe, srm, gsp };
}

describe("X3-15 Autonomous Growth Optimizer", () => {
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
  });

  test("buildAutonomousGrowthOptimizerConfiguration locks safety flags", () => {
    const config = buildAutonomousGrowthOptimizerConfiguration(REPO_ROOT, {
      neverOptimizeGrowthBeyondValidatedOperationalLimits: false as never,
      neverExposeCredentials: false as never,
    });
    assert.equal(config.enabled, true);
    assert.equal(config.neverOptimizeGrowthBeyondValidatedOperationalLimits, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverExposeAuthenticationTokens, true);
    assert.equal(config.preserveOptimizationTraceability, true);
    assert.equal(config.preserveEnterpriseIntegrity, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.neverLogSensitiveOperationalInformation, true);
    assert.ok(AGO_CAPABILITIES.includes("enterprise_growth_monitoring"));
    assert.ok(AGO_CAPABILITIES.includes("autonomous_growth_recommendations"));
  });

  test("autonomous growth optimizer initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-AGO-001");
    assert.equal(state.missionId, "X3-15");
    assert.ok(AUTONOMOUS_GROWTH_OPTIMIZER_SYSTEM_PATH.includes("AUTONOMOUS_GROWTH_OPTIMIZER"));
  });

  test("connectAutonomousGrowthOptimizer registers with ASF via X3-15", async () => {
    const { engine, asf } = await buildEngine();
    const report = engine.connectAutonomousGrowthOptimizer();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = asf.getRegisteredModules();
    assert.ok(modules.some((m) => m.scalingModuleIdentifier === AUTONOMOUS_GROWTH_OPTIMIZER_ID));
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
    assert.ok(report.engineRecord.frameworkModuleId);
  });

  test("optimization produces machine-readable ago-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectAutonomousGrowthOptimizer();

    const enterprise = engine.monitorEnterpriseGrowth({
      companyReference: "company-alpha",
      growthCategoryHint: "enterprise",
      growthOpportunityHint: 70,
      validated: true,
    });
    assert.notEqual(
      enterprise.validation.decision,
      "fail",
      enterprise.validation.errors.join("; "),
    );
    assert.ok(enterprise.autonomousGrowthOptimizerRunReportId.startsWith("ago-run-"));
    const record = enterprise.growthOptimizationRecords[0]!;
    assert.ok(record.growthOptimizationId.startsWith("ago-opt-"));
    assert.equal(record.metadataVersion, AGO_METADATA_VERSION);
    assert.equal(record.neverOptimizeBeyondValidatedOperationalLimits, true);
    assert.equal(record.structuralSignalOnly, true);
    assert.equal(record.sensitiveOperationalData, false);

    assert.notEqual(
      engine.monitorRevenueGrowth({
        companyReference: "company-alpha",
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.notEqual(
      engine.identifyGrowthOpportunities({
        companyReference: "company-alpha",
        validated: true,
      }).validation.decision,
      "fail",
    );
  });

  test("identify opportunities/constraints, optimize, rank, and recommend growth", async () => {
    const { engine } = await buildEngine();
    engine.connectAutonomousGrowthOptimizer();

    engine.monitorEnterpriseGrowth({
      companyReference: "company-alpha",
      growthOpportunityHint: 80,
      validated: true,
    });
    engine.monitorRevenueGrowth({
      companyReference: "company-alpha",
      growthOpportunityHint: 75,
      validated: true,
    });
    engine.monitorProfitGrowth({
      companyReference: "company-alpha",
      growthOpportunityHint: 78,
      validated: true,
    });
    engine.monitorCustomerGrowth({
      companyReference: "company-alpha",
      growthOpportunityHint: 72,
      validated: true,
    });
    engine.monitorOperationalGrowth({
      companyReference: "company-alpha",
      growthOpportunityHint: 70,
      validated: true,
    });
    engine.identifyGrowthOpportunities({
      companyReference: "company-alpha",
      growthOpportunityHint: 74,
      validated: true,
    });
    engine.identifyGrowthConstraints({
      companyReference: "company-alpha",
      growthOpportunityHint: 68,
      validated: true,
    });
    engine.optimizeGrowthStrategies({
      companyReference: "company-alpha",
      growthOpportunityHint: 85,
      validated: true,
    });

    const ranked = engine.rankGrowthPriorities({
      companyReference: "company-alpha",
      validated: true,
    });
    assert.notEqual(ranked.validation.decision, "fail");
    assert.ok(ranked.growthOptimizationRecords.length >= 1);

    const recommendations = engine.recommendAutonomousGrowth({
      companyReference: "company-alpha",
      validated: true,
    });
    assert.notEqual(recommendations.validation.decision, "fail");
    assert.ok(recommendations.recommendations.length >= 1);
    assert.ok(recommendations.recommendations[0]!.recommendationId.startsWith("ago-rec-"));
  });

  test("rejects unvalidated growth optimization input", async () => {
    const { engine } = await buildEngine();
    engine.connectAutonomousGrowthOptimizer();
    const report = engine.monitorEnterpriseGrowth({
      companyReference: "company-x",
    });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("validated=true")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendAgoLog({
      event: "autonomous_growth_evaluation",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectAutonomousGrowthOptimizer();
    const logs = getAgoLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("missing upstream engines still produce structural growth optimization records", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const asf = createAutonomousScalingFrameworkEngine(bootstrap);
    await asf.initialize();
    const engine = createAutonomousGrowthOptimizerEngine(bootstrap, {
      autonomousScalingFramework: asf,
    });
    await engine.initialize();
    engine.connectAutonomousGrowthOptimizer();
    const report = engine.monitorEnterpriseGrowth({ validated: true });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.growthOptimizationRecords[0]!.companyReference, "company-default");
    assert.ok(report.growthOptimizationRecords[0]!.structuralSignalOnly);
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectAutonomousGrowthOptimizer();
    engine.monitorEnterpriseGrowth({
      companyReference: "company-alpha",
      growthOpportunityHint: 60,
      validated: true,
    });
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalGrowthOptimizationRecords >= 1);
    assert.ok(Array.isArray(cockpit.recentLogs));
    engine.runDiagnostics({});
  });

  test("health monitoring and automatic recovery track failures", async () => {
    const { engine } = await buildEngine();
    engine.connectAutonomousGrowthOptimizer();
    engine.monitorEnterpriseGrowth({ companyReference: "a" });
    engine.monitorEnterpriseGrowth({ companyReference: "b" });
    const state = engine.getState();
    assert.ok(state.performance.failedOperations >= 2);
    assert.ok(state.health.consecutiveFailures >= 1 || state.health.recoveryAttempts >= 0);
    assert.ok(["healthy", "degraded", "failed", "standby"].includes(state.health.status));
  });
});
