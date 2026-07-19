import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { FulfilmentOrchestrator } from "../fulfilment-orchestrator/engine.js";
import {
  buildShippingCarrierIntegrationConfiguration,
  type ShippingCarrierIntegrationConfiguration,
} from "./configuration.js";
import { appendSciLog, getSciLogs, resetSciLogsForTesting } from "./sci-logging.js";
import { SHIPPING_CARRIER_INTEGRATION_SYSTEM_PATH } from "./paths.js";
import type {
  CarrierCockpitSnapshot,
  CreateShipmentRequestInput,
  RegisterCarrierInput,
  RequestShippingLabelInput,
  RequestShippingRatesInput,
  ShipmentReport,
  ShippingCarrierIntegrationState,
} from "./types.js";
import { ShippingCarrierController } from "./shipping-carrier-controller.js";
import { ShippingCarrierManager } from "./shipping-carrier-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface ShippingCarrierIntegrationOptions {
  configuration?: Partial<ShippingCarrierIntegrationConfiguration>;
}

/**
 * Shipping Carrier Integration (PILLOW-SCI-001 / R2-11).
 * Multi-carrier shipping — consumes R2-10 Fulfilment Orchestrator.
 */
export class ShippingCarrierIntegrationEngine {
  private initializedAt: string | null = null;
  private readonly controller: ShippingCarrierController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    fulfilmentOrchestrator: FulfilmentOrchestrator,
    options: ShippingCarrierIntegrationOptions = {},
  ) {
    const config = buildShippingCarrierIntegrationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new ShippingCarrierManager(fulfilmentOrchestrator);
    this.controller = new ShippingCarrierController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ShippingCarrierIntegrationState> {
    const doc = await this.reader.readText(SHIPPING_CARRIER_INTEGRATION_SYSTEM_PATH);
    if (!doc?.includes("Shipping Carrier Integration")) {
      throw new Error(
        `${SHIPPING_CARRIER_INTEGRATION_SYSTEM_PATH} missing — Shipping Carrier Integration requires R2-11 system doc.`,
      );
    }
    this.controller.initialize();
    this.controller.registerCarriers({ registerAllSupported: true });
    this.initializedAt = new Date().toISOString();
    appendSciLog({
      event: "engine_initialization",
      level: "info",
      details: "R2-11 Shipping Carrier Integration initialized",
    });
    return this.getState();
  }

  getState(): ShippingCarrierIntegrationState {
    if (!this.initializedAt) {
      throw new Error("Shipping Carrier Integration not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const records = this.controller.getManager().getRecords();
    const carriers = this.controller.getManager().getCarriers();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      records,
      registeredCarriers: carriers.length,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-SCI-001",
      missionId: "R2-11",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      records,
      carriers,
      health,
      performance,
    };
  }

  registerCarriers(input: RegisterCarrierInput = {}): ShipmentReport {
    return this.controller.registerCarriers(input);
  }

  createShipmentRequest(input: CreateShipmentRequestInput = {}): ShipmentReport {
    return this.controller.createShipmentRequest(input);
  }

  requestShippingLabel(input: RequestShippingLabelInput): ShipmentReport {
    return this.controller.requestShippingLabel(input);
  }

  requestShippingRates(input: RequestShippingRatesInput = {}): ShipmentReport {
    return this.controller.requestShippingRates(input);
  }

  getLatestReport(): ShipmentReport | null {
    return this.controller.getLatestReport();
  }

  getRecords() {
    return this.controller.getManager().getRecords();
  }

  getCarriers() {
    return this.controller.getManager().getCarriers();
  }

  updateConfiguration(
    overrides: Partial<ShippingCarrierIntegrationConfiguration>,
  ): ShippingCarrierIntegrationState {
    const next = buildShippingCarrierIntegrationConfiguration(this.bootstrap.repositoryRoot, {
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
        `Carrier integration status: ${state.status}`,
        `Shipment count: ${state.records.length}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No shipment operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): CarrierCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      shipmentCount: state.records.length,
      registeredCarriers: state.carriers.length,
      lastShipmentAt: state.health.lastShipmentAt,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      labelsGenerated: state.performance.labelsGenerated,
      carrierFailures: state.health.carrierFailures,
      recentLogs: getSciLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createShippingCarrierIntegrationEngine(
  bootstrap: EmpireBootstrapContext,
  fulfilmentOrchestrator: FulfilmentOrchestrator,
  options?: ShippingCarrierIntegrationOptions,
): ShippingCarrierIntegrationEngine {
  return new ShippingCarrierIntegrationEngine(bootstrap, fulfilmentOrchestrator, options);
}

export function resetShippingCarrierIntegrationForTesting(): void {
  resetSciLogsForTesting();
  new ShippingCarrierManager(null).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
