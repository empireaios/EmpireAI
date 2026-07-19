import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { ShippingCarrierIntegrationEngine } from "../shipping-carrier-integration/engine.js";
import {
  buildShipmentTrackingEngineConfiguration,
  type ShipmentTrackingEngineConfiguration,
} from "./configuration.js";
import { appendSteLog, getSteLogs, resetSteLogsForTesting } from "./ste-logging.js";
import { SHIPMENT_TRACKING_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  QueryCarrierTrackingInput,
  ReceiveTrackingWebhookInput,
  ShipmentTrackingReport,
  ShipmentTrackingEngineState,
  SyncShipmentTrackingInput,
  TrackingCockpitSnapshot,
} from "./types.js";
import { ShipmentTrackingController } from "./shipment-tracking-controller.js";
import { ShipmentTrackingManager } from "./shipment-tracking-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface ShipmentTrackingEngineOptions {
  configuration?: Partial<ShipmentTrackingEngineConfiguration>;
}

/**
 * Shipment Tracking Engine (PILLOW-STE-001 / R2-12).
 * Live shipment visibility — consumes R2-11 Shipping Carrier Integration.
 */
export class ShipmentTrackingEngine {
  private initializedAt: string | null = null;
  private readonly controller: ShipmentTrackingController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    carrierIntegration: ShippingCarrierIntegrationEngine,
    options: ShipmentTrackingEngineOptions = {},
  ) {
    const config = buildShipmentTrackingEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new ShipmentTrackingManager(carrierIntegration);
    this.controller = new ShipmentTrackingController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ShipmentTrackingEngineState> {
    const doc = await this.reader.readText(SHIPMENT_TRACKING_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Shipment Tracking Engine")) {
      throw new Error(
        `${SHIPMENT_TRACKING_ENGINE_SYSTEM_PATH} missing — Shipment Tracking Engine requires R2-12 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendSteLog({
      event: "engine_initialization",
      level: "info",
      details: "R2-12 Shipment Tracking Engine initialized",
    });
    return this.getState();
  }

  getState(): ShipmentTrackingEngineState {
    if (!this.initializedAt) {
      throw new Error("Shipment Tracking Engine not initialized. Call initialize() first.");
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
      engineVersion: "PILLOW-STE-001",
      missionId: "R2-12",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      records,
      health,
      performance,
    };
  }

  syncShipmentTracking(input: SyncShipmentTrackingInput = {}): ShipmentTrackingReport {
    return this.controller.syncShipmentTracking(input);
  }

  queryCarrierTracking(input: QueryCarrierTrackingInput): ShipmentTrackingReport {
    return this.controller.queryCarrierTracking(input);
  }

  receiveTrackingWebhook(input: ReceiveTrackingWebhookInput): ShipmentTrackingReport {
    return this.controller.receiveTrackingWebhook(input);
  }

  getLatestReport(): ShipmentTrackingReport | null {
    return this.controller.getLatestReport();
  }

  getRecords() {
    return this.controller.getManager().getRecords();
  }

  updateConfiguration(
    overrides: Partial<ShipmentTrackingEngineConfiguration>,
  ): ShipmentTrackingEngineState {
    const next = buildShipmentTrackingEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Tracking engine status: ${state.status}`,
        `Tracking count: ${state.records.length}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No tracking operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): TrackingCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      trackingCount: state.records.length,
      lastSyncAt: state.health.lastSyncAt,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      deliveredCount: state.performance.deliveredDetected,
      delayedCount: state.health.delayedCount,
      failedDeliveryCount: state.health.failedDeliveryCount,
      recentLogs: getSteLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createShipmentTrackingEngine(
  bootstrap: EmpireBootstrapContext,
  carrierIntegration: ShippingCarrierIntegrationEngine,
  options?: ShipmentTrackingEngineOptions,
): ShipmentTrackingEngine {
  return new ShipmentTrackingEngine(bootstrap, carrierIntegration, options);
}

export function resetShipmentTrackingEngineForTesting(): void {
  resetSteLogsForTesting();
  new ShipmentTrackingManager(null).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
