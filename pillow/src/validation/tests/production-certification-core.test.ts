import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  CERTIFICATION_DECISIONS,
  CERTIFICATION_STATUSES,
  COMPONENT_TYPES,
  FACTORY_KEYS,
  PCCRT_CAPABILITIES,
  PCCRT_METADATA_VERSION,
  PRODUCTION_CERTIFICATION_CORE_REPORT_VERSION,
  PROGRAMMES,
  Q10_RUNTIME_IDS,
  buildProductionCertificationCoreConfiguration,
  createProductionCertificationCore,
  isForbiddenMissionId,
  listProgrammeIds,
  resetProductionCertificationCoreForTesting,
  type PccrtInput,
  type ProductionCertificationCoreDependencies,
} from "../../production-certification-core/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

const EXPECTED_PROGRAMME_IDS = [
  "workforce_certification",
  "runtime_certification",
  "factory_certification",
  "governance_certification",
  "reporting_certification",
  "integration_certification",
  "security_certification",
  "performance_certification",
  "recovery_certification",
  "financial_readiness_certification",
  "executive_certification",
  "custom_extension",
];

function sampleInput(overrides: Partial<PccrtInput> = {}): PccrtInput {
  return {
    grandKingInstructions:
      "Register Q11 certification programmes, discover factories/workers/runtimes, and certify production readiness from observed evidence only; never fabricate, never certify missing capabilities, never override governance, Pillow, or Grand King.",
    pillowCommandConfirmed: true,
    grandKingApproved: true,
    validated: true,
    ...overrides,
  };
}

/** Full evidence stubs: sharedRuntimeCore.listFactories, workerRegistry.listWorkers,
 * sharedRuntimeCertification.getQ1101ConsumableContract, runtime getState stubs,
 * and executiveReportingRuntime.submitWorkerReport. */
function allDependenciesReachable(): ProductionCertificationCoreDependencies {
  const deps: Record<string, unknown> = {};
  for (const runtime of Q10_RUNTIME_IDS) {
    deps[runtime.dependencyKey] = { getState: () => ({ status: "active" }) };
  }
  deps.sharedRuntimeCore = {
    getState: () => ({ status: "active" }),
    listFactories: () =>
      FACTORY_KEYS.map((factoryKey) => ({
        factoryKey,
        factoryName: factoryKey,
        series: "Q10",
        missionId: "Q10-01",
        registeredAt: new Date().toISOString(),
        healthStatus: "healthy",
        fabricated: false,
        evidencePresent: true,
      })),
    getTopology: () => ({ factories: [], workers: [] }),
    getQ1002ConsumableContract: () => ({
      contractVersion: "SRTC-001-v1",
      consumerMissionId: "Q10-02",
      exposedFields: ["factoryKeyCatalog"],
    }),
  };
  deps.sharedRuntimeCertification = {
    getState: () => ({ status: "active" }),
    getQ1101ConsumableContract: () => ({
      contractVersion: "SRCRT-001-v1",
      consumerMissionId: "Q11-01",
      exposedFields: ["runtimeCertificationMatrix", "certificationSummary"],
    }),
  };
  deps.workerRegistry = {
    listWorkers: () => [
      { workerId: "wkr-test-01", workerName: "Test Worker One" },
      { workerId: "wkr-test-02", workerName: "Test Worker Two" },
      { workerId: "wkr-test-03", workerName: "Test Worker Three" },
    ],
    registerWorker: () => ({ ok: true }),
  };
  deps.auditRuntime = { getState: () => ({ status: "active" }) };
  deps.monitoringRuntime = { getState: () => ({ status: "active" }) };
  deps.approvalRuntime = { getState: () => ({ status: "active" }) };
  deps.recoveryRuntime = { getState: () => ({ status: "active" }) };
  deps.workerLifecycle = { createWorker: () => ({}), activateWorker: () => ({}) };
  deps.workerRecoverySystem = { registerRecoverableWorker: () => ({}) };
  deps.executiveReportingRuntime = {
    submitWorkerReport: () => ({ records: [{ reportId: "ert-pccrt-test" }] }),
  };
  return deps as ProductionCertificationCoreDependencies;
}

