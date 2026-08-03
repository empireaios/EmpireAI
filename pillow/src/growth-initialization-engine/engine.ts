import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildGrowthInitializationEngineConfiguration,
  type GrowthInitializationEngineConfiguration,
} from "./configuration.js";
import { appendGieLog, getGieLogs, resetGieLogsForTesting } from "./gie-logging.js";
import { GROWTH_INITIALIZATION_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectGrowthInitializationEngineInput,
  GrowthActionInput,
  GrowthCockpitSnapshot,
  GrowthInitializationEngineState,
  GrowthRunReport,
  InitializeGrowthPlanInput,
} from "./types.js";
import { GrowthInitializationController } from "./growth-initialization-controller.js";
import {
  GrowthInitializationManager,
  type GrowthInitializationEngineDependencies,
} from "./growth-initialization-manager.js";

export interface GrowthInitializationEngineOptions {
  configuration?: Partial<GrowthInitializationEngineConfiguration>;
}

export type { GrowthInitializationEngineDependencies };

/**
 * Growth Initialization Engine (PILLOW-GIE-001 / X1-12).
 * Initial growth plan — structural signals only; never modify operational config without validation.
 */
export class GrowthInitializationEngine {
  private initializedAt: string | null = null;
  private readonly controller: GrowthInitializationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: GrowthInitializationEngineDependencies,
    options: GrowthInitializationEngineOptions = {},
  ) {
    const config = buildGrowthInitializationEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new GrowthInitializationManager(dependencies);
    this.controller = new GrowthInitializationController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<GrowthInitializationEngineState> {
    const doc = await this.reader.readText(GROWTH_INITIALIZATION_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Growth Initialization Engine")) {
      throw new Error(
        `${GROWTH_INITIALIZATION_ENGINE_SYSTEM_PATH} missing — requires X1-12 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendGieLog({
      event: "engine_initialization",
      level: "info",
      details: "X1-12 Growth Initialization Engine initialized",
    });
    return this.getState();
  }

  getState(): GrowthInitializationEngineState {
    if (!this.initializedAt) {
      throw new Error("Growth Initialization Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const growthRecords = this.controller.getManager().getGrowthRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalGrowthRecords: growthRecords.length,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-GIE-001",
      missionId: "X1-12",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectGrowthInitializationEngine(
    input: ConnectGrowthInitializationEngineInput = {},
  ): GrowthRunReport {
    return this.controller.connectGrowthInitializationEngine(input);
  }

  initializeGrowthPlan(input: InitializeGrowthPlanInput = {}): GrowthRunReport {
    return this.controller.initializeGrowthPlan(input);
  }

  generateGrowthStrategy(input: GrowthActionInput = {}): GrowthRunReport {
    return this.controller.generateGrowthStrategy(input);
  }

  generateLaunchMarketingRecommendations(input: GrowthActionInput = {}): GrowthRunReport {
    return this.controller.generateLaunchMarketingRecommendations(input);
  }

  generateSalesTargets(input: GrowthActionInput = {}): GrowthRunReport {
    return this.controller.generateSalesTargets(input);
  }

  generateOperationalPriorities(input: GrowthActionInput = {}): GrowthRunReport {
    return this.controller.generateOperationalPriorities(input);
  }

  generateRevenueMilestones(input: GrowthActionInput = {}): GrowthRunReport {
    return this.controller.generateRevenueMilestones(input);
  }

  generateCustomerAcquisitionPlan(input: GrowthActionInput = {}): GrowthRunReport {
    return this.controller.generateCustomerAcquisitionPlan(input);
  }

  generatePerformanceBaselines(input: GrowthActionInput = {}): GrowthRunReport {
    return this.controller.generatePerformanceBaselines(input);
  }

  trackEarlyPerformance(input: GrowthActionInput = {}): GrowthRunReport {
    return this.controller.trackEarlyPerformance(input);
  }

  recommendImmediateOptimizations(input: GrowthActionInput = {}): GrowthRunReport {
    return this.controller.recommendImmediateOptimizations(input);
  }

  getLatestReport(): GrowthRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getGrowthRecords() {
    return this.controller.getManager().getGrowthRecords();
  }

  updateConfiguration(
    overrides: Partial<GrowthInitializationEngineConfiguration>,
  ): GrowthInitializationEngineState {
    const next = buildGrowthInitializationEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Growth Initialization Engine status: ${state.status}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No growth initialization operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): GrowthCockpitSnapshot {
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
      totalGrowthRecords: state.health.totalGrowthRecords,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected,
      recentLogs: getGieLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createGrowthInitializationEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: GrowthInitializationEngineDependencies,
  options?: GrowthInitializationEngineOptions,
): GrowthInitializationEngine {
  return new GrowthInitializationEngine(bootstrap, dependencies, options);
}

export function resetGrowthInitializationEngineForTesting(): void {
  resetGieLogsForTesting();
  new GrowthInitializationManager({
    companyFactoryFramework: null,
    productPortfolioBuilder: null,
    pricingStrategyEngine: null,
    businessLaunchOrchestrator: null,
  }).resetForTesting();
}
