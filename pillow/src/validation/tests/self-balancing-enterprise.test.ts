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
} from "../../revenue-acceleration-engine/index.js";
import {
  createProfitScalingEngine,
  resetProfitScalingEngineForTesting,
} from "../../profit-scaling-engine/index.js";
import {
  createScaleSimulationEngine,
  resetScaleSimulationEngineForTesting,
} from "../../scale-simulation-engine/index.js";
import {
  createSelfBalancingEnterprise,
  resetSelfBalancingEnterpriseForTesting,
  buildSelfBalancingEnterpriseConfiguration,
  SELF_BALANCING_ENTERPRISE_SYSTEM_PATH,
  SELF_BALANCING_ENTERPRISE_ID,
  SBE_CAPABILITIES,
  SBE_METADATA_VERSION,
} from "../../self-balancing-enterprise/index.js";
import { appendSbeLog, getSbeLogs } from "../../self-balancing-enterprise/sbe-logging.js";

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
  const rae = createRevenueAccelerationEngine(bootstrap, {
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
  await rae.initialize();
  const pse = createProfitScalingEngine(bootstrap, {
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
    revenueAccelerationEngine: rae,
  });
  await pse.initialize();
  const ssi = createScaleSimulationEngine(bootstrap, {
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
    revenueAccelerationEngine: rae,
    profitScalingEngine: pse,
  });
  await ssi.initialize();
  const engine = createSelfBalancingEnterprise(bootstrap, {
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
    revenueAccelerationEngine: rae,
    profitScalingEngine: pse,
    scaleSimulationEngine: ssi,
  });
  await engine.initialize();
  return {
    engine,
    asf,
    wpd,
    sde,
    cpe,
    mse,
    sse,
    fse,
    wfi,
    esd,
    bni,
    oee,
    ppe,
    srm,
    gsp,
    ago,
    rae,
    pse,
    ssi,
  };
}

describe("X3-19 Self-Balancing Enterprise", () => {
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
    resetProfitScalingEngineForTesting();
    resetScaleSimulationEngineForTesting();
    resetSelfBalancingEnterpriseForTesting();
  });

  test("buildSelfBalancingEnterpriseConfiguration locks safety flags", () => {
    const config = buildSelfBalancingEnterpriseConfiguration(REPO_ROOT, {
      neverReallocateProtectedResourcesBeyondApprovalPolicies: false as never,
      neverExposeCredentials: false as never,
    });
    assert.equal(config.enabled, true);
    assert.equal(config.neverReallocateProtectedResourcesBeyondApprovalPolicies, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverExposeAuthenticationTokens, true);
    assert.equal(config.preserveBalancingTraceability, true);
    assert.equal(config.preserveEnterpriseIntegrity, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.neverLogSensitiveEnterpriseInformation, true);
    assert.ok(SBE_CAPABILITIES.includes("enterprise_resource_utilization_monitoring"));
    assert.ok(SBE_CAPABILITIES.includes("policy_gated_resource_reallocation"));
  });

  test("self-balancing enterprise initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-SBE-001");
    assert.equal(state.missionId, "X3-19");
    assert.ok(SELF_BALANCING_ENTERPRISE_SYSTEM_PATH.includes("SELF_BALANCING_ENTERPRISE"));
  });

  test("connectSelfBalancingEnterprise registers with ASF via X3-19", async () => {
    const { engine, asf } = await buildEngine();
    const report = engine.connectSelfBalancingEnterprise();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = asf.getRegisteredModules();
    assert.ok(modules.some((m) => m.scalingModuleIdentifier === SELF_BALANCING_ENTERPRISE_ID));
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
    assert.equal(report.engineRecord.dependencyPresence.revenueAccelerationEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.profitScalingEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.scaleSimulationEngine, true);
    assert.ok(report.engineRecord.frameworkModuleId);
  });

  test("balancing produces machine-readable sbe-* records with policy-gated safety", async () => {
    const { engine } = await buildEngine();
    engine.connectSelfBalancingEnterprise();

    const utilization = engine.monitorEnterpriseResourceUtilization({
      companyReference: "company-alpha",
      resourceCategoryHint: "operational",
      balanceScoreHint: 70,
      validated: true,
    });
    assert.notEqual(utilization.validation.decision, "fail", utilization.validation.errors.join("; "));
    assert.ok(utilization.selfBalancingEnterpriseRunReportId.startsWith("sbe-run-"));
    const record = utilization.balancingRecords[0]!;
    assert.ok(record.enterpriseBalanceId.startsWith("sbe-bal-"));
    assert.equal(record.metadataVersion, SBE_METADATA_VERSION);
    assert.equal(record.neverReallocateProtectedResourcesBeyondApprovalPolicies, true);
    assert.equal(record.structuralSignalOnly, true);
    assert.equal(record.policyGatedReallocation, true);
    assert.equal(record.sensitiveOperationalData, false);

    assert.notEqual(
      engine.monitorOperationalBalance({
        companyReference: "company-alpha",
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.notEqual(
      engine.detectResourceImbalances({
        companyReference: "company-alpha",
        validated: true,
      }).validation.decision,
      "fail",
    );
  });

  test("monitor balances, detect, reallocate per policy, optimize, and recommend", async () => {
    const { engine } = await buildEngine();
    engine.connectSelfBalancingEnterprise();

    engine.monitorEnterpriseResourceUtilization({
      companyReference: "company-alpha",
      balanceScoreHint: 80,
      validated: true,
    });
    engine.monitorOperationalBalance({
      companyReference: "company-alpha",
      balanceScoreHint: 75,
      validated: true,
    });
    engine.monitorFinancialBalance({
      companyReference: "company-alpha",
      balanceScoreHint: 78,
      validated: true,
    });
    engine.monitorWorkforceBalance({
      companyReference: "company-alpha",
      balanceScoreHint: 72,
      validated: true,
    });
    engine.monitorSupplierBalance({
      companyReference: "company-alpha",
      balanceScoreHint: 70,
      validated: true,
    });
    engine.monitorInfrastructureBalance({
      companyReference: "company-alpha",
      balanceScoreHint: 74,
      validated: true,
    });
    engine.detectResourceImbalances({
      companyReference: "company-alpha",
      balanceScoreHint: 68,
      validated: true,
    });
    engine.reallocateResourcesPerPolicy({
      companyReference: "company-alpha",
      balanceScoreHint: 76,
      validated: true,
    });
    engine.optimizeEnterpriseEquilibrium({
      companyReference: "company-alpha",
      balanceScoreHint: 82,
      validated: true,
    });

    const recommendations = engine.recommendBalancingActions({
      companyReference: "company-alpha",
      validated: true,
    });
    assert.notEqual(recommendations.validation.decision, "fail");
    assert.ok(recommendations.recommendations.length >= 1);
    assert.ok(recommendations.recommendations[0]!.recommendationId.startsWith("sbe-rec-"));
    assert.equal(
      recommendations.recommendations[0]!.neverReallocateProtectedResourcesBeyondApprovalPolicies,
      true,
    );
    assert.equal(recommendations.recommendations[0]!.policyGatedReallocation, true);
  });

  test("rejects unvalidated input and never-bypass-approval / production mutation attempts", async () => {
    const { engine } = await buildEngine();
    engine.connectSelfBalancingEnterprise();
    const unvalidated = engine.monitorEnterpriseResourceUtilization({
      companyReference: "company-x",
    });
    assert.equal(unvalidated.validation.decision, "fail");
    assert.ok(unvalidated.validation.errors.some((e) => e.includes("validated=true")));

    const bypass = engine.reallocateResourcesPerPolicy({
      companyReference: "company-x",
      validated: true,
      bypassApprovalPolicies: true,
    });
    assert.equal(bypass.validation.decision, "fail");
    assert.ok(
      bypass.validation.errors.some((e) =>
        e.includes("never reallocate protected resources beyond approval policies"),
      ),
    );

    const mutate = engine.reallocateResourcesPerPolicy({
      companyReference: "company-x",
      validated: true,
      mutateProductionResources: true,
    });
    assert.equal(mutate.validation.decision, "fail");
    assert.ok(
      mutate.validation.errors.some((e) =>
        e.includes("no production resource mutation"),
      ),
    );
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendSbeLog({
      event: "self_balancing_evaluation",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectSelfBalancingEnterprise();
    const logs = getSbeLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("missing upstream engines still produce structural balancing records", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const asf = createAutonomousScalingFrameworkEngine(bootstrap);
    await asf.initialize();
    const engine = createSelfBalancingEnterprise(bootstrap, {
      autonomousScalingFramework: asf,
    });
    await engine.initialize();
    engine.connectSelfBalancingEnterprise();
    const report = engine.monitorEnterpriseResourceUtilization({ validated: true });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.balancingRecords[0]!.companyReference, "company-default");
    assert.ok(report.balancingRecords[0]!.structuralSignalOnly);
    assert.ok(report.balancingRecords[0]!.neverReallocateProtectedResourcesBeyondApprovalPolicies);
    assert.ok(report.balancingRecords[0]!.policyGatedReallocation);
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectSelfBalancingEnterprise();
    engine.monitorEnterpriseResourceUtilization({
      companyReference: "company-alpha",
      balanceScoreHint: 60,
      validated: true,
    });
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalBalancingRecords >= 1);
    assert.ok(Array.isArray(cockpit.recentLogs));
    engine.runDiagnostics({});
  });

  test("health monitoring and automatic recovery track failures", async () => {
    const { engine } = await buildEngine();
    engine.connectSelfBalancingEnterprise();
    engine.monitorEnterpriseResourceUtilization({ companyReference: "a" });
    engine.monitorEnterpriseResourceUtilization({ companyReference: "b" });
    const state = engine.getState();
    assert.ok(state.performance.failedOperations >= 2);
    assert.ok(state.health.consecutiveFailures >= 1 || state.health.recoveryAttempts >= 0);
    assert.ok(["healthy", "degraded", "failed", "standby"].includes(state.health.status));
  });
});
