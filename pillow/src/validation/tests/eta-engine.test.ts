import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import {
  ETA_CALCULATION_PIPELINE,
  ETA_CONFIDENCE_CLASSIFICATIONS,
  ETA_PIPELINE_REGISTRY,
  ETA_PRINCIPLES,
  ETA_UPDATE_TRIGGERS,
  classifyEtaConfidence,
} from "../../eta-engine/index.js";
import {
  startPillow,
  requirePillowEtaEngine,
  requirePillowBuilderMonitor,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

describe("P6-05 ETA Engine (PILLOW-ETA-001)", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("ETA Engine initializes with startPillow", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowEtaEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-ETA-001");
    assert.equal(state.doctrinePath, "docs/governance/EMPIREAI_ETA_ENGINE.md");
    assert.equal(state.surfacesAttached, true);
  });

  test("ETA pipeline and confidence model documented", () => {
    assert.ok(ETA_PIPELINE_REGISTRY.length >= 8);
    assert.ok(ETA_CALCULATION_PIPELINE.length >= 8);
    assert.ok(ETA_CONFIDENCE_CLASSIFICATIONS.length >= 5);
    assert.ok(ETA_UPDATE_TRIGGERS.length >= 9);
    assert.ok(ETA_PRINCIPLES.length >= 8);
    assert.equal(
      classifyEtaConfidence({
        confidencePercent: 92,
        evidenceCount: 6,
        hasActiveMission: true,
        hasRecovery: false,
        hasBlockingDeps: false,
      }),
      "very_high",
    );
  });

  test("Builder gate evaluates readiness", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowEtaEngine();
    const gate = engine.evaluateBuilderGateSync({ missionId: "P6-05", roadmapItem: "P6-05" });
    assert.ok(gate.readinessScore >= 75);
    assert.equal(gate.allowed, true);
  });

  test("Grand King acceptance — continuous ETA observation", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowEtaEngine();
    const clarity = engine.verifyGrandKingClarity();
    assert.equal(clarity.autoUpdate, true);
    assert.equal(clarity.complete, true);
    assert.ok(clarity.assessment.grandKingSummary.length > 0);
  });

  test("Cockpit snapshot exposes ETA fields", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const builder = requirePillowBuilderMonitor();
    const engine = requirePillowEtaEngine();
    builder.publishTelemetry({
      missionId: "P6-05",
      missionTitle: "ETA Engine test",
      missionState: "implementation",
      currentStep: "Testing ETA refresh",
      overallProgress: 60,
      eventKind: "progress_update",
    });
    const cockpit = engine.getCockpitSnapshot();
    assert.ok(cockpit.currentMission);
    assert.ok(cockpit.estimatedRemainingTimeMs >= 0);
    assert.ok(cockpit.predictedCompletionAt);
    assert.ok(cockpit.confidencePercent >= 0);
    assert.ok(cockpit.lastEtaUpdate);
  });

  test("ECC sync consumes ETA predictions", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const builder = requirePillowBuilderMonitor();
    const engine = requirePillowEtaEngine();
    builder.publishTelemetry({
      missionId: "P6-05",
      missionTitle: "ETA Engine ECC sync",
      missionState: "implementation",
      currentStep: "ECC integration",
      overallProgress: 45,
      eventKind: "progress_update",
    });
    engine.updateEta({ missionId: "P6-05", roadmapItem: "P6-05", trigger: "progress_change" });
    const sync = engine.validateForEccSync({ missionId: "P6-05", roadmapItem: "P6-05" });
    assert.equal(sync.valid, true);
    assert.ok(sync.estimate);
    assert.ok(sync.estimate.estimatedRemainingTimeMs >= 0);
  });
});
