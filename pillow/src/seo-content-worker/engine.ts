import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { SeoContentWorkerController } from "./seo-content-worker-controller.js";
import {
  buildSeoContentWorkerConfiguration,
  type SeoContentWorkerConfiguration,
} from "./configuration.js";
import type { SeoContentWorkerDependencies } from "./integrations.js";
import { resetSeowLogsForTesting } from "./seow-logging.js";
import { SeoManager } from "./seo-manager.js";
import { resetSeowSequenceForTesting } from "./seo-store.js";
import { SEO_CONTENT_WORKER_SYSTEM_PATH } from "./paths.js";
import type {
  Q806ConsumableContract,
  SeoContentWorkerCockpitSnapshot,
  SeoContentWorkerState,
  SeowInput,
} from "./types.js";

export interface SeoContentWorkerOptions {
  configuration?: Partial<SeoContentWorkerConfiguration>;
  dependencies?: SeoContentWorkerDependencies;
}

/** Authoritative Q8-05 SEO Content Worker — evidence-based SEO assets only. */
export class SeoContentWorker {
  private initializedAt: string | null = null;
  private readonly controller: SeoContentWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: SeoContentWorkerOptions = {},
  ) {
    const manager = new SeoManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new SeoContentWorkerController(
      manager,
      buildSeoContentWorkerConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      SEO_CONTENT_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("SEO Content Worker")) {
      throw new Error(
        `${SEO_CONTENT_WORKER_SYSTEM_PATH} missing — Q8-05 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: SeoContentWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): SeoContentWorkerState {
    if (!this.initializedAt) {
      throw new Error("SEO Content Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getStore().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-SEOW-001",
      missionId: "Q8-05",
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
        totalArticles: engineRecord.totalArticles,
        lastReportId: engineRecord.lastReportId,
        lastConfidenceScore: engineRecord.lastConfidenceScore,
        notes: [
          "SEO Content Worker creates SEO plans, briefs, articles, keyword maps, and internal links from opportunity/review evidence only: does not publish articles, fabricate SEO performance claims, manipulate rankings, replace Analytics Worker, override Pillow or Grand King, or implement Q8-06 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  consumeAffiliateOpportunityReport(input: SeowInput = {}) {
    return this.controller.consumeAffiliateOpportunityReport(input);
  }

  consumeReviewContentReport(input: SeowInput = {}) {
    return this.controller.consumeReviewContentReport(input);
  }

  generateSeoContentPlan(input: SeowInput = {}) {
    return this.controller.generateSeoContentPlan(input);
  }

  generateKeywordMapping(input: SeowInput = {}) {
    return this.controller.generateKeywordMapping(input);
  }

  generateArticleBrief(input: SeowInput = {}) {
    return this.controller.generateArticleBrief(input);
  }

  generateSeoArticle(input: SeowInput = {}) {
    return this.controller.generateSeoArticle(input);
  }

  generateInternalLinkingPlan(input: SeowInput = {}) {
    return this.controller.generateInternalLinkingPlan(input);
  }

  evaluateContentCompleteness(input: SeowInput = {}) {
    return this.controller.evaluateContentCompleteness(input);
  }

  produceSeoContentReport(input: SeowInput = {}) {
    return this.controller.produceSeoContentReport(input);
  }

  produceReport(input: SeowInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: SeowInput = {}) {
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

  getVersionHistory() {
    return this.controller.getManager().getStore().getVersionHistory();
  }

  validate(input: SeowInput = {}) {
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
        `SEO content reports: ${state.health.totalReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): SeoContentWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q8-05",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      totalArticles: state.health.totalArticles,
      latestReportId: state.health.lastReportId,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverFabricateSeoPerformanceClaims: true,
      neverPublishArticles: true,
      neverManipulateSearchRankings: true,
      neverReplaceAnalyticsWorker: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ806OrLater: true,
      consumableByQ806: true,
    };
  }

  getQ806ConsumableContract(): Q806ConsumableContract {
    return this.controller.getManager().getQ806ConsumableContract();
  }
}

export function createSeoContentWorker(
  bootstrap: EmpireBootstrapContext,
  options?: SeoContentWorkerOptions,
) {
  return new SeoContentWorker(bootstrap, options);
}

export function resetSeoContentWorkerForTesting() {
  resetSeowLogsForTesting();
  resetSeowSequenceForTesting();
}
