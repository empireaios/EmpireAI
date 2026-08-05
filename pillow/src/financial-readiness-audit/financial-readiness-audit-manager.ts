import { collectFinancialComponentDiscovery } from "./financial-discovery.js";
import {
  probeFinancialCapabilities,
  verifyPaymentWorkflows,
  verifyRevenueRecording,
  verifyExpenseTracking,
  verifyAccountingRecords,
  verifyFinancialReporting,
  verifyCostControls,
  verifyFinancialGovernance,
  verifyAuditTraceability,
} from "./capability-prober.js";
import { buildFinancialAssessmentMatrix, resetFinancialCheckSequenceForTesting } from "./financial-classifier.js";
import { verifyIntegrations as computeIntegrationVerification } from "./integration-verifier.js";
import {
  evaluateAccountingRecordsSummary,
  evaluateAuditTraceabilitySummary,
  evaluateCostControlSummary,
  evaluateExpenseTrackingSummary,
  evaluateFinancialGovernanceSummary,
  evaluateFinancialReportingSummary,
  evaluateFinancialReadinessSummary,
  evaluateGovernanceSummary,
  evaluatePaymentWorkflowSummary,
  evaluateRevenueRecordingSummary,
} from "./financial-evaluator.js";
import { evaluateFinancialReadinessGates } from "./financial-gates.js";
import { FinartValidator, HealthMonitor, FinancialManager } from "./audit-validator.js";
import { AuditStore, nextReportId } from "./audit-store.js";
import { buildCatalog, buildOutstandingRisks, buildReport } from "./report-builder.js";
import { IntegrationCoordinator, type FinancialReadinessAuditDependencies } from "./integrations.js";
import { appendFinartLog } from "./finart-logging.js";
import {
  INTEGRATION_TARGETS,
  FINART_CAPABILITIES,
  FINART_METADATA_VERSION,
  FINANCIAL_READINESS_AUDIT_IDENTITY,
  ALL_FINANCIAL_COMPONENT_KEYS,
} from "./paths.js";
import type { FinancialReadinessAuditConfiguration } from "./configuration.js";
import type {
  OperationalState,
  Q1109ConsumableContract,
  FinartEngineRecord,
  FinartInput,
  FinancialAssessment,
  FinancialReadinessAuditReport,
} from "./types.js";

export class FinancialReadinessAuditManager {
  private repositoryRoot = "";
  private engineRecord: FinartEngineRecord | null = null;
  private readonly store = new AuditStore();
  private readonly validator = new FinartValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly financial = new FinancialManager();
  private readonly integrations = new IntegrationCoordinator();
  private seeded = false;

  setRepositoryRoot(root: string) {
    this.repositoryRoot = root;
  }

