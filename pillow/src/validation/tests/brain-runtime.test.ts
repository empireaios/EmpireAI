import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import {
  createBrainRuntimeEngine,
  RUNTIME_BOTTLENECK_REGISTRY,
  RUNTIME_GOVERNANCE_DOMAINS,
  RUNTIME_PRINCIPLES,
  getBlockingBottlenecks,
  buildDefaultRuntimeSnapshot,
} from "../../brain-runtime/index.js";
import {
  startPillow,
  requirePillowBrainRuntime,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

describe("P5-01 Brain Runtime (PILLOW-BR-001)", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Brain Runtime Engine initializes with startPillow", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowBrainRuntime();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-BR-001");
    assert.equal(state.status, "ready");
  });

  test("Bottleneck registry covers known runtime risks", () => {
    assert.ok(RUNTIME_BOTTLENECK_REGISTRY.length >= 8);
    assert.ok(getBlockingBottlenecks().length >= 4);
    assert.ok(RUNTIME_GOVERNANCE_DOMAINS.length >= 13);
    assert.ok(RUNTIME_PRINCIPLES.length >= 7);
  });

  test("Builder gate evaluates brain runtime readiness", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowBrainRuntime();
    const gate = engine.evaluateBuilderGateSync({ missionId: "P5-01", roadmapItem: "P5-01" });
    assert.ok(gate.readinessScore >= 75);
    assert.equal(gate.allowed, true);
  });

  test("Grand King acceptance — Brain/Pillow/Login/Executive Home responsive", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowBrainRuntime();
    const snapshot = buildDefaultRuntimeSnapshot();
    const result = engine.verifyResponsiveness(snapshot);
    assert.equal(result.brainResponsive, true);
    assert.equal(result.pillowResponsive, true);
    assert.equal(result.loginResponsive, true);
    assert.equal(result.executiveHomeResponsive, true);
    assert.equal(result.noDegradation, true);
    assert.equal(result.assessment.success, true);
  });

  test("Runtime assessment detects event-loop degradation", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowBrainRuntime();
    const degraded = buildDefaultRuntimeSnapshot();
    degraded.eventLoopLagMs = 600;
    degraded.brainResponsive = false;
    degraded.pillowResponsive = false;
    const assessment = engine.runAssessment(degraded);
    assert.equal(assessment.overallStatus, "blocked");
    assert.equal(assessment.responsive, false);
  });

  test("Generated mission includes Brain Runtime preamble", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const doc = (await import("../../session.js")).generateNextPillowMission();
    if (doc) {
      assert.match(doc.formatted, /BRAIN RUNTIME/);
      assert.match(doc.formatted, /responsive regardless of workload/i);
    }
  });

  test("Pillow analyzes runtime stability", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowBrainRuntime();
    engine.runAssessment();
    const analysis = engine.analyzeRuntimeStability();
    assert.ok(analysis.recommendations.length > 0);
  });
});
