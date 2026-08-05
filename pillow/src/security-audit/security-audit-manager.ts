import { collectSecurityComponentDiscovery, handleFor } from "./security-discovery.js";
import { assessComponent, classifyComponentDimensions, classifySecurityReadiness } from "./security-classifier.js";
import { verifyIntegrations as computeIntegrationVerification } from "./integration-verifier.js";
import {
  evaluateApiSecuritySummary,
  evaluateAuthenticationSummary,
  evaluateAuthorizationSummary,
  evaluateDataProtectionSummary,
  evaluateGovernanceSummary,
  evaluateOperationalSecuritySummary,
  evaluateRuntimeSecuritySummary,
  evaluateSecretManagementSummary,
  evaluateSecurityReadinessSummary,
} from "./security-evaluator.js";
import { evaluateSecurityReadinessGates } from "./security-gates.js";
import { SecartValidator, HealthMonitor, RecoveryManager } from "./audit-validator.js";
import { AuditStore, nextReportId } from "./audit-store.js";
import { buildCatalog, buildCriticalFindings, buildOutstandingRisks, buildReport } from "./report-builder.js";
import { IntegrationCoordinator, type SecurityAuditDependencies } from "./integrations.js";
import { appendSecartLog } from "./secart-logging.js";
import {
  INTEGRATION_TARGETS,
  SECART_CAPABILITIES,
  SECART_METADATA_VERSION,
  SECURITY_AUDIT_IDENTITY,
  SECURITY_COMPONENT_KEYS,
} from "./paths.js";
import type { SecurityAuditConfiguration } from "./configuration.js";
import type {
  ApiSecurityCheckRow,
  AuthenticationCheckRow,
  AuthorizationCheckRow,
  DataProtectionCheckRow,
  OperationalSecurityCheckRow,
  OperationalState,
  Q1106ConsumableContract,
  RuntimeSecurityCheckRow,
  SecartEngineRecord,
  SecartInput,
  SecretManagementCheckRow,
  SecurityAssessment,
  SecurityAuditReport,
} from "./types.js";

export class SecurityAuditManager {
  private repositoryRoot = "";
  private engineRecord: SecartEngineRecord | null = null;
  private readonly store = new AuditStore();
  private readonly validator = new SecartValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private seeded = false;

  setRepositoryRoot(root: string) {
    this.repositoryRoot = root;
  }