  bindIntegrations(deps: FinancialReadinessAuditDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: FinancialReadinessAuditConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedReports);
    this.seeded = true;
    this.ensureRecord("connected", config);
  }

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
          integrationTargets: [...this.engineRecord.integrationTargets],
        }
      : null;
  }

  getReports() {
    return this.store.listReports();
  }

  getLatestReport() {
    return this.store.getLatestReport();
  }

  getLatestReportId() {
    return this.store.getLatestReportId();
  }

  getCatalog() {
    return buildCatalog(
      FINANCIAL_READINESS_AUDIT_IDENTITY.workerId,
      this.store.listReports(),
      this.integrations.getHandshakes(),
    );
  }

  getAuditTrail(limit = 100) {
    return this.store.getAuditTrail(limit);
  }

  getFinancialHistory(limit = 100) {
    return this.store.getFinancialHistory(limit);
  }

  getIntegrations() {
    return this.integrations.getHandshakes();
  }

  connect(config: FinancialReadinessAuditConfiguration) {
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.ensureRecord("connected", config);
    appendFinartLog({
      event: "connect",
      details: `Financial Readiness Audit connected; integrations=${handshakes.length}`,
    });
    return handshakes;
  }

  discoverFinancialComponents(_config: FinancialReadinessAuditConfiguration) {
    return collectFinancialComponentDiscovery(this.integrations.getDependencies());
  }

  verifyPaymentWorkflows(_config: FinancialReadinessAuditConfiguration) {
    return verifyPaymentWorkflows(this.integrations.getDependencies());
  }

  verifyRevenueRecording(_config: FinancialReadinessAuditConfiguration) {
    return verifyRevenueRecording(this.integrations.getDependencies());
  }

  verifyExpenseTracking(_config: FinancialReadinessAuditConfiguration) {
    return verifyExpenseTracking(this.integrations.getDependencies());
  }

  verifyAccountingRecords(_config: FinancialReadinessAuditConfiguration) {
    return verifyAccountingRecords(this.integrations.getDependencies());
  }

  verifyFinancialReporting(_config: FinancialReadinessAuditConfiguration) {
    return verifyFinancialReporting(this.integrations.getDependencies());
  }

  verifyCostControls(_config: FinancialReadinessAuditConfiguration) {
    return verifyCostControls(this.integrations.getDependencies());
  }

  verifyFinancialGovernance(_config: FinancialReadinessAuditConfiguration) {
    return verifyFinancialGovernance(this.integrations.getDependencies());
  }

  verifyAuditTraceability(_config: FinancialReadinessAuditConfiguration) {
    return verifyAuditTraceability(this.integrations.getDependencies());
  }

  buildAssessments(_config: FinancialReadinessAuditConfiguration): FinancialAssessment[] {
    return buildFinancialAssessmentMatrix(this.integrations.getDependencies());
  }

  probeFinancialCapabilities(_config: FinancialReadinessAuditConfiguration) {
    return probeFinancialCapabilities(this.integrations.getDependencies());
  }

  verifyIntegrations() {
    return computeIntegrationVerification(this.integrations.getDependencies());
  }

  classifyFinancialReadiness(config: FinancialReadinessAuditConfiguration) {
    const matrix = this.buildAssessments(config);
    return {
      matrix,
      financialReadinessSummary: evaluateFinancialReadinessSummary(matrix),
    };
  }

  produceFinancialReadinessFindings(input: FinartInput, config: FinancialReadinessAuditConfiguration) {
    const matrix = this.buildAssessments(config);
    const financialReadinessSummary = evaluateFinancialReadinessSummary(matrix);
    const governanceSummary = evaluateGovernanceSummary(this.repositoryRoot, config, this.integrations.getDependencies());
    return { matrix, financialReadinessSummary, governanceSummary };
  }

  async produceReport(input: FinartInput, config: FinancialReadinessAuditConfiguration): Promise<FinancialReadinessAuditReport> {
    this.ensureSeeded(config);
    const started = Date.now();
    if (this.validator.hasBoundaryViolation(input)) {
      return this.rejectedReport(input, config, started);
    }

    const discovery = this.discoverFinancialComponents(config);
    const matrix = this.buildAssessments(config);
    const financialReadinessSummary = evaluateFinancialReadinessSummary(matrix);
    const governanceSummary = evaluateGovernanceSummary(this.repositoryRoot, config, this.integrations.getDependencies());
    const integrationVerification = this.verifyIntegrations();
    const q1108ContractConsumed = this.integrations.attemptQ1108ContractHandshake();

    const decision = evaluateFinancialReadinessGates({
      matrix,
      financialReadinessSummary,
      governanceSummary,
      integrationsAllBound: integrationVerification.allBound,
      q1108Consumed: q1108ContractConsumed.consumed,
      q1108Attempted: q1108ContractConsumed.attempted,
      input,
    });

    const outstandingRisks = buildOutstandingRisks(matrix, governanceSummary, integrationVerification, financialReadinessSummary);
    const validation = this.validator.validateInput({ ...input, validated: input.validated ?? true }, started);

    const report = buildReport({
      reportId: input.reportId,
      componentInventory: discovery.components,
      assessments: matrix,
      governanceSummary,
      financialReadinessSummary,
      paymentWorkflowSummary: evaluatePaymentWorkflowSummary(matrix),
      revenueRecordingSummary: evaluateRevenueRecordingSummary(matrix),
      expenseTrackingSummary: evaluateExpenseTrackingSummary(matrix),
      accountingRecordsSummary: evaluateAccountingRecordsSummary(matrix),
      financialReportingSummary: evaluateFinancialReportingSummary(matrix),
      costControlSummary: evaluateCostControlSummary(matrix),
      financialGovernanceSummary: evaluateFinancialGovernanceSummary(matrix),
      auditTraceabilitySummary: evaluateAuditTraceabilitySummary(matrix),
      integrationVerification,
      q1108ContractConsumed,
      decision,
      outstandingRisks,
      validation,
      workerId: config.workerId,
      consumableByQ1109: true,
    });

    const saved = this.store.saveReport(report, "produce_report");
    if (validation.decision === "fail") this.financial.recordFailure();
    else this.financial.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", saved);
    appendFinartLog({
      event: "produce_report",
      details: `report=${saved.reportId} decision=${saved.decision} confidence=${saved.confidenceScore}`,
    });
    return saved;
  }

  async submitReport(input: FinartInput, config: FinancialReadinessAuditConfiguration): Promise<FinancialReadinessAuditReport> {
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.rejectedReport(input, config, Date.now());
    }
    let report =
      (input.reportId?.trim() ? this.store.getReport(input.reportId.trim()) : null) ?? this.store.getLatestReport();
    if (!report) {
      report = await this.produceReport(input, config);
      if (report.validation.decision === "fail") return report;
    }
    const submission = this.integrations.submitReport(report);
    const updated: FinancialReadinessAuditReport = {
      ...report,
      submittedToExecutiveReporting: submission.submitted,
      executiveReportId: submission.executiveReportId,
      auditStatus: submission.submitted ? "submitted" : report.auditStatus,
    };
    const saved = this.store.saveReport(updated, "submit_report");
    this.ensureRecord("active", config, "passed", saved);
    return saved;
  }

  list() {
    return this.store.listReports();
  }

  validate(input: FinartInput, started = Date.now()) {
    return this.validator.validateInput(input, started);
  }

  diagnostics(config: FinancialReadinessAuditConfiguration) {
    this.ensureSeeded(config);
    return {
      missionId: "Q11-08" as const,
      workerId: config.workerId,
      enabled: config.enabled,
      reports: this.store.reportCount(),
      failureCount: this.financial.failureCount(),
      locks: config,
    };
  }

  getFinancialMatrix() {
    return this.store.getLatestReport()?.assessments ?? [];
  }

  getQ1109ConsumableContract(): Q1109ConsumableContract {
    return {
      contractId: `q1109-contract-${FINART_METADATA_VERSION}`,
      contractVersion: FINART_METADATA_VERSION,
      producedBy: "financial-readiness-audit",
      missionId: "Q11-08",
      consumerMissionId: "Q11-09",
      exposedFields: [
        "assessments",
        "financialReadinessSummary",
        "decision",
        "componentInventory",
        "paymentWorkflowSummary",
        "outstandingRisks",
        "confidenceScore",
      ],
      readinessClassificationCatalog: [
        "certified",
        "partially_certified",
        "failed",
        "missing",
        "blocked",
        "deferred",
      ],
      decisionCatalog: ["certify", "withhold", "escalate", "defer"],
      notes: [
        "Financial Readiness Audit Q11-08 certified — stops at Q11-08, exposes Q1109ConsumableContract for Q11-09 (Executive Acceptance Pack)",
        "This contract is structural-signal-only; Q11-08 never implements Q11-09 or any later mission itself",
        "Audit verifies financial CAPABILITY presence only — mutating financial methods are NEVER invoked during audit",
      ],
      neverImplementQ1109OrLater: true,
      structuralSignalOnly: true,
    };
  }

  private async rejectedReport(
    input: FinartInput,
    config: FinancialReadinessAuditConfiguration,
    started: number,
  ): Promise<FinancialReadinessAuditReport> {
    const errors = this.validator.collectBoundaryErrors(input);
    const validation = this.validator.finalize("fail", errors, [], started);
    this.financial.recordFailure();
    this.ensureRecord("failed", config, "failed");
    appendFinartLog({ event: "boundary_reject", details: errors.join(";") });
    const now = new Date().toISOString();
    const emptyDimension = (
      dimension:
        | "paymentWorkflows"
        | "revenueRecording"
        | "expenseTracking"
        | "accountingRecords"
        | "financialReporting"
        | "costControls"
        | "financialGovernance"
        | "auditTraceability",
    ) => ({
      dimension,
      passedCount: 0,
      partialCount: 0,
      failedCount: 0,
      missingCount: 0,
      totalComponents: 0,
      evidence: [] as string[],
    });
    return buildReport({
      reportId: `finart-rejected-${nextReportId()}`,
      componentInventory: [],
      assessments: [],
      governanceSummary: {
        compliant: false,
        grandKingApprovalRequired: true,
        financialReadinessAuditRequired: true,
        selfDocPresent: false,
        selfDocPath: "",
        boundaryLocksHonoured: false,
        requiredComponentsBoundCount: 0,
        totalRequiredComponents: 0,
        evidence: [],
      },
      financialReadinessSummary: {
        computedAt: now,
        totalComponents: 0,
        certifiedCount: 0,
        partiallyCertifiedCount: 0,
        failedCount: 0,
        missingCount: 0,
        blockedCount: 0,
        deferredCount: 0,
        overallReadinessScore: 0,
        allCertified: false,
        notes: ["Rejected before evidence collection"],
        evidence: [],
      },
      paymentWorkflowSummary: emptyDimension("paymentWorkflows"),
      revenueRecordingSummary: emptyDimension("revenueRecording"),
      expenseTrackingSummary: emptyDimension("expenseTracking"),
      accountingRecordsSummary: emptyDimension("accountingRecords"),
      financialReportingSummary: emptyDimension("financialReporting"),
      costControlSummary: emptyDimension("costControls"),
      financialGovernanceSummary: emptyDimension("financialGovernance"),
      auditTraceabilitySummary: emptyDimension("auditTraceability"),
      integrationVerification: { verifiedAt: now, rows: [], totalTargets: 0, boundCount: 0, allBound: false, evidence: [] },
      q1108ContractConsumed: {
        attempted: false,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: "Rejected before handshake",
      },
      decision: "escalate",
      outstandingRisks: errors,
      validation,
      workerId: config.workerId,
      consumableByQ1109: false,
    });
  }

  private ensureRecord(
    state: OperationalState,
    config: FinancialReadinessAuditConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "pending",
    latestReport: FinancialReadinessAuditReport | null = null,
  ) {
    const health = this.healthMonitor.status(
      validationStatus === "failed" ? "fail" : validationStatus === "partial" ? "partial" : "pass",
      config.enabled,
    );
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `finart-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: "financial-readiness-audit",
      engineVersion: "PILLOW-FINART-001",
      currentOperationalState: state,
      healthStatus: health,
      validationStatus,
      supportedCapabilities: [...FINART_CAPABILITIES],
      totalReports: this.store.reportCount(),
      lastReportId: latestReport?.reportId ?? this.store.getLatestReportId(),
      lastDecision: latestReport?.decision ?? null,
      lastConfidenceScore: latestReport?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: FINART_METADATA_VERSION,
    };
  }
}

export function resetFinancialReadinessAuditManagerSequencesForTesting() {
  resetFinancialCheckSequenceForTesting();
}
