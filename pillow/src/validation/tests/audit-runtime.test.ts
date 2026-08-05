import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  AUDIT_CATEGORIES,
  AUDRT_CAPABILITIES,
  AUDRT_METADATA_VERSION,
  AUDRT_REPORT_VERSION,
  AUDRT_RUNTIME_VERSION,
  INTEGRATION_TARGETS,
  INTEGRITY_STATUSES,
  buildAuditRuntimeConfiguration,
  createAuditRuntime,
  resetAuditRuntimeForTesting,
  type AudrtInput,
  type AuditRuntimeDependencies,
} from "../../audit-runtime/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleInput(overrides: Partial<AudrtInput> = {}): AudrtInput {
  return {
    validated: true,
    ...overrides,
  };
}

async function build(deps?: AuditRuntimeDependencies) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  const engine = createAuditRuntime(
    bootstrap,
    deps ? { dependencies: deps } : undefined,
  );
  await engine.initialize();
  engine.connect();
  return engine;
}

describe("Q10-13 Audit Runtime", () => {
  beforeEach(resetAuditRuntimeForTesting);

  test("1 locks mandatory boundaries", () => {
    const c = buildAuditRuntimeConfiguration(REPO_ROOT, {
      neverFabricateAuditEvidence: false as never,
      neverDeleteAuditRecords: false as never,
      neverExecuteBusinessLogic: false as never,
      neverModifyOperationalData: false as never,
      neverBypassPillowGovernance: false as never,
      neverBypassGrandKingApproval: false as never,
      neverImplementQ1014OrLater: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      preserveCompleteTraceability: false as never,
      preserveImmutableAuditHistory: false as never,
      preserveAuditHistory: false as never,
      deterministicAuditRecording: false as never,
      structuralSignalOnly: false as never,
      maskSensitiveValues: false as never,
    });
    assert.equal(c.neverFabricateAuditEvidence, true);
    assert.equal(c.neverDeleteAuditRecords, true);
    assert.equal(c.neverExecuteBusinessLogic, true);
    assert.equal(c.neverModifyOperationalData, true);
    assert.equal(c.neverBypassPillowGovernance, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverImplementQ1014OrLater, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveImmutableAuditHistory, true);
    assert.equal(c.preserveAuditHistory, true);
    assert.equal(c.deterministicAuditRecording, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.maskSensitiveValues, true);
  });

  test("2 initializes PILLOW-AUDRT-001 Q10-13", async () => {
    const engine = await build();
    const state = engine.getState();
    assert.equal(state.missionId, "Q10-13");
    assert.equal(state.engineVersion, "PILLOW-AUDRT-001");
    assert.equal(state.configuration.workerId, "wkr-audit-runtime-01");
    assert.equal(state.configuration.factory, "pillow-audit");
    for (const target of INTEGRATION_TARGETS) {
      assert.ok(state.configuration.integrationTargets.includes(target));
    }
    assert.ok(AUDRT_CAPABILITIES.includes("record_runtime_events"));
    assert.ok(AUDRT_CAPABILITIES.includes("q1014_consumable_contract"));
    assert.ok(AUDIT_CATEGORIES.includes("worker_action"));
    assert.ok(AUDIT_CATEGORIES.includes("scheduling_activity"));
    assert.ok(INTEGRITY_STATUSES.includes("verified"));
    const listed = engine.list(sampleInput());
    assert.ok(listed.records.some((r) => r.auditRecordId === "audrt-seed-worker-01"));
    assert.ok(listed.records.some((r) => r.auditRecordId === "audrt-seed-mission-01"));
    assert.ok(listed.records.some((r) => r.auditRecordId === "audrt-seed-approval-01"));
    assert.ok(listed.records.some((r) => r.auditRecordId === "audrt-seed-recovery-01"));
    assert.ok(listed.records.some((r) => r.auditRecordId === "audrt-seed-scheduling-01"));
  });

  test("3 worker actions recorded", async () => {
    const engine = await build();
    const run = engine.recordWorkerAction(
      sampleInput({
        actionPerformed: "worker_dispatch",
        missionId: "mission-worker-test",
        workerId: "wkr-test-01",
        auditReference: "audit://audrt/test/worker-01",
        supportingEvidence: ["evid://audrt/test/worker-01"],
      }),
    );
    assert.equal(run.decision, "pass");
    assert.ok(run.record);
    assert.equal(run.record!.category, "worker_action");
    assert.equal(run.record!.fabricated, false);
    assert.equal(run.record!.structuralSignalOnly, true);
    assert.ok(run.record!.integrityDigest.startsWith("djb2:"));
    assert.ok(
      engine.list(sampleInput()).records.some((r) => r.actionPerformed === "worker_dispatch"),
    );
  });

  test("4 mission lifecycle recorded", async () => {
    const engine = await build();
    const run = engine.recordMissionLifecycle(
      sampleInput({
        actionPerformed: "mission_started",
        missionId: "mission-lifecycle-test",
        auditReference: "audit://audrt/test/mission-01",
        supportingEvidence: ["evid://audrt/test/mission-01"],
      }),
    );
    assert.equal(run.decision, "pass");
    assert.equal(run.record!.category, "mission_lifecycle");
    assert.equal(run.record!.missionId, "mission-lifecycle-test");
    assert.equal(run.record!.fabricated, false);
  });

  test("5 approval events recorded", async () => {
    const engine = await build();
    const run = engine.recordApproval(
      sampleInput({
        actionPerformed: "approval_granted",
        decision: "approved",
        missionId: "mission-approval-test",
        auditReference: "audit://audrt/test/approval-01",
        supportingEvidence: ["evid://audrt/test/approval-01"],
      }),
    );
    assert.equal(run.decision, "pass");
    assert.equal(run.record!.category, "approval_decision");
    assert.equal(run.record!.decision, "approved");
    assert.equal(run.record!.fabricated, false);
  });

  test("6 recovery events recorded", async () => {
    const engine = await build();
    const run = engine.recordRecovery(
      sampleInput({
        actionPerformed: "recovery_restart",
        missionId: "mission-recovery-test",
        auditReference: "audit://audrt/test/recovery-01",
        supportingEvidence: ["evid://audrt/test/recovery-01"],
      }),
    );
    assert.equal(run.decision, "pass");
    assert.equal(run.record!.category, "recovery_event");
    assert.equal(run.record!.fabricated, false);
    assert.equal(run.record!.structuralSignalOnly, true);
  });

  test("7 scheduling events recorded", async () => {
    const engine = await build();
    const run = engine.recordScheduling(
      sampleInput({
        actionPerformed: "schedule_triggered",
        missionId: "mission-scheduling-test",
        auditReference: "audit://audrt/test/scheduling-01",
        supportingEvidence: ["evid://audrt/test/scheduling-01"],
      }),
    );
    assert.equal(run.decision, "pass");
    assert.equal(run.record!.category, "scheduling_activity");
    assert.equal(run.record!.fabricated, false);
  });

  test("8 evidence preserved + immutable (no delete)", async () => {
    const engine = await build();
    const attached = engine.attachEvidence(
      sampleInput({
        auditRecordId: "audrt-seed-worker-01",
        evidenceRef: "evid://audrt/test/extra-01",
        auditReference: "audit://audrt/test/evidence-01",
      }),
    );
    assert.equal(attached.decision, "pass");
    assert.equal(attached.record!.category, "evidence_attachment");
    assert.ok(attached.record!.supportingEvidence.includes("evid://audrt/test/extra-01"));
    assert.ok(attached.record!.relatedRecords.includes("audrt-seed-worker-01"));

    const before = engine.list(sampleInput()).records.length;
    const store = engine.getHistory();
    assert.ok(store.records.length >= 6);
    assert.equal(
      typeof (engine as unknown as { delete?: unknown }).delete,
      "undefined",
    );
    assert.ok(!("delete" in engine.getHistory()));
    const after = engine.list(sampleInput()).records.length;
    assert.equal(after, before);
    assert.ok(engine.getAuditTrail().some((t) => t.startsWith("record_appended:")));
  });

  test("9 integrity verification passes", async () => {
    const engine = await build();
    engine.recordWorkerAction(
      sampleInput({
        actionPerformed: "integrity_probe",
        missionId: "mission-integrity",
        auditReference: "audit://audrt/test/integrity-01",
        supportingEvidence: ["evid://audrt/test/integrity-01"],
      }),
    );
    const verified = engine.verifyIntegrity(sampleInput());
    assert.equal(verified.decision, "pass");
    assert.ok(verified.integrityVerification);
    assert.equal(verified.integrityVerification!.allPassed, true);
    assert.equal(verified.integrityVerification!.failedCount, 0);
    assert.ok(verified.integrityVerification!.verifiedCount >= 5);
    assert.equal(verified.integrityVerification!.fabricated, false);
  });

  test("10 full Audit Runtime Report + consumableByQ1014", async () => {
    const engine = await build();
    engine.recordWorkerAction(
      sampleInput({
        actionPerformed: "report_probe",
        missionId: "mission-report",
        auditReference: "audit://audrt/test/report-01",
        supportingEvidence: ["evid://audrt/test/report-01"],
      }),
    );
    const produced = engine.produceReport(sampleInput());
    assert.equal(produced.decision, "pass");
    assert.ok(produced.auditRuntimeReport);
    const report = produced.auditRuntimeReport!;
    assert.equal(report.runtimeVersion, AUDRT_RUNTIME_VERSION);
    assert.equal(report.reportVersion, AUDRT_REPORT_VERSION);
    assert.equal(report.metadataVersion, AUDRT_METADATA_VERSION);
    assert.equal(report.consumableByQ1014, true);
    assert.ok(typeof report.totalAuditRecords === "number");
    assert.ok(report.workerActivitySummary);
    assert.ok(report.missionActivitySummary);
    assert.ok(report.approvalSummary);
    assert.ok(report.recoverySummary);
    assert.ok(report.schedulingSummary);
    assert.ok(report.evidenceSummary);
    assert.ok(report.integrityVerification);
    assert.ok("auditStatus" in report);
    assert.ok(Array.isArray(report.outstandingIssues));
    assert.ok(typeof report.confidenceScore === "number");
    assert.equal(report.neverFabricateAuditEvidence, true);
    assert.equal(report.neverDeleteAuditRecords, true);
    assert.equal(report.neverExecuteBusinessLogic, true);
    assert.equal(report.neverModifyOperationalData, true);
    assert.equal(report.neverImplementQ1014OrLater, true);
    assert.equal(report.structuralSignalOnly, true);
    assert.equal(report.workerId, "wkr-audit-runtime-01");
  });

  test("11 Q1014 contract without implementing Shared Runtime Certification", async () => {
    const engine = await build();
    const contract = engine.getQ1014ConsumableContract();
    assert.equal(contract.producedBy, "audit-runtime");
    assert.equal(contract.missionId, "Q10-13");
    assert.equal(contract.consumerMissionId, "Q10-14");
    assert.equal(contract.neverImplementQ1014OrLater, true);
    assert.equal(contract.structuralSignalOnly, true);
    assert.ok(contract.exposedFields.includes("totalAuditRecords"));
    assert.ok(contract.exposedFields.includes("integrityVerification"));
    assert.ok(contract.notes.some((n) => n.toLowerCase().includes("shared runtime certification")));
    assert.ok(
      contract.notes.some((n) => n.includes("does not implement Shared Runtime Certification")),
    );
  });

  test("12 rejects fabricate / delete / governance bypass / Q10-14+ / business logic", async () => {
    const engine = await build();

    const fabricate = engine.validate(sampleInput({ fabricateAuditEvidence: true }));
    assert.equal(fabricate.decision, "fail");
    assert.ok(fabricate.errors.some((e) => e.toLowerCase().includes("fabricat")));

    const fabricateAlias = engine.validate(sampleInput({ fabricateEvidence: true }));
    assert.equal(fabricateAlias.decision, "fail");

    const del = engine.validate(sampleInput({ deleteAuditRecords: true }));
    assert.equal(del.decision, "fail");
    assert.ok(del.errors.some((e) => e.toLowerCase().includes("delete")));

    const bypass = engine.validate(sampleInput({ bypassPillowGovernance: true }));
    assert.equal(bypass.decision, "fail");
    assert.ok(bypass.errors.some((e) => e.toLowerCase().includes("pillow")));

    const gk = engine.validate(sampleInput({ bypassGrandKingApproval: true }));
    assert.equal(gk.decision, "fail");

    const biz = engine.validate(sampleInput({ executeBusinessLogic: true }));
    assert.equal(biz.decision, "fail");
    assert.ok(biz.errors.some((e) => e.toLowerCase().includes("business")));

    const ops = engine.validate(sampleInput({ modifyOperationalData: true }));
    assert.equal(ops.decision, "fail");

    const payload = engine.validate(sampleInput({ businessPayload: { x: 1 } }));
    assert.equal(payload.decision, "fail");

    const q1014 = engine.validate(sampleInput({ targetMissionId: "Q10-14" }));
    assert.equal(q1014.decision, "fail");
    assert.ok(q1014.errors.some((e) => e.includes("Q10-14")));

    const q1015 = engine.validate(sampleInput({ targetMissionId: "Q10-15" }));
    assert.equal(q1015.decision, "fail");

    const implement = engine.validate(sampleInput({ implementQ1014OrLater: true }));
    assert.equal(implement.decision, "fail");
  });
});
