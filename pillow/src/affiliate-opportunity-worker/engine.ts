import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { AffiliateOpportunityWorkerController } from "./affiliate-opportunity-worker-controller.js";
import {
  buildAffiliateOpportunityWorkerConfiguration,
  type AffiliateOpportunityWorkerConfiguration,
} from "./configuration.js";
import type { AffiliateOpportunityWorkerDependencies } from "./integrations.js";
import { resetAowLogsForTesting } from "./aow-logging.js";
import { OpportunityManager } from "./opportunity-manager.js";
import { resetAowSequenceForTesting } from "./opportunity-store.js";
import { AFFILIATE_OPPORTUNITY_WORKER_SYSTEM_PATH } from "./paths.js";
import type {
  AffiliateOpportunityWorkerCockpitSnapshot,
  AffiliateOpportunityWorkerState,
  AowInput,
  Q803ConsumableContract,
} from "./types.js";

export interface AffiliateOpportunityWorkerOptions {
  configuration?: Partial<AffiliateOpportunityWorkerConfiguration>;
  dependencies?: AffiliateOpportunityWorkerDependencies;
}

/** Authoritative Q8-02 Affiliate Opportunity Worker — evidence-based opportunity research only. */
export class AffiliateOpportunityWorker {
  private initializedAt: string | null = null;
  private readonly controller: AffiliateOpportunityWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: AffiliateOpportunityWorkerOptions = {},
  ) {
    const manager = new OpportunityManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new AffiliateOpportunityWorkerController(
      manager,
      buildAffiliateOpportunityWorkerConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      AFFILIATE_OPPORTUNITY_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Affiliate Opportunity Worker")) {
      throw new Error(
        `${AFFILIATE_OPPORTUNITY_WORKER_SYSTEM_PATH} missing — Q8-02 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: AffiliateOpportunityWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): AffiliateOpportunityWorkerState {
    if (!this.initializedAt) {
      throw new Error("Affiliate Opportunity Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getStore().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-AOW-001",
      missionId: "Q8-02",
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
        totalOpportunities: engineRecord.totalOpportunities,
        lastReportId: engineRecord.lastReportId,
        lastConfidenceScore: engineRecord.lastConfidenceScore,
        notes: [
          "Affiliate Opportunity Worker researches programmes/products/niches/commissions/demand from evidence only: does not create content, publish websites, join programmes automatically, fabricate commission/demand data, override Pillow or Grand King, or implement Q8-03 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  discoverAffiliateProgrammes(input: AowInput = {}) {
    return this.controller.discoverAffiliateProgrammes(input);
  }

  discoverAffiliateProducts(input: AowInput = {}) {
    return this.controller.discoverAffiliateProducts(input);
  }

  researchProfitableNiches(input: AowInput = {}) {
    return this.controller.researchProfitableNiches(input);
  }

  analyseCommissionStructures(input: AowInput = {}) {
    return this.controller.analyseCommissionStructures(input);
  }

  estimateMarketDemand(input: AowInput = {}) {
    return this.controller.estimateMarketDemand(input);
  }

  compareCompetingOpportunities(input: AowInput = {}) {
    return this.controller.compareCompetingOpportunities(input);
  }

  rankOpportunities(input: AowInput = {}) {
    return this.controller.rankOpportunities(input);
  }

  identifyRisks(input: AowInput = {}) {
    return this.controller.identifyRisks(input);
  }

  recommendHighPotentialOpportunities(input: AowInput = {}) {
    return this.controller.recommendHighPotentialOpportunities(input);
  }

  produceAffiliateOpportunityReport(input: AowInput = {}) {
    return this.controller.produceAffiliateOpportunityReport(input);
  }

  produceReport(input: AowInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: AowInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  getReports() {
    return this.controller.getManager().getStore().listReports();
  }

  getOpportunities() {
    return this.controller.getLatestReport()?.opportunityRanking ?? [];
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getAuditTrail() {
    return this.controller.getManager().getStore().getAuditTrail();
  }

  validate(input: AowInput = {}) {
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
        `Affiliate opportunity reports: ${state.health.totalReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): AffiliateOpportunityWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q8-02",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      totalOpportunities: state.health.totalOpportunities,
      latestReportId: state.health.lastReportId,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverFabricateCommissionOrDemandData: true,
      neverCreateAffiliateContent: true,
      neverPublishWebsites: true,
      neverJoinAffiliateProgrammesAutomatically: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ803OrLater: true,
      consumableByQ803: true,
    };
  }

  getQ803ConsumableContract(): Q803ConsumableContract {
    return this.controller.getManager().getQ803ConsumableContract();
  }
}

export function createAffiliateOpportunityWorker(
  bootstrap: EmpireBootstrapContext,
  options?: AffiliateOpportunityWorkerOptions,
) {
  return new AffiliateOpportunityWorker(bootstrap, options);
}

export function resetAffiliateOpportunityWorkerForTesting() {
  resetAowLogsForTesting();
  resetAowSequenceForTesting();
}
