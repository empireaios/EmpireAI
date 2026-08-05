import assert from "node:assert/strict";
import path from "node:path";
import { beforeEach, describe, test } from "node:test";
import { runBootstrap } from "../../bootstrap/engine.js";
import {
  ALL_FINANCIAL_COMPONENT_KEYS,
  AUDIT_STATUSES,
  CHECK_STATUSES,
  FINANCIAL_COMPONENT_PROBES,
  FINART_CAPABILITIES,
  FINART_METADATA_VERSION,
  FINANCIAL_READINESS_AUDIT_REPORT_VERSION,
  READINESS_CLASSIFICATIONS,
  READINESS_DECISIONS,
  buildFinancialReadinessAuditConfiguration,
  createFinancialReadinessAudit,
  isForbiddenMissionId,
  resetFinancialReadinessAuditForTesting,
  type FinartInput,
  type FinancialReadinessAuditDependencies,
} from "../../financial-readiness-audit/index.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..", "..", "..");

function sampleInput(overrides: Partial<FinartInput> = {}): FinartInput {
  return {
    grandKingInstructions:
      "Discover every financial component strictly from injected handles, verify financial CAPABILITY presence via typeof evidence only (never invoke mutating financial side-effects), and classify financial readiness deterministically; never fabricate evidence, never certify unverified capability, never execute transactions, never modify accounting records, never override governance, Pillow, or Grand King.",
    pillowCommandConfirmed: true,
    grandKingApproved: true,
    validated: true,
    ...overrides,
  };
}

function stubWithProbes(methodNames: string[]) {
  const handle: Record<string, unknown> = {
    getState: () => ({ status: "active" }),
  };
  for (const name of methodNames) {
    handle[name] = () => ({ ok: true });
  }
  return handle;
}

function allDependenciesReachable(): FinancialReadinessAuditDependencies {
  const paymentGateway = stubWithProbes(FINANCIAL_COMPONENT_PROBES["payment-gateway-integration"]);
  const billingWorker = stubWithProbes(FINANCIAL_COMPONENT_PROBES["billing-worker"]);
  const revenueEngine = stubWithProbes(FINANCIAL_COMPONENT_PROBES["revenue-engine"]);
  const expenseEngine = stubWithProbes(FINANCIAL_COMPONENT_PROBES["expense-engine"]);
  const accountingWorker = stubWithProbes(FINANCIAL_COMPONENT_PROBES["accounting-worker"]);
  const financialReportingWorker = stubWithProbes(FINANCIAL_COMPONENT_PROBES["financial-reporting-worker"]);
  const profitCalculationEngine = stubWithProbes(FINANCIAL_COMPONENT_PROBES["profit-calculation-engine"]);
  const refundEngine = stubWithProbes(FINANCIAL_COMPONENT_PROBES["refund-engine"]);
  const reconciliationEngine = stubWithProbes(FINANCIAL_COMPONENT_PROBES["reconciliation-engine"]);
  const financialRiskMonitor = stubWithProbes(FINANCIAL_COMPONENT_PROBES["financial-risk-monitor"]);

  return {
    recoveryAudit: {
      getState: () => ({ status: "active" }),
      getQ1108ConsumableContract: () => ({
        contractVersion: "RECART-001-v1",
        consumerMissionId: "Q11-08",
        exposedFields: ["assessments", "recoverySummary"],
      }),
    },
    productionCertificationCore: stubWithProbes(FINANCIAL_COMPONENT_PROBES["production-certification-core"]),
    commerceFactoryCore: stubWithProbes(FINANCIAL_COMPONENT_PROBES["commerce-factory-core"]),
    paymentGatewayIntegration: paymentGateway,
    billingWorker,
    revenueEngine,
    expenseEngine,
    accountingWorker,
    financialReportingWorker,
    profitCalculationEngine,
    refundEngine,
    reconciliationEngine,
    financialOperationsCertification: stubWithProbes(FINANCIAL_COMPONENT_PROBES["financial-operations-certification"]),
    capitalFactoryCore: stubWithProbes(FINANCIAL_COMPONENT_PROBES["capital-factory-core"]),
    financialRiskMonitor,
    apiRuntime: stubWithProbes(FINANCIAL_COMPONENT_PROBES["api-runtime"]),
    auditRuntime: stubWithProbes(FINANCIAL_COMPONENT_PROBES["audit-runtime"]),
    monitoringRuntime: stubWithProbes(FINANCIAL_COMPONENT_PROBES["monitoring-runtime"]),
    executiveReportingRuntime: {
      getState: () => ({ status: "active" }),
      submitWorkerReport: () => ({ records: [{ reportId: "ert-finart-test" }] }),
      retrieveReport: () => ({ report: {} }),
    },
    sharedRuntimeCore: {
      getState: () => ({ status: "active" }),
      getCatalog: () => ({ factories: [] }),
    },
    workerRegistry: {
      getState: () => ({ status: "active" }),
      listWorkers: () => [{ workerId: "wkr-1" }],
      registerWorker: () => ({ ok: true }),
    },
  };
}

