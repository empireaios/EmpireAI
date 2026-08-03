/** X3-04 — Capacity Planning Engine. */

import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildCapacityPlanningEngineConfiguration,
  type CapacityPlanningEngineConfiguration,
} from "./configuration.js";
import { appendCpeLog, getCpeLogs, resetCpeLogsForTesting } from "./cpe-logging.js";
import { CAPACITY_PLANNING_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  CapacityPlanningInput,
  CapacityPlanningEngineState,
  ConnectCapacityPlanningEngineInput,
  CpeCockpitSnapshot,
  CpeRunReport,
  RunCpeDiagnosticsInput,
} from "./types.js";
import { CapacityPlanningController } from "./capacity-planning-controller.js";
import {
  CapacityPlanningManager,
  type CapacityPlanningEngineDependencies,
} from "./capacity-planning-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface CapacityPlanningEngineOptions {
  configuration?: Partial<CapacityPlanningEngineConfiguration>;
}

export type { CapacityPlanningEngineDependencies };

/**
 * Capacity Planning Engine (PILLOW-CPE-001 / X3-04).
 * Operational capacity planning — scale without bottlenecks via structural capacity signals.
 */
export class CapacityPlanningEngine {
  private initializedAt: string | null = null;
  private readonly controller: CapacityPlanningController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: CapacityPlanningEngineDependencies,
    options: CapacityPlanningEngineOptions = {},
  ) {
    const config = buildCapacityPlanningEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new CapacityPlanningManager(dependencies);
    this.controller = new CapacityPlanningController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<CapacityPlanningEngineState> {
    const doc = await this.reader.readText(CAPACITY_PLANNING_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Capacity Planning Engine")) {
      throw new Error(
        `${CAPACITY_PLANNING_ENGINE_SYSTEM_PATH} missing — Capacity Planning Engine requires X3-04 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendCpeLog({
      event: "CAPACITY_PLANNING_ENGINE_ready",
      level: "info",
      details:
        "X3-04 Capacity Planning Engine initialized — never recommend beyond validated limits",
    });
    return this.getState();
  }

  getState(): CapacityPlanningEngineState {
    if (!this.initializedAt) {
      throw new Error("Capacity Planning Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const plans = this.controller.getManager().getPlanningRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalPlanningRecords: plans.length,
      bottleneckCount: this.controller.getManager().bottleneckCount(),
      averageUtilization: this.controller.getManager().averageUtilization(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-CPE-001",
      missionId: "X3-04",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectCapacityPlanningEngine(
    input: ConnectCapacityPlanningEngineInput = {},
  ): CpeRunReport {
    return this.controller.connectCapacityPlanningEngine(input);
  }

  monitorOperationalCapacity(input: CapacityPlanningInput = {}): CpeRunReport {
    return this.controller.monitorOperationalCapacity(input);
  }

  monitorInfrastructureCapacity(input: CapacityPlanningInput = {}): CpeRunReport {
    return this.controller.monitorInfrastructureCapacity(input);
  }

  monitorSupplierCapacity(input: CapacityPlanningInput = {}): CpeRunReport {
    return this.controller.monitorSupplierCapacity(input);
  }

  monitorFulfilmentCapacity(input: CapacityPlanningInput = {}): CpeRunReport {
    return this.controller.monitorFulfilmentCapacity(input);
  }

  monitorInventoryCapacity(input: CapacityPlanningInput = {}): CpeRunReport {
    return this.controller.monitorInventoryCapacity(input);
  }

  monitorWorkforceCapacity(input: CapacityPlanningInput = {}): CpeRunReport {
    return this.controller.monitorWorkforceCapacity(input);
  }

  forecastCapacity(input: CapacityPlanningInput = {}): CpeRunReport {
    return this.controller.forecastCapacity(input);
  }

  detectBottlenecks(input: CapacityPlanningInput = {}): CpeRunReport {
    return this.controller.detectBottlenecks(input);
  }

  recommendExpansion(input: CapacityPlanningInput = {}): CpeRunReport {
    return this.controller.recommendExpansion(input);
  }

  runDiagnostics(input: RunCpeDiagnosticsInput = {}): CpeRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): CpeRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getPlanningRecords() {
    return this.controller.getManager().getPlanningRecords();
  }

  getRecommendations() {
    return this.controller.getManager().getRecommendations();
  }

  updateConfiguration(
    overrides: Partial<CapacityPlanningEngineConfiguration>,
  ): CapacityPlanningEngineState {
    const next = buildCapacityPlanningEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Planning records: ${state.health.totalPlanningRecords}`,
        `Bottlenecks: ${state.health.bottleneckCount} · Avg util: ${state.health.averageUtilization}%`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No capacity planning operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): CpeCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalPlanningRecords: state.health.totalPlanningRecords,
      bottleneckCount: state.health.bottleneckCount,
      averageUtilization: state.health.averageUtilization,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected: Object.values(record?.dependencyPresence ?? {}).filter(Boolean)
        .length,
      recentLogs: getCpeLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createCapacityPlanningEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: CapacityPlanningEngineDependencies,
  options?: CapacityPlanningEngineOptions,
): CapacityPlanningEngine {
  return new CapacityPlanningEngine(bootstrap, dependencies, options);
}

export function resetCapacityPlanningEngineForTesting(): void {
  resetCpeLogsForTesting();
  new CapacityPlanningManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
