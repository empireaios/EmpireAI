import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { FulfilmentOrchestrator } from "../fulfilment-orchestrator/engine.js";
import type { ShipmentTrackingEngine } from "../shipment-tracking-engine/engine.js";
import type { LogisticsOptimizationEngine } from "../logistics-optimization/engine.js";
import {
  buildFulfilmentSlaMonitorConfiguration,
  type FulfilmentSlaMonitorConfiguration,
} from "./configuration.js";
import { appendFsmLog, getFsmLogs, resetFsmLogsForTesting } from "./fsm-logging.js";
import { FULFILMENT_SLA_MONITOR_SYSTEM_PATH } from "./paths.js";
import type {
  FulfilmentSlaMonitorState,
  MonitorFulfilmentSlaInput,
  SlaCockpitSnapshot,
  SlaReport,
} from "./types.js";
import { FulfilmentSlaMonitorController } from "./fulfilment-sla-monitor-controller.js";
import { FulfilmentSlaMonitorManager } from "./fulfilment-sla-monitor-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface FulfilmentSlaMonitorOptions {
  configuration?: Partial<FulfilmentSlaMonitorConfiguration>;
}

/**
 * Fulfilment SLA Monitor (PILLOW-FSM-001 / R2-18).
 * Continuous SLA monitoring — consumes R2-10, R2-12, R2-17.
 */
export class FulfilmentSlaMonitorEngine {
  private initializedAt: string | null = null;
  private readonly controller: FulfilmentSlaMonitorController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    fulfilmentOrchestrator: FulfilmentOrchestrator,
    shipmentTracking: ShipmentTrackingEngine,
    logisticsOptimization: LogisticsOptimizationEngine,
    options: FulfilmentSlaMonitorOptions = {},
  ) {
    const config = buildFulfilmentSlaMonitorConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new FulfilmentSlaMonitorManager(
      fulfilmentOrchestrator,
      shipmentTracking,
      logisticsOptimization,
    );
    this.controller = new FulfilmentSlaMonitorController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<FulfilmentSlaMonitorState> {
    const doc = await this.reader.readText(FULFILMENT_SLA_MONITOR_SYSTEM_PATH);
    if (!doc?.includes("Fulfilment SLA Monitor")) {
      throw new Error(
        `${FULFILMENT_SLA_MONITOR_SYSTEM_PATH} missing — Fulfilment SLA Monitor requires R2-18 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendFsmLog({
      event: "engine_initialization",
      level: "info",
      details: "R2-18 Fulfilment SLA Monitor initialized",
    });
    return this.getState();
  }

  getState(): FulfilmentSlaMonitorState {
    if (!this.initializedAt) {
      throw new Error("Fulfilment SLA Monitor not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const records = this.controller.getManager().getRecords();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      records,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-FSM-001",
      missionId: "R2-18",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      records,
      history: this.controller.getManager().getHistory(),
      health,
      performance,
    };
  }

  monitorFulfilmentSla(input: MonitorFulfilmentSlaInput = {}): SlaReport {
    return this.controller.monitorFulfilmentSla(input);
  }

  getLatestReport(): SlaReport | null {
    return this.controller.getLatestReport();
  }

  getRecords() {
    return this.controller.getManager().getRecords();
  }

  getHistory() {
    return this.controller.getManager().getHistory();
  }

  updateConfiguration(
    overrides: Partial<FulfilmentSlaMonitorConfiguration>,
  ): FulfilmentSlaMonitorState {
    const next = buildFulfilmentSlaMonitorConfiguration(this.bootstrap.repositoryRoot, {
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
        `Fulfilment SLA monitor status: ${state.status}`,
        `SLA record count: ${state.records.length}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No SLA monitoring operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): SlaCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      slaRecordCount: state.records.length,
      lastMonitorAt: state.health.lastMonitorAt,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      breachCount: state.health.breachCount,
      riskCount: state.health.riskCount,
      alertsGenerated: state.health.alertsGenerated,
      recentLogs: getFsmLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createFulfilmentSlaMonitorEngine(
  bootstrap: EmpireBootstrapContext,
  fulfilmentOrchestrator: FulfilmentOrchestrator,
  shipmentTracking: ShipmentTrackingEngine,
  logisticsOptimization: LogisticsOptimizationEngine,
  options?: FulfilmentSlaMonitorOptions,
): FulfilmentSlaMonitorEngine {
  return new FulfilmentSlaMonitorEngine(
    bootstrap,
    fulfilmentOrchestrator,
    shipmentTracking,
    logisticsOptimization,
    options,
  );
}

export function resetFulfilmentSlaMonitorForTesting(): void {
  resetFsmLogsForTesting();
  new FulfilmentSlaMonitorManager(null, null, null).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
