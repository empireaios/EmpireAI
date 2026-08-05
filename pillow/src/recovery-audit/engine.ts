import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { buildRecoveryAuditConfiguration, type RecoveryAuditConfiguration } from "./configuration.js";
import type { RecoveryAuditDependencies } from "./integrations.js";
import { RecoveryAuditManager, resetRecoveryAuditManagerSequencesForTesting } from "./recovery-audit-manager.js";
import { RecoveryAuditController } from "./recovery-audit-controller.js";
import { resetRecartLogsForTesting } from "./recart-logging.js";
import { READINESS_CLASSIFICATIONS, RECOVERY_AUDIT_SYSTEM_PATH } from "./paths.js";
import { resetRecartSequenceForTesting } from "./audit-store.js";
import type { RecartInput, RecoveryAuditCockpitSnapshot, RecoveryAuditState } from "./types.js";

export interface RecoveryAuditOptions {
  configuration?: Partial<RecoveryAuditConfiguration>;
  dependencies?: RecoveryAuditDependencies;
}

/**
 * Authoritative Q11-07 Recovery Audit — the seventh Q11 acceptance gate.
 * It discovers every recovery component strictly from injected dependency
 * handles, verifies recovery CAPABILITY presence via typeof === "function"
 * evidence only — NEVER invoking detectFailure/rollback/restartJob/
 * resumeWorkflow/restoreState or other mutating recovery side-effects
 * during audit. It classifies each component's recovery readiness
 * deterministically from this structural evidence.
 *
 * It NEVER fabricates recovery evidence, NEVER certifies untested recovery,
 * NEVER mutates production via recovery calls, NEVER assumes
 * implementation, NEVER repairs failed recovery components, and NEVER
 * overrides governance, approved architecture, Pillow, or Grand King. It
 * NEVER implements Q11-08 (Financial Readiness Audit) or later — it only
 * exposes a Q1108ConsumableContract for Q11-08 to consume, and it consumes
 * the Q1107ConsumableContract exposed by Q11-06 (Performance Audit) when
 * injected.
 */
export class RecoveryAudit {
  private initializedAt: string | null = null;
  private readonly manager: RecoveryAuditManager;
  private readonly controller: RecoveryAuditController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: RecoveryAuditOptions = {},
  ) {
    this.manager = new RecoveryAuditManager();
    this.manager.setRepositoryRoot(bootstrap.repositoryRoot);
    if (options.dependencies) this.manager.bindIntegrations(options.dependencies);
    this.controller = new RecoveryAuditController(
      this.manager,
      buildRecoveryAuditConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(RECOVERY_AUDIT_SYSTEM_PATH);
    if (!doc?.includes("Recovery Audit")) {
      throw new Error(`${RECOVERY_AUDIT_SYSTEM_PATH} missing — Q11-07 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: RecoveryAuditDependencies = {}) {
    this.controller.bindIntegrations(deps);
    return this;
  }

  getState(): RecoveryAuditState {
    if (!this.initializedAt) {
      throw new Error("Recovery Audit not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.manager.getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-RECART-001",
      missionId: "Q11-07",
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
          "Recovery Audit is the seventh Q11 acceptance gate: it discovers every recovery component strictly from injected dependency handles, verifies recovery CAPABILITY presence via typeof evidence only (never invokes destructive recovery side-effects), and classifies recovery readiness deterministically. It never fabricates evidence, never certifies untested recovery, never mutates production via recovery calls, and never overrides Pillow, Grand King, or approved architecture. It never implements Q11-08 (Financial Readiness Audit) or later.",
        ],
      },
    };
  }

  connect(_input: Record<string, unknown> = {}) {
    return this.controller.connect();
  }

  discoverRecoveryComponents() {
    return this.controller.discoverRecoveryComponents();
  }

  verifyFailureDetection() {
    return this.controller.verifyFailureDetection();
  }

  verifyAutomaticRecovery() {
    return this.controller.verifyAutomaticRecovery();
  }

  verifyManualRecovery() {
    return this.controller.verifyManualRecovery();
  }

  verifyRollbackCapability() {
    return this.controller.verifyRollbackCapability();
  }

  verifyWorkflowRestart() {
    return this.controller.verifyWorkflowRestart();
  }

  verifyCheckpointRestoration() {
    return this.controller.verifyCheckpointRestoration();
  }

  verifyRecoveryEscalation() {
    return this.controller.verifyRecoveryEscalation();
  }

  verifyEnterpriseResilience() {
    return this.controller.verifyEnterpriseResilience();
  }

  verifyIntegrations() {
    return this.controller.verifyIntegrations();
  }

  classifyRecoveryReadiness() {
    return this.controller.classifyRecoveryReadiness();
  }

  produceRecoveryReadinessFindings(input: RecartInput = {}) {
    return this.controller.produceRecoveryReadinessFindings(input);
  }

  produceRecoveryAuditReport(input: RecartInput = {}) {
    return this.controller.produceReport(input);
  }

  produceReport(input: RecartInput = {}) {
    return this.controller.produceReport(input);
  }

  auditRecovery(input: RecartInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: RecartInput = {}) {
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

  getRecoveryHistory(limit = 100) {
    return this.manager.getRecoveryHistory(limit);
  }

  getRecoveryMatrix() {
    return this.controller.getRecoveryMatrix();
  }

  getQ1108ConsumableContract() {
    return this.controller.getQ1108ConsumableContract();
  }

  validate(input: RecartInput = {}) {
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

  getCockpitSnapshot(): RecoveryAuditCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q11-07",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      latestReportId: state.health.lastReportId,
      lastDecision: state.health.lastDecision,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      readinessClassificationOptions: [...READINESS_CLASSIFICATIONS],
      neverFabricateRecoveryEvidence: true,
      neverCertifyUntestedRecovery: true,
      neverMutateProductionViaRecoveryCalls: true,
      neverAssumeImplementation: true,
      neverModifyRecoveryImplementations: true,
      neverRepairFailedRecoveryComponents: true,
      neverBypassPillowGovernance: true,
      neverBypassGrandKingApproval: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ1108OrLater: true,
      seventhQ11Gate: true,
    };
  }
}

export function createRecoveryAudit(bootstrap: EmpireBootstrapContext, options?: RecoveryAuditOptions) {
  return new RecoveryAudit(bootstrap, options);
}

export function resetRecoveryAuditForTesting() {
  resetRecartLogsForTesting();
  resetRecartSequenceForTesting();
  resetRecoveryAuditManagerSequencesForTesting();
}
