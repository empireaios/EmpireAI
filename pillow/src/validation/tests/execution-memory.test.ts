import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  buildExecutionMemoryConfiguration,
  createExecutionMemory,
  EXM_CAPABILITIES,
  resetExecutionMemoryForTesting,
} from "../../execution-memory/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

async function build() {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createExecutionMemory(bootstrap);
  await engine.initialize();
  engine.connectExecutionMemory();
  return engine;
}

describe("Q0-04 Execution Memory", () => {
  beforeEach(resetExecutionMemoryForTesting);

  test("1 locks mandatory memory boundaries", () => {
    const c = buildExecutionMemoryConfiguration(REPO_ROOT, {
      neverMakeDecisions: false as never,
      neverPlanMissions: false as never,
      neverAssignWorkers: false as never,
      neverExecuteWork: false as never,
      neverReplaceKnowledgeSystems: false as never,
    });
    assert.equal(c.neverMakeDecisions, true);
    assert.equal(c.neverPlanMissions, true);
    assert.equal(c.neverAssignWorkers, true);
    assert.equal(c.neverExecuteWork, true);
    assert.equal(c.neverReplaceKnowledgeSystems, true);
  });

  test("2 initializes PILLOW-EXM-001 for Q0-04", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q0-04");
    assert.equal(state.engineVersion, "PILLOW-EXM-001");
  });

  test("3 stores an execution record", async () => {
    const report = (await build()).storeRecord({
      eventType: "mission_completed",
      missionId: "Q0-01",
      businessId: "bsm-biz-1",
      outcome: "execution plan produced",
      lessonLearned: "validate objectives before workforce assignment",
      confidence: 88,
      evidence: ["structural://plan/ep-plan-1"],
      validated: true,
    });
    assert.equal(report.validation.decision, "pass");
    const record = report.records[0]!;
    assert.ok(record.memoryId.startsWith("exm-mem-"));
    assert.equal(record.eventType, "mission_completed");
    assert.equal(record.metadataVersion, "EXM-001-v1");
  });

  test("4 retrieves a stored record", async () => {
    const engine = await build();
    const stored = engine.storeRecord({
      eventType: "executive_decision",
      missionId: "Q0-03",
      businessId: "bsm-biz-2",
      executiveDecision: "advance business to building",
      validated: true,
    }).records[0]!;
    const retrieved = engine.retrieveRecord({ memoryId: stored.memoryId, validated: true });
    assert.equal(retrieved.validation.decision, "pass");
    assert.equal(retrieved.records[0]!.memoryId, stored.memoryId);
    assert.equal(retrieved.records[0]!.executiveDecision, "advance business to building");
  });

  test("5 searches by mission, business, and event type", async () => {
    const engine = await build();
    engine.storeRecord({
      eventType: "mission_failed",
      missionId: "m-100",
      businessId: "biz-a",
      outcome: "timeout",
      validated: true,
    });
    engine.storeRecord({
      eventType: "approval_granted",
      missionId: "m-200",
      businessId: "biz-a",
      validated: true,
    });
    engine.storeRecord({
      eventType: "lesson_learned",
      missionId: "m-100",
      businessId: "biz-b",
      lessonLearned: "retry with longer timeout",
      validated: true,
    });
    assert.equal(engine.searchRecords({ missionId: "m-100", validated: true }).records.length, 2);
    assert.equal(engine.searchRecords({ businessId: "biz-a", validated: true }).records.length, 2);
    assert.equal(engine.searchRecords({ eventType: "approval_granted", validated: true }).records.length, 1);
  });

  test("6 updates history and preserves audit fields", async () => {
    const engine = await build();
    const stored = engine.storeRecord({
      eventType: "operational_incident",
      businessId: "biz-c",
      outcome: "partial outage",
      validated: true,
    }).records[0]!;
    const updated = engine.updateRecord({
      memoryId: stored.memoryId,
      lessonLearned: "add health probe before scale-out",
      confidence: 92,
      validated: true,
    }).records[0]!;
    assert.equal(updated.version, 2);
    assert.equal(updated.lessonLearned, "add health probe before scale-out");
    assert.equal(updated.workExecutedByMemory, false);
    assert.ok(updated.memoryTraceId.startsWith("exm-trace-"));
  });

  test("7 rejects boundary violations", async () => {
    const engine = await build();
    assert.equal(
      engine.storeRecord({ eventType: "mission_started", validated: true, makeDecisions: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.storeRecord({ eventType: "mission_started", validated: true, planMissions: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.storeRecord({ eventType: "mission_started", validated: true, assignWorkers: true }).validation.decision,
      "fail",
    );
    assert.equal(
      engine.storeRecord({ eventType: "mission_started", validated: true, executeWork: true }).validation.decision,
      "fail",
    );
  });

  test("8 records approvals and rejections", async () => {
    const engine = await build();
    const granted = engine.storeRecord({
      eventType: "approval_granted",
      missionId: "m-300",
      executiveDecision: "approve expansion stage",
      validated: true,
    }).records[0]!;
    const rejected = engine.storeRecord({
      eventType: "approval_rejected",
      missionId: "m-301",
      executiveDecision: "reject unvalidated launch",
      validated: true,
    }).records[0]!;
    assert.equal(granted.approvalStatus, "granted");
    assert.equal(rejected.approvalStatus, "rejected");
  });

  test("9 validates stored records and lists machine-readable history", async () => {
    const engine = await build();
    engine.storeRecord({ eventType: "business_created", businessId: "biz-d", validated: true });
    assert.equal(engine.validateRecords().validation.decision, "pass");
    assert.equal(engine.listRecords().records.length, 1);
  });

  test("10 reports health and diagnostics", async () => {
    const engine = await build();
    assert.notEqual(engine.runDiagnostics().validation.decision, "fail");
    assert.equal(engine.validateForSupervisorSync().valid, true);
    assert.equal(engine.getCockpitSnapshot().neverMakeDecisions, true);
    assert.ok(EXM_CAPABILITIES.includes("historical_lookup"));
  });
});
