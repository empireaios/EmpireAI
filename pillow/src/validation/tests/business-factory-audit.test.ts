import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  AUDIT_STATUSES,
  CHECK_STATUSES,
  DEDICATED_CORE_FACTORY_KEYS,
  FACTORY_KEYS,
  WORKFORCE_FACTORY_KEYS,
  READINESS_CLASSIFICATIONS,
  READINESS_DECISIONS,
  BFART_CAPABILITIES,
  BFART_METADATA_VERSION,
  BUSINESS_FACTORY_AUDIT_REPORT_VERSION,
  buildBusinessFactoryAuditConfiguration,
  createBusinessFactoryAudit,
  isForbiddenMissionId,
  resetBusinessFactoryAuditForTesting,
  type BfartInput,
  type BusinessFactoryAuditDependencies,
} from "../../business-factory-audit/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function titleize(factoryKey: string): string {
  return factoryKey
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function sampleInput(overrides: Partial<BfartInput> = {}): BfartInput {
  return {
    grandKingInstructions:
      "Discover every registered business factory, verify registration/workers/workflows/runtime integration/external integrations/governance/operational readiness, and classify business factory readiness from observed evidence only; never fabricate, never certify incomplete workflows or missing integrations, never override governance, Pillow, or Grand King.",
    pillowCommandConfirmed: true,
    grandKingApproved: true,
    validated: true,
    ...overrides,
  };
}

function seedFactoryRecords() {
  return FACTORY_KEYS.map((factoryKey) => ({
    factoryKey,
    factoryName: titleize(factoryKey),
    series: "Q-series",
    missionId: null,
    healthStatus: "healthy",
    evidencePresent: true,
  }));
}

function seedWorkerRecords() {
  return FACTORY_KEYS.map((factoryKey, index) => ({
    workerId: `wkr-${factoryKey}-01`,
    workerName: `${titleize(factoryKey)} Worker`,
    workerType: "operator",
    department: factoryKey,
    factory: factoryKey,
    role: `role-operator-${factoryKey}`,
    reportingLine: [`wkr-${factoryKey}-01`, "pillow"],
    governingAuthority: "pillow",
    skillProfile: [`skill-${factoryKey}-operations`],
    approvedTools: ["repository_evidence_scanner"],
    authorityLevel: "autonomous_worker_decision",
    certificationStatus: "certified",
    operationalStatus: "active",
    __index: index,
  }));
}

/** Full evidence stubs: sharedRuntimeCore.listFactories returning all 10 catalog
 * factories, workerRegistry.listWorkers returning a matching worker per factory,
 * every dedicated *FactoryCore handle bound, pillowCommandAudit exposing
 * getQ1104ConsumableContract, orchestration.invokeWorker stub, ERR
 * submitWorkerReport. */
function allDependenciesReachable(): BusinessFactoryAuditDependencies {
  const deps: Record<string, unknown> = {};
  deps.sharedRuntimeCore = {
    listFactories: () => seedFactoryRecords(),
  };
  deps.workerRegistry = {
    listWorkers: () => seedWorkerRecords(),
    registerWorker: () => ({ ok: true }),
  };
  deps.pillowCommandAudit = {
    getState: () => ({ status: "active" }),
    getQ1104ConsumableContract: () => ({
      contractVersion: "PCART-001-v1",
      consumerMissionId: "Q11-04",
      exposedFields: ["commandMatrix", "commandReadinessSummary"],
    }),
  };
  deps.productionCertificationCore = { getState: () => ({ status: "active" }) };
  deps.empireBuilderFactoryCore = { getState: () => ({ status: "active" }) };
  deps.commerceFactoryCore = { getState: () => ({ status: "active" }) };
  deps.mediaFactoryCore = { getState: () => ({ status: "active" }) };
  deps.digitalProductsFactoryCore = { getState: () => ({ status: "active" }) };
  deps.enterprisePlatformFactoryCore = { getState: () => ({ status: "active" }) };
  deps.localBusinessFactoryCore = { getState: () => ({ status: "active" }) };
  deps.affiliateFactoryCore = { getState: () => ({ status: "active" }) };
  deps.capitalFactoryCore = { getState: () => ({ status: "active" }) };
  deps.pillowOrchestrationRuntime = {
    getState: () => ({ status: "active" }),
    invokeWorker: () => ({ dispatched: true }),
    retrieveReport: () => ({ report: {} }),
  };
  deps.monitoringRuntime = {
    getState: () => ({ status: "active" }),
    produceReport: () => ({ report: {} }),
    list: () => [],
  };
  deps.auditRuntime = { getState: () => ({ status: "active" }) };
  deps.executiveReportingRuntime = {
    submitWorkerReport: () => ({ records: [{ reportId: "ert-bfart-test" }] }),
    retrieveReport: () => ({ report: {} }),
  };
  return deps as BusinessFactoryAuditDependencies;
}

