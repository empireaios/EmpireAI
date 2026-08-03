import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildBusinessApprovalPackWorkerConfiguration,
  type BusinessApprovalPackWorkerConfiguration,
} from "./configuration.js";
import type { BusinessApprovalPackWorkerDependencies } from "./integrations.js";
import { BusinessApprovalPackWorkerController } from "./business-approval-pack-worker-controller.js";
import { resetBapLogsForTesting } from "./bap-logging.js";
import { BUSINESS_APPROVAL_PACK_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetPackSequenceForTesting } from "./pack-builder.js";
import { PackManager } from "./pack-manager.js";
import type {
  BusinessApprovalPackWorkerCockpitSnapshot,
  BusinessApprovalPackWorkerInput,
  BusinessApprovalPackWorkerState,
} from "./types.js";

export interface BusinessApprovalPackWorkerOptions {
  configuration?: Partial<BusinessApprovalPackWorkerConfiguration>;
  dependencies?: BusinessApprovalPackWorkerDependencies;
}

/** Authoritative Q2-09 Business Approval Pack Worker — packaging only. */
export class BusinessApprovalPackWorker {
  private initializedAt: string | null = null;
  private readonly controller: BusinessApprovalPackWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: BusinessApprovalPackWorkerOptions = {},
  ) {
    const manager = new PackManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new BusinessApprovalPackWorkerController(
      manager,
      buildBusinessApprovalPackWorkerConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      BUSINESS_APPROVAL_PACK_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Business Approval Pack Worker")) {
      throw new Error(
        `${BUSINESS_APPROVAL_PACK_WORKER_SYSTEM_PATH} missing — Q2-09 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: BusinessApprovalPackWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): BusinessApprovalPackWorkerState {
    if (!this.initializedAt) {
      throw new Error(
        "Business Approval Pack Worker not initialized. Call initialize() first.",
      );
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-BAP-001",
      missionId: "Q2-09",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore:
          engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalApprovalPacks: engineRecord?.totalApprovalPacks ?? 0,
        lastApprovalPackId: engineRecord?.lastApprovalPackId ?? null,
        lastRecommendation: engineRecord?.lastRecommendation ?? null,
        notes: [
          "Packaging-only: does not approve businesses, launch businesses, modify previous reports, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectBusinessApprovalPackWorker(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveBusinessModel(input: BusinessApprovalPackWorkerInput = {}) {
    return this.controller.receiveBusinessModel(input);
  }

  receiveMarketResearch(input: BusinessApprovalPackWorkerInput = {}) {
    return this.controller.receiveMarketResearch(input);
  }

  receiveOpportunityEvaluation(input: BusinessApprovalPackWorkerInput = {}) {
    return this.controller.receiveOpportunityEvaluation(input);
  }

  receiveBusinessBlueprint(input: BusinessApprovalPackWorkerInput = {}) {
    return this.controller.receiveBlueprint(input);
  }

  receiveLaunchPlan(input: BusinessApprovalPackWorkerInput = {}) {
    return this.controller.receiveLaunchPlan(input);
  }

  receiveBusinessRiskReport(input: BusinessApprovalPackWorkerInput = {}) {
    return this.controller.receiveRiskReport(input);
  }

  consolidateFindings(input: BusinessApprovalPackWorkerInput = {}) {
    return this.controller.consolidateFindings(input);
  }

  produceExecutiveSummary(input: BusinessApprovalPackWorkerInput = {}) {
    return this.controller.produceExecutiveSummary(input);
  }

  produceBusinessApprovalPack(input: BusinessApprovalPackWorkerInput = {}) {
    return this.controller.produceApprovalPack(input);
  }

  submitBusinessApprovalPack(input: BusinessApprovalPackWorkerInput = {}) {
    return this.controller.submitApprovalPack(input);
  }

  listBusinessApprovalPacks() {
    return this.controller.list();
  }

  validateBusinessApprovalPackWorker(input: BusinessApprovalPackWorkerInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getApprovalPacks() {
    return this.controller.getManager().getPacks();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestApprovalPackId() {
    return this.controller.getManager().getLatestPackId();
  }

  getAuditTrail() {
    return this.controller.getManager().getAuditTrail();
  }

  getIntegrations() {
    return this.controller.getManager().getIntegrations();
  }

  validateForSupervisorSync() {
    const state = this.getState();
    const score =
      state.latestReport?.validation.decision === "fail"
        ? 40
        : state.latestReport?.validation.decision === "partial"
          ? 70
          : 100;
    return {
      valid: state.health.status !== "failed",
      health:
        score >= 75
          ? ("healthy" as const)
          : score >= 50
            ? ("degraded" as const)
            : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Approval packs: ${state.health.totalApprovalPacks}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): BusinessApprovalPackWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q2-09",
      status: state.status,
      healthStatus: state.health.status,
      totalApprovalPacks: state.health.totalApprovalPacks,
      latestApprovalPackId: this.getLatestApprovalPackId(),
      lastRecommendation: state.health.lastRecommendation,
      workerId: state.configuration.workerId,
      neverApproveBusiness: true,
      neverLaunchBusiness: true,
      neverModifyPreviousReports: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createBusinessApprovalPackWorker(
  bootstrap: EmpireBootstrapContext,
  options?: BusinessApprovalPackWorkerOptions,
) {
  return new BusinessApprovalPackWorker(bootstrap, options);
}

export function resetBusinessApprovalPackWorkerForTesting() {
  resetBapLogsForTesting();
  resetPackSequenceForTesting();
}
