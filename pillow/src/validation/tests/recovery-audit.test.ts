import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  ALL_RECOVERY_COMPONENT_KEYS,
  AUDIT_STATUSES,
  CHECK_STATUSES,
  READINESS_CLASSIFICATIONS,
  READINESS_DECISIONS,
  RECART_CAPABILITIES,
  RECART_METADATA_VERSION,
  RECOVERY_AUDIT_REPORT_VERSION,
  buildRecoveryAuditConfiguration,
  createRecoveryAudit,
  isForbiddenMissionId,
  resetRecoveryAuditForTesting,
  type RecartInput,
  type RecoveryAuditDependencies,
} from "../../recovery-audit/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleInput(overrides: Partial<RecartInput> = {}): RecartInput {
  return {
    grandKingInstructions:
      "Discover every recovery component strictly from injected handles, verify recovery CAPABILITY presence via typeof evidence only (never invoke destructive recovery side-effects), and classify recovery readiness deterministically; never fabricate evidence, never certify untested recovery, never mutate production via recovery calls, never override governance, Pillow, or Grand King.",
    pillowCommandConfirmed: true,
    grandKingApproved: true,
    validated: true,
    ...overrides,
  };
}

function allDependenciesReachable(): RecoveryAuditDependencies {
  const deps: Record<string, unknown> = {};
  deps.recoveryRuntime = {
    getState: () => ({ status: "active" }),
    detectFailure: () => ({ detected: false }),
    restoreState: () => ({ restored: true }),
    restartJob: () => ({ restarted: true }),
    resumeWorkflow: () => ({ resumed: true }),
    rollback: () => ({ rolledBack: true }),
  };
  deps.monitoringRuntime = {
    getState: () => ({ status: "active" }),
    getDashboard: () => ({ panels: [] }),
  };
  deps.queueRuntime = { getState: () => ({ status: "active", metrics: { depth: 0 } }) };
  deps.missionRuntime = {
    getState: () => ({ status: "active" }),
    resume: () => ({ ok: true }),
    recover: () => ({ ok: true }),
    getCheckpoints: () => [],
  };
  deps.auditRuntime = {
    getState: () => ({ status: "active" }),
    query: () => [],
  };
  deps.executiveReportingRuntime = {
    getState: () => ({ status: "active" }),
    submitWorkerReport: () => ({ records: [{ reportId: "ert-recart-test" }] }),
    retrieveReport: () => ({ report: {} }),
  };
  deps.productionCertificationCore = {
    getState: () => ({ status: "active" }),
    getCertificationResults: () => [],
  };
  deps.pillowOrchestrationRuntime = {
    getState: () => ({ status: "active" }),
    invokeWorkflow: () => ({ dispatched: true }),
  };
  deps.workerRegistry = {
    getState: () => ({ status: "active" }),
    listWorkers: () => [{ workerId: "wkr-1" }],
    registerWorker: () => ({ ok: true }),
  };
  deps.sharedRuntimeCore = {
    getState: () => ({ status: "active" }),
    getCatalog: () => ({ factories: [] }),
  };
  deps.workerRecoverySystem = {
    getState: () => ({ status: "active" }),
    recoverWorker: () => ({ ok: true }),
  };
  deps.recoveryManager = {
    getState: () => ({ status: "active" }),
    manageRecovery: () => ({ ok: true }),
  };
  deps.rollbackManager = {
    getState: () => ({ status: "active" }),
    rollback: () => ({ ok: true }),
  };
  deps.performanceAudit = {
    getState: () => ({ status: "active" }),
    getQ1107ConsumableContract: () => ({
      contractVersion: "PERFART-001-v1",
      consumerMissionId: "Q11-07",
      exposedFields: ["assessments", "performanceReadinessSummary"],
    }),
  };
  return deps as RecoveryAuditDependencies;
}

