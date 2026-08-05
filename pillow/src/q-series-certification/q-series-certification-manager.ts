import { QscrtValidator, GateManager, HealthMonitor } from "./audit-validator.js";
import { AuditStore, nextHistoryEntryId, resetQSeriesCertificationManagerSequencesForTesting } from "./audit-store.js";
import type { QSeriesCertificationConfiguration } from "./configuration.js";
import {
  aggregateCertificationEvidence,
  buildCertificationRecords,
  buildOutstandingIssues,
  classifyQSeriesReadiness,
  discoverFactories,
  evaluateCertificationDecision,
  verifyCrossFactoryOrchestration,
  verifyGovernanceCompliance,
  verifyProductionReadiness,
  verifyRuntimes,
  verifyWorkers,
} from "./evidence-collector.js";
import {
  IntegrationCoordinator,
  verifyIntegrations,
  type QSeriesCertificationDependencies,
} from "./integrations.js";
import { appendQscrtLog } from "./qscrt-logging.js";
import { buildCatalog, buildReport } from "./report-builder.js";
import {
  INTEGRATION_TARGETS,
  QSCRT_CAPABILITIES,
  QSCRT_METADATA_VERSION,
  Q_SERIES_CERTIFICATION_IDENTITY,
} from "./paths.js";
import type {
  CertificationHistoryEntry,
  OperationalState,
  Q1113ConsumableContract,
  QscrtEngineRecord,
  QscrtInput,
  QSeriesCertificationReport,
} from "./types.js";

export { resetQSeriesCertificationManagerSequencesForTesting };

export class QSeriesCertificationManager {
  private repositoryRoot = "";
  private engineRecord: QscrtEngineRecord | null = null;
  private readonly store = new AuditStore();
  private readonly validator = new QscrtValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly gateManager = new GateManager();
  private readonly integrations = new IntegrationCoordinator();
  private seeded = false;

  setRepositoryRoot(root: string) {
    this.repositoryRoot = root;
  }

