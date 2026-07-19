import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { WarehouseIntelligenceEngine } from "../warehouse-intelligence/engine.js";
import {
  buildMultiWarehouseSupportConfiguration,
  type MultiWarehouseSupportConfiguration,
} from "./configuration.js";
import { appendMwsLog, getMwsLogs, resetMwsLogsForTesting } from "./mws-logging.js";
import { MULTI_WAREHOUSE_SUPPORT_SYSTEM_PATH } from "./paths.js";
import type {
  MultiWarehouseSupportState,
  RegisterWarehousesInput,
  RouteFulfilmentInput,
  SelectWarehouseInput,
  TransferInventoryInput,
  WarehouseNetworkCockpitSnapshot,
  WarehouseNetworkReport,
} from "./types.js";
import { MultiWarehouseController } from "./multi-warehouse-controller.js";
import { MultiWarehouseManager } from "./multi-warehouse-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface MultiWarehouseSupportOptions {
  configuration?: Partial<MultiWarehouseSupportConfiguration>;
}

/**
 * Multi-Warehouse Support (PILLOW-MWS-001 / R2-15).
 * Global stock management — consumes R2-14 Warehouse Intelligence.
 */
export class MultiWarehouseSupportEngine {
  private initializedAt: string | null = null;
  private readonly controller: MultiWarehouseController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    warehouseIntelligence: WarehouseIntelligenceEngine,
    options: MultiWarehouseSupportOptions = {},
  ) {
    const config = buildMultiWarehouseSupportConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new MultiWarehouseManager(warehouseIntelligence);
    this.controller = new MultiWarehouseController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<MultiWarehouseSupportState> {
    const doc = await this.reader.readText(MULTI_WAREHOUSE_SUPPORT_SYSTEM_PATH);
    if (!doc?.includes("Multi-Warehouse Support")) {
      throw new Error(
        `${MULTI_WAREHOUSE_SUPPORT_SYSTEM_PATH} missing — Multi-Warehouse Support requires R2-15 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendMwsLog({
      event: "engine_initialization",
      level: "info",
      details: "R2-15 Multi-Warehouse Support initialized",
    });
    return this.getState();
  }

  getState(): MultiWarehouseSupportState {
    if (!this.initializedAt) {
      throw new Error("Multi-Warehouse Support not initialized. Call initialize() first.");
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
      engineVersion: "PILLOW-MWS-001",
      missionId: "R2-15",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      records,
      health,
      performance,
    };
  }

  registerWarehouses(input: RegisterWarehousesInput = {}): WarehouseNetworkReport {
    return this.controller.registerWarehouses(input);
  }

  selectWarehouse(input: SelectWarehouseInput = {}): WarehouseNetworkReport {
    return this.controller.selectWarehouse(input);
  }

  transferInventory(input: TransferInventoryInput): WarehouseNetworkReport {
    return this.controller.transferInventory(input);
  }

  routeFulfilmentBetweenWarehouses(input: RouteFulfilmentInput): WarehouseNetworkReport {
    return this.controller.routeFulfilmentBetweenWarehouses(input);
  }

  syncWarehouseNetwork(): WarehouseNetworkReport {
    return this.controller.syncWarehouseNetwork();
  }

  getLatestReport(): WarehouseNetworkReport | null {
    return this.controller.getLatestReport();
  }

  getRecords() {
    return this.controller.getManager().getRecords();
  }

  updateConfiguration(
    overrides: Partial<MultiWarehouseSupportConfiguration>,
  ): MultiWarehouseSupportState {
    const next = buildMultiWarehouseSupportConfiguration(this.bootstrap.repositoryRoot, {
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
        `Multi-warehouse status: ${state.status}`,
        `Warehouse count: ${state.records.length}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No network operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): WarehouseNetworkCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      warehouseCount: state.records.length,
      lastNetworkSyncAt: state.health.lastNetworkSyncAt,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      imbalancedCount: state.health.imbalancedCount,
      capacityIssueCount: state.health.capacityIssueCount,
      transfersCompleted: state.health.transfersCompleted,
      recentLogs: getMwsLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createMultiWarehouseSupportEngine(
  bootstrap: EmpireBootstrapContext,
  warehouseIntelligence: WarehouseIntelligenceEngine,
  options?: MultiWarehouseSupportOptions,
): MultiWarehouseSupportEngine {
  return new MultiWarehouseSupportEngine(bootstrap, warehouseIntelligence, options);
}

export function resetMultiWarehouseSupportForTesting(): void {
  resetMwsLogsForTesting();
  new MultiWarehouseManager(null).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
