import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildFirstRevenueOptimizerConfiguration,
  type FirstRevenueOptimizerConfiguration,
} from "./configuration.js";
import { appendFroLog, getFroLogs, resetFroLogsForTesting } from "./fro-logging.js";
import { FIRST_REVENUE_OPTIMIZER_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectFirstRevenueOptimizerInput,
  FirstRevenueOptimizerState,
  OptimizeFirstRevenueInput,
  RevenueActionInput,
  RevenueCockpitSnapshot,
  RevenueRunReport,
} from "./types.js";
import { FirstRevenueOptimizerController } from "./first-revenue-optimizer-controller.js";
import {
  FirstRevenueOptimizerManager,
  type FirstRevenueOptimizerDependencies,
} from "./first-revenue-optimizer-manager.js";

export interface FirstRevenueOptimizerOptions {
  configuration?: Partial<FirstRevenueOptimizerConfiguration>;
}

export type { FirstRevenueOptimizerDependencies };

/**
 * First Revenue Optimizer (PILLOW-FRO-001 / X1-14).
 * Early revenue optimization — structural signals only; never modify production pricing without validation.
 */
export class FirstRevenueOptimizer {
  private initializedAt: string | null = null;
  private readonly controller: FirstRevenueOptimizerController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: FirstRevenueOptimizerDependencies,
    options: FirstRevenueOptimizerOptions = {},
  ) {
    const config = buildFirstRevenueOptimizerConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new FirstRevenueOptimizerManager(dependencies);
    this.controller = new FirstRevenueOptimizerController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<FirstRevenueOptimizerState> {
    const doc = await this.reader.readText(FIRST_REVENUE_OPTIMIZER_SYSTEM_PATH);
    if (!doc?.includes("First Revenue Optimizer")) {
      throw new Error(
        `${FIRST_REVENUE_OPTIMIZER_SYSTEM_PATH} missing — requires X1-14 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendFroLog({
      event: "engine_initialization",
      level: "info",
      details: "X1-14 First Revenue Optimizer initialized",
    });
    return this.getState();
  }

  getState(): FirstRevenueOptimizerState {
    if (!this.initializedAt) {
      throw new Error("First Revenue Optimizer not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const revenueRecords = this.controller.getManager().getRevenueRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalRevenueRecords: revenueRecords.length,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-FRO-001",
      missionId: "X1-14",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectFirstRevenueOptimizer(
    input: ConnectFirstRevenueOptimizerInput = {},
  ): RevenueRunReport {
    return this.controller.connectFirstRevenueOptimizer(input);
  }

  optimizeFirstRevenue(input: OptimizeFirstRevenueInput = {}): RevenueRunReport {
    return this.controller.optimizeFirstRevenue(input);
  }

  monitorFirstSales(input: RevenueActionInput = {}): RevenueRunReport {
    return this.controller.monitorFirstSales(input);
  }

  analyzeEarlyRevenue(input: RevenueActionInput = {}): RevenueRunReport {
    return this.controller.analyzeEarlyRevenue(input);
  }

  analyzeProductPerformance(input: RevenueActionInput = {}): RevenueRunReport {
    return this.controller.analyzeProductPerformance(input);
  }

  analyzeCustomerPurchasing(input: RevenueActionInput = {}): RevenueRunReport {
    return this.controller.analyzeCustomerPurchasing(input);
  }

  detectRevenueBottlenecks(input: RevenueActionInput = {}): RevenueRunReport {
    return this.controller.detectRevenueBottlenecks(input);
  }

  detectUnderperformingProducts(input: RevenueActionInput = {}): RevenueRunReport {
    return this.controller.detectUnderperformingProducts(input);
  }

  optimizeProductPriorities(input: RevenueActionInput = {}): RevenueRunReport {
    return this.controller.optimizeProductPriorities(input);
  }

  optimizePricingRecommendations(input: RevenueActionInput = {}): RevenueRunReport {
    return this.controller.optimizePricingRecommendations(input);
  }

  generateEarlyRevenueRecommendations(input: RevenueActionInput = {}): RevenueRunReport {
    return this.controller.generateEarlyRevenueRecommendations(input);
  }

  getLatestReport(): RevenueRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getRevenueRecords() {
    return this.controller.getManager().getRevenueRecords();
  }

  updateConfiguration(
    overrides: Partial<FirstRevenueOptimizerConfiguration>,
  ): FirstRevenueOptimizerState {
    const next = buildFirstRevenueOptimizerConfiguration(this.bootstrap.repositoryRoot, {
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
        `First Revenue Optimizer status: ${state.status}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No first revenue optimization operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): RevenueCockpitSnapshot {
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
      totalRevenueRecords: state.health.totalRevenueRecords,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected,
      recentLogs: getFroLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createFirstRevenueOptimizer(
  bootstrap: EmpireBootstrapContext,
  dependencies: FirstRevenueOptimizerDependencies,
  options?: FirstRevenueOptimizerOptions,
): FirstRevenueOptimizer {
  return new FirstRevenueOptimizer(bootstrap, dependencies, options);
}

export function resetFirstRevenueOptimizerForTesting(): void {
  resetFroLogsForTesting();
  new FirstRevenueOptimizerManager({
    companyFactoryFramework: null,
    productPortfolioBuilder: null,
    pricingStrategyEngine: null,
    growthInitializationEngine: null,
    launchMonitoringEngine: null,
  }).resetForTesting();
}
