import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import {
  AUTONOMOUS_RECOVERY_PRINCIPLES,
  RECOVERY_DETECTION_SIGNALS,
  RECOVERY_ORCHESTRATION_REGISTRY,
  RECOVERY_STRATEGY_REGISTRY,
  detectFailureSignals,
  selectRecoveryStrategy,
} from "../../autonomous-recovery-engine/index.js";
import {
  startPillow,
  requirePillowAutonomousRecoveryEngine,
  requirePillowBuilderMonitor,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

describe("P6-06 Autonomous Recovery Engine (PILLOW-ARE-001)", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Autonomous Recovery Engine initializes with startPillow", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowAutonomousRecoveryEngine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-ARE-001");
    assert.equal(state.doctrinePath, "docs/governance/EMPIREAI_AUTONOMOUS_RECOVERY_ENGINE.md");
    assert.equal(state.surfacesAttached, true);
  });

  test("Recovery pipeline and strategies documented", () => {
    assert.ok(RECOVERY_ORCHESTRATION_REGISTRY.length >= 10);
    assert.ok(RECOVERY_STRATEGY_REGISTRY.length >= 11);
    assert.ok(RECOVERY_DETECTION_SIGNALS.length >= 12);
    assert.ok(AUTONOMOUS_RECOVERY_PRINCIPLES.length >= 8);
    const failure = detectFailureSignals({
      telemetry: {
        capturedAt: new Date().toISOString(),
        currentMission: "Test",
        currentRoadmapItem: "P6-06",
        currentPhase: null,
        currentStep: "Testing",
        currentActivity: "Recovery test",
        missionState: "implementation",
        overallProgress: 30,
        stageProgress: 30,
        estimatedRemainingTimeMs: 60000,
        elapsedTimeMs: 30000,
        currentFile: null,
        filesModified: [],
        repositoryActivity: null,
        currentBranch: null,
        currentDependency: null,
        currentQueue: null,
        currentWorker: "builder",
        validationState: "failed",
        productionState: "standby",
        recoveryState: "none",
        currentErrors: ["Validation failed"],
        currentWarnings: [],
        heartbeatAt: new Date(Date.now() - 200_000).toISOString(),
        executionHealth: "degraded",
      },
      activeMission: null,
    });
    assert.ok(failure.length >= 1);
    const validationFailure = failure.find((f) => f.signal === "validation_failure");
    assert.ok(validationFailure);
    assert.equal(selectRecoveryStrategy(validationFailure!), "retry");
  });

  test("Builder gate evaluates readiness", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowAutonomousRecoveryEngine();
    const gate = engine.evaluateBuilderGateSync({ missionId: "P6-06", roadmapItem: "P6-06" });
    assert.ok(gate.readinessScore >= 75);
    assert.equal(gate.allowed, true);
  });

  test("Grand King acceptance — autonomous recovery capability", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowAutonomousRecoveryEngine();
    const clarity = engine.verifyGrandKingClarity();
    assert.equal(clarity.autoRecovery, true);
    assert.equal(clarity.complete, true);
  });

  test("Cockpit snapshot exposes recovery fields", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const builder = requirePillowBuilderMonitor();
    const engine = requirePillowAutonomousRecoveryEngine();
    builder.publishTelemetry({
      missionId: "P6-06",
      missionTitle: "Autonomous Recovery test",
      missionState: "implementation",
      currentStep: "Testing recovery detection",
      overallProgress: 40,
      validationState: "failed",
      errors: ["Simulated validation failure"],
      eventKind: "validation_started",
    });
    engine.scanForFailures({ missionId: "P6-06", roadmapItem: "P6-06" });
    const cockpit = engine.getCockpitSnapshot();
    assert.ok(cockpit.currentIncident);
    assert.ok(cockpit.recoveryStrategy);
    assert.ok(cockpit.recoveryConfidence >= 0);
  });

  test("ECC sync consumes recovery status", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowAutonomousRecoveryEngine();
    const sync = engine.validateForEccSync({ missionId: "P6-06", roadmapItem: "P6-06" });
    assert.equal(sync.valid, true);
    assert.ok(sync.readinessScore >= 75);
  });
});
