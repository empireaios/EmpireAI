import { QscptValidator, GateManager, HealthMonitor } from "./audit-validator.js";
import { AuditStore, nextHistoryEntryId, resetQSeriesCompletionManagerSequencesForTesting } from "./audit-store.js";
import type { QSeriesCompletionConfiguration } from "./configuration.js";
import {
  aggregateFinalCompletionEvidence,
  buildCompletionRecords,
  buildOutstandingIssues,
  classifyCompletionReadiness,
  produceFinalCompletionDecision,
  verifyCertificationCompletion,
  verifyGovernanceCompliance,
  verifyMissionCompletion,
  verifyProductionReadiness,
  verifyRuntimeIntegration,
  verifyWorkforceCapabilities,
} from "./evidence-collector.js";
import {
  IntegrationCoordinator,
  verifyIntegrations,
  type QSeriesCompletionDependencies,
} from "./integrations.js";
import { appendQscptLog } from "./qscpt-logging.js";
import { buildCatalog, buildReport } from "./report-builder.js";
import {
  INTEGRATION_TARGETS,
  QSCPT_CAPABILITIES,
  QSCPT_METADATA_VERSION,
  Q_SERIES_COMPLETION_IDENTITY,
} from "./paths.js";
import type {
  CompletionHistoryEntry,
  CompletionClassification,
  OperationalState,
  Q1201ConsumableContract,
  QscptEngineRecord,
  QscptInput,
  QSeriesCompletionReport,
} from "./types.js";

export { resetQSeriesCompletionManagerSequencesForTesting };

export class QSeriesCompletionManager {
  private repositoryRoot = "";
  private engineRecord: QscptEngineRecord | null = null;
  private readonly store = new AuditStore();
  private readonly validator = new QscptValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly gateManager = new GateManager();
  private readonly integrations = new IntegrationCoordinator();
  private seeded = false;

  setRepositoryRoot(root: string) {
    this.repositoryRoot = root;
  }

