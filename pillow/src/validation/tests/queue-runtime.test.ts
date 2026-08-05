import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  JOB_STATUSES,
  QUEUE_TYPES,
  QRT_CAPABILITIES,
  QRT_METADATA_VERSION,
  QRT_REPORT_VERSION,
  QRT_RUNTIME_VERSION,
  INTEGRATION_TARGETS,
  buildQueueRuntimeConfiguration,
  createQueueRuntime,
  resetQueueRuntimeForTesting,
  compareJobs,
  type QrtInput,
  type QueueRuntimeDependencies,
} from "../../queue-runtime/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleInput(overrides: Partial<QrtInput> = {}): QrtInput {
  return {
    pillowConfirmed: true,
    grandKingApproved: true,
    validated: true,
    ...overrides,
  };
}

async function build(deps?: QueueRuntimeDependencies) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createQueueRuntime(bootstrap, deps ? { dependencies: deps } : undefined);
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q10-04 Queue Runtime", () => {
  beforeEach(resetQueueRuntimeForTesting);

  test("1 locks mandatory boundaries", () => {
    const c = buildQueueRuntimeConfiguration(REPO_ROOT, {
      neverReplaceWorkerLogic: false as never,
      neverReplaceMissionLogic: false as never,
      neverExecuteBusinessSpecificWork: false as never,
      neverFabricateQueueState: false as never,
      neverBypassPillowGovernance: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ1005OrLater: false as never,
      deterministicQueueOrdering: false as never,
    });
    assert.equal(c.neverReplaceWorkerLogic, true);
    assert.equal(c.neverReplaceMissionLogic, true);
    assert.equal(c.neverExecuteBusinessSpecificWork, true);
    assert.equal(c.neverFabricateQueueState, true);
    assert.equal(c.neverBypassPillowGovernance, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ1005OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveExecutionHistory, true);
    assert.equal(c.preserveAuditHistory, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.neverExposeCredentials, true);
    assert.equal(c.maskSensitiveValues, true);
    assert.equal(c.deterministicQueueOrdering, true);
    assert.equal(c.defaultMaxRetries, 3);
  });

  test("2 initializes PILLOW-QRT-001 Q10-04", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q10-04");
    assert.equal(state.engineVersion, "PILLOW-QRT-001");
    assert.equal(state.configuration.workerId, "wkr-queue-runtime-01");
    assert.equal(state.configuration.factory, "pillow-queue");
    for (const target of INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(QRT_CAPABILITIES.includes("create_queues"));
    assert.ok(QRT_CAPABILITIES.includes("q1005_consumable_contract"));
    assert.equal(QUEUE_TYPES.length, 7);
    assert.equal(JOB_STATUSES.length, 12);
    assert.ok(compareJobs(
      { priority: 10, scheduledAt: null, enqueuedAt: "2026-01-01T00:00:00.000Z", jobId: "b" } as never,
      { priority: 5, scheduledAt: null, enqueuedAt: "2026-01-01T00:00:00.000Z", jobId: "a" } as never,
    ) < 0);
  });

  test("3 jobs queued successfully", async () => {
    const engine = await build();
    engine.createQueue(sampleInput({ queueName: "enterprise-jobs", queueType: "fifo" }));
    const report = engine.enqueue(
      sampleInput({ queueName: "enterprise-jobs", jobId: "job-001", jobPayloadRef: "payload://test" }),
    );
    assert.equal(report.decision, "pass");
    assert.ok(report.job);
    assert.equal(report.job!.status, "ready");
    assert.equal(report.job!.fabricated, false);
    assert.equal(report.job!.jobPayloadRef, "payload://test");
  });

  test("4 priorities enforced correctly", async () => {
    const engine = await build();
    engine.createQueue(sampleInput({ queueName: "priority-queue", queueType: "priority" }));
    engine.enqueue(sampleInput({ queueName: "priority-queue", jobId: "low-priority", priority: 1 }));
    engine.enqueue(sampleInput({ queueName: "priority-queue", jobId: "high-priority", priority: 10 }));
    const dispatch = engine.dispatchReady(sampleInput({ queueName: "priority-queue" }));
    assert.equal(dispatch.decision, "pass");
    assert.equal(dispatch.dispatchRecords.length, 1);
    assert.equal(dispatch.dispatchRecords[0]!.jobId, "high-priority");
    assert.equal(dispatch.dispatchRecords[0]!.businessLogicExecuted, false);
  });

  test("5 dependencies respected (blocked until deps completed)", async () => {
    const engine = await build();
    engine.createQueue(sampleInput({ queueName: "dep-queue", queueType: "fifo" }));
    engine.enqueue(sampleInput({ queueName: "dep-queue", jobId: "parent-job" }));
    const child = engine.enqueue(
      sampleInput({ queueName: "dep-queue", jobId: "child-job", dependencyJobIds: ["parent-job"] }),
    );
    assert.equal(child.job!.status, "waiting_dependency");
    engine.completeJob(sampleInput({ jobId: "parent-job" }));
    const history = engine.getHistory();
    const childJob = history.jobs.find((j) => j.jobId === "child-job");
    assert.equal(childJob!.status, "ready");
  });

  test("6 scheduled jobs become ready at scheduled time (use now override)", async () => {
    const engine = await build();
    engine.createQueue(sampleInput({ queueName: "sched-queue", queueType: "scheduled" }));
    const future = "2026-12-01T12:00:00.000Z";
    const enqueued = engine.enqueue(
      sampleInput({ queueName: "sched-queue", jobId: "future-job", scheduledAt: future }),
    );
    assert.equal(enqueued.job!.status, "scheduled");
    const beforeReady = engine.dispatchReady(
      sampleInput({ queueName: "sched-queue", now: "2026-06-01T00:00:00.000Z" }),
    );
    assert.equal(beforeReady.dispatchRecords.length, 0);
    const afterReady = engine.dispatchReady(
      sampleInput({ queueName: "sched-queue", now: future }),
    );
    assert.equal(afterReady.dispatchRecords.length, 1);
    assert.equal(afterReady.dispatchRecords[0]!.jobId, "future-job");
  });

  test("7 retries function correctly", async () => {
    const engine = await build();
    engine.createQueue(sampleInput({ queueName: "retry-queue", queueType: "retry" }));
    engine.enqueue(sampleInput({ queueName: "retry-queue", jobId: "retry-job", maxRetries: 3 }));
    const retried = engine.retryFailed(sampleInput({ jobId: "retry-job" }));
    assert.equal(retried.decision, "pass");
    assert.ok(retried.job);
    assert.equal(retried.job!.status, "ready");
    assert.equal(retried.job!.retryCount, 1);
  });

  test("8 queue persistence verified (history after ops)", async () => {
    const engine = await build();
    engine.createQueue(sampleInput({ queueName: "persist-queue", queueType: "fifo" }));
    engine.enqueue(sampleInput({ queueName: "persist-queue", jobId: "persist-job" }));
    engine.dispatchReady(sampleInput({ queueName: "persist-queue" }));
    const history = engine.getHistory();
    assert.ok(history.queues.length >= 1);
    assert.ok(history.jobs.length >= 1);
    assert.ok(history.dispatches.length >= 1);
    assert.ok(engine.getAuditTrail().length >= 1);
  });

  test("9 queue metrics + full Queue Runtime Report + consumableByQ1005", async () => {
    const engine = await build();
    engine.createQueue(sampleInput({ queueName: "report-queue", queueType: "priority" }));
    engine.enqueue(sampleInput({ queueName: "report-queue", jobId: "report-job", priority: 5 }));
    engine.metrics(sampleInput());
    const report = engine.produceReport(sampleInput({ queueName: "report-queue" }));
    assert.equal(report.decision, "pass");
    const qrt = report.queueRuntimeReport;
    assert.ok(qrt);
    assert.ok(qrt!.reportId.startsWith("qrt-rpt"));
    assert.ok(qrt!.timestamp);
    assert.equal(qrt!.runtimeVersion, QRT_RUNTIME_VERSION);
    assert.ok(Array.isArray(qrt!.queueInventory));
    assert.ok(Array.isArray(qrt!.activeJobs));
    assert.ok(Array.isArray(qrt!.waitingJobs));
    assert.ok(Array.isArray(qrt!.runningJobs));
    assert.ok(Array.isArray(qrt!.completedJobs));
    assert.ok(Array.isArray(qrt!.failedJobs));
    assert.ok(qrt!.retrySummary);
    assert.ok(qrt!.dependencySummary);
    assert.ok(qrt!.queueHealth);
    assert.ok(qrt!.dispatchStatistics);
    assert.ok(Array.isArray(qrt!.supportingEvidence));
    assert.ok(qrt!.auditStatus);
    assert.ok(Array.isArray(qrt!.outstandingIssues));
    assert.ok(typeof qrt!.confidenceScore === "number");
    assert.equal(qrt!.metadataVersion, QRT_METADATA_VERSION);
    assert.equal(qrt!.reportVersion, QRT_REPORT_VERSION);
    assert.equal(qrt!.consumableByQ1005, true);
    assert.equal(qrt!.neverImplementQ1005OrLater, true);
    assert.ok(engine.getHistory().reports.length >= 1);
  });

  test("10 rejects fabrication / unauthorised high-risk dispatch", async () => {
    const engine = await build();
    const failReport = engine.validate(sampleInput({ forceFail: true }));
    assert.equal(failReport.decision, "fail");
    const fabReport = engine.validate(sampleInput({ fabricateState: true }));
    assert.equal(fabReport.decision, "fail");
    engine.createQueue(sampleInput({ queueName: "risk-queue", queueType: "fifo" }));
    engine.enqueue(
      sampleInput({ queueName: "risk-queue", jobId: "risk-job", highRisk: true, grandKingApproved: true }),
    );
    const highRiskReport = engine.dispatchReady(
      sampleInput({ queueName: "risk-queue", highRisk: true, grandKingApproved: false }),
    );
    assert.equal(highRiskReport.decision, "fail");
  });

  test("11 rejects Q10-05+ mission scope", async () => {
    const engine = await build();
    const report = engine.validate(
      sampleInput({ implementQ1005OrLater: true, targetMissionId: "Q10-05" }),
    );
    assert.equal(report.decision, "fail");
    assert.ok(report.errors.some((e) => e.includes("Q10-05") || e.includes("Q10-05 or later")));
  });

  test("12 cockpit + Q1005 contract; never executes business-specific work", async () => {
    const engine = await build({
      executiveReportingRuntime: {
        submitWorkerReport: () => ({ records: [{ reportId: "ert-qrt-test" }] }),
      },
    });
    engine.createQueue(sampleInput({ queueName: "contract-queue", queueType: "fifo" }));
    engine.enqueue(sampleInput({ queueName: "contract-queue", jobId: "contract-job" }));
    engine.dispatchReady(sampleInput({ queueName: "contract-queue" }));
    engine.produceReport(sampleInput({ queueName: "contract-queue" }));
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q10-04");
    assert.equal(cockpit.neverReplaceWorkerLogic, true);
    assert.equal(cockpit.neverReplaceMissionLogic, true);
    assert.equal(cockpit.neverExecuteBusinessSpecificWork, true);
    assert.equal(cockpit.neverFabricateQueueState, true);
    assert.equal(cockpit.neverImplementQ1005OrLater, true);
    assert.ok(cockpit.totalQueues >= 1);
    const contract = engine.getQ1005ConsumableContract();
    assert.equal(contract.consumerMissionId, "Q10-05");
    assert.equal(contract.producedBy, "queue-runtime");
    assert.equal(contract.missionId, "Q10-04");
    assert.equal(contract.neverImplementQ1005OrLater, true);
    assert.ok(contract.exposedFields.includes("queueInventory"));
    assert.ok(contract.jobStatusCatalog.length >= JOB_STATUSES.length);
    const history = engine.getHistory();
    assert.ok(history.dispatches.every((d) => d.businessLogicExecuted === false));
  });
});