async function build(config?: Parameters<typeof createProductionCertificationCore>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  if (bootstrap.status !== "ready") {
    throw new Error("Bootstrap failed to reach ready state for Production Certification Core tests");
  }
  const engine = createProductionCertificationCore(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

async function buildFullyReachable() {
  return build({ dependencies: allDependenciesReachable() });
}

describe("Q11-01 Production Certification Core", () => {
  beforeEach(resetProductionCertificationCoreForTesting);

  test("1 locks mandatory boundaries", () => {
    const c = buildProductionCertificationCoreConfiguration(REPO_ROOT, {
      neverFabricateCertificationEvidence: false as never,
      neverCertifyMissingCapabilities: false as never,
      neverAssumeImplementation: false as never,
      neverImplementMissingCapabilities: false as never,
      neverModifyProductionLogic: false as never,
      neverReplaceIndividualAuditProgrammes: false as never,
      neverBypassPillowGovernance: false as never,
      neverBypassGrandKingApproval: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ1102OrLater: false as never,
    });
    assert.equal(c.neverFabricateCertificationEvidence, true);
    assert.equal(c.neverCertifyMissingCapabilities, true);
    assert.equal(c.neverAssumeImplementation, true);
    assert.equal(c.neverImplementMissingCapabilities, true);
    assert.equal(c.neverModifyProductionLogic, true);
    assert.equal(c.neverReplaceIndividualAuditProgrammes, true);
    assert.equal(c.neverBypassPillowGovernance, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ1102OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveImmutableCertificationHistory, true);
    assert.equal(c.preserveCertificationHistory, true);
    assert.equal(c.preserveAuditHistory, true);
    assert.equal(c.deterministicCertification, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.evidenceBasedOnly, true);
    assert.equal(c.maskSensitiveValues, true);
  });

  test("2 initializes PILLOW-PCCRT-001 Q11-01", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q11-01");
    assert.equal(state.engineVersion, "PILLOW-PCCRT-001");
    assert.equal(state.configuration.workerId, "wkr-production-certification-core-01");
    assert.equal(state.configuration.factory, "pillow-production-certification-core");
    assert.ok(PCCRT_CAPABILITIES.includes("register_certification_programmes"));
    assert.ok(PCCRT_CAPABILITIES.includes("discover_factories"));
    assert.ok(PCCRT_CAPABILITIES.includes("discover_workers"));
    assert.ok(PCCRT_CAPABILITIES.includes("discover_runtimes"));
    assert.ok(PCCRT_CAPABILITIES.includes("calculate_production_readiness"));
    assert.ok(PCCRT_CAPABILITIES.includes("expose_q1102_consumable_contract"));
    assert.ok(PCCRT_CAPABILITIES.includes("consume_q1101_consumable_contract"));
    assert.equal(PROGRAMMES.length, 12);
    assert.equal(Q10_RUNTIME_IDS.length, 13);
    for (const decision of CERTIFICATION_DECISIONS) {
      assert.ok(
        ["Certified", "Conditionally_Certified", "Not_Certified", "Failed", "Deferred"].includes(decision),
      );
    }
    for (const status of CERTIFICATION_STATUSES) {
      assert.ok(
        [
          "Certified",
          "Partially Certified",
          "Failed Certification",
          "Blocked",
          "Deferred",
          "Registered",
          "Discovered",
          "Pending",
        ].includes(status),
      );
    }
  });

  test("3 registers certification programmes catalog", async () => {
    const engine = await build();
    const programmes = engine.registerCertificationProgrammes();
    assert.equal(programmes.length, 12);
    const ids = programmes.map((p) => p.programmeId);
    for (const expected of EXPECTED_PROGRAMME_IDS) {
      assert.ok(ids.includes(expected as (typeof ids)[number]), `missing programme ${expected}`);
    }
    assert.deepEqual([...listProgrammeIds()].sort(), [...EXPECTED_PROGRAMME_IDS].sort());
    for (const programme of programmes) {
      assert.ok(COMPONENT_TYPES.includes(programme.componentType));
      assert.ok(programme.description.length > 0);
      assert.ok(Array.isArray(programme.requiredEvidenceRefs));
      assert.ok(programme.registeredAt.length > 0);
    }
  });

  test("4 factory discovery completes (uses real FACTORY_KEYS evidence)", async () => {
    const engine = await build();
    const discovery = await engine.discoverFactories();
    assert.equal(discovery.totalCatalog, FACTORY_KEYS.length);
    assert.equal(discovery.discoveredCount, FACTORY_KEYS.length);
    assert.equal(discovery.source, "repository");
    for (const factoryKey of FACTORY_KEYS) {
      const row = discovery.factories.find((f) => f.factoryKey === factoryKey);
      assert.ok(row, `${factoryKey} missing from discovery`);
      assert.ok(row!.repositoryEvidence, `${factoryKey} repository evidence missing`);
    }

    const injectedEngine = await buildFullyReachable();
    const injectedDiscovery = await injectedEngine.discoverFactories();
    assert.equal(injectedDiscovery.source, "injected");
    assert.equal(injectedDiscovery.discoveredCount, FACTORY_KEYS.length);
  });

  test("5 worker discovery completes (registry injectable stub)", async () => {
    const engineNoRegistry = await build();
    const noRegistryDiscovery = await engineNoRegistry.discoverWorkers();
    assert.equal(noRegistryDiscovery.registryInjected, false);
    assert.equal(noRegistryDiscovery.discoveredCount, 0);

    const engine = await buildFullyReachable();
    const discovery = await engine.discoverWorkers();
    assert.equal(discovery.registryInjected, true);
    assert.equal(discovery.discoveredCount, 3);
    assert.ok(discovery.workers.every((w) => w.workerId.length > 0));
  });

  test("6 runtime discovery finds Q10-01..Q10-13", async () => {
    const engine = await build();
    const discovery = await engine.discoverRuntimes();
    assert.equal(discovery.totalCatalog, 13);
    assert.equal(discovery.discoveredCount, 13);
    for (const runtime of Q10_RUNTIME_IDS) {
      const row = discovery.runtimes.find((r) => r.missionId === runtime.missionId);
      assert.ok(row, `${runtime.missionId} missing from discovery`);
      assert.ok(row!.repositoryEvidence, `${runtime.missionId} repository evidence missing`);
    }
  });

  test("7 certification evidence aggregated with required model fields", async () => {
    const engine = await buildFullyReachable();
    const matrix = await engine.aggregateCertificationEvidence(sampleInput());
    assert.ok(matrix.length > 0);
    const componentTypesSeen = new Set(matrix.map((r) => r.componentType));
    for (const row of matrix) {
      assert.ok(row.certificationId.length > 0);
      assert.ok(typeof row.programmeId === "string" && row.programmeId.length > 0);
      assert.ok(typeof row.componentId === "string" && row.componentId.length > 0);
      assert.ok(COMPONENT_TYPES.includes(row.componentType));
      assert.ok(CERTIFICATION_STATUSES.includes(row.certificationStatus));
      assert.ok(row.readinessScore >= 0 && row.readinessScore <= 1);
      assert.ok(Array.isArray(row.evidenceReferences));
      assert.ok(Array.isArray(row.validationResults));
      assert.ok(Array.isArray(row.failedChecks));
      assert.ok(Array.isArray(row.passedChecks));
      assert.ok(Array.isArray(row.outstandingIssues));
      assert.ok(row.auditReference.length > 0);
      assert.ok(row.certificationTimestamp.length > 0);
    }
    for (const expected of ["factory", "worker", "runtime", "governance", "reporting", "integration", "programme", "custom_extension"]) {
      assert.ok(componentTypesSeen.has(expected as (typeof COMPONENT_TYPES)[number]), `componentType ${expected} not observed`);
    }
  });

  test("8 readiness score calculated + full Production Certification Report + consumableByQ1102", async () => {
    const engine = await buildFullyReachable();
    const report = await engine.produceReport(sampleInput());
    assert.ok(["pass", "partial"].includes(report.validation.decision));
    assert.ok(report.reportId.startsWith("pccrt-rpt-"));
    assert.ok(report.timestamp);
    assert.equal(report.runtimeVersion, "Q11-PCCRT-v1");
    assert.ok(Array.isArray(report.certificationScope));
    assert.equal(report.certificationScope.length, 12);
    assert.ok(report.factorySummary);
    assert.ok(report.workerSummary);
    assert.ok(report.runtimeSummary);
    assert.ok(report.governanceSummary);
    assert.ok(report.readinessSummary);
    assert.ok(report.readinessSummary.overallReadinessScore >= 0 && report.readinessSummary.overallReadinessScore <= 1);
    assert.ok(report.evidenceSummary);
    assert.ok(Array.isArray(report.failedItems));
    assert.ok(Array.isArray(report.outstandingRisks));
    assert.ok(report.auditStatus);
    assert.ok(report.confidenceScore >= 0 && report.confidenceScore <= 1);
    assert.equal(report.metadataVersion, PCCRT_METADATA_VERSION);
    assert.equal(report.reportVersion, PRODUCTION_CERTIFICATION_CORE_REPORT_VERSION);
    assert.equal(report.workerId, "wkr-production-certification-core-01");
    assert.ok(CERTIFICATION_DECISIONS.includes(report.certificationDecision));
    assert.equal(report.certificationDecision, "Certified");
    assert.ok(report.validation);
    assert.equal(report.consumableByQ1102, true);
    assert.equal(report.neverImplementQ1102OrLater, true);
    assert.equal(report.structuralSignalOnly, true);
    assert.equal(report.evidenceBasedOnly, true);
    assert.equal(report.finalQ11CoreGate, true);
    assert.ok(report.q1101ContractConsumed);
    assert.equal(report.q1101ContractConsumed.attempted, true);
    assert.equal(report.q1101ContractConsumed.consumed, true);
    assert.equal(report.programmeInventory.length, 12);
    assert.ok(report.certificationResults.length > 0);
    assert.ok(
      !JSON.stringify(report).toLowerCase().includes("q11-02\":true"),
      "must never mark Q11-02 as implemented",
    );
  });

  test("9 exposes Q1102 contract without implementing Worker Readiness Audit", async () => {
    const engine = await buildFullyReachable();
    const contract = engine.getQ1102ConsumableContract();
    assert.equal(contract.producedBy, "production-certification-core");
    assert.equal(contract.missionId, "Q11-01");
    assert.equal(contract.consumerMissionId, "Q11-02");
    assert.ok(contract.exposedFields.length > 0);
    assert.equal(contract.programmeCatalog.length, 12);
    assert.equal(contract.neverImplementQ1102OrLater, true);
    assert.equal(contract.structuralSignalOnly, true);
    assert.ok(
      !JSON.stringify(contract).toLowerCase().includes("worker readiness audit implemented"),
      "must never claim to implement Worker Readiness Audit",
    );

    const report = await engine.produceReport(sampleInput());
    assert.equal(report.q1101ContractConsumed.attempted, true);
    assert.equal(report.q1101ContractConsumed.consumed, true);
  });

  test("10 rejects fabricate / certify-missing / governance bypass", async () => {
    const engine = await buildFullyReachable();
    for (const forbidden of [
      { fabricateCertificationEvidence: true },
      { forceFail: true },
      { certifyMissingCapabilities: true },
      { assumeImplementation: true },
      { implementMissingCapabilities: true },
      { modifyProductionLogic: true },
      { replaceIndividualAuditProgrammes: true },
      { bypassPillowGovernance: true },
      { bypassGrandKingApproval: true },
      { overrideApprovedArchitecture: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ1102OrLater: true },
    ] as const) {
      const report = await engine.produceReport({
        ...sampleInput(),
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail", `expected fail for ${JSON.stringify(forbidden)}`);
      assert.equal(report.certificationDecision, "Failed");
    }
  });

  test("11 rejects Q11-02+ missionId", async () => {
    const engine = await buildFullyReachable();
    assert.equal(isForbiddenMissionId("Q11-01"), false);
    for (const missionId of ["Q11-02", "Q11-03", "Q12-01", "Q20-01"]) {
      assert.equal(isForbiddenMissionId(missionId), true, `expected forbidden: ${missionId}`);
      const report = await engine.produceReport({
        ...sampleInput(),
        missionId,
      });
      assert.equal(report.validation.decision, "fail", `expected fail for ${missionId}`);
      assert.equal(report.certificationDecision, "Failed");
    }
    const selfOk = await engine.produceReport({ ...sampleInput(), missionId: "Q11-01" });
    assert.notEqual(selfOk.certificationDecision, "Failed");
  });

  test("12 cockpit + never implements Q11-02 + consumes Q1101 when injected", async () => {
    const engine = await buildFullyReachable();
    await engine.produceReport(sampleInput());
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q11-01");
    assert.ok(cockpit.totalReports >= 1);
    assert.equal(cockpit.lastCertificationDecision, "Certified");
    assert.equal(cockpit.workerId, "wkr-production-certification-core-01");
    assert.deepEqual([...cockpit.programmeIds].sort(), [...EXPECTED_PROGRAMME_IDS].sort());
    assert.deepEqual([...cockpit.certificationStatusOptions].sort(), [...CERTIFICATION_STATUSES].sort());
    assert.equal(cockpit.neverFabricateCertificationEvidence, true);
    assert.equal(cockpit.neverImplementQ1102OrLater, true);
    assert.equal(cockpit.firstQ11Gate, true);

    const diagnostics = engine.runDiagnostics();
    assert.equal(diagnostics.missionId, "Q11-01");
    assert.ok(engine.getAuditTrail().length >= 1);
    assert.ok(engine.getCatalog());
    assert.ok(engine.getReports().length >= 1);
    assert.ok(engine.list().length >= 1);
    assert.ok(engine.getCertificationResults().length > 0);

    const sync = engine.validateForSupervisorSync();
    assert.notEqual(sync.health, "blocked");
    assert.ok(sync.readinessScore > 0);

    // No sharedRuntimeCertification injected -> Q1101 contract handshake not attempted.
    const bareEngine = await build();
    const bareReport = await bareEngine.produceReport(sampleInput());
    assert.equal(bareReport.q1101ContractConsumed.attempted, false);
    assert.equal(bareReport.q1101ContractConsumed.consumed, false);
  });
});
