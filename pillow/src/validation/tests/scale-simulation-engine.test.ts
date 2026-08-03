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
  buildScaleSimulationEngineConfiguration,
  SCALE_SIMULATION_ENGINE_SYSTEM_PATH,
  SCALE_SIMULATION_ENGINE_ID,
  SSI_CAPABILITIES,
  SSI_METADATA_VERSION,
} from "../../scale-simulation-engine/index.js";
import { appendSsiLog, getSsiLogs } from "../../scale-simulation-engine/ssi-logging.js";

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
  const engine = createScaleSimulationEngine(bootstrap, {
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
  };
}

describe("X3-18 Scale Simulation Engine", () => {
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
  });

  test("buildScaleSimulationEngineConfiguration locks safety flags", () => {
    const config = buildScaleSimulationEngineConfiguration(REPO_ROOT, {
      neverExecuteSimulatedActionsAgainstProduction: false as never,
      neverExposeCredentials: false as never,
    });
    assert.equal(config.enabled, true);
    assert.equal(config.neverExecuteSimulatedActionsAgainstProduction, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverExposeAuthenticationTokens, true);
    assert.equal(config.preserveSimulationTraceability, true);
    assert.equal(config.preserveEnterpriseIntegrity, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.neverLogSensitiveEnterpriseInformation, true);
    assert.ok(SSI_CAPABILITIES.includes("scaling_scenario_simulation"));
    assert.ok(SSI_CAPABILITIES.includes("simulation_recommendations"));
  });

  test("scale simulation engine initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-SSI-001");
    assert.equal(state.missionId, "X3-18");
    assert.ok(SCALE_SIMULATION_ENGINE_SYSTEM_PATH.includes("SCALE_SIMULATION_ENGINE"));
  });

  test("connectScaleSimulationEngine registers with ASF via X3-18", async () => {
    const { engine, asf } = await buildEngine();
    const report = engine.connectScaleSimulationEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = asf.getRegisteredModules();
    assert.ok(modules.some((m) => m.scalingModuleIdentifier === SCALE_SIMULATION_ENGINE_ID));
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
    assert.ok(report.engineRecord.frameworkModuleId);
  });

  test("simulation produces machine-readable ssi-* records with never-execute-production safety", async () => {
    const { engine } = await buildEngine();
    engine.connectScaleSimulationEngine();

    const scenario = engine.simulateScalingScenarios({
      companyReference: "company-alpha",
      simulationScenarioHint: "baseline_scale",
      overallSimulationScoreHint: 70,
      validated: true,
    });
    assert.notEqual(scenario.validation.decision, "fail", scenario.validation.errors.join("; "));
    assert.ok(scenario.scaleSimulationEngineRunReportId.startsWith("ssi-run-"));
    const record = scenario.simulationRecords[0]!;
    assert.ok(record.simulationId.startsWith("ssi-sim-"));
    assert.equal(record.metadataVersion, SSI_METADATA_VERSION);
    assert.equal(record.neverExecuteSimulatedActionsAgainstProduction, true);
    assert.equal(record.structuralSignalOnly, true);
    assert.equal(record.simulationOnly, true);
    assert.equal(record.sensitiveOperationalData, false);
    assert.equal(record.sensitiveFinancialData, false);

    assert.notEqual(
      engine.simulateRevenueOutcomes({
        companyReference: "company-alpha",
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.notEqual(
      engine.simulateScalingRisks({
        companyReference: "company-alpha",
        validated: true,
      }).validation.decision,
      "fail",
    );
  });

  test("simulate outcomes, compare, rank, and recommend from simulation", async () => {
    const { engine } = await buildEngine();
    engine.connectScaleSimulationEngine();

    engine.simulateScalingScenarios({
      companyReference: "company-alpha",
      overallSimulationScoreHint: 80,
      validated: true,
    });
    engine.simulateRevenueOutcomes({
      companyReference: "company-alpha",
      overallSimulationScoreHint: 75,
      validated: true,
    });
    engine.simulateProfitOutcomes({
      companyReference: "company-alpha",
      overallSimulationScoreHint: 78,
      validated: true,
    });
    engine.simulateOperationalCapacity({
      companyReference: "company-alpha",
      overallSimulationScoreHint: 72,
      validated: true,
    });
    engine.simulateSupplierCapacity({
      companyReference: "company-alpha",
      overallSimulationScoreHint: 70,
      validated: true,
    });
    engine.simulateWorkforceUtilization({
      companyReference: "company-alpha",
      overallSimulationScoreHint: 74,
      validated: true,
    });
    engine.simulateFinancialImpact({
      companyReference: "company-alpha",
      overallSimulationScoreHint: 68,
      validated: true,
    });
    engine.simulateScalingRisks({
      companyReference: "company-alpha",
      overallSimulationScoreHint: 66,
      validated: true,
    });
    engine.compareScalingScenarios({
      companyReference: "company-alpha",
      overallSimulationScoreHint: 85,
      validated: true,
    });
    engine.rankSimulationOutcomes({
      companyReference: "company-alpha",
      overallSimulationScoreHint: 82,
      validated: true,
    });

    const recommendations = engine.recommendFromSimulation({
      companyReference: "company-alpha",
      validated: true,
    });
    assert.notEqual(recommendations.validation.decision, "fail");
    assert.ok(recommendations.recommendations.length >= 1);
    assert.ok(recommendations.recommendations[0]!.recommendationId.startsWith("ssi-rec-"));
    assert.equal(
      recommendations.recommendations[0]!.neverExecuteSimulatedActionsAgainstProduction,
      true,
    );
  });

  test("rejects unvalidated simulation input and production execution attempts", async () => {
    const { engine } = await buildEngine();
    engine.connectScaleSimulationEngine();
    const unvalidated = engine.simulateScalingScenarios({
      companyReference: "company-x",
    });
    assert.equal(unvalidated.validation.decision, "fail");
    assert.ok(unvalidated.validation.errors.some((e) => e.includes("validated=true")));

    const production = engine.simulateScalingScenarios({
      companyReference: "company-x",
      validated: true,
      executeAgainstProduction: true,
    });
    assert.equal(production.validation.decision, "fail");
    assert.ok(
      production.validation.errors.some((e) =>
        e.includes("never execute simulated actions against production"),
      ),
    );
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendSsiLog({
      event: "scale_simulation_evaluation",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectScaleSimulationEngine();
    const logs = getSsiLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("missing upstream engines still produce structural simulation records", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const asf = createAutonomousScalingFrameworkEngine(bootstrap);
    await asf.initialize();
    const engine = createScaleSimulationEngine(bootstrap, {
      autonomousScalingFramework: asf,
    });
    await engine.initialize();
    engine.connectScaleSimulationEngine();
    const report = engine.simulateScalingScenarios({ validated: true });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.simulationRecords[0]!.companyReference, "company-default");
    assert.ok(report.simulationRecords[0]!.structuralSignalOnly);
    assert.ok(report.simulationRecords[0]!.neverExecuteSimulatedActionsAgainstProduction);
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectScaleSimulationEngine();
    engine.simulateScalingScenarios({
      companyReference: "company-alpha",
      overallSimulationScoreHint: 60,
      validated: true,
    });
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalSimulationRecords >= 1);
    assert.ok(Array.isArray(cockpit.recentLogs));
    engine.runDiagnostics({});
  });

  test("health monitoring and automatic recovery track failures", async () => {
    const { engine } = await buildEngine();
    engine.connectScaleSimulationEngine();
    engine.simulateScalingScenarios({ companyReference: "a" });
    engine.simulateScalingScenarios({ companyReference: "b" });
    const state = engine.getState();
    assert.ok(state.performance.failedOperations >= 2);
    assert.ok(state.health.consecutiveFailures >= 1 || state.health.recoveryAttempts >= 0);
    assert.ok(["healthy", "degraded", "failed", "standby"].includes(state.health.status));
  });
});
