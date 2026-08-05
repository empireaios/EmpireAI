import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { buildFinancialReadinessAuditConfiguration, type FinancialReadinessAuditConfiguration } from "./configuration.js";
import type { FinancialReadinessAuditDependencies } from "./integrations.js";
import {
  FinancialReadinessAuditManager,
  resetFinancialReadinessAuditManagerSequencesForTesting,
} from "./financial-readiness-audit-manager.js";
import { FinancialReadinessAuditController } from "./financial-readiness-audit-controller.js";
import { resetFinartLogsForTesting } from "./finart-logging.js";
import { READINESS_CLASSIFICATIONS, FINANCIAL_READINESS_AUDIT_SYSTEM_PATH } from "./paths.js";
import { resetFinartSequenceForTesting } from "./audit-store.js";
import type { FinartInput, FinancialReadinessAuditCockpitSnapshot, FinancialReadinessAuditState } from "./types.js";

export interface FinancialReadinessAuditOptions {
  configuration?: Partial<FinancialReadinessAuditConfiguration>;
  dependencies?: FinancialReadinessAuditDependencies;
}

/**
 * Authoritative Q11-08 Financial Readiness Audit — the eighth Q11 acceptance gate.
 * It discovers every financial component strictly from injected dependency
 * handles, verifies financial CAPABILITY presence via typeof === "function"
 * evidence only — NEVER invoking payment capture, journal post, refund,
 * reconciliation, or other mutating financial side-effects during audit.
 * It classifies each component's financial readiness deterministically from
 * this structural evidence.
 *
 * It NEVER fabricates financial evidence, NEVER certifies unverified financial
 * capability, NEVER executes financial transactions, NEVER modifies accounting
 * records, NEVER assumes implementation, NEVER repairs failed financial
 * components, and NEVER overrides governance, approved architecture, Pillow,
 * or Grand King. It NEVER implements Q11-09 (Executive Acceptance Pack) or
 * later — it only exposes a Q1109ConsumableContract for Q11-09 to consume,
 * and it consumes the Q1108ConsumableContract exposed by Q11-07 (Recovery Audit)
 * when injected.
 */
export class FinancialReadinessAudit {
  private initializedAt: string | null = null;
  private readonly manager: FinancialReadinessAuditManager;
  private readonly controller: FinancialReadinessAuditController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: FinancialReadinessAuditOptions = {},
  ) {
    this.manager = new FinancialReadinessAuditManager();
    this.manager.setRepositoryRoot(bootstrap.repositoryRoot);
    if (options.dependencies) this.manager.bindIntegrations(options.dependencies);
    this.controller = new FinancialReadinessAuditController(
      this.manager,
      buildFinancialReadinessAuditConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      FINANCIAL_READINESS_AUDIT_SYSTEM_PATH,
    );
    if (!doc?.includes("Financial Readiness Audit")) {
      throw new Error(`${FINANCIAL_READINESS_AUDIT_SYSTEM_PATH} missing — Q11-08 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: FinancialReadinessAuditDependencies = {}) {
    this.controller.bindIntegrations(deps);
    return this;
  }

  getState(): FinancialReadinessAuditState {
    if (!this.initializedAt) {
      throw new Error("Financial Readiness Audit not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.manager.getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-FINART-001",
      missionId: "Q11-08",
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
          "Financial Readiness Audit is the eighth Q11 acceptance gate: it discovers every financial component strictly from injected dependency handles, verifies financial CAPABILITY presence via typeof evidence only (never invokes mutating financial side-effects), and classifies financial readiness deterministically. It never fabricates evidence, never certifies unverified capability, never executes transactions, and never overrides Pillow, Grand King, or approved architecture. It never implements Q11-09 (Executive Acceptance Pack) or later.",
        ],
      },
    };
  }

  connect(_input: Record<string, unknown> = {}) {
    return this.controller.connect();
  }

  discoverFinancialComponents() {
    return this.controller.discoverFinancialComponents();
  }

  verifyPaymentWorkflows() {
    return this.controller.verifyPaymentWorkflows();
  }

  verifyRevenueRecording() {
    return this.controller.verifyRevenueRecording();
  }

  verifyExpenseTracking() {
    return this.controller.verifyExpenseTracking();
  }

  verifyAccountingRecords() {
    return this.controller.verifyAccountingRecords();
  }

  verifyFinancialReporting() {
    return this.controller.verifyFinancialReporting();
  }

  verifyCostControls() {
    return this.controller.verifyCostControls();
  }

  verifyFinancialGovernance() {
    return this.controller.verifyFinancialGovernance();
  }

  verifyAuditTraceability() {
    return this.controller.verifyAuditTraceability();
  }

  verifyIntegrations() {
    return this.controller.verifyIntegrations();
  }

  classifyFinancialReadiness() {
    return this.controller.classifyFinancialReadiness();
  }

  produceFinancialReadinessFindings(input: FinartInput = {}) {
    return this.controller.produceFinancialReadinessFindings(input);
  }

  produceFinancialReadinessAuditReport(input: FinartInput = {}) {
    return this.controller.produceReport(input);
  }

  produceReport(input: FinartInput = {}) {
    return this.controller.produceReport(input);
  }

  auditFinancialReadiness(input: FinartInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: FinartInput = {}) {
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

  getFinancialHistory(limit = 100) {
    return this.manager.getFinancialHistory(limit);
  }

  getFinancialMatrix() {
    return this.controller.getFinancialMatrix();
  }

  getQ1109ConsumableContract() {
    return this.controller.getQ1109ConsumableContract();
  }

  validate(input: FinartInput = {}) {
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

  getCockpitSnapshot(): FinancialReadinessAuditCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q11-08",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      latestReportId: state.health.lastReportId,
      lastDecision: state.health.lastDecision,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      readinessClassificationOptions: [...READINESS_CLASSIFICATIONS],
      neverFabricateFinancialEvidence: true,
      neverCertifyUnverifiedFinancialCapability: true,
      neverExecuteFinancialTransactions: true,
      neverModifyAccountingRecords: true,
      neverAssumeImplementation: true,
      neverRepairFailedFinancialComponents: true,
      neverBypassPillowGovernance: true,
      neverBypassGrandKingApproval: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ1109OrLater: true,
      eighthQ11Gate: true,
    };
  }
}

export function createFinancialReadinessAudit(
  bootstrap: EmpireBootstrapContext,
  options?: FinancialReadinessAuditOptions,
) {
  return new FinancialReadinessAudit(bootstrap, options);
}

export function resetFinancialReadinessAuditForTesting() {
  resetFinartLogsForTesting();
  resetFinartSequenceForTesting();
  resetFinancialReadinessAuditManagerSequencesForTesting();
}
