/** X3-18 — Scale Simulation Engine. */

import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildScaleSimulationEngineConfiguration,
  type ScaleSimulationEngineConfiguration,
} from "./configuration.js";
import { appendSsiLog, getSsiLogs, resetSsiLogsForTesting } from "./ssi-logging.js";
import { SCALE_SIMULATION_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  ScaleSimulationInput,
  ScaleSimulationEngineState,
  SsiCockpitSnapshot,
  SsiRunReport,
  ConnectScaleSimulationEngineInput,
  RunSsiDiagnosticsInput,
} from "./types.js";
import { ScaleSimulationController } from "./scale-simulation-controller.js";
import {
  ScaleSimulationManager,
  type ScaleSimulationEngineDependencies,
} from "./scale-simulation-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface ScaleSimulationEngineOptions {
  configuration?: Partial<ScaleSimulationEngineConfiguration>;
}

export type { ScaleSimulationEngineDependencies };

/**
 * Scale Simulation Engine (PILLOW-SSI-001 / X3-18).
 * Predictive scaling simulation — structural signals only; never execute simulated actions against production.
 */
export class ScaleSimulationEngine {
  private initializedAt: string | null = null;
  private readonly controller: ScaleSimulationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: ScaleSimulationEngineDependencies,
    options: ScaleSimulationEngineOptions = {},
  ) {
    const config = buildScaleSimulationEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new ScaleSimulationManager(dependencies);
    this.controller = new ScaleSimulationController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ScaleSimulationEngineState> {
    const doc = await this.reader.readText(SCALE_SIMULATION_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Scale Simulation Engine")) {
      throw new Error(
        `${SCALE_SIMULATION_ENGINE_SYSTEM_PATH} missing — Scale Simulation Engine requires X3-18 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendSsiLog({
      event: "SCALE_SIMULATION_ENGINE_ready",
      level: "info",
      details:
        "X3-18 Scale Simulation Engine initialized — never execute simulated actions against production",
    });
    return this.getState();
  }

  getState(): ScaleSimulationEngineState {
    if (!this.initializedAt) {
      throw new Error("Scale Simulation Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const records = this.controller.getManager().getSimulationRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalSimulationRecords: records.length,
      highScoreCount: this.controller.getManager().highScoreCount(config),
      averageSimulationScore: this.controller.getManager().averageSimulationScore(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-SSI-001",
      missionId: "X3-18",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectScaleSimulationEngine(
    input: ConnectScaleSimulationEngineInput = {},
  ): SsiRunReport {
    return this.controller.connectScaleSimulationEngine(input);
  }

  simulateScalingScenarios(input: ScaleSimulationInput = {}): SsiRunReport {
    return this.controller.simulateScalingScenarios(input);
  }

  simulateRevenueOutcomes(input: ScaleSimulationInput = {}): SsiRunReport {
    return this.controller.simulateRevenueOutcomes(input);
  }

  simulateProfitOutcomes(input: ScaleSimulationInput = {}): SsiRunReport {
    return this.controller.simulateProfitOutcomes(input);
  }

  simulateOperationalCapacity(input: ScaleSimulationInput = {}): SsiRunReport {
    return this.controller.simulateOperationalCapacity(input);
  }

  simulateSupplierCapacity(input: ScaleSimulationInput = {}): SsiRunReport {
    return this.controller.simulateSupplierCapacity(input);
  }

  simulateWorkforceUtilization(input: ScaleSimulationInput = {}): SsiRunReport {
    return this.controller.simulateWorkforceUtilization(input);
  }

  simulateFinancialImpact(input: ScaleSimulationInput = {}): SsiRunReport {
    return this.controller.simulateFinancialImpact(input);
  }

  simulateScalingRisks(input: ScaleSimulationInput = {}): SsiRunReport {
    return this.controller.simulateScalingRisks(input);
  }

  compareScalingScenarios(input: ScaleSimulationInput = {}): SsiRunReport {
    return this.controller.compareScalingScenarios(input);
  }

  rankSimulationOutcomes(input: ScaleSimulationInput = {}): SsiRunReport {
    return this.controller.rankSimulationOutcomes(input);
  }

  recommendFromSimulation(input: ScaleSimulationInput = {}): SsiRunReport {
    return this.controller.recommendFromSimulation(input);
  }

  runDiagnostics(input: RunSsiDiagnosticsInput = {}): SsiRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): SsiRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getSimulationRecords() {
    return this.controller.getManager().getSimulationRecords();
  }

  getRecommendations() {
    return this.controller.getManager().getRecommendations();
  }

  updateConfiguration(
    overrides: Partial<ScaleSimulationEngineConfiguration>,
  ): ScaleSimulationEngineState {
    const next = buildScaleSimulationEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Simulation records: ${state.health.totalSimulationRecords}`,
        `High score: ${state.health.highScoreCount} · Avg score: ${state.health.averageSimulationScore}%`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No scale simulation engine operations yet",
        "Never execute simulated actions against production",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): SsiCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalSimulationRecords: state.health.totalSimulationRecords,
      highScoreCount: state.health.highScoreCount,
      averageSimulationScore: state.health.averageSimulationScore,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected: Object.values(record?.dependencyPresence ?? {}).filter(Boolean)
        .length,
      recentLogs: getSsiLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createScaleSimulationEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: ScaleSimulationEngineDependencies,
  options?: ScaleSimulationEngineOptions,
): ScaleSimulationEngine {
  return new ScaleSimulationEngine(bootstrap, dependencies, options);
}

export function resetScaleSimulationEngineForTesting(): void {
  resetSsiLogsForTesting();
  new ScaleSimulationManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
