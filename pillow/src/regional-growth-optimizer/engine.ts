/** X4-14 — Regional Growth Optimizer Engine. */

import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildRegionalGrowthOptimizerConfiguration,
  type RegionalGrowthOptimizerConfiguration,
} from "./configuration.js";
import { appendRgoLog, getRgoLogs, resetRgoLogsForTesting } from "./rgo-logging.js";
import { REGIONAL_GROWTH_OPTIMIZER_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectRegionalGrowthOptimizerInput,
  RegionalGrowthOptimizerState,
  RegionalOptimizationInput,
  RgoCockpitSnapshot,
  RgoRunReport,
  RunRgoDiagnosticsInput,
} from "./types.js";
import { RegionalGrowthController } from "./regional-growth-controller.js";
import {
  RegionalGrowthManager,
  type RegionalGrowthOptimizerDependencies,
} from "./regional-growth-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface RegionalGrowthOptimizerOptions {
  configuration?: Partial<RegionalGrowthOptimizerConfiguration>;
}

export type { RegionalGrowthOptimizerDependencies };

/**
 * Regional Growth Optimizer (PILLOW-RGO-001 / X4-14).
 * Continuous regional performance optimization — structural signals only;
 * never optimize using unvalidated regional intelligence.
 */
export class RegionalGrowthOptimizerEngine {
  private initializedAt: string | null = null;
  private readonly controller: RegionalGrowthController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: RegionalGrowthOptimizerDependencies,
    options: RegionalGrowthOptimizerOptions = {},
  ) {
    const config = buildRegionalGrowthOptimizerConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new RegionalGrowthManager(dependencies);
    this.controller = new RegionalGrowthController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<RegionalGrowthOptimizerState> {
    const doc = await this.reader.readText(REGIONAL_GROWTH_OPTIMIZER_SYSTEM_PATH);
    if (!doc?.includes("Regional Growth Optimizer")) {
      throw new Error(
        `${REGIONAL_GROWTH_OPTIMIZER_SYSTEM_PATH} missing — Regional Growth Optimizer requires X4-14 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendRgoLog({
      event: "REGIONAL_GROWTH_OPTIMIZER_ready",
      level: "info",
      details:
        "X4-14 Regional Growth Optimizer initialized — structural signals only; never optimize using unvalidated regional intelligence",
    });
    return this.getState();
  }

  getState(): RegionalGrowthOptimizerState {
    if (!this.initializedAt) {
      throw new Error("Regional Growth Optimizer not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const records = this.controller.getManager().getOptimizationRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalOptimizationRecords: records.length,
      opportunityCount: this.controller.getManager().opportunityCount(),
      bottleneckCount: this.controller.getManager().bottleneckCount(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-RGO-001",
      missionId: "X4-14",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectRegionalGrowthOptimizer(input: ConnectRegionalGrowthOptimizerInput = {}): RgoRunReport {
    return this.controller.connectRegionalGrowthOptimizer(input);
  }

  monitorRegionalBusinessPerformance(input: RegionalOptimizationInput = {}): RgoRunReport {
    return this.controller.monitorRegionalBusinessPerformance(input);
  }

  monitorRegionalRevenueGrowth(input: RegionalOptimizationInput = {}): RgoRunReport {
    return this.controller.monitorRegionalRevenueGrowth(input);
  }

  monitorRegionalProfitability(input: RegionalOptimizationInput = {}): RgoRunReport {
    return this.controller.monitorRegionalProfitability(input);
  }

  monitorRegionalCustomerGrowth(input: RegionalOptimizationInput = {}): RgoRunReport {
    return this.controller.monitorRegionalCustomerGrowth(input);
  }

  monitorRegionalOperationalEfficiency(input: RegionalOptimizationInput = {}): RgoRunReport {
    return this.controller.monitorRegionalOperationalEfficiency(input);
  }

  detectRegionalGrowthOpportunities(input: RegionalOptimizationInput = {}): RgoRunReport {
    return this.controller.detectRegionalGrowthOpportunities(input);
  }

  detectRegionalPerformanceBottlenecks(input: RegionalOptimizationInput = {}): RgoRunReport {
    return this.controller.detectRegionalPerformanceBottlenecks(input);
  }

  rankRegionalOptimizationPriorities(input: RegionalOptimizationInput = {}): RgoRunReport {
    return this.controller.rankRegionalOptimizationPriorities(input);
  }

  recommendRegionalGrowth(input: RegionalOptimizationInput = {}): RgoRunReport {
    return this.controller.recommendRegionalGrowth(input);
  }

  runDiagnostics(input: RunRgoDiagnosticsInput = {}): RgoRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): RgoRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getOptimizationRecords() {
    return this.controller.getManager().getOptimizationRecords();
  }

  getRecommendations() {
    return this.controller.getManager().getRecommendations();
  }

  updateConfiguration(
    overrides: Partial<RegionalGrowthOptimizerConfiguration>,
  ): RegionalGrowthOptimizerState {
    const next = buildRegionalGrowthOptimizerConfiguration(this.bootstrap.repositoryRoot, {
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
        `Bottlenecks: ${state.health.bottleneckCount}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No regional growth optimization operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): RgoCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalOptimizationRecords: state.health.totalOptimizationRecords,
      opportunityCount: state.health.opportunityCount,
      bottleneckCount: state.health.bottleneckCount,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected: Object.values(record?.dependencyPresence ?? {}).filter(Boolean)
        .length,
      recentLogs: getRgoLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createRegionalGrowthOptimizerEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: RegionalGrowthOptimizerDependencies,
  options?: RegionalGrowthOptimizerOptions,
): RegionalGrowthOptimizerEngine {
  return new RegionalGrowthOptimizerEngine(bootstrap, dependencies, options);
}

export function resetRegionalGrowthOptimizerForTesting(): void {
  resetRgoLogsForTesting();
  new RegionalGrowthManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
