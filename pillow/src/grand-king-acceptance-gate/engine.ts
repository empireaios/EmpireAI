import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildGrandKingAcceptanceGateConfiguration,
  type GrandKingAcceptanceGateConfiguration,
} from "./configuration.js";
import type { GrandKingAcceptanceGateDependencies } from "./integrations.js";
import {
  GrandKingAcceptanceGateManager,
  resetGrandKingAcceptanceGateManagerSequencesForTesting,
} from "./grand-king-acceptance-gate-manager.js";
import { GrandKingAcceptanceGateController } from "./grand-king-acceptance-gate-controller.js";
import { resetGkagtLogsForTesting } from "./gkagt-logging.js";
import { GRAND_KING_ACCEPTANCE_GATE_SYSTEM_PATH, GRAND_KING_DECISIONS } from "./paths.js";
import { resetGkagtSequenceForTesting } from "./audit-store.js";
import type {
  GkagtInput,
  GrandKingAcceptanceGateCockpitSnapshot,
  GrandKingAcceptanceGateState,
} from "./types.js";

export interface GrandKingAcceptanceGateOptions {
  configuration?: Partial<GrandKingAcceptanceGateConfiguration>;
  dependencies?: GrandKingAcceptanceGateDependencies;
}

/**
 * Authoritative Q11-10 Grand King Acceptance Gate — the final Q11 acceptance gate.
 * It collects the Executive Acceptance Pack from injected executiveAcceptancePack,
 * verifies prerequisite certifications, presents production readiness to the Grand King,
 * records approve/reject/defer decisions (NEVER auto-approves), blocks deployment
 * without constitutional approval, preserves immutable approval history, and exposes
 * a Q1201ConsumableContract for Q12-01 without implementing Q12.
 *
 * It NEVER fabricates approval evidence, NEVER bypasses Grand King approval,
 * NEVER authorises deployment without approval, and NEVER implements Q12-01 or later.
 */
export class GrandKingAcceptanceGate {
  private initializedAt: string | null = null;
  private readonly manager: GrandKingAcceptanceGateManager;
  private readonly controller: GrandKingAcceptanceGateController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: GrandKingAcceptanceGateOptions = {},
  ) {
    this.manager = new GrandKingAcceptanceGateManager();
    this.manager.setRepositoryRoot(bootstrap.repositoryRoot);
    if (options.dependencies) this.manager.bindIntegrations(options.dependencies);
    this.controller = new GrandKingAcceptanceGateController(
      this.manager,
      buildGrandKingAcceptanceGateConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      GRAND_KING_ACCEPTANCE_GATE_SYSTEM_PATH,
    );
    if (!doc?.includes("Grand King Acceptance Gate")) {
      throw new Error(`${GRAND_KING_ACCEPTANCE_GATE_SYSTEM_PATH} missing — Q11-10 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: GrandKingAcceptanceGateDependencies = {}) {
    this.controller.bindIntegrations(deps);
    return this;
  }

  getState(): GrandKingAcceptanceGateState {
    if (!this.initializedAt) {
      throw new Error("Grand King Acceptance Gate not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.manager.getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-GKAGT-001",
      missionId: "Q11-10",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      deploymentAuthorisationStatus: this.manager.getDeploymentAuthorisationStatus(),
      grandKingDecision: this.manager.getGrandKingDecision(),
      reReviewStatus: this.manager.getReReviewStatus(),
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore: engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalReports: engineRecord?.totalReports ?? 0,
        lastReportId: engineRecord?.lastReportId ?? null,
        lastGrandKingDecision: engineRecord?.lastGrandKingDecision ?? null,
        lastDeploymentAuthorisationStatus: engineRecord?.lastDeploymentAuthorisationStatus ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Grand King Acceptance Gate is the final Q11 acceptance gate: constitutional approval evidence only; consumes Q1110 contract from Executive Acceptance Pack; never auto-approves; deployment blocked until Grand King approve + prerequisites satisfied.",
        ],
      },
    };
  }

  connect(_input: Record<string, unknown> = {}) {
    return this.controller.connect();
  }

  collectExecutiveAcceptancePack() {
    return this.controller.collectExecutiveAcceptancePack();
  }

  verifyPrerequisiteCertifications() {
    return this.controller.verifyPrerequisiteCertifications();
  }

  presentProductionReadiness() {
    return this.controller.presentProductionReadiness();
  }

  recordGrandKingDecision(input: GkagtInput = {}) {
    return this.controller.recordGrandKingDecision(input);
  }

  preventDeploymentWithoutApproval() {
    return this.controller.preventDeploymentWithoutApproval();
  }

  getDeploymentAuthorisationStatus() {
    return this.controller.getDeploymentAuthorisationStatus();
  }

  generateDeploymentAuthorisation(input: GkagtInput = {}) {
    return this.controller.generateDeploymentAuthorisation(input);
  }

  requestReReview(input: GkagtInput = {}) {
    return this.controller.requestReReview(input);
  }

  produceGrandKingAcceptanceReport(input: GkagtInput = {}) {
    return this.controller.produceGrandKingAcceptanceReport(input);
  }

  auditAcceptance(input: GkagtInput = {}) {
    return this.controller.auditAcceptance(input);
  }

  produceReport(input: GkagtInput = {}) {
    return this.produceGrandKingAcceptanceReport(input);
  }

  submitReport(input: GkagtInput = {}) {
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

  getApprovalHistory(limit = 100) {
    return this.controller.getApprovalHistory(limit);
  }

  getQ1111ConsumableContract() {
    return this.controller.getQ1111ConsumableContract();
  }

  getQ1201ConsumableContract() {
    return this.controller.getQ1201ConsumableContract();
  }

  validate(input: GkagtInput = {}) {
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
        `Gate reports: ${state.health.totalReports}`,
        `Grand King decision: ${state.grandKingDecision}`,
        `Deployment auth: ${state.deploymentAuthorisationStatus}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): GrandKingAcceptanceGateCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q11-10",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      latestReportId: state.health.lastReportId,
      grandKingDecision: state.grandKingDecision,
      deploymentAuthorisationStatus: state.deploymentAuthorisationStatus,
      reReviewStatus: state.reReviewStatus,
      workerId: state.configuration.workerId,
      grandKingDecisionOptions: [...GRAND_KING_DECISIONS],
      neverFabricateApprovalEvidence: true,
      neverBypassGrandKingApproval: true,
      neverAuthoriseWithoutApproval: true,
      neverOverrideFailedCertifications: true,
      neverImplementQ1201OrLater: true,
      finalQ11Gate: true,
    };
  }
}

export function createGrandKingAcceptanceGate(
  bootstrap: EmpireBootstrapContext,
  options?: GrandKingAcceptanceGateOptions,
) {
  return new GrandKingAcceptanceGate(bootstrap, options);
}

export function resetGrandKingAcceptanceGateForTesting() {
  resetGkagtLogsForTesting();
  resetGkagtSequenceForTesting();
  resetGrandKingAcceptanceGateManagerSequencesForTesting();
}
