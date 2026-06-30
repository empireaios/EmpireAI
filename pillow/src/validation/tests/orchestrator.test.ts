import assert from "node:assert/strict";
import path from "node:path";
import { test, describe, before, after } from "node:test";
import { RepositoryReader } from "../../bootstrap/repository-reader.js";
import { coordinateFailure } from "../../orchestrator/failure-coordinator.js";
import { discoverSubsystems } from "../../orchestrator/subsystem-registry.js";
import { buildWorkerRegistry } from "../../orchestrator/worker-registry.js";
import { listWorkflows } from "../../orchestrator/workflows.js";
import {
  startPillow,
  requirePillowOrchestrator,
  resetPillowSession,
} from "../../session.js";

const REPO_ROOT = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
);

describe("PILLOW-013 EmpireAI Orchestrator", () => {
  before(() => resetPillowSession());
  after(() => resetPillowSession());

  test("Orchestrator initializes with architecture contract present", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    const state = session.orchestrator.getState();
    assert.equal(state.engineVersion, "PILLOW-013");
    assert.equal(state.contractPath, "PILLOW_ARCHITECTURE_CONTRACT.md");
    assert.ok(state.subsystemCount >= 11);
    assert.ok(state.workerCount >= 1);
    assert.ok(state.workflowCount >= 8);
  });

  test("Subsystem registry discovers all Pillow modules", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    const subs = session.orchestrator.getSubsystems();
    const ids = subs.map((s) => s.id);
    assert.ok(ids.includes("bootstrap"));
    assert.ok(ids.includes("mission_planner"));
    assert.ok(ids.includes("due_diligence"));
    assert.ok(ids.includes("autonomous_improvement"));
    assert.ok(subs.filter((s) => s.missionId).every((s) => s.health !== "unavailable"));
  });

  test("Worker registry includes Cursor and future workers", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    const workers = session.orchestrator.getWorkers();
    const cursor = workers.find((w) => w.id === "cursor");
    assert.ok(cursor);
    assert.equal(cursor.replaceable, true);
    assert.ok(workers.some((w) => w.availability === "deferred"));
  });

  test("Workflow catalog includes engineering pipeline", async () => {
    const workflows = listWorkflows();
    const engineering = workflows.find((w) => w.id === "engineering");
    assert.ok(engineering);
    assert.ok(engineering.steps.length >= 9);
    assert.equal(engineering.steps[0]!.subsystemId, "mission_planner");
  });

  test("Engineering pipeline coordination delegates to subsystems", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const coord = requirePillowOrchestrator().coordinateWorkflow({
      workflowId: "engineering",
    });
    assert.equal(coord.workflowId, "engineering");
    assert.ok(coord.steps.length >= 9);
    assert.ok(coord.steps.every((s) => s.delegatedTo));
    assert.ok(coord.recommendation.length > 0);
  });

  test("Scheduling engine produces prioritized queue", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const schedule = requirePillowOrchestrator().schedule();
    assert.ok(schedule.queue.length > 0);
    assert.ok(schedule.scheduledAt);
    for (let i = 1; i < schedule.queue.length; i++) {
      assert.ok(schedule.queue[i - 1]!.priority >= schedule.queue[i]!.priority);
    }
  });

  test("Runtime awareness aggregates subsystem state", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    const awareness = session.orchestrator.getRuntimeAwareness();
    assert.ok(awareness.repositoryHealthScore >= 0);
    assert.ok(awareness.subsystemHealth.bootstrap === "ready");
    assert.equal(awareness.grandKingPriorityActive, false);
  });

  test("Failure coordination preserves repository integrity", () => {
    const result = coordinateFailure({
      source: "cursor_supervisor",
      message: "Stall detected during validation",
      missionId: "PILLOW-013",
      recoverable: true,
    });
    assert.ok(result.actions.includes("recovery_required"));
    assert.equal(result.preserveRepositoryIntegrity, true);
    assert.ok(result.recommendation.length > 0);
  });

  test("Grand King command pauses autonomous workflows", async () => {
    await startPillow({ repositoryRoot: REPO_ROOT });
    const orchestrator = requirePillowOrchestrator();
    const { paused } = orchestrator.issueGrandKingCommand("priority directive");
    assert.ok(paused.includes("continuous_due_diligence"));
    assert.equal(orchestrator.getState().grandKingPriorityActive, true);
    assert.equal(sessionDueDiligenceInterrupted(orchestrator), true);
    orchestrator.resumeAfterGrandKingCommand();
    assert.equal(orchestrator.getState().grandKingPriorityActive, false);
  });

  test("Journey unchanged after orchestration cycle", async () => {
    const reader = new RepositoryReader(REPO_ROOT);
    const before = await reader.readText("JOURNEY.md");
    await startPillow({ repositoryRoot: REPO_ROOT });
    requirePillowOrchestrator().coordinate();
    const after = await reader.readText("JOURNEY.md");
    assert.equal(before, after);
  });

  test("startPillow exposes EmpireAIOrchestrator", async () => {
    resetPillowSession();
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    assert.ok(session.orchestrator);
    assert.equal(requirePillowOrchestrator(), session.orchestrator);
  });

  test("Dynamic subsystem discovery via bundle", async () => {
    const session = await startPillow({ repositoryRoot: REPO_ROOT });
    const subs = discoverSubsystems({
      bootstrap: session.bootstrap,
      intelligence: session.intelligence,
      contextBuilder: session.contextBuilder,
      memory: session.memory,
      planner: session.planner,
      supervisor: session.supervisor,
      recovery: session.recovery,
      auditReviewer: session.auditReviewer,
      synchronizer: session.synchronizer,
      dueDiligence: session.dueDiligence,
      improvement: session.improvement,
    });
    assert.equal(subs.length, session.orchestrator.getSubsystems().length);
    assert.ok(buildWorkerRegistry(session.supervisor).length >= 1);
  });
});

function sessionDueDiligenceInterrupted(
  orchestrator: ReturnType<typeof requirePillowOrchestrator>,
): boolean {
  const subs = orchestrator.getSubsystems();
  const dd = subs.find((s) => s.id === "due_diligence");
  return dd?.health === "degraded";
}
