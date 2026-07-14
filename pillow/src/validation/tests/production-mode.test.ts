import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import {
  PRODUCTION_COMPONENT_REGISTRY,
  PRODUCTION_MODE_DOMAINS,
  PRODUCTION_STATES,
  FEATURE_FLAG_REGISTRY,
  getUndocumentedFlags,
} from "../../production-mode/index.js";
import {
  startPillow,
  requirePillowProductionMode,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

describe("P5-02 Production Mode (PILLOW-PM-001)", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Production Mode Engine initializes with startPillow", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowProductionMode();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-PM-001");
    assert.equal(state.status, "ready");
  });

  test("Component registry covers all governed domains", () => {
    assert.ok(PRODUCTION_COMPONENT_REGISTRY.length >= 17);
    assert.ok(PRODUCTION_MODE_DOMAINS.length >= 16);
    assert.ok(PRODUCTION_STATES.length >= 8);
    for (const component of PRODUCTION_COMPONENT_REGISTRY) {
      assert.ok(component.purpose);
      assert.ok(component.productionState);
      assert.ok(component.reason);
      assert.ok(component.activationRules);
    }
  });

  test("All feature flags documented", () => {
    assert.ok(FEATURE_FLAG_REGISTRY.length >= 8);
    assert.equal(getUndocumentedFlags().length, 0);
  });

  test("Builder gate evaluates production mode readiness", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowProductionMode();
    const gate = engine.evaluateBuilderGateSync({ missionId: "P5-02", roadmapItem: "P5-02" });
    assert.ok(gate.readinessScore >= 75);
    assert.equal(gate.allowed, true);
  });

  test("Grand King acceptance — every subsystem has one documented production state", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowProductionMode();
    const clarity = engine.verifyGrandKingClarity();
    assert.equal(clarity.complete, true);
    assert.ok(clarity.componentCount >= 17);
    assert.ok(clarity.flagCount >= 8);
    assert.match(clarity.assessment.grandKingSummary, /Running:/);
    assert.match(clarity.assessment.grandKingSummary, /Disabled:/);
    assert.match(clarity.assessment.grandKingSummary, /Deferred:/);
  });

  test("Generated mission includes Production Mode preamble", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const doc = (await import("../../session.js")).generateNextPillowMission();
    if (doc) {
      assert.match(doc.formatted, /PRODUCTION MODE/);
      assert.match(doc.formatted, /never surprise the Grand King/i);
    }
  });

  test("Pillow analyzes production drift", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowProductionMode();
    engine.runAssessment();
    const analysis = engine.analyzeProductionDrift();
    assert.ok(analysis.recommendations.length > 0);
  });
});
