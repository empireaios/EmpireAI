import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { ReviewContentWorkerController } from "./review-content-worker-controller.js";
import {
  buildReviewContentWorkerConfiguration,
  type ReviewContentWorkerConfiguration,
} from "./configuration.js";
import type { ReviewContentWorkerDependencies } from "./integrations.js";
import { resetRcwLogsForTesting } from "./rcw-logging.js";
import { ReviewManager } from "./review-manager.js";
import { resetRcwSequenceForTesting } from "./review-store.js";
import { REVIEW_CONTENT_WORKER_SYSTEM_PATH } from "./paths.js";
import type {
  ReviewContentWorkerCockpitSnapshot,
  ReviewContentWorkerState,
  RcwInput,
  Q805ConsumableContract,
} from "./types.js";

export interface ReviewContentWorkerOptions {
  configuration?: Partial<ReviewContentWorkerConfiguration>;
  dependencies?: ReviewContentWorkerDependencies;
}

/** Authoritative Q8-04 Review Content Worker — evidence-based review assets only. */
export class ReviewContentWorker {
  private initializedAt: string | null = null;
  private readonly controller: ReviewContentWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: ReviewContentWorkerOptions = {},
  ) {
    const manager = new ReviewManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new ReviewContentWorkerController(
      manager,
      buildReviewContentWorkerConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      REVIEW_CONTENT_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Review Content Worker")) {
      throw new Error(
        `${REVIEW_CONTENT_WORKER_SYSTEM_PATH} missing — Q8-04 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: ReviewContentWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): ReviewContentWorkerState {
    if (!this.initializedAt) {
      throw new Error("Review Content Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getStore().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-RCW-001",
      missionId: "Q8-04",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord.healthStatus ?? "standby",
        healthScore: engineRecord.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalReports: engineRecord.totalReports,
        totalReviews: engineRecord.totalReviews,
        lastReportId: engineRecord.lastReportId,
        lastConfidenceScore: engineRecord.lastConfidenceScore,
        notes: [
          "Review Content Worker creates review articles, pros/cons, alternatives, and buying recommendations from opportunity/comparison evidence only: does not publish websites, fabricate reviews/ratings, replace Comparison Site Worker, override Pillow or Grand King, or implement Q8-05 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  consumeAffiliateOpportunityReport(input: RcwInput = {}) {
    return this.controller.consumeAffiliateOpportunityReport(input);
  }

  consumeComparisonSiteReport(input: RcwInput = {}) {
    return this.controller.consumeComparisonSiteReport(input);
  }

  generateReviewArticle(input: RcwInput = {}) {
    return this.controller.generateReviewArticle(input);
  }

  generateProsAndCons(input: RcwInput = {}) {
    return this.controller.generateProsAndCons(input);
  }

  recommendAlternatives(input: RcwInput = {}) {
    return this.controller.recommendAlternatives(input);
  }

  produceBuyingRecommendation(input: RcwInput = {}) {
    return this.controller.produceBuyingRecommendation(input);
  }

  explainIdealCustomerProfile(input: RcwInput = {}) {
    return this.controller.explainIdealCustomerProfile(input);
  }

  highlightLimitations(input: RcwInput = {}) {
    return this.controller.highlightLimitations(input);
  }

  produceReviewContentReport(input: RcwInput = {}) {
    return this.controller.produceReviewContentReport(input);
  }

  produceReport(input: RcwInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: RcwInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  getReports() {
    return this.controller.getManager().getStore().listReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getAuditTrail() {
    return this.controller.getManager().getStore().getAuditTrail();
  }

  getVersionHistory(productId?: string) {
    return this.controller.getManager().getStore().getVersionHistory(productId);
  }

  validate(input: RcwInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  runDiagnostics() {
    return this.controller.runDiagnostics();
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
        `Review content reports: ${state.health.totalReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ReviewContentWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q8-04",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      totalReviews: state.health.totalReviews,
      latestReportId: state.health.lastReportId,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverFabricateReviewsRatingsOrProductInformation: true,
      neverPublishWebsites: true,
      neverManipulateRatings: true,
      neverReplaceComparisonSiteWorker: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ805OrLater: true,
      consumableByQ805: true,
    };
  }

  getQ805ConsumableContract(): Q805ConsumableContract {
    return this.controller.getManager().getQ805ConsumableContract();
  }
}

export function createReviewContentWorker(
  bootstrap: EmpireBootstrapContext,
  options?: ReviewContentWorkerOptions,
) {
  return new ReviewContentWorker(bootstrap, options);
}

export function resetReviewContentWorkerForTesting() {
  resetRcwLogsForTesting();
  resetRcwSequenceForTesting();
}
