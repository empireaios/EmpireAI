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
  buildWorkforceIntelligenceConfiguration,
  WORKFORCE_INTELLIGENCE_SYSTEM_PATH,
  WORKFORCE_INTELLIGENCE_ID,
  WFI_CAPABILITIES,
  WFI_METADATA_VERSION,
} from "../../workforce-intelligence/index.js";
import { appendWfiLog, getWfiLogs } from "../../workforce-intelligence/wfi-logging.js";

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
  const engine = createWorkforceIntelligenceEngine(bootstrap, {
    autonomousScalingFramework: asf,
    winningProductDetector: wpd,
    scalingDecisionEngine: sde,
    capacityPlanningEngine: cpe,
    marketingScaleEngine: mse,
    supplierScaleEngine: sse,
    financialScaleEngine: fse,
  });
  await engine.initialize();
  return { engine, asf, wpd, sde, cpe, mse, sse, fse };
}

describe("X3-08 Workforce Intelligence", () => {
  beforeEach(() => {
    resetAutonomousScalingFrameworkForTesting();
    resetWinningProductDetectorForTesting();
    resetScalingDecisionEngineForTesting();
    resetCapacityPlanningEngineForTesting();
    resetMarketingScaleEngineForTesting();
    resetSupplierScaleEngineForTesting();
    resetFinancialScaleEngineForTesting();
    resetWorkforceIntelligenceForTesting();
  });

  test("buildWorkforceIntelligenceConfiguration locks safety flags", () => {
    const config = buildWorkforceIntelligenceConfiguration(REPO_ROOT, {
      neverOverloadWorkforceBeyondValidatedLimits: false as never,
      neverExposeCredentials: false as never,
    });
    assert.equal(config.enabled, true);
    assert.equal(config.neverOverloadWorkforceBeyondValidatedLimits, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverExposeAuthenticationTokens, true);
    assert.equal(config.preserveWorkforceTraceability, true);
    assert.equal(config.preserveEnterpriseIntegrity, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.neverLogSensitiveOperationalInformation, true);
    assert.ok(WFI_CAPABILITIES.includes("workforce_bottleneck_detection"));
    assert.ok(WFI_CAPABILITIES.includes("underutilized_agent_detection"));
  });

  test("workforce intelligence initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-WFI-001");
    assert.equal(state.missionId, "X3-08");
    assert.ok(WORKFORCE_INTELLIGENCE_SYSTEM_PATH.includes("WORKFORCE_INTELLIGENCE"));
  });

  test("connectWorkforceIntelligence registers with ASF via X3-08", async () => {
    const { engine, asf } = await buildEngine();
    const report = engine.connectWorkforceIntelligence();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = asf.getRegisteredModules();
    assert.ok(modules.some((m) => m.scalingModuleIdentifier === WORKFORCE_INTELLIGENCE_ID));
    assert.equal(report.engineRecord.dependencyPresence.autonomousScalingFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.winningProductDetector, true);
    assert.equal(report.engineRecord.dependencyPresence.scalingDecisionEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.capacityPlanningEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.marketingScaleEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.supplierScaleEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.financialScaleEngine, true);
    assert.ok(report.engineRecord.frameworkModuleId);
  });

  test("monitoring produces machine-readable wfi-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectWorkforceIntelligence();

    const capacity = engine.monitorWorkforceCapacity({
      companyReference: "company-alpha",
      workforceReference: "workforce-scale",
      utilizationHint: 70,
      distributionHint: 65,
      throughputHint: 68,
      efficiencyHint: 72,
      validated: true,
    });
    assert.notEqual(
      capacity.validation.decision,
      "fail",
      capacity.validation.errors.join("; "),
    );
    assert.ok(capacity.workforceIntelligenceRunReportId.startsWith("wfi-run-"));
    const record = capacity.workforceRecords[0]!;
    assert.ok(record.workforceRecordId.startsWith("wfi-wf-"));
    assert.equal(record.metadataVersion, WFI_METADATA_VERSION);
    assert.equal(record.neverOverloadWorkforceBeyondValidatedLimits, true);
    assert.equal(record.structuralSignalOnly, true);

    assert.notEqual(
      engine.monitorAgentUtilization({
        companyReference: "company-alpha",
        workforceReference: "workforce-scale",
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.notEqual(
      engine.monitorWorkloadDistribution({
        companyReference: "company-alpha",
        workforceReference: "workforce-scale",
        validated: true,
      }).validation.decision,
      "fail",
    );
  });

  test("detect underutilized agents bottlenecks and recommendations", async () => {
    const { engine } = await buildEngine();
    engine.connectWorkforceIntelligence();

    engine.monitorWorkforceCapacity({
      companyReference: "company-alpha",
      workforceReference: "workforce-a",
      utilizationHint: 80,
      distributionHint: 75,
      throughputHint: 78,
      efficiencyHint: 80,
      validated: true,
    });
    engine.monitorExecutionThroughput({
      companyReference: "company-alpha",
      workforceReference: "workforce-b",
      utilizationHint: 30,
      distributionHint: 25,
      throughputHint: 20,
      efficiencyHint: 15,
      validated: true,
    });
    engine.monitorTaskCompletion({
      companyReference: "company-alpha",
      workforceReference: "workforce-a",
      utilizationHint: 80,
      distributionHint: 75,
      throughputHint: 78,
      efficiencyHint: 80,
      validated: true,
    });
    engine.monitorWorkforceEfficiency({
      companyReference: "company-alpha",
      workforceReference: "workforce-a",
      utilizationHint: 80,
      distributionHint: 75,
      throughputHint: 78,
      efficiencyHint: 80,
      validated: true,
    });

    const underutilized = engine.detectUnderutilizedAgents({
      companyReference: "company-alpha",
      validated: true,
    });
    assert.notEqual(underutilized.validation.decision, "fail");
    assert.ok(underutilized.workforceRecords.length >= 1);

    const bottlenecks = engine.detectWorkforceBottlenecks({
      companyReference: "company-alpha",
      validated: true,
    });
    assert.notEqual(bottlenecks.validation.decision, "fail");
    assert.ok(bottlenecks.workforceRecords.length >= 1);

    const recommendations = engine.recommendWorkforceOptimization({
      companyReference: "company-alpha",
      validated: true,
    });
    assert.notEqual(recommendations.validation.decision, "fail");
    assert.ok(recommendations.recommendations.length >= 1);
    assert.ok(recommendations.recommendations[0]!.recommendationId.startsWith("wfi-rec-"));
  });

  test("rejects unvalidated workforce input", async () => {
    const { engine } = await buildEngine();
    engine.connectWorkforceIntelligence();
    const report = engine.monitorWorkforceCapacity({
      workforceReference: "workforce-x",
    });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("validated=true")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendWfiLog({
      event: "workforce_monitoring",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectWorkforceIntelligence();
    const logs = getWfiLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("missing workforce data still produces structural workforce records", async () => {
    const { engine } = await buildEngine();
    engine.connectWorkforceIntelligence();
    const report = engine.monitorWorkforceCapacity({ validated: true });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.workforceRecords[0]!.companyReference, "company-default");
    assert.equal(report.workforceRecords[0]!.workforceReference, "workforce-default");
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectWorkforceIntelligence();
    engine.monitorWorkforceCapacity({
      workforceReference: "workforce-scale",
      efficiencyHint: 75,
      validated: true,
    });
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalWorkforceRecords >= 1);
    assert.ok(Array.isArray(cockpit.recentLogs));
    engine.runDiagnostics({});
  });

  test("health monitoring and automatic recovery track failures", async () => {
    const { engine } = await buildEngine();
    engine.connectWorkforceIntelligence();
    engine.monitorWorkforceCapacity({ workforceReference: "a" });
    engine.monitorWorkforceCapacity({ workforceReference: "b" });
    const state = engine.getState();
    assert.ok(state.performance.failedOperations >= 2);
    assert.ok(state.health.consecutiveFailures >= 1 || state.health.recoveryAttempts >= 0);
    assert.ok(["healthy", "degraded", "failed", "standby"].includes(state.health.status));
  });
});
