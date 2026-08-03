import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  PERFORMANCE_METRICS,
  PERFORMANCE_RATINGS,
  PERFORMANCE_RULES,
  PERFORMANCE_VERSION,
  WPR_CAPABILITIES,
  buildWorkerPerformanceReviewConfiguration,
  createWorkerPerformanceReview,
  resetWorkerPerformanceReviewForTesting,
} from "../../worker-performance-review/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build(config?: Parameters<typeof createWorkerPerformanceReview>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createWorkerPerformanceReview(bootstrap, config);
  await engine.initialize();
  engine.connectWorkerPerformanceReview();
  return engine;
}

describe("Q1-11 Worker Performance Review", () => {
  beforeEach(resetWorkerPerformanceReviewForTesting);

  test("1 locks mandatory worker-performance-review boundaries", () => {
    const c = buildWorkerPerformanceReviewConfiguration(REPO_ROOT, {
      neverExecuteWorkerTasks: false as never,
      neverReplaceWorkerMonitoring: false as never,
      neverReplaceWorkforceCertificationMonitor: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
    });
    assert.equal(c.neverExecuteWorkerTasks, true);
    assert.equal(c.neverReplaceWorkerMonitoring, true);
    assert.equal(c.neverReplaceWorkforceCertificationMonitor, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.integratesWithWorkerAssignmentEngine, true);
    assert.equal(c.integratesWithWorkforceCertificationMonitor, true);
    assert.equal(c.integratesWithAdaptiveWorkforceOptimizer, true);
  });

  test("2 initializes PILLOW-WPR-001 for Q1-11", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q1-11");
    assert.equal(state.engineVersion, "PILLOW-WPR-001");
    for (const rule of PERFORMANCE_RULES) {
      assert.ok(state.configuration.performanceRules.includes(rule));
    }
    for (const metric of PERFORMANCE_METRICS) {
      assert.ok(state.configuration.performanceMetrics.includes(metric));
    }
    for (const rating of PERFORMANCE_RATINGS) {
      assert.ok(state.configuration.performanceRatings.includes(rating));
    }
  });

  test("3 reviews and scores a worker", async () => {
    const engine = await build();
    const report = engine.reviewWorker({
      workerId: "wkr-strategy-01",
      reviewPeriod: "2026-Q3",
      validated: true,
    });
    assert.equal(report.action, "review_worker");
    assert.equal(report.latestRecord!.workerId, "wkr-strategy-01");
    assert.ok(report.latestRecord!.overallScore > 0.85);
    assert.ok(
      ["outstanding", "excellent", "good"].includes(String(report.latestRecord!.executiveRating)),
    );
    assert.ok(report.latestRecord!.qualityScore > 0);
    assert.ok(report.latestRecord!.accuracyScore > 0);
    assert.ok(report.latestRecord!.speedScore > 0);
  });

  test("4 reviews every active worker", async () => {
    const engine = await build();
    const report = engine.reviewActiveWorkers({
      reviewPeriod: "2026-Q3",
      validated: true,
    });
    assert.equal(report.action, "review_active");
    assert.ok(report.records.length >= 4);
    assert.ok(report.workers.every((w) => w.active));
    assert.ok(report.records.every((r) => r.improvementRecommendations.length > 0));
  });

  test("5 analyzes historical trends (improving and declining)", async () => {
    const engine = await build();
    engine.reviewWorker({
      workerId: "wkr-ops-01",
      quality: 0.6,
      accuracy: 0.58,
      speed: 0.55,
      reliability: 0.57,
      validated: true,
    });
    const improving = engine.reviewWorker({
      workerId: "wkr-ops-01",
      quality: 0.8,
      accuracy: 0.79,
      speed: 0.78,
      reliability: 0.81,
      consistency: 0.8,
      collaboration: 0.8,
      recovery: 0.78,
      efficiency: 0.77,
      businessValue: 0.8,
      governanceCompliance: 0.85,
      approvalRate: 0.8,
      reviewOutcome: 0.8,
      validated: true,
    });
    assert.equal(improving.latestRecord!.trend.direction, "improving");

    engine.reviewWorker({
      workerId: "wkr-commerce-01",
      quality: 0.85,
      accuracy: 0.84,
      speed: 0.83,
      reliability: 0.85,
      validated: true,
    });
    const declining = engine.reviewWorker({
      workerId: "wkr-commerce-01",
      quality: 0.6,
      accuracy: 0.58,
      speed: 0.55,
      reliability: 0.57,
      consistency: 0.56,
      collaboration: 0.6,
      recovery: 0.55,
      efficiency: 0.54,
      businessValue: 0.58,
      governanceCompliance: 0.7,
      approvalRate: 0.6,
      reviewOutcome: 0.58,
      validated: true,
    });
    assert.equal(declining.latestRecord!.trend.direction, "declining");

    const trends = engine.analyzeTrends({ validated: true });
    assert.equal(trends.action, "analyze_trends");
    assert.ok(trends.trends.some((t) => t.direction === "improving" || t.direction === "declining"));
  });

  test("6 generates improvement recommendations", async () => {
    const engine = await build();
    const report = engine.recommendImprovements({
      workerId: "wkr-ops-01",
      validated: true,
    });
    assert.equal(report.action, "recommend_improvements");
    assert.ok(report.recommendations.length >= 1);
    assert.ok(report.latestRecord!.improvementRecommendations.length >= 1);
  });

  test("7 produces executive performance report", async () => {
    const engine = await build();
    const report = engine.produceExecutiveReport({
      reviewPeriod: "2026-Q3",
      validated: true,
    });
    assert.equal(report.action, "produce_executive_report");
    const exec = report.executiveReport!;
    assert.ok(exec.reportId);
    assert.equal(exec.executiveAuthority, "pillow");
    assert.ok(exec.totalWorkersReviewed >= 4);
    assert.ok(exec.averageOverallScore > 0);
    assert.ok(exec.topPerformers.length >= 1);
    assert.ok(Array.isArray(exec.improvementPriorities));
  });

  test("8 produces machine-readable performance records", async () => {
    const engine = await build();
    engine.reviewActiveWorkers({ validated: true });
    const report = engine.producePerformance({ validated: true });
    const catalog = report.catalog!;
    assert.equal(catalog.performanceVersion, PERFORMANCE_VERSION);
    assert.equal(catalog.executiveAuthority, "pillow");
    assert.ok(catalog.records.length >= 1);
    const record = catalog.records[0]!;
    assert.ok(record.performanceReviewId);
    assert.ok(record.timestamp);
    assert.ok(record.workerId);
    assert.ok(record.workerName);
    assert.ok(record.department);
    assert.ok(record.reviewPeriod);
    assert.ok(typeof record.qualityScore === "number");
    assert.ok(typeof record.accuracyScore === "number");
    assert.ok(typeof record.speedScore === "number");
    assert.ok(typeof record.reliabilityScore === "number");
    assert.ok(typeof record.collaborationScore === "number");
    assert.ok(typeof record.recoveryScore === "number");
    assert.ok(typeof record.businessOutcomeScore === "number");
    assert.ok(record.executiveRating);
    assert.ok(Array.isArray(record.improvementRecommendations));
    assert.equal(record.metadataVersion, "WPR-001-v1");
    assert.equal(record.neverExecuteWorkerTasks, true);
    assert.equal(record.integratesWithWorkerAssignmentEngine, true);
  });

  test("9 scores worker via scoreWorker API", async () => {
    const engine = await build();
    const report = engine.scoreWorker({
      workerId: "wkr-support-01",
      validated: true,
    });
    assert.equal(report.action, "score_worker");
    assert.equal(report.latestRecord!.workerId, "wkr-support-01");
    assert.ok(report.latestRecord!.overallScore > 0.8);
  });

  test("10 rejects boundary bypasses and stays evaluate-only", async () => {
    const engine = await build();
    assert.equal(
      engine.reviewWorker({
        workerId: "wkr-strategy-01",
        executeWorkerTasks: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.reviewActiveWorkers({
        replaceWorkerMonitoring: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.produceExecutiveReport({
        replaceWorkforceCertificationMonitor: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.producePerformance({ overridePillow: true, validated: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.validateWorkerPerformanceReview({
        overrideGrandKing: true,
        validated: true,
      }).validation.decision,
      "fail",
    );
    assert.ok(WPR_CAPABILITIES.includes("generate_overall_performance_scores"));
    assert.ok(WPR_CAPABILITIES.includes("produce_machine_readable_performance_records"));
    assert.ok(WPR_CAPABILITIES.includes("extensible_performance_metrics"));
    const worker = engine.getWorkers().find((w) => w.workerId === "wkr-strategy-01")!;
    assert.equal(worker.neverExecuteWorkerTasks, true);
  });
});
