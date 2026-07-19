import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { FulfilmentOrchestrator } from "../fulfilment-orchestrator/engine.js";
import type { ShippingCarrierIntegrationEngine } from "../shipping-carrier-integration/engine.js";
import type { ShipmentTrackingEngine } from "../shipment-tracking-engine/engine.js";
import type { MultiWarehouseSupportEngine } from "../multi-warehouse-support/engine.js";
import {
  buildLogisticsOptimizationConfiguration,
  type LogisticsOptimizationConfiguration,
} from "./configuration.js";
import { appendLoLog, getLoLogs, resetLoLogsForTesting } from "./lo-logging.js";
import { LOGISTICS_OPTIMIZATION_SYSTEM_PATH } from "./paths.js";
import type {
  LogisticsCockpitSnapshot,
  LogisticsOptimizationState,
  LogisticsReport,
  OptimizeShippingInput,
} from "./types.js";
import { LogisticsOptimizationController } from "./logistics-optimization-controller.js";
import { LogisticsOptimizationManager } from "./logistics-optimization-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface LogisticsOptimizationOptions {
  configuration?: Partial<LogisticsOptimizationConfiguration>;
}

/**
 * Logistics Optimization (PILLOW-LO-001 / R2-17).
 * Shipping optimization — consumes R2-10, R2-11, R2-12, R2-15.
 */
export class LogisticsOptimizationEngine {
  private initializedAt: string | null = null;
  private readonly controller: LogisticsOptimizationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    fulfilmentOrchestrator: FulfilmentOrchestrator,
    carrierIntegration: ShippingCarrierIntegrationEngine,
    shipmentTracking: ShipmentTrackingEngine,
    multiWarehouseSupport: MultiWarehouseSupportEngine,
    options: LogisticsOptimizationOptions = {},
  ) {
    const config = buildLogisticsOptimizationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new LogisticsOptimizationManager(
      fulfilmentOrchestrator,
      carrierIntegration,
      shipmentTracking,
      multiWarehouseSupport,
    );
    this.controller = new LogisticsOptimizationController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<LogisticsOptimizationState> {
    const doc = await this.reader.readText(LOGISTICS_OPTIMIZATION_SYSTEM_PATH);
    if (!doc?.includes("Logistics Optimization")) {
      throw new Error(
        `${LOGISTICS_OPTIMIZATION_SYSTEM_PATH} missing — Logistics Optimization requires R2-17 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendLoLog({
      event: "engine_initialization",
      level: "info",
      details: "R2-17 Logistics Optimization initialized",
    });
    return this.getState();
  }

  getState(): LogisticsOptimizationState {
    if (!this.initializedAt) {
      throw new Error("Logistics Optimization not initialized. Call initialize() first.");
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
      engineVersion: "PILLOW-LO-001",
      missionId: "R2-17",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      records,
      health,
      performance,
    };
  }

  optimizeShipping(input: OptimizeShippingInput = {}): LogisticsReport {
    return this.controller.optimizeShipping(input);
  }

  getLatestReport(): LogisticsReport | null {
    return this.controller.getLatestReport();
  }

  getRecords() {
    return this.controller.getManager().getRecords();
  }

  updateConfiguration(
    overrides: Partial<LogisticsOptimizationConfiguration>,
  ): LogisticsOptimizationState {
    const next = buildLogisticsOptimizationConfiguration(this.bootstrap.repositoryRoot, {
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
        `Logistics optimization status: ${state.status}`,
        `Logistics record count: ${state.records.length}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No optimization operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): LogisticsCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      logisticsRecordCount: state.records.length,
      lastOptimizeAt: state.health.lastOptimizeAt,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      bottlenecksDetected: state.health.bottlenecksDetected,
      recommendationsGenerated: state.health.recommendationsGenerated,
      costsReduced: state.performance.costsReduced,
      recentLogs: getLoLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createLogisticsOptimizationEngine(
  bootstrap: EmpireBootstrapContext,
  fulfilmentOrchestrator: FulfilmentOrchestrator,
  carrierIntegration: ShippingCarrierIntegrationEngine,
  shipmentTracking: ShipmentTrackingEngine,
  multiWarehouseSupport: MultiWarehouseSupportEngine,
  options?: LogisticsOptimizationOptions,
): LogisticsOptimizationEngine {
  return new LogisticsOptimizationEngine(
    bootstrap,
    fulfilmentOrchestrator,
    carrierIntegration,
    shipmentTracking,
    multiWarehouseSupport,
    options,
  );
}

export function resetLogisticsOptimizationForTesting(): void {
  resetLoLogsForTesting();
  new LogisticsOptimizationManager(null, null, null, null).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
