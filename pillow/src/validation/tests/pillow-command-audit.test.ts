import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { DEFAULT_SEED_WORKERS } from "../../worker-registry/index.js";
import {
  AUDIT_STATUSES,
  CHECK_STATUSES,
  READINESS_CLASSIFICATIONS,
  READINESS_DECISIONS,
  PCART_CAPABILITIES,
  PCART_METADATA_VERSION,
  PILLOW_COMMAND_AUDIT_REPORT_VERSION,
  buildPillowCommandAuditConfiguration,
  createPillowCommandAudit,
  isForbiddenMissionId,
  resetPillowCommandAuditForTesting,
  type PcartInput,
  type PillowCommandAuditDependencies,
} from "../../pillow-command-audit/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleInput(overrides: Partial<PcartInput> = {}): PcartInput {
  return {
    grandKingInstructions:
      "Discover every registered worker, verify assignment/command dispatch/communication/supervision/progress tracking/result collection/governance, and classify command readiness from observed evidence only; never fabricate, never certify unverified command capability, never override governance, Pillow, or Grand King.",
    pillowCommandConfirmed: true,
    grandKingApproved: true,
    validated: true,
    ...overrides,
  };
}

/** Full evidence stubs: workerRegistry.listWorkers returning 5 seed-shaped workers,
 * orchestration.invokeWorker stub, communication send/ack stubs, mission.createMission
 * stub, workerReadinessAudit.getQ1103ConsumableContract, ERR submitWorkerReport. */
function allDependenciesReachable(): PillowCommandAuditDependencies {
  const deps: Record<string, unknown> = {};
  deps.workerRegistry = {
    listWorkers: () => DEFAULT_SEED_WORKERS.map((w) => ({ ...w })),
    registerWorker: () => ({ ok: true }),
  };
  deps.workerReadinessAudit = {
    getState: () => ({ status: "active" }),
    getQ1103ConsumableContract: () => ({
      contractVersion: "WRART-001-v1",
      consumerMissionId: "Q11-03",
      exposedFields: ["readinessMatrix", "readinessSummary"],
    }),
  };
  deps.productionCertificationCore = { getState: () => ({ status: "active" }) };
  deps.pillowOrchestrationRuntime = {
    getState: () => ({ status: "active" }),
    invokeWorker: () => ({ dispatched: true }),
    retrieveReport: () => ({ report: {} }),
  };
  deps.communicationRuntime = {
    getState: () => ({ status: "active" }),
    sendMessage: () => ({ sent: true }),
    acknowledgeMessage: () => ({ acknowledged: true }),
  };
  deps.missionRuntime = {
    getState: () => ({ status: "active" }),
    createMission: () => ({ missionId: "mission-test" }),
  };
  deps.monitoringRuntime = {
    getState: () => ({ status: "active" }),
    produceReport: () => ({ report: {} }),
    list: () => [],
  };
  deps.auditRuntime = { getState: () => ({ status: "active" }) };
  deps.executiveReportingRuntime = {
    submitWorkerReport: () => ({ records: [{ reportId: "ert-pcart-test" }] }),
    retrieveReport: () => ({ report: {} }),
  };
  return deps as PillowCommandAuditDependencies;
}

