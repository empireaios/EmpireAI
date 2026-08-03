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
  buildOperationalElasticityEngineConfiguration,
  OPERATIONAL_ELASTICITY_ENGINE_SYSTEM_PATH,
  OPERATIONAL_ELASTICITY_ENGINE_ID,
  OEE_CAPABILITIES,
  OEE_METADATA_VERSION,
} from "../../operational-elasticity-engine/index.js";
import { appendOeeLog, getOeeLogs } from "../../operational-elasticity-engine/oee-logging.js";

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
  const engine = createOperationalElasticityEngine(bootstrap, {
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
  await engine.initialize();
  return { engine, asf, wpd, sde, cpe, mse, sse, fse, wfi, esd, bni };
}

describe("X3-11 Operational Elasticity Engine", () => {
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
  });

  test("buildOperationalElasticityEngineConfiguration locks safety flags", () => {
    const config = buildOperationalElasticityEngineConfiguration(REPO_ROOT, {
      neverExceedValidatedOperationalLimits: false as never,
      neverExposeCredentials: false as never,
    });
    assert.equal(config.enabled, true);
    assert.equal(config.neverExceedValidatedOperationalLimits, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverExposeAuthenticationTokens, true);
    assert.equal(config.preserveElasticityTraceability, true);
    assert.equal(config.preserveEnterpriseIntegrity, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.neverLogSensitiveOperationalInformation, true);
    assert.ok(OEE_CAPABILITIES.includes("capacity_scale_up"));
    assert.ok(OEE_CAPABILITIES.includes("overcapacity_detection"));
  });

  test("operational elasticity engine initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-OEE-001");
    assert.equal(state.missionId, "X3-11");
    assert.ok(OPERATIONAL_ELASTICITY_ENGINE_SYSTEM_PATH.includes("OPERATIONAL_ELASTICITY"));
  });

  test("connectOperationalElasticityEngine registers with ASF via X3-11", async () => {
    const { engine, asf } = await buildEngine();
    const report = engine.connectOperationalElasticityEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = asf.getRegisteredModules();
    assert.ok(modules.some((m) => m.scalingModuleIdentifier === OPERATIONAL_ELASTICITY_ENGINE_ID));
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
    assert.ok(report.engineRecord.frameworkModuleId);
  });

  test("monitoring produces machine-readable oee-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectOperationalElasticityEngine();

    const demand = engine.monitorOperationalDemand({
      companyReference: "company-alpha",
      operationalComponent: "ops-pipeline",
      utilizationHint: 70,
      demandHint: 65,
      validated: true,
    });
    assert.notEqual(
      demand.validation.decision,
      "fail",
      demand.validation.errors.join("; "),
    );
    assert.ok(demand.operationalElasticityEngineRunReportId.startsWith("oee-run-"));
    const record = demand.elasticityRecords[0]!;
    assert.ok(record.elasticityRecordId.startsWith("oee-er-"));
    assert.equal(record.metadataVersion, OEE_METADATA_VERSION);
    assert.equal(record.neverExceedValidatedOperationalLimits, true);
    assert.equal(record.structuralSignalOnly, true);
    assert.equal(record.sensitiveOperationalData, false);

    assert.notEqual(
      engine.monitorOperationalUtilization({
        companyReference: "company-alpha",
        operationalComponent: "util-core",
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.notEqual(
      engine.scaleCapacityUpward({
        companyReference: "company-alpha",
        operationalComponent: "scale-up-net",
        validated: true,
      }).validation.decision,
      "fail",
    );
  });

  test("detect over/undercapacity scale and recommend elasticity actions", async () => {
    const { engine } = await buildEngine();
    engine.connectOperationalElasticityEngine();

    engine.monitorOperationalDemand({
      companyReference: "company-alpha",
      operationalComponent: "ops-a",
      utilizationHint: 90,
      demandHint: 85,
      validated: true,
    });
    engine.monitorOperationalUtilization({
      companyReference: "company-alpha",
      operationalComponent: "ops-b",
      utilizationHint: 30,
      validated: true,
    });
    engine.scaleCapacityUpward({
      companyReference: "company-alpha",
      operationalComponent: "ops-c",
      utilizationHint: 80,
      validated: true,
    });
    engine.scaleCapacityDownward({
      companyReference: "company-alpha",
      operationalComponent: "ops-d",
      utilizationHint: 40,
      validated: true,
    });

    const over = engine.detectOvercapacity({
      companyReference: "company-alpha",
      operationalComponent: "ops-over",
      utilizationHint: 92,
      validated: true,
    });
    assert.notEqual(over.validation.decision, "fail");
    assert.ok(over.elasticityRecords.length >= 1);

    const under = engine.detectUndercapacity({
      companyReference: "company-alpha",
      operationalComponent: "ops-under",
      utilizationHint: 20,
      validated: true,
    });
    assert.notEqual(under.validation.decision, "fail");
    assert.ok(under.elasticityRecords.length >= 1);

    engine.balanceWorkloadsDynamically({
      companyReference: "company-alpha",
      validated: true,
    });
    engine.optimizeResourceUtilization({
      companyReference: "company-alpha",
      validated: true,
    });

    const recommendations = engine.recommendElasticityActions({
      companyReference: "company-alpha",
      validated: true,
    });
    assert.notEqual(recommendations.validation.decision, "fail");
    assert.ok(recommendations.recommendations.length >= 1);
    assert.ok(recommendations.recommendations[0]!.recommendationId.startsWith("oee-rec-"));
  });

  test("rejects unvalidated elasticity input", async () => {
    const { engine } = await buildEngine();
    engine.connectOperationalElasticityEngine();
    const report = engine.monitorOperationalDemand({
      operationalComponent: "ops-x",
    });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("validated=true")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendOeeLog({
      event: "elasticity_monitoring",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectOperationalElasticityEngine();
    const logs = getOeeLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("missing upstream engines still produce structural elasticity records", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const asf = createAutonomousScalingFrameworkEngine(bootstrap);
    await asf.initialize();
    const engine = createOperationalElasticityEngine(bootstrap, {
      autonomousScalingFramework: asf,
    });
    await engine.initialize();
    engine.connectOperationalElasticityEngine();
    const report = engine.monitorOperationalDemand({ validated: true });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.elasticityRecords[0]!.companyReference, "company-default");
    assert.ok(report.elasticityRecords[0]!.structuralSignalOnly);
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectOperationalElasticityEngine();
    engine.monitorOperationalDemand({
      operationalComponent: "ops-scale",
      utilizationHint: 75,
      validated: true,
    });
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalElasticityRecords >= 1);
    assert.ok(Array.isArray(cockpit.recentLogs));
    engine.runDiagnostics({});
  });

  test("health monitoring and automatic recovery track failures", async () => {
    const { engine } = await buildEngine();
    engine.connectOperationalElasticityEngine();
    engine.monitorOperationalDemand({ operationalComponent: "a" });
    engine.monitorOperationalDemand({ operationalComponent: "b" });
    const state = engine.getState();
    assert.ok(state.performance.failedOperations >= 2);
    assert.ok(state.health.consecutiveFailures >= 1 || state.health.recoveryAttempts >= 0);
    assert.ok(["healthy", "degraded", "failed", "standby"].includes(state.health.status));
  });
});
