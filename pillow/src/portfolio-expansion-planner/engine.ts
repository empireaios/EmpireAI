import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildPortfolioExpansionPlannerConfiguration,
  type PortfolioExpansionPlannerConfiguration,
} from "./configuration.js";
import { appendPepLog, getPepLogs, resetPepLogsForTesting } from "./pep-logging.js";
import { PORTFOLIO_EXPANSION_PLANNER_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectPortfolioExpansionPlannerInput,
  EstimateExpansionCostsInput,
  EstimateExpansionReturnsInput,
  EvaluateExpansionInput,
  ExpansionCockpitSnapshot,
  ExpansionRunReport,
  GenerateExpansionRecommendationsInput,
  IdentifyExpansionOpportunitiesInput,
  PortfolioExpansionPlannerState,
  PrioritizeExpansionsInput,
  RunExpansionDiagnosticsInput,
} from "./types.js";
import { PortfolioExpansionController } from "./portfolio-expansion-controller.js";
import {
  PortfolioExpansionManager,
  type PortfolioExpansionPlannerDependencies,
} from "./portfolio-expansion-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface PortfolioExpansionPlannerOptions {
  configuration?: Partial<PortfolioExpansionPlannerConfiguration>;
}

export type { PortfolioExpansionPlannerDependencies };

/**
 * Portfolio Expansion Planner (PILLOW-PEP-001 / X2-18).
 * Expansion governance — recommendations only; auto-initiation blocked beyond approval policies.
 */
export class PortfolioExpansionPlanner {
  private initializedAt: string | null = null;
  private readonly controller: PortfolioExpansionController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: PortfolioExpansionPlannerDependencies,
    options: PortfolioExpansionPlannerOptions = {},
  ) {
    const config = buildPortfolioExpansionPlannerConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new PortfolioExpansionManager(dependencies);
    this.controller = new PortfolioExpansionController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<PortfolioExpansionPlannerState> {
    const doc = await this.reader.readText(PORTFOLIO_EXPANSION_PLANNER_SYSTEM_PATH);
    if (!doc?.includes("Portfolio Expansion Planner")) {
      throw new Error(
        `${PORTFOLIO_EXPANSION_PLANNER_SYSTEM_PATH} missing — requires X2-18 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendPepLog({
      event: "PORTFOLIO_EXPANSION_PLANNER_ready",
      level: "info",
      details: "X2-18 Portfolio Expansion Planner initialized",
    });
    return this.getState();
  }

  getState(): PortfolioExpansionPlannerState {
    if (!this.initializedAt) {
      throw new Error(
        "Portfolio Expansion Planner not initialized. Call initialize() first.",
      );
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const expansions = this.controller.getManager().getExpansionRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalExpansionRecords: expansions.length,
      highPriorityExpansions: this.controller.getManager().highPriorityCount(),
      averageExpectedReturn: this.controller.getManager().averageExpectedReturn(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-PEP-001",
      missionId: "X2-18",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectPortfolioExpansionPlanner(
    input: ConnectPortfolioExpansionPlannerInput = {},
  ): ExpansionRunReport {
    return this.controller.connectPortfolioExpansionPlanner(input);
  }

  identifyOpportunities(
    input: IdentifyExpansionOpportunitiesInput = {},
  ): ExpansionRunReport {
    return this.controller.identifyOpportunities(input);
  }

  evaluateMarkets(input: EvaluateExpansionInput = {}): ExpansionRunReport {
    return this.controller.evaluateMarkets(input);
  }

  evaluateIndustries(input: EvaluateExpansionInput = {}): ExpansionRunReport {
    return this.controller.evaluateIndustries(input);
  }

  evaluateInternal(input: EvaluateExpansionInput = {}): ExpansionRunReport {
    return this.controller.evaluateInternal(input);
  }

  evaluateAcquisition(input: EvaluateExpansionInput = {}): ExpansionRunReport {
    return this.controller.evaluateAcquisition(input);
  }

  prioritizeExpansions(input: PrioritizeExpansionsInput = {}): ExpansionRunReport {
    return this.controller.prioritizeExpansions(input);
  }

  estimateCosts(input: EstimateExpansionCostsInput = {}): ExpansionRunReport {
    return this.controller.estimateCosts(input);
  }

  estimateReturns(input: EstimateExpansionReturnsInput = {}): ExpansionRunReport {
    return this.controller.estimateReturns(input);
  }

  generateRecommendations(
    input: GenerateExpansionRecommendationsInput = {},
  ): ExpansionRunReport {
    return this.controller.generateRecommendations(input);
  }

  runDiagnostics(input: RunExpansionDiagnosticsInput = {}): ExpansionRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): ExpansionRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getExpansionRecords() {
    return this.controller.getManager().getExpansionRecords();
  }

  updateConfiguration(
    overrides: Partial<PortfolioExpansionPlannerConfiguration>,
  ): PortfolioExpansionPlannerState {
    const next = buildPortfolioExpansionPlannerConfiguration(this.bootstrap.repositoryRoot, {
      ...this.controller.getConfiguration(),
      ...overrides,
    });
    this.controller.updateConfiguration(next);
    return this.getState();
  }

  validateForSupervisorSync(): {
    valid: boolean;
    health: "healthy" | "degraded" | "blocked";
    readinessScore: number;
    notes: string[];
  } {
    const state = this.getState();
    const report = state.latestReport;
    const score = report
      ? report.validation.decision === "pass"
        ? 100
        : report.validation.decision === "partial"
          ? 70
          : 40
      : state.health.healthScore;

    return {
      valid: state.health.status !== "failed",
      health: score >= 75 ? "healthy" : score >= 50 ? "degraded" : "blocked",
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Expansion records: ${state.health.totalExpansionRecords}`,
        `High-priority: ${state.health.highPriorityExpansions} · avg return: ${state.health.averageExpectedReturn}`,
        "Automatic expansion initiation blocked beyond approval policies",
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No expansion analyses yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ExpansionCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;
    const deps = record?.dependencyPresence;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalExpansionRecords: state.health.totalExpansionRecords,
      highPriorityExpansions: state.health.highPriorityExpansions,
      averageExpectedReturn: state.health.averageExpectedReturn,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected:
        (deps?.enterprisePortfolioFramework ? 1 : 0) +
        (deps?.portfolioPerformanceEngine ? 1 : 0) +
        (deps?.capitalDistributionEngine ? 1 : 0) +
        (deps?.portfolioRiskEngine ? 1 : 0) +
        (deps?.businessHealthRanking ? 1 : 0) +
        (deps?.acquisitionEvaluationEngine ? 1 : 0) +
        (deps?.portfolioOptimizationEngine ? 1 : 0) +
        (deps?.companyLifecycleManager ? 1 : 0),
      recentLogs: getPepLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createPortfolioExpansionPlanner(
  bootstrap: EmpireBootstrapContext,
  dependencies: PortfolioExpansionPlannerDependencies,
  options?: PortfolioExpansionPlannerOptions,
): PortfolioExpansionPlanner {
  return new PortfolioExpansionPlanner(bootstrap, dependencies, options);
}

export function resetPortfolioExpansionPlannerForTesting(): void {
  resetPepLogsForTesting();
  new PortfolioExpansionManager({
    enterprisePortfolioFramework: null,
    portfolioPerformanceEngine: null,
    capitalDistributionEngine: null,
    portfolioRiskEngine: null,
    businessHealthRanking: null,
    acquisitionEvaluationEngine: null,
    portfolioOptimizationEngine: null,
    companyLifecycleManager: null,
  }).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