async function build(config?: Parameters<typeof createBusinessFactoryAudit>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  if (bootstrap.status !== "ready") {
    throw new Error("Bootstrap failed to reach ready state for Business Factory Audit tests");
  }
  const engine = createBusinessFactoryAudit(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

async function buildFullyReachable() {
  return build({ dependencies: allDependenciesReachable() });
}

describe("Q11-04 Business Factory Audit", () => {
  beforeEach(resetBusinessFactoryAuditForTesting);

  test("1 locks mandatory boundaries", () => {
    const c = buildBusinessFactoryAuditConfiguration(REPO_ROOT, {
      neverFabricateAuditEvidence: false as never,
      neverCertifyIncompleteWorkflows: false as never,
      neverCertifyMissingIntegrations: false as never,
      neverAssumeImplementation: false as never,
      neverModifyFactoryImplementations: false as never,
      neverRepairFailedFactories: false as never,
      neverBypassPillowGovernance: false as never,
      neverBypassGrandKingApproval: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ1105OrLater: false as never,
    });
    assert.equal(c.neverFabricateAuditEvidence, true);
    assert.equal(c.neverCertifyIncompleteWorkflows, true);
    assert.equal(c.neverCertifyMissingIntegrations, true);
    assert.equal(c.neverAssumeImplementation, true);
    assert.equal(c.neverModifyFactoryImplementations, true);
    assert.equal(c.neverRepairFailedFactories, true);
    assert.equal(c.neverBypassPillowGovernance, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ1105OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveImmutableAuditHistory, true);
    assert.equal(c.preserveAuditHistory, true);
    assert.equal(c.deterministicAuditBehaviour, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.evidenceBasedOnly, true);
    assert.equal(c.maskSensitiveValues, true);
  });

  test("2 initializes PILLOW-BFART-001 Q11-04", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q11-04");
    assert.equal(state.engineVersion, "PILLOW-BFART-001");
    assert.equal(state.configuration.workerId, "wkr-business-factory-audit-01");
    assert.equal(state.configuration.factory, "business-factory-audit");
    assert.ok(BFART_CAPABILITIES.includes("discover_business_factories"));
    assert.ok(BFART_CAPABILITIES.includes("verify_factory_registration"));
    assert.ok(BFART_CAPABILITIES.includes("verify_factory_workflows"));
    assert.ok(BFART_CAPABILITIES.includes("classify_business_factory_readiness"));
    assert.ok(BFART_CAPABILITIES.includes("expose_q1105_consumable_contract"));
    assert.ok(BFART_CAPABILITIES.includes("consume_q1104_consumable_contract"));
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

  test("3 verifies factory discovery from injectable Shared Runtime Core", async () => {
    const engineNoCore = await build();
    const noCoreDiscovery = await engineNoCore.discoverFactories();
    assert.equal(noCoreDiscovery.sharedRuntimeCoreInjected, false);
    assert.equal(noCoreDiscovery.discoveredCount, 0);

    const engine = await buildFullyReachable();
    const discovery = await engine.discoverFactories();
    assert.equal(discovery.sharedRuntimeCoreInjected, true);
    assert.equal(discovery.discoveredCount, FACTORY_KEYS.length);
    for (const factory of discovery.factories) {
      assert.ok(factory.factoryKey.length > 0);
      assert.ok((FACTORY_KEYS as readonly string[]).includes(factory.factoryKey), `${factory.factoryKey} not in FACTORY_KEYS`);
    }
  });

  test("4 verifies registration (dedicated core vs workforce presence)", async () => {
    const engine = await buildFullyReachable();
    const rows = await engine.verifyRegistration();
    assert.equal(rows.length, FACTORY_KEYS.length);
    for (const row of rows) {
      assert.ok(row.factoryId.length > 0);
      assert.ok(CHECK_STATUSES.includes(row.registrationStatus));
      assert.equal(row.registrationStatus, "Passed");
      assert.ok(Array.isArray(row.evidence));
    }

    const engineNoCores = await build({
      dependencies: {
        sharedRuntimeCore: { listFactories: () => seedFactoryRecords() },
        workerRegistry: { listWorkers: () => seedWorkerRecords() },
      },
    });
    const rowsPartial = await engineNoCores.verifyRegistration();
    for (const row of rowsPartial) {
      if ((DEDICATED_CORE_FACTORY_KEYS as readonly string[]).includes(row.factoryId)) {
        assert.equal(row.registrationStatus, "Partial", `${row.factoryId} expected Partial without dedicated core`);
      } else if ((WORKFORCE_FACTORY_KEYS as readonly string[]).includes(row.factoryId)) {
        assert.equal(row.registrationStatus, "Passed", `${row.factoryId} expected Passed via workforce presence`);
      }
    }
  });

  test("5 verifies worker coverage per factory (worker.factory matching)", async () => {
    const engine = await buildFullyReachable();
    const rows = await engine.verifyWorkers();
    assert.equal(rows.length, FACTORY_KEYS.length);
    for (const row of rows) {
      assert.equal(row.workerCount, 1);
      assert.equal(row.workerStatus, "Passed");
    }

    const engineNoRegistry = await build({
      dependencies: { sharedRuntimeCore: { listFactories: () => seedFactoryRecords() } },
    });
    const rowsMissing = await engineNoRegistry.verifyWorkers();
    for (const row of rowsMissing) {
      assert.equal(row.workerCount, 0);
      assert.equal(row.workerStatus, "Missing");
    }
  });

  test("6 verifies workflow dispatch (invokeWorker presence -> Passed/Missing)", async () => {
    const engine = await buildFullyReachable();
    const rows = await engine.verifyWorkflows();
    assert.equal(rows.length, FACTORY_KEYS.length);
    for (const row of rows) {
      assert.equal(row.workflowStatus, "Passed");
      assert.ok(Array.isArray(row.evidence));
    }

    const engineNoOrchestration = await build({
      dependencies: { sharedRuntimeCore: { listFactories: () => seedFactoryRecords() } },
    });
    const rowsMissing = await engineNoOrchestration.verifyWorkflows();
    for (const row of rowsMissing) {
      assert.equal(row.workflowStatus, "Missing");
    }
  });

  test("7 verifies runtime integration, external integrations, governance, operational readiness", async () => {
    const engine = await buildFullyReachable();
    const runtimeRows = await engine.verifyRuntimeIntegration();
    assert.equal(runtimeRows.length, FACTORY_KEYS.length);
    for (const row of runtimeRows) assert.equal(row.runtimeStatus, "Passed");

    const integrationRows = await engine.verifyExternalIntegrations();
    for (const row of integrationRows) assert.equal(row.integrationStatus, "Passed");

    const governance = await engine.verifyGovernance();
    for (const row of governance.rows) assert.equal(row.governanceStatus, "Passed");
    assert.ok(governance.summary.compliant);

    const operationalRows = await engine.verifyOperationalReadiness();
    for (const row of operationalRows) assert.equal(row.operationalStatus, "Passed");

    const bareEngine = await build();
    const bareRuntime = await bareEngine.verifyRuntimeIntegration();
    assert.equal(bareRuntime.length, 0);
  });

  test("8 business factory readiness classifications + full Business Factory Audit Report + consumableByQ1105", async () => {
    const engine = await buildFullyReachable();
    const report = await engine.produceReport(sampleInput());
    assert.ok(["pass", "partial"].includes(report.validation.decision));
    assert.ok(report.reportId.startsWith("bfart-rpt-"));
    assert.ok(report.timestamp);
    assert.equal(report.auditVersion, "Q11-BFART-v1");
    assert.equal(report.engineId, "PILLOW-BFART-001");
    assert.equal(report.missionId, "Q11-04");
    assert.equal(report.totalBusinessFactories, FACTORY_KEYS.length);
    assert.equal(
      report.certifiedFactories +
        report.partiallyCertifiedFactories +
        report.failedFactories +
        report.missingFactories +
        report.blockedFactories +
        report.deferredFactories,
      FACTORY_KEYS.length,
    );
    assert.ok(report.workflowSummary);
    assert.ok(report.runtimeSummary);
    assert.ok(report.integrationSummary);
    assert.ok(report.governanceSummary);
    assert.ok(Array.isArray(report.supportingEvidence));
    assert.ok(Array.isArray(report.outstandingIssues));
    assert.ok(report.confidenceScore >= 0 && report.confidenceScore <= 1);
    assert.equal(report.metadataVersion, BFART_METADATA_VERSION);
    assert.equal(report.reportVersion, BUSINESS_FACTORY_AUDIT_REPORT_VERSION);
    assert.equal(report.workerId, "wkr-business-factory-audit-01");
    assert.ok(READINESS_DECISIONS.includes(report.decision));
    assert.equal(report.decision, "certify");
    assert.equal(report.certifiedFactories, FACTORY_KEYS.length);
    assert.ok(report.validation);
    assert.equal(report.consumableByQ1105, true);
    assert.equal(report.neverImplementQ1105OrLater, true);
    assert.equal(report.structuralSignalOnly, true);
    assert.equal(report.evidenceBasedOnly, true);
    assert.equal(report.fourthQ11Gate, true);
    assert.ok(report.q1104ContractConsumed);
    assert.equal(report.q1104ContractConsumed.attempted, true);
    assert.equal(report.q1104ContractConsumed.consumed, true);
    assert.equal(report.factoryInventory.length, FACTORY_KEYS.length);
    assert.equal(report.assessments.length, FACTORY_KEYS.length);
    for (const row of report.assessments) {
      assert.ok(row.factoryId.length > 0);
      assert.ok(row.factoryName.length > 0);
      assert.ok(CHECK_STATUSES.includes(row.registrationStatus));
      assert.ok(CHECK_STATUSES.includes(row.workerStatus));
      assert.ok(CHECK_STATUSES.includes(row.workflowStatus));
      assert.ok(CHECK_STATUSES.includes(row.runtimeStatus));
      assert.ok(CHECK_STATUSES.includes(row.integrationStatus));
      assert.ok(CHECK_STATUSES.includes(row.governanceStatus));
      assert.ok(CHECK_STATUSES.includes(row.operationalStatus));
      assert.ok(READINESS_CLASSIFICATIONS.includes(row.readinessClassification));
      assert.ok(Array.isArray(row.supportingEvidence));
      assert.ok(row.auditReference.length > 0);
      assert.ok(row.auditTimestamp.length > 0);
    }
    assert.ok(AUDIT_STATUSES.includes(report.auditStatus));
    assert.equal(report.auditStatus, "certified");
    assert.ok(
      !JSON.stringify(report).toLowerCase().includes("security audit implemented"),
      "must never claim to implement Security Audit",
    );
  });

  test("9 exposes Q1105 contract without implementing Security Audit", async () => {
    const engine = await buildFullyReachable();
    const contract = engine.getQ1105ConsumableContract();
    assert.equal(contract.producedBy, "business-factory-audit");
    assert.equal(contract.missionId, "Q11-04");
    assert.equal(contract.consumerMissionId, "Q11-05");
    assert.ok(contract.exposedFields.length > 0);
    assert.ok(contract.readinessClassificationCatalog.length > 0);
    assert.ok(contract.decisionCatalog.length > 0);
    assert.equal(contract.neverImplementQ1105OrLater, true);
    assert.equal(contract.structuralSignalOnly, true);
    assert.ok(
      !JSON.stringify(contract).toLowerCase().includes("security audit implemented"),
      "must never claim to implement Security Audit",
    );

    const report = await engine.produceReport(sampleInput());
    assert.equal(report.q1104ContractConsumed.attempted, true);
    assert.equal(report.q1104ContractConsumed.consumed, true);
  });

  test("10 rejects fabricate / certify-incomplete / governance bypass", async () => {
    const engine = await buildFullyReachable();
    for (const forbidden of [
      { fabricateAuditEvidence: true },
      { forceFail: true },
      { certifyIncompleteWorkflows: true },
      { certifyMissingIntegrations: true },
      { assumeImplementation: true },
      { modifyFactoryImplementations: true },
      { repairFailedFactories: true },
      { bypassPillowGovernance: true },
      { bypassGrandKingApproval: true },
      { overrideApprovedArchitecture: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ1105OrLater: true },
    ] as const) {
      const report = await engine.produceReport({
        ...sampleInput(),
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail", `expected fail for ${JSON.stringify(forbidden)}`);
      assert.equal(report.decision, "escalate");
    }
  });

  test("11 rejects Q11-05+ missionId", async () => {
    const engine = await buildFullyReachable();
    assert.equal(isForbiddenMissionId("Q11-04"), false);
    for (const missionId of ["Q11-05", "Q11-06", "Q12-01", "Q20-01"]) {
      assert.equal(isForbiddenMissionId(missionId), true, `expected forbidden: ${missionId}`);
      const report = await engine.produceReport({
        ...sampleInput(),
        missionId,
      });
      assert.equal(report.validation.decision, "fail", `expected fail for ${missionId}`);
      assert.equal(report.decision, "escalate");
    }
    const selfOk = await engine.produceReport({ ...sampleInput(), missionId: "Q11-04" });
    assert.notEqual(selfOk.decision, "escalate");
  });

  test("12 cockpit + never implements Q11-05 + consumes Q1104 when injected", async () => {
    const engine = await buildFullyReachable();
    await engine.produceReport(sampleInput());
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q11-04");
    assert.ok(cockpit.totalReports >= 1);
    assert.equal(cockpit.lastDecision, "certify");
    assert.equal(cockpit.workerId, "wkr-business-factory-audit-01");
    assert.deepEqual([...cockpit.readinessClassificationOptions].sort(), [...READINESS_CLASSIFICATIONS].sort());
    assert.equal(cockpit.neverFabricateAuditEvidence, true);
    assert.equal(cockpit.neverImplementQ1105OrLater, true);
    assert.equal(cockpit.fourthQ11Gate, true);

    const diagnostics = engine.runDiagnostics();
    assert.equal(diagnostics.missionId, "Q11-04");
    assert.ok(engine.getAuditTrail().length >= 1);
    assert.ok(engine.getCatalog());
    assert.ok(engine.getReports().length >= 1);
    assert.ok(engine.list().length >= 1);
    assert.ok(engine.getBusinessFactoryMatrix().length > 0);

    const sync = engine.validateForSupervisorSync();
    assert.notEqual(sync.health, "blocked");
    assert.ok(sync.readinessScore > 0);

    // No pillowCommandAudit injected -> Q1104 contract handshake not attempted.
    const bareEngine = await build();
    const bareReport = await bareEngine.produceReport(sampleInput());
    assert.equal(bareReport.q1104ContractConsumed.attempted, false);
    assert.equal(bareReport.q1104ContractConsumed.consumed, false);
  });
});
