import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import { DEFAULT_SEED_WORKERS } from "../../worker-registry/index.js";
import {
  AUDIT_STATUSES,
  CHECK_STATUSES,
  FACTORY_KEYS,
  READINESS_CLASSIFICATIONS,
  READINESS_DECISIONS,
  WRART_CAPABILITIES,
  WRART_METADATA_VERSION,
  WORKER_READINESS_AUDIT_REPORT_VERSION,
  buildWorkerReadinessAuditConfiguration,
  createWorkerReadinessAudit,
  isForbiddenMissionId,
  resetWorkerReadinessAuditForTesting,
  type WrartInput,
  type WorkerReadinessAuditDependencies,
} from "../../worker-readiness-audit/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleInput(overrides: Partial<WrartInput> = {}): WrartInput {
  return {
    grandKingInstructions:
      "Discover every registered worker, verify registration/reachability/configuration/governance/permissions/runtime connectivity/operational capability, and classify readiness from observed evidence only; never fabricate, never certify missing or unreachable workers, never override governance, Pillow, or Grand King.",
    pillowCommandConfirmed: true,
    grandKingApproved: true,
    validated: true,
    ...overrides,
  };
}

/** Full evidence stubs: workerRegistry.listWorkers returning 5 seed-shaped workers,
 * productionCertificationCore.getQ1102ConsumableContract stub, sharedRuntimeCore.listFactories,
 * ERR submitWorkerReport. */
function allDependenciesReachable(): WorkerReadinessAuditDependencies {
  const deps: Record<string, unknown> = {};
  deps.workerRegistry = {
    listWorkers: () => DEFAULT_SEED_WORKERS.map((w) => ({ ...w })),
    registerWorker: () => ({ ok: true }),
  };
  deps.productionCertificationCore = {
    getState: () => ({ status: "active" }),
    getQ1102ConsumableContract: () => ({
      contractVersion: "PCCRT-001-v1",
      consumerMissionId: "Q11-02",
      exposedFields: ["certificationResults", "readinessSummary"],
    }),
  };
  deps.sharedRuntimeCore = {
    getState: () => ({ status: "active" }),
    listFactories: () =>
      FACTORY_KEYS.map((factoryKey) => ({ factoryKey, factoryName: factoryKey, healthStatus: "healthy" })),
  };
  deps.pillowOrchestrationRuntime = { getState: () => ({ status: "active" }) };
  deps.monitoringRuntime = { getState: () => ({ status: "active" }) };
  deps.auditRuntime = { getState: () => ({ status: "active" }) };
  deps.workerLifecycle = { createWorker: () => ({}), activateWorker: () => ({}) };
  deps.executiveReportingRuntime = {
    submitWorkerReport: () => ({ records: [{ reportId: "ert-wrart-test" }] }),
  };
  deps.workerHandles = Object.fromEntries(
    DEFAULT_SEED_WORKERS.map((w) => [w.workerId, { getState: () => ({ status: "active" }) }]),
  );
  return deps as WorkerReadinessAuditDependencies;
}