async function build(config?: Parameters<typeof createRecoveryAudit>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  if (bootstrap.status !== "ready") {
    throw new Error("Bootstrap failed to reach ready state for Recovery Audit tests");
  }
  const engine = createRecoveryAudit(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

async function buildFullyReachable() {
  return build({ dependencies: allDependenciesReachable() });
}

describe("Q11-07 Recovery Audit", () => {
  beforeEach(resetRecoveryAuditForTesting);

  test("1 locks mandatory boundaries", () => {
    const c = buildRecoveryAuditConfiguration(REPO_ROOT, {
      neverFabricateRecoveryEvidence: false as never,
      neverCertifyUntestedRecovery: false as never,
      neverMutateProductionViaRecoveryCalls: false as never,
      neverAssumeImplementation: false as never,
      neverModifyRecoveryImplementations: false as never,
      neverRepairFailedRecoveryComponents: false as never,
      neverBypassPillowGovernance: false as never,
      neverBypassGrandKingApproval: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ1108OrLater: false as never,
    });
    assert.equal(c.neverFabricateRecoveryEvidence, true);
    assert.equal(c.neverCertifyUntestedRecovery, true);
    assert.equal(c.neverMutateProductionViaRecoveryCalls, true);
    assert.equal(c.neverAssumeImplementation, true);
    assert.equal(c.neverModifyRecoveryImplementations, true);
    assert.equal(c.neverRepairFailedRecoveryComponents, true);
    assert.equal(c.neverBypassPillowGovernance, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ1108OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveImmutableRecoveryHistory, true);
    assert.equal(c.preserveAuditHistory, true);
    assert.equal(c.deterministicAuditBehaviour, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.evidenceBasedOnly, true);
    assert.equal(c.maskSensitiveValues, true);
  });

  test("2 initializes PILLOW-RECART-001 Q11-07", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q11-07");
    assert.equal(state.engineVersion, "PILLOW-RECART-001");
    assert.equal(state.configuration.workerId, "wkr-recovery-audit-01");
    assert.equal(state.configuration.factory, "recovery-audit");
    assert.ok(RECART_CAPABILITIES.includes("discover_recovery_components"));
    assert.ok(RECART_CAPABILITIES.includes("verify_failure_detection"));
    assert.ok(RECART_CAPABILITIES.includes("verify_rollback_capability"));
    assert.ok(RECART_CAPABILITIES.includes("classify_recovery_readiness"));
    assert.ok(RECART_CAPABILITIES.includes("expose_q1108_consumable_contract"));
    assert.ok(RECART_CAPABILITIES.includes("consume_q1107_consumable_contract"));
    for (const classification of READINESS_CLASSIFICATIONS) {
      assert.ok(
        ["certified", "partially_certified", "failed", "missing", "blocked", "deferred"].includes(classification),
      );
    }
    for (const decision of READINESS_DECISIONS) {
      assert.ok(["certify", "withhold", "escalate", "defer"].includes(decision));
    }
    for (const status of CHECK_STATUSES) {
      assert.ok(["Passed", "Partial", "Failed", "Missing"].includes(status));
    }
  });

  test("3 discovers recovery components strictly from injected handles", async () => {
    const engineNoHandles = await build();
    const noHandleDiscovery = engineNoHandles.discoverRecoveryComponents();
    assert.equal(noHandleDiscovery.discoveredCount, 0);
    assert.equal(noHandleDiscovery.totalCatalogued, ALL_RECOVERY_COMPONENT_KEYS.length);

    const engine = await buildFullyReachable();
    const discovery = engine.discoverRecoveryComponents();
    assert.equal(discovery.discoveredCount, ALL_RECOVERY_COMPONENT_KEYS.length);
    for (const component of discovery.components) {
      assert.ok((ALL_RECOVERY_COMPONENT_KEYS as readonly string[]).includes(component.componentKey));
      assert.equal(component.bound, true);
      assert.equal(component.evidencePresent, true);
    }
  });

  test("4 verifies failure detection via capability presence only", async () => {
    const engine = await buildFullyReachable();
    const rows = engine.verifyFailureDetection();
    assert.equal(rows.length, ALL_RECOVERY_COMPONENT_KEYS.length);
    for (const row of rows) {
      assert.ok(CHECK_STATUSES.includes(row.detectionStatus));
      assert.ok(row.evidence.length > 0);
      assert.ok(!row.evidence.join(" ").includes("invoked detectFailure"), "must never invoke detectFailure");
    }

    const bareEngine = await build();
    const bareRows = bareEngine.verifyFailureDetection();
    for (const row of bareRows) {
      assert.equal(row.detectionStatus, "Missing");
    }
  });

  test("5 verifies automatic/manual recovery and rollback capability presence", async () => {
    const engine = await buildFullyReachable();
    const autoRows = engine.verifyAutomaticRecovery();
    const manualRows = engine.verifyManualRecovery();
    const rollbackRows = engine.verifyRollbackCapability();
    assert.equal(autoRows.length, ALL_RECOVERY_COMPONENT_KEYS.length);
    assert.equal(manualRows.length, ALL_RECOVERY_COMPONENT_KEYS.length);
    assert.equal(rollbackRows.length, ALL_RECOVERY_COMPONENT_KEYS.length);

    const recoveryRuntimeRow = rollbackRows.find((r) => r.componentId === "recovery-runtime");
    assert.ok(recoveryRuntimeRow);
    assert.equal(recoveryRuntimeRow!.rollbackStatus, "Passed");
    assert.ok(recoveryRuntimeRow!.evidence.some((e) => e.includes("NEVER invoked")));
  });

  test("6 verifies workflow restart and checkpoint restoration presence", async () => {
    const engine = await buildFullyReachable();
    const restartRows = engine.verifyWorkflowRestart();
    const checkpointRows = engine.verifyCheckpointRestoration();
    assert.equal(restartRows.length, ALL_RECOVERY_COMPONENT_KEYS.length);
    assert.equal(checkpointRows.length, ALL_RECOVERY_COMPONENT_KEYS.length);

    const missionRow = checkpointRows.find((r) => r.componentId === "mission-runtime");
    assert.ok(missionRow);
    assert.equal(missionRow!.checkpointStatus, "Passed");
  });

  test("7 verifies recovery escalation and enterprise resilience", async () => {
    const engine = await buildFullyReachable();
    const escalationRows = engine.verifyRecoveryEscalation();
    const resilienceRows = engine.verifyEnterpriseResilience();
    assert.equal(escalationRows.length, ALL_RECOVERY_COMPONENT_KEYS.length);
    assert.equal(resilienceRows.length, ALL_RECOVERY_COMPONENT_KEYS.length);
    for (const row of resilienceRows) {
      assert.ok(READINESS_CLASSIFICATIONS.includes(row.resilienceClassification));
    }
  });

  test("8 recovery readiness classifications + full Recovery Audit Report + consumableByQ1108", async () => {
    const engine = await buildFullyReachable();
    const report = await engine.produceReport(sampleInput());
    assert.ok(["pass", "partial"].includes(report.validation.decision));
    assert.ok(report.reportId.startsWith("recart-rpt-"));
    assert.ok(report.timestamp);
    assert.equal(report.auditVersion, "Q11-RECART-v1");
    assert.equal(report.engineId, "PILLOW-RECART-001");
    assert.equal(report.missionId, "Q11-07");
    assert.equal(report.totalRecoveryComponents, ALL_RECOVERY_COMPONENT_KEYS.length);
    assert.equal(
      report.certifiedComponents +
        report.partiallyCertifiedComponents +
        report.failedComponents +
        report.missingComponents +
        report.blockedComponents +
        report.deferredComponents,
      ALL_RECOVERY_COMPONENT_KEYS.length,
    );
    assert.ok(report.recoverySummary);
    assert.ok(report.failureDetectionSummary);
    assert.ok(report.restartSummary);
    assert.ok(report.rollbackSummary);
    assert.ok(report.checkpointSummary);
    assert.ok(report.escalationSummary);
    assert.ok(report.resilienceSummary);
    assert.ok(report.integrationSummary);
    assert.ok(report.governanceSummary);
    assert.ok(Array.isArray(report.supportingEvidence));
    assert.ok(Array.isArray(report.outstandingRisks));
    assert.ok(report.confidenceScore >= 0 && report.confidenceScore <= 1);
    assert.equal(report.metadataVersion, RECART_METADATA_VERSION);
    assert.equal(report.reportVersion, RECOVERY_AUDIT_REPORT_VERSION);
    assert.equal(report.workerId, "wkr-recovery-audit-01");
    assert.ok(READINESS_DECISIONS.includes(report.decision));
    assert.equal(report.decision, "certify");
    assert.equal(report.certifiedComponents, ALL_RECOVERY_COMPONENT_KEYS.length);
    assert.ok(report.validation);
    assert.equal(report.consumableByQ1108, true);
    assert.equal(report.neverImplementQ1108OrLater, true);
    assert.equal(report.structuralSignalOnly, true);
    assert.equal(report.evidenceBasedOnly, true);
    assert.equal(report.seventhQ11Gate, true);
    assert.ok(report.q1107ContractConsumed);
    assert.equal(report.q1107ContractConsumed.attempted, true);
    assert.equal(report.q1107ContractConsumed.consumed, true);
    assert.equal(report.componentInventory.length, ALL_RECOVERY_COMPONENT_KEYS.length);
    assert.equal(report.assessments.length, ALL_RECOVERY_COMPONENT_KEYS.length);
    for (const row of report.assessments) {
      assert.ok(row.componentId.length > 0);
      assert.ok(row.componentType.length > 0);
      assert.ok(row.recoveryCheckId.length > 0);
      assert.ok(row.failureScenario.length > 0);
      assert.ok(CHECK_STATUSES.includes(row.detectionStatus));
      assert.ok(CHECK_STATUSES.includes(row.recoveryStatus));
      assert.ok(CHECK_STATUSES.includes(row.restartStatus));
      assert.ok(CHECK_STATUSES.includes(row.rollbackStatus));
      assert.ok(CHECK_STATUSES.includes(row.checkpointStatus));
      assert.ok(CHECK_STATUSES.includes(row.escalationStatus));
      assert.ok(READINESS_CLASSIFICATIONS.includes(row.resilienceClassification));
      assert.ok(Array.isArray(row.supportingEvidence));
      assert.ok(row.auditReference.length > 0);
      assert.ok(row.auditTimestamp.length > 0);
    }
    assert.ok(AUDIT_STATUSES.includes(report.auditStatus));
    assert.equal(report.auditStatus, "certified");
    const serialized = JSON.stringify(report).toLowerCase();
    assert.ok(!serialized.includes("financial readiness audit implemented"), "must never claim to implement Financial Readiness Audit");
    assert.ok(!serialized.includes("password="), "must never expose password values in the report");
  });

  test("9 exposes Q1108 contract without implementing Financial Readiness Audit", async () => {
    const engine = await buildFullyReachable();
    const contract = engine.getQ1108ConsumableContract();
    assert.equal(contract.producedBy, "recovery-audit");
    assert.equal(contract.missionId, "Q11-07");
    assert.equal(contract.consumerMissionId, "Q11-08");
    assert.ok(contract.exposedFields.length > 0);
    assert.ok(contract.readinessClassificationCatalog.length > 0);
    assert.ok(contract.decisionCatalog.length > 0);
    assert.equal(contract.neverImplementQ1108OrLater, true);
    assert.equal(contract.structuralSignalOnly, true);
    assert.ok(
      !JSON.stringify(contract).toLowerCase().includes("financial readiness audit implemented"),
      "must never claim to implement Financial Readiness Audit",
    );

    const report = await engine.produceReport(sampleInput());
    assert.equal(report.q1107ContractConsumed.attempted, true);
    assert.equal(report.q1107ContractConsumed.consumed, true);
  });

  test("10 rejects fabricate / certify-untested / mutate-production / governance bypass", async () => {
    const engine = await buildFullyReachable();
    for (const forbidden of [
      { fabricateRecoveryEvidence: true },
      { forceFail: true },
      { certifyUntestedRecovery: true },
      { mutateProductionViaRecoveryCalls: true },
      { assumeImplementation: true },
      { modifyRecoveryImplementations: true },
      { repairFailedRecoveryComponents: true },
      { bypassPillowGovernance: true },
      { bypassGrandKingApproval: true },
      { overrideApprovedArchitecture: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ1108OrLater: true },
    ] as const) {
      const report = await engine.produceReport({
        ...sampleInput(),
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail", `expected fail for ${JSON.stringify(forbidden)}`);
      assert.equal(report.decision, "escalate");
    }
  });

  test("11 rejects Q11-08+ missionId", async () => {
    const engine = await buildFullyReachable();
    assert.equal(isForbiddenMissionId("Q11-07"), false);
    for (const missionId of ["Q11-08", "Q11-09", "Q12-01", "Q20-01"]) {
      assert.equal(isForbiddenMissionId(missionId), true, `expected forbidden: ${missionId}`);
      const report = await engine.produceReport({
        ...sampleInput(),
        missionId,
      });
      assert.equal(report.validation.decision, "fail", `expected fail for ${missionId}`);
      assert.equal(report.decision, "escalate");
    }
    const selfOk = await engine.produceReport({ ...sampleInput(), missionId: "Q11-07" });
    assert.notEqual(selfOk.decision, "escalate");
  });

  test("12 cockpit + never implements Q1108+ + consumes Q1107 when injected", async () => {
    const engine = await buildFullyReachable();
    await engine.produceReport(sampleInput());
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q11-07");
    assert.ok(cockpit.totalReports >= 1);
    assert.equal(cockpit.lastDecision, "certify");
    assert.equal(cockpit.workerId, "wkr-recovery-audit-01");
    assert.deepEqual([...cockpit.readinessClassificationOptions].sort(), [...READINESS_CLASSIFICATIONS].sort());
    assert.equal(cockpit.neverFabricateRecoveryEvidence, true);
    assert.equal(cockpit.neverMutateProductionViaRecoveryCalls, true);
    assert.equal(cockpit.neverImplementQ1108OrLater, true);
    assert.equal(cockpit.seventhQ11Gate, true);

    const diagnostics = engine.runDiagnostics();
    assert.equal(diagnostics.missionId, "Q11-07");
    assert.ok(engine.getAuditTrail().length >= 1);
    assert.ok(engine.getCatalog());
    assert.ok(engine.getReports().length >= 1);
    assert.ok(engine.list().length >= 1);
    assert.ok(engine.getRecoveryMatrix().length > 0);
    assert.ok(engine.getRecoveryHistory().length > 0);

    const sync = engine.validateForSupervisorSync();
    assert.notEqual(sync.health, "blocked");
    assert.ok(sync.readinessScore > 0);

    const bareEngine = await build();
    const bareReport = await bareEngine.produceReport(sampleInput());
    assert.equal(bareReport.q1107ContractConsumed.attempted, false);
    assert.equal(bareReport.q1107ContractConsumed.consumed, false);
  });
});
