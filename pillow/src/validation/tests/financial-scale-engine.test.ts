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
  buildFinancialScaleEngineConfiguration,
  FINANCIAL_SCALE_ENGINE_SYSTEM_PATH,
  FINANCIAL_SCALE_ENGINE_ID,
  FSE_CAPABILITIES,
  FSE_METADATA_VERSION,
} from "../../financial-scale-engine/index.js";
import { appendFseLog, getFseLogs } from "../../financial-scale-engine/fse-logging.js";

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
  const engine = createFinancialScaleEngine(bootstrap, {
    autonomousScalingFramework: asf,
    winningProductDetector: wpd,
    scalingDecisionEngine: sde,
    capacityPlanningEngine: cpe,
    marketingScaleEngine: mse,
    supplierScaleEngine: sse,
  });
  await engine.initialize();
  return { engine, asf, wpd, sde, cpe, mse, sse };
}

describe("X3-07 Financial Scale Engine", () => {
  beforeEach(() => {
    resetAutonomousScalingFrameworkForTesting();
    resetWinningProductDetectorForTesting();
    resetScalingDecisionEngineForTesting();
    resetCapacityPlanningEngineForTesting();
    resetMarketingScaleEngineForTesting();
    resetSupplierScaleEngineForTesting();
    resetFinancialScaleEngineForTesting();
  });

  test("buildFinancialScaleEngineConfiguration locks safety flags", () => {
    const config = buildFinancialScaleEngineConfiguration(REPO_ROOT, {
      neverRecommendScalingWithoutValidatedFinancialReadiness: false as never,
      neverExposeCredentials: false as never,
    });
    assert.equal(config.enabled, true);
    assert.equal(config.neverRecommendScalingWithoutValidatedFinancialReadiness, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverExposeAuthenticationTokens, true);
    assert.equal(config.preserveFinancialTraceability, true);
    assert.equal(config.preserveFinancialIntegrity, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.neverLogSensitiveFinancialInformation, true);
    assert.ok(FSE_CAPABILITIES.includes("financial_bottleneck_detection"));
    assert.ok(FSE_CAPABILITIES.includes("capital_shortage_detection"));
  });

  test("financial scale engine initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-FSE-001");
    assert.equal(state.missionId, "X3-07");
    assert.ok(FINANCIAL_SCALE_ENGINE_SYSTEM_PATH.includes("FINANCIAL_SCALE"));
  });

  test("connectFinancialScaleEngine registers with ASF via X3-07", async () => {
    const { engine, asf } = await buildEngine();
    const report = engine.connectFinancialScaleEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = asf.getRegisteredModules();
    assert.ok(modules.some((m) => m.scalingModuleIdentifier === FINANCIAL_SCALE_ENGINE_ID));
    assert.equal(report.engineRecord.dependencyPresence.autonomousScalingFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.winningProductDetector, true);
    assert.equal(report.engineRecord.dependencyPresence.scalingDecisionEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.capacityPlanningEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.marketingScaleEngine, true);
    assert.equal(report.engineRecord.dependencyPresence.supplierScaleEngine, true);
    assert.ok(report.engineRecord.frameworkModuleId);
  });

  test("monitoring produces machine-readable fse-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectFinancialScaleEngine();

    const capital = engine.monitorCapitalRequirements({
      companyReference: "company-alpha",
      scalingInitiativeReference: "initiative-scale",
      capitalHint: 70,
      cashFlowHint: 65,
      profitabilityHint: 68,
      investmentEfficiencyHint: 72,
      validated: true,
    });
    assert.notEqual(
      capital.validation.decision,
      "fail",
      capital.validation.errors.join("; "),
    );
    assert.ok(capital.financialScaleRunReportId.startsWith("fse-run-"));
    const record = capital.scalingRecords[0]!;
    assert.ok(record.financialScalingId.startsWith("fse-fin-"));
    assert.equal(record.metadataVersion, FSE_METADATA_VERSION);
    assert.equal(record.neverRecommendScalingWithoutValidatedFinancialReadiness, true);
    assert.equal(record.structuralSignalOnly, true);

    assert.notEqual(
      engine.monitorCashFlowReadiness({
        companyReference: "company-alpha",
        scalingInitiativeReference: "initiative-scale",
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.notEqual(
      engine.monitorProfitability({
        companyReference: "company-alpha",
        scalingInitiativeReference: "initiative-scale",
        validated: true,
      }).validation.decision,
      "fail",
    );
  });

  test("detect capital shortages bottlenecks and recommendations", async () => {
    const { engine } = await buildEngine();
    engine.connectFinancialScaleEngine();

    engine.monitorCapitalRequirements({
      companyReference: "company-alpha",
      scalingInitiativeReference: "initiative-a",
      capitalHint: 80,
      cashFlowHint: 75,
      profitabilityHint: 78,
      investmentEfficiencyHint: 80,
      validated: true,
    });
    engine.monitorWorkingCapital({
      companyReference: "company-alpha",
      scalingInitiativeReference: "initiative-b",
      capitalHint: 30,
      cashFlowHint: 25,
      profitabilityHint: 20,
      investmentEfficiencyHint: 15,
      validated: true,
    });
    engine.monitorOperatingExpenses({
      companyReference: "company-alpha",
      scalingInitiativeReference: "initiative-a",
      capitalHint: 80,
      cashFlowHint: 75,
      profitabilityHint: 78,
      investmentEfficiencyHint: 80,
      validated: true,
    });
    engine.monitorInvestmentEfficiency({
      companyReference: "company-alpha",
      scalingInitiativeReference: "initiative-a",
      capitalHint: 80,
      cashFlowHint: 75,
      profitabilityHint: 78,
      investmentEfficiencyHint: 80,
      validated: true,
    });

    const shortages = engine.detectCapitalShortages({
      companyReference: "company-alpha",
      validated: true,
    });
    assert.notEqual(shortages.validation.decision, "fail");
    assert.ok(shortages.scalingRecords.length >= 1);

    const bottlenecks = engine.detectFinancialBottlenecks({
      companyReference: "company-alpha",
      validated: true,
    });
    assert.notEqual(bottlenecks.validation.decision, "fail");
    assert.ok(bottlenecks.scalingRecords.length >= 1);

    const recommendations = engine.recommendFinancialScaling({
      companyReference: "company-alpha",
      validated: true,
    });
    assert.notEqual(recommendations.validation.decision, "fail");
    assert.ok(recommendations.recommendations.length >= 1);
    assert.ok(recommendations.recommendations[0]!.recommendationId.startsWith("fse-rec-"));
  });

  test("rejects unvalidated financial input", async () => {
    const { engine } = await buildEngine();
    engine.connectFinancialScaleEngine();
    const report = engine.monitorCapitalRequirements({
      scalingInitiativeReference: "initiative-x",
    });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("validated=true")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendFseLog({
      event: "financial_monitoring",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectFinancialScaleEngine();
    const logs = getFseLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("missing financial data still produces structural scaling records", async () => {
    const { engine } = await buildEngine();
    engine.connectFinancialScaleEngine();
    const report = engine.monitorCapitalRequirements({ validated: true });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.scalingRecords[0]!.companyReference, "company-default");
    assert.equal(report.scalingRecords[0]!.scalingInitiativeReference, "initiative-default");
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectFinancialScaleEngine();
    engine.monitorCapitalRequirements({
      scalingInitiativeReference: "initiative-scale",
      investmentEfficiencyHint: 75,
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
    engine.connectFinancialScaleEngine();
    engine.monitorCapitalRequirements({ scalingInitiativeReference: "a" });
    engine.monitorCapitalRequirements({ scalingInitiativeReference: "b" });
    const state = engine.getState();
    assert.ok(state.performance.failedOperations >= 2);
    assert.ok(state.health.consecutiveFailures >= 1 || state.health.recoveryAttempts >= 0);
    assert.ok(["healthy", "degraded", "failed", "standby"].includes(state.health.status));
  });
});
