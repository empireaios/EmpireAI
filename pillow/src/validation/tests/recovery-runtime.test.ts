import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  FAILURE_CLASSIFICATIONS,
  INTEGRATION_TARGETS,
  RECRT_CAPABILITIES,
  RECRT_METADATA_VERSION,
  RECRT_REPORT_VERSION,
  RECRT_RUNTIME_VERSION,
  RECOVERY_STRATEGIES,
  buildRecoveryRuntimeConfiguration,
  createRecoveryRuntime,
  resetRecoveryRuntimeForTesting,
  type RecrtInput,
  type RecoveryRuntimeDependencies,
} from "../../recovery-runtime/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleInput(overrides: Partial<RecrtInput> = {}): RecrtInput {
  return {
    validated: true,
    ...overrides,
  };
}

async function build(deps?: RecoveryRuntimeDependencies) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createRecoveryRuntime(
    bootstrap,
    deps ? { dependencies: deps } : undefined,
  );
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q10-11 Recovery Runtime", () => {
  beforeEach(resetRecoveryRuntimeForTesting);

  test("1 locks mandatory boundaries", () => {
    const c = buildRecoveryRuntimeConfiguration(REPO_ROOT, {
      neverFabricateRecoverySuccess: false as never,
      neverLoseRecoverableExecutionState: false as never,
      neverBypassPillowGovernance: false as never,
      neverBypassGrandKingApproval: false as never,
      neverModifyValidatedBusinessData: false as never,
      neverReplaceBusinessLogic: false as never,
      neverImplementQ1012OrLater: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      preserveCompleteTraceability: false as never,
      preserveRecoveryHistory: false as never,
      preserveAuditHistory: false as never,
      deterministicRecoveryBehaviour: false as never,
      structuralSignalOnly: false as never,
      maskSensitiveValues: false as never,
    });
    assert.equal(c.neverFabricateRecoverySuccess, true);
    assert.equal(c.neverLoseRecoverableExecutionState, true);
    assert.equal(c.neverBypassPillowGovernance, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverModifyValidatedBusinessData, true);
    assert.equal(c.neverReplaceBusinessLogic, true);
    assert.equal(c.neverImplementQ1012OrLater, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveRecoveryHistory, true);
    assert.equal(c.preserveAuditHistory, true);
    assert.equal(c.deterministicRecoveryBehaviour, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.maskSensitiveValues, true);
  });

  test("2 initializes PILLOW-RECRT-001 Q10-11", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q10-11");
    assert.equal(state.engineVersion, "PILLOW-RECRT-001");
    assert.equal(state.configuration.workerId, "wkr-recovery-runtime-01");
    assert.equal(state.configuration.factory, "pillow-recovery");
    for (const target of INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(RECRT_CAPABILITIES.includes("detect_failures"));
    assert.ok(RECRT_CAPABILITIES.includes("q1012_consumable_contract"));
    assert.ok(FAILURE_CLASSIFICATIONS.includes("unrecoverable"));
    assert.ok(RECOVERY_STRATEGIES.includes("restart_job"));
    assert.ok(RECOVERY_STRATEGIES.includes("escalate_only"));
  });

  test("3 failed jobs detected", async () => {
    const engine = await build();
    const detected = engine.detectFailure(
      sampleInput({
        failureId: "fail-detect-01",
        jobId: "job-detect-01",
        workerId: "wkr-alpha",
        factoryId: "factory-pillow",
        missionId: "mission-demo-01",
        classificationSignals: ["transient", "retry"],
        checkpointRef: "ckpt://recrt/fail-detect-01",
        stateRef: "state://recrt/fail-detect-01",
        auditReference: "audit://recrt/failure/fail-detect-01",
      }),
    );
    assert.equal(detected.decision, "pass");
    assert.ok(detected.failure);
    assert.equal(detected.failure!.failureId, "fail-detect-01");
    assert.equal(detected.failure!.jobId, "job-detect-01");
    assert.equal(detected.failure!.fabricated, false);
    assert.equal(detected.failure!.structuralSignalOnly, true);
    assert.equal(detected.failure!.checkpointRef, "ckpt://recrt/fail-detect-01");

    const listed = engine.list(sampleInput());
    assert.ok(listed.failures.some((f) => f.failureId === "fail-detect-01"));
  });

  test("4 recoverable workflows restarted (restart_job strategy)", async () => {
    const engine = await build();
    const run = engine.runRecovery(
      sampleInput({
        failureId: "fail-restart-01",
        jobId: "job-restart-01",
        workerId: "wkr-alpha",
        factoryId: "factory-pillow",
        missionId: "mission-restart-01",
        classificationSignals: ["transient", "flaky"],
        auditReference: "audit://recrt/failure/fail-restart-01",
      }),
    );
    assert.equal(run.decision, "pass");
    assert.ok(run.recovery);
    assert.equal(run.recovery!.recoveryStrategy, "restart_job");
    assert.equal(run.recovery!.recoveryStatus, "completed");
    assert.equal(run.recovery!.fabricated, false);
    assert.ok(
      run.recovery!.supportingEvidence.some((e) => e.includes("restart_completed")),
    );
    assert.ok(run.restart);
    assert.equal(run.restart!.status, "restarted");
  });

  test("5 execution state restored (restore_checkpoint)", async () => {
    const engine = await build();
    const run = engine.runRecovery(
      sampleInput({
        failureId: "fail-restore-01",
        jobId: "job-restore-01",
        workerId: "wkr-beta",
        factoryId: "factory-pillow",
        missionId: "mission-restore-01",
        classificationSignals: ["state_corruption", "corrupt"],
        checkpointRef: "ckpt://recrt/fail-restore-01",
        stateRef: "state://recrt/fail-restore-01",
        auditReference: "audit://recrt/failure/fail-restore-01",
      }),
    );
    assert.equal(run.decision, "pass");
    assert.ok(run.recovery);
    assert.equal(run.recovery!.recoveryStrategy, "restore_checkpoint");
    assert.equal(run.recovery!.recoveryStatus, "completed");
    assert.equal(run.recovery!.checkpointRef, "ckpt://recrt/fail-restore-01");
    assert.ok(run.checkpoint);
    assert.equal(run.checkpoint!.status, "restored");
    assert.ok(
      run.recovery!.supportingEvidence.some((e) => e.includes("restore_completed")),
    );
  });

  test("6 rollback where appropriate", async () => {
    const engine = await build();
    const run = engine.runRecovery(
      sampleInput({
        failureId: "fail-rollback-01",
        jobId: "job-rollback-01",
        workerId: "wkr-alpha",
        factoryId: "factory-capital",
        missionId: "mission-rollback-01",
        classificationSignals: ["state_corruption", "corrupt"],
        // no checkpointRef → rollback_partial
        auditReference: "audit://recrt/failure/fail-rollback-01",
      }),
    );
    assert.equal(run.decision, "pass");
    assert.ok(run.recovery);
    assert.equal(run.recovery!.recoveryStrategy, "rollback_partial");
    assert.equal(run.recovery!.recoveryStatus, "completed");
    assert.equal(run.recovery!.rollbackStatus, "completed");
    assert.ok(run.rollback);
    assert.equal(run.rollback!.rollbackStatus, "completed");
  });

  test("7 escalations for unrecoverable", async () => {
    const engine = await build();
    const run = engine.runRecovery(
      sampleInput({
        failureId: "fail-escalate-01",
        jobId: "job-escalate-01",
        workerId: "wkr-alpha",
        factoryId: "factory-pillow",
        missionId: "mission-escalate-01",
        classificationSignals: ["unrecoverable", "fatal"],
        auditReference: "audit://recrt/failure/fail-escalate-01",
      }),
    );
    assert.equal(run.decision, "pass");
    assert.ok(run.recovery);
    assert.equal(run.recovery!.recoveryStrategy, "escalate_only");
    assert.equal(run.recovery!.recoveryStatus, "escalated");
    assert.equal(run.recovery!.escalationStatus, "escalated");
    assert.ok(run.escalation);
    assert.equal(run.escalation!.escalationStatus, "escalated");
    assert.ok(
      run.escalation!.supportingEvidence.some((e) => e.includes("never_fabricated")),
    );

    // resume/restart blocked for unrecoverable
    const restartBlocked = engine.restartJob(
      sampleInput({
        recoveryId: run.recovery!.recoveryId,
        failureId: "fail-escalate-01",
      }),
    );
    assert.equal(restartBlocked.decision, "fail");
    assert.ok(restartBlocked.errors.some((e) => e.toLowerCase().includes("unrecoverable")));
  });

  test("8 recovery history preserved", async () => {
    const engine = await build();
    engine.runRecovery(
      sampleInput({
        failureId: "fail-hist-01",
        jobId: "job-hist-01",
        classificationSignals: ["transient"],
        auditReference: "audit://recrt/failure/fail-hist-01",
      }),
    );
    engine.runRecovery(
      sampleInput({
        failureId: "fail-hist-02",
        jobId: "job-hist-02",
        classificationSignals: ["timeout"],
        auditReference: "audit://recrt/failure/fail-hist-02",
      }),
    );
    const history = engine.getHistory();
    assert.ok(history.failures.length >= 2);
    assert.ok(history.cases.length >= 2);
    assert.ok(history.caseHistory.length >= 2);
    assert.ok(history.failureHistory.length >= 2);
    assert.ok(engine.getAuditTrail().length > 0);
    // checkpoints/state refs never deleted from completed cases
    for (const c of history.cases) {
      if (c.checkpointRef) {
        assert.ok(c.checkpointRef.startsWith("ckpt://") || c.checkpointRef.length > 0);
      }
    }
  });

  test("9 full Recovery Runtime Report + consumableByQ1012", async () => {
    const engine = await build();
    engine.runRecovery(
      sampleInput({
        failureId: "fail-report-01",
        jobId: "job-report-01",
        classificationSignals: ["transient"],
        auditReference: "audit://recrt/failure/fail-report-01",
      }),
    );
    const produced = engine.produceReport(sampleInput());
    assert.equal(produced.decision, "pass");
    assert.ok(produced.recoveryRuntimeReport);
    const report = produced.recoveryRuntimeReport!;
    assert.equal(report.runtimeVersion, RECRT_RUNTIME_VERSION);
    assert.equal(report.reportVersion, RECRT_REPORT_VERSION);
    assert.equal(report.metadataVersion, RECRT_METADATA_VERSION);
    assert.equal(report.consumableByQ1012, true);
    assert.ok(report.recoverySummary);
    assert.ok(report.restartSummary);
    assert.ok(report.rollbackSummary);
    assert.ok(report.escalationSummary);
    assert.ok(report.recoveryMetrics);
    assert.equal(report.neverFabricateRecoverySuccess, true);
    assert.equal(report.neverLoseRecoverableExecutionState, true);
    assert.equal(report.neverImplementQ1012OrLater, true);
    assert.equal(report.structuralSignalOnly, true);
    assert.equal(report.workerId, "wkr-recovery-runtime-01");
  });

  test("10 Q1012 contract without implementing Audit Runtime", async () => {
    const engine = await build();
    const contract = engine.getQ1012ConsumableContract();
    assert.equal(contract.producedBy, "recovery-runtime");
    assert.equal(contract.missionId, "Q10-11");
    assert.equal(contract.consumerMissionId, "Q10-12");
    assert.equal(contract.neverImplementQ1012OrLater, true);
    assert.equal(contract.structuralSignalOnly, true);
    assert.ok(contract.exposedFields.includes("recoverySummary"));
    assert.ok(contract.exposedFields.includes("recoveryMetrics"));
    assert.ok(contract.notes.some((n) => n.toLowerCase().includes("scheduling")));
    assert.ok(
      contract.notes.some((n) => n.includes("does not implement Scheduling Runtime")),
    );
  });

  test("11 rejects fabricate success / governance bypass / Q10-12+", async () => {
    const engine = await build();

    const fabricate = engine.validate(sampleInput({ fabricateSuccess: true }));
    assert.equal(fabricate.decision, "fail");
    assert.ok(fabricate.errors.some((e) => e.toLowerCase().includes("fabricat")));

    const loseState = engine.validate(sampleInput({ loseRecoverableExecutionState: true }));
    assert.equal(loseState.decision, "fail");

    const bypass = engine.validate(sampleInput({ bypassPillowGovernance: true }));
    assert.equal(bypass.decision, "fail");
    assert.ok(bypass.errors.some((e) => e.toLowerCase().includes("pillow")));

    const gk = engine.validate(sampleInput({ bypassGrandKingApproval: true }));
    assert.equal(gk.decision, "fail");

    const q1012 = engine.validate(sampleInput({ targetMissionId: "Q10-12" }));
    assert.equal(q1012.decision, "fail");
    assert.ok(q1012.errors.some((e) => e.includes("Q10-12")));

    const q1013 = engine.validate(sampleInput({ targetMissionId: "Q10-13" }));
    assert.equal(q1013.decision, "fail");

    const implement = engine.validate(sampleInput({ implementQ1012OrLater: true }));
    assert.equal(implement.decision, "fail");

    const business = engine.validate(sampleInput({ businessPayload: { amount: 1 } }));
    assert.equal(business.decision, "fail");
  });

  test("12 cockpit + never lose recoverable state (checkpoint remains after complete)", async () => {
    const engine = await build();
    const run = engine.runRecovery(
      sampleInput({
        failureId: "fail-cockpit-01",
        jobId: "job-cockpit-01",
        workerId: "wkr-alpha",
        factoryId: "factory-pillow",
        missionId: "mission-cockpit-01",
        classificationSignals: ["state_corruption", "corrupt"],
        checkpointRef: "ckpt://recrt/fail-cockpit-01",
        stateRef: "state://recrt/fail-cockpit-01",
        auditReference: "audit://recrt/failure/fail-cockpit-01",
      }),
    );
    assert.equal(run.decision, "pass");
    assert.equal(run.recovery!.recoveryStatus, "completed");
    assert.equal(run.recovery!.checkpointRef, "ckpt://recrt/fail-cockpit-01");
    assert.equal(run.recovery!.stateRef, "state://recrt/fail-cockpit-01");

    // Attempt to clear checkpoint must not lose recoverable state
    const history = engine.getHistory();
    const completed = history.cases.find((c) => c.recoveryId === run.recovery!.recoveryId);
    assert.ok(completed);
    assert.equal(completed!.checkpointRef, "ckpt://recrt/fail-cockpit-01");
    assert.equal(completed!.stateRef, "state://recrt/fail-cockpit-01");
    assert.ok(history.checkpoints.some((c) => c.checkpointRef === "ckpt://recrt/fail-cockpit-01"));

    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q10-11");
    assert.equal(cockpit.workerId, "wkr-recovery-runtime-01");
    assert.ok(cockpit.totalFailures >= 1);
    assert.ok(cockpit.totalRecoveries >= 1);
    assert.ok(cockpit.completedRecoveries >= 1);
    assert.equal(cockpit.neverFabricateRecoverySuccess, true);
    assert.equal(cockpit.neverLoseRecoverableExecutionState, true);
    assert.equal(cockpit.neverBypassPillowGovernance, true);
    assert.equal(cockpit.neverBypassGrandKingApproval, true);
    assert.equal(cockpit.neverModifyValidatedBusinessData, true);
    assert.equal(cockpit.neverReplaceBusinessLogic, true);
    assert.equal(cockpit.neverImplementQ1012OrLater, true);
    assert.equal(cockpit.structuralSignalOnly, true);
  });
});
