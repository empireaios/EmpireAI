import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildLocalMarketResearchWorkerConfiguration,
  type LocalMarketResearchWorkerConfiguration,
} from "./configuration.js";
import { resetEvidenceSequenceForTesting } from "./evidence-adapters.js";
import type { LocalMarketResearchWorkerDependencies } from "./integrations.js";
import { LocalMarketResearchWorkerController } from "./local-market-research-worker-controller.js";
import { resetLmrwLogsForTesting } from "./lmrw-logging.js";
import { LOCAL_MARKET_RESEARCH_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetResearchSequenceForTesting } from "./research-builder.js";
import { ResearchManager } from "./research-manager.js";
import type {
  LocalMarketResearchInput,
  LocalMarketResearchWorkerCockpitSnapshot,
  LocalMarketResearchWorkerState,
  Q703ConsumableContract,
} from "./types.js";

export interface LocalMarketResearchWorkerOptions {
  configuration?: Partial<LocalMarketResearchWorkerConfiguration>;
  dependencies?: LocalMarketResearchWorkerDependencies;
}

/** Authoritative Q7-02 Local Market Research Worker — structural research signals only. */
export class LocalMarketResearchWorker {
  private initializedAt: string | null = null;
  private readonly controller: LocalMarketResearchWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: LocalMarketResearchWorkerOptions = {},
  ) {
    const manager = new ResearchManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new LocalMarketResearchWorkerController(
      manager,
      buildLocalMarketResearchWorkerConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      LOCAL_MARKET_RESEARCH_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Local Market Research Worker")) {
      throw new Error(
        `${LOCAL_MARKET_RESEARCH_WORKER_SYSTEM_PATH} missing — Q7-02 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: LocalMarketResearchWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): LocalMarketResearchWorkerState {
    if (!this.initializedAt) {
      throw new Error("Local Market Research Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-LMRW-001",
      missionId: "Q7-02",
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
        lastResearchId: engineRecord?.lastResearchId ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Local Market Research Worker produces structural local-market evidence only: does not finalize service packages, set final prices, make launch decisions, build booking systems/websites, contact customers/competitors without approval, purchase data/advertising without approval, fabricate demand/pricing/competitor data, override Pillow or Grand King, or implement Q7-03 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  submitResearchRequest(input: LocalMarketResearchInput = {}) {
    return this.controller.submitResearchRequest(input);
  }

  researchLocalDemand(input: LocalMarketResearchInput = {}) {
    return this.controller.researchLocalDemand(input);
  }

  identifyCustomerSegments(input: LocalMarketResearchInput = {}) {
    return this.controller.identifyCustomerSegments(input);
  }

  researchCompetitors(input: LocalMarketResearchInput = {}) {
    return this.controller.researchCompetitors(input);
  }

  profileCompetitors(input: LocalMarketResearchInput = {}) {
    return this.controller.profileCompetitors(input);
  }

  researchCompetitorServices(input: LocalMarketResearchInput = {}) {
    return this.controller.researchCompetitorServices(input);
  }

  researchMarketPricing(input: LocalMarketResearchInput = {}) {
    return this.controller.researchMarketPricing(input);
  }

  identifyPainPoints(input: LocalMarketResearchInput = {}) {
    return this.controller.identifyPainPoints(input);
  }

  identifyServiceGaps(input: LocalMarketResearchInput = {}) {
    return this.controller.identifyServiceGaps(input);
  }

  analyzeServiceOpportunities(input: LocalMarketResearchInput = {}) {
    return this.controller.analyzeServiceOpportunities(input);
  }

  assessMarketAttractiveness(input: LocalMarketResearchInput = {}) {
    return this.controller.assessMarketAttractiveness(input);
  }

  produceLocalMarketResearchReport(input: LocalMarketResearchInput = {}) {
    return this.controller.produceLocalMarketResearchReport(input);
  }

  produceReport(input: LocalMarketResearchInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: LocalMarketResearchInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  getReports() {
    return this.controller.getManager().getReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getAuditTrail() {
    return this.controller.getManager().getAuditTrail();
  }

  validate(input: LocalMarketResearchInput = {}) {
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

  getLatestResearchId() {
    return this.controller.getManager().getLatestResearchId();
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
        `Research reports: ${state.health.totalReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): LocalMarketResearchWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q7-02",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      totalSessions: state.health.totalSessions,
      latestResearchId: this.getLatestResearchId(),
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverFinalizeServicePackages: true,
      neverSetFinalPrices: true,
      neverMakeLaunchDecisions: true,
      neverFabricateDemandPricingOrCompetitorData: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ703OrLater: true,
      consumableByQ703: true,
    };
  }

  getQ703ConsumableContract(): Q703ConsumableContract {
    return {
      contractVersion: "LMRW-Q703-v1",
      consumableByQ703: true,
      fields: [
        "researchId",
        "businessProjectId",
        "targetCountry",
        "targetCity",
        "targetServiceArea",
        "serviceCategory",
        "customerSegments",
        "demandFindings",
        "competitorProfiles",
        "pricingFindings",
        "customerPainPoints",
        "serviceGaps",
        "opportunityFindings",
        "marketAttractivenessAssessment",
        "risks",
        "assumptions",
        "unknowns",
        "evidenceSources",
        "confidenceScore",
        "recommendedResearchFollowUps",
        "executiveSummary",
        "evidenceMode",
        "traceabilityRefs",
      ] as const,
      types: {
        LocalMarketResearchReport: "LocalMarketResearchReport",
        DemandFindings: "DemandFindings",
        CompetitorProfile: "CompetitorProfile",
        PricingFindings: "PricingFindings",
        ServiceOpportunity: "ServiceOpportunity",
        MarketAttractivenessAssessment: "MarketAttractivenessAssessment",
        EvidenceRecord: "EvidenceRecord",
      },
      notes: [
        "Q7-03 may consume structural local market research findings only.",
        "PricingFindings never include finalPriceRecommendation.",
        "LMRW never finalizes service packages, sets final prices, or makes launch decisions.",
      ],
      neverFinalizeServicePackages: true,
      neverSetFinalPrices: true,
      neverMakeLaunchDecisions: true,
    };
  }
}

export function createLocalMarketResearchWorker(
  bootstrap: EmpireBootstrapContext,
  options?: LocalMarketResearchWorkerOptions,
) {
  return new LocalMarketResearchWorker(bootstrap, options);
}

export function resetLocalMarketResearchWorkerForTesting() {
  resetLmrwLogsForTesting();
  resetResearchSequenceForTesting();
  resetEvidenceSequenceForTesting();
}
