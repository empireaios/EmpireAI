import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import {
  SUPERVISION_PIPELINE_REGISTRY,
  SUPERVISION_EVENT_REGISTRY,
  SUPERVISOR_PRINCIPLES,
  SUPERVISOR_RESPONSIBILITIES,
  MISSION_HEALTH_CLASSIFICATIONS,
  classifyMissionHealthStatus,
  createInitialHealth,
} from "../../supervisor/index.js";
import {
  startPillow,
  requirePillowSupervisor,
  generateNextPillowMission,
  resetPillowSession,
} from "../../session.js";
import type { SupervisedMission } from "../../supervisor/types.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

describe("P6-03 Supervisor System (PILLOW-SV-001)", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Supervisor System initializes with startPillow", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowSupervisor();
    const state = engine.getState();
    assert.equal(state.supervisorVersion, "PILLOW-SV-001");
    assert.equal(state.systemDoctrinePath, "docs/governance/EMPIREAI_SUPERVISOR_SYSTEM.md");
  });

  test("Supervision pipeline and events documented", () => {
    assert.ok(SUPERVISION_PIPELINE_REGISTRY.length >= 10);
    assert.ok(SUPERVISION_EVENT_REGISTRY.length >= 10);
    assert.ok(SUPERVISOR_RESPONSIBILITIES.length >= 10);
    assert.ok(SUPERVISOR_PRINCIPLES.length >= 10);
    assert.ok(MISSION_HEALTH_CLASSIFICATIONS.length >= 7);
  });

  test("Builder gate evaluates Supervisor readiness", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowSupervisor();
    const gate = engine.evaluateBuilderGateSync({ missionId: "P6-03", roadmapItem: "P6-03" });
    assert.ok(gate.readinessScore >= 75);
    assert.equal(gate.allowed, true);
  });

  test("Grand King acceptance — continuous observation without log queries", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowSupervisor();
    const clarity = engine.verifyGrandKingClarity();
    assert.equal(clarity.complete, true);
    assert.equal(clarity.continuousObservation, true);
    assert.match(clarity.assessment.grandKingSummary, /Supervisor:/);
  });

  test("Mission health classification covers constitutional states", () => {
    const at = new Date().toISOString();
    const healthy: SupervisedMission = {
      id: "H1",
      title: "Healthy",
      state: "implementation",
      launchedAt: at,
      updatedAt: at,
      stateEnteredAt: at,
      durationMs: 1000,
      heartbeats: [],
      progress: [{ at, kind: "file_modified", detail: "Updated file" }],
      health: createInitialHealth(at),
      dependencies: [],
      outcome: "pending",
      executiveAuditProduced: false,
      validationCompleted: false,
      recoveryAttempts: 0,
      missionAuthority: "test",
      objective: "test",
    };
    assert.equal(classifyMissionHealthStatus(healthy), "healthy");

    const completed = { ...healthy, state: "completed" as const, outcome: "success" as const };
    assert.equal(classifyMissionHealthStatus(completed), "completed");
  });

  test("Supervision events recorded on mission launch", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowSupervisor();
    const doc = generateNextPillowMission();
    assert.ok(doc);
    const result = engine.launchMission({ document: doc });
    assert.equal(result.launched, true);
    const events = engine.getRecentSupervisionEvents(5);
    assert.ok(events.some((e) => e.kind === "mission_started"));
  });

  test("Cockpit snapshot exposes step, health, progress, risks", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowSupervisor();
    engine.runAssessment({ missionId: "P6-03" });
    const cockpit = engine.getCockpitSnapshot();
    assert.ok(cockpit.currentMission);
    assert.ok(cockpit.missionHealth);
    assert.ok(cockpit.grandKingSummary.includes("Supervisor:"));
    assert.ok(Array.isArray(cockpit.currentRisks));
  });

  test("ECC sync receives Supervisor observations", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowSupervisor();
    const sync = engine.validateForEccSync({ missionId: "P6-03" });
    assert.equal(sync.valid, true);
    assert.ok(sync.notes.length > 0);
    assert.ok(Array.isArray(sync.events));
  });

  test("Pillow analyzes supervision efficiency", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowSupervisor();
    engine.runAssessment();
    const analysis = engine.analyzeSupervisionEfficiency();
    assert.ok(analysis.recommendations.length > 0);
  });
});
