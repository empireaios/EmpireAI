import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  INTEGRATION_TARGETS,
  SCHRT_CAPABILITIES,
  SCHRT_METADATA_VERSION,
  SCHRT_REPORT_VERSION,
  SCHRT_RUNTIME_VERSION,
  SCHEDULE_TYPES,
  TRIGGER_TYPES,
  buildSchedulingRuntimeConfiguration,
  createSchedulingRuntime,
  resetSchedulingRuntimeForTesting,
  type SchrtInput,
  type SchedulingRuntimeDependencies,
} from "../../scheduling-runtime/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleInput(overrides: Partial<SchrtInput> = {}): SchrtInput {
  return {
    validated: true,
    ...overrides,
  };
}

async function build(deps?: SchedulingRuntimeDependencies) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createSchedulingRuntime(
    bootstrap,
    deps ? { dependencies: deps } : undefined,
  );
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q10-12 Scheduling Runtime", () => {
  beforeEach(resetSchedulingRuntimeForTesting);

  test("1 locks mandatory boundaries", () => {
    const c = buildSchedulingRuntimeConfiguration(REPO_ROOT, {
      neverFabricateExecutionTimes: false as never,
      neverBypassPillowGovernance: false as never,
      neverBypassGrandKingApproval: false as never,
      neverReplaceQueueRuntime: false as never,
      neverReplaceMissionRuntime: false as never,
      neverExecuteUnauthorizedWork: false as never,
      neverImplementQ1013OrLater: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      preserveCompleteTraceability: false as never,
      preserveSchedulingHistory: false as never,
      preserveAuditHistory: false as never,
      deterministicSchedulingBehaviour: false as never,
      structuralSignalOnly: false as never,
      maskSensitiveValues: false as never,
    });
    assert.equal(c.neverFabricateExecutionTimes, true);
    assert.equal(c.neverBypassPillowGovernance, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverReplaceQueueRuntime, true);
    assert.equal(c.neverReplaceMissionRuntime, true);
    assert.equal(c.neverExecuteUnauthorizedWork, true);
    assert.equal(c.neverImplementQ1013OrLater, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveSchedulingHistory, true);
    assert.equal(c.preserveAuditHistory, true);
    assert.equal(c.deterministicSchedulingBehaviour, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.maskSensitiveValues, true);
  });

  test("2 initializes PILLOW-SCHRT-001 Q10-12", async () => {
    const engine = await build();
    const state = engine.getState();
    assert.equal(state.missionId, "Q10-12");
    assert.equal(state.engineVersion, "PILLOW-SCHRT-001");
    assert.equal(state.configuration.workerId, "wkr-scheduling-runtime-01");
    assert.equal(state.configuration.factory, "pillow-scheduling");
    for (const target of INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(SCHRT_CAPABILITIES.includes("register_schedules"));
    assert.ok(SCHRT_CAPABILITIES.includes("q1013_consumable_contract"));
    assert.ok(SCHEDULE_TYPES.includes("daily"));
    assert.ok(SCHEDULE_TYPES.includes("cron"));
    assert.ok(TRIGGER_TYPES.includes("event"));
    const listed = engine.list(sampleInput());
    assert.ok(listed.schedules.some((s) => s.scheduleId === "sched-daily-01"));
    assert.ok(listed.schedules.some((s) => s.scheduleId === "sched-weekly-01"));
    assert.ok(listed.schedules.some((s) => s.scheduleId === "sched-onetime-01"));
    assert.ok(listed.schedules.some((s) => s.scheduleId === "sched-event-01"));
    assert.ok(listed.schedules.some((s) => s.scheduleId === "sched-cron-01"));
  });

  test("3 one-time schedules execute correctly", async () => {
    const engine = await build();
    const created = engine.createSchedule(
      sampleInput({
        scheduleId: "sched-onetime-test-01",
        scheduleType: "one_time",
        triggerType: "time",
        missionId: "mission-onetime-test",
        nextExecution: "2026-09-01T10:00:00.000Z",
        auditReference: "audit://schrt/test/sched-onetime-test-01",
      }),
    );
    assert.equal(created.decision, "pass");
    assert.equal(created.schedule!.nextExecution, "2026-09-01T10:00:00.000Z");
    assert.equal(created.schedule!.previousExecution, null);

    const due = engine.evaluateDue(
      sampleInput({ now: "2026-09-01T10:00:00.000Z" }),
    );
    assert.equal(due.decision, "pass");
    assert.ok(due.executions.some((e) => e.scheduleId === "sched-onetime-test-01"));
    const exec = due.executions.find((e) => e.scheduleId === "sched-onetime-test-01")!;
    assert.equal(exec.status, "completed");
    assert.equal(exec.fabricated, false);
    assert.equal(exec.structuralSignalOnly, true);

    const listed = engine.list(sampleInput());
    const schedule = listed.schedules.find((s) => s.scheduleId === "sched-onetime-test-01")!;
    assert.equal(schedule.currentStatus, "completed");
    assert.equal(schedule.previousExecution, "2026-09-01T10:00:00.000Z");
    assert.equal(schedule.nextExecution, null);
  });

  test("4 recurring schedules execute correctly", async () => {
    const engine = await build();
    const created = engine.createSchedule(
      sampleInput({
        scheduleId: "sched-daily-test-01",
        scheduleType: "daily",
        triggerType: "time",
        missionId: "mission-daily-test",
        now: "2026-08-01T00:00:00.000Z",
        auditReference: "audit://schrt/test/sched-daily-test-01",
      }),
    );
    assert.equal(created.decision, "pass");
    const firstNext = created.schedule!.nextExecution;
    assert.equal(firstNext, "2026-08-02T00:00:00.000Z");

    const due = engine.evaluateDue(
      sampleInput({ now: "2026-08-02T00:00:00.000Z" }),
    );
    assert.equal(due.decision, "pass");
    assert.ok(due.executions.some((e) => e.scheduleId === "sched-daily-test-01"));

    const listed = engine.list(sampleInput());
    const schedule = listed.schedules.find((s) => s.scheduleId === "sched-daily-test-01")!;
    assert.equal(schedule.previousExecution, "2026-08-02T00:00:00.000Z");
    assert.equal(schedule.nextExecution, "2026-08-03T00:00:00.000Z");
    assert.equal(schedule.currentStatus, "active");
    assert.equal(schedule.fabricated, false);

    // Determinism: same schedule type + same now → same next
    const again = engine.createSchedule(
      sampleInput({
        scheduleId: "sched-daily-test-02",
        scheduleType: "daily",
        now: "2026-08-01T00:00:00.000Z",
        missionId: "mission-daily-test-2",
        auditReference: "audit://schrt/test/sched-daily-test-02",
      }),
    );
    assert.equal(again.schedule!.nextExecution, "2026-08-02T00:00:00.000Z");
  });

  test("5 event-driven schedules trigger correctly", async () => {
    const engine = await build();
    const run = engine.triggerEvent(
      sampleInput({
        eventKey: "mission.ready",
        now: "2026-08-05T12:00:00.000Z",
      }),
    );
    assert.equal(run.decision, "pass");
    assert.ok(run.eventTriggers.some((t) => t.eventKey === "mission.ready"));
    assert.ok(run.executions.some((e) => e.scheduleId === "sched-event-01"));
    const listed = engine.list(sampleInput());
    const schedule = listed.schedules.find((s) => s.scheduleId === "sched-event-01")!;
    assert.equal(schedule.currentStatus, "triggered");
    assert.equal(schedule.eventKey, "mission.ready");
    assert.ok(listed.eventTriggers.length >= 1);
  });

  test("6 scheduling conflicts detected", async () => {
    const engine = await build();
    const window = {
      startUtc: "2026-08-10T00:00:00.000Z",
      endUtc: "2026-08-10T23:59:59.000Z",
    };
    engine.createSchedule(
      sampleInput({
        scheduleId: "sched-conflict-a",
        scheduleType: "one_time",
        missionId: "mission-shared-conflict",
        workerId: "wkr-shared-conflict",
        nextExecution: "2026-08-10T12:00:00.000Z",
        executionWindow: window,
        auditReference: "audit://schrt/test/sched-conflict-a",
      }),
    );
    engine.createSchedule(
      sampleInput({
        scheduleId: "sched-conflict-b",
        scheduleType: "one_time",
        missionId: "mission-shared-conflict",
        workerId: "wkr-shared-conflict",
        nextExecution: "2026-08-10T12:00:00.000Z",
        executionWindow: window,
        auditReference: "audit://schrt/test/sched-conflict-b",
      }),
    );
    const conflicts = engine.detectConflicts(
      sampleInput({ now: "2026-08-10T12:00:00.000Z" }),
    );
    assert.equal(conflicts.decision, "pass");
    assert.ok(conflicts.conflicts.length >= 1);
    assert.ok(
      conflicts.conflicts.some(
        (c) =>
          c.scheduleIds.includes("sched-conflict-a") &&
          c.scheduleIds.includes("sched-conflict-b"),
      ),
    );
  });

  test("7 queue integration verified", async () => {
    let enqueueCalled = false;
    let produceCalled = false;
    const engine = await build({
      queueRuntime: {
        enqueue: () => {
          enqueueCalled = true;
          return { accepted: true, structural: true };
        },
        produceReport: () => {
          produceCalled = true;
          return { ok: true };
        },
        getQ1005ConsumableContract: () => ({ missionId: "Q10-05" }),
      },
    });
    const due = engine.evaluateDue(
      sampleInput({ now: "2026-08-15T12:00:00.000Z" }),
    );
    assert.equal(due.decision, "pass");
    assert.ok(due.executions.length >= 1);
    assert.ok(enqueueCalled || produceCalled);
    assert.ok(due.executions.some((e) => e.queueRef?.startsWith("queue://schrt/")));
    const connect = engine.connect();
    assert.ok(connect.integrationHandshakes.some((h) => h.target === "queue_runtime" && h.probed));
  });

  test("8 mission triggering verified", async () => {
    let createCalled = false;
    let monitorCalled = false;
    const engine = await build({
      missionRuntime: {
        createMission: () => {
          createCalled = true;
          return { accepted: true, structural: true };
        },
        monitor: () => {
          monitorCalled = true;
          return { ok: true };
        },
        getQ1004ConsumableContract: () => ({ missionId: "Q10-04" }),
      },
    });
    const due = engine.evaluateDue(
      sampleInput({ now: "2026-08-15T12:00:00.000Z" }),
    );
    assert.equal(due.decision, "pass");
    assert.ok(due.executions.length >= 1);
    assert.ok(createCalled || monitorCalled);
    assert.ok(due.executions.some((e) => e.triggerRef?.startsWith("trig://schrt/")));
    const connect = engine.connect();
    assert.ok(
      connect.integrationHandshakes.some((h) => h.target === "mission_runtime" && h.probed),
    );
  });

  test("9 scheduling history preserved", async () => {
    const engine = await build();
    engine.createSchedule(
      sampleInput({
        scheduleId: "sched-hist-01",
        scheduleType: "one_time",
        missionId: "mission-hist-01",
        nextExecution: "2026-10-01T00:00:00.000Z",
        auditReference: "audit://schrt/test/sched-hist-01",
      }),
    );
    engine.evaluateDue(sampleInput({ now: "2026-10-01T00:00:00.000Z" }));
    engine.triggerEvent(
      sampleInput({ eventKey: "mission.ready", now: "2026-10-02T00:00:00.000Z" }),
    );
    const history = engine.getHistory();
    assert.ok(history.schedules.length >= 5);
    assert.ok(history.scheduleHistory.length >= 5);
    assert.ok(history.executions.length >= 1);
    assert.ok(history.executionHistory.length >= 1);
    assert.ok(engine.getAuditTrail().length > 0);
  });

  test("10 full Scheduling Runtime Report + consumableByQ1013", async () => {
    const engine = await build();
    engine.evaluateDue(sampleInput({ now: "2026-08-15T12:00:00.000Z" }));
    const produced = engine.produceReport(sampleInput());
    assert.equal(produced.decision, "pass");
    assert.ok(produced.schedulingRuntimeReport);
    const report = produced.schedulingRuntimeReport!;
    assert.equal(report.runtimeVersion, SCHRT_RUNTIME_VERSION);
    assert.equal(report.reportVersion, SCHRT_REPORT_VERSION);
    assert.equal(report.metadataVersion, SCHRT_METADATA_VERSION);
    assert.equal(report.consumableByQ1013, true);
    assert.ok(Array.isArray(report.activeSchedules));
    assert.ok(Array.isArray(report.upcomingExecutions));
    assert.ok(Array.isArray(report.completedExecutions));
    assert.ok(Array.isArray(report.missedExecutions));
    assert.ok(Array.isArray(report.eventTriggers));
    assert.ok(report.schedulingStatistics);
    assert.ok(report.conflictSummary);
    assert.ok(Array.isArray(report.supportingEvidence));
    assert.ok("auditStatus" in report);
    assert.ok(Array.isArray(report.outstandingIssues));
    assert.ok(typeof report.confidenceScore === "number");
    assert.equal(report.neverFabricateExecutionTimes, true);
    assert.equal(report.neverReplaceQueueRuntime, true);
    assert.equal(report.neverReplaceMissionRuntime, true);
    assert.equal(report.neverImplementQ1013OrLater, true);
    assert.equal(report.structuralSignalOnly, true);
    assert.equal(report.workerId, "wkr-scheduling-runtime-01");
  });

  test("11 Q1013 contract without implementing Audit Runtime", async () => {
    const engine = await build();
    const contract = engine.getQ1013ConsumableContract();
    assert.equal(contract.producedBy, "scheduling-runtime");
    assert.equal(contract.missionId, "Q10-12");
    assert.equal(contract.consumerMissionId, "Q10-13");
    assert.equal(contract.neverImplementQ1013OrLater, true);
    assert.equal(contract.structuralSignalOnly, true);
    assert.ok(contract.exposedFields.includes("schedulingStatistics"));
    assert.ok(contract.exposedFields.includes("activeSchedules"));
    assert.ok(contract.notes.some((n) => n.toLowerCase().includes("audit")));
    assert.ok(
      contract.notes.some((n) => n.includes("does not implement Audit Runtime")),
    );
  });

  test("12 rejects fabricate times / governance bypass / Q10-13+ / replace queue/mission", async () => {
    const engine = await build();

    const fabricate = engine.validate(sampleInput({ fabricateExecutionTimes: true }));
    assert.equal(fabricate.decision, "fail");
    assert.ok(fabricate.errors.some((e) => e.toLowerCase().includes("fabricat")));

    const fabricateAlias = engine.validate(sampleInput({ fabricateTimes: true }));
    assert.equal(fabricateAlias.decision, "fail");

    const bypass = engine.validate(sampleInput({ bypassPillowGovernance: true }));
    assert.equal(bypass.decision, "fail");
    assert.ok(bypass.errors.some((e) => e.toLowerCase().includes("pillow")));

    const gk = engine.validate(sampleInput({ bypassGrandKingApproval: true }));
    assert.equal(gk.decision, "fail");

    const replaceQueue = engine.validate(sampleInput({ replaceQueueRuntime: true }));
    assert.equal(replaceQueue.decision, "fail");
    assert.ok(replaceQueue.errors.some((e) => e.toLowerCase().includes("queue")));

    const replaceMission = engine.validate(sampleInput({ replaceMissionRuntime: true }));
    assert.equal(replaceMission.decision, "fail");
    assert.ok(replaceMission.errors.some((e) => e.toLowerCase().includes("mission")));

    const q1013 = engine.validate(sampleInput({ targetMissionId: "Q10-13" }));
    assert.equal(q1013.decision, "fail");
    assert.ok(q1013.errors.some((e) => e.includes("Q10-13")));

    const q1014 = engine.validate(sampleInput({ targetMissionId: "Q10-14" }));
    assert.equal(q1014.decision, "fail");

    const implement = engine.validate(sampleInput({ implementQ1013OrLater: true }));
    assert.equal(implement.decision, "fail");

    const unauthorized = engine.validate(sampleInput({ executeUnauthorizedWork: true }));
    assert.equal(unauthorized.decision, "fail");

    const business = engine.validate(sampleInput({ businessPayload: { amount: 1 } }));
    assert.equal(business.decision, "fail");
  });
});
