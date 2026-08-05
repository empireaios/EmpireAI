import { collectRecoveryComponentDiscovery } from "./recovery-discovery.js";
import {
  probeRecoveryCapabilities,
  verifyCheckpointRestoration,
  verifyEnterpriseResilience,
  verifyFailureDetection,
  verifyAutomaticRecovery,
  verifyManualRecovery,
  verifyRecoveryEscalation,
  verifyRollbackCapability,
  verifyWorkflowRestart,
} from "./capability-prober.js";
import { buildRecoveryAssessmentMatrix, resetRecoveryCheckSequenceForTesting } from "./recovery-classifier.js";
import { verifyIntegrations as computeIntegrationVerification } from "./integration-verifier.js";
import {
  evaluateCheckpointSummary,
  evaluateEscalationSummary,
  evaluateFailureDetectionSummary,
  evaluateGovernanceSummary,
  evaluateRecoveryReadinessSummary,
  evaluateResilienceSummary,
  evaluateRestartSummary,
  evaluateRollbackSummary,
} from "./recovery-evaluator.js";
import { evaluateRecoveryReadinessGates } from "./recovery-gates.js";
import { RecartValidator, HealthMonitor, RecoveryManager } from "./audit-validator.js";
import { AuditStore, nextReportId } from "./audit-store.js";
import { buildCatalog, buildOutstandingRisks, buildReport } from "./report-builder.js";
import { IntegrationCoordinator, type RecoveryAuditDependencies } from "./integrations.js";
import { appendRecartLog } from "./recart-logging.js";
import {
  INTEGRATION_TARGETS,
  RECART_CAPABILITIES,
  RECART_METADATA_VERSION,
  RECOVERY_AUDIT_IDENTITY,
  ALL_RECOVERY_COMPONENT_KEYS,
} from "./paths.js";
import type { RecoveryAuditConfiguration } from "./configuration.js";
import type {
  OperationalState,
  Q1108ConsumableContract,
  RecartEngineRecord,
  RecartInput,
  RecoveryAssessment,
  RecoveryAuditReport,
} from "./types.js";

export class RecoveryAuditManager {
  private repositoryRoot = "";
  private engineRecord: RecartEngineRecord | null = null;
  private readonly store = new AuditStore();
  private readonly validator = new RecartValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private seeded = false;

  setRepositoryRoot(root: string) {
    this.repositoryRoot = root;
  }

