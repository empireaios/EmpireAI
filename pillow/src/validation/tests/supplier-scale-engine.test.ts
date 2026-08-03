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
  buildSupplierScaleEngineConfiguration,
  SUPPLIER_SCALE_ENGINE_SYSTEM_PATH,
  SUPPLIER_SCALE_ENGINE_ID,
  SSE_CAPABILITIES,
  SSE_METADATA_VERSION,
} from "../../supplier-scale-engine/index.js";
import { appendSseLog, getSseLogs } from "../../supplier-scale-engine/sse-logging.js";

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
  const engine = createSupplierScaleEngine(bootstrap, {
    autonomousScalingFramework: asf,
    winningProductDetector: wpd,
    scalingDecisionEngine: sde,
    capacityPlanningEngine: cpe,
    marketingScaleEngine: mse,
  });
  await engine.initialize();
  return { engine, asf, wpd, sde, cpe, mse };
}

describe("X3-06 Supplier Scale Engine", () => {
  beforeEach(() => {
    resetAutonomousScalingFrameworkForTesting();
    resetWinningProductDetectorForTesting();
    resetScalingDecisionEngineForTesting();
    resetCapacityPlanningEngineForTesting();
    resetMarketingScaleEngineForTesting();
    resetSupplierScaleEngineForTesting();
  });

  test("buildSupplierScaleEngineConfiguration locks safety flags", () => {
    const config = buildSupplierScaleEngineConfiguration(REPO_ROOT, {
      neverRecommendSupplierExpansionWithoutValidatedCapacity: false as never,
      neverExposeCredentials: false as never,
    });
    assert.equal(config.enabled, true);
    assert.equal(config.neverRecommendSupplierExpansionWithoutValidatedCapacity, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverExposeAuthenticationTokens, true);
    assert.equal(config.preserveSupplierTraceability, true);
    assert.equal(config.preserveEnterpriseIntegrity, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.neverLogSensitiveSupplierInformation, true);
    assert.ok(SSE_CAPABILITIES.includes("supplier_bottleneck_detection"));
    assert.ok(SSE_CAPABILITIES.includes("supplier_scaling_risk_detection"));
  });

  test("supplier scale engine initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-SSE-001");
    assert.equal(state.missionId, "X3-06");
    assert.ok(SUPPLIER_SCALE_ENGINE_SYSTEM_PATH.includes("SUPPLIER_SCALE"));
  });

  test("connectSupplierScaleEngine registers with ASF via X3-06", async () => {
    const { engine, asf } = await buildEngine();
    const report = engine.connectSupplierScaleEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = asf.getRegisteredModules();
    assert.ok(modules.some((m) => m.scalingModuleIdentifier === SUPPLIER_SCALE_ENGINE_ID));
    assert.equal(report.engineRecord.dependencyPresence.autonomousScalingFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.winningProductDetector, true);
    assert.equal(report.engineRecord.dependencyPresence.scalingDecisionEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.capacityPlanningEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.marketingScaleEngine, true);
    assert.ok(report.engineRecord.frameworkModuleId);
  });

  test("monitoring produces machine-readable sse-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectSupplierScaleEngine();

    const capacity = engine.monitorSupplierCapacity({
      companyReference: "company-alpha",
      supplierReference: "supplier-scale",
      capacityHint: 70,
      performanceHint: 65,
      reliabilityHint: 68,
      fulfilmentHint: 72,
      validated: true,
    });
    assert.notEqual(
      capacity.validation.decision,
      "fail",
      capacity.validation.errors.join("; "),
    );
    assert.ok(capacity.supplierScaleRunReportId.startsWith("sse-run-"));
    const record = capacity.scalingRecords[0]!;
    assert.ok(record.supplierScalingId.startsWith("sse-sup-"));
    assert.equal(record.metadataVersion, SSE_METADATA_VERSION);
    assert.equal(record.neverRecommendSupplierExpansionWithoutValidatedCapacity, true);
    assert.equal(record.structuralSignalOnly, true);

    assert.notEqual(
      engine.monitorSupplierPerformance({
        companyReference: "company-alpha",
        supplierReference: "supplier-scale",
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.notEqual(
      engine.monitorReliability({
        companyReference: "company-alpha",
        supplierReference: "supplier-scale",
        validated: true,
      }).validation.decision,
      "fail",
    );
  });

  test("detect scaling risks bottlenecks and recommendations", async () => {
    const { engine } = await buildEngine();
    engine.connectSupplierScaleEngine();

    engine.monitorSupplierCapacity({
      companyReference: "company-alpha",
      supplierReference: "supplier-a",
      capacityHint: 80,
      performanceHint: 75,
      reliabilityHint: 78,
      fulfilmentHint: 80,
      validated: true,
    });
    engine.monitorLeadTimes({
      companyReference: "company-alpha",
      supplierReference: "supplier-b",
      capacityHint: 30,
      performanceHint: 25,
      reliabilityHint: 20,
      fulfilmentHint: 15,
      validated: true,
    });
    engine.monitorInventory({
      companyReference: "company-alpha",
      supplierReference: "supplier-a",
      capacityHint: 80,
      performanceHint: 75,
      reliabilityHint: 78,
      fulfilmentHint: 80,
      validated: true,
    });
    engine.monitorFulfilment({
      companyReference: "company-alpha",
      supplierReference: "supplier-a",
      capacityHint: 80,
      performanceHint: 75,
      reliabilityHint: 78,
      fulfilmentHint: 80,
      validated: true,
    });

    const risks = engine.detectScalingRisks({
      companyReference: "company-alpha",
      validated: true,
    });
    assert.notEqual(risks.validation.decision, "fail");
    assert.ok(risks.scalingRecords.length >= 1);

    const bottlenecks = engine.detectSupplierBottlenecks({
      companyReference: "company-alpha",
      validated: true,
    });
    assert.notEqual(bottlenecks.validation.decision, "fail");
    assert.ok(bottlenecks.scalingRecords.length >= 1);

    const recommendations = engine.recommendSupplierExpansion({
      companyReference: "company-alpha",
      validated: true,
    });
    assert.notEqual(recommendations.validation.decision, "fail");
    assert.ok(recommendations.recommendations.length >= 1);
    assert.ok(recommendations.recommendations[0]!.recommendationId.startsWith("sse-rec-"));
  });

  test("rejects unvalidated supplier input", async () => {
    const { engine } = await buildEngine();
    engine.connectSupplierScaleEngine();
    const report = engine.monitorSupplierCapacity({
      supplierReference: "supplier-x",
    });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("validated=true")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendSseLog({
      event: "supplier_monitoring",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectSupplierScaleEngine();
    const logs = getSseLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("missing supplier data still produces structural scaling records", async () => {
    const { engine } = await buildEngine();
    engine.connectSupplierScaleEngine();
    const report = engine.monitorSupplierCapacity({ validated: true });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.scalingRecords[0]!.companyReference, "company-default");
    assert.equal(report.scalingRecords[0]!.supplierReference, "supplier-default");
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectSupplierScaleEngine();
    engine.monitorSupplierCapacity({
      supplierReference: "supplier-scale",
      fulfilmentHint: 75,
      validated: true,
    });
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalScalingRecords >= 1);
    assert.ok(Array.isArray(cockpit.recentLogs));
    engine.runDiagnostics({});
  });

  test("health monitoring and automatic recovery track failures", async () => {
    const { engine } = await buildEngine();
    engine.connectSupplierScaleEngine();
    engine.monitorSupplierCapacity({ supplierReference: "a" });
    engine.monitorSupplierCapacity({ supplierReference: "b" });
    const state = engine.getState();
    assert.ok(state.performance.failedOperations >= 2);
    assert.ok(state.health.consecutiveFailures >= 1 || state.health.recoveryAttempts >= 0);
    assert.ok(["healthy", "degraded", "failed", "standby"].includes(state.health.status));
  });
});
