import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import {
  EXECUTION_PIPELINE_REGISTRY,
  EXECUTION_DEPENDENCY_REGISTRY,
  EXECUTION_RESOURCE_REGISTRY,
  ECC_PRINCIPLES,
  ECC_EXECUTION_STATES,
  ECC_RESPONSIBILITIES,
  getCriticalPath,
} from "../../execution-control-center/index.js";
import {
  startPillow,
  requirePillowExecutionControlCenter,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

describe("P6-01 Execution Control Center (PILLOW-ECC-001)", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("ECC Engine initializes with startPillow", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowExecutionControlCenter();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-ECC-001");
    assert.equal(state.status, "ready");
    assert.equal(state.surfacesAttached, true);
  });

  test("Execution pipeline and coordination documented", () => {
    assert.ok(EXECUTION_PIPELINE_REGISTRY.length >= 12);
    assert.ok(EXECUTION_DEPENDENCY_REGISTRY.length >= 8);
    assert.ok(EXECUTION_RESOURCE_REGISTRY.length >= 7);
    assert.ok(ECC_EXECUTION_STATES.length >= 11);
    assert.ok(ECC_RESPONSIBILITIES.length >= 9);
    assert.ok(ECC_PRINCIPLES.length >= 8);
    assert.ok(getCriticalPath().length >= 4);
  });

  test("Builder gate evaluates ECC readiness", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowExecutionControlCenter();
    const gate = engine.evaluateBuilderGateSync({ missionId: "P6-01", roadmapItem: "P6-01" });
    assert.ok(gate.readinessScore >= 75);
    assert.equal(gate.allowed, true);
  });

  test("Grand King acceptance — centralized coordination without role duplication", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowExecutionControlCenter();
    const clarity = engine.verifyGrandKingClarity();
    assert.equal(clarity.complete, true);
    assert.equal(clarity.ownershipPreserved, true);
    assert.match(clarity.assessment.grandKingSummary, /ECC:/);
    assert.match(clarity.assessment.grandKingSummary, /coordinates/);
  });

  test("ECC coordinates execution", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowExecutionControlCenter();
    const result = engine.coordinateExecution({ missionId: "P6-01" });
    assert.equal(result.dependenciesResolved, true);
    assert.ok(result.criticalPath.length >= 4);
  });

  test("Generated mission includes ECC preamble", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const doc = (await import("../../session.js")).generateNextPillowMission();
    if (doc) {
      assert.match(doc.formatted, /EXECUTION CONTROL CENTER/);
      assert.match(doc.formatted, /NOT another Builder/i);
    }
  });

  test("ECC analyzes execution coordination", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowExecutionControlCenter();
    engine.runAssessment();
    const analysis = engine.analyzeExecutionCoordination();
    assert.ok(analysis.recommendations.length > 0);
    assert.ok(analysis.dependencyStatus.length > 0);
  });
});
