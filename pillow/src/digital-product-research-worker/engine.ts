import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildDigitalProductResearchWorkerConfiguration,
  type DigitalProductResearchWorkerConfiguration,
} from "./configuration.js";
import type { DigitalProductResearchWorkerDependencies } from "./integrations.js";
import { DigitalProductResearchWorkerController } from "./digital-product-research-worker-controller.js";
import { resetDprLogsForTesting } from "./dpr-logging.js";
import { DIGITAL_PRODUCT_RESEARCH_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetResearchSequenceForTesting } from "./research-builder.js";
import { ResearchManager } from "./research-manager.js";
import type {
  DigitalProductResearchWorkerCockpitSnapshot,
  DigitalProductResearchWorkerInput,
  DigitalProductResearchWorkerState,
} from "./types.js";

export interface DigitalProductResearchWorkerOptions {
  configuration?: Partial<DigitalProductResearchWorkerConfiguration>;
  dependencies?: DigitalProductResearchWorkerDependencies;
}

/** Authoritative Q5-02 Digital Product Research Worker — research/analysis only. */
export class DigitalProductResearchWorker {
  private initializedAt: string | null = null;
  private readonly controller: DigitalProductResearchWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: DigitalProductResearchWorkerOptions = {},
  ) {
    const manager = new ResearchManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new DigitalProductResearchWorkerController(
      manager,
      buildDigitalProductResearchWorkerConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      DIGITAL_PRODUCT_RESEARCH_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Digital Product Research Worker")) {
      throw new Error(
        `${DIGITAL_PRODUCT_RESEARCH_WORKER_SYSTEM_PATH} missing — Q5-02 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: DigitalProductResearchWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): DigitalProductResearchWorkerState {
    if (!this.initializedAt) {
      throw new Error(
        "Digital Product Research Worker not initialized. Call initialize() first.",
      );
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-DPR-001",
      missionId: "Q5-02",
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
        totalResearchReports: engineRecord?.totalResearchReports ?? 0,
        lastResearchReportId: engineRecord?.lastResearchReportId ?? null,
        lastOpportunityScore: engineRecord?.lastOpportunityScore ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        lastRecommendedPriority: engineRecord?.lastRecommendedPriority ?? null,
        notes: [
          "Research-only: does not create digital products, create sales pages, process payments, invent unsupported market evidence, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  analyseCustomerPainPoints(input: DigitalProductResearchWorkerInput = {}) {
    return this.controller.analyseCustomerPainPoints(input);
  }

  analyseSearchDemand(input: DigitalProductResearchWorkerInput = {}) {
    return this.controller.analyseSearchDemand(input);
  }

  analyseMarketGaps(input: DigitalProductResearchWorkerInput = {}) {
    return this.controller.analyseMarketGaps(input);
  }

  analyseCompetitorProducts(input: DigitalProductResearchWorkerInput = {}) {
    return this.controller.analyseCompetitorProducts(input);
  }

  analyseEmergingTrends(input: DigitalProductResearchWorkerInput = {}) {
    return this.controller.analyseEmergingTrends(input);
  }

  discoverUnderservedNiches(input: DigitalProductResearchWorkerInput = {}) {
    return this.controller.discoverUnderservedNiches(input);
  }

  estimateDemand(input: DigitalProductResearchWorkerInput = {}) {
    return this.controller.estimateDemand(input);
  }

  estimateCommercialOpportunity(input: DigitalProductResearchWorkerInput = {}) {
    return this.controller.estimateCommercialOpportunity(input);
  }

  rankOpportunities(input: DigitalProductResearchWorkerInput = {}) {
    return this.controller.rankOpportunities(input);
  }

  produceDigitalProductResearchReport(input: DigitalProductResearchWorkerInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: DigitalProductResearchWorkerInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  validate(input: DigitalProductResearchWorkerInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  getResearchReports() {
    return this.controller.getManager().getResearchReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestResearchReportId() {
    return this.controller.getManager().getLatestResearchReportId();
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
        `Research reports: ${state.health.totalResearchReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): DigitalProductResearchWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q5-02",
      status: state.status,
      healthStatus: state.health.status,
      totalResearchReports: state.health.totalResearchReports,
      latestResearchReportId: this.getLatestResearchReportId(),
      lastOpportunityScore: state.health.lastOpportunityScore,
      lastConfidenceScore: state.health.lastConfidenceScore,
      lastRecommendedPriority: state.health.lastRecommendedPriority,
      workerId: state.configuration.workerId,
      neverCreateDigitalProducts: true,
      neverCreateSalesPages: true,
      neverProcessPayments: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createDigitalProductResearchWorker(
  bootstrap: EmpireBootstrapContext,
  options?: DigitalProductResearchWorkerOptions,
) {
  return new DigitalProductResearchWorker(bootstrap, options);
}

export function resetDigitalProductResearchWorkerForTesting() {
  resetDprLogsForTesting();
  resetResearchSequenceForTesting();
}
