import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { buildSecurityAuditConfiguration, type SecurityAuditConfiguration } from "./configuration.js";
import type { SecurityAuditDependencies } from "./integrations.js";
import { SecurityAuditManager } from "./security-audit-manager.js";
import { SecurityAuditController } from "./security-audit-controller.js";
import { resetSecartLogsForTesting } from "./secart-logging.js";
import { READINESS_CLASSIFICATIONS, SECURITY_AUDIT_SYSTEM_PATH } from "./paths.js";
import { resetSecartSequenceForTesting } from "./audit-store.js";
import type { SecartInput, SecurityAuditCockpitSnapshot, SecurityAuditState } from "./types.js";

export interface SecurityAuditOptions {
  configuration?: Partial<SecurityAuditConfiguration>;
  dependencies?: SecurityAuditDependencies;
}

/**
 * Authoritative Q11-05 Security Audit — the fifth Q11 acceptance gate. It
 * discovers every security component strictly from injected dependency
 * handles (authentication-worker, authorization-worker, authority-matrix,
 * api-runtime, audit-runtime, monitoring-runtime,
 * production-certification-core, executive-reporting-runtime, tool-runtime,
 * and the structural secret-management composite), never inventing
 * components. It verifies authentication, authorization,
 * RBAC/permission enforcement, secret management (presence/masking
 * evidence only — never secret values), API security, data protection,
 * runtime security, and operational security from observed structural
 * evidence only, and classifies each component's security readiness
 * deterministically.
 *
 * It NEVER fabricates security evidence, NEVER certifies insecure
 * implementations, NEVER exposes secrets during auditing, NEVER assumes
 * implementation, NEVER modifies security implementations, NEVER repairs
 * failed security components, and NEVER overrides governance, approved
 * architecture, Pillow, or Grand King. It NEVER implements Q11-06
 * (Performance Audit) or later — it only exposes a Q1106ConsumableContract
 * for Q11-06 to consume, and it consumes the Q1105ConsumableContract
 * exposed by Q11-04 (Business Factory Audit) when injected.
 */
export class SecurityAudit {
  private initializedAt: string | null = null;
  private readonly manager: SecurityAuditManager;
  private readonly controller: SecurityAuditController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: SecurityAuditOptions = {},
  ) {
    this.manager = new SecurityAuditManager();
    this.manager.setRepositoryRoot(bootstrap.repositoryRoot);
    if (options.dependencies) this.manager.bindIntegrations(options.dependencies);
    this.controller = new SecurityAuditController(
      this.manager,
      buildSecurityAuditConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(SECURITY_AUDIT_SYSTEM_PATH);
    if (!doc?.includes("Security Audit")) {
      throw new Error(`${SECURITY_AUDIT_SYSTEM_PATH} missing — Q11-05 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: SecurityAuditDependencies = {}) {
    this.controller.bindIntegrations(deps);
    return this;
  }

  getState(): SecurityAuditState {
    if (!this.initializedAt) {
      throw new Error("Security Audit not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.manager.getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-SECART-001",
      missionId: "Q11-05",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore: engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalReports: engineRecord?.totalReports ?? 0,
        lastReportId: engineRecord?.lastReportId ?? null,
        lastDecision: engineRecord?.lastDecision ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Security Audit is the fifth Q11 acceptance gate: it discovers every security component strictly from injected dependency handles, verifies authentication/authorization/RBAC/secret-management/API security/data protection/runtime security/operational security from observed structural evidence only, and classifies security readiness deterministically. It never fabricates evidence, never certifies insecure implementations, never exposes secrets during auditing, and never overrides Pillow, Grand King, or approved architecture. It never implements Q11-06 (Performance Audit) or later.",
        ],
      },
    };
  }

  connect(_input: Record<string, unknown> = {}) {
    return this.controller.connect();
  }

  discoverSecurityComponents() {
    return this.controller.discoverSecurityComponents();
  }

  verifyAuthentication() {
    return this.controller.verifyAuthentication();
  }

  verifyAuthorization() {
    return this.controller.verifyAuthorization();
  }

  verifyRolePermissionEnforcement() {
    return this.controller.verifyRolePermissionEnforcement();
  }

  verifySecretManagement() {
    return this.controller.verifySecretManagement();
  }

  verifyApiSecurity() {
    return this.controller.verifyApiSecurity();
  }

  verifyDataProtection() {
    return this.controller.verifyDataProtection();
  }

  verifyRuntimeSecurity() {
    return this.controller.verifyRuntimeSecurity();
  }

  verifyOperationalSecurity() {
    return this.controller.verifyOperationalSecurity();
  }

  verifyIntegrations() {
    return this.controller.verifyIntegrations();
  }

  classifySecurityReadiness() {
    return this.controller.classifySecurityReadiness();
  }

  produceSecurityReadinessFindings(input: SecartInput = {}) {
    return this.controller.produceSecurityReadinessFindings(input);
  }

  produceSecurityAuditReport(input: SecartInput = {}) {
    return this.controller.produceReport(input);
  }

  produceReport(input: SecartInput = {}) {
    return this.controller.produceReport(input);
  }

  auditSecurity(input: SecartInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: SecartInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  getReports() {
    return this.manager.getReports();
  }

  getCatalog() {
    return this.manager.getCatalog();
  }

  getAuditTrail(limit = 100) {
    return this.manager.getAuditTrail(limit);
  }

  getSecurityMatrix() {
    return this.controller.getSecurityMatrix();
  }

  getQ1106ConsumableContract() {
    return this.controller.getQ1106ConsumableContract();
  }

  validate(input: SecartInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  runDiagnostics() {
    return this.diagnostics();
  }

  getIntegrations() {
    return this.manager.getIntegrations();
  }

  validateForSupervisorSync() {
    const state = this.getState();
    const score =
      state.latestReport?.validation.decision === "fail"
        ? 40
        : state.latestReport?.validation.decision === "partial"
          ? 70
          : Math.round((state.health.lastConfidenceScore ?? 0) * 100) || 100;
    return {
      valid: state.health.status !== "failed",
      health:
        score >= 75 ? ("healthy" as const) : score >= 50 ? ("degraded" as const) : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Audit reports: ${state.health.totalReports}`,
        `Last decision: ${state.health.lastDecision ?? "none"}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): SecurityAuditCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q11-05",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      latestReportId: state.health.lastReportId,
      lastDecision: state.health.lastDecision,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      readinessClassificationOptions: [...READINESS_CLASSIFICATIONS],
      neverFabricateSecurityEvidence: true,
      neverCertifyInsecureImplementations: true,
      neverExposeSecretsDuringAuditing: true,
      neverAssumeImplementation: true,
      neverModifySecurityImplementations: true,
      neverRepairFailedSecurityComponents: true,
      neverBypassPillowGovernance: true,
      neverBypassGrandKingApproval: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ1106OrLater: true,
      fifthQ11Gate: true,
    };
  }
}

export function createSecurityAudit(bootstrap: EmpireBootstrapContext, options?: SecurityAuditOptions) {
  return new SecurityAudit(bootstrap, options);
}

export function resetSecurityAuditForTesting() {
  resetSecartLogsForTesting();
  resetSecartSequenceForTesting();
}
