import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildPortfolioOptimizationEngineConfiguration,
  type PortfolioOptimizationEngineConfiguration,
} from "./configuration.js";
import { appendPoeLog, getPoeLogs, resetPoeLogsForTesting } from "./poe-logging.js";
import { PORTFOLIO_OPTIMIZATION_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectPortfolioOptimizationEngineInput,
  DetectOptimizationOpportunitiesInput,
  GenerateOptimizationRecommendationsInput,
  OptimizationCockpitSnapshot,
  OptimizationRunReport,
  OptimizePortfolioInput,
  PortfolioOptimizationEngineState,
  RankOptimizationPrioritiesInput,
  RunOptimizationDiagnosticsInput,
} from "./types.js";
import { PortfolioOptimizationController } from "./portfolio-optimization-controller.js";
import {
  PortfolioOptimizationManager,
  type PortfolioOptimizationEngineDependencies,
} from "./portfolio-optimization-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface PortfolioOptimizationEngineOptions {
  configuration?: Partial<PortfolioOptimizationEngineConfiguration>;
}

export type { PortfolioOptimizationEngineDependencies };

/**
 * Portfolio Optimization Engine (PILLOW-POE-001 / X2-16).
 * Continuous optimization — recommendations only; auto-execution blocked beyond approval policies.
 */
export class PortfolioOptimizationEngine {
  private initializedAt: string | null = null;
  private readonly controller: PortfolioOptimizationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: PortfolioOptimizationEngineDependencies,
    options: PortfolioOptimizationEngineOptions = {},
  ) {
    const config = buildPortfolioOptimizationEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new PortfolioOptimizationManager(dependencies);
    this.controller = new PortfolioOptimizationController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<PortfolioOptimizationEngineState> {
    const doc = await this.reader.readText(PORTFOLIO_OPTIMIZATION_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Portfolio Optimization Engine")) {
      throw new Error(
        `${PORTFOLIO_OPTIMIZATION_ENGINE_SYSTEM_PATH} missing — requires X2-16 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendPoeLog({
      event: "PORTFOLIO_OPTIMIZATION_ENGINE_ready",
      level: "info",
      details: "X2-16 Portfolio Optimization Engine initialized",
    });
    return this.getState();
  }

  getState(): PortfolioOptimizationEngineState {
    if (!this.initializedAt) {
      throw new Error(
        "Portfolio Optimization Engine not initialized. Call initialize() first.",
      );
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const optimizations = this.controller.getManager().getOptimizationRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalOptimizationRecords: optimizations.length,
      highPriorityOpportunities: this.controller.getManager().highPriorityCount(),
      averageExpectedBenefit: this.controller.getManager().averageExpectedBenefit(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-POE-001",
      missionId: "X2-16",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectPortfolioOptimizationEngine(
    input: ConnectPortfolioOptimizationEngineInput = {},
  ): OptimizationRunReport {
    return this.controller.connectPortfolioOptimizationEngine(input);
  }

  optimizeEnterprisePerformance(input: OptimizePortfolioInput = {}): OptimizationRunReport {
    return this.controller.optimizeEnterprisePerformance(input);
  }

  optimizeCapitalAllocation(input: OptimizePortfolioInput = {}): OptimizationRunReport {
    return this.controller.optimizeCapitalAllocation(input);
  }

  optimizeResourceUtilization(input: OptimizePortfolioInput = {}): OptimizationRunReport {
    return this.controller.optimizeResourceUtilization(input);
  }

  optimizeCompanyPriorities(input: OptimizePortfolioInput = {}): OptimizationRunReport {
    return this.controller.optimizeCompanyPriorities(input);
  }

  optimizeOperationalEfficiency(input: OptimizePortfolioInput = {}): OptimizationRunReport {
    return this.controller.optimizeOperationalEfficiency(input);
  }

  optimizePortfolioBalance(input: OptimizePortfolioInput = {}): OptimizationRunReport {
    return this.controller.optimizePortfolioBalance(input);
  }

  detectOpportunities(
    input: DetectOptimizationOpportunitiesInput = {},
  ): OptimizationRunReport {
    return this.controller.detectOpportunities(input);
  }

  rankPriorities(input: RankOptimizationPrioritiesInput = {}): OptimizationRunReport {
    return this.controller.rankPriorities(input);
  }

  generateRecommendations(
    input: GenerateOptimizationRecommendationsInput = {},
  ): OptimizationRunReport {
    return this.controller.generateRecommendations(input);
  }

  runDiagnostics(input: RunOptimizationDiagnosticsInput = {}): OptimizationRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): OptimizationRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getOptimizationRecords() {
    return this.controller.getManager().getOptimizationRecords();
  }

  updateConfiguration(
    overrides: Partial<PortfolioOptimizationEngineConfiguration>,
  ): PortfolioOptimizationEngineState {
    const next = buildPortfolioOptimizationEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Optimization records: ${state.health.totalOptimizationRecords}`,
        `High-priority: ${state.health.highPriorityOpportunities} · avg benefit: ${state.health.averageExpectedBenefit}`,
        "Automatic optimization execution blocked beyond approval policies",
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No optimization analyses yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): OptimizationCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;
    const deps = record?.dependencyPresence;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalOptimizationRecords: state.health.totalOptimizationRecords,
      highPriorityOpportunities: state.health.highPriorityOpportunities,
      averageExpectedBenefit: state.health.averageExpectedBenefit,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected:
        (deps?.enterprisePortfolioFramework ? 1 : 0) +
        (deps?.portfolioPerformanceEngine ? 1 : 0) +
        (deps?.capitalDistributionEngine ? 1 : 0) +
        (deps?.portfolioRiskEngine ? 1 : 0) +
        (deps?.portfolioBalanceEngine ? 1 : 0) +
        (deps?.businessHealthRanking ? 1 : 0) +
        (deps?.sharedCustomerIntelligence ? 1 : 0) +
        (deps?.sharedSupplierIntelligence ? 1 : 0) +
        (deps?.portfolioForecastEngine ? 1 : 0) +
        (deps?.acquisitionEvaluationEngine ? 1 : 0),
      recentLogs: getPoeLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createPortfolioOptimizationEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: PortfolioOptimizationEngineDependencies,
  options?: PortfolioOptimizationEngineOptions,
): PortfolioOptimizationEngine {
  return new PortfolioOptimizationEngine(bootstrap, dependencies, options);
}

export function resetPortfolioOptimizationEngineForTesting(): void {
  resetPoeLogsForTesting();
  new PortfolioOptimizationManager({
    enterprisePortfolioFramework: null,
    portfolioPerformanceEngine: null,
    capitalDistributionEngine: null,
    portfolioRiskEngine: null,
    portfolioBalanceEngine: null,
    businessHealthRanking: null,
    sharedCustomerIntelligence: null,
    sharedSupplierIntelligence: null,
    portfolioForecastEngine: null,
    acquisitionEvaluationEngine: null,
  }).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
