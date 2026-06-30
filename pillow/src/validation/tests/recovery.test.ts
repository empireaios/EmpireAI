import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { isBootstrapReady } from "../../bootstrap/types.js";
import { RepositoryReader } from "../../bootstrap/repository-reader.js";
import { RepositoryMemoryEngine } from "../../memory/engine.js";
import { MissionPlannerEngine } from "../../planner/engine.js";
import { runRepositoryIntelligence } from "../../intelligence/engine.js";
import { RecoveryManagerEngine } from "../../recovery/engine.js";
import { determineRecoveryStrategy } from "../../recovery/strategy.js";
import { diagnoseMissionState } from "../../recovery/diagnosis.js";
import { createInitialHealth } from "../../supervisor/monitor.js";
import type { SupervisedMission } from "../../supervisor/types.js";
import { CursorSupervisorEngine } from "../../supervisor/engine.js";
import {
  startPillow,
  requirePillowRecovery,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
);

function sampleMission(overrides: Partial<SupervisedMission> = {}): SupervisedMission {
  const at = new Date().toISOString();
  return {
    id: "TEST-RECOVERY-001",
    title: "Test Recovery Mission",
    state: "validation",
    launchedAt: at,
    updatedAt: at,
    stateEnteredAt: at,
    durationMs: 0,
    heartbeats: [],
    progress: [{ at, kind: "file_modified", detail: "pillow/src/recovery/engine.ts" }],
    health: createInitialHealth(at),
    dependencies: [],
    outcome: "pending",
    executiveAuditProduced: false,
    validationCompleted: false,
    recoveryAttempts: 0,
    missionAuthority: "test",
    objective: "test recovery",
    ...overrides,
  };
}

describe("PILLOW-008 Recovery Manager", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Recovery Manager initializes with doctrine present", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    const state = session.recovery.getState();
    assert.equal(state.managerVersion, "PILLOW-008");
    assert.equal(state.doctrinePath, "EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md");
  });

  test("Repository inspection preserves file list", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowRecovery();
    const result = await engine.executeRecovery({
      mission: sampleMission(),
      trigger: "stalled_mission",
    });
    assert.ok(result.record.inspection);
    assert.equal(typeof result.record.inspection.repositoryIntegrityOk, "boolean");
    assert.ok(result.record.preservedWork.length >= 0);
  });

  test("Mission diagnosis identifies incomplete criteria", () => {
    const diagnosis = diagnoseMissionState(
      sampleMission({ validationCompleted: false }),
      "interrupted_validation",
    );
    assert.ok(diagnosis.incompleteCriteriaCount > 0);
    assert.equal(diagnosis.validationStatus, "not_run");
  });

  test("Recovery strategy resumes validation without repeating implementation", () => {
    const diagnosis = diagnoseMissionState(
      sampleMission({
        progress: [
          { at: new Date().toISOString(), kind: "file_modified", detail: "done" },
        ],
      }),
      "interrupted_validation",
    );
    const { strategy, resumeTarget } = determineRecoveryStrategy(diagnosis);
    assert.equal(strategy, "resume_validation");
    assert.equal(resumeTarget, "validation");
  });

  test("Mission already complete strategy when validation passed", () => {
    const diagnosis = diagnoseMissionState(
      sampleMission({
        validationCompleted: true,
        executiveAuditProduced: true,
        state: "executive_audit",
      }),
      "interrupted_executive_audit",
    );
    const { strategy } = determineRecoveryStrategy(diagnosis);
    assert.equal(strategy, "mission_already_complete");
  });

  test("Full recovery records outcome", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowRecovery();
    const result = await engine.executeRecovery({
      mission: sampleMission(),
      trigger: "detached_background_process",
    });
    assert.ok(result.record.recordId);
    assert.ok(result.record.outcome);
    assert.ok(result.record.steps.length >= 4);
    assert.equal(result.record.invokedBy, "cursor_supervisor");
  });

  test("Supervisor invokes Recovery Manager on stall", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const intelligence = await runRepositoryIntelligence({ bootstrap });
    const memory = new RepositoryMemoryEngine(bootstrap, intelligence);
    memory.initialize();
    const planner = new MissionPlannerEngine(bootstrap, intelligence, memory);
    planner.initialize();
    const recovery = new RecoveryManagerEngine(bootstrap, { dryRunValidation: true });
    await recovery.initialize();

    let now = Date.now();
    const supervisor = new CursorSupervisorEngine(bootstrap, memory, planner, {
      now: () => now,
      recoveryManager: recovery,
      heartbeatConfig: {
        heartbeatStaleMs: 500,
        progressStaleMs: 500,
        stateStaleMs: 500,
        deadAgentMs: 1000,
        slowValidationMs: 900_000,
      },
    });
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
    now += 3000;
    await supervisor.tick();

    const record = supervisor.getLastRecoveryRecord(mission.id);
    assert.ok(record);
    assert.ok(record!.steps.length >= 4);
  });

  test("Recovery outcomes stored in history", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowRecovery();
    await engine.executeRecovery({
      mission: sampleMission({ id: "HIST-001" }),
      trigger: "dead_agent",
    });
    const history = engine.getHistory("HIST-001");
    assert.equal(history.length, 1);
    assert.equal(history[0]!.missionId, "HIST-001");
  });

  test("Journey unchanged after recovery execution", async () => {
    const reader = new RepositoryReader(REPO_ROOT);
    const before = await reader.readText("JOURNEY.md");
    await startPillow({ repositoryRoot: REPO_ROOT });
    await requirePillowRecovery().executeRecovery({
      mission: sampleMission(),
      trigger: "stalled_mission",
    });
    const after = await reader.readText("JOURNEY.md");
    assert.equal(before, after);
  });

  test("startPillow exposes RecoveryManagerEngine", async () => {
    resetPillowSession();
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    assert.ok(session.recovery);
    assert.equal(requirePillowRecovery(), session.recovery);
  });
});
