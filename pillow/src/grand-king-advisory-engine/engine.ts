import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildGrandKingAdvisoryEngineConfiguration,
  type GrandKingAdvisoryEngineConfiguration,
} from "./configuration.js";
import { GrandKingAdvisoryController } from "./grand-king-advisory-controller.js";
import {
  GrandKingAdvisoryManager,
  type GrandKingAdvisoryDependencies,
} from "./grand-king-advisory-manager.js";
import { GRAND_KING_ADVISORY_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  GrandKingAdvisoryCockpitSnapshot,
  GrandKingAdvisoryInput,
  GrandKingAdvisoryState,
} from "./types.js";

export type { GrandKingAdvisoryDependencies };
export interface GrandKingAdvisoryEngineOptions {
  configuration?: Partial<GrandKingAdvisoryEngineConfiguration>;
}

export class GrandKingAdvisoryEngine {
  private initializedAt: string | null = null;
  private readonly controller: GrandKingAdvisoryController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    dependencies: GrandKingAdvisoryDependencies = {},
    options: GrandKingAdvisoryEngineOptions = {},
  ) {
    this.controller = new GrandKingAdvisoryController(
      new GrandKingAdvisoryManager(dependencies),
      buildGrandKingAdvisoryEngineConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(GRAND_KING_ADVISORY_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Grand King Advisory Engine")) {
      throw new Error(`${GRAND_KING_ADVISORY_ENGINE_SYSTEM_PATH} missing — X5-15 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): GrandKingAdvisoryState {
    if (!this.initializedAt) throw new Error("Grand King Advisory Engine not initialized. Call initialize() first.");
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    const count = this.getAdvisoryRecords().length;
    return {
      engineVersion: "PILLOW-GKA-001",
      missionId: "X5-15",
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
        totalAdvisoryRecords: count,
        notes: [
          "Structural advisory signals only; executive decisions never execute automatically without approved governance.",
        ],
      },
    };
  }

  connectGrandKingAdvisoryEngine(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  analyzeEnterprisePerformance(input: GrandKingAdvisoryInput = {}) {
    return this.controller.run("analyze_enterprise_performance", input);
  }

  identifyStrategicOpportunities(input: GrandKingAdvisoryInput = {}) {
    return this.controller.run("identify_strategic_opportunities", { ...input, opportunityHint: input.opportunityHint ?? true });
  }

  identifyStrategicRisks(input: GrandKingAdvisoryInput = {}) {
    return this.controller.run("identify_strategic_risks", { ...input, riskHint: input.riskHint ?? true });
  }

  prioritizeExecutiveDecisions(input: GrandKingAdvisoryInput = {}) {
    return this.controller.run("prioritize_executive_decisions", input);
  }

  recommendCapitalAllocationStrategies(input: GrandKingAdvisoryInput = {}) {
    return this.controller.run("recommend_capital_allocation_strategies", input);
  }

  recommendGrowthInitiatives(input: GrandKingAdvisoryInput = {}) {
    return this.controller.run("recommend_growth_initiatives", input);
  }

  recommendOptimizationInitiatives(input: GrandKingAdvisoryInput = {}) {
    return this.controller.run("recommend_optimization_initiatives", input);
  }

  recommendGovernanceActions(input: GrandKingAdvisoryInput = {}) {
    return this.controller.run("recommend_governance_actions", input);
  }

  trackAdvisoryOutcomes(input: GrandKingAdvisoryInput = {}) {
    return this.controller.run("track_advisory_outcomes", input);
  }

  generateRankedRecommendations(input: GrandKingAdvisoryInput = {}) {
    return this.controller.run("generate_ranked_recommendations", input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getAdvisoryRecords() {
    return this.controller.getManager().getAdvisoryRecords();
  }

  getRecommendations() {
    return this.controller.getManager().getRecommendations();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
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
      health: score >= 75 ? ("healthy" as const) : score >= 50 ? ("degraded" as const) : ("blocked" as const),
      readinessScore: score,
      notes: [`Engine status: ${state.status}`, `Advisory records: ${state.health.totalAdvisoryRecords}`, ...state.health.notes],
    };
  }

  getCockpitSnapshot(): GrandKingAdvisoryCockpitSnapshot {
    const state = this.getState();
    const record = state.engineRecord;
    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: state.latestReport?.validation.decision ?? null,
      totalAdvisoryRecords: state.health.totalAdvisoryRecords,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected:
        Number(Boolean(record?.dependencyPresence.empireIntelligenceFramework)) +
        Number(Boolean(record?.dependencyPresence.executiveEmpireDashboard)) +
        Number(Boolean(record?.dependencyPresence.empireLegacyEngine)),
      recentLogs: [],
    };
  }
}

export function createGrandKingAdvisoryEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: GrandKingAdvisoryDependencies = {},
  options?: GrandKingAdvisoryEngineOptions,
) {
  return new GrandKingAdvisoryEngine(bootstrap, dependencies, options);
}

export function resetGrandKingAdvisoryEngineForTesting() {}
