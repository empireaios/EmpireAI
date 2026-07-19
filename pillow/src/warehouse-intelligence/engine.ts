import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { SupplierInventorySyncEngine } from "../supplier-inventory-sync/engine.js";
import type { FulfilmentOrchestrator } from "../fulfilment-orchestrator/engine.js";
import type { ShipmentTrackingEngine } from "../shipment-tracking-engine/engine.js";
import {
  buildWarehouseIntelligenceConfiguration,
  type WarehouseIntelligenceConfiguration,
} from "./configuration.js";
import { appendWiLog, getWiLogs, resetWiLogsForTesting } from "./wi-logging.js";
import { WAREHOUSE_INTELLIGENCE_SYSTEM_PATH } from "./paths.js";
import type {
  AllocateWarehouseInput,
  CoordinateWarehousesInput,
  OptimizeInventoryDistributionInput,
  WarehouseCockpitSnapshot,
  WarehouseIntelligenceState,
  WarehouseReport,
} from "./types.js";
import { WarehouseIntelligenceController } from "./warehouse-intelligence-controller.js";
import { WarehouseIntelligenceManager } from "./warehouse-intelligence-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface WarehouseIntelligenceOptions {
  configuration?: Partial<WarehouseIntelligenceConfiguration>;
}

/**
 * Warehouse Intelligence (PILLOW-WI-001 / R2-14).
 * Intelligent warehouse coordination — consumes R2-06, R2-10, R2-12.
 */
export class WarehouseIntelligenceEngine {
  private initializedAt: string | null = null;
  private readonly controller: WarehouseIntelligenceController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    inventorySync: SupplierInventorySyncEngine,
    fulfilmentOrchestrator: FulfilmentOrchestrator,
    shipmentTracking: ShipmentTrackingEngine,
    options: WarehouseIntelligenceOptions = {},
  ) {
    const config = buildWarehouseIntelligenceConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new WarehouseIntelligenceManager(
      inventorySync,
      fulfilmentOrchestrator,
      shipmentTracking,
    );
    this.controller = new WarehouseIntelligenceController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<WarehouseIntelligenceState> {
    const doc = await this.reader.readText(WAREHOUSE_INTELLIGENCE_SYSTEM_PATH);
    if (!doc?.includes("Warehouse Intelligence")) {
      throw new Error(
        `${WAREHOUSE_INTELLIGENCE_SYSTEM_PATH} missing — Warehouse Intelligence requires R2-14 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendWiLog({
      event: "engine_initialization",
      level: "info",
      details: "R2-14 Warehouse Intelligence initialized",
    });
    return this.getState();
  }

  getState(): WarehouseIntelligenceState {
    if (!this.initializedAt) {
      throw new Error("Warehouse Intelligence not initialized. Call initialize() first.");
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
      engineVersion: "PILLOW-WI-001",
      missionId: "R2-14",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      records,
      health,
      performance,
    };
  }

  coordinateWarehouses(input: CoordinateWarehousesInput = {}): WarehouseReport {
    return this.controller.coordinateWarehouses(input);
  }

  allocateWarehouse(input: AllocateWarehouseInput = {}): WarehouseReport {
    return this.controller.allocateWarehouse(input);
  }

  optimizeInventoryDistribution(input: OptimizeInventoryDistributionInput = {}): WarehouseReport {
    return this.controller.optimizeInventoryDistribution(input);
  }

  getLatestReport(): WarehouseReport | null {
    return this.controller.getLatestReport();
  }

  getRecords() {
    return this.controller.getManager().getRecords();
  }

  updateConfiguration(
    overrides: Partial<WarehouseIntelligenceConfiguration>,
  ): WarehouseIntelligenceState {
    const next = buildWarehouseIntelligenceConfiguration(this.bootstrap.repositoryRoot, {
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
        `Warehouse intelligence status: ${state.status}`,
        `Warehouse count: ${state.records.length}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No warehouse operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): WarehouseCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      warehouseCount: state.records.length,
      lastCoordinationAt: state.health.lastCoordinationAt,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      bottleneckCount: state.health.bottleneckCount,
      shortageCount: state.health.shortageCount,
      overstockCount: state.health.overstockCount,
      recentLogs: getWiLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createWarehouseIntelligenceEngine(
  bootstrap: EmpireBootstrapContext,
  inventorySync: SupplierInventorySyncEngine,
  fulfilmentOrchestrator: FulfilmentOrchestrator,
  shipmentTracking: ShipmentTrackingEngine,
  options?: WarehouseIntelligenceOptions,
): WarehouseIntelligenceEngine {
  return new WarehouseIntelligenceEngine(
    bootstrap,
    inventorySync,
    fulfilmentOrchestrator,
    shipmentTracking,
    options,
  );
}

export function resetWarehouseIntelligenceForTesting(): void {
  resetWiLogsForTesting();
  new WarehouseIntelligenceManager(null, null, null).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
