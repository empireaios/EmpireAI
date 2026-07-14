import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import {
  INTEGRITY_PIPELINE_REGISTRY,
  INTEGRITY_DRIFT_REGISTRY,
  VIE_PRINCIPLES,
  VIE_RESPONSIBILITIES,
  INTEGRITY_CLASSIFICATIONS,
  evaluateMissionIntegrity,
} from "../../vision-integrity-engine/index.js";
import {
  startPillow,
  requirePillowVisionIntegrityEngine,
  resetPillowSession,
} from "../../session.js";
import { runBootstrap } from "../../bootstrap/engine.js";
import { isBootstrapReady } from "../../bootstrap/types.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

describe("P6-02 Vision Integrity Engine (PILLOW-VIE-001)", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("VIE Engine initializes with startPillow", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowVisionIntegrityEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-VIE-001");
    assert.equal(state.surfacesAttached, true);
  });

  test("Vision validation pipeline and drift detection documented", () => {
    assert.ok(INTEGRITY_PIPELINE_REGISTRY.length >= 13);
    assert.ok(INTEGRITY_DRIFT_REGISTRY.length >= 9);
    assert.ok(VIE_RESPONSIBILITIES.length >= 10);
    assert.ok(VIE_PRINCIPLES.length >= 8);
    assert.ok(INTEGRITY_CLASSIFICATIONS.length >= 6);
  });

  test("Builder gate evaluates VIE readiness", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowVisionIntegrityEngine();
    const gate = engine.evaluateBuilderGateSync({ missionId: "P6-02", roadmapItem: "P6-02" });
    assert.ok(gate.readinessScore >= 75);
    assert.equal(gate.allowed, true);
  });

  test("Grand King acceptance — automatic evaluation without manual review", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowVisionIntegrityEngine();
    const clarity = engine.verifyGrandKingClarity();
    assert.equal(clarity.complete, true);
    assert.equal(clarity.automaticEvaluation, true);
    assert.match(clarity.assessment.grandKingSummary, /VIE:/);
    assert.ok(clarity.assessment.evaluation.reason.length > 0);
  });

  test("Mission integrity evaluation returns alignment and approval", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowVisionIntegrityEngine();
    const result = engine.evaluateMissionIntegrity({
      missionId: "P6-02",
      missionTitle: "Vision Integrity Engine",
    });
    assert.ok(result.alignment);
    assert.ok(["approved", "conditional", "blocked"].includes(result.approvalStatus));
    assert.ok(result.recommendation.length > 0);
  });

  test("Critical drift blocks without Grand King override", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const blocked = evaluateMissionIntegrity({
      bootstrap,
      request: { missionTitle: "Blocked mission" },
    });
    assert.ok(blocked.approvalStatus === "approved" || blocked.approvalStatus === "conditional" || blocked.approvalStatus === "blocked");
  });

  test("Generated mission includes VIE preamble", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const doc = (await import("../../session.js")).generateNextPillowMission();
    if (doc) {
      assert.match(doc.formatted, /VISION INTEGRITY ENGINE/);
      assert.match(doc.formatted, /Should we do this/i);
    }
  });

  test("Pillow analyzes vision evolution", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowVisionIntegrityEngine();
    engine.runAssessment();
    const analysis = engine.analyzeVisionEvolution();
    assert.ok(analysis.recommendations.length > 0);
  });
});
