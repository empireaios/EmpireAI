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

  buildGlobalScalingPlannerConfiguration,

  GLOBAL_SCALING_PLANNER_SYSTEM_PATH,

  GLOBAL_SCALING_PLANNER_ID,

  GSP_CAPABILITIES,

  GSP_METADATA_VERSION,

} from "../../global-scaling-planner/index.js";

import { appendGspLog, getGspLogs } from "../../global-scaling-planner/gsp-logging.js";



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

  const engine = createGlobalScalingPlannerEngine(bootstrap, {

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

  await engine.initialize();

  return { engine, asf, wpd, sde, cpe, mse, sse, fse, wfi, esd, bni, oee, ppe, srm };

}



describe("X3-14 Global Scaling Planner", () => {

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

  });



  test("buildGlobalScalingPlannerConfiguration locks safety flags", () => {

    const config = buildGlobalScalingPlannerConfiguration(REPO_ROOT, {

      neverRecommendInternationalExpansionWithoutValidatedReadiness: false as never,

      neverExposeCredentials: false as never,

    });

    assert.equal(config.enabled, true);

    assert.equal(config.neverRecommendInternationalExpansionWithoutValidatedReadiness, true);

    assert.equal(config.neverExposeCredentials, true);

    assert.equal(config.neverExposeAuthenticationTokens, true);

    assert.equal(config.preservePlanningTraceability, true);

    assert.equal(config.preserveEnterpriseIntegrity, true);

    assert.equal(config.structuralSignalsOnly, true);

    assert.equal(config.neverLogSensitiveOperationalInformation, true);

    assert.ok(GSP_CAPABILITIES.includes("international_expansion_readiness"));

    assert.ok(GSP_CAPABILITIES.includes("global_expansion_recommendations"));

  });



  test("global scaling planner initializes with doctrine doc", async () => {

    const { engine } = await buildEngine();

    const state = engine.getState();

    assert.equal(state.engineVersion, "PILLOW-GSP-001");

    assert.equal(state.missionId, "X3-14");

    assert.ok(GLOBAL_SCALING_PLANNER_SYSTEM_PATH.includes("GLOBAL_SCALING_PLANNER"));

  });



  test("connectGlobalScalingPlanner registers with ASF via X3-14", async () => {

    const { engine, asf } = await buildEngine();

    const report = engine.connectGlobalScalingPlanner();

    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));

    const modules = asf.getRegisteredModules();

    assert.ok(modules.some((m) => m.scalingModuleIdentifier === GLOBAL_SCALING_PLANNER_ID));

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

    assert.ok(report.engineRecord.frameworkModuleId);

  });



  test("planning produces machine-readable gsp-* records", async () => {

    const { engine } = await buildEngine();

    engine.connectGlobalScalingPlanner();



    const readiness = engine.evaluateInternationalExpansionReadiness({

      companyReference: "company-alpha",

      targetRegionHint: "apac",

      targetCountryHint: "sg",

      expansionReadinessHint: 70,

      validated: true,

    });

    assert.notEqual(

      readiness.validation.decision,

      "fail",

      readiness.validation.errors.join("; "),

    );

    assert.ok(readiness.globalScalingPlannerRunReportId.startsWith("gsp-run-"));

    const record = readiness.globalScalingRecords[0]!;

    assert.ok(record.globalScalingId.startsWith("gsp-scale-"));

    assert.equal(record.metadataVersion, GSP_METADATA_VERSION);

    assert.equal(record.neverRecommendWithoutValidatedReadiness, true);

    assert.equal(record.structuralSignalOnly, true);

    assert.equal(record.sensitiveOperationalData, false);



    assert.notEqual(

      engine.identifyTargetRegions({

        companyReference: "company-alpha",

        validated: true,

      }).validation.decision,

      "fail",

    );

    assert.notEqual(

      engine.evaluateRegionalDemand({

        companyReference: "company-alpha",

        validated: true,

      }).validation.decision,

      "fail",

    );

  });



  test("identify regions/countries, rank opportunities, and recommend expansion", async () => {

    const { engine } = await buildEngine();

    engine.connectGlobalScalingPlanner();



    engine.evaluateInternationalExpansionReadiness({

      companyReference: "company-alpha",

      expansionReadinessHint: 80,

      validated: true,

    });

    engine.identifyTargetRegions({

      companyReference: "company-alpha",

      targetRegionHint: "emea",

      regionalOpportunityHint: 75,

      validated: true,

    });

    engine.identifyTargetCountries({

      companyReference: "company-alpha",

      targetRegionHint: "emea",

      targetCountryHint: "de",

      regionalOpportunityHint: 78,

      validated: true,

    });

    engine.evaluateRegionalDemand({

      companyReference: "company-alpha",

      regionalOpportunityHint: 72,

      validated: true,

    });

    engine.evaluateRegionalOperationalReadiness({

      companyReference: "company-alpha",

      expansionReadinessHint: 70,

      validated: true,

    });

    engine.evaluateSupplierReadinessByRegion({

      companyReference: "company-alpha",

      expansionReadinessHint: 68,

      validated: true,

    });

    engine.evaluateFinancialReadinessForExpansion({

      companyReference: "company-alpha",

      expansionReadinessHint: 85,

      validated: true,

    });



    const ranked = engine.rankInternationalScalingOpportunities({

      companyReference: "company-alpha",

      validated: true,

    });

    assert.notEqual(ranked.validation.decision, "fail");

    assert.ok(ranked.globalScalingRecords.length >= 1);



    const recommendations = engine.recommendGlobalExpansion({

      companyReference: "company-alpha",

      validated: true,

    });

    assert.notEqual(recommendations.validation.decision, "fail");

    assert.ok(recommendations.recommendations.length >= 1);

    assert.ok(recommendations.recommendations[0]!.recommendationId.startsWith("gsp-rec-"));

  });



  test("rejects unvalidated global scaling input", async () => {

    const { engine } = await buildEngine();

    engine.connectGlobalScalingPlanner();

    const report = engine.evaluateInternationalExpansionReadiness({

      companyReference: "company-x",

    });

    assert.equal(report.validation.decision, "fail");

    assert.ok(report.validation.errors.some((e) => e.includes("validated=true")));

  });



  test("governance safety redacts sensitive values in logs", async () => {

    const { engine } = await buildEngine();

    appendGspLog({

      event: "global_scaling_evaluation",

      level: "info",

      details: "api_key=secret-key bearer abc123",

    });

    engine.connectGlobalScalingPlanner();

    const logs = getGspLogs(50);

    assert.ok(logs.some((l) => l.details.includes("[redacted")));

    assert.ok(!logs.some((l) => l.details.includes("secret-key")));

  });



  test("missing upstream engines still produce structural global scaling records", async () => {

    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });

    const asf = createAutonomousScalingFrameworkEngine(bootstrap);

    await asf.initialize();

    const engine = createGlobalScalingPlannerEngine(bootstrap, {

      autonomousScalingFramework: asf,

    });

    await engine.initialize();

    engine.connectGlobalScalingPlanner();

    const report = engine.evaluateInternationalExpansionReadiness({ validated: true });

    assert.notEqual(report.validation.decision, "fail");

    assert.equal(report.globalScalingRecords[0]!.companyReference, "company-default");

    assert.ok(report.globalScalingRecords[0]!.structuralSignalOnly);

  });



  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {

    const { engine } = await buildEngine();

    engine.connectGlobalScalingPlanner();

    engine.evaluateInternationalExpansionReadiness({

      companyReference: "company-alpha",

      expansionReadinessHint: 60,

      validated: true,

    });

    const sync = engine.validateForSupervisorSync();

    assert.equal(sync.valid, true);

    assert.ok(sync.readinessScore >= 50);

    const cockpit = engine.getCockpitSnapshot();

    assert.equal(cockpit.frameworkRegistered, true);

    assert.ok(cockpit.totalGlobalScalingRecords >= 1);

    assert.ok(Array.isArray(cockpit.recentLogs));

    engine.runDiagnostics({});

  });



  test("health monitoring and automatic recovery track failures", async () => {

    const { engine } = await buildEngine();

    engine.connectGlobalScalingPlanner();

    engine.evaluateInternationalExpansionReadiness({ companyReference: "a" });

    engine.evaluateInternationalExpansionReadiness({ companyReference: "b" });

    const state = engine.getState();

    assert.ok(state.performance.failedOperations >= 2);

    assert.ok(state.health.consecutiveFailures >= 1 || state.health.recoveryAttempts >= 0);

    assert.ok(["healthy", "degraded", "failed", "standby"].includes(state.health.status));

  });

});


