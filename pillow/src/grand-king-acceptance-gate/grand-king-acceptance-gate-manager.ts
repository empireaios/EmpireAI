import {
  canAuthoriseDeployment,
  computeConfidenceScore,
  resolveDeploymentAuthorisationStatus,
  resolveGrandKingDecision,
  resolveReReviewStatus,
} from "./acceptance-gates.js";
import { GkagtValidator, GateManager, HealthMonitor } from "./audit-validator.js";
import { AuditStore, nextHistoryEntryId, nextReportId } from "./audit-store.js";
import type { GrandKingAcceptanceGateConfiguration } from "./configuration.js";
import {
  collectExecutiveAcceptancePack,
  evaluateGovernanceSummary,
} from "./evidence-collector.js";
import {
  IntegrationCoordinator,
  verifyIntegrations,
  type GrandKingAcceptanceGateDependencies,
} from "./integrations.js";
import { appendGkagtLog } from "./gkagt-logging.js";
import { verifyPrerequisiteCertifications } from "./prerequisite-verifier.js";
import {
  buildCatalog,
  buildDeploymentAuthorisation,
  buildReport,
  presentProductionReadiness,
} from "./report-builder.js";
import {
  GKAGT_CAPABILITIES,
  GKAGT_METADATA_VERSION,
  GRAND_KING_ACCEPTANCE_GATE_IDENTITY,
  GRAND_KING_ACCEPTANCE_GATE_SYSTEM_PATH,
  INTEGRATION_TARGETS,
} from "./paths.js";
import type {
  DeploymentAuthorisationStatus,
  GkagtEngineRecord,
  GkagtInput,
  GrandKingAcceptanceReport,
  GrandKingDecision,
  OperationalState,
  ProductionReadinessPresentation,
  Q1111ConsumableContract,
  Q1201ConsumableContract,
  ReReviewStatus,
} from "./types.js";

export class GrandKingAcceptanceGateManager {
  private repositoryRoot = "";
  private engineRecord: GkagtEngineRecord | null = null;
  private readonly store = new AuditStore();
  private readonly validator = new GkagtValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly gateManager = new GateManager();
  private readonly integrations = new IntegrationCoordinator();
  private seeded = false;
  private currentGrandKingDecision: GrandKingDecision = "pending";
  private currentDeploymentAuthorisationStatus: DeploymentAuthorisationStatus = "blocked";
  private currentReReviewStatus: ReReviewStatus = "not_required";

  setRepositoryRoot(root: string) {
    this.repositoryRoot = root;
  }