async function build(config?: Parameters<typeof createWorkerReadinessAudit>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  if (bootstrap.status !== "ready") {
    throw new Error("Bootstrap failed to reach ready state for Worker Readiness Audit tests");
  }
  const engine = createWorkerReadinessAudit(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

async function buildFullyReachable() {
  return build({ dependencies: allDependenciesReachable() });
}

describe("Q11-02 Worker Readiness Audit", () => {
  beforeEach(resetWorkerReadinessAuditForTesting);

  test("1 locks mandatory boundaries", () => {
    const c = buildWorkerReadinessAuditConfiguration(REPO_ROOT, {
      neverFabricateAuditEvidence: false as never,
      neverCertifyMissingWorkers: false as never,
      neverCertifyUnreachableWorkers: false as never,
      neverAssumeImplementation: false as never,
      neverModifyWorkerImplementations: false as never,
      neverRepairFailedWorkers: false as never,
      neverBypassPillowGovernance: false as never,
      neverBypassGrandKingApproval: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ1103OrLater: false as never,
    });
    assert.equal(c.neverFabricateAuditEvidence, true);
    assert.equal(c.neverCertifyMissingWorkers, true);
    assert.equal(c.neverCertifyUnreachableWorkers, true);
    assert.equal(c.neverAssumeImplementation, true);
    assert.equal(c.neverModifyWorkerImplementations, true);
    assert.equal(c.neverRepairFailedWorkers, true);
    assert.equal(c.neverBypassPillowGovernance, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ1103OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveImmutableAuditHistory, true);
    assert.equal(c.preserveAuditHistory, true);
    assert.equal(c.deterministicAuditBehaviour, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.evidenceBasedOnly, true);
    assert.equal(c.maskSensitiveValues, true);
  });

  test("2 initializes PILLOW-WRART-001 Q11-02", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q11-02");
    assert.equal(state.engineVersion, "PILLOW-WRART-001");
    assert.equal(state.configuration.workerId, "wkr-worker-readiness-audit-01");
    assert.equal(state.configuration.factory, "pillow-worker-readiness-audit");
    assert.ok(WRART_CAPABILITIES.includes("discover_registered_workers"));
    assert.ok(WRART_CAPABILITIES.includes("verify_worker_registration"));
    assert.ok(WRART_CAPABILITIES.includes("verify_worker_reachability"));
    assert.ok(WRART_CAPABILITIES.includes("classify_worker_readiness"));
    assert.ok(WRART_CAPABILITIES.includes("expose_q1103_consumable_contract"));
    assert.ok(WRART_CAPABILITIES.includes("consume_q1102_consumable_contract"));
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

  test("3 discovers registered workers from injectable registry", async () => {
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

  test("4 verifies registration for discovered workers", async () => {
    const engine = await buildFullyReachable();
    const rows = await engine.verifyRegistration();
    assert.equal(rows.length, 5);
    for (const row of rows) {
      assert.ok(row.workerId.length > 0);
      assert.ok(CHECK_STATUSES.includes(row.registrationStatus));
      assert.equal(row.registrationStatus, "Passed");
      assert.ok(Array.isArray(row.evidence));
    }
  });

  test("5 verifies reachability (reachable stubs -> Ready path)", async () => {
    const engine = await buildFullyReachable();
    const rows = await engine.verifyReachability();
    assert.equal(rows.length, 5);
    for (const row of rows) {
      assert.equal(row.probed, true);
      assert.equal(row.reachabilityStatus, "Passed");
    }
    const matrix = await engine.classifyReadiness();
    for (const assessment of matrix) {
      assert.equal(assessment.reachabilityStatus, "Passed");
      // Reachability alone never blocks Ready — fully-certified/active seed
      // workers reach Ready; the one pending/registered seed worker still
      // reaches Partially Ready (never Failed/Missing) purely from evidence.
      assert.ok(["Ready", "Partially Ready"].includes(assessment.readinessClassification));
    }
    const readyWorkers = matrix.filter((a) => a.readinessClassification === "Ready");
    assert.ok(readyWorkers.length >= 4, "expected at least 4 fully-certified reachable workers to be Ready");

    const engineUnreachable = await build({
      dependencies: {
        workerRegistry: { listWorkers: () => DEFAULT_SEED_WORKERS.map((w) => ({ ...w })) },
        workerHandles: Object.fromEntries(
          DEFAULT_SEED_WORKERS.map((w) => [
            w.workerId,
            {
              getState: () => {
                throw new Error("unreachable");
              },
            },
          ]),
        ),
      },
    });
    const unreachableMatrix = await engineUnreachable.classifyReadiness();
    for (const assessment of unreachableMatrix) {
      assert.equal(assessment.reachabilityStatus, "Failed");
      assert.notEqual(assessment.readinessClassification, "Ready");
    }
  });

  test("6 verifies governance + permissions", async () => {
    const engine = await buildFullyReachable();
    const governance = await engine.verifyGovernance();
    assert.equal(governance.rows.length, 5);
    assert.ok(governance.summary.totalWorkers === 5);
    assert.ok(governance.summary.governedWorkerCount > 0);
    assert.ok(Array.isArray(governance.summary.evidence));
    for (const row of governance.rows) {
      assert.ok(CHECK_STATUSES.includes(row.governanceStatus));
    }
    const certifiedRows = governance.rows.filter((r) => r.governanceStatus === "Passed");
    assert.ok(certifiedRows.length > 0);

    const permissions = await engine.verifyPermissions();
    assert.equal(permissions.length, 5);
    for (const row of permissions) {
      assert.ok(CHECK_STATUSES.includes(row.permissionStatus));
    }
    assert.ok(permissions.some((r) => r.permissionStatus === "Passed"));
  });

  test("7 verifies runtime connectivity + capability", async () => {
    const engine = await buildFullyReachable();
    const runtime = await engine.verifyRuntimeConnectivity();
    assert.equal(runtime.rows.length, 5);
    assert.equal(runtime.summary.sharedRuntimeCoreBound, true);
    assert.equal(runtime.summary.pillowOrchestrationRuntimeBound, true);
    assert.equal(runtime.summary.totalWorkers, 5);
    for (const row of runtime.rows) {
      assert.ok(CHECK_STATUSES.includes(row.runtimeStatus));
    }

    const capability = await engine.verifyOperationalCapability();
    assert.equal(capability.rows.length, 5);
    assert.equal(capability.summary.totalWorkers, 5);
    assert.ok(capability.summary.capableWorkerCount > 0);
    for (const row of capability.rows) {
      assert.ok(CHECK_STATUSES.includes(row.capabilityStatus));
    }

    const engineNoRuntime = await build({
      dependencies: { workerRegistry: { listWorkers: () => DEFAULT_SEED_WORKERS.map((w) => ({ ...w })) } },
    });
    const runtimeNone = await engineNoRuntime.verifyRuntimeConnectivity();
    assert.equal(runtimeNone.summary.sharedRuntimeCoreBound, false);
    assert.equal(runtimeNone.summary.pillowOrchestrationRuntimeBound, false);
  });

  test("8 readiness classifications + full Worker Readiness Audit Report + consumableByQ1103", async () => {
    const engine = await buildFullyReachable();
    const report = await engine.produceReport(sampleInput());
    assert.ok(["pass", "partial"].includes(report.validation.decision));
    assert.ok(report.reportId.startsWith("wrart-rpt-"));
    assert.ok(report.timestamp);
    assert.equal(report.auditVersion, "Q11-WRART-v1");
    assert.equal(report.totalWorkers, 5);
    assert.equal(report.readyWorkers + report.partiallyReadyWorkers + report.failedWorkers + report.missingWorkers + report.blockedWorkers + report.deferredWorkers, 5);
    assert.ok(report.governanceSummary);
    assert.ok(report.runtimeSummary);
    assert.ok(report.capabilitySummary);
    assert.ok(Array.isArray(report.supportingEvidence));
    assert.ok(Array.isArray(report.outstandingIssues));
    assert.ok(report.confidenceScore >= 0 && report.confidenceScore <= 1);
    assert.equal(report.metadataVersion, WRART_METADATA_VERSION);
    assert.equal(report.reportVersion, WORKER_READINESS_AUDIT_REPORT_VERSION);
    assert.equal(report.workerId, "wkr-worker-readiness-audit-01");
    assert.ok(READINESS_DECISIONS.includes(report.readinessDecision));
    // 4/5 seed workers are fully certified and active/idle/busy (Ready); the
    // remaining seed worker is pending-certified/registered (Partially
    // Ready), so the deterministic gate yields Conditionally_Ready overall.
    assert.equal(report.readinessDecision, "Conditionally_Ready");
    assert.ok(report.validation);
    assert.equal(report.consumableByQ1103, true);
    assert.equal(report.neverImplementQ1103OrLater, true);
    assert.equal(report.structuralSignalOnly, true);
    assert.equal(report.evidenceBasedOnly, true);
    assert.equal(report.firstWorkerReadinessGate, true);
    assert.ok(report.q1102ContractConsumed);
    assert.equal(report.q1102ContractConsumed.attempted, true);
    assert.equal(report.q1102ContractConsumed.consumed, true);
    assert.equal(report.workerInventory.length, 5);
    assert.equal(report.readinessMatrix.length, 5);
    for (const row of report.readinessMatrix) {
      assert.ok(row.workerId.length > 0);
      assert.ok(row.workerName.length > 0);
      assert.ok(CHECK_STATUSES.includes(row.registrationStatus));
      assert.ok(CHECK_STATUSES.includes(row.runtimeStatus));
      assert.ok(CHECK_STATUSES.includes(row.reachabilityStatus));
      assert.ok(CHECK_STATUSES.includes(row.governanceStatus));
      assert.ok(CHECK_STATUSES.includes(row.permissionStatus));
      assert.ok(CHECK_STATUSES.includes(row.dependencyStatus));
      assert.ok(CHECK_STATUSES.includes(row.capabilityStatus));
      assert.ok(READINESS_CLASSIFICATIONS.includes(row.readinessClassification));
      assert.ok(Array.isArray(row.supportingEvidence));
      assert.ok(row.auditReference.length > 0);
      assert.ok(row.auditTimestamp.length > 0);
    }
    assert.ok(AUDIT_STATUSES.includes(report.auditStatus));
    assert.ok(
      !JSON.stringify(report).toLowerCase().includes("pillow command audit implemented"),
      "must never claim to implement Pillow Command Audit",
    );
  });

  test("9 exposes Q1103 contract without implementing Pillow Command Audit", async () => {
    const engine = await buildFullyReachable();
    const contract = engine.getQ1103ConsumableContract();
    assert.equal(contract.producedBy, "worker-readiness-audit");
    assert.equal(contract.missionId, "Q11-02");
    assert.equal(contract.consumerMissionId, "Q11-03");
    assert.ok(contract.exposedFields.length > 0);
    assert.ok(contract.readinessClassificationCatalog.length > 0);
    assert.ok(contract.readinessDecisionCatalog.length > 0);
    assert.equal(contract.neverImplementQ1103OrLater, true);
    assert.equal(contract.structuralSignalOnly, true);
    assert.ok(
      !JSON.stringify(contract).toLowerCase().includes("pillow command audit implemented"),
      "must never claim to implement Pillow Command Audit",
    );

    const report = await engine.produceReport(sampleInput());
    assert.equal(report.q1102ContractConsumed.attempted, true);
    assert.equal(report.q1102ContractConsumed.consumed, true);
  });

  test("10 rejects fabricate / certify-missing / certify-unreachable / governance bypass", async () => {
    const engine = await buildFullyReachable();
    for (const forbidden of [
      { fabricateAuditEvidence: true },
      { forceFail: true },
      { certifyMissingWorkers: true },
      { certifyUnreachableWorkers: true },
      { assumeImplementation: true },
      { modifyWorkerImplementations: true },
      { repairFailedWorkers: true },
      { bypassPillowGovernance: true },
      { bypassGrandKingApproval: true },
      { overrideApprovedArchitecture: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ1103OrLater: true },
    ] as const) {
      const report = await engine.produceReport({
        ...sampleInput(),
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail", `expected fail for ${JSON.stringify(forbidden)}`);
      assert.equal(report.readinessDecision, "Failed");
    }
  });

  test("11 rejects Q11-03+ missionId", async () => {
    const engine = await buildFullyReachable();
    assert.equal(isForbiddenMissionId("Q11-02"), false);
    for (const missionId of ["Q11-03", "Q11-04", "Q12-01", "Q20-01"]) {
      assert.equal(isForbiddenMissionId(missionId), true, `expected forbidden: ${missionId}`);
      const report = await engine.produceReport({
        ...sampleInput(),
        missionId,
      });
      assert.equal(report.validation.decision, "fail", `expected fail for ${missionId}`);
      assert.equal(report.readinessDecision, "Failed");
    }
    const selfOk = await engine.produceReport({ ...sampleInput(), missionId: "Q11-02" });
    assert.notEqual(selfOk.readinessDecision, "Failed");
  });

  test("12 cockpit + never implements Q11-03 + consumes Q1102 when injected", async () => {
    const engine = await buildFullyReachable();
    await engine.produceReport(sampleInput());
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q11-02");
    assert.ok(cockpit.totalReports >= 1);
    assert.equal(cockpit.lastReadinessDecision, "Conditionally_Ready");
    assert.equal(cockpit.workerId, "wkr-worker-readiness-audit-01");
    assert.deepEqual([...cockpit.readinessClassificationOptions].sort(), [...READINESS_CLASSIFICATIONS].sort());
    assert.equal(cockpit.neverFabricateAuditEvidence, true);
    assert.equal(cockpit.neverImplementQ1103OrLater, true);
    assert.equal(cockpit.secondQ11Gate, true);

    const diagnostics = engine.runDiagnostics();
    assert.equal(diagnostics.missionId, "Q11-02");
    assert.ok(engine.getAuditTrail().length >= 1);
    assert.ok(engine.getCatalog());
    assert.ok(engine.getReports().length >= 1);
    assert.ok(engine.list().length >= 1);
    assert.ok(engine.getReadinessMatrix().length > 0);

    const sync = engine.validateForSupervisorSync();
    assert.notEqual(sync.health, "blocked");
    assert.ok(sync.readinessScore > 0);

    // No productionCertificationCore injected -> Q1102 contract handshake not attempted.
    const bareEngine = await build();
    const bareReport = await bareEngine.produceReport(sampleInput());
    assert.equal(bareReport.q1102ContractConsumed.attempted, false);
    assert.equal(bareReport.q1102ContractConsumed.consumed, false);
  });
});