  bindIntegrations(deps: QSeriesCompletionDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: QSeriesCompletionConfiguration) {
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

  getCatalog() {
    return buildCatalog(
      Q_SERIES_COMPLETION_IDENTITY.workerId,
      this.store.listReports(),
      this.integrations.getHandshakes(),
    );
  }

  getCompletionHistory(limit = 100) {
    return this.store.getCompletionHistory(limit);
  }

  getAuditTrail(limit = 100) {
    return this.store.getAuditTrail(limit);
  }

  getIntegrations() {
    return this.integrations.getHandshakes();
  }

  connect(config: QSeriesCompletionConfiguration) {
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.ensureRecord("connected", config);
    appendQscptLog({ event: "connect", details: `Q Series Completion connected; integrations=${handshakes.length}` });
    return handshakes;
  }

  verifyMissionCompletion() {
    return verifyMissionCompletion(this.integrations.getDependencies());
  }

  verifyWorkforceCapabilities() {
    return verifyWorkforceCapabilities(this.integrations.getDependencies());
  }

  verifyRuntimeIntegration() {
    return verifyRuntimeIntegration(this.integrations.getDependencies());
  }

  verifyGovernanceCompliance() {
    return verifyGovernanceCompliance(this.integrations.getDependencies());
  }

  verifyCertificationCompletion() {
    const q1113 = this.integrations.attemptQ1113ContractHandshake();
    return verifyCertificationCompletion(this.integrations.getDependencies(), q1113.consumed);
  }

  verifyProductionReadiness() {
    return verifyProductionReadiness(this.integrations.getDependencies());
  }

  aggregateFinalCompletionEvidence() {
    const deps = this.integrations.getDependencies();
    const q1113 = this.integrations.attemptQ1113ContractHandshake();
    const missionSummary = verifyMissionCompletion(deps);
    const { factorySummary, workerSummary } = verifyWorkforceCapabilities(deps);
    const runtimeSummary = verifyRuntimeIntegration(deps);
    const governanceSummary = verifyGovernanceCompliance(deps);
    const certificationSummary = verifyCertificationCompletion(deps, q1113.consumed);
    const productionSummary = verifyProductionReadiness(deps);
    return aggregateFinalCompletionEvidence(deps, {
      missionSummary,
      factorySummary,
      workerSummary,
      runtimeSummary,
      governanceSummary,
      certificationSummary,
      productionSummary,
    });
  }

  produceFinalCompletionDecision(input: QscptInput = {}) {
    const deps = this.integrations.getDependencies();
    const q1113 = this.integrations.attemptQ1113ContractHandshake();
    const missionSummary = verifyMissionCompletion(deps);
    const { factorySummary, workerSummary } = verifyWorkforceCapabilities(deps);
    const runtimeSummary = verifyRuntimeIntegration(deps);
    const governanceSummary = verifyGovernanceCompliance(deps);
    const certificationSummary = verifyCertificationCompletion(deps, q1113.consumed);
    const productionSummary = verifyProductionReadiness(deps);
    const aggregated = aggregateFinalCompletionEvidence(deps, {
      missionSummary,
      factorySummary,
      workerSummary,
      runtimeSummary,
      governanceSummary,
      certificationSummary,
      productionSummary,
      deferCompletion: input.deferCompletion,
    });
    const readiness = classifyCompletionReadiness({
      missionSummary,
      factorySummary,
      workerSummary,
      runtimeSummary,
      governanceSummary,
      certificationSummary,
      productionSummary,
      aggregated,
      deferCompletion: input.deferCompletion,
    });
    const decision = produceFinalCompletionDecision(
      readiness,
      missionSummary,
      certificationSummary,
      productionSummary,
      workerSummary,
      runtimeSummary,
      input.deferCompletion,
    );
    return { decision, readiness, missionSummary, certificationSummary, productionSummary };
  }

  async produceQSeriesCompletionReport(
    input: QscptInput,
    config: QSeriesCompletionConfiguration,
    started = Date.now(),
  ): Promise<QSeriesCompletionReport> {
    if (this.validator.hasBoundaryViolation(input)) {
      return this.rejectedReport(input, config, started);
    }

    const validation = this.validator.validateInput(input, started);
    const q1113ContractConsumed = this.integrations.attemptQ1113ContractHandshake();
    const deps = this.integrations.getDependencies();

    const missionSummary = verifyMissionCompletion(deps);
    const { factorySummary, workerSummary } = verifyWorkforceCapabilities(deps);
    const runtimeSummary = verifyRuntimeIntegration(deps);
    const governanceSummary = verifyGovernanceCompliance(deps);
    const certificationSummary = verifyCertificationCompletion(deps, q1113ContractConsumed.consumed);
    const productionSummary = verifyProductionReadiness(deps);
    const aggregated = aggregateFinalCompletionEvidence(deps, {
      missionSummary,
      factorySummary,
      workerSummary,
      runtimeSummary,
      governanceSummary,
      certificationSummary,
      productionSummary,
      deferCompletion: input.deferCompletion,
    });
    const readiness = classifyCompletionReadiness({
      missionSummary,
      factorySummary,
      workerSummary,
      runtimeSummary,
      governanceSummary,
      certificationSummary,
      productionSummary,
      aggregated,
      deferCompletion: input.deferCompletion,
    });

    const finalCompletionDecision = produceFinalCompletionDecision(
      readiness,
      missionSummary,
      certificationSummary,
      productionSummary,
      workerSummary,
      runtimeSummary,
      input.deferCompletion,
    );

    const supportingEvidence = [
      ...readiness.evidence,
      q1113ContractConsumed.evidence,
      `finalCompletionDecision=${finalCompletionDecision}`,
    ];
    const outstandingIssues = buildOutstandingIssues(
      missionSummary,
      certificationSummary,
      productionSummary,
      governanceSummary,
      readiness,
    );
    const assessments = buildCompletionRecords(
      missionSummary,
      factorySummary,
      workerSummary,
      runtimeSummary,
      governanceSummary,
      certificationSummary,
      productionSummary,
      finalCompletionDecision,
    );

    const report = buildReport({
      reportId: input.reportId,
      workerId: config.workerId,
      missionSummary,
      factorySummary,
      workerSummary,
      runtimeSummary,
      governanceSummary,
      certificationSummary,
      productionReadinessSummary: productionSummary,
      aggregated,
      readiness,
      finalCompletionDecision,
      assessments,
      supportingEvidence,
      outstandingIssues,
      confidenceScore: readiness.readinessScore,
      validation,
      q1113ContractConsumed: {
        attempted: q1113ContractConsumed.attempted,
        consumed: q1113ContractConsumed.consumed,
        contractVersion: q1113ContractConsumed.contractVersion,
        fields: q1113ContractConsumed.fields,
        evidence: q1113ContractConsumed.evidence,
      },
    });

    this.store.saveReport(report);
    this.store.saveHistory(this.buildHistoryEntry(report, readiness.overallClassification));
    this.ensureRecord(
      finalCompletionDecision === "complete" ? "active" : "standby",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      finalCompletionDecision,
      readiness.readinessScore,
    );
    appendQscptLog({ event: "produce_report", details: report.reportId });
    return report;
  }

  async completeQSeries(input: QscptInput, config: QSeriesCompletionConfiguration) {
    return this.produceQSeriesCompletionReport(input, config);
  }

  async submitReport(input: QscptInput, config: QSeriesCompletionConfiguration) {
    const report = await this.produceQSeriesCompletionReport(input, config);
    if (report.validation.decision === "fail") return report;
    const submission = this.integrations.submitReport(report);
    return {
      ...report,
      submittedToExecutiveReporting: submission.submitted,
      executiveReportId: submission.executiveReportId,
    };
  }

  list() {
    return this.store.listReports();
  }

  validate(input: QscptInput, started = Date.now()) {
    return this.validator.validateInput(input, started);
  }

  diagnostics(config: QSeriesCompletionConfiguration) {
    this.ensureSeeded(config);
    const decisionBundle = this.produceFinalCompletionDecision();
    return {
      missionId: "Q11-13" as const,
      workerId: config.workerId,
      enabled: config.enabled,
      reports: this.store.reportCount(),
      failureCount: this.gateManager.failureCount(),
      overallClassification: decisionBundle.readiness.overallClassification,
      readinessScore: decisionBundle.readiness.readinessScore,
      lastCompletionDecision: decisionBundle.decision,
      integrations: verifyIntegrations(this.integrations.getDependencies()),
      locks: config,
    };
  }

  getQ1201ConsumableContract(): Q1201ConsumableContract {
    return {
      contractId: `q1201-contract-${QSCPT_METADATA_VERSION}`,
      contractVersion: QSCPT_METADATA_VERSION,
      producedBy: "q-series-completion",
      missionId: "Q11-13",
      consumerMissionId: "Q12-01",
      exposedFields: [
        "missionSummary",
        "factorySummary",
        "workerSummary",
        "runtimeSummary",
        "governanceSummary",
        "certificationSummary",
        "productionReadinessSummary",
        "finalCompletionDecision",
        "assessments",
        "outstandingIssues",
        "confidenceScore",
      ],
      completionDecisionCatalog: ["complete", "incomplete", "withhold", "escalate", "defer"],
      notes: [
        "Q Series Completion Q11-13 — FINAL Q11 mission; exposes Q1201ConsumableContract as series-complete prerequisite for Q12-01 AI Innovation Factory",
        "This contract coexists with GKAGT Q1201 — do NOT remove grand-king-acceptance-gate getQ1201ConsumableContract",
        "Q11-13 never implements Q12-01 or any later mission itself",
        "Honest complete rule: complete only when QSCRT certify + FINART present + EAPRT certify + GK approve+authorised + PLMRT productionActive",
        "Live run expected incomplete/withhold when FINART/EAPRT/GK/PLMRT/QSCRT chain incomplete",
      ],
      neverImplementQ1201OrLater: true,
      structuralSignalOnly: true,
      seriesCompletePrerequisite: true,
    };
  }

  private buildHistoryEntry(
    report: QSeriesCompletionReport,
    overallClassification: CompletionClassification,
  ): CompletionHistoryEntry {
    return {
      entryId: nextHistoryEntryId(),
      timestamp: report.timestamp,
      reportId: report.reportId,
      finalCompletionDecision: report.finalCompletionDecision,
      overallClassification,
      evidence: report.supportingEvidence.slice(0, 5),
    };
  }

  private async rejectedReport(
    input: QscptInput,
    config: QSeriesCompletionConfiguration,
    started: number,
  ): Promise<QSeriesCompletionReport> {
    const errors = this.validator.collectBoundaryErrors(input);
    const validation = this.validator.finalize("fail", errors, [], started);
    this.gateManager.recordFailure();
    this.ensureRecord("failed", config, "failed");
    appendQscptLog({ event: "boundary_reject", details: errors.join(";") });

    const q1113ContractConsumed = this.integrations.attemptQ1113ContractHandshake();
    const deps = this.integrations.getDependencies();
    const missionSummary = verifyMissionCompletion(deps);
    const { factorySummary, workerSummary } = verifyWorkforceCapabilities(deps);
    const runtimeSummary = verifyRuntimeIntegration(deps);
    const governanceSummary = verifyGovernanceCompliance(deps);
    const certificationSummary = verifyCertificationCompletion(deps, q1113ContractConsumed.consumed);
    const productionSummary = verifyProductionReadiness(deps);
    const aggregated = aggregateFinalCompletionEvidence(deps, {
      missionSummary,
      factorySummary,
      workerSummary,
      runtimeSummary,
      governanceSummary,
      certificationSummary,
      productionSummary,
    });
    const readiness = classifyCompletionReadiness({
      missionSummary,
      factorySummary,
      workerSummary,
      runtimeSummary,
      governanceSummary,
      certificationSummary,
      productionSummary,
      aggregated,
    });

    const report = buildReport({
      reportId: input.reportId,
      workerId: config.workerId,
      missionSummary,
      factorySummary,
      workerSummary,
      runtimeSummary,
      governanceSummary,
      certificationSummary,
      productionReadinessSummary: productionSummary,
      aggregated,
      readiness: { ...readiness, overallClassification: "failed", readinessScore: 0 },
      finalCompletionDecision: "withhold",
      assessments: [],
      supportingEvidence: [...errors, ...readiness.evidence],
      outstandingIssues: [...errors, "boundary violation — report rejected"],
      confidenceScore: 0,
      validation,
      q1113ContractConsumed: {
        attempted: q1113ContractConsumed.attempted,
        consumed: q1113ContractConsumed.consumed,
        contractVersion: q1113ContractConsumed.contractVersion,
        fields: q1113ContractConsumed.fields,
        evidence: q1113ContractConsumed.evidence,
      },
    });

    this.store.saveReport(report);
    return report;
  }

  private ensureRecord(
    state: OperationalState,
    config: QSeriesCompletionConfiguration,
    validationStatus: "passed" | "failed" = "passed",
    lastDecision: import("./types.js").FinalCompletionDecision | null = null,
    lastConfidenceScore: number | null = null,
  ) {
    const healthStatus =
      state === "failed" ? "failed" : state === "active" ? "healthy" : state === "blocked" ? "blocked" : "standby";
    this.engineRecord = {
      engineRecordId: `qscpt-engine-${QSCPT_METADATA_VERSION}`,
      timestamp: new Date().toISOString(),
      engineId: "PILLOW-QSCPT-001",
      engineVersion: "PILLOW-QSCPT-001",
      currentOperationalState: state,
      healthStatus,
      validationStatus: validationStatus === "failed" ? "failed" : validationStatus === "passed" ? "passed" : "pending",
      supportedCapabilities: [...QSCPT_CAPABILITIES],
      totalReports: this.store.reportCount(),
      lastReportId: this.store.getLatestReportId(),
      lastCompletionDecision: lastDecision ?? this.store.getLatestReport()?.finalCompletionDecision ?? null,
      lastConfidenceScore: lastConfidenceScore ?? this.store.getLatestReport()?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: QSCPT_METADATA_VERSION,
    };
  }
}
