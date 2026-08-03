/** X3-16 — Revenue Acceleration Engine. */

import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildRevenueAccelerationEngineConfiguration,
  type RevenueAccelerationEngineConfiguration,
} from "./configuration.js";
import { appendRaeLog, getRaeLogs, resetRaeLogsForTesting } from "./rae-logging.js";
import { REVENUE_ACCELERATION_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  RevenueAccelerationInput,
  RevenueAccelerationEngineState,
  RaeCockpitSnapshot,
  RaeRunReport,
  ConnectRevenueAccelerationEngineInput,
  RunRaeDiagnosticsInput,
} from "./types.js";
import { RevenueAccelerationController } from "./revenue-acceleration-controller.js";
import {
  RevenueAccelerationManager,
  type RevenueAccelerationEngineDependencies,
} from "./revenue-acceleration-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface RevenueAccelerationEngineOptions {
  configuration?: Partial<RevenueAccelerationEngineConfiguration>;
}

export type { RevenueAccelerationEngineDependencies };

/**
 * Revenue Acceleration Engine (PILLOW-RAE-001 / X3-16).
 * Intelligent revenue acceleration — structural signals only; never recommend without validated supporting data.
 */
export class RevenueAccelerationEngine {
  private initializedAt: string | null = null;
  private readonly controller: RevenueAccelerationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: RevenueAccelerationEngineDependencies,
    options: RevenueAccelerationEngineOptions = {},
  ) {
    const config = buildRevenueAccelerationEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new RevenueAccelerationManager(dependencies);
    this.controller = new RevenueAccelerationController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<RevenueAccelerationEngineState> {
    const doc = await this.reader.readText(REVENUE_ACCELERATION_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Revenue Acceleration Engine")) {
      throw new Error(
        `${REVENUE_ACCELERATION_ENGINE_SYSTEM_PATH} missing — Revenue Acceleration Engine requires X3-16 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendRaeLog({
      event: "REVENUE_ACCELERATION_ENGINE_ready",
      level: "info",
      details:
        "X3-16 Revenue Acceleration Engine initialized — never recommend revenue actions without validated supporting data",
    });
    return this.getState();
  }

  getState(): RevenueAccelerationEngineState {
    if (!this.initializedAt) {
      throw new Error("Revenue Acceleration Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const records = this.controller.getManager().getRevenueAccelerationRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalRevenueAccelerationRecords: records.length,
      highOpportunityCount: this.controller.getManager().highOpportunityCount(config),
      averageOpportunityScore: this.controller.getManager().averageOpportunityScore(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-RAE-001",
      missionId: "X3-16",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectRevenueAccelerationEngine(
    input: ConnectRevenueAccelerationEngineInput = {},
  ): RaeRunReport {
    return this.controller.connectRevenueAccelerationEngine(input);
  }

  monitorRevenueGrowth(input: RevenueAccelerationInput = {}): RaeRunReport {
    return this.controller.monitorRevenueGrowth(input);
  }

  monitorRevenueTrends(input: RevenueAccelerationInput = {}): RaeRunReport {
    return this.controller.monitorRevenueTrends(input);
  }

  monitorProductRevenue(input: RevenueAccelerationInput = {}): RaeRunReport {
    return this.controller.monitorProductRevenue(input);
  }

  monitorChannelRevenue(input: RevenueAccelerationInput = {}): RaeRunReport {
    return this.controller.monitorChannelRevenue(input);
  }

  monitorCustomerRevenue(input: RevenueAccelerationInput = {}): RaeRunReport {
    return this.controller.monitorCustomerRevenue(input);
  }

  identifyRevenueAccelerationOpportunities(
    input: RevenueAccelerationInput = {},
  ): RaeRunReport {
    return this.controller.identifyRevenueAccelerationOpportunities(input);
  }

  identifyRevenueBottlenecks(input: RevenueAccelerationInput = {}): RaeRunReport {
    return this.controller.identifyRevenueBottlenecks(input);
  }

  optimizeRevenueStrategies(input: RevenueAccelerationInput = {}): RaeRunReport {
    return this.controller.optimizeRevenueStrategies(input);
  }

  rankRevenueOpportunities(input: RevenueAccelerationInput = {}): RaeRunReport {
    return this.controller.rankRevenueOpportunities(input);
  }

  recommendRevenueAcceleration(input: RevenueAccelerationInput = {}): RaeRunReport {
    return this.controller.recommendRevenueAcceleration(input);
  }

  runDiagnostics(input: RunRaeDiagnosticsInput = {}): RaeRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): RaeRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getRevenueAccelerationRecords() {
    return this.controller.getManager().getRevenueAccelerationRecords();
  }

  getRecommendations() {
    return this.controller.getManager().getRecommendations();
  }

  updateConfiguration(
    overrides: Partial<RevenueAccelerationEngineConfiguration>,
  ): RevenueAccelerationEngineState {
    const next = buildRevenueAccelerationEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Revenue acceleration records: ${state.health.totalRevenueAccelerationRecords}`,
        `High opportunity: ${state.health.highOpportunityCount} · Avg opportunity: ${state.health.averageOpportunityScore}%`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No revenue acceleration engine operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): RaeCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalRevenueAccelerationRecords: state.health.totalRevenueAccelerationRecords,
      highOpportunityCount: state.health.highOpportunityCount,
      averageOpportunityScore: state.health.averageOpportunityScore,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected: Object.values(record?.dependencyPresence ?? {}).filter(Boolean)
        .length,
      recentLogs: getRaeLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createRevenueAccelerationEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: RevenueAccelerationEngineDependencies,
  options?: RevenueAccelerationEngineOptions,
): RevenueAccelerationEngine {
  return new RevenueAccelerationEngine(bootstrap, dependencies, options);
}

export function resetRevenueAccelerationEngineForTesting(): void {
  resetRaeLogsForTesting();
  new RevenueAccelerationManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
