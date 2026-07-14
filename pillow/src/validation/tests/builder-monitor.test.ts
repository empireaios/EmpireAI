import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import {
  BUILDER_EVENT_REGISTRY,
  BUILDER_TELEMETRY_REGISTRY,
  BUILDER_MONITOR_PRINCIPLES,
  INTERROGATION_FREQUENCIES,
} from "../../builder-monitor/index.js";
import {
  startPillow,
  requirePillowBuilderMonitor,
  requirePillowSupervisor,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

describe("P6-04 Builder Monitor (PILLOW-BM-001)", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Builder Monitor initializes with startPillow", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowBuilderMonitor();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-BM-001");
    assert.equal(state.doctrinePath, "docs/governance/EMPIREAI_BUILDER_MONITOR.md");
    assert.equal(state.surfacesAttached, true);
  });

  test("Builder telemetry and events documented", () => {
    assert.ok(BUILDER_TELEMETRY_REGISTRY.length >= 22);
    assert.ok(BUILDER_EVENT_REGISTRY.length >= 13);
    assert.ok(BUILDER_MONITOR_PRINCIPLES.length >= 8);
    assert.ok(Object.keys(INTERROGATION_FREQUENCIES).length >= 8);
  });

  test("Builder gate evaluates readiness", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowBuilderMonitor();
    const gate = engine.evaluateBuilderGateSync({ missionId: "P6-04", roadmapItem: "P6-04" });
    assert.ok(gate.readinessScore >= 75);
    assert.equal(gate.allowed, true);
  });

  test("Supervisor interrogates Builder without manual intervention", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const supervisor = requirePillowSupervisor();
    const report = supervisor.interrogateBuilder({ missionId: "P6-04", roadmapItem: "P6-04" });
    assert.ok(report.results.length >= 12);
    assert.match(report.grandKingSummary, /Builder Monitor:/);
  });

  test("Grand King acceptance — near real-time observation", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowBuilderMonitor();
    const clarity = engine.verifyGrandKingClarity();
    assert.equal(clarity.nearRealTimeObservation, true);
    assert.equal(clarity.complete, true);
  });

  test("Cockpit snapshot exposes telemetry fields", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowBuilderMonitor();
    engine.publishTelemetry({
      missionId: "P6-04",
      missionTitle: "Builder Monitor test",
      missionState: "implementation",
      currentStep: "Testing telemetry",
      overallProgress: 50,
      eventKind: "heartbeat",
    });
    const cockpit = engine.getCockpitSnapshot();
    assert.ok(cockpit.currentMission);
    assert.ok(cockpit.heartbeat);
    assert.ok(cockpit.executionHealth);
  });

  test("ECC sync consumes Builder Monitor data", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowBuilderMonitor();
    const sync = engine.validateForEccSync({ missionId: "P6-04" });
    assert.equal(sync.valid, true);
    assert.ok(sync.telemetry);
  });
});
