/** X3-15 — Autonomous Growth Optimizer Engine. */

import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildAutonomousGrowthOptimizerConfiguration,
  type AutonomousGrowthOptimizerConfiguration,
} from "./configuration.js";
import { appendAgoLog, getAgoLogs, resetAgoLogsForTesting } from "./ago-logging.js";
import { AUTONOMOUS_GROWTH_OPTIMIZER_SYSTEM_PATH } from "./paths.js";
import type {
  GrowthOptimizationInput,
  AutonomousGrowthOptimizerState,
  AgoCockpitSnapshot,
  AgoRunReport,
  ConnectAutonomousGrowthOptimizerInput,
  RunAgoDiagnosticsInput,
} from "./types.js";
import { AutonomousGrowthOptimizerController } from "./autonomous-growth-optimizer-controller.js";
import {
  AutonomousGrowthOptimizerManager,
  type AutonomousGrowthOptimizerDependencies,
} from "./autonomous-growth-optimizer-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface AutonomousGrowthOptimizerOptions {
  configuration?: Partial<AutonomousGrowthOptimizerConfiguration>;
}

export type { AutonomousGrowthOptimizerDependencies };

/**
 * Autonomous Growth Optimizer (PILLOW-AGO-001 / X3-15).
 * Continuous autonomous growth optimization — structural signals only; never optimize beyond validated operational limits.
 */
export class AutonomousGrowthOptimizerEngine {
  private initializedAt: string | null = null;
  private readonly controller: AutonomousGrowthOptimizerController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: AutonomousGrowthOptimizerDependencies,
    options: AutonomousGrowthOptimizerOptions = {},
  ) {
    const config = buildAutonomousGrowthOptimizerConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new AutonomousGrowthOptimizerManager(dependencies);
    this.controller = new AutonomousGrowthOptimizerController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<AutonomousGrowthOptimizerState> {
    const doc = await this.reader.readText(AUTONOMOUS_GROWTH_OPTIMIZER_SYSTEM_PATH);
    if (!doc?.includes("Autonomous Growth Optimizer")) {
      throw new Error(
        `${AUTONOMOUS_GROWTH_OPTIMIZER_SYSTEM_PATH} missing — Autonomous Growth Optimizer requires X3-15 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendAgoLog({
      event: "AUTONOMOUS_GROWTH_OPTIMIZER_ready",
      level: "info",
      details:
        "X3-15 Autonomous Growth Optimizer initialized — never optimize growth beyond validated operational limits",
    });
    return this.getState();
  }

  getState(): AutonomousGrowthOptimizerState {
    if (!this.initializedAt) {
      throw new Error("Autonomous Growth Optimizer not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const records = this.controller.getManager().getGrowthOptimizationRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalGrowthOptimizationRecords: records.length,
      highPriorityCount: this.controller.getManager().highPriorityCount(),
      averageOpportunityScore: this.controller.getManager().averageOpportunityScore(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-AGO-001",
      missionId: "X3-15",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectAutonomousGrowthOptimizer(
    input: ConnectAutonomousGrowthOptimizerInput = {},
  ): AgoRunReport {
    return this.controller.connectAutonomousGrowthOptimizer(input);
  }

  monitorEnterpriseGrowth(input: GrowthOptimizationInput = {}): AgoRunReport {
    return this.controller.monitorEnterpriseGrowth(input);
  }

  monitorRevenueGrowth(input: GrowthOptimizationInput = {}): AgoRunReport {
    return this.controller.monitorRevenueGrowth(input);
  }

  monitorProfitGrowth(input: GrowthOptimizationInput = {}): AgoRunReport {
    return this.controller.monitorProfitGrowth(input);
  }

  monitorCustomerGrowth(input: GrowthOptimizationInput = {}): AgoRunReport {
    return this.controller.monitorCustomerGrowth(input);
  }

  monitorOperationalGrowth(input: GrowthOptimizationInput = {}): AgoRunReport {
    return this.controller.monitorOperationalGrowth(input);
  }

  identifyGrowthOpportunities(input: GrowthOptimizationInput = {}): AgoRunReport {
    return this.controller.identifyGrowthOpportunities(input);
  }

  identifyGrowthConstraints(input: GrowthOptimizationInput = {}): AgoRunReport {
    return this.controller.identifyGrowthConstraints(input);
  }

  optimizeGrowthStrategies(input: GrowthOptimizationInput = {}): AgoRunReport {
    return this.controller.optimizeGrowthStrategies(input);
  }

  rankGrowthPriorities(input: GrowthOptimizationInput = {}): AgoRunReport {
    return this.controller.rankGrowthPriorities(input);
  }

  recommendAutonomousGrowth(input: GrowthOptimizationInput = {}): AgoRunReport {
    return this.controller.recommendAutonomousGrowth(input);
  }

  runDiagnostics(input: RunAgoDiagnosticsInput = {}): AgoRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): AgoRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getGrowthOptimizationRecords() {
    return this.controller.getManager().getGrowthOptimizationRecords();
  }

  getRecommendations() {
    return this.controller.getManager().getRecommendations();
  }

  updateConfiguration(
    overrides: Partial<AutonomousGrowthOptimizerConfiguration>,
  ): AutonomousGrowthOptimizerState {
    const next = buildAutonomousGrowthOptimizerConfiguration(this.bootstrap.repositoryRoot, {
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
        `Growth optimization records: ${state.health.totalGrowthOptimizationRecords}`,
        `High priority: ${state.health.highPriorityCount} · Avg opportunity: ${state.health.averageOpportunityScore}%`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No autonomous growth optimizer operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): AgoCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalGrowthOptimizationRecords: state.health.totalGrowthOptimizationRecords,
      highPriorityCount: state.health.highPriorityCount,
      averageOpportunityScore: state.health.averageOpportunityScore,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected: Object.values(record?.dependencyPresence ?? {}).filter(Boolean)
        .length,
      recentLogs: getAgoLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createAutonomousGrowthOptimizerEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: AutonomousGrowthOptimizerDependencies,
  options?: AutonomousGrowthOptimizerOptions,
): AutonomousGrowthOptimizerEngine {
  return new AutonomousGrowthOptimizerEngine(bootstrap, dependencies, options);
}

export function resetAutonomousGrowthOptimizerForTesting(): void {
  resetAgoLogsForTesting();
  new AutonomousGrowthOptimizerManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