  bindIntegrations(deps: QSeriesCertificationDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: QSeriesCertificationConfiguration) {
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
      Q_SERIES_CERTIFICATION_IDENTITY.workerId,
      this.store.listReports(),
      this.integrations.getHandshakes(),
    );
  }

  getCertificationHistory(limit = 100) {
    return this.store.getCertificationHistory(limit);
  }

  getAuditTrail(limit = 100) {
    return this.store.getAuditTrail(limit);
  }

  getIntegrations() {
    return this.integrations.getHandshakes();
  }

  connect(config: QSeriesCertificationConfiguration) {
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.ensureRecord("connected", config);
    appendQscrtLog({ event: "connect", details: `Q Series Certification connected; integrations=${handshakes.length}` });
    return handshakes;
  }

  discoverFactories() {
    return discoverFactories(this.integrations.getDependencies());
  }

  verifyWorkers() {
    return verifyWorkers(this.integrations.getDependencies());
  }

  verifyRuntimes() {
    return verifyRuntimes(this.integrations.getDependencies());
  }

  verifyCrossFactoryOrchestration() {
    return verifyCrossFactoryOrchestration(this.integrations.getDependencies());
  }

  verifyGovernanceCompliance() {
    return verifyGovernanceCompliance(this.integrations.getDependencies());
  }

  verifyProductionReadiness() {
    return verifyProductionReadiness(this.integrations.getDependencies());
  }

  aggregateCertificationEvidence() {
    return aggregateCertificationEvidence(this.integrations.getDependencies());
  }

  classifyQSeriesReadiness(input: QscrtInput = {}) {
    const deps = this.integrations.getDependencies();
    const factorySummary = discoverFactories(deps);
    const workerSummary = verifyWorkers(deps);
    const runtimeSummary = verifyRuntimes(deps);
    const integrationSummary = verifyCrossFactoryOrchestration(deps);
    const governanceSummary = verifyGovernanceCompliance(deps);
    const productionSummary = verifyProductionReadiness(deps);
    const aggregated = aggregateCertificationEvidence(deps);
    return classifyQSeriesReadiness({
      factorySummary,
      workerSummary,
      runtimeSummary,
      integrationSummary,
      governanceSummary,
      productionSummary,
      aggregated,
      deferCertification: input.deferCertification,
    });
  }

  async produceQSeriesCertificationReport(
    input: QscrtInput,
    config: QSeriesCertificationConfiguration,
    started = Date.now(),
  ): Promise<QSeriesCertificationReport> {
    if (this.validator.hasBoundaryViolation(input)) {
      return this.rejectedReport(input, config, started);
    }

    const validation = this.validator.validateInput(input, started);
    const q1112ContractConsumed = this.integrations.attemptQ1112ContractHandshake();
    const deps = this.integrations.getDependencies();

    const factorySummary = discoverFactories(deps);
    const workerSummary = verifyWorkers(deps);
    const runtimeSummary = verifyRuntimes(deps);
    const integrationSummary = verifyCrossFactoryOrchestration(deps);
    const governanceSummary = verifyGovernanceCompliance(deps);
    const productionSummary = verifyProductionReadiness(deps);
    const aggregated = aggregateCertificationEvidence(deps);
    const readiness = classifyQSeriesReadiness({
      factorySummary,
      workerSummary,
      runtimeSummary,
      integrationSummary,
      governanceSummary,
      productionSummary,
      aggregated,
      deferCertification: input.deferCertification,
    });

    const certificationDecision = evaluateCertificationDecision(
      readiness,
      productionSummary,
      aggregated,
      workerSummary,
      runtimeSummary,
      input.deferCertification,
    );

    const supportingEvidence = [
      ...readiness.evidence,
      q1112ContractConsumed.evidence,
      `certificationDecision=${certificationDecision}`,
    ];
    const outstandingIssues = buildOutstandingIssues(productionSummary, governanceSummary, aggregated, readiness);
    const assessments = buildCertificationRecords(
      factorySummary,
      workerSummary,
      runtimeSummary,
      integrationSummary,
      governanceSummary,
      productionSummary,
      readiness,
    );

    const report = buildReport({
      reportId: input.reportId,
      workerId: config.workerId,
      factorySummary,
      workerSummary,
      runtimeSummary,
      integrationSummary,
      governanceSummary,
      productionReadinessSummary: productionSummary,
      aggregated,
      readiness,
      certificationDecision,
      assessments,
      supportingEvidence,
      outstandingIssues,
      confidenceScore: readiness.readinessScore,
      validation,
      q1112ContractConsumed: {
        attempted: q1112ContractConsumed.attempted,
        consumed: q1112ContractConsumed.consumed,
        contractVersion: q1112ContractConsumed.contractVersion,
        fields: q1112ContractConsumed.fields,
        evidence: q1112ContractConsumed.evidence,
      },
    });

    this.store.saveReport(report);
    this.store.saveHistory(this.buildHistoryEntry(report, readiness.overallClassification));
    this.ensureRecord(
      certificationDecision === "certify" ? "active" : "standby",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      certificationDecision,
      readiness.readinessScore,
    );
    appendQscrtLog({ event: "produce_report", details: report.reportId });
    return report;
  }

  async certifyQSeries(input: QscrtInput, config: QSeriesCertificationConfiguration) {
    return this.produceQSeriesCertificationReport(input, config);
  }

  async submitReport(input: QscrtInput, config: QSeriesCertificationConfiguration) {
    const report = await this.produceQSeriesCertificationReport(input, config);
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

  validate(input: QscrtInput, started = Date.now()) {
    return this.validator.validateInput(input, started);
  }

  diagnostics(config: QSeriesCertificationConfiguration) {
    this.ensureSeeded(config);
    const readiness = this.classifyQSeriesReadiness();
    return {
      missionId: "Q11-12" as const,
      workerId: config.workerId,
      enabled: config.enabled,
      reports: this.store.reportCount(),
      failureCount: this.gateManager.failureCount(),
      overallClassification: readiness.overallClassification,
      readinessScore: readiness.readinessScore,
      integrations: verifyIntegrations(this.integrations.getDependencies()),
      locks: config,
    };
  }

  getQ1113ConsumableContract(): Q1113ConsumableContract {
    return {
      contractId: `q1113-contract-${QSCRT_METADATA_VERSION}`,
      contractVersion: QSCRT_METADATA_VERSION,
      producedBy: "q-series-certification",
      missionId: "Q11-12",
      consumerMissionId: "Q11-13",
      exposedFields: [
        "factorySummary",
        "workerSummary",
        "runtimeSummary",
        "integrationSummary",
        "governanceSummary",
        "productionReadinessSummary",
        "certificationDecision",
        "assessments",
        "outstandingIssues",
        "confidenceScore",
      ],
      certificationClassificationCatalog: [
        "certified",
        "partially_certified",
        "failed",
        "missing",
        "blocked",
        "deferred",
      ],
      certificationDecisionCatalog: ["certify", "withhold", "escalate", "defer"],
      notes: [
        "Q Series Certification Q11-12 certified — stops at Q11-12, exposes Q1113ConsumableContract for Q11-13 Q Series Complete",
        "This contract is structural-signal-only; Q11-12 never implements Q11-13 or any later mission itself",
        "Honest certify rule: certify decision only when FINART consumable, EAPRT certify, GK approve+authorised, PLMRT productionActive",
      ],
      neverImplementQ1113OrLater: true,
      structuralSignalOnly: true,
    };
  }

  private buildHistoryEntry(
    report: QSeriesCertificationReport,
    overallClassification: import("./types.js").CertificationClassification,
  ): CertificationHistoryEntry {
    return {
      entryId: nextHistoryEntryId(),
      timestamp: report.timestamp,
      reportId: report.reportId,
      certificationDecision: report.certificationDecision,
      overallClassification,
      evidence: report.supportingEvidence.slice(0, 5),
    };
  }

  private async rejectedReport(
    input: QscrtInput,
    config: QSeriesCertificationConfiguration,
    started: number,
  ): Promise<QSeriesCertificationReport> {
    const errors = this.validator.collectBoundaryErrors(input);
    const validation = this.validator.finalize("fail", errors, [], started);
    this.gateManager.recordFailure();
    this.ensureRecord("failed", config, "failed");
    appendQscrtLog({ event: "boundary_reject", details: errors.join(";") });

    const q1112ContractConsumed = this.integrations.attemptQ1112ContractHandshake();
    const deps = this.integrations.getDependencies();
    const factorySummary = discoverFactories(deps);
    const workerSummary = verifyWorkers(deps);
    const runtimeSummary = verifyRuntimes(deps);
    const integrationSummary = verifyCrossFactoryOrchestration(deps);
    const governanceSummary = verifyGovernanceCompliance(deps);
    const productionSummary = verifyProductionReadiness(deps);
    const aggregated = aggregateCertificationEvidence(deps);
    const readiness = classifyQSeriesReadiness({
      factorySummary,
      workerSummary,
      runtimeSummary,
      integrationSummary,
      governanceSummary,
      productionSummary,
      aggregated,
    });

    const report = buildReport({
      reportId: input.reportId,
      workerId: config.workerId,
      factorySummary,
      workerSummary,
      runtimeSummary,
      integrationSummary,
      governanceSummary,
      productionReadinessSummary: productionSummary,
      aggregated,
      readiness: { ...readiness, overallClassification: "failed", readinessScore: 0 },
      certificationDecision: "withhold",
      assessments: [],
      supportingEvidence: [...errors, ...readiness.evidence],
      outstandingIssues: [...errors, "boundary violation — report rejected"],
      confidenceScore: 0,
      validation,
      q1112ContractConsumed: {
        attempted: q1112ContractConsumed.attempted,
        consumed: q1112ContractConsumed.consumed,
        contractVersion: q1112ContractConsumed.contractVersion,
        fields: q1112ContractConsumed.fields,
        evidence: q1112ContractConsumed.evidence,
      },
    });

    this.store.saveReport(report);
    return report;
  }

  private ensureRecord(
    state: OperationalState,
    config: QSeriesCertificationConfiguration,
    validationStatus: "passed" | "failed" = "passed",
    lastDecision: import("./types.js").CertificationDecision | null = null,
    lastConfidenceScore: number | null = null,
  ) {
    const healthStatus =
      state === "failed" ? "failed" : state === "active" ? "healthy" : state === "blocked" ? "blocked" : "standby";
    this.engineRecord = {
      engineRecordId: `qscrt-engine-${QSCRT_METADATA_VERSION}`,
      timestamp: new Date().toISOString(),
      engineId: "PILLOW-QSCRT-001",
      engineVersion: "PILLOW-QSCRT-001",
      currentOperationalState: state,
      healthStatus,
      validationStatus: validationStatus === "failed" ? "failed" : validationStatus === "passed" ? "passed" : "pending",
      supportedCapabilities: [...QSCRT_CAPABILITIES],
      totalReports: this.store.reportCount(),
      lastReportId: this.store.getLatestReportId(),
      lastCertificationDecision: lastDecision ?? this.store.getLatestReport()?.certificationDecision ?? null,
      lastConfidenceScore: lastConfidenceScore ?? this.store.getLatestReport()?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: QSCRT_METADATA_VERSION,
    };
  }
}
