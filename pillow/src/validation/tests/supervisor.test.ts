import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { isBootstrapReady } from "../../bootstrap/types.js";
import { RepositoryReader } from "../../bootstrap/repository-reader.js";
import { RepositoryMemoryEngine } from "../../memory/engine.js";
import { MissionPlannerEngine } from "../../planner/engine.js";
import { runRepositoryIntelligence } from "../../intelligence/engine.js";
import { matchDoctrineStall } from "../../supervisor/doctrine.js";
import {
  evaluateMissionHealth,
  hasQualifyingStall,
} from "../../supervisor/monitor.js";
import { CursorSupervisorEngine } from "../../supervisor/engine.js";
import { createInitialHealth } from "../../supervisor/monitor.js";
import type { SupervisedMission } from "../../supervisor/types.js";
import {
  startPillow,
  requirePillowSupervisor,
  generateNextPillowMission,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
);

function sampleMission(now: number): SupervisedMission {
  const at = new Date(now).toISOString();
  return {
    id: "TEST-MISSION-001",
    title: "Test Mission",
    state: "validation",
    launchedAt: at,
    updatedAt: at,
    stateEnteredAt: new Date(now - 400_000).toISOString(),
    durationMs: 400_000,
    heartbeats: [
      {
        at: new Date(now - 350_000).toISOString(),
        kind: "validation",
        detail: "waiting for detached process to complete",
      },
    ],
    progress: [],
    health: createInitialHealth(at),
    dependencies: [],
    outcome: "pending",
    executiveAuditProduced: false,
    validationCompleted: false,
    recoveryAttempts: 0,
    missionAuthority: "test",
    objective: "test objective",
  };
}

