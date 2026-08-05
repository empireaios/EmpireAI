import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildBusinessFactoryAuditConfiguration,
  type BusinessFactoryAuditConfiguration,
} from "./configuration.js";
import type { BusinessFactoryAuditDependencies } from "./integrations.js";
import { BusinessFactoryAuditManager } from "./business-factory-audit-manager.js";
import { BusinessFactoryAuditController } from "./business-factory-audit-controller.js";
import { resetBfartLogsForTesting } from "./bfart-logging.js";
import { BUSINESS_FACTORY_AUDIT_SYSTEM_PATH, READINESS_CLASSIFICATIONS } from "./paths.js";
import { resetBfartSequenceForTesting } from "./audit-store.js";
import type {
  BfartInput,
  BusinessFactoryAuditCockpitSnapshot,
  BusinessFactoryAuditState,
} from "./types.js";

export interface BusinessFactoryAuditOptions {
  configuration?: Partial<BusinessFactoryAuditConfiguration>;
  dependencies?: BusinessFactoryAuditDependencies;
}

/**
 * Authoritative Q11-04 Business Factory Audit — the fourth Q11 acceptance
 * gate. It discovers every registered business factory strictly from an
 * injected Shared Runtime Core (never inventing factories), verifies
 * factory registration (dedicated `*FactoryCore` handle presence for
 * commerce/media/digital-products/enterprise-platform/local-business/
 * affiliate/capital/empire-builder factories, or Worker Registry +
 * workforce presence for `workforce-os`/`workforce`), worker coverage
 * (`worker.factory` matching), workflow dispatch
 * (pillowOrchestrationRuntime.invokeWorker presence — structural,
 * presence-only, never executing business logic), runtime integration,
 * external integrations, governance, and operational readiness from
 * observed evidence only. It classifies each factory's business readiness
 * deterministically, and produces a machine-readable Business Factory
 * Audit Report.
 *
 * It NEVER fabricates audit evidence, NEVER certifies incomplete
 * workflows, NEVER certifies missing integrations, NEVER assumes
 * implementation, NEVER modifies factory implementations, NEVER repairs
 * failed factories, and NEVER overrides governance, approved architecture,
 * Pillow, or Grand King. It NEVER implements Q11-05 (Security Audit) or
 * later — it only exposes a Q1105ConsumableContract for Q11-05 to consume,
 * and it consumes the Q1104ConsumableContract exposed by Q11-03 (Pillow
 * Command Audit) when injected.
 */
export class BusinessFactoryAudit {
  private initializedAt: string | null = null;
  private readonly manager: BusinessFactoryAuditManager;
  private readonly controller: BusinessFactoryAuditController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: BusinessFactoryAuditOptions = {},
  ) {
    this.manager = new BusinessFactoryAuditManager();
    this.manager.setRepositoryRoot(bootstrap.repositoryRoot);
    if (options.dependencies) this.manager.bindIntegrations(options.dependencies);
    this.controller = new BusinessFactoryAuditController(
      this.manager,
      buildBusinessFactoryAuditConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      BUSINESS_FACTORY_AUDIT_SYSTEM_PATH,
    );
    if (!doc?.includes("Business Factory Audit")) {
      throw new Error(`${BUSINESS_FACTORY_AUDIT_SYSTEM_PATH} missing — Q11-04 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: BusinessFactoryAuditDependencies = {}) {
    this.controller.bindIntegrations(deps);
    return this;
  }

  getState(): BusinessFactoryAuditState {
    if (!this.initializedAt) {
      throw new Error("Business Factory Audit not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.manager.getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-BFART-001",
      missionId: "Q11-04",
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
          "Business Factory Audit is the fourth Q11 acceptance gate: it discovers every registered business factory strictly from the injected Shared Runtime Core, verifies registration/workers/workflows/runtime integration/external integrations/governance/operational readiness from observed evidence only, and classifies business factory readiness deterministically. It never fabricates evidence, never certifies incomplete workflows or missing integrations, and never overrides Pillow, Grand King, or approved architecture. It never implements Q11-05 (Security Audit) or later.",
        ],
      },
    };
  }

  connect(_input: Record<string, unknown> = {}) {
    return this.controller.connect();
  }

  discoverFactories() {
    return this.controller.discoverFactories();
  }

  verifyRegistration() {
    return this.controller.verifyRegistration();
  }

  verifyWorkers() {
    return this.controller.verifyWorkers();
  }

  verifyWorkflows() {
    return this.controller.verifyWorkflows();
  }

  verifyRuntimeIntegration() {
    return this.controller.verifyRuntimeIntegration();
  }

  verifyExternalIntegrations() {
    return this.controller.verifyExternalIntegrations();
  }

  verifyGovernance() {
    return this.controller.verifyGovernance();
  }

  verifyOperationalReadiness() {
    return this.controller.verifyOperationalReadiness();
  }

  verifyIntegrations() {
    return this.controller.verifyIntegrations();
  }

  classifyBusinessFactoryReadiness() {
    return this.controller.classifyBusinessFactoryReadiness();
  }

  produceBusinessFactoryReadinessFindings(input: BfartInput = {}) {
    return this.controller.produceBusinessFactoryReadinessFindings(input);
  }

  produceBusinessFactoryAuditReport(input: BfartInput = {}) {
    return this.controller.produceReport(input);
  }

  produceReport(input: BfartInput = {}) {
    return this.controller.produceReport(input);
  }

  auditBusinessFactories(input: BfartInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: BfartInput = {}) {
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

  getBusinessFactoryMatrix() {
    return this.controller.getBusinessFactoryMatrix();
  }

  getQ1105ConsumableContract() {
    return this.controller.getQ1105ConsumableContract();
  }

  validate(input: BfartInput = {}) {
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

  getCockpitSnapshot(): BusinessFactoryAuditCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q11-04",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      latestReportId: state.health.lastReportId,
      lastDecision: state.health.lastDecision,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      readinessClassificationOptions: [...READINESS_CLASSIFICATIONS],
      neverFabricateAuditEvidence: true,
      neverCertifyIncompleteWorkflows: true,
      neverCertifyMissingIntegrations: true,
      neverAssumeImplementation: true,
      neverModifyFactoryImplementations: true,
      neverRepairFailedFactories: true,
      neverBypassPillowGovernance: true,
      neverBypassGrandKingApproval: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ1105OrLater: true,
      fourthQ11Gate: true,
    };
  }
}

export function createBusinessFactoryAudit(
  bootstrap: EmpireBootstrapContext,
  options?: BusinessFactoryAuditOptions,
) {
  return new BusinessFactoryAudit(bootstrap, options);
}

export function resetBusinessFactoryAuditForTesting() {
  resetBfartLogsForTesting();
  resetBfartSequenceForTesting();
}
