import { evaluateAcceptanceGates } from "./acceptance-gates.js";
import { EaprtValidator, HealthMonitor, PackManager } from "./audit-validator.js";
import { AuditStore, nextReportId } from "./audit-store.js";
import type { ExecutiveAcceptancePackConfiguration } from "./configuration.js";
import {
  collectAuditReports,
  collectCertificationReports,
  collectProductionReadinessEvidence,
  evaluateGovernanceSummary,
} from "./evidence-collector.js";
import {
  IntegrationCoordinator,
  verifyIntegrations,
  type ExecutiveAcceptancePackDependencies,
} from "./integrations.js";
import { appendEaprtLog } from "./eaprt-logging.js";
import {
  buildRiskSummary,
  classifyProductionReadiness,
  computeConfidenceScore,
  generateDeploymentRecommendation,
  generateExecutiveSummary,
  generateOutstandingIssueSummary,
  produceExecutiveChecklist,
} from "./pack-evaluator.js";
import { buildCatalog, buildReport } from "./report-builder.js";
import {
  EAPRT_CAPABILITIES,
  EAPRT_METADATA_VERSION,
  EXECUTIVE_ACCEPTANCE_PACK_IDENTITY,
  EXECUTIVE_ACCEPTANCE_PACK_SYSTEM_PATH,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type {
  EaprtEngineRecord,
  EaprtInput,
  ExecutiveAcceptancePackReport,
  OperationalState,
  Q1110ConsumableContract,
} from "./types.js";

export class ExecutiveAcceptancePackManager {
  private repositoryRoot = "";
  private engineRecord: EaprtEngineRecord | null = null;
  private readonly store = new AuditStore();
  private readonly validator = new EaprtValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly packManager = new PackManager();
  private readonly integrations = new IntegrationCoordinator();
  private seeded = false;

  setRepositoryRoot(root: string) {
    this.repositoryRoot = root;
  }

  bindIntegrations(deps: ExecutiveAcceptancePackDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: ExecutiveAcceptancePackConfiguration) {
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
      EXECUTIVE_ACCEPTANCE_PACK_IDENTITY.workerId,
      this.store.listReports(),
      this.integrations.getHandshakes(),
    );
  }

  getAuditTrail(limit = 100) {
    return this.store.getAuditTrail(limit);
  }

  getPackHistory(limit = 100) {
    return this.store.getPackHistory(limit);
  }

  getIntegrations() {
    return this.integrations.getHandshakes();
  }

  connect(config: ExecutiveAcceptancePackConfiguration) {
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.ensureRecord("connected", config);
    appendEaprtLog({
      event: "connect",
      details: `Executive Acceptance Pack connected; integrations=${handshakes.length}`,
    });
    return handshakes;
  }

  collectCertificationReports(_config: ExecutiveAcceptancePackConfiguration) {
    return collectCertificationReports(this.integrations.getDependencies());
  }

  collectAuditReports(_config: ExecutiveAcceptancePackConfiguration) {
    return collectAuditReports(this.integrations.getDependencies());
  }

  collectProductionReadinessEvidence(_config: ExecutiveAcceptancePackConfiguration) {
    return collectProductionReadinessEvidence(this.integrations.getDependencies());
  }

  generateExecutiveSummary(
    certificationSummary: ReturnType<typeof collectCertificationReports>,
    auditSummary: ReturnType<typeof collectAuditReports>,
    productionReadinessSummary: ReturnType<typeof collectProductionReadinessEvidence>,
    decision: string,
    q1109ContractConsumed: ReturnType<IntegrationCoordinator["attemptQ1109ContractHandshake"]>,
  ) {
    return generateExecutiveSummary({
      certificationSummary,
      auditSummary,
      productionReadinessSummary,
      decision,
      q1109ContractConsumed,
    });
  }

  generateOutstandingIssueSummary(
    certificationSummary: ReturnType<typeof collectCertificationReports>,
    auditSummary: ReturnType<typeof collectAuditReports>,
    productionReadinessSummary: ReturnType<typeof collectProductionReadinessEvidence>,
    q1109ContractConsumed: ReturnType<IntegrationCoordinator["attemptQ1109ContractHandshake"]>,
  ) {
    return generateOutstandingIssueSummary({
      certificationSummary,
      auditSummary,
      productionReadinessSummary,
      q1109ContractConsumed,
    });
  }

  generateDeploymentRecommendation(decision: string, outstandingIssues: string[]) {
    return generateDeploymentRecommendation({ decision, outstandingIssues });
  }

  classifyProductionReadiness(
    certificationSummary: ReturnType<typeof collectCertificationReports>,
    auditSummary: ReturnType<typeof collectAuditReports>,
    productionReadinessSummary: ReturnType<typeof collectProductionReadinessEvidence>,
    q1109ContractConsumed: ReturnType<IntegrationCoordinator["attemptQ1109ContractHandshake"]>,
  ) {
    return classifyProductionReadiness({
      certificationSummary,
      auditSummary,
      productionReadinessSummary,
      q1109ContractConsumed,
    });
  }

  produceExecutiveChecklist(
    certificationSummary: ReturnType<typeof collectCertificationReports>,
    auditSummary: ReturnType<typeof collectAuditReports>,
    productionReadinessSummary: ReturnType<typeof collectProductionReadinessEvidence>,
    q1109ContractConsumed: ReturnType<IntegrationCoordinator["attemptQ1109ContractHandshake"]>,
  ) {
    return produceExecutiveChecklist({
      certificationSummary,
      auditSummary,
      productionReadinessSummary,
      q1109ContractConsumed,
    });
  }

  verifyIntegrations() {
    return verifyIntegrations(this.integrations.getDependencies());
  }

  attemptQ1109ContractHandshake() {
    return this.integrations.attemptQ1109ContractHandshake();
  }

  assemblePack(input: EaprtInput, config: ExecutiveAcceptancePackConfiguration) {
    return this.produceReport(input, config);
  }

  async produceReport(
    input: EaprtInput,
    config: ExecutiveAcceptancePackConfiguration,
  ): Promise<ExecutiveAcceptancePackReport> {
    this.ensureSeeded(config);
    const started = Date.now();
    if (this.validator.hasBoundaryViolation(input)) {
      return this.rejectedReport(input, config, started);
    }

    const certificationSummary = this.collectCertificationReports(config);
    const auditSummary = this.collectAuditReports(config);
    const productionReadinessSummary = this.collectProductionReadinessEvidence(config);
    const integrationVerification = this.verifyIntegrations();
    const q1109ContractConsumed = this.integrations.attemptQ1109ContractHandshake();
    const governanceSummary = evaluateGovernanceSummary(
      this.repositoryRoot,
      EXECUTIVE_ACCEPTANCE_PACK_SYSTEM_PATH,
    );

    const decision = evaluateAcceptanceGates({
      certificationSummary,
      auditSummary,
      productionReadinessSummary,
      q1109ContractConsumed,
      integrationsAllBound: integrationVerification.allBound,
      governanceCompliant: governanceSummary.compliant,
      input,
    });

    const outstandingIssues = this.generateOutstandingIssueSummary(
      certificationSummary,
      auditSummary,
      productionReadinessSummary,
      q1109ContractConsumed,
    );
    const readinessClassification = this.classifyProductionReadiness(
      certificationSummary,
      auditSummary,
      productionReadinessSummary,
      q1109ContractConsumed,
    );
    const executiveChecklist = this.produceExecutiveChecklist(
      certificationSummary,
      auditSummary,
      productionReadinessSummary,
      q1109ContractConsumed,
    );
    const deploymentRecommendation = this.generateDeploymentRecommendation(decision, outstandingIssues);
    const riskSummary = buildRiskSummary(outstandingIssues);
    const confidenceScore = computeConfidenceScore({
      certificationSummary,
      auditSummary,
      productionReadinessSummary,
      q1109ContractConsumed,
    });
    const executiveSummary = this.generateExecutiveSummary(
      certificationSummary,
      auditSummary,
      productionReadinessSummary,
      decision,
      q1109ContractConsumed,
    );
    const validation = this.validator.validateInput({ ...input, validated: input.validated ?? true }, started);

    const report = buildReport({
      reportId: input.reportId,
      repositoryVersion: EAPRT_METADATA_VERSION,
      executiveSummary,
      certificationSummary,
      auditSummary,
      productionReadinessSummary,
      riskSummary,
      outstandingIssues,
      deploymentRecommendation,
      executiveChecklist,
      integrationVerification,
      governanceSummary,
      q1109ContractConsumed,
      decision,
      confidenceScore,
      validation,
      workerId: config.workerId,
      consumableByQ1110: decision !== "escalate" && validation.decision !== "fail",
      readinessClassification,
    });

    const saved = this.store.saveReport(report, "produce_report");
    if (validation.decision === "fail") this.packManager.recordFailure();
    else this.packManager.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", saved);
    appendEaprtLog({
      event: "produce_report",
      details: `report=${saved.reportId} decision=${saved.decision} confidence=${saved.confidenceScore}`,
    });
    return saved;
  }

  async submitReport(
    input: EaprtInput,
    config: ExecutiveAcceptancePackConfiguration,
  ): Promise<ExecutiveAcceptancePackReport> {
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.rejectedReport(input, config, Date.now());
    }
    let report =
      (input.reportId?.trim() ? this.store.getReport(input.reportId.trim()) : null) ??
      this.store.getLatestReport();
    if (!report) {
      report = await this.produceReport(input, config);
      if (report.validation.decision === "fail") return report;
    }
    const submission = this.integrations.submitReport(report);
    const updated: ExecutiveAcceptancePackReport = {
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

  validate(input: EaprtInput, started = Date.now()) {
    return this.validator.validateInput(input, started);
  }

  diagnostics(config: ExecutiveAcceptancePackConfiguration) {
    this.ensureSeeded(config);
    return {
      missionId: "Q11-09" as const,
      workerId: config.workerId,
      enabled: config.enabled,
      reports: this.store.reportCount(),
      failureCount: this.packManager.failureCount(),
      locks: config,
    };
  }

  getQ1110ConsumableContract(): Q1110ConsumableContract {
    return {
      contractId: `q1110-contract-${EAPRT_METADATA_VERSION}`,
      contractVersion: EAPRT_METADATA_VERSION,
      producedBy: "executive-acceptance-pack",
      missionId: "Q11-09",
      consumerMissionId: "Q11-10",
      exposedFields: [
        "acceptancePack",
        "executiveSummary",
        "certificationSummary",
        "auditSummary",
        "productionReadinessSummary",
        "riskSummary",
        "outstandingIssues",
        "deploymentRecommendation",
        "executiveChecklist",
        "decision",
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
        "Executive Acceptance Pack Q11-09 certified — stops at Q11-09, exposes Q1110ConsumableContract for Q11-10 (Grand King Acceptance Gate)",
        "This contract is structural-signal-only; Q11-09 never implements Q11-10 or any later mission itself",
        "Pack aggregates Q11 certification and audit evidence only — never approves production deployment",
      ],
      neverImplementQ1110OrLater: true,
      structuralSignalOnly: true,
    };
  }

  private async rejectedReport(
    input: EaprtInput,
    config: ExecutiveAcceptancePackConfiguration,
    started: number,
  ): Promise<ExecutiveAcceptancePackReport> {
    const errors = this.validator.collectBoundaryErrors(input);
    const validation = this.validator.finalize("fail", errors, [], started);
    this.packManager.recordFailure();
    this.ensureRecord("failed", config, "failed");
    appendEaprtLog({ event: "boundary_reject", details: errors.join(";") });
    const now = new Date().toISOString();
    const emptyCert = {
      computedAt: now,
      totalSources: 0,
      boundCount: 0,
      certifiedCount: 0,
      partiallyCertifiedCount: 0,
      failedCount: 0,
      missingCount: 0,
      blockedCount: 0,
      deferredCount: 0,
      reports: [],
      evidence: [] as string[],
    };
    return buildReport({
      reportId: `eaprt-rejected-${nextReportId()}`,
      repositoryVersion: EAPRT_METADATA_VERSION,
      executiveSummary: "Rejected before evidence aggregation",
      certificationSummary: emptyCert,
      auditSummary: emptyCert,
      productionReadinessSummary: {
        computedAt: now,
        totalSources: 0,
        boundCount: 0,
        evidencePresentCount: 0,
        overallClassification: "missing",
        sources: [],
        evidence: [],
      },
      riskSummary: { computedAt: now, totalRisks: errors.length, criticalRisks: errors, moderateRisks: [], lowRisks: [], evidence: errors },
      outstandingIssues: errors,
      deploymentRecommendation: {
        computedAt: now,
        recommendation: "escalate",
        rationale: errors,
        grandKingDecisionRequired: true,
        evidence: errors,
      },
      executiveChecklist: [],
      integrationVerification: {
        verifiedAt: now,
        rows: [],
        totalTargets: 0,
        boundCount: 0,
        allBound: false,
        evidence: [],
      },
      governanceSummary: {
        compliant: false,
        grandKingApprovalRequired: true,
        executiveAcceptancePackRequired: true,
        selfDocPresent: false,
        selfDocPath: "",
        boundaryLocksHonoured: false,
        evidence: [],
      },
      q1109ContractConsumed: {
        attempted: false,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: "Rejected before handshake",
      },
      decision: "escalate",
      confidenceScore: 0,
      validation,
      workerId: config.workerId,
      consumableByQ1110: false,
      readinessClassification: "failed",
    });
  }

  private ensureRecord(
    state: OperationalState,
    config: ExecutiveAcceptancePackConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "pending",
    latestReport: ExecutiveAcceptancePackReport | null = null,
  ) {
    const health = this.healthMonitor.status(
      validationStatus === "failed" ? "fail" : validationStatus === "partial" ? "partial" : "pass",
      config.enabled,
    );
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `eaprt-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: "executive-acceptance-pack",
      engineVersion: "PILLOW-EAPRT-001",
      currentOperationalState: state,
      healthStatus: health,
      validationStatus,
      supportedCapabilities: [...EAPRT_CAPABILITIES],
      totalReports: this.store.reportCount(),
      lastReportId: latestReport?.reportId ?? this.store.getLatestReportId(),
      lastDecision: latestReport?.decision ?? null,
      lastConfidenceScore: latestReport?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: EAPRT_METADATA_VERSION,
    };
  }
}

export function resetExecutiveAcceptancePackManagerSequencesForTesting() {
  /* reserved for future sequence resets */
}
