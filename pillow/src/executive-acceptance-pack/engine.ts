import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildExecutiveAcceptancePackConfiguration,
  type ExecutiveAcceptancePackConfiguration,
} from "./configuration.js";
import type { ExecutiveAcceptancePackDependencies } from "./integrations.js";
import {
  ExecutiveAcceptancePackManager,
  resetExecutiveAcceptancePackManagerSequencesForTesting,
} from "./executive-acceptance-pack-manager.js";
import { ExecutiveAcceptancePackController } from "./executive-acceptance-pack-controller.js";
import { resetEaprtLogsForTesting } from "./eaprt-logging.js";
import { EXECUTIVE_ACCEPTANCE_PACK_SYSTEM_PATH, READINESS_CLASSIFICATIONS } from "./paths.js";
import { resetEaprtSequenceForTesting } from "./audit-store.js";
import type {
  EaprtInput,
  ExecutiveAcceptancePackCockpitSnapshot,
  ExecutiveAcceptancePackState,
} from "./types.js";

export interface ExecutiveAcceptancePackOptions {
  configuration?: Partial<ExecutiveAcceptancePackConfiguration>;
  dependencies?: ExecutiveAcceptancePackDependencies;
}

/**
 * Authoritative Q11-09 Executive Acceptance Pack — the ninth Q11 acceptance gate.
 * It aggregates certification reports, audit reports, and production readiness
 * evidence strictly from injected dependency handles. It consumes the
 * Q1109ConsumableContract from Q11-08 (Financial Readiness Audit) when available;
 * when absent it records the prior gate as missing/not consumable and never
 * fabricates FINART completion. It exposes a Q1110ConsumableContract for Q11-10.
 *
 * It NEVER fabricates acceptance evidence, NEVER hides failed audits, NEVER
 * approves production deployment, NEVER overrides failed certifications, and
 * NEVER implements Q11-10 (Grand King Acceptance Gate) or later.
 */
export class ExecutiveAcceptancePack {
  private initializedAt: string | null = null;
  private readonly manager: ExecutiveAcceptancePackManager;
  private readonly controller: ExecutiveAcceptancePackController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: ExecutiveAcceptancePackOptions = {},
  ) {
    this.manager = new ExecutiveAcceptancePackManager();
    this.manager.setRepositoryRoot(bootstrap.repositoryRoot);
    if (options.dependencies) this.manager.bindIntegrations(options.dependencies);
    this.controller = new ExecutiveAcceptancePackController(
      this.manager,
      buildExecutiveAcceptancePackConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      EXECUTIVE_ACCEPTANCE_PACK_SYSTEM_PATH,
    );
    if (!doc?.includes("Executive Acceptance Pack")) {
      throw new Error(`${EXECUTIVE_ACCEPTANCE_PACK_SYSTEM_PATH} missing — Q11-09 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: ExecutiveAcceptancePackDependencies = {}) {
    this.controller.bindIntegrations(deps);
    return this;
  }

  getState(): ExecutiveAcceptancePackState {
    if (!this.initializedAt) {
      throw new Error("Executive Acceptance Pack not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.manager.getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-EAPRT-001",
      missionId: "Q11-09",
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
          "Executive Acceptance Pack is the ninth Q11 acceptance gate: it aggregates Q11 certification and audit evidence from injected handles only, consumes Q1109 contract when Q11-08 is available, and never fabricates FINART completion or approves production deployment. Grand King retains final authority.",
        ],
      },
    };
  }

  connect(_input: Record<string, unknown> = {}) {
    return this.controller.connect();
  }

  collectCertificationReports() {
    return this.controller.collectCertificationReports();
  }

  collectAuditReports() {
    return this.controller.collectAuditReports();
  }

  collectProductionReadinessEvidence() {
    return this.controller.collectProductionReadinessEvidence();
  }

  generateExecutiveSummary(input: EaprtInput = {}) {
    return this.controller.generateExecutiveSummary(input);
  }

  generateOutstandingIssueSummary(input: EaprtInput = {}) {
    return this.controller.generateOutstandingIssueSummary(input);
  }

  generateDeploymentRecommendation(input: EaprtInput = {}) {
    return this.controller.generateDeploymentRecommendation(input);
  }

  classifyProductionReadiness() {
    return this.controller.classifyProductionReadiness();
  }

  produceExecutiveChecklist() {
    return this.controller.produceExecutiveChecklist();
  }

  produceExecutiveAcceptancePackReport(input: EaprtInput = {}) {
    return this.controller.produceReport(input);
  }

  assemblePack(input: EaprtInput = {}) {
    return this.controller.assemblePack(input);
  }

  produceReport(input: EaprtInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: EaprtInput = {}) {
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

  getPackHistory(limit = 100) {
    return this.manager.getPackHistory(limit);
  }

  getQ1110ConsumableContract() {
    return this.controller.getQ1110ConsumableContract();
  }

  validate(input: EaprtInput = {}) {
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
        `Pack reports: ${state.health.totalReports}`,
        `Last decision: ${state.health.lastDecision ?? "none"}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ExecutiveAcceptancePackCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q11-09",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      latestReportId: state.health.lastReportId,
      lastDecision: state.health.lastDecision,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      readinessClassificationOptions: [...READINESS_CLASSIFICATIONS],
      neverFabricateAcceptanceEvidence: true,
      neverHideFailedAudits: true,
      neverApproveProductionDeployment: true,
      neverOverrideFailedCertifications: true,
      neverBypassPillowGovernance: true,
      neverBypassGrandKingApproval: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ1110OrLater: true,
      ninthQ11Gate: true,
    };
  }
}

export function createExecutiveAcceptancePack(
  bootstrap: EmpireBootstrapContext,
  options?: ExecutiveAcceptancePackOptions,
) {
  return new ExecutiveAcceptancePack(bootstrap, options);
}

export function resetExecutiveAcceptancePackForTesting() {
  resetEaprtLogsForTesting();
  resetEaprtSequenceForTesting();
  resetExecutiveAcceptancePackManagerSequencesForTesting();
}
