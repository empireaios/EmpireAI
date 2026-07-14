import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import {
  PERFORMANCE_BASELINE_REGISTRY,
  PERFORMANCE_METRIC_REGISTRY,
  PERFORMANCE_REGRESSION_REGISTRY,
  PERFORMANCE_BOTTLENECK_REGISTRY,
  PERFORMANCE_DOMAINS,
  PERFORMANCE_METRICS,
  PERFORMANCE_PRINCIPLES,
  PHASE_P5_REVIEW_REGISTRY,
  isPhaseP5Complete,
} from "../../performance-governance/index.js";
import {
  startPillow,
  requirePillowPerformanceGovernance,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

describe("P5-06 Performance Governance (PILLOW-PG-001)", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Performance Governance Engine initializes with startPillow", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowPerformanceGovernance();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-PG-001");
    assert.equal(state.status, "ready");
  });

  test("Performance baselines and metrics documented", () => {
    assert.ok(PERFORMANCE_BASELINE_REGISTRY.length >= 10);
    assert.ok(PERFORMANCE_METRIC_REGISTRY.length >= 16);
    assert.ok(PERFORMANCE_REGRESSION_REGISTRY.length >= 9);
    assert.ok(PERFORMANCE_BOTTLENECK_REGISTRY.length >= 10);
    assert.ok(PERFORMANCE_DOMAINS.length >= 20);
    assert.ok(PERFORMANCE_METRICS.length >= 16);
    assert.ok(PERFORMANCE_PRINCIPLES.length >= 8);
    for (const baseline of PERFORMANCE_BASELINE_REGISTRY) {
      assert.ok(baseline.acceptableThreshold);
      assert.ok(baseline.criticalThreshold);
    }
  });

  test("Phase P5 completion review", () => {
    assert.equal(PHASE_P5_REVIEW_REGISTRY.length, 6);
    assert.equal(isPhaseP5Complete(), true);
    for (const mission of PHASE_P5_REVIEW_REGISTRY) {
      assert.equal(mission.status, "complete");
    }
  });

  test("Builder gate evaluates performance governance readiness", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowPerformanceGovernance();
    const gate = engine.evaluateBuilderGateSync({ missionId: "P5-06", roadmapItem: "P5-06" });
    assert.ok(gate.readinessScore >= 75);
    assert.equal(gate.allowed, true);
  });

  test("Grand King acceptance — performance clarity without log analysis", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowPerformanceGovernance();
    const clarity = engine.verifyGrandKingClarity();
    assert.equal(clarity.complete, true);
    assert.equal(clarity.phaseP5Complete, true);
    assert.match(clarity.assessment.grandKingSummary, /Performance:/);
    assert.ok(clarity.overallScore >= 0);
  });

  test("Generated mission includes Performance Governance preamble", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const doc = (await import("../../session.js")).generateNextPillowMission();
    if (doc) {
      assert.match(doc.formatted, /PERFORMANCE GOVERNANCE/);
      assert.match(doc.formatted, /measurable/i);
    }
  });

  test("Pillow analyzes performance trends", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowPerformanceGovernance();
    engine.runAssessment();
    const analysis = engine.analyzePerformanceTrends();
    assert.ok(analysis.recommendations.length > 0);
    assert.ok(analysis.performanceTrends.length > 0);
  });
});