  bindIntegrations(deps: SecurityAuditDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: SecurityAuditConfiguration) {
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
      SECURITY_AUDIT_IDENTITY.workerId,
      this.store.listReports(),
      this.integrations.getHandshakes(),
    );
  }

  getAuditTrail(limit = 100) {
    return this.store.getAuditTrail(limit);
  }

  getIntegrations() {
    return this.integrations.getHandshakes();
  }

  connect(config: SecurityAuditConfiguration) {
    this.ensureSeeded(config);
    const handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.ensureRecord("connected", config);
    appendSecartLog({
      event: "connect",
      details: `Security Audit connected; integrations=${handshakes.length}`,
    });
    return handshakes;
  }

  /** Discovers every security component strictly from injected handles. Never invents components. */
  discoverSecurityComponents(_config: SecurityAuditConfiguration) {
    return collectSecurityComponentDiscovery(this.integrations.getDependencies());
  }

  /** Builds the deterministic per-component Security Assessment matrix from evidence only. */
  buildAssessments(config: SecurityAuditConfiguration): SecurityAssessment[] {
    const deps = this.integrations.getDependencies();
    return SECURITY_COMPONENT_KEYS.map((componentKey) => {
      const discovered = handleFor(componentKey, deps) != null;
      const componentName = componentKey;

      if (!discovered) {
        const statuses = {
          authenticationStatus: "Missing" as const,
          authorizationStatus: "Missing" as const,
          secretStatus: "Missing" as const,
          apiSecurityStatus: "Missing" as const,
          dataProtectionStatus: "Missing" as const,
          runtimeSecurityStatus: "Missing" as const,
          operationalSecurityStatus: "Missing" as const,
        };
        return assessComponent(
          componentKey,
          componentKey,
          statuses,
          "missing",
          `component:${componentKey}`,
          [`discovered=false — no ${componentKey} handle injected; none invented`],
        );
      }

      const dims = classifyComponentDimensions(componentKey, deps);
      const statuses = {
        authenticationStatus: dims.authenticationStatus,
        authorizationStatus: dims.authorizationStatus,
        secretStatus: dims.secretStatus,
        apiSecurityStatus: dims.apiSecurityStatus,
        dataProtectionStatus: dims.dataProtectionStatus,
        runtimeSecurityStatus: dims.runtimeSecurityStatus,
        operationalSecurityStatus: dims.operationalSecurityStatus,
      };
      const readinessClassification = classifySecurityReadiness(statuses);
      return assessComponent(
        componentKey,
        componentKey,
        statuses,
        readinessClassification,
        `component:${componentKey}`,
        [`discovered=true`, ...dims.evidence].map((e) => `${componentName}: ${e}`),
      );
    });
  }

  verifyAuthentication(config: SecurityAuditConfiguration): AuthenticationCheckRow[] {
    return this.buildAssessments(config).map((row) => ({
      componentId: row.componentId,
      componentName: row.componentId,
      authenticationStatus: row.authenticationStatus,
      evidence: row.supportingEvidence,
    }));
  }

  verifyAuthorization(config: SecurityAuditConfiguration): AuthorizationCheckRow[] {
    return this.buildAssessments(config).map((row) => ({
      componentId: row.componentId,
      componentName: row.componentId,
      authorizationStatus: row.authorizationStatus,
      evidence: row.supportingEvidence,
    }));
  }

  /** RBAC-specific narrow check — authorization-worker and authority-matrix only. */
  verifyRolePermissionEnforcement(config: SecurityAuditConfiguration): AuthorizationCheckRow[] {
    return this.buildAssessments(config)
      .filter((row) => row.componentId === "authorization-worker" || row.componentId === "authority-matrix")
      .map((row) => ({
        componentId: row.componentId,
        componentName: row.componentId,
        authorizationStatus: row.authorizationStatus,
        evidence: row.supportingEvidence,
      }));
  }

  /** Never exposes secrets: structural presence/masking evidence only. */
  verifySecretManagement(config: SecurityAuditConfiguration): SecretManagementCheckRow[] {
    return this.buildAssessments(config).map((row) => ({
      componentId: row.componentId,
      componentName: row.componentId,
      secretStatus: row.secretStatus,
      evidence: row.supportingEvidence,
    }));
  }

  verifyApiSecurity(config: SecurityAuditConfiguration): ApiSecurityCheckRow[] {
    return this.buildAssessments(config).map((row) => ({
      componentId: row.componentId,
      componentName: row.componentId,
      apiSecurityStatus: row.apiSecurityStatus,
      evidence: row.supportingEvidence,
    }));
  }

  verifyDataProtection(config: SecurityAuditConfiguration): DataProtectionCheckRow[] {
    return this.buildAssessments(config).map((row) => ({
      componentId: row.componentId,
      componentName: row.componentId,
      dataProtectionStatus: row.dataProtectionStatus,
      evidence: row.supportingEvidence,
    }));
  }

  verifyRuntimeSecurity(config: SecurityAuditConfiguration): RuntimeSecurityCheckRow[] {
    return this.buildAssessments(config).map((row) => ({
      componentId: row.componentId,
      componentName: row.componentId,
      runtimeSecurityStatus: row.runtimeSecurityStatus,
      evidence: row.supportingEvidence,
    }));
  }

  verifyOperationalSecurity(config: SecurityAuditConfiguration): OperationalSecurityCheckRow[] {
    return this.buildAssessments(config).map((row) => ({
      componentId: row.componentId,
      componentName: row.componentId,
      operationalSecurityStatus: row.operationalSecurityStatus,
      evidence: row.supportingEvidence,
    }));
  }

  verifyIntegrations() {
    return computeIntegrationVerification(this.integrations.getDependencies());
  }

  produceSecurityReadinessFindings(input: SecartInput, config: SecurityAuditConfiguration) {
    const matrix = this.buildAssessments(config);
    const securityReadinessSummary = evaluateSecurityReadinessSummary(matrix);
    const governanceSummary = evaluateGovernanceSummary(this.repositoryRoot, config, this.integrations.getDependencies());
    const integrationVerification = this.verifyIntegrations();
    const q1105 = this.integrations.attemptQ1105ContractHandshake();

    const decision = evaluateSecurityReadinessGates({
      matrix,
      securityReadinessSummary,
      governanceSummary,
      integrationsAllBound: integrationVerification.allBound,
      q1105Consumed: q1105.consumed,
      q1105Attempted: q1105.attempted,
      input,
    });

    const outstandingRisks = buildOutstandingRisks(matrix, governanceSummary, integrationVerification, securityReadinessSummary);
    const criticalFindings = buildCriticalFindings(matrix);

    return {
      decision,
      assessments: matrix,
      criticalFindings,
      outstandingRisks,
      confidenceScore: securityReadinessSummary.overallReadinessScore,
    };
  }

  produceReport(input: SecartInput, config: SecurityAuditConfiguration): SecurityAuditReport {
    const started = Date.now();
    this.ensureSeeded(config);

    if (this.validator.hasBoundaryViolation(input)) {
      return this.rejectedReport(input, config, started);
    }

    const discovery = this.discoverSecurityComponents(config);
    const matrix = this.buildAssessments(config);
    const securityReadinessSummary = evaluateSecurityReadinessSummary(matrix);
    const governanceSummary = evaluateGovernanceSummary(this.repositoryRoot, config, this.integrations.getDependencies());
    const authenticationSummary = evaluateAuthenticationSummary(matrix);
    const authorizationSummary = evaluateAuthorizationSummary(matrix);
    const secretManagementSummary = evaluateSecretManagementSummary(matrix);
    const apiSecuritySummary = evaluateApiSecuritySummary(matrix);
    const dataProtectionSummary = evaluateDataProtectionSummary(matrix);
    const runtimeSecuritySummary = evaluateRuntimeSecuritySummary(matrix);
    const operationalSecuritySummary = evaluateOperationalSecuritySummary(matrix);
    const integrationVerification = this.verifyIntegrations();
    const q1105ContractConsumed = this.integrations.attemptQ1105ContractHandshake();

    const decision = evaluateSecurityReadinessGates({
      matrix,
      securityReadinessSummary,
      governanceSummary,
      integrationsAllBound: integrationVerification.allBound,
      q1105Consumed: q1105ContractConsumed.consumed,
      q1105Attempted: q1105ContractConsumed.attempted,
      input,
    });

    const outstandingRisks = buildOutstandingRisks(matrix, governanceSummary, integrationVerification, securityReadinessSummary);
    const criticalFindings = buildCriticalFindings(matrix);
    const validation = this.validator.validateInput({ ...input, validated: input.validated ?? true }, started);

    const report = buildReport({
      reportId: input.reportId,
      componentInventory: discovery.components,
      assessments: matrix,
      governanceSummary,
      authenticationSummary,
      authorizationSummary,
      secretManagementSummary,
      apiSecuritySummary,
      dataProtectionSummary,
      runtimeSecuritySummary,
      operationalSecuritySummary,
      integrationVerification,
      securityReadinessSummary,
      q1105ContractConsumed,
      decision,
      criticalFindings,
      outstandingRisks,
      validation,
      workerId: config.workerId,
      consumableByQ1106: true,
    });

    const saved = this.store.saveReport(report, "produce_report");
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", saved);
    appendSecartLog({
      event: "produce_report",
      details: `report=${saved.reportId} decision=${saved.decision} confidence=${saved.confidenceScore}`,
    });
    return saved;
  }

  submitReport(input: SecartInput, config: SecurityAuditConfiguration): SecurityAuditReport {
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.rejectedReport(input, config, Date.now());
    }
    let report =
      (input.reportId?.trim() ? this.store.getReport(input.reportId.trim()) : null) ?? this.store.getLatestReport();
    if (!report) {
      report = this.produceReport(input, config);
      if (report.validation.decision === "fail") return report;
    }
    const submission = this.integrations.submitReport(report);
    const updated: SecurityAuditReport = {
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

  validate(input: SecartInput, started = Date.now()) {
    return this.validator.validateInput(input, started);
  }

  diagnostics(config: SecurityAuditConfiguration) {
    this.ensureSeeded(config);
    return {
      missionId: "Q11-05" as const,
      workerId: config.workerId,
      enabled: config.enabled,
      reports: this.store.reportCount(),
      failureCount: this.recovery.failureCount(),
      locks: config,
    };
  }

  getSecurityMatrix() {
    return this.store.getLatestReport()?.assessments ?? [];
  }

  getQ1106ConsumableContract(): Q1106ConsumableContract {
    return {
      contractId: `q1106-contract-${SECART_METADATA_VERSION}`,
      contractVersion: SECART_METADATA_VERSION,
      producedBy: "security-audit",
      missionId: "Q11-05",
      consumerMissionId: "Q11-06",
      exposedFields: [
        "assessments",
        "securityReadinessSummary",
        "decision",
        "componentInventory",
        "criticalFindings",
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
        "Security Audit Q11-05 certified — stops at Q11-05, exposes Q1106ConsumableContract for Q11-06 (Performance Audit)",
        "This contract is structural-signal-only; Q11-05 never implements Q11-06 or any later mission itself",
      ],
      neverImplementQ1106OrLater: true,
      structuralSignalOnly: true,
    };
  }

  private rejectedReport(
    input: SecartInput,
    config: SecurityAuditConfiguration,
    started: number,
  ): SecurityAuditReport {
    const errors = this.validator.collectBoundaryErrors(input);
    const validation = this.validator.finalize("fail", errors, [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    appendSecartLog({ event: "boundary_reject", details: errors.join(";") });
    const now = new Date().toISOString();
    const emptyDimensionSummary = (dimension: "authentication" | "authorization" | "secretManagement" | "apiSecurity" | "dataProtection" | "runtimeSecurity" | "operationalSecurity") => ({
      dimension,
      passedCount: 0,
      partialCount: 0,
      failedCount: 0,
      missingCount: 0,
      totalComponents: 0,
      evidence: [] as string[],
    });
    return buildReport({
      reportId: `secart-rejected-${nextReportId()}`,
      componentInventory: [],
      assessments: [],
      governanceSummary: {
        compliant: false,
        grandKingApprovalRequired: true,
        securityAuditRequired: true,
        selfDocPresent: false,
        selfDocPath: "",
        boundaryLocksHonoured: false,
        requiredComponentsBoundCount: 0,
        totalRequiredComponents: 0,
        evidence: [],
      },
      authenticationSummary: emptyDimensionSummary("authentication"),
      authorizationSummary: emptyDimensionSummary("authorization"),
      secretManagementSummary: emptyDimensionSummary("secretManagement"),
      apiSecuritySummary: emptyDimensionSummary("apiSecurity"),
      dataProtectionSummary: emptyDimensionSummary("dataProtection"),
      runtimeSecuritySummary: emptyDimensionSummary("runtimeSecurity"),
      operationalSecuritySummary: emptyDimensionSummary("operationalSecurity"),
      integrationVerification: { verifiedAt: now, rows: [], totalTargets: 0, boundCount: 0, allBound: false, evidence: [] },
      securityReadinessSummary: {
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
      q1105ContractConsumed: {
        attempted: false,
        consumed: false,
        contractVersion: null,
        fields: [],
        evidence: "Rejected before handshake",
      },
      decision: "escalate",
      criticalFindings: [],
      outstandingRisks: errors,
      validation,
      workerId: config.workerId,
      consumableByQ1106: false,
    });
  }

  private ensureRecord(
    state: OperationalState,
    config: SecurityAuditConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "pending",
    latestReport: SecurityAuditReport | null = null,
  ) {
    const health = this.healthMonitor.status(
      validationStatus === "failed" ? "fail" : validationStatus === "partial" ? "partial" : "pass",
      config.enabled,
    );
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `secart-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: "security-audit",
      engineVersion: "PILLOW-SECART-001",
      currentOperationalState: state,
      healthStatus: health,
      validationStatus,
      supportedCapabilities: [...SECART_CAPABILITIES],
      totalReports: this.store.reportCount(),
      lastReportId: latestReport?.reportId ?? this.store.getLatestReportId(),
      lastDecision: latestReport?.decision ?? null,
      lastConfidenceScore: latestReport?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: SECART_METADATA_VERSION,
    };
  }
}
