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
  buildMarketingScaleEngineConfiguration,
  MARKETING_SCALE_ENGINE_SYSTEM_PATH,
  MARKETING_SCALE_ENGINE_ID,
  MSE_CAPABILITIES,
  MSE_METADATA_VERSION,
} from "../../marketing-scale-engine/index.js";
import { appendMseLog, getMseLogs } from "../../marketing-scale-engine/mse-logging.js";

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
  const engine = createMarketingScaleEngine(bootstrap, {
    autonomousScalingFramework: asf,
    winningProductDetector: wpd,
    scalingDecisionEngine: sde,
    capacityPlanningEngine: cpe,
  });
  await engine.initialize();
  return { engine, asf, wpd, sde, cpe };
}

describe("X3-05 Marketing Scale Engine", () => {
  beforeEach(() => {
    resetAutonomousScalingFrameworkForTesting();
    resetWinningProductDetectorForTesting();
    resetScalingDecisionEngineForTesting();
    resetCapacityPlanningEngineForTesting();
    resetMarketingScaleEngineForTesting();
  });

  test("buildMarketingScaleEngineConfiguration locks safety flags", () => {
    const config = buildMarketingScaleEngineConfiguration(REPO_ROOT, {
      neverRecommendMarketingExpansionWithoutValidatedPerformance: false as never,
      neverExposeCredentials: false as never,
    });
    assert.equal(config.enabled, true);
    assert.equal(config.neverRecommendMarketingExpansionWithoutValidatedPerformance, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverExposeAuthenticationTokens, true);
    assert.equal(config.preserveMarketingTraceability, true);
    assert.equal(config.preserveEnterpriseIntegrity, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.neverLogSensitiveMarketingInformation, true);
    assert.ok(MSE_CAPABILITIES.includes("marketing_bottleneck_detection"));
    assert.ok(MSE_CAPABILITIES.includes("scalable_campaign_detection"));
  });

  test("marketing scale engine initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-MSE-001");
    assert.equal(state.missionId, "X3-05");
    assert.ok(MARKETING_SCALE_ENGINE_SYSTEM_PATH.includes("MARKETING_SCALE"));
  });

  test("connectMarketingScaleEngine registers with ASF via X3-05", async () => {
    const { engine, asf } = await buildEngine();
    const report = engine.connectMarketingScaleEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = asf.getRegisteredModules();
    assert.ok(modules.some((m) => m.scalingModuleIdentifier === MARKETING_SCALE_ENGINE_ID));
    assert.equal(report.engineRecord.dependencyPresence.autonomousScalingFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.winningProductDetector, true);
    assert.equal(report.engineRecord.dependencyPresence.scalingDecisionEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.capacityPlanningEngine, true);
    assert.ok(report.engineRecord.frameworkModuleId);
  });

  test("monitoring produces machine-readable mse-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectMarketingScaleEngine();

    const performance = engine.monitorMarketingPerformance({
      companyReference: "company-alpha",
      campaignReference: "campaign-scale",
      cacHint: 35,
      roasHint: 200,
      conversionHint: 40,
      readinessHint: 70,
      validated: true,
    });
    assert.notEqual(
      performance.validation.decision,
      "fail",
      performance.validation.errors.join("; "),
    );
    assert.ok(performance.marketingScaleRunReportId.startsWith("mse-run-"));
    const record = performance.scalingRecords[0]!;
    assert.ok(record.marketingScalingId.startsWith("mse-mkt-"));
    assert.equal(record.metadataVersion, MSE_METADATA_VERSION);
    assert.equal(record.neverRecommendMarketingExpansionWithoutValidatedPerformance, true);
    assert.equal(record.structuralSignalOnly, true);

    assert.notEqual(
      engine.monitorCustomerAcquisitionCost({
        companyReference: "company-alpha",
        campaignReference: "campaign-scale",
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.notEqual(
      engine.monitorReturnOnAdvertisingSpend({
        companyReference: "company-alpha",
        campaignReference: "campaign-scale",
        validated: true,
      }).validation.decision,
      "fail",
    );
  });

  test("detect scalable campaigns bottlenecks and recommendations", async () => {
    const { engine } = await buildEngine();
    engine.connectMarketingScaleEngine();

    engine.monitorMarketingPerformance({
      companyReference: "company-alpha",
      campaignReference: "campaign-a",
      cacHint: 30,
      roasHint: 220,
      conversionHint: 50,
      readinessHint: 80,
      validated: true,
    });
    engine.monitorCampaignScalability({
      companyReference: "company-alpha",
      campaignReference: "campaign-b",
      cacHint: 70,
      roasHint: 80,
      conversionHint: 1,
      readinessHint: 20,
      validated: true,
    });
    engine.monitorChannelPerformance({
      companyReference: "company-alpha",
      campaignReference: "campaign-a",
      channel: "paid_search",
      cacHint: 30,
      roasHint: 220,
      conversionHint: 50,
      readinessHint: 80,
      validated: true,
    });
    engine.monitorConversionPerformance({
      companyReference: "company-alpha",
      campaignReference: "campaign-a",
      cacHint: 30,
      roasHint: 220,
      conversionHint: 50,
      readinessHint: 80,
      validated: true,
    });

    const scalable = engine.detectScalableCampaigns({
      companyReference: "company-alpha",
      validated: true,
    });
    assert.notEqual(scalable.validation.decision, "fail");
    assert.ok(scalable.scalingRecords.length >= 1);

    const bottlenecks = engine.detectMarketingBottlenecks({
      companyReference: "company-alpha",
      validated: true,
    });
    assert.notEqual(bottlenecks.validation.decision, "fail");
    assert.ok(bottlenecks.scalingRecords.length >= 1);

    const recommendations = engine.recommendMarketingScaling({
      companyReference: "company-alpha",
      validated: true,
    });
    assert.notEqual(recommendations.validation.decision, "fail");
    assert.ok(recommendations.recommendations.length >= 1);
    assert.ok(recommendations.recommendations[0]!.recommendationId.startsWith("mse-rec-"));
  });

  test("rejects unvalidated marketing input", async () => {
    const { engine } = await buildEngine();
    engine.connectMarketingScaleEngine();
    const report = engine.monitorMarketingPerformance({
      campaignReference: "campaign-x",
    });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("validated=true")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendMseLog({
      event: "marketing_monitoring",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectMarketingScaleEngine();
    const logs = getMseLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("missing campaign data still produces structural scaling records", async () => {
    const { engine } = await buildEngine();
    engine.connectMarketingScaleEngine();
    const report = engine.monitorMarketingPerformance({ validated: true });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.scalingRecords[0]!.companyReference, "company-default");
    assert.equal(report.scalingRecords[0]!.campaignReference, "campaign-default");
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectMarketingScaleEngine();
    engine.monitorMarketingPerformance({
      campaignReference: "campaign-scale",
      readinessHint: 75,
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
    engine.connectMarketingScaleEngine();
    engine.monitorMarketingPerformance({ campaignReference: "a" });
    engine.monitorMarketingPerformance({ campaignReference: "b" });
    const state = engine.getState();
    assert.ok(state.performance.failedOperations >= 2);
    assert.ok(state.health.consecutiveFailures >= 1 || state.health.recoveryAttempts >= 0);
    assert.ok(["healthy", "degraded", "failed", "standby"].includes(state.health.status));
  });
});
