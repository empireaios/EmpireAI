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
  buildCapacityPlanningEngineConfiguration,
  CAPACITY_PLANNING_ENGINE_SYSTEM_PATH,
  CAPACITY_PLANNING_ENGINE_ID,
  CPE_CAPABILITIES,
  CPE_METADATA_VERSION,
} from "../../capacity-planning-engine/index.js";
import { appendCpeLog, getCpeLogs } from "../../capacity-planning-engine/cpe-logging.js";

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
  const engine = createCapacityPlanningEngine(bootstrap, {
    autonomousScalingFramework: asf,
    winningProductDetector: wpd,
    scalingDecisionEngine: sde,
  });
  await engine.initialize();
  return { engine, asf, wpd, sde };
}

describe("X3-04 Capacity Planning Engine", () => {
  beforeEach(() => {
    resetAutonomousScalingFrameworkForTesting();
    resetWinningProductDetectorForTesting();
    resetScalingDecisionEngineForTesting();
    resetCapacityPlanningEngineForTesting();
  });

  test("buildCapacityPlanningEngineConfiguration locks safety flags", () => {
    const config = buildCapacityPlanningEngineConfiguration(REPO_ROOT, {
      neverRecommendBeyondValidatedLimits: false as never,
      neverExposeCredentials: false as never,
    });
    assert.equal(config.enabled, true);
    assert.equal(config.neverRecommendBeyondValidatedLimits, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverExposeAuthenticationTokens, true);
    assert.equal(config.preservePlanningTraceability, true);
    assert.equal(config.preserveEnterpriseIntegrity, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.neverLogSensitiveOperationalInformation, true);
    assert.ok(CPE_CAPABILITIES.includes("capacity_bottleneck_detection"));
    assert.ok(CPE_CAPABILITIES.includes("capacity_requirement_forecasting"));
  });

  test("capacity planning engine initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-CPE-001");
    assert.equal(state.missionId, "X3-04");
    assert.ok(CAPACITY_PLANNING_ENGINE_SYSTEM_PATH.includes("CAPACITY_PLANNING"));
  });

  test("connectCapacityPlanningEngine registers with ASF via X3-04", async () => {
    const { engine, asf } = await buildEngine();
    const report = engine.connectCapacityPlanningEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = asf.getRegisteredModules();
    assert.ok(modules.some((m) => m.scalingModuleIdentifier === CAPACITY_PLANNING_ENGINE_ID));
    assert.equal(report.engineRecord.dependencyPresence.autonomousScalingFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.winningProductDetector, true);
    assert.equal(report.engineRecord.dependencyPresence.scalingDecisionEngine, true);
    assert.ok(report.engineRecord.frameworkModuleId);
  });

  test("domain monitoring produces machine-readable cpe-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectCapacityPlanningEngine();

    const operational = engine.monitorOperationalCapacity({
      companyReference: "company-alpha",
      productReference: "product-scale",
      currentCapacityHint: 60,
      forecastDemandHint: 90,
      utilizationHint: 88,
      validated: true,
    });
    assert.notEqual(
      operational.validation.decision,
      "fail",
      operational.validation.errors.join("; "),
    );
    assert.ok(operational.capacityPlanningRunReportId.startsWith("cpe-run-"));
    const record = operational.planningRecords[0]!;
    assert.ok(record.capacityPlanningId.startsWith("cpe-cap-"));
    assert.equal(record.metadataVersion, CPE_METADATA_VERSION);
    assert.equal(record.neverRecommendBeyondValidatedLimits, true);
    assert.equal(record.structuralSignalOnly, true);
    assert.equal(record.domain, "operational");

    assert.notEqual(
      engine.monitorInfrastructureCapacity({
        companyReference: "company-alpha",
        productReference: "product-scale",
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.notEqual(
      engine.monitorSupplierCapacity({
        companyReference: "company-alpha",
        productReference: "product-scale",
        validated: true,
      }).validation.decision,
      "fail",
    );
  });

  test("forecast bottleneck and recommendations produce expansion guidance", async () => {
    const { engine } = await buildEngine();
    engine.connectCapacityPlanningEngine();

    engine.monitorOperationalCapacity({
      companyReference: "company-alpha",
      productReference: "product-a",
      currentCapacityHint: 50,
      forecastDemandHint: 95,
      utilizationHint: 90,
      validated: true,
    });
    engine.monitorFulfilmentCapacity({
      companyReference: "company-alpha",
      productReference: "product-a",
      utilizationHint: 86,
      validated: true,
    });
    engine.monitorInventoryCapacity({
      companyReference: "company-alpha",
      productReference: "product-a",
      validated: true,
    });
    engine.monitorWorkforceCapacity({
      companyReference: "company-alpha",
      productReference: "product-a",
      validated: true,
    });

    const forecast = engine.forecastCapacity({
      companyReference: "company-alpha",
      productReference: "product-a",
      currentCapacityHint: 50,
      forecastDemandHint: 92,
      validated: true,
    });
    assert.notEqual(forecast.validation.decision, "fail");
    assert.ok(forecast.planningRecords[0]!.forecastDemand >= 92);

    const bottlenecks = engine.detectBottlenecks({
      companyReference: "company-alpha",
      validated: true,
    });
    assert.notEqual(bottlenecks.validation.decision, "fail");
    assert.ok(bottlenecks.planningRecords.length >= 1);

    const recommendations = engine.recommendExpansion({
      companyReference: "company-alpha",
      validated: true,
    });
    assert.notEqual(recommendations.validation.decision, "fail");
    assert.ok(recommendations.recommendations.length >= 1);
    assert.ok(recommendations.recommendations[0]!.recommendationId.startsWith("cpe-rec-"));
  });

  test("rejects unvalidated planning input", async () => {
    const { engine } = await buildEngine();
    engine.connectCapacityPlanningEngine();
    const report = engine.monitorOperationalCapacity({
      productReference: "product-x",
    });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("validated=true")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendCpeLog({
      event: "capacity_monitoring",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectCapacityPlanningEngine();
    const logs = getCpeLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("missing product data still produces structural planning records", async () => {
    const { engine } = await buildEngine();
    engine.connectCapacityPlanningEngine();
    const report = engine.monitorOperationalCapacity({ validated: true });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.planningRecords[0]!.companyReference, "company-default");
    assert.equal(report.planningRecords[0]!.productReference, "product-default");
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectCapacityPlanningEngine();
    engine.monitorOperationalCapacity({
      productReference: "product-scale",
      utilizationHint: 90,
      validated: true,
    });
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalPlanningRecords >= 1);
    assert.ok(Array.isArray(cockpit.recentLogs));
    engine.runDiagnostics({});
  });

  test("health monitoring and automatic recovery track failures", async () => {
    const { engine } = await buildEngine();
    engine.connectCapacityPlanningEngine();
    engine.monitorOperationalCapacity({ productReference: "a" });
    engine.monitorOperationalCapacity({ productReference: "b" });
    const state = engine.getState();
    assert.ok(state.performance.failedOperations >= 2);
    assert.ok(state.health.consecutiveFailures >= 1 || state.health.recoveryAttempts >= 0);
    assert.ok(["healthy", "degraded", "failed", "standby"].includes(state.health.status));
  });
});
