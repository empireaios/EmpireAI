import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { isBootstrapReady } from "../../bootstrap/types.js";
import { runRepositoryIntelligence } from "../../intelligence/engine.js";
import { RepositoryMemoryEngine } from "../../memory/engine.js";
import { MissionPlannerEngine } from "../../planner/engine.js";
import { RecoveryManagerEngine } from "../../recovery/engine.js";
import { createRecoveryDoctrineEngine, RECOVERY_PIPELINE_STEPS } from "../../recovery-doctrine/index.js";
import { classifyFailure } from "../../recovery-doctrine/failure-classifier.js";
import { createInitialHealth } from "../../supervisor/monitor.js";
import { CursorSupervisorEngine } from "../../supervisor/engine.js";
import type { SupervisedMission } from "../../supervisor/types.js";
import {
  startPillow,
  requirePillowRecoveryDoctrine,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleMission(overrides: Partial<SupervisedMission> = {}): SupervisedMission {
  const at = new Date().toISOString();
  return {
    id: "P4-05-RECOVERY-DEMO",
    title: "P4-05 Recovery Demo Mission",
    state: "validation",
    launchedAt: at,
    updatedAt: at,
    stateEnteredAt: at,
    durationMs: 0,
    heartbeats: [],
    progress: [{ at, kind: "file_modified", detail: "pillow/src/recovery-doctrine/engine.ts" }],
    health: createInitialHealth(at),
    dependencies: [],
    outcome: "pending",
    executiveAuditProduced: false,
    validationCompleted: false,
    recoveryAttempts: 0,
    missionAuthority: "test",
    objective: "Demonstrate P4-05 recovery pipeline",
    ...overrides,
  };
}

describe("P4-05 Recovery Doctrine (PILLOW-RD-001)", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Recovery Doctrine Engine initializes with startPillow", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowRecoveryDoctrine();
    const state = engine.getState();
    assert.equal(state.engineVersion, "PILLOW-RD-001");
    assert.equal(state.status, "ready");
  });

  test("Failure classification covers constitutional categories", () => {
    assert.equal(
      classifyFailure({ trigger: "detached_background_process" }),
      "transient",
    );
    assert.equal(
      classifyFailure({ trigger: "repository_interruption", repositoryIntegrityOk: false }),
      "repository",
    );
    assert.equal(
      classifyFailure({ trigger: "stalled_mission", recoveryAttempts: 3 }),
      "human_approval_required",
    );
  });

  test("Builder gate evaluates recovery readiness", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowRecoveryDoctrine();
    const gate = engine.evaluateBuilderGateSync({ missionId: "P4-05" });
    assert.ok(gate.readinessScore >= 75);
    assert.equal(gate.allowed, true);
  });

  test("Grand King acceptance — failed mission detects, classifies, recovers, resumes", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const intelligence = await runRepositoryIntelligence({ bootstrap });
    const memory = new RepositoryMemoryEngine(bootstrap, intelligence);
    memory.initialize();
    const planner = new MissionPlannerEngine(bootstrap, intelligence, memory);
    planner.initialize();
    const recoveryManager = new RecoveryManagerEngine(bootstrap, { dryRunValidation: true });
    await recoveryManager.initialize();
    const doctrine = createRecoveryDoctrineEngine(bootstrap, recoveryManager, planner);
    await doctrine.initialize();

    const mission = sampleMission();
    const pipeline = await doctrine.handleMissionFailure({
      mission,
      trigger: "detached_background_process",
      stallSignals: [
        {
          kind: "waiting_detached_process",
          detectedAt: new Date().toISOString(),
          message: "Waiting for detached background validation",
          doctrineRef: "EMPIREAI_CURSOR_RECOVERY_DOCTRINE.md §3",
        },
      ],
    });

    assert.equal(pipeline.pipelineVersion, "P4-05");
    assert.equal(pipeline.steps.length, RECOVERY_PIPELINE_STEPS.length);
    assert.equal(pipeline.classification, "transient");
    assert.ok(pipeline.recoveryConfidence >= 0.65);
    assert.equal(pipeline.escalated, false);
    assert.equal(pipeline.recovered, true);
    assert.ok(pipeline.execution);
    assert.ok(pipeline.report.summary.includes("recovered"));
    assert.ok(pipeline.resumeState);
  });

  test("Supervisor integrates Recovery Doctrine on stall", async () => {
    const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT });
    if (!isBootstrapReady(bootstrap)) assert.fail();
    const intelligence = await runRepositoryIntelligence({ bootstrap });
    const memory = new RepositoryMemoryEngine(bootstrap, intelligence);
    memory.initialize();
    const planner = new MissionPlannerEngine(bootstrap, intelligence, memory);
    planner.initialize();
    const recoveryManager = new RecoveryManagerEngine(bootstrap, { dryRunValidation: true });
    await recoveryManager.initialize();
    const doctrine = createRecoveryDoctrineEngine(bootstrap, recoveryManager, planner);
    await doctrine.initialize();

    let now = Date.now();
    const supervisor = new CursorSupervisorEngine(bootstrap, memory, planner, {
      now: () => now,
      recoveryManager,
      recoveryDoctrine: doctrine,
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
      "waiting for detached background process",
    );
    now += 3000;
    await supervisor.tick();

    const record = supervisor.getLastRecoveryRecord(mission.id);
    assert.ok(record);
    assert.ok(doctrine.getState().totalPipelineRuns >= 1);
  });

  test("Pillow reviews recovery effectiveness", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const engine = requirePillowRecoveryDoctrine();
    const review = engine.reviewEffectiveness();
    assert.ok(review.effectivenessScore >= 0);
    assert.ok(Array.isArray(review.recommendations));
    assert.ok(review.constitutionalImplications.length > 0);
  });
});