  bindIntegrations(deps: RecoveryAuditDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: RecoveryAuditConfiguration) {
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
      RECOVERY_AUDIT_IDENTITY.workerId,
      this.store.listReports(),
      this.integrations.getHandshakes(),
    );
  }

  getAuditTrail(limit = 100) {
    return this.store.getAuditTrail(limit);
  }

  getRecoveryHistory(limit = 100) {
    return this.store.getRecoveryHistory(limit);
  }

  getIntegrations() {
    return this.integrations.getHandshakes();
  }

  connect(config: RecoveryAuditConfiguration) {
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.ensureRecord("connected", config);
    appendRecartLog({
      event: "connect",
      details: `Recovery Audit connected; integrations=${handshakes.length}`,
    });
    return handshakes;
  }

  discoverRecoveryComponents(_config: RecoveryAuditConfiguration) {
    return collectRecoveryComponentDiscovery(this.integrations.getDependencies());
  }

  verifyFailureDetection(_config: RecoveryAuditConfiguration) {
    return verifyFailureDetection(this.integrations.getDependencies());
  }

  verifyAutomaticRecovery(_config: RecoveryAuditConfiguration) {
    return verifyAutomaticRecovery(this.integrations.getDependencies());
  }

  verifyManualRecovery(_config: RecoveryAuditConfiguration) {
    return verifyManualRecovery(this.integrations.getDependencies());
  }

  verifyRollbackCapability(_config: RecoveryAuditConfiguration) {
    return verifyRollbackCapability(this.integrations.getDependencies());
  }

  verifyWorkflowRestart(_config: RecoveryAuditConfiguration) {
    return verifyWorkflowRestart(this.integrations.getDependencies());
  }

  verifyCheckpointRestoration(_config: RecoveryAuditConfiguration) {
    return verifyCheckpointRestoration(this.integrations.getDependencies());
  }

  verifyRecoveryEscalation(_config: RecoveryAuditConfiguration) {
    return verifyRecoveryEscalation(this.integrations.getDependencies());
  }

  verifyEnterpriseResilience(_config: RecoveryAuditConfiguration) {
    return verifyEnterpriseResilience(this.integrations.getDependencies());
  }

  buildAssessments(_config: RecoveryAuditConfiguration): RecoveryAssessment[] {
    return buildRecoveryAssessmentMatrix(this.integrations.getDependencies());
  }

  probeRecoveryCapabilities(_config: RecoveryAuditConfiguration) {
    return probeRecoveryCapabilities(this.integrations.getDependencies());
  }

  verifyIntegrations() {
    return computeIntegrationVerification(this.integrations.getDependencies());
  }

  classifyRecoveryReadiness(config: RecoveryAuditConfiguration) {
    const matrix = this.buildAssessments(config);
    return {
      matrix,
      recoveryReadinessSummary: evaluateRecoveryReadinessSummary(matrix),
    };
  }

  produceRecoveryReadinessFindings(input: RecartInput, config: RecoveryAuditConfiguration) {
    const matrix = this.buildAssessments(config);
    const recoveryReadinessSummary = evaluateRecoveryReadinessSummary(matrix);
    const governanceSummary = evaluateGovernanceSummary(this.repositoryRoot, config, this.integrations.getDependencies());
    return { matrix, recoveryReadinessSummary, governanceSummary };
  }

  async produceReport(input: RecartInput, config: RecoveryAuditConfiguration): Promise<RecoveryAuditReport> {
    this.ensureSeeded(config);
    const started = Date.now();
    if (this.validator.hasBoundaryViolation(input)) {
      return this.rejectedReport(input, config, started);
    }

    const discovery = this.discoverRecoveryComponents(config);
    const matrix = this.buildAssessments(config);
    const recoveryReadinessSummary = evaluateRecoveryReadinessSummary(matrix);
    const governanceSummary = evaluateGovernanceSummary(this.repositoryRoot, config, this.integrations.getDependencies());
    const integrationVerification = this.verifyIntegrations();
    const q1107ContractConsumed = this.integrations.attemptQ1107ContractHandshake();

    const decision = evaluateRecoveryReadinessGates({
      matrix,
      recoveryReadinessSummary,
      governanceSummary,
      integrationsAllBound: integrationVerification.allBound,
      q1107Consumed: q1107ContractConsumed.consumed,
      q1107Attempted: q1107ContractConsumed.attempted,
      input,
    });

    const outstandingRisks = buildOutstandingRisks(matrix, governanceSummary, integrationVerification, recoveryReadinessSummary);
    const validation = this.validator.validateInput({ ...input, validated: input.validated ?? true }, started);

    const report = buildReport({
      reportId: input.reportId,
      componentInventory: discovery.components,
      assessments: matrix,
      governanceSummary,
      recoverySummary: recoveryReadinessSummary,
      failureDetectionSummary: evaluateFailureDetectionSummary(matrix),
      restartSummary: evaluateRestartSummary(matrix),
      rollbackSummary: evaluateRollbackSummary(matrix),
      checkpointSummary: evaluateCheckpointSummary(matrix),
      escalationSummary: evaluateEscalationSummary(matrix),
      resilienceSummary: evaluateResilienceSummary(matrix),
      integrationVerification,
      q1107ContractConsumed,
      decision,
      outstandingRisks,
      validation,
      workerId: config.workerId,
      consumableByQ1108: true,
    });

    const saved = this.store.saveReport(report, "produce_report");
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", saved);
    appendRecartLog({
      event: "produce_report",
      details: `report=${saved.reportId} decision=${saved.decision} confidence=${saved.confidenceScore}`,
    });
    return saved;
  }

  async submitReport(input: RecartInput, config: RecoveryAuditConfiguration): Promise<RecoveryAuditReport> {
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
    const updated: RecoveryAuditReport = {
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

  validate(input: RecartInput, started = Date.now()) {
    return this.validator.validateInput(input, started);
  }

  diagnostics(config: RecoveryAuditConfiguration) {
    this.ensureSeeded(config);
    return {
      missionId: "Q11-07" as const,
      workerId: config.workerId,
      enabled: config.enabled,
      reports: this.store.reportCount(),
      failureCount: this.recovery.failureCount(),
      locks: config,
    };
  }

  getRecoveryMatrix() {
    return this.store.getLatestReport()?.assessments ?? [];
  }

  getQ1108ConsumableContract(): Q1108ConsumableContract {
    return {
      contractId: `q1108-contract-${RECART_METADATA_VERSION}`,
      contractVersion: RECART_METADATA_VERSION,
      producedBy: "recovery-audit",
      missionId: "Q11-07",
      consumerMissionId: "Q11-08",
      exposedFields: [
        "assessments",
        "recoverySummary",
        "decision",
        "componentInventory",
        "resilienceSummary",
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
        "Recovery Audit Q11-07 certified — stops at Q11-07, exposes Q1108ConsumableContract for Q11-08 (Financial Readiness Audit)",
        "This contract is structural-signal-only; Q11-07 never implements Q11-08 or any later mission itself",
        "Audit verifies recovery CAPABILITY presence only — destructive recovery methods are NEVER invoked during audit",
      ],
      neverImplementQ1108OrLater: true,
      structuralSignalOnly: true,
    };
  }

  private async rejectedReport(
    input: RecartInput,
    config: RecoveryAuditConfiguration,
    started: number,
  ): Promise<RecoveryAuditReport> {
    const errors = this.validator.collectBoundaryErrors(input);
    const validation = this.validator.finalize("fail", errors, [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    appendRecartLog({ event: "boundary_reject", details: errors.join(";") });
    const now = new Date().toISOString();
    const emptyDimension = (dimension: "failureDetection" | "workflowRestart" | "rollback" | "checkpointRestoration" | "escalation" | "enterpriseResilience") => ({
      dimension,
      passedCount: 0,
      partialCount: 0,
      failedCount: 0,
      missingCount: 0,
      totalComponents: 0,
      evidence: [] as string[],
    });
    return buildReport({
      reportId: `recart-rejected-${nextReportId()}`,
      componentInventory: [],
      assessments: [],
      governanceSummary: {
        compliant: false,
        grandKingApprovalRequired: true,
        recoveryAuditRequired: true,
        selfDocPresent: false,
        selfDocPath: "",
        boundaryLocksHonoured: false,
        requiredComponentsBoundCount: 0,
        totalRequiredComponents: 0,
        evidence: [],
      },
      recoverySummary: {
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
      failureDetectionSummary: emptyDimension("failureDetection"),
      restartSummary: emptyDimension("workflowRestart"),
      rollbackSummary: emptyDimension("rollback"),
      checkpointSummary: emptyDimension("checkpointRestoration"),
      escalationSummary: emptyDimension("escalation"),
      resilienceSummary: emptyDimension("enterpriseResilience"),
      integrationVerification: { verifiedAt: now, rows: [], totalTargets: 0, boundCount: 0, allBound: false, evidence: [] },
      q1107ContractConsumed: {
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
      consumableByQ1108: false,
    });
  }

  private ensureRecord(
    state: OperationalState,
    config: RecoveryAuditConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "pending",
    latestReport: RecoveryAuditReport | null = null,
  ) {
    const health = this.healthMonitor.status(
      validationStatus === "failed" ? "fail" : validationStatus === "partial" ? "partial" : "pass",
      config.enabled,
    );
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `recart-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: "recovery-audit",
      engineVersion: "PILLOW-RECART-001",
      currentOperationalState: state,
      healthStatus: health,
      validationStatus,
      supportedCapabilities: [...RECART_CAPABILITIES],
      totalReports: this.store.reportCount(),
      lastReportId: latestReport?.reportId ?? this.store.getLatestReportId(),
      lastDecision: latestReport?.decision ?? null,
      lastConfidenceScore: latestReport?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: RECART_METADATA_VERSION,
    };
  }
}

export function resetRecoveryAuditManagerSequencesForTesting() {
  resetRecoveryCheckSequenceForTesting();
}
