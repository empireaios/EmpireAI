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
  buildScalingDecisionEngineConfiguration,
  SCALING_DECISION_ENGINE_SYSTEM_PATH,
  SCALING_DECISION_ENGINE_ID,
  SDE_CAPABILITIES,
  SDE_METADATA_VERSION,
} from "../../scaling-decision-engine/index.js";
import { appendSdeLog, getSdeLogs } from "../../scaling-decision-engine/sde-logging.js";

async function buildEngine() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const asf = createAutonomousScalingFrameworkEngine(bootstrap);
  await asf.initialize();
  const wpd = createWinningProductDetectorEngine(bootstrap, {
    autonomousScalingFramework: asf,
  });
  await wpd.initialize();
  const engine = createScalingDecisionEngine(bootstrap, {
    autonomousScalingFramework: asf,
    winningProductDetector: wpd,
  });
  await engine.initialize();
  return { engine, asf, wpd };
}

describe("X3-03 Scaling Decision Engine", () => {
  beforeEach(() => {
    resetAutonomousScalingFrameworkForTesting();
    resetWinningProductDetectorForTesting();
    resetScalingDecisionEngineForTesting();
  });

  test("buildScalingDecisionEngineConfiguration locks safety flags", () => {
    const config = buildScalingDecisionEngineConfiguration(REPO_ROOT, {
      neverApproveScalingWithoutValidation: false as never,
      neverExposeCredentials: false as never,
    });
    assert.equal(config.enabled, true);
    assert.equal(config.neverApproveScalingWithoutValidation, true);
    assert.equal(config.neverExposeCredentials, true);
    assert.equal(config.neverExposeAuthenticationTokens, true);
    assert.equal(config.preserveDecisionTraceability, true);
    assert.equal(config.preserveEnterpriseIntegrity, true);
    assert.equal(config.structuralSignalsOnly, true);
    assert.equal(config.neverLogSensitiveOperationalInformation, true);
    assert.ok(SDE_CAPABILITIES.includes("scale_hold_reject_decision"));
    assert.ok(SDE_CAPABILITIES.includes("scaling_priority_ranking"));
  });

  test("scaling decision engine initializes with doctrine doc", async () => {
    const { engine } = await buildEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-SDE-001");
    assert.equal(state.missionId, "X3-03");
    assert.ok(SCALING_DECISION_ENGINE_SYSTEM_PATH.includes("SCALING_DECISION"));
  });

  test("connectScalingDecisionEngine registers with ASF via X3-03", async () => {
    const { engine, asf } = await buildEngine();
    const report = engine.connectScalingDecisionEngine();
    assert.notEqual(report.validation.decision, "fail", report.validation.errors.join("; "));
    const modules = asf.getRegisteredModules();
    assert.ok(modules.some((m) => m.scalingModuleIdentifier === SCALING_DECISION_ENGINE_ID));
    assert.equal(report.engineRecord.dependencyPresence.autonomousScalingFramework, true);
    assert.equal(report.engineRecord.dependencyPresence.winningProductDetector, true);
    assert.ok(report.engineRecord.frameworkModuleId);
  });

  test("evaluate candidate and readiness produce machine-readable sde-* records", async () => {
    const { engine } = await buildEngine();
    engine.connectScalingDecisionEngine();

    const evaluation = engine.evaluateCandidate({
      companyReference: "company-alpha",
      productReference: "product-scale",
      productReadinessHint: 85,
      operationalReadinessHint: 80,
      financialReadinessHint: 78,
      supplierReadinessHint: 75,
      marketReadinessHint: 82,
      riskHint: 25,
      validated: true,
    });
    assert.notEqual(
      evaluation.validation.decision,
      "fail",
      evaluation.validation.errors.join("; "),
    );
    assert.ok(evaluation.scalingDecisionRunReportId.startsWith("sde-run-"));
    const record = evaluation.decisionRecords[0]!;
    assert.ok(record.scalingDecisionId.startsWith("sde-dec-"));
    assert.equal(record.metadataVersion, SDE_METADATA_VERSION);
    assert.equal(record.neverApproveWithoutValidation, true);
    assert.equal(record.structuralSignalOnly, true);

    const readiness = engine.assessReadiness({
      companyReference: "company-alpha",
      productReference: "product-scale",
      productReadinessHint: 85,
      validated: true,
    });
    assert.notEqual(readiness.validation.decision, "fail");
    assert.ok(readiness.decisionRecords[0]!.readinessScore >= 0);
  });

  test("risk decide rank and recommendations produce scale hold reject outcomes", async () => {
    const { engine } = await buildEngine();
    engine.connectScalingDecisionEngine();

    assert.notEqual(
      engine.assessRisk({
        companyReference: "company-alpha",
        productReference: "product-a",
        riskHint: 20,
        validated: true,
      }).validation.decision,
      "fail",
    );

    const scale = engine.decideScale({
      companyReference: "company-alpha",
      productReference: "product-scale",
      productReadinessHint: 90,
      operationalReadinessHint: 88,
      financialReadinessHint: 85,
      supplierReadinessHint: 80,
      marketReadinessHint: 86,
      riskHint: 20,
      validated: true,
    });
    assert.notEqual(scale.validation.decision, "fail");
    assert.equal(scale.decisionRecords[0]!.decision, "scale");

    const reject = engine.decideScale({
      companyReference: "company-alpha",
      productReference: "product-risk",
      productReadinessHint: 40,
      riskHint: 85,
      validated: true,
    });
    assert.notEqual(reject.validation.decision, "fail");
    assert.equal(reject.decisionRecords[0]!.decision, "reject");

    const ranked = engine.rankPriorities({
      companyReference: "company-alpha",
      validated: true,
    });
    assert.notEqual(ranked.validation.decision, "fail");
    assert.ok(ranked.decisionRecords.length >= 1);
    assert.equal(ranked.decisionRecords[0]!.opportunityRanking, 1);

    const recommendations = engine.generateRecommendations({
      companyReference: "company-alpha",
      validated: true,
    });
    assert.notEqual(recommendations.validation.decision, "fail");
    assert.ok(recommendations.recommendations.length >= 1);
    assert.ok(recommendations.recommendations[0]!.recommendationId.startsWith("sde-rec-"));
  });

  test("rejects unvalidated decision input", async () => {
    const { engine } = await buildEngine();
    engine.connectScalingDecisionEngine();
    const report = engine.decideScale({
      productReference: "product-x",
    });
    assert.equal(report.validation.decision, "fail");
    assert.ok(report.validation.errors.some((e) => e.includes("validated=true")));
  });

  test("governance safety redacts sensitive values in logs", async () => {
    const { engine } = await buildEngine();
    appendSdeLog({
      event: "decision_generation",
      level: "info",
      details: "api_key=secret-key bearer abc123",
    });
    engine.connectScalingDecisionEngine();
    const logs = getSdeLogs(50);
    assert.ok(logs.some((l) => l.details.includes("[redacted")));
    assert.ok(!logs.some((l) => l.details.includes("secret-key")));
  });

  test("missing product data still produces structural decision records", async () => {
    const { engine } = await buildEngine();
    engine.connectScalingDecisionEngine();
    const report = engine.evaluateCandidate({ validated: true });
    assert.notEqual(report.validation.decision, "fail");
    assert.equal(report.decisionRecords[0]!.companyReference, "company-default");
    assert.equal(report.decisionRecords[0]!.productReference, "product-default");
  });

  test("validateForSupervisorSync and cockpit snapshot report readiness", async () => {
    const { engine } = await buildEngine();
    engine.connectScalingDecisionEngine();
    engine.decideScale({
      productReference: "product-scale",
      productReadinessHint: 90,
      operationalReadinessHint: 85,
      financialReadinessHint: 80,
      supplierReadinessHint: 78,
      marketReadinessHint: 82,
      riskHint: 20,
      validated: true,
    });
    const sync = engine.validateForSupervisorSync();
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 50);
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.frameworkRegistered, true);
    assert.ok(cockpit.totalDecisionRecords >= 1);
    assert.ok(Array.isArray(cockpit.recentLogs));
    engine.runDiagnostics({});
  });

  test("health monitoring and automatic recovery track failures", async () => {
    const { engine } = await buildEngine();
    engine.connectScalingDecisionEngine();
    engine.decideScale({ productReference: "a" });
    engine.decideScale({ productReference: "b" });
    const state = engine.getState();
    assert.ok(state.performance.failedOperations >= 2);
    assert.ok(state.health.consecutiveFailures >= 1 || state.health.recoveryAttempts >= 0);
    assert.ok(["healthy", "degraded", "failed", "standby"].includes(state.health.status));
  });
});
