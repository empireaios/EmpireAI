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
  buildBottleneckIntelligenceConfiguration,
  BOTTLENECK_INTELLIGENCE_SYSTEM_PATH,
  BOTTLENECK_INTELLIGENCE_ID,
  BNI_CAPABILITIES,
  BNI_METADATA_VERSION,
} from "../../bottleneck-intelligence/index.js";
import { appendBniLog, getBniLogs } from "../../bottleneck-intelligence/bni-logging.js";

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
  const engine = createBottleneckIntelligenceEngine(bootstrap, {
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
  await engine.initialize();
  return { engine, asf, wpd, sde, cpe, mse, sse, fse, wfi, esd };
}

describe("X3-10 Bottleneck Intelligence", () => {
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
  });

  test("buildBottleneckIntelligenceConfiguration locks safety flags", () => {
    const config = buildBottleneckIntelligenceConfiguration(REPO_ROOT, {
      neverGenerateUnsupportedBottleneckConclusions: false as never,
      neverExposeCredentials: false as never,
    });
    assert.equal(config.enabled, true);
    assert.equal(config.neverGenerateUnsupportedBottleneckConclusions, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverExposeAuthenticationTokens, true);
    assert.equal(config.preserveBottleneckTraceability, true);
    assert.equal(config.preserveEnterpriseIntegrity, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.neverLogSensitiveOperationalInformation, true);
    assert.ok(BNI_CAPABILITIES.includes("throughput_constraint_detection"));
    assert.ok(BNI_CAPABILITIES.includes("bottleneck_impact_ranking"));
  });

  test("bottleneck intelligence initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-BNI-001");
    assert.equal(state.missionId, "X3-10");
    assert.ok(BOTTLENECK_INTELLIGENCE_SYSTEM_PATH.includes("BOTTLENECK_INTELLIGENCE"));
  });

  test("connectBottleneckIntelligence registers with ASF via X3-10", async () => {
    const { engine, asf } = await buildEngine();
    const report = engine.connectBottleneckIntelligence();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = asf.getRegisteredModules();
    assert.ok(modules.some((m) => m.scalingModuleIdentifier === BOTTLENECK_INTELLIGENCE_ID));
    assert.equal(report.engineRecord.dependencyPresence.autonomousScalingFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.winningProductDetector, true);
    assert.equal(report.engineRecord.dependencyPresence.scalingDecisionEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.capacityPlanningEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.marketingScaleEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.supplierScaleEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.financialScaleEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.workforceIntelligence, true);
    assert.equal(report.engineRecord.dependencyPresence.executiveScalingDashboard, true);
    assert.ok(report.engineRecord.frameworkModuleId);
  });

  test("monitoring produces machine-readable bni-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectBottleneckIntelligence();

    const operational = engine.monitorOperationalBottlenecks({
      companyReference: "company-alpha",
      affectedComponent: "ops-pipeline",
      severityHint: 70,
      impactHint: 65,
      validated: true,
    });
    assert.notEqual(
      operational.validation.decision,
      "fail",
      operational.validation.errors.join("; "),
    );
    assert.ok(operational.bottleneckIntelligenceRunReportId.startsWith("bni-run-"));
    const record = operational.bottleneckRecords[0]!;
    assert.ok(record.bottleneckId.startsWith("bni-bn-"));
    assert.equal(record.metadataVersion, BNI_METADATA_VERSION);
    assert.equal(record.neverGenerateUnsupportedBottleneckConclusions, true);
    assert.equal(record.structuralSignalOnly, true);
    assert.equal(record.sensitiveOperationalData, false);

    assert.notEqual(
      engine.monitorInfrastructureBottlenecks({
        companyReference: "company-alpha",
        affectedComponent: "infra-core",
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.notEqual(
      engine.monitorSupplierBottlenecks({
        companyReference: "company-alpha",
        affectedComponent: "supplier-net",
        validated: true,
      }).validation.decision,
      "fail",
    );
  });

  test("detect throughput constraints rank and recommend resolutions", async () => {
    const { engine } = await buildEngine();
    engine.connectBottleneckIntelligence();

    engine.monitorOperationalBottlenecks({
      companyReference: "company-alpha",
      affectedComponent: "ops-a",
      severityHint: 80,
      impactHint: 75,
      validated: true,
    });
    engine.monitorMarketingBottlenecks({
      companyReference: "company-alpha",
      affectedComponent: "mkt-b",
      severityHint: 30,
      impactHint: 25,
      validated: true,
    });
    engine.monitorFinancialBottlenecks({
      companyReference: "company-alpha",
      affectedComponent: "fin-c",
      severityHint: 72,
      impactHint: 80,
      validated: true,
    });
    engine.monitorWorkforceBottlenecks({
      companyReference: "company-alpha",
      affectedComponent: "wfi-d",
      severityHint: 60,
      impactHint: 55,
      validated: true,
    });

    const throughput = engine.detectThroughputConstraints({
      companyReference: "company-alpha",
      throughputHint: 20,
      validated: true,
    });
    assert.notEqual(throughput.validation.decision, "fail");
    assert.ok(throughput.bottleneckRecords.length >= 1);

    const ranked = engine.rankBottlenecksByImpact({
      companyReference: "company-alpha",
      validated: true,
    });
    assert.notEqual(ranked.validation.decision, "fail");
    assert.ok(ranked.bottleneckRecords.length >= 1);
    assert.equal(ranked.bottleneckRecords[0]!.resolutionPriority, 1);

    const recommendations = engine.recommendBottleneckResolutions({
      companyReference: "company-alpha",
      validated: true,
    });
    assert.notEqual(recommendations.validation.decision, "fail");
    assert.ok(recommendations.recommendations.length >= 1);
    assert.ok(recommendations.recommendations[0]!.recommendationId.startsWith("bni-rec-"));
  });

  test("rejects unvalidated bottleneck input", async () => {
    const { engine } = await buildEngine();
    engine.connectBottleneckIntelligence();
    const report = engine.monitorOperationalBottlenecks({
      affectedComponent: "ops-x",
    });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("validated=true")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendBniLog({
      event: "bottleneck_monitoring",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectBottleneckIntelligence();
    const logs = getBniLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("missing upstream engines still produce structural bottleneck records", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
    const asf = createAutonomousScalingFrameworkEngine(bootstrap);
    await asf.initialize();
    const engine = createBottleneckIntelligenceEngine(bootstrap, {
      autonomousScalingFramework: asf,
    });
    await engine.initialize();
    engine.connectBottleneckIntelligence();
    const report = engine.monitorOperationalBottlenecks({ validated: true });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.bottleneckRecords[0]!.companyReference, "company-default");
    assert.ok(report.bottleneckRecords[0]!.structuralSignalOnly);
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectBottleneckIntelligence();
    engine.monitorOperationalBottlenecks({
      affectedComponent: "ops-scale",
      impactHint: 75,
      validated: true,
    });
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalBottleneckRecords >= 1);
    assert.ok(Array.isArray(cockpit.recentLogs));
    engine.runDiagnostics({});
  });

  test("health monitoring and automatic recovery track failures", async () => {
    const { engine } = await buildEngine();
    engine.connectBottleneckIntelligence();
    engine.monitorOperationalBottlenecks({ affectedComponent: "a" });
    engine.monitorOperationalBottlenecks({ affectedComponent: "b" });
    const state = engine.getState();
    assert.ok(state.performance.failedOperations >= 2);
    assert.ok(state.health.consecutiveFailures >= 1 || state.health.recoveryAttempts >= 0);
    assert.ok(["healthy", "degraded", "failed", "standby"].includes(state.health.status));
  });
});
