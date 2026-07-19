import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildBudgetOptimizationEngineConfiguration,
  type BudgetOptimizationEngineConfiguration,
} from "./configuration.js";
import { appendBoeLog, getBoeLogs, resetBoeLogsForTesting } from "./boe-logging.js";
import { BUDGET_OPTIMIZATION_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  AllocateBudgetInput,
  BudgetCockpitSnapshot,
  BudgetOptimizationEngineState,
  BudgetRunReport,
  ConnectBudgetOptimizationInput,
  MonitorSpendInput,
  OptimizeBudgetsInput,
  ReallocateBudgetInput,
  RecommendAdjustmentsInput,
} from "./types.js";
import { BudgetOptimizationController } from "./budget-optimization-controller.js";
import {
  BudgetOptimizationManager,
  type BudgetOptimizationEngineDependencies,
} from "./budget-optimization-manager.js";
import { BudgetAnalyticsEngine } from "./budget-analytics-engine.js";

export interface BudgetOptimizationEngineOptions {
  configuration?: Partial<BudgetOptimizationEngineConfiguration>;
}

export type { BudgetOptimizationEngineDependencies };

/**
 * Budget Optimization Engine (PILLOW-BOE-001 / R5-13).
 * Dynamic budget allocation for higher advertising efficiency — structural only.
 */
export class BudgetOptimizationEngine {
  private initializedAt: string | null = null;
  private readonly controller: BudgetOptimizationController;
  private readonly reader: RepositoryReader;
  private readonly analytics = new BudgetAnalyticsEngine();

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: BudgetOptimizationEngineDependencies,
    options: BudgetOptimizationEngineOptions = {},
  ) {
    const config = buildBudgetOptimizationEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new BudgetOptimizationManager(dependencies);
    this.controller = new BudgetOptimizationController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<BudgetOptimizationEngineState> {
    const doc = await this.reader.readText(BUDGET_OPTIMIZATION_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Budget Optimization Engine")) {
      throw new Error(
        `${BUDGET_OPTIMIZATION_ENGINE_SYSTEM_PATH} missing — requires R5-13 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendBoeLog({
      event: "engine_initialization",
      level: "info",
      details: "R5-13 Budget Optimization Engine initialized",
    });
    return this.getState();
  }

  getState(): BudgetOptimizationEngineState {
    if (!this.initializedAt) {
      throw new Error("Budget Optimization Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const budgets = this.controller.getManager().getBudgetRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalBudgetRecords: budgets.length,
      averageUtilization: this.analytics.averageUtilization(budgets),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-BOE-001",
      missionId: "R5-13",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectBudgetOptimization(input: ConnectBudgetOptimizationInput = {}): BudgetRunReport {
    return this.controller.connectBudgetOptimization(input);
  }

  allocateBudget(input: AllocateBudgetInput): BudgetRunReport {
    return this.controller.allocateBudget(input);
  }

  reallocateBudget(input: ReallocateBudgetInput = {}): BudgetRunReport {
    return this.controller.reallocateBudget(input);
  }

  monitorSpend(input: MonitorSpendInput = {}): BudgetRunReport {
    return this.controller.monitorSpend(input);
  }

  monitorUtilization(input: MonitorSpendInput = {}): BudgetRunReport {
    return this.controller.monitorUtilization(input);
  }

  detectInefficiencies(input: MonitorSpendInput = {}): BudgetRunReport {
    return this.controller.detectInefficiencies(input);
  }

  detectOverspend(input: MonitorSpendInput = {}): BudgetRunReport {
    return this.controller.detectOverspend(input);
  }

  calculateEfficiency(input: MonitorSpendInput = {}): BudgetRunReport {
    return this.controller.calculateEfficiency(input);
  }

  recommendAdjustments(input: RecommendAdjustmentsInput = {}): BudgetRunReport {
    return this.controller.recommendAdjustments(input);
  }

  optimizeBudgets(input: OptimizeBudgetsInput = {}): BudgetRunReport {
    return this.controller.optimizeBudgets(input);
  }

  getLatestReport(): BudgetRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getBudgetRecords() {
    return this.controller.getManager().getBudgetRecords();
  }

  updateConfiguration(
    overrides: Partial<BudgetOptimizationEngineConfiguration>,
  ): BudgetOptimizationEngineState {
    const next = buildBudgetOptimizationEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Budget Optimization Engine status: ${state.status}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No budget optimization operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): BudgetCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;
    const dependenciesConnected = record
      ? Object.values(record.dependencyPresence).filter(Boolean).length
      : 0;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalBudgetRecords: state.health.totalBudgetRecords,
      averageUtilization: state.health.averageUtilization,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected,
      recentLogs: getBoeLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createBudgetOptimizationEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: BudgetOptimizationEngineDependencies,
  options?: BudgetOptimizationEngineOptions,
): BudgetOptimizationEngine {
  return new BudgetOptimizationEngine(bootstrap, dependencies, options);
}

export function resetBudgetOptimizationEngineForTesting(): void {
  resetBoeLogsForTesting();
  new BudgetOptimizationManager({
    marketingFramework: null,
    metaAds: null,
    googleAds: null,
    tiktokAds: null,
    youtubeAds: null,
    campaignManager: null,
    audienceIntelligence: null,
    attributionEngine: null,
    marketingAnalyticsDashboard: null,
    aiCampaignGenerator: null,
  }).resetForTesting();
}
