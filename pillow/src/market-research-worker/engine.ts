import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildMarketResearchWorkerConfiguration,
  type MarketResearchWorkerConfiguration,
} from "./configuration.js";
import type { MarketResearchWorkerDependencies } from "./integrations.js";
import { MarketResearchWorkerController } from "./market-research-worker-controller.js";
import { resetMrwLogsForTesting } from "./mrw-logging.js";
import { MARKET_RESEARCH_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetReportSequenceForTesting } from "./research-builder.js";
import { ResearchManager } from "./research-manager.js";
import type {
  MarketResearchWorkerCockpitSnapshot,
  MarketResearchWorkerInput,
  MarketResearchWorkerState,
} from "./types.js";

export interface MarketResearchWorkerOptions {
  configuration?: Partial<MarketResearchWorkerConfiguration>;
  dependencies?: MarketResearchWorkerDependencies;
}

/** Authoritative Q2-04 Market Research Worker — research only. */
export class MarketResearchWorker {
  private initializedAt: string | null = null;
  private readonly controller: MarketResearchWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: MarketResearchWorkerOptions = {},
  ) {
    const manager = new ResearchManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new MarketResearchWorkerController(
      manager,
      buildMarketResearchWorkerConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      MARKET_RESEARCH_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Market Research Worker")) {
      throw new Error(
        `${MARKET_RESEARCH_WORKER_SYSTEM_PATH} missing — Q2-04 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: MarketResearchWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): MarketResearchWorkerState {
    if (!this.initializedAt) {
      throw new Error("Market Research Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-MRW-001",
      missionId: "Q2-04",
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
        lastReportId: engineRecord?.lastReportId ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Research-only: does not decide whether to build, generate branding, build marketing plans, launch businesses, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectMarketResearchWorker(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  researchMarketDemand(input: MarketResearchWorkerInput = {}) {
    return this.controller.researchDemand(input);
  }

  analyseCompetitors(input: MarketResearchWorkerInput = {}) {
    return this.controller.analyseCompetitors(input);
  }

  analyseCustomerProblems(input: MarketResearchWorkerInput = {}) {
    return this.controller.analyseCustomerProblems(input);
  }

  estimateOpportunitySize(input: MarketResearchWorkerInput = {}) {
    return this.controller.estimateOpportunity(input);
  }

  identifyMarketRisks(input: MarketResearchWorkerInput = {}) {
    return this.controller.identifyRisks(input);
  }

  produceMarketResearchReport(input: MarketResearchWorkerInput = {}) {
    return this.controller.produceReport(input);
  }

  submitFindings(input: MarketResearchWorkerInput = {}) {
    return this.controller.submitFindings(input);
  }

  listMarketResearchReports() {
    return this.controller.list();
  }

  validateMarketResearchWorker(input: MarketResearchWorkerInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getReports() {
    return this.controller.getManager().getReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestReportId() {
    return this.controller.getManager().getLatestReportId();
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
        `Reports: ${state.health.totalReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): MarketResearchWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q2-04",
      status: state.status,
      healthStatus: state.health.status,
      totalReports: state.health.totalReports,
      latestReportId: this.getLatestReportId(),
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverDecideWhetherToBuild: true,
      neverGenerateBranding: true,
      neverBuildMarketingPlans: true,
      neverLaunchBusiness: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createMarketResearchWorker(
  bootstrap: EmpireBootstrapContext,
  options?: MarketResearchWorkerOptions,
) {
  return new MarketResearchWorker(bootstrap, options);
}

export function resetMarketResearchWorkerForTesting() {
  resetMrwLogsForTesting();
  resetReportSequenceForTesting();
}
