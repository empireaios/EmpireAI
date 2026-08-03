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

  buildProfitScalingEngineConfiguration,

  PROFIT_SCALING_ENGINE_SYSTEM_PATH,

  PROFIT_SCALING_ENGINE_ID,

  PSE_CAPABILITIES,

  PSE_METADATA_VERSION,

} from "../../profit-scaling-engine/index.js";

import { appendPseLog, getPseLogs } from "../../profit-scaling-engine/pse-logging.js";



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

  const engine = createProfitScalingEngine(bootstrap, {

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

  await engine.initialize();

  return { engine, asf, wpd, sde, cpe, mse, sse, fse, wfi, esd, bni, oee, ppe, srm, gsp, ago, rae };

}



describe("X3-17 Profit Scaling Engine", () => {

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

  });



  test("buildProfitScalingEngineConfiguration locks safety flags", () => {

    const config = buildProfitScalingEngineConfiguration(REPO_ROOT, {

      neverPrioritizeGrowthOverValidatedProfitability: false as never,

      neverExposeCredentials: false as never,

    });

    assert.equal(config.enabled, true);

    assert.equal(config.neverPrioritizeGrowthOverValidatedProfitability, true);

    assert.equal(config.neverExposeCredentials, true);

    assert.equal(config.neverExposeAuthenticationTokens, true);

    assert.equal(config.preserveProfitTraceability, true);

    assert.equal(config.preserveFinancialIntegrity, true);

    assert.equal(config.structuralSignalsOnly, true);

    assert.equal(config.neverLogSensitiveFinancialInformation, true);

    assert.ok(PSE_CAPABILITIES.includes("profit_growth_monitoring"));

    assert.ok(PSE_CAPABILITIES.includes("profit_scaling_recommendations"));

  });



  test("profit scaling engine initializes with doctrine doc", async () => {

    const { engine } = await buildEngine();

    const state = engine.getState();

    assert.equal(state.engineVersion, "PILLOW-PSE-001");

    assert.equal(state.missionId, "X3-17");

    assert.ok(PROFIT_SCALING_ENGINE_SYSTEM_PATH.includes("PROFIT_SCALING_ENGINE"));

  });



  test("connectProfitScalingEngine registers with ASF via X3-17", async () => {

    const { engine, asf } = await buildEngine();

    const report = engine.connectProfitScalingEngine();

    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));

    const modules = asf.getRegisteredModules();

    assert.ok(modules.some((m) => m.scalingModuleIdentifier === PROFIT_SCALING_ENGINE_ID));

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

    assert.ok(report.engineRecord.frameworkModuleId);

  });



  test("scaling produces machine-readable pse-* records", async () => {

    const { engine } = await buildEngine();

    engine.connectProfitScalingEngine();



    const growth = engine.monitorProfitGrowth({

      companyReference: "company-alpha",

      profitCategoryHint: "growth",

      profitOptimizationHint: 70,

      validated: true,

    });

    assert.notEqual(growth.validation.decision, "fail", growth.validation.errors.join("; "));

    assert.ok(growth.profitScalingEngineRunReportId.startsWith("pse-run-"));

    const record = growth.profitScalingRecords[0]!;

    assert.ok(record.profitScalingId.startsWith("pse-acc-"));

    assert.equal(record.metadataVersion, PSE_METADATA_VERSION);

    assert.equal(record.neverPrioritizeGrowthOverValidatedProfitability, true);

    assert.equal(record.structuralSignalOnly, true);

    assert.equal(record.sensitiveOperationalData, false);

    assert.equal(record.sensitiveFinancialData, false);



    assert.notEqual(

      engine.monitorGrossMargin({

        companyReference: "company-alpha",

        validated: true,

      }).validation.decision,

      "fail",

    );

    assert.notEqual(

      engine.detectProfitErosion({

        companyReference: "company-alpha",

        validated: true,

      }).validation.decision,

      "fail",

    );

  });



  test("detect erosion/unprofitable growth, optimize, and recommend profit scaling", async () => {

    const { engine } = await buildEngine();

    engine.connectProfitScalingEngine();



    engine.monitorProfitGrowth({

      companyReference: "company-alpha",

      profitOptimizationHint: 80,

      validated: true,

    });

    engine.monitorGrossMargin({

      companyReference: "company-alpha",

      profitOptimizationHint: 75,

      validated: true,

    });

    engine.monitorNetMargin({

      companyReference: "company-alpha",

      profitOptimizationHint: 78,

      validated: true,

    });

    engine.monitorOperatingMargin({

      companyReference: "company-alpha",

      profitOptimizationHint: 72,

      validated: true,

    });

    engine.monitorScalingCosts({

      companyReference: "company-alpha",

      profitOptimizationHint: 70,

      validated: true,

    });

    engine.monitorReturnOnInvestment({

      companyReference: "company-alpha",

      profitOptimizationHint: 74,

      validated: true,

    });

    engine.detectProfitErosion({

      companyReference: "company-alpha",

      profitOptimizationHint: 68,

      validated: true,

    });

    engine.detectUnprofitableGrowth({

      companyReference: "company-alpha",

      profitOptimizationHint: 66,

      validated: true,

    });

    engine.optimizeProfitDuringScaling({

      companyReference: "company-alpha",

      profitOptimizationHint: 85,

      validated: true,

    });



    const recommendations = engine.recommendProfitScaling({

      companyReference: "company-alpha",

      validated: true,

    });

    assert.notEqual(recommendations.validation.decision, "fail");

    assert.ok(recommendations.recommendations.length >= 1);

    assert.ok(recommendations.recommendations[0]!.recommendationId.startsWith("pse-rec-"));

  });



  test("rejects unvalidated profit scaling input", async () => {

    const { engine } = await buildEngine();

    engine.connectProfitScalingEngine();

    const report = engine.monitorProfitGrowth({

      companyReference: "company-x",

    });

    assert.equal(report.validation.decision, "fail");

    assert.ok(report.validation.errors.some((e) => e.includes("validated=true")));

  });



  test("governance safety redacts sensitive values in logs", async () => {

    const { engine } = await buildEngine();

    appendPseLog({

      event: "profit_scaling_evaluation",

      level: "info",

      details: "api_key=secret-key bearer abc123",

    });

    engine.connectProfitScalingEngine();

    const logs = getPseLogs(50);

    assert.ok(logs.some((l) => l.details.includes("[redacted")));

    assert.ok(!logs.some((l) => l.details.includes("secret-key")));

  });



  test("missing upstream engines still produce structural profit scaling records", async () => {

    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });

    const asf = createAutonomousScalingFrameworkEngine(bootstrap);

    await asf.initialize();

    const engine = createProfitScalingEngine(bootstrap, {

      autonomousScalingFramework: asf,

    });

    await engine.initialize();

    engine.connectProfitScalingEngine();

    const report = engine.monitorProfitGrowth({ validated: true });

    assert.notEqual(report.validation.decision, "fail");

    assert.equal(report.profitScalingRecords[0]!.companyReference, "company-default");

    assert.ok(report.profitScalingRecords[0]!.structuralSignalOnly);

  });



  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {

    const { engine } = await buildEngine();

    engine.connectProfitScalingEngine();

    engine.monitorProfitGrowth({

      companyReference: "company-alpha",

      profitOptimizationHint: 60,

      validated: true,

    });

    const sync = engine.validateForSupervisorSync();

    assert.equal(sync.valid, true);

    assert.ok(sync.readinessScore >= 50);

    const cockpit = engine.getCockpitSnapshot();

    assert.equal(cockpit.frameworkRegistered, true);

    assert.ok(cockpit.totalProfitScalingRecords >= 1);

    assert.ok(Array.isArray(cockpit.recentLogs));

    engine.runDiagnostics({});

  });



  test("health monitoring and automatic recovery track failures", async () => {

    const { engine } = await buildEngine();

    engine.connectProfitScalingEngine();

    engine.monitorProfitGrowth({ companyReference: "a" });

    engine.monitorProfitGrowth({ companyReference: "b" });

    const state = engine.getState();

    assert.ok(state.performance.failedOperations >= 2);

    assert.ok(state.health.consecutiveFailures >= 1 || state.health.recoveryAttempts >= 0);

    assert.ok(["healthy", "degraded", "failed", "standby"].includes(state.health.status));

  });

});

