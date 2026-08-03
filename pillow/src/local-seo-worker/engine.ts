import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildLocalSeoWorkerConfiguration,
  type LocalSeoWorkerConfiguration,
} from "./configuration.js";
import type { LocalSeoWorkerDependencies } from "./integrations.js";
import { LocalSeoWorkerController } from "./local-seo-worker-controller.js";
import { resetLseoLogsForTesting } from "./lseo-logging.js";
import { LOCAL_SEO_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetSeoSequenceForTesting } from "./seo-builder.js";
import { SeoManager } from "./seo-manager.js";
import type {
  LocalSeoInput,
  LocalSeoWorkerCockpitSnapshot,
  LocalSeoWorkerState,
  Q708ConsumableContract,
} from "./types.js";

export interface LocalSeoWorkerOptions {
  configuration?: Partial<LocalSeoWorkerConfiguration>;
  dependencies?: LocalSeoWorkerDependencies;
}

/** Authoritative Q7-07 Local SEO Worker — structural local SEO asset signals only. */
export class LocalSeoWorker {
  private initializedAt: string | null = null;
  private readonly controller: LocalSeoWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: LocalSeoWorkerOptions = {},
  ) {
    const manager = new SeoManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new LocalSeoWorkerController(
      manager,
      buildLocalSeoWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      LOCAL_SEO_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Local SEO Worker")) {
      throw new Error(
        `${LOCAL_SEO_WORKER_SYSTEM_PATH} missing — Q7-07 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: LocalSeoWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): LocalSeoWorkerState {
    if (!this.initializedAt) {
      throw new Error("Local SEO Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-LSEO-001",
      missionId: "Q7-07",
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
        totalReports: engineRecord?.totalReports ?? 0,
        totalSessions: engineRecord?.totalSessions ?? 0,
        lastReportId: engineRecord?.lastReportId ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Local SEO Worker prepares structural SEO assets only: does not publish websites, purchase backlinks, manipulate rankings, modify live GBP, fabricate SEO performance results, override approved architecture, override Pillow or Grand King, or implement Q7-08 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  consumeServiceOffer(input: LocalSeoInput = {}) {
    return this.controller.consumeServiceOffer(input);
  }

  generateGoogleBusinessRecommendations(input: LocalSeoInput = {}) {
    return this.controller.generateGoogleBusinessRecommendations(input);
  }

  generateLandingPages(input: LocalSeoInput = {}) {
    return this.controller.generateLandingPages(input);
  }

  generateServicePages(input: LocalSeoInput = {}) {
    return this.controller.generateServicePages(input);
  }

  generateCityAreaPages(input: LocalSeoInput = {}) {
    return this.controller.generateCityAreaPages(input);
  }

  generateSeoTitlesAndMeta(input: LocalSeoInput = {}) {
    return this.controller.generateSeoTitlesAndMeta(input);
  }

  generateStructuredDataRecommendations(input: LocalSeoInput = {}) {
    return this.controller.generateStructuredDataRecommendations(input);
  }

  generateLocalKeywords(input: LocalSeoInput = {}) {
    return this.controller.generateLocalKeywords(input);
  }

  generateInternalLinkingRecommendations(input: LocalSeoInput = {}) {
    return this.controller.generateInternalLinkingRecommendations(input);
  }

  generateCitationRecommendations(input: LocalSeoInput = {}) {
    return this.controller.generateCitationRecommendations(input);
  }

  evaluateSeoCompleteness(input: LocalSeoInput = {}) {
    return this.controller.evaluateSeoCompleteness(input);
  }

  produceLocalSeoReport(input: LocalSeoInput = {}) {
    return this.controller.produceLocalSeoReport(input);
  }

  produceReport(input: LocalSeoInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: LocalSeoInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  getReports() {
    return this.controller.getManager().getReports();
  }

  getLandingPages() {
    return this.controller.getManager().getLandingPages();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getAuditTrail() {
    return this.controller.getManager().getAuditTrail();
  }

  validate(input: LocalSeoInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  runDiagnostics() {
    return this.controller.runDiagnostics();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestReportId() {
    return this.controller.getManager().getLatestReportId();
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
        `Local SEO reports: ${state.health.totalReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): LocalSeoWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q7-07",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      totalSessions: state.health.totalSessions,
      latestReportId: this.getLatestReportId(),
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverPublishWebsites: true,
      neverPurchaseBacklinks: true,
      neverManipulateSearchRankings: true,
      neverModifyLiveGoogleBusinessProfilesAutomatically: true,
      neverFabricateSeoPerformanceResults: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ708OrLater: true,
      consumableByQ708: true,
    };
  }

  getQ708ConsumableContract(): Q708ConsumableContract {
    return {
      contractVersion: "LSEO-Q708-v1",
      consumableByQ708: true,
      fields: [
        "reportId",
        "businessProjectId",
        "sourceOfferReportId",
        "targetLocation",
        "serviceCategory",
        "landingPagesGenerated",
        "googleBusinessRecommendations",
        "localKeywords",
        "metadata",
        "structuredDataRecommendations",
        "citationRecommendations",
        "internalLinkingRecommendations",
        "napConsistencyRecommendations",
        "seoCompletenessStatus",
        "faqAssets",
        "outstandingIssues",
        "confidenceScore",
        "traceabilityRefs",
      ] as const,
      types: {
        LocalSeoReport: "LocalSeoReport",
        LandingPageAsset: "LandingPageAsset",
        GoogleBusinessRecommendation: "GoogleBusinessRecommendation",
        LocalKeyword: "LocalKeyword",
        SeoMetadata: "SeoMetadata",
        StructuredDataRecommendation: "StructuredDataRecommendation",
        CitationRecommendation: "CitationRecommendation",
      },
      notes: [
        "Q7-08 may consume structural local SEO asset packages only.",
        "Completeness scores reflect generated asset presence — never live ranking or traffic results.",
        "LSEO never publishes websites, purchases backlinks, manipulates rankings, or modifies live GBP.",
      ],
      neverPublishWebsites: true,
      neverPurchaseBacklinks: true,
      neverManipulateSearchRankings: true,
      neverModifyLiveGoogleBusinessProfilesAutomatically: true,
      neverFabricateSeoPerformanceResults: true,
    };
  }
}

export function createLocalSeoWorker(
  bootstrap: EmpireBootstrapContext,
  options?: LocalSeoWorkerOptions,
) {
  return new LocalSeoWorker(bootstrap, options);
}

export function resetLocalSeoWorkerForTesting() {
  resetLseoLogsForTesting();
  resetSeoSequenceForTesting();
}