async function build(config?: Parameters<typeof createPillowCommandAudit>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  if (bootstrap.status !== "ready") {
    throw new Error("Bootstrap failed to reach ready state for Pillow Command Audit tests");
  }
  const engine = createPillowCommandAudit(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

async function buildFullyReachable() {
  return build({ dependencies: allDependenciesReachable() });
}

describe("Q11-03 Pillow Command Audit", () => {
  beforeEach(resetPillowCommandAuditForTesting);

  test("1 locks mandatory boundaries", () => {
    const c = buildPillowCommandAuditConfiguration(REPO_ROOT, {
      neverFabricateAuditEvidence: false as never,
      neverCertifyUnverifiedCommandCapability: false as never,
      neverAssumeImplementation: false as never,
      neverModifyWorkerImplementations: false as never,
      neverRepairFailedWorkers: false as never,
      neverBypassPillowGovernance: false as never,
      neverBypassGrandKingApproval: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ1104OrLater: false as never,
    });
    assert.equal(c.neverFabricateAuditEvidence, true);
    assert.equal(c.neverCertifyUnverifiedCommandCapability, true);
    assert.equal(c.neverAssumeImplementation, true);
    assert.equal(c.neverModifyWorkerImplementations, true);
    assert.equal(c.neverRepairFailedWorkers, true);
    assert.equal(c.neverBypassPillowGovernance, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ1104OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveImmutableAuditHistory, true);
    assert.equal(c.preserveAuditHistory, true);
    assert.equal(c.deterministicAuditBehaviour, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.evidenceBasedOnly, true);
    assert.equal(c.maskSensitiveValues, true);
  });

  test("2 initializes PILLOW-PCART-001 Q11-03", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q11-03");
    assert.equal(state.engineVersion, "PILLOW-PCART-001");
    assert.equal(state.configuration.workerId, "wkr-pillow-command-audit-01");
    assert.equal(state.configuration.factory, "pillow-command-audit");
    assert.ok(PCART_CAPABILITIES.includes("discover_registered_workers"));
    assert.ok(PCART_CAPABILITIES.includes("verify_worker_assignment"));
    assert.ok(PCART_CAPABILITIES.includes("verify_command_dispatch"));
    assert.ok(PCART_CAPABILITIES.includes("classify_command_readiness"));
    assert.ok(PCART_CAPABILITIES.includes("expose_q1104_consumable_contract"));
    assert.ok(PCART_CAPABILITIES.includes("consume_q1103_consumable_contract"));
    for (const classification of READINESS_CLASSIFICATIONS) {
      assert.ok(
        ["Ready", "Partially Ready", "Failed", "Missing", "Blocked", "Deferred"].includes(classification),
      );
    }
    for (const decision of READINESS_DECISIONS) {
      assert.ok(["Ready", "Conditionally_Ready", "Not_Ready", "Failed", "Deferred"].includes(decision));
    }
    for (const status of CHECK_STATUSES) {
      assert.ok(["Passed", "Partial", "Failed", "Missing"].includes(status));
    }
  });

  test("3 verifies worker discovery from injectable registry", async () => {
    const engineNoRegistry = await build();
    const noRegistryDiscovery = await engineNoRegistry.discoverWorkers();
    assert.equal(noRegistryDiscovery.registryInjected, false);
    assert.equal(noRegistryDiscovery.discoveredCount, 0);

    const engine = await buildFullyReachable();
    const discovery = await engine.discoverWorkers();
    assert.equal(discovery.registryInjected, true);
    assert.equal(discovery.discoveredCount, 5);
    assert.equal(discovery.discoveredCount, DEFAULT_SEED_WORKERS.length);
    for (const worker of discovery.workers) {
      assert.ok(worker.workerId.length > 0);
      const seed = DEFAULT_SEED_WORKERS.find((w) => w.workerId === worker.workerId);
      assert.ok(seed, `${worker.workerId} not in DEFAULT_SEED_WORKERS`);
    }
  });

  test("4 verifies assignment capability structurally", async () => {
    const engine = await buildFullyReachable();
    const rows = await engine.verifyAssignment();
    assert.equal(rows.length, 5);
    for (const row of rows) {
      assert.ok(row.workerId.length > 0);
      assert.ok(CHECK_STATUSES.includes(row.assignmentStatus));
      assert.equal(row.assignmentStatus, "Passed");
      assert.ok(Array.isArray(row.evidence));
    }

    const engineNoMission = await build({
      dependencies: { workerRegistry: { listWorkers: () => DEFAULT_SEED_WORKERS.map((w) => ({ ...w })) } },
    });
    const rowsNoMission = await engineNoMission.verifyAssignment();
    for (const row of rowsNoMission) {
      assert.equal(row.assignmentStatus, "Partial");
    }
  });

  test("5 verifies command dispatch (invokeWorker presence -> Passed)", async () => {
    const engine = await buildFullyReachable();
    const rows = await engine.verifyCommandDispatch();
    assert.equal(rows.length, 5);
    for (const row of rows) {
      assert.equal(row.dispatchStatus, "Passed");
      assert.ok(row.commandId.startsWith("cmd-pcart-"));
      assert.ok(Array.isArray(row.evidence));
    }

    const engineNoOrchestration = await build({
      dependencies: { workerRegistry: { listWorkers: () => DEFAULT_SEED_WORKERS.map((w) => ({ ...w })) } },
    });
    const rowsMissing = await engineNoOrchestration.verifyCommandDispatch();
    for (const row of rowsMissing) {
      assert.equal(row.dispatchStatus, "Missing");
      assert.ok(row.commandId.startsWith("cmd-pcart-"));
    }
  });

  test("6 verifies communication paths (sendMessage/acknowledgeMessage)", async () => {
    const engine = await buildFullyReachable();
    const rows = await engine.verifyCommunication();
    assert.equal(rows.length, 5);
    for (const row of rows) {
      assert.equal(row.communicationStatus, "Passed");
      assert.ok(Array.isArray(row.evidence));
    }

    const engineSendOnly = await build({
      dependencies: {
        workerRegistry: { listWorkers: () => DEFAULT_SEED_WORKERS.map((w) => ({ ...w })) },
        communicationRuntime: { sendMessage: () => ({ sent: true }) },
      },
    });
    const rowsPartial = await engineSendOnly.verifyCommunication();
    for (const row of rowsPartial) {
      assert.equal(row.communicationStatus, "Partial");
    }

    const engineNone = await build({
      dependencies: { workerRegistry: { listWorkers: () => DEFAULT_SEED_WORKERS.map((w) => ({ ...w })) } },
    });
    const rowsMissing = await engineNone.verifyCommunication();
    for (const row of rowsMissing) {
      assert.equal(row.communicationStatus, "Missing");
    }
  });

  test("7 verifies supervision + progress tracking + result collection", async () => {
    const engine = await buildFullyReachable();
    const rows = await engine.verifySupervision();
    assert.equal(rows.length, 5);
    for (const row of rows) {
      assert.ok(CHECK_STATUSES.includes(row.supervisionStatus));
      assert.ok(CHECK_STATUSES.includes(row.progressStatus));
      assert.ok(CHECK_STATUSES.includes(row.resultStatus));
      assert.equal(row.supervisionStatus, "Passed");
      assert.equal(row.progressStatus, "Passed");
      assert.equal(row.resultStatus, "Passed");
      assert.ok(Array.isArray(row.evidence));
    }

    const engineBare = await build({
      dependencies: { workerRegistry: { listWorkers: () => DEFAULT_SEED_WORKERS.map((w) => ({ ...w })) } },
    });
    const rowsBare = await engineBare.verifySupervision();
    for (const row of rowsBare) {
      assert.equal(row.supervisionStatus, "Missing");
      assert.equal(row.progressStatus, "Missing");
      assert.equal(row.resultStatus, "Missing");
    }
  });

  test("8 command readiness classifications + full Pillow Command Audit Report + consumableByQ1104", async () => {
    const engine = await buildFullyReachable();
    const report = await engine.produceReport(sampleInput());
    assert.ok(["pass", "partial"].includes(report.validation.decision));
    assert.ok(report.reportId.startsWith("pcart-rpt-"));
    assert.ok(report.timestamp);
    assert.equal(report.auditVersion, "Q11-PCART-v1");
    assert.equal(report.totalWorkersAudited, 5);
    assert.equal(
      report.successfullyControlledWorkers +
        report.partiallyControlledWorkers +
        report.failedCommandTests +
        report.missingCommandWorkers +
        report.blockedCommandWorkers +
        report.deferredCommandWorkers,
      5,
    );
    assert.ok(report.communicationSummary);
    assert.ok(report.assignmentSummary);
    assert.ok(report.supervisionSummary);
    assert.ok(report.governanceSummary);
    assert.ok(Array.isArray(report.supportingEvidence));
    assert.ok(Array.isArray(report.outstandingIssues));
    assert.ok(report.confidenceScore >= 0 && report.confidenceScore <= 1);
    assert.equal(report.metadataVersion, PCART_METADATA_VERSION);
    assert.equal(report.reportVersion, PILLOW_COMMAND_AUDIT_REPORT_VERSION);
    assert.equal(report.workerId, "wkr-pillow-command-audit-01");
    assert.ok(READINESS_DECISIONS.includes(report.commandReadinessDecision));
    // 4/5 seed workers are fully certified and reportsToPillow (Ready); the
    // remaining seed worker is pending-certified/registered (governance
    // Partial -> Partially Ready), so the deterministic gate yields
    // Conditionally_Ready overall.
    assert.equal(report.commandReadinessDecision, "Conditionally_Ready");
    assert.ok(report.validation);
    assert.equal(report.consumableByQ1104, true);
    assert.equal(report.neverImplementQ1104OrLater, true);
    assert.equal(report.structuralSignalOnly, true);
    assert.equal(report.evidenceBasedOnly, true);
    assert.equal(report.firstPillowCommandGate, true);
    assert.ok(report.q1103ContractConsumed);
    assert.equal(report.q1103ContractConsumed.attempted, true);
    assert.equal(report.q1103ContractConsumed.consumed, true);
    assert.equal(report.workerInventory.length, 5);
    assert.equal(report.commandMatrix.length, 5);
    for (const row of report.commandMatrix) {
      assert.ok(row.workerId.length > 0);
      assert.ok(row.factoryId.length > 0);
      assert.ok(row.commandId.length > 0);
      assert.ok(CHECK_STATUSES.includes(row.assignmentStatus));
      assert.ok(CHECK_STATUSES.includes(row.communicationStatus));
      assert.ok(CHECK_STATUSES.includes(row.supervisionStatus));
      assert.ok(CHECK_STATUSES.includes(row.progressStatus));
      assert.ok(CHECK_STATUSES.includes(row.resultStatus));
      assert.ok(CHECK_STATUSES.includes(row.governanceStatus));
      assert.ok(READINESS_CLASSIFICATIONS.includes(row.readinessClassification));
      assert.ok(Array.isArray(row.supportingEvidence));
      assert.ok(row.auditReference.length > 0);
      assert.ok(row.auditTimestamp.length > 0);
    }
    assert.ok(AUDIT_STATUSES.includes(report.auditStatus));
    assert.ok(
      !JSON.stringify(report).toLowerCase().includes("factory readiness audit implemented"),
      "must never claim to implement Factory Readiness Audit",
    );
  });

  test("9 exposes Q1104 contract without implementing Factory Readiness Audit", async () => {
    const engine = await buildFullyReachable();
    const contract = engine.getQ1104ConsumableContract();
    assert.equal(contract.producedBy, "pillow-command-audit");
    assert.equal(contract.missionId, "Q11-03");
    assert.equal(contract.consumerMissionId, "Q11-04");
    assert.ok(contract.exposedFields.length > 0);
    assert.ok(contract.readinessClassificationCatalog.length > 0);
    assert.ok(contract.commandReadinessDecisionCatalog.length > 0);
    assert.equal(contract.neverImplementQ1104OrLater, true);
    assert.equal(contract.structuralSignalOnly, true);
    assert.ok(
      !JSON.stringify(contract).toLowerCase().includes("factory readiness audit implemented"),
      "must never claim to implement Factory Readiness Audit",
    );

    const report = await engine.produceReport(sampleInput());
    assert.equal(report.q1103ContractConsumed.attempted, true);
    assert.equal(report.q1103ContractConsumed.consumed, true);
  });

  test("10 rejects fabricate / certify-unverified / governance bypass", async () => {
    const engine = await buildFullyReachable();
    for (const forbidden of [
      { fabricateAuditEvidence: true },
      { forceFail: true },
      { certifyUnverifiedCommandCapability: true },
      { assumeImplementation: true },
      { modifyWorkerImplementations: true },
      { repairFailedWorkers: true },
      { bypassPillowGovernance: true },
      { bypassGrandKingApproval: true },
      { overrideApprovedArchitecture: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ1104OrLater: true },
    ] as const) {
      const report = await engine.produceReport({
        ...sampleInput(),
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail", `expected fail for ${JSON.stringify(forbidden)}`);
      assert.equal(report.commandReadinessDecision, "Failed");
    }
  });

  test("11 rejects Q11-04+ missionId", async () => {
    const engine = await buildFullyReachable();
    assert.equal(isForbiddenMissionId("Q11-03"), false);
    for (const missionId of ["Q11-04", "Q11-05", "Q12-01", "Q20-01"]) {
      assert.equal(isForbiddenMissionId(missionId), true, `expected forbidden: ${missionId}`);
      const report = await engine.produceReport({
        ...sampleInput(),
        missionId,
      });
      assert.equal(report.validation.decision, "fail", `expected fail for ${missionId}`);
      assert.equal(report.commandReadinessDecision, "Failed");
    }
    const selfOk = await engine.produceReport({ ...sampleInput(), missionId: "Q11-03" });
    assert.notEqual(selfOk.commandReadinessDecision, "Failed");
  });

  test("12 cockpit + never implements Q11-04 + consumes Q1103 when injected", async () => {
    const engine = await buildFullyReachable();
    await engine.produceReport(sampleInput());
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q11-03");
    assert.ok(cockpit.totalReports >= 1);
    assert.equal(cockpit.lastCommandReadinessDecision, "Conditionally_Ready");
    assert.equal(cockpit.workerId, "wkr-pillow-command-audit-01");
    assert.deepEqual([...cockpit.readinessClassificationOptions].sort(), [...READINESS_CLASSIFICATIONS].sort());
    assert.equal(cockpit.neverFabricateAuditEvidence, true);
    assert.equal(cockpit.neverImplementQ1104OrLater, true);
    assert.equal(cockpit.thirdQ11Gate, true);

    const diagnostics = engine.runDiagnostics();
    assert.equal(diagnostics.missionId, "Q11-03");
    assert.ok(engine.getAuditTrail().length >= 1);
    assert.ok(engine.getCatalog());
    assert.ok(engine.getReports().length >= 1);
    assert.ok(engine.list().length >= 1);
    assert.ok(engine.getCommandMatrix().length > 0);

    const sync = engine.validateForSupervisorSync();
    assert.notEqual(sync.health, "blocked");
    assert.ok(sync.readinessScore > 0);

    // No workerReadinessAudit injected -> Q1103 contract handshake not attempted.
    const bareEngine = await build();
    const bareReport = await bareEngine.produceReport(sampleInput());
    assert.equal(bareReport.q1103ContractConsumed.attempted, false);
    assert.equal(bareReport.q1103ContractConsumed.consumed, false);
  });
});