describe("PILLOW-007 Cursor Supervisor", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Supervisor initializes after Mission Planner", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    const state = session.supervisor.getState();

    assert.equal(state.supervisorVersion, "PILLOW-007");
    assert.equal(state.status, "ready");
    assert.equal(state.doctrinePath, "EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md");
  });

  test("Mission launched and lifecycle tracked", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const supervisor = requirePillowSupervisor();
    const doc = generateNextPillowMission();
    assert.ok(doc);

    const { mission, launched } = supervisor.launchMission({ document: doc! });
    assert.equal(launched, true);
    assert.equal(mission.state, "preparing");

    const impl = supervisor.transitionMission(mission.id, "implementation");
    assert.equal(impl?.state, "implementation");

    const registry = supervisor.getRegistry();
    assert.ok(registry.activeMission);
    assert.equal(registry.activeMission?.id, mission.id);
  });

  test("Heartbeat and progress monitoring operational", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const supervisor = requirePillowSupervisor();
    const doc = generateNextPillowMission();
    assert.ok(doc);
    const { mission } = supervisor.launchMission({ document: doc! });

    supervisor.recordMissionHeartbeat(
      mission.id,
      "repository_inspection",
      "Inspecting JOURNEY.md",
    );
    supervisor.recordMissionProgress(mission.id, {
      kind: "repository_analysis",
      detail: "Journey parsed",
    });

    const updated = supervisor.getMission(mission.id);
    assert.ok(updated!.heartbeats.length >= 1);
    assert.ok(updated!.progress.length >= 1);
  });

  test("Doctrine stall patterns detected", () => {
    assert.equal(
      matchDoctrineStall("waiting for detached process"),
      "waiting_detached_process",
    );
    assert.equal(matchDoctrineStall("reconnecting to agent"), "reconnecting");
    assert.equal(matchDoctrineStall("normal progress"), null);
  });

  test("Stall detection triggers on doctrine signals", () => {
    const now = Date.now();
    const mission = sampleMission(now);
    const health = evaluateMissionHealth(mission, {
      heartbeatStaleMs: 60_000,
      progressStaleMs: 60_000,
      stateStaleMs: 120_000,
      deadAgentMs: 300_000,
      slowValidationMs: 600_000,
    }, now);

    assert.ok(health.stallSignals.length > 0);
    assert.ok(hasQualifyingStall(health));
  });

  test("Dead agent distinguished from slow validation", () => {
    const now = Date.now();
    const slowMission = sampleMission(now);
    slowMission.state = "validation";
    slowMission.stateEnteredAt = new Date(now - 950_000).toISOString();
    slowMission.heartbeats.push({
      at: new Date(now - 30_000).toISOString(),
      kind: "validation",
      detail: "npm run typecheck in progress",
    });

    const slowHealth = evaluateMissionHealth(slowMission, {
      heartbeatStaleMs: 120_000,
      progressStaleMs: 180_000,
      stateStaleMs: 900_000,
      deadAgentMs: 600_000,
      slowValidationMs: 900_000,
    }, now);

    assert.equal(slowHealth.isSlowMission, true);
    assert.equal(slowHealth.isDeadAgent, false);
  });

  test("Recovery Manager invoked on qualifying stall", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const intelligence = await runRepositoryIntelligence({ bootstrap });
    const memory = new RepositoryMemoryEngine(bootstrap, intelligence);
    memory.initialize();
    const planner = new MissionPlannerEngine(bootstrap, intelligence, memory);
    planner.initialize();

    let now = Date.now();
    const supervisor = new CursorSupervisorEngine(
      bootstrap,
      memory,
      planner,
      {
        now: () => now,
        heartbeatConfig: {
          heartbeatStaleMs: 1_000,
          progressStaleMs: 1_000,
          stateStaleMs: 1_000,
          deadAgentMs: 2_000,
          slowValidationMs: 900_000,
        },
      },
    );
    await supervisor.initialize();

    const doc = planner.generateNextMission();
    assert.ok(doc);
    const { mission } = supervisor.launchMission({ document: doc! });
    supervisor.transitionMission(mission.id, "validation");
    supervisor.recordMissionHeartbeat(
      mission.id,
      "validation",
      "waiting for detached process",
    );

    now += 5_000;
    const tick = await supervisor.tick();
    assert.ok(tick.stallsDetected >= 1 || tick.recoveriesInvoked >= 1);

    const recovery = supervisor.getLastRecovery(mission.id);
    assert.ok(recovery);
    assert.equal(recovery!.missionState, "recovery");
    assert.ok(recovery!.assessment.steps.length >= 6);
  });

  test("Executive Audit supervision blocks incomplete completion", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const supervisor = requirePillowSupervisor();
    const doc = generateNextPillowMission();
    assert.ok(doc);
    const { mission } = supervisor.launchMission({ document: doc! });

    const blocked = await supervisor.completeMission(mission.id);
    assert.equal(blocked, null);

    supervisor.recordMissionProgress(mission.id, {
      kind: "validation_executed",
      detail: "59/59 pass",
    });
    supervisor.recordMissionProgress(mission.id, {
      kind: "executive_audit_generated",
      detail: "Audit produced",
    });

    const auditText = `# Executive Audit — ${mission.id}

## Summary
Mission complete.

## Owner Justification
Owner: Pillow Architecture — per contract.

## Validation results
typecheck pass · build pass

## Acceptance criteria
All acceptance criteria met and verified.

## Repository continuity
Repository unchanged. Read-only verified.

## Executive recommendation
ACCEPT mission completion.

## Future Enhancements
Non-blocking BL-C items registered.

Stop rule observed. Do not begin next mission.`;

    const completed = await supervisor.completeMission(mission.id, auditText);
    if (completed) {
      assert.equal(completed.state, "completed");
      assert.equal(completed.outcome, "success");
    } else {
      const review = supervisor.getLastReviewRecord(mission.id);
      assert.ok(review);
    }
  });

  test("Repository awareness from Memory and Planner", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const awareness = requirePillowSupervisor().getRepositoryAwareness();
    assert.ok(awareness.repositoryHealthScore >= 0);
    assert.ok(typeof awareness.journeyPosition === "string" || awareness.journeyPosition === null);
  });

  test("Read-only — repository unchanged after supervision", async () => {
    const reader = new RepositoryReader(REPO_ROOT);
    const before = await reader.readText("JOURNEY.md");

    await startPillow({ repositoryRoot: REPO_ROOT });
    const supervisor = requirePillowSupervisor();
    const doc = generateNextPillowMission();
    if (doc) {
      supervisor.launchMission({ document: doc });
      await supervisor.tick();
    }

    const after = await reader.readText("JOURNEY.md");
    assert.equal(before, after);
  });

  test("startPillow exposes CursorSupervisorEngine", async () => {
    resetPillowSession();
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    assert.ok(session.supervisor);
    assert.equal(requirePillowSupervisor(), session.supervisor);
  });
});
