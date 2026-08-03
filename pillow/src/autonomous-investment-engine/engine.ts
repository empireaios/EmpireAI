import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildAutonomousInvestmentEngineConfiguration,
  type AutonomousInvestmentEngineConfiguration,
} from "./configuration.js";
import { AutonomousInvestmentController } from "./autonomous-investment-controller.js";
import {
  AutonomousInvestmentManager,
  type AutonomousInvestmentDependencies,
} from "./autonomous-investment-manager.js";
import { AUTONOMOUS_INVESTMENT_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  AutonomousInvestmentCockpitSnapshot,
  AutonomousInvestmentInput,
  AutonomousInvestmentState,
} from "./types.js";

export type { AutonomousInvestmentDependencies };
export interface AutonomousInvestmentEngineOptions {
  configuration?: Partial<AutonomousInvestmentEngineConfiguration>;
}

export class AutonomousInvestmentEngine {
  private initializedAt: string | null = null;
  private readonly controller: AutonomousInvestmentController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    dependencies: AutonomousInvestmentDependencies = {},
    options: AutonomousInvestmentEngineOptions = {},
  ) {
    this.controller = new AutonomousInvestmentController(
      new AutonomousInvestmentManager(dependencies),
      buildAutonomousInvestmentEngineConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(AUTONOMOUS_INVESTMENT_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Autonomous Investment Engine")) {
      throw new Error(`${AUTONOMOUS_INVESTMENT_ENGINE_SYSTEM_PATH} missing — X5-12 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): AutonomousInvestmentState {
    if (!this.initializedAt) throw new Error("Autonomous Investment Engine not initialized. Call initialize() first.");
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    const count = this.getInvestmentRecords().length;
    return {
      engineVersion: "PILLOW-AIE-001",
      missionId: "X5-12",
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
        totalInvestmentRecords: count,
        notes: [
          "Structural investment signals only; strategies execute only after governance approval.",
        ],
      },
    };
  }

  connectAutonomousInvestmentEngine(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  discoverInvestmentOpportunities(input: AutonomousInvestmentInput = {}) {
    return this.controller.run("discover_investment_opportunities", input);
  }

  evaluateInvestmentOpportunities(input: AutonomousInvestmentInput = {}) {
    return this.controller.run("evaluate_investment_opportunities", input);
  }

  estimateExpectedInvestmentReturns(input: AutonomousInvestmentInput = {}) {
    return this.controller.run("estimate_expected_investment_returns", input);
  }

  assessInvestmentRisks(input: AutonomousInvestmentInput = {}) {
    return this.controller.run("assess_investment_risks", input);
  }

  prioritizeInvestmentOpportunities(input: AutonomousInvestmentInput = {}) {
    return this.controller.run("prioritize_investment_opportunities", input);
  }

  recommendInvestmentStrategies(input: AutonomousInvestmentInput = {}) {
    return this.controller.run("recommend_investment_strategies", input);
  }

  executeGovernanceApprovedInvestmentStrategies(input: AutonomousInvestmentInput = {}) {
    return this.controller.run("execute_governance_approved_investment_strategies", input);
  }

  monitorInvestmentPerformance(input: AutonomousInvestmentInput = {}) {
    return this.controller.run("monitor_investment_performance", input);
  }

  detectUnderperformingInvestments(input: AutonomousInvestmentInput = {}) {
    return this.controller.run("detect_underperforming_investments", input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getInvestmentRecords() {
    return this.controller.getManager().getInvestmentRecords();
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
      notes: [`Engine status: ${state.status}`, `Investment records: ${state.health.totalInvestmentRecords}`, ...state.health.notes],
    };
  }

  getCockpitSnapshot(): AutonomousInvestmentCockpitSnapshot {
    const state = this.getState();
    const record = state.engineRecord;
    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: state.latestReport?.validation.decision ?? null,
      totalInvestmentRecords: state.health.totalInvestmentRecords,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected:
        Number(Boolean(record?.dependencyPresence.empireIntelligenceFramework)) +
        Number(Boolean(record?.dependencyPresence.empireCapitalAllocation)) +
        Number(Boolean(record?.dependencyPresence.crossEmpireGovernanceEngine)),
      recentLogs: [],
    };
  }
}

export function createAutonomousInvestmentEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: AutonomousInvestmentDependencies = {},
  options?: AutonomousInvestmentEngineOptions,
) {
  return new AutonomousInvestmentEngine(bootstrap, dependencies, options);
}

export function resetAutonomousInvestmentEngineForTesting() {}