async function build(config?: Parameters<typeof createFinancialReadinessAudit>[1]) {
  const bootstrap = await runBootstrap({ repositoryRoot: REPO_ROOT, skipHeavyScans: true });
  if (bootstrap.status !== "ready") {
    throw new Error("Bootstrap failed to reach ready state for Financial Readiness Audit tests");
  }
  const engine = createFinancialReadinessAudit(bootstrap, config);
  await engine.initialize();
  engine.connect();
  return engine;
}

async function buildFullyReachable() {
  return build({ dependencies: allDependenciesReachable() });
}

describe("Q11-08 Financial Readiness Audit", () => {
  beforeEach(resetFinancialReadinessAuditForTesting);

  test("1 locks mandatory boundaries", () => {
    const c = buildFinancialReadinessAuditConfiguration(REPO_ROOT, {
      neverFabricateFinancialEvidence: false as never,
      neverCertifyUnverifiedFinancialCapability: false as never,
      neverExecuteFinancialTransactions: false as never,
      neverModifyAccountingRecords: false as never,
      neverAssumeImplementation: false as never,
      neverRepairFailedFinancialComponents: false as never,
      neverBypassPillowGovernance: false as never,
      neverBypassGrandKingApproval: false as never,
      neverOverrideApprovedArchitecture: false as never,
      neverOverridePillow: false as never,
      neverOverrideGrandKing: false as never,
      neverImplementQ1109OrLater: false as never,
    });
    assert.equal(c.neverFabricateFinancialEvidence, true);
    assert.equal(c.neverCertifyUnverifiedFinancialCapability, true);
    assert.equal(c.neverExecuteFinancialTransactions, true);
    assert.equal(c.neverModifyAccountingRecords, true);
    assert.equal(c.neverAssumeImplementation, true);
    assert.equal(c.neverRepairFailedFinancialComponents, true);
    assert.equal(c.neverBypassPillowGovernance, true);
    assert.equal(c.neverBypassGrandKingApproval, true);
    assert.equal(c.neverOverrideApprovedArchitecture, true);
    assert.equal(c.neverOverridePillow, true);
    assert.equal(c.neverOverrideGrandKing, true);
    assert.equal(c.neverImplementQ1109OrLater, true);
    assert.equal(c.preserveCompleteTraceability, true);
    assert.equal(c.preserveImmutableFinancialHistory, true);
    assert.equal(c.preserveAuditHistory, true);
    assert.equal(c.deterministicAuditBehaviour, true);
    assert.equal(c.structuralSignalOnly, true);
    assert.equal(c.evidenceBasedOnly, true);
    assert.equal(c.maskSensitiveValues, true);
  });

  test("2 initializes PILLOW-FINART-001 Q11-08", async () => {
    const state = (await build()).getState();
    assert.equal(state.missionId, "Q11-08");
    assert.equal(state.engineVersion, "PILLOW-FINART-001");
    assert.equal(state.configuration.workerId, "wkr-financial-readiness-audit-01");
    assert.equal(state.configuration.factory, "financial-readiness-audit");
    assert.ok(FINART_CAPABILITIES.includes("discover_financial_components"));
    assert.ok(FINART_CAPABILITIES.includes("verify_payment_workflows"));
    assert.ok(FINART_CAPABILITIES.includes("verify_revenue_recording"));
    assert.ok(FINART_CAPABILITIES.includes("classify_financial_readiness"));
    assert.ok(FINART_CAPABILITIES.includes("expose_q1109_consumable_contract"));
    assert.ok(FINART_CAPABILITIES.includes("consume_q1108_consumable_contract"));
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

  test("3 discovers financial components strictly from injected handles", async () => {
    const engineNoHandles = await build();
    const noHandleDiscovery = engineNoHandles.discoverFinancialComponents();
    assert.equal(noHandleDiscovery.discoveredCount, 0);
    assert.equal(noHandleDiscovery.totalCatalogued, ALL_FINANCIAL_COMPONENT_KEYS.length);

    const engine = await buildFullyReachable();
    const discovery = engine.discoverFinancialComponents();
    assert.equal(discovery.discoveredCount, ALL_FINANCIAL_COMPONENT_KEYS.length);
    for (const component of discovery.components) {
      assert.ok((ALL_FINANCIAL_COMPONENT_KEYS as readonly string[]).includes(component.componentKey));
      assert.equal(component.bound, true);
      assert.equal(component.evidencePresent, true);
    }
  });

  test("4 verifies payment workflows via capability presence only", async () => {
    const engine = await buildFullyReachable();
    const rows = engine.verifyPaymentWorkflows();
    assert.equal(rows.length, ALL_FINANCIAL_COMPONENT_KEYS.length);
    for (const row of rows) {
      assert.ok(CHECK_STATUSES.includes(row.paymentWorkflowStatus));
      assert.ok(row.evidence.length > 0);
      assert.ok(!row.evidence.join(" ").includes("invoked processPaymentCapture"), "must never invoke processPaymentCapture");
    }

    const bareEngine = await build();
    const bareRows = bareEngine.verifyPaymentWorkflows();
    for (const row of bareRows) {
      assert.equal(row.paymentWorkflowStatus, "Missing");
    }

    const paymentRow = rows.find((r) => r.componentId === "payment-gateway-integration");
    assert.ok(paymentRow);
    assert.equal(paymentRow!.paymentWorkflowStatus, "Passed");
  });

  test("5 verifies revenue/expense/accounting capability presence", async () => {
    const engine = await buildFullyReachable();
    const revenueRows = engine.verifyRevenueRecording();
    const expenseRows = engine.verifyExpenseTracking();
    const accountingRows = engine.verifyAccountingRecords();
    assert.equal(revenueRows.length, ALL_FINANCIAL_COMPONENT_KEYS.length);
    assert.equal(expenseRows.length, ALL_FINANCIAL_COMPONENT_KEYS.length);
    assert.equal(accountingRows.length, ALL_FINANCIAL_COMPONENT_KEYS.length);

    const revenueRow = revenueRows.find((r) => r.componentId === "revenue-engine");
    assert.ok(revenueRow);
    assert.equal(revenueRow!.revenueRecordingStatus, "Passed");
    assert.ok(revenueRow!.evidence.some((e) => e.includes("NEVER invoked")));

    const expenseRow = expenseRows.find((r) => r.componentId === "expense-engine");
    assert.ok(expenseRow);
    assert.equal(expenseRow!.expenseTrackingStatus, "Passed");

    const accountingRow = accountingRows.find((r) => r.componentId === "accounting-worker");
    assert.ok(accountingRow);
    assert.equal(accountingRow!.accountingRecordsStatus, "Passed");
  });

  test("6 verifies reporting/cost controls/governance/traceability presence", async () => {
    const engine = await buildFullyReachable();
    const reportingRows = engine.verifyFinancialReporting();
    const costRows = engine.verifyCostControls();
    const governanceRows = engine.verifyFinancialGovernance();
    const traceabilityRows = engine.verifyAuditTraceability();
    assert.equal(reportingRows.length, ALL_FINANCIAL_COMPONENT_KEYS.length);
    assert.equal(costRows.length, ALL_FINANCIAL_COMPONENT_KEYS.length);
    assert.equal(governanceRows.length, ALL_FINANCIAL_COMPONENT_KEYS.length);
    assert.equal(traceabilityRows.length, ALL_FINANCIAL_COMPONENT_KEYS.length);

    const reportingRow = reportingRows.find((r) => r.componentId === "financial-reporting-worker");
    assert.ok(reportingRow);
    assert.equal(reportingRow!.financialReportingStatus, "Passed");

    const costRow = costRows.find((r) => r.componentId === "profit-calculation-engine");
    assert.ok(costRow);
    assert.equal(costRow!.costControlStatus, "Passed");

    const auditRow = traceabilityRows.find((r) => r.componentId === "audit-runtime");
    assert.ok(auditRow);
    assert.equal(auditRow!.auditTraceabilityStatus, "Passed");
  });

  test("7 financial readiness classifications + full report + consumableByQ1109", async () => {
    const engine = await buildFullyReachable();
    const report = await engine.produceReport(sampleInput());
    assert.ok(["pass", "partial"].includes(report.validation.decision));
    assert.ok(report.reportId.startsWith("finart-rpt-"));
    assert.ok(report.timestamp);
    assert.equal(report.auditVersion, "Q11-FINART-v1");
    assert.equal(report.engineId, "PILLOW-FINART-001");
    assert.equal(report.missionId, "Q11-08");
    assert.equal(report.totalFinancialComponents, ALL_FINANCIAL_COMPONENT_KEYS.length);
    assert.equal(
      report.certifiedComponents +
        report.partiallyCertifiedComponents +
        report.failedComponents +
        report.missingComponents +
        report.blockedComponents +
        report.deferredComponents,
      ALL_FINANCIAL_COMPONENT_KEYS.length,
    );
    assert.ok(report.financialReadinessSummary);
    assert.ok(report.paymentWorkflowSummary);
    assert.ok(report.revenueRecordingSummary);
    assert.ok(report.expenseTrackingSummary);
    assert.ok(report.accountingRecordsSummary);
    assert.ok(report.financialReportingSummary);
    assert.ok(report.costControlSummary);
    assert.ok(report.financialGovernanceSummary);
    assert.ok(report.auditTraceabilitySummary);
    assert.ok(report.integrationSummary);
    assert.ok(report.governanceSummary);
    assert.ok(Array.isArray(report.supportingEvidence));
    assert.ok(Array.isArray(report.outstandingRisks));
    assert.ok(report.confidenceScore >= 0 && report.confidenceScore <= 1);
    assert.equal(report.metadataVersion, FINART_METADATA_VERSION);
    assert.equal(report.reportVersion, FINANCIAL_READINESS_AUDIT_REPORT_VERSION);
    assert.equal(report.workerId, "wkr-financial-readiness-audit-01");
    assert.ok(READINESS_DECISIONS.includes(report.decision));
    assert.equal(report.decision, "certify");
    assert.equal(report.certifiedComponents, ALL_FINANCIAL_COMPONENT_KEYS.length);
    assert.ok(report.validation);
    assert.equal(report.consumableByQ1109, true);
    assert.equal(report.neverImplementQ1109OrLater, true);
    assert.equal(report.structuralSignalOnly, true);
    assert.equal(report.evidenceBasedOnly, true);
    assert.equal(report.eighthQ11Gate, true);
    assert.ok(report.q1108ContractConsumed);
    assert.equal(report.q1108ContractConsumed.attempted, true);
    assert.equal(report.q1108ContractConsumed.consumed, true);
    assert.equal(report.componentInventory.length, ALL_FINANCIAL_COMPONENT_KEYS.length);
    assert.equal(report.assessments.length, ALL_FINANCIAL_COMPONENT_KEYS.length);
    for (const row of report.assessments) {
      assert.ok(row.componentId.length > 0);
      assert.ok(row.componentType.length > 0);
      assert.ok(row.financialCheckId.length > 0);
      assert.ok(row.financialScenario.length > 0);
      assert.ok(CHECK_STATUSES.includes(row.paymentWorkflowStatus));
      assert.ok(CHECK_STATUSES.includes(row.revenueRecordingStatus));
      assert.ok(CHECK_STATUSES.includes(row.expenseTrackingStatus));
      assert.ok(CHECK_STATUSES.includes(row.accountingRecordsStatus));
      assert.ok(CHECK_STATUSES.includes(row.financialReportingStatus));
      assert.ok(CHECK_STATUSES.includes(row.costControlStatus));
      assert.ok(CHECK_STATUSES.includes(row.financialGovernanceStatus));
      assert.ok(CHECK_STATUSES.includes(row.auditTraceabilityStatus));
      assert.ok(READINESS_CLASSIFICATIONS.includes(row.readinessClassification));
      assert.ok(Array.isArray(row.supportingEvidence));
      assert.ok(row.auditReference.length > 0);
      assert.ok(row.auditTimestamp.length > 0);
    }
    assert.ok(AUDIT_STATUSES.includes(report.auditStatus));
    assert.equal(report.auditStatus, "certified");
    const serialized = JSON.stringify(report).toLowerCase();
    assert.ok(!serialized.includes("executive acceptance pack implemented"), "must never claim to implement EAPRT");
    assert.ok(!serialized.includes("password="), "must never expose password values in the report");
  });

  test("8 exposes Q1109 contract without implementing Executive Acceptance Pack", async () => {
    const engine = await buildFullyReachable();
    const contract = engine.getQ1109ConsumableContract();
    assert.equal(contract.producedBy, "financial-readiness-audit");
    assert.equal(contract.missionId, "Q11-08");
    assert.equal(contract.consumerMissionId, "Q11-09");
    assert.ok(contract.exposedFields.length > 0);
    assert.ok(contract.readinessClassificationCatalog.length > 0);
    assert.ok(contract.decisionCatalog.length > 0);
    assert.equal(contract.neverImplementQ1109OrLater, true);
    assert.equal(contract.structuralSignalOnly, true);
    assert.ok(
      !JSON.stringify(contract).toLowerCase().includes("executive acceptance pack implemented"),
      "must never claim to implement Executive Acceptance Pack",
    );

    const report = await engine.produceReport(sampleInput());
    assert.equal(report.q1108ContractConsumed.attempted, true);
    assert.equal(report.q1108ContractConsumed.consumed, true);
  });

  test("9 consumes Q1108 from recoveryAudit when injected", async () => {
    const engine = await buildFullyReachable();
    const report = await engine.produceReport(sampleInput());
    assert.equal(report.q1108ContractConsumed.attempted, true);
    assert.equal(report.q1108ContractConsumed.consumed, true);
    assert.ok(report.q1108ContractConsumed.fields.length > 0);

    const bareEngine = await build();
    const bareReport = await bareEngine.produceReport(sampleInput());
    assert.equal(bareReport.q1108ContractConsumed.attempted, false);
    assert.equal(bareReport.q1108ContractConsumed.consumed, false);
  });

  test("10 rejects fabricate / execute-transactions / modify-records / governance bypass", async () => {
    const engine = await buildFullyReachable();
    for (const forbidden of [
      { fabricateFinancialEvidence: true },
      { forceFail: true },
      { certifyUnverifiedFinancialCapability: true },
      { executeFinancialTransactions: true },
      { modifyAccountingRecords: true },
      { assumeImplementation: true },
      { repairFailedFinancialComponents: true },
      { bypassPillowGovernance: true },
      { bypassGrandKingApproval: true },
      { overrideApprovedArchitecture: true },
      { overridePillow: true },
      { overrideGrandKing: true },
      { implementQ1109OrLater: true },
    ] as const) {
      const report = await engine.produceReport({
        ...sampleInput(),
        ...forbidden,
      });
      assert.equal(report.validation.decision, "fail", `expected fail for ${JSON.stringify(forbidden)}`);
      assert.equal(report.decision, "escalate");
    }
  });

  test("11 rejects Q11-09+ missionId", async () => {
    const engine = await buildFullyReachable();
    assert.equal(isForbiddenMissionId("Q11-08"), false);
    for (const missionId of ["Q11-09", "Q11-10", "Q12-01", "Q20-01"]) {
      assert.equal(isForbiddenMissionId(missionId), true, `expected forbidden: ${missionId}`);
      const report = await engine.produceReport({
        ...sampleInput(),
        missionId,
      });
      assert.equal(report.validation.decision, "fail", `expected fail for ${missionId}`);
      assert.equal(report.decision, "escalate");
    }
    const selfOk = await engine.produceReport({ ...sampleInput(), missionId: "Q11-08" });
    assert.notEqual(selfOk.decision, "escalate");
  });

  test("12 cockpit + history", async () => {
    const engine = await buildFullyReachable();
    await engine.produceReport(sampleInput());
    const cockpit = engine.getCockpitSnapshot();
    assert.equal(cockpit.missionId, "Q11-08");
    assert.ok(cockpit.totalReports >= 1);
    assert.equal(cockpit.lastDecision, "certify");
    assert.equal(cockpit.workerId, "wkr-financial-readiness-audit-01");
    assert.deepEqual([...cockpit.readinessClassificationOptions].sort(), [...READINESS_CLASSIFICATIONS].sort());
    assert.equal(cockpit.neverFabricateFinancialEvidence, true);
    assert.equal(cockpit.neverExecuteFinancialTransactions, true);
    assert.equal(cockpit.neverImplementQ1109OrLater, true);
    assert.equal(cockpit.eighthQ11Gate, true);

    const diagnostics = engine.runDiagnostics();
    assert.equal(diagnostics.missionId, "Q11-08");
    assert.ok(engine.getAuditTrail().length >= 1);
    assert.ok(engine.getCatalog());
    assert.ok(engine.getReports().length >= 1);
    assert.ok(engine.list().length >= 1);
    assert.ok(engine.getFinancialMatrix().length > 0);
    assert.ok(engine.getFinancialHistory().length > 0);

    const sync = engine.validateForSupervisorSync();
    assert.notEqual(sync.health, "blocked");
    assert.ok(sync.readinessScore > 0);
  });
});
