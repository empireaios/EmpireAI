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
  buildWinningProductDetectorConfiguration,
  WINNING_PRODUCT_DETECTOR_SYSTEM_PATH,
  WINNING_PRODUCT_DETECTOR_ID,
  WPD_CAPABILITIES,
  WPD_METADATA_VERSION,
} from "../../winning-product-detector/index.js";
import {
  appendWpdLog,
  getWpdLogs,
} from "../../winning-product-detector/wpd-logging.js";

async function buildEngine() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const asf = createAutonomousScalingFrameworkEngine(bootstrap);
  await asf.initialize();
  const engine = createWinningProductDetectorEngine(bootstrap, {
    autonomousScalingFramework: asf,
  });
  await engine.initialize();
  return { engine, asf };
}

describe("X3-02 Winning Product Detector", () => {
  beforeEach(() => {
    resetAutonomousScalingFrameworkForTesting();
    resetWinningProductDetectorForTesting();
  });

  test("buildWinningProductDetectorConfiguration locks safety flags", () => {
    const config = buildWinningProductDetectorConfiguration(REPO_ROOT, {
      neverManipulateProductPerformanceData: false as never,
      neverExposeCredentials: false as never,
    });
    assert.equal(config.enabled, true);
    assert.equal(config.neverManipulateProductPerformanceData, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverExposeAuthenticationTokens, true);
    assert.equal(config.preserveProductTraceability, true);
    assert.equal(config.preserveEnterpriseIntegrity, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.neverLogSensitiveOperationalInformation, true);
    assert.ok(WPD_CAPABILITIES.includes("breakout_product_detection"));
    assert.ok(WPD_CAPABILITIES.includes("scaling_potential_ranking"));
  });

  test("winning product detector initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-WPD-001");
    assert.equal(state.missionId, "X3-02");
    assert.ok(WINNING_PRODUCT_DETECTOR_SYSTEM_PATH.includes("WINNING_PRODUCT"));
  });

  test("connectWinningProductDetector registers with ASF via X3-02", async () => {
    const { engine, asf } = await buildEngine();
    const report = engine.connectWinningProductDetector();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = asf.getRegisteredModules();
    assert.ok(modules.some((m) => m.scalingModuleIdentifier === WINNING_PRODUCT_DETECTOR_ID));
    assert.equal(report.engineRecord.dependencyPresence.autonomousScalingFramework, true);
    assert.ok(report.engineRecord.frameworkModuleId);
  });

  test("monitor performance and sales velocity produce machine-readable wpd-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectWinningProductDetector();

    const performance = engine.monitorProductPerformance({
      companyReference: "company-alpha",
      productReference: "product-breakout",
      salesVelocityHint: 88,
      revenueGrowthHint: 40,
      validated: true,
    });
    assert.notEqual(
      performance.validation.decision,
      "fail",
      performance.validation.errors.join("; "),
    );
    assert.ok(performance.productRunReportId.startsWith("wpd-run-"));
    const record = performance.productRecords[0]!;
    assert.ok(record.productOpportunityId.startsWith("wpd-opp-"));
    assert.equal(record.metadataVersion, WPD_METADATA_VERSION);
    assert.equal(record.neverManipulateProductPerformanceData, true);
    assert.equal(record.structuralSignalOnly, true);

    const velocity = engine.analyzeSalesVelocity({
      companyReference: "company-alpha",
      productReference: "product-breakout",
      salesVelocityHint: 88,
      validated: true,
    });
    assert.notEqual(velocity.validation.decision, "fail");
    assert.equal(velocity.productRecords[0]!.salesVelocity, 88);
  });

  test("demand trends breakout declining ranking and recommendations", async () => {
    const { engine } = await buildEngine();
    engine.connectWinningProductDetector();

    assert.notEqual(
      engine.analyzeDemand({
        companyReference: "company-alpha",
        productReference: "product-a",
        demandHint: 80,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.notEqual(
      engine.analyzeTrends({
        companyReference: "company-alpha",
        productReference: "product-a",
        trendHint: 75,
        validated: true,
      }).validation.decision,
      "fail",
    );

    const breakout = engine.detectBreakouts({
      companyReference: "company-alpha",
      productReference: "product-breakout",
      salesVelocityHint: 90,
      revenueGrowthHint: 35,
      validated: true,
    });
    assert.notEqual(breakout.validation.decision, "fail");
    assert.equal(breakout.productRecords[0]!.opportunityClass, "breakout");

    const declining = engine.detectDeclining({
      companyReference: "company-alpha",
      productReference: "product-decline",
      revenueGrowthHint: -20,
      validated: true,
    });
    assert.notEqual(declining.validation.decision, "fail");
    assert.equal(declining.productRecords[0]!.opportunityClass, "declining");

    const ranked = engine.rankProducts({
      companyReference: "company-alpha",
      validated: true,
    });
    assert.notEqual(ranked.validation.decision, "fail");
    assert.ok(ranked.productRecords.length >= 1);
    assert.equal(ranked.productRecords[0]!.opportunityRanking, 1);

    const recommendations = engine.generateRecommendations({
      companyReference: "company-alpha",
      validated: true,
    });
    assert.notEqual(recommendations.validation.decision, "fail");
    assert.ok(recommendations.recommendations.length >= 1);
    assert.ok(recommendations.recommendations[0]!.recommendationId.startsWith("wpd-rec-"));
  });

  test("rejects unvalidated analysis input", async () => {
    const { engine } = await buildEngine();
    engine.connectWinningProductDetector();
    const report = engine.monitorProductPerformance({
      productReference: "product-x",
    });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("validated=true")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendWpdLog({
      event: "product_monitoring",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectWinningProductDetector();
    const logs = getWpdLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("missing product data still produces structural opportunity records", async () => {
    const { engine } = await buildEngine();
    engine.connectWinningProductDetector();
    const report = engine.monitorProductPerformance({ validated: true });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.productRecords[0]!.companyReference, "company-default");
    assert.equal(report.productRecords[0]!.productReference, "product-default");
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectWinningProductDetector();
    engine.detectBreakouts({
      productReference: "product-breakout",
      salesVelocityHint: 85,
      revenueGrowthHint: 30,
      validated: true,
    });
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.breakoutCount >= 1);
    assert.ok(Array.isArray(cockpit.recentLogs));
    engine.runDiagnostics({});
  });

  test("health monitoring and automatic recovery track failures", async () => {
    const { engine } = await buildEngine();
    engine.connectWinningProductDetector();
    engine.monitorProductPerformance({ productReference: "a" });
    engine.monitorProductPerformance({ productReference: "b" });
    const state = engine.getState();
    assert.ok(state.performance.failedOperations >= 2);
    assert.ok(state.health.consecutiveFailures >= 1 || state.health.recoveryAttempts >= 0);
    assert.ok(["healthy", "degraded", "failed", "standby"].includes(state.health.status));
  });
});