  bindIntegrations(deps: GrandKingAcceptanceGateDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: GrandKingAcceptanceGateConfiguration) {
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
      GRAND_KING_ACCEPTANCE_GATE_IDENTITY.workerId,
      this.store.listReports(),
      this.integrations.getHandshakes(),
    );
  }

  getApprovalHistory(limit = 100) {
    return this.store.getApprovalHistory(limit);
  }

  getAuditTrail(limit = 100) {
    return this.store.getAuditTrail(limit);
  }

  getIntegrations() {
    return this.integrations.getHandshakes();
  }

  getDeploymentAuthorisationStatus() {
    return this.currentDeploymentAuthorisationStatus;
  }

  getGrandKingDecision() {
    return this.currentGrandKingDecision;
  }

  getReReviewStatus() {
    return this.currentReReviewStatus;
  }

  connect(config: GrandKingAcceptanceGateConfiguration) {
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.ensureRecord("connected", config);
    appendGkagtLog({
      event: "connect",
      details: `Grand King Acceptance Gate connected; integrations=${handshakes.length}`,
    });
    return handshakes;
  }

  collectExecutiveAcceptancePack() {
    return collectExecutiveAcceptancePack(this.integrations.getDependencies());
  }

  verifyPrerequisiteCertifications() {
    const packCollection = this.collectExecutiveAcceptancePack();
    const q1110ContractConsumed = this.integrations.attemptQ1110ContractHandshake();
    return verifyPrerequisiteCertifications({
      packCollection,
      q1110ContractConsumed,
      deps: this.integrations.getDependencies(),
    });
  }

  presentProductionReadiness(): ProductionReadinessPresentation {
    const packCollection = this.collectExecutiveAcceptancePack();
    const pack = packCollection.packReport;
    const outstandingIssues = pack?.outstandingIssues ?? packCollection.evidence;

    return presentProductionReadiness({
      executiveAcceptanceSummary: pack?.executiveSummary ?? "Executive Acceptance Pack not available",
      certificationSummary: pack?.certificationSummary ?? null,
      productionReadinessSummary: pack?.productionReadinessSummary ?? null,
      deploymentRecommendation: pack?.deploymentRecommendation ?? null,
      riskSummary: pack?.riskSummary ?? null,
      outstandingIssues,
      presentationPayload: {
        packReportId: packCollection.packReportId,
        packDecision: packCollection.packDecision,
        grandKingDecisionRequired: true,
        deploymentAuthorisationStatus: this.currentDeploymentAuthorisationStatus,
        reReviewStatus: this.currentReReviewStatus,
      },
      evidence: packCollection.evidence,
    });
  }

  preventDeploymentWithoutApproval() {
    const status = this.currentDeploymentAuthorisationStatus;
    return {
      deploymentAuthorisationStatus: status,
      blocked: status !== "authorised",
      evidence:
        status === "authorised"
          ? "Deployment authorisation issued — Grand King approved and prerequisites satisfied"
          : "Deployment blocked — Grand King approval and prerequisite certifications required",
    };
  }

  recordGrandKingDecision(input: GkagtInput, config: GrandKingAcceptanceGateConfiguration) {
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.rejectedDecision(input, config);
    }

    const started = Date.now();
    const packCollection = this.collectExecutiveAcceptancePack();
    const q1110ContractConsumed = this.integrations.attemptQ1110ContractHandshake();
    const prerequisites = verifyPrerequisiteCertifications({
      packCollection,
      q1110ContractConsumed,
      deps: this.integrations.getDependencies(),
    });

    const explicitDecision = resolveGrandKingDecision(input);
    const authCheck = canAuthoriseDeployment({
      prerequisites,
      packCollection,
      input,
      explicitDecision,
    });

    const deploymentAuthorisationStatus = resolveDeploymentAuthorisationStatus(
      { prerequisites, packCollection, input, explicitDecision },
      authCheck,
    );

    this.currentGrandKingDecision = explicitDecision;
    this.currentDeploymentAuthorisationStatus = deploymentAuthorisationStatus;
    this.currentReReviewStatus = resolveReReviewStatus(
      explicitDecision,
      this.currentReReviewStatus,
      false,
    );

    const historyEntry = this.store.appendDecisionHistory({
      entryId: nextHistoryEntryId(),
      timestamp: new Date().toISOString(),
      grandKingDecision: explicitDecision,
      decisionComments: input.decisionComments ?? null,
      deploymentAuthorisationStatus,
      reReviewStatus: this.currentReReviewStatus,
      evidence: authCheck.reason,
    });

    appendGkagtLog({
      event: "record_decision",
      details: `decision=${explicitDecision} auth=${deploymentAuthorisationStatus}`,
    });

    return {
      grandKingDecision: explicitDecision,
      deploymentAuthorisationStatus,
      reReviewStatus: this.currentReReviewStatus,
      authorisationPermitted: authCheck.authorised,
      authorisationReasons: authCheck.reason,
      historyEntry,
      validation: this.validator.validateInput(input, started),
    };
  }

  generateDeploymentAuthorisation(input: GkagtInput, config: GrandKingAcceptanceGateConfiguration) {
    const decisionResult = this.recordGrandKingDecision(input, config);
    if (decisionResult.grandKingDecision !== "approve" || !decisionResult.authorisationPermitted) {
      return {
        issued: false,
        deploymentAuthorisation: null,
        deploymentAuthorisationStatus: decisionResult.deploymentAuthorisationStatus,
        reasons: decisionResult.authorisationReasons,
      };
    }

    const packCollection = this.collectExecutiveAcceptancePack();
    const authorisation = buildDeploymentAuthorisation(
      `pending-${Date.now()}`,
      packCollection.packReportId ?? "unknown",
      decisionResult.authorisationReasons,
    );

    this.currentDeploymentAuthorisationStatus = "authorised";
    appendGkagtLog({
      event: "generate_authorisation",
      details: `authorisationId=${authorisation.authorisationId}`,
    });

    return {
      issued: true,
      deploymentAuthorisation: authorisation,
      deploymentAuthorisationStatus: "authorised" as const,
      reasons: decisionResult.authorisationReasons,
    };
  }

  requestReReview(input: GkagtInput = {}) {
    this.currentReReviewStatus = "requested";
    appendGkagtLog({ event: "request_re_review", details: input.decisionComments ?? "re-review requested" });
    return {
      reReviewStatus: this.currentReReviewStatus,
      deploymentAuthorisationStatus: this.currentDeploymentAuthorisationStatus,
      evidence: "Re-review requested — deployment remains blocked until Grand King re-approves",
    };
  }

  async produceGrandKingAcceptanceReport(
    input: GkagtInput,
    config: GrandKingAcceptanceGateConfiguration,
  ): Promise<GrandKingAcceptanceReport> {
    this.ensureSeeded(config);
    const started = Date.now();
    if (this.validator.hasBoundaryViolation(input)) {
      return this.rejectedReport(input, config, started);
    }

    const packCollection = this.collectExecutiveAcceptancePack();
    const q1110ContractConsumed = this.integrations.attemptQ1110ContractHandshake();
    const prerequisites = verifyPrerequisiteCertifications({
      packCollection,
      q1110ContractConsumed,
      deps: this.integrations.getDependencies(),
    });
    evaluateGovernanceSummary(this.repositoryRoot, GRAND_KING_ACCEPTANCE_GATE_SYSTEM_PATH);

    const explicitDecision = input.grandKingDecision
      ? resolveGrandKingDecision(input)
      : this.currentGrandKingDecision;

    const authCheck = canAuthoriseDeployment({
      prerequisites,
      packCollection,
      input,
      explicitDecision,
    });

    const deploymentAuthorisationStatus = resolveDeploymentAuthorisationStatus(
      { prerequisites, packCollection, input, explicitDecision },
      authCheck,
    );

    let deploymentAuthorisation = null;
    if (deploymentAuthorisationStatus === "authorised" && explicitDecision === "approve") {
      deploymentAuthorisation = buildDeploymentAuthorisation(
        nextReportId(),
        packCollection.packReportId ?? "unknown",
        authCheck.reason,
      );
    }

    const pack = packCollection.packReport;
    const outstandingIssues = [
      ...prerequisites.outstandingIssues,
      ...(pack?.outstandingIssues ?? []),
    ];
    const uniqueIssues = [...new Set(outstandingIssues)];

    const validation = this.validator.validateInput({ ...input, validated: input.validated ?? true }, started);
    const confidenceScore = computeConfidenceScore(prerequisites, explicitDecision);
    const decisionHistoryRefs = this.store.getApprovalHistory().map((h) => h.entryId);

    const report = buildReport({
      reportId: input.reportId,
      repositoryVersion: GKAGT_METADATA_VERSION,
      executiveAcceptanceSummary: pack?.executiveSummary ?? "Executive Acceptance Pack not available",
      certificationSummary: pack?.certificationSummary ?? null,
      productionReadinessSummary: pack?.productionReadinessSummary ?? null,
      grandKingDecision: explicitDecision,
      deploymentAuthorisationStatus,
      outstandingIssues: uniqueIssues,
      supportingEvidence: [...packCollection.evidence, ...prerequisites.evidence],
      confidenceScore,
      validation,
      workerId: config.workerId,
      prerequisites,
      q1110ContractConsumed,
      consumableByQ1201: validation.decision !== "fail" && q1110ContractConsumed.consumed,
      reReviewStatus: this.currentReReviewStatus,
      decisionComments: input.decisionComments ?? null,
      decisionTimestamp: explicitDecision !== "pending" ? new Date().toISOString() : null,
      packReference: packCollection.packReportId,
      deploymentAuthorisation,
      decisionHistoryRefs,
    });

    this.currentGrandKingDecision = explicitDecision;
    this.currentDeploymentAuthorisationStatus = deploymentAuthorisationStatus;

    const saved = this.store.saveReport(report, "produce_report");
    if (validation.decision === "fail") this.gateManager.recordFailure();
    else this.gateManager.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", saved);
    appendGkagtLog({
      event: "produce_report",
      details: `report=${saved.reportId} decision=${saved.grandKingDecision} auth=${saved.deploymentAuthorisationStatus}`,
    });
    return saved;
  }

  async auditAcceptance(input: GkagtInput, config: GrandKingAcceptanceGateConfiguration) {
    return this.produceGrandKingAcceptanceReport(input, config);
  }

  async submitReport(
    input: GkagtInput,
    config: GrandKingAcceptanceGateConfiguration,
  ): Promise<GrandKingAcceptanceReport> {
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.rejectedReport(input, config, Date.now());
    }
    let report =
      (input.reportId?.trim() ? this.store.getReport(input.reportId.trim()) : null) ??
      this.store.getLatestReport();
    if (!report) {
      report = await this.produceGrandKingAcceptanceReport(input, config);
      if (report.validation.decision === "fail") return report;
    }
    const submission = this.integrations.submitReport(report);
    const updated: GrandKingAcceptanceReport = {
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

  validate(input: GkagtInput, started = Date.now()) {
    return this.validator.validateInput(input, started);
  }

  diagnostics(config: GrandKingAcceptanceGateConfiguration) {
    this.ensureSeeded(config);
    return {
      missionId: "Q11-10" as const,
      workerId: config.workerId,
      enabled: config.enabled,
      reports: this.store.reportCount(),
      failureCount: this.gateManager.failureCount(),
      deploymentAuthorisationStatus: this.currentDeploymentAuthorisationStatus,
      grandKingDecision: this.currentGrandKingDecision,
      reReviewStatus: this.currentReReviewStatus,
      locks: config,
    };
  }

  getQ1111ConsumableContract(): Q1111ConsumableContract {
    return {
      contractId: `q1111-contract-${GKAGT_METADATA_VERSION}`,
      contractVersion: GKAGT_METADATA_VERSION,
      producedBy: "grand-king-acceptance-gate",
      missionId: "Q11-10",
      consumerMissionId: "Q11-11",
      exposedFields: [
        "acceptance",
        "executiveAcceptanceSummary",
        "certificationSummary",
        "productionReadinessSummary",
        "grandKingDecision",
        "deploymentAuthorisationStatus",
        "deploymentAuthorisation",
        "outstandingIssues",
        "confidenceScore",
      ],
      grandKingDecisionCatalog: ["approve", "reject", "defer", "pending"],
      deploymentAuthorisationCatalog: ["authorised", "blocked", "revoked", "pending"],
      notes: [
        "Grand King Acceptance Gate Q11-10 exposes Q1111ConsumableContract for Q11-11 Post-Launch Monitoring",
        "Q11-10 never implements Q11-11 — contract exposure only",
        "Production-active monitoring downstream requires approve + authorised",
      ],
      neverImplementQ1111OrLater: true,
      structuralSignalOnly: true,
    };
  }

  getQ1201ConsumableContract(): Q1201ConsumableContract {
    return {
      contractId: `q1201-contract-${GKAGT_METADATA_VERSION}`,
      contractVersion: GKAGT_METADATA_VERSION,
      producedBy: "grand-king-acceptance-gate",
      missionId: "Q11-10",
      consumerMissionId: "Q12-01",
      exposedFields: [
        "acceptance",
        "executiveAcceptanceSummary",
        "certificationSummary",
        "productionReadinessSummary",
        "grandKingDecision",
        "deploymentAuthorisationStatus",
        "deploymentAuthorisation",
        "outstandingIssues",
        "confidenceScore",
      ],
      grandKingDecisionCatalog: ["approve", "reject", "defer", "pending"],
      deploymentAuthorisationCatalog: ["authorised", "blocked", "revoked", "pending"],
      notes: [
        "Grand King Acceptance Gate Q11-10 certified — stops at Q11-10, exposes Q1201ConsumableContract for Q12-01",
        "This contract is structural-signal-only; Q11-10 never implements Q12-01 or any later mission itself",
        "Constitutional approval evidence only — Grand King retains final deployment authority",
      ],
      neverImplementQ1201OrLater: true,
      structuralSignalOnly: true,
    };
  }

  private rejectedDecision(input: GkagtInput, config: GrandKingAcceptanceGateConfiguration) {
    const errors = this.validator.collectBoundaryErrors(input);
    this.gateManager.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return {
      grandKingDecision: "reject" as const,
      deploymentAuthorisationStatus: "blocked" as const,
      reReviewStatus: this.currentReReviewStatus,
      authorisationPermitted: false,
      authorisationReasons: errors,
      historyEntry: null,
      validation: this.validator.finalize("fail", errors, [], Date.now()),
    };
  }

  private async rejectedReport(
    input: GkagtInput,
    config: GrandKingAcceptanceGateConfiguration,
    started: number,
  ): Promise<GrandKingAcceptanceReport> {
    const errors = this.validator.collectBoundaryErrors(input);
    const validation = this.validator.finalize("fail", errors, [], started);
    this.gateManager.recordFailure();
    this.ensureRecord("failed", config, "failed");
    appendGkagtLog({ event: "boundary_reject", details: errors.join(";") });

    const packCollection = this.collectExecutiveAcceptancePack();
    const q1110ContractConsumed = this.integrations.attemptQ1110ContractHandshake();
    const prerequisites = verifyPrerequisiteCertifications({
      packCollection,
      q1110ContractConsumed,
      deps: this.integrations.getDependencies(),
    });

    return buildReport({
      reportId: `gkagt-rejected-${nextReportId()}`,
      repositoryVersion: GKAGT_METADATA_VERSION,
      executiveAcceptanceSummary: "Rejected before acceptance evaluation",
      certificationSummary: packCollection.packReport?.certificationSummary ?? null,
      productionReadinessSummary: packCollection.packReport?.productionReadinessSummary ?? null,
      grandKingDecision: "reject",
      deploymentAuthorisationStatus: "blocked",
      outstandingIssues: errors,
      supportingEvidence: errors,
      confidenceScore: 0,
      validation,
      workerId: config.workerId,
      prerequisites,
      q1110ContractConsumed,
      consumableByQ1201: false,
      reReviewStatus: this.currentReReviewStatus,
      decisionComments: input.decisionComments ?? null,
      decisionTimestamp: new Date().toISOString(),
      packReference: packCollection.packReportId,
      deploymentAuthorisation: null,
      decisionHistoryRefs: [],
    });
  }

  private ensureRecord(
    state: OperationalState,
    config: GrandKingAcceptanceGateConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "pending",
    latestReport: GrandKingAcceptanceReport | null = null,
  ) {
    const health = this.healthMonitor.status(
      validationStatus === "failed" ? "fail" : validationStatus === "partial" ? "partial" : "pass",
      config.enabled,
    );
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `gkagt-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: "grand-king-acceptance-gate",
      engineVersion: "PILLOW-GKAGT-001",
      currentOperationalState: state,
      healthStatus: health,
      validationStatus,
      supportedCapabilities: [...GKAGT_CAPABILITIES],
      totalReports: this.store.reportCount(),
      lastReportId: latestReport?.reportId ?? this.store.getLatestReportId(),
      lastGrandKingDecision: latestReport?.grandKingDecision ?? this.currentGrandKingDecision,
      lastDeploymentAuthorisationStatus:
        latestReport?.deploymentAuthorisationStatus ?? this.currentDeploymentAuthorisationStatus,
      lastConfidenceScore: latestReport?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: GKAGT_METADATA_VERSION,
    };
  }
}

export function resetGrandKingAcceptanceGateManagerSequencesForTesting() {
  /* reserved for future sequence resets */
}
