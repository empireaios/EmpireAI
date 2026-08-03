/** X3-06 — Supplier Scale Engine. */

import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildSupplierScaleEngineConfiguration,
  type SupplierScaleEngineConfiguration,
} from "./configuration.js";
import { appendSseLog, getSseLogs, resetSseLogsForTesting } from "./sse-logging.js";
import { SUPPLIER_SCALE_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectSupplierScaleEngineInput,
  SupplierScaleEngineState,
  SupplierScaleInput,
  SseCockpitSnapshot,
  SseRunReport,
  RunSseDiagnosticsInput,
} from "./types.js";
import { SupplierScaleController } from "./supplier-scale-controller.js";
import {
  SupplierScaleManager,
  type SupplierScaleEngineDependencies,
} from "./supplier-scale-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface SupplierScaleEngineOptions {
  configuration?: Partial<SupplierScaleEngineConfiguration>;
}

export type { SupplierScaleEngineDependencies };

/**
 * Supplier Scale Engine (PILLOW-SSE-001 / X3-06).
 * Supplier capacity scaling — expand only with validated structural supplier signals.
 */
export class SupplierScaleEngine {
  private initializedAt: string | null = null;
  private readonly controller: SupplierScaleController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: SupplierScaleEngineDependencies,
    options: SupplierScaleEngineOptions = {},
  ) {
    const config = buildSupplierScaleEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new SupplierScaleManager(dependencies);
    this.controller = new SupplierScaleController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<SupplierScaleEngineState> {
    const doc = await this.reader.readText(SUPPLIER_SCALE_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Supplier Scale Engine")) {
      throw new Error(
        `${SUPPLIER_SCALE_ENGINE_SYSTEM_PATH} missing — Supplier Scale Engine requires X3-06 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendSseLog({
      event: "SUPPLIER_SCALE_ENGINE_ready",
      level: "info",
      details:
        "X3-06 Supplier Scale Engine initialized — never recommend supplier expansion without validated capacity",
    });
    return this.getState();
  }

  getState(): SupplierScaleEngineState {
    if (!this.initializedAt) {
      throw new Error("Supplier Scale Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const plans = this.controller.getManager().getScalingRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalScalingRecords: plans.length,
      bottleneckCount: this.controller.getManager().bottleneckCount(),
      averageReadiness: this.controller.getManager().averageReadiness(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-SSE-001",
      missionId: "X3-06",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectSupplierScaleEngine(
    input: ConnectSupplierScaleEngineInput = {},
  ): SseRunReport {
    return this.controller.connectSupplierScaleEngine(input);
  }

  monitorSupplierCapacity(input: SupplierScaleInput = {}): SseRunReport {
    return this.controller.monitorSupplierCapacity(input);
  }

  monitorSupplierPerformance(input: SupplierScaleInput = {}): SseRunReport {
    return this.controller.monitorSupplierPerformance(input);
  }

  monitorLeadTimes(input: SupplierScaleInput = {}): SseRunReport {
    return this.controller.monitorLeadTimes(input);
  }

  monitorInventory(input: SupplierScaleInput = {}): SseRunReport {
    return this.controller.monitorInventory(input);
  }

  monitorFulfilment(input: SupplierScaleInput = {}): SseRunReport {
    return this.controller.monitorFulfilment(input);
  }

  monitorReliability(input: SupplierScaleInput = {}): SseRunReport {
    return this.controller.monitorReliability(input);
  }

  detectSupplierBottlenecks(input: SupplierScaleInput = {}): SseRunReport {
    return this.controller.detectSupplierBottlenecks(input);
  }

  detectScalingRisks(input: SupplierScaleInput = {}): SseRunReport {
    return this.controller.detectScalingRisks(input);
  }

  recommendSupplierExpansion(input: SupplierScaleInput = {}): SseRunReport {
    return this.controller.recommendSupplierExpansion(input);
  }

  runDiagnostics(input: RunSseDiagnosticsInput = {}): SseRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): SseRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getScalingRecords() {
    return this.controller.getManager().getScalingRecords();
  }

  getRecommendations() {
    return this.controller.getManager().getRecommendations();
  }

  updateConfiguration(
    overrides: Partial<SupplierScaleEngineConfiguration>,
  ): SupplierScaleEngineState {
    const next = buildSupplierScaleEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Scaling records: ${state.health.totalScalingRecords}`,
        `Bottlenecks: ${state.health.bottleneckCount} · Avg readiness: ${state.health.averageReadiness}%`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No supplier scale operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): SseCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalScalingRecords: state.health.totalScalingRecords,
      bottleneckCount: state.health.bottleneckCount,
      averageReadiness: state.health.averageReadiness,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected: Object.values(record?.dependencyPresence ?? {}).filter(Boolean)
        .length,
      recentLogs: getSseLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createSupplierScaleEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: SupplierScaleEngineDependencies,
  options?: SupplierScaleEngineOptions,
): SupplierScaleEngine {
  return new SupplierScaleEngine(bootstrap, dependencies, options);
}

export function resetSupplierScaleEngineForTesting(): void {
  resetSseLogsForTesting();
  new SupplierScaleManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
