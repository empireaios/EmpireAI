import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import {
  AUTOMATION_DOMAINS,
  AUTOMATION_PIPELINE_REGISTRY,
  AUTOMATION_PRINCIPLES,
  SUBSYSTEM_AUTOMATION_LEVELS,
  buildPhaseP6CompletionReview,
  evaluateAutomationSafety,
} from "../../zero-human-automation/index.js";
import {
  startPillow,
  requirePillowZeroHumanAutomationEngine,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

describe("P6-07 Zero-Human Automation (PILLOW-ZHA-001)", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Zero-Human Automation initializes with startPillow", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowZeroHumanAutomationEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-ZHA-001");
    assert.equal(state.doctrinePath, "docs/governance/EMPIREAI_ZERO_HUMAN_AUTOMATION_ARCHITECTURE.md");
    assert.equal(state.surfacesAttached, true);
  });

  test("Automation pipeline and levels documented", () => {
    assert.ok(AUTOMATION_PIPELINE_REGISTRY.length >= 14);
    assert.ok(SUBSYSTEM_AUTOMATION_LEVELS.length >= 10);
    assert.ok(AUTOMATION_DOMAINS.length >= 15);
    assert.ok(AUTOMATION_PRINCIPLES.length >= 9);
    const safety = evaluateAutomationSafety({ visionConflict: true });
    assert.equal(safety.safe, false);
    assert.ok(safety.stops.includes("vision_conflict"));
  });

  test("Builder gate evaluates readiness", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowZeroHumanAutomationEngine();
    const gate = engine.evaluateBuilderGateSync({ missionId: "P6-07", roadmapItem: "P6-07" });
    assert.ok(gate.readinessScore >= 75);
    assert.equal(gate.allowed, true);
  });

  test("Grand King acceptance — observable constitutional automation", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowZeroHumanAutomationEngine();
    const clarity = engine.verifyGrandKingClarity();
    assert.equal(clarity.observable, true);
    assert.equal(clarity.grandKingAuthority, true);
    assert.equal(clarity.complete, true);
    assert.equal(clarity.phaseP6Review.complete, true);
  });

  test("Phase P6 completion review covers all items", () => {
    const review = buildPhaseP6CompletionReview();
    assert.equal(review.items.length, 7);
    assert.ok(review.items.every((i) => i.status === "complete"));
    assert.equal(review.complete, true);
  });

  test("Cockpit snapshot exposes automation fields", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowZeroHumanAutomationEngine();
    const cockpit = engine.getCockpitSnapshot();
    assert.ok(cockpit.automationLevel);
    assert.ok(cockpit.automationHealth);
    assert.ok(cockpit.subsystemLevels.length >= 10);
    assert.equal(cockpit.phaseP6Complete, true);
  });

  test("ECC sync consumes automation status", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowZeroHumanAutomationEngine();
    const sync = engine.validateForEccSync({ missionId: "P6-07", roadmapItem: "P6-07" });
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 75);
  });
});
