import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import {
  CURRENT_ARCHITECTURE_REGISTRY,
  SCALING_STAGE_REGISTRY,
  SCALING_DOMAINS,
  SCALING_STAGES,
  SCALING_PRINCIPLES,
  DATABASE_EVOLUTION_REGISTRY,
  RUNTIME_EVOLUTION_REGISTRY,
  SCALING_BOTTLENECK_REGISTRY,
  getRecommendedNextStage,
} from "../../scaling-architecture/index.js";
import {
  startPillow,
  requirePillowScalingArchitecture,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

describe("P5-05 Scaling Architecture (PILLOW-SCL-001)", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Scaling Architecture Engine initializes with startPillow", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowScalingArchitecture();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-SCL-001");
    assert.equal(state.status, "ready");
  });

  test("Current architecture and scaling roadmap documented", () => {
    assert.ok(CURRENT_ARCHITECTURE_REGISTRY.length >= 10);
    assert.ok(SCALING_STAGE_REGISTRY.length >= 5);
    assert.ok(SCALING_DOMAINS.length >= 17);
    assert.ok(SCALING_STAGES.length >= 5);
    assert.ok(SCALING_PRINCIPLES.length >= 8);
    assert.ok(DATABASE_EVOLUTION_REGISTRY.length >= 5);
    assert.ok(RUNTIME_EVOLUTION_REGISTRY.length >= 6);
    assert.ok(SCALING_BOTTLENECK_REGISTRY.length >= 8);
    for (const stage of SCALING_STAGE_REGISTRY) {
      assert.ok(stage.exitCriteria.length > 0);
      assert.ok(stage.objectives.length > 0);
    }
  });

  test("Scaling stages chain correctly", () => {
    assert.equal(getRecommendedNextStage("stage_1_single_instance"), "stage_2_production_hardening");
    assert.equal(getRecommendedNextStage("stage_2_production_hardening"), "stage_3_multi_instance");
    assert.equal(getRecommendedNextStage("stage_4_high_availability"), "stage_5_enterprise_scale");
  });

  test("Builder gate evaluates scaling architecture readiness", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowScalingArchitecture();
    const gate = engine.evaluateBuilderGateSync({ missionId: "P5-05", roadmapItem: "P5-05" });
    assert.ok(gate.readinessScore >= 75);
    assert.equal(gate.allowed, true);
  });

  test("Grand King acceptance — architecture clarity without reconstruction", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowScalingArchitecture();
    const clarity = engine.verifyGrandKingClarity();
    assert.equal(clarity.complete, true);
    assert.ok(clarity.migrationPhases >= 5);
    assert.match(clarity.assessment.grandKingSummary, /Current:/);
    assert.match(clarity.assessment.grandKingSummary, /Next:/);
    assert.equal(clarity.currentStage, "Single Instance Production");
    assert.equal(clarity.nextStage, "Production Hardening");
  });

  test("Generated mission includes Scaling Architecture preamble", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const doc = (await import("../../session.js")).generateNextPillowMission();
    if (doc) {
      assert.match(doc.formatted, /SCALING ARCHITECTURE/);
      assert.match(doc.formatted, /deliberately/i);
    }
  });

  test("Pillow analyzes scaling readiness", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowScalingArchitecture();
    engine.runAssessment();
    const analysis = engine.analyzeScalingReadiness();
    assert.ok(analysis.recommendations.length > 0);
    assert.ok(analysis.scalingReadiness.length > 0);
  });
});
