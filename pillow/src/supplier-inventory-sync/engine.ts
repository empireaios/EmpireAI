import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { SupplierProductSyncEngine } from "../supplier-product-sync/engine.js";
import {
  buildSupplierInventorySyncConfiguration,
  type SupplierInventorySyncConfiguration,
} from "./configuration.js";
import { appendSisLog, getSisLogs, resetSisLogsForTesting } from "./sis-logging.js";
import { SUPPLIER_INVENTORY_SYNC_SYSTEM_PATH } from "./paths.js";
import type {
  ReceiveSupplierInventoryInput,
  SupplierInventorySyncCockpitSnapshot,
  SupplierInventorySyncReport,
  SupplierInventorySyncState,
  SyncSupplierInventoryInput,
} from "./types.js";
import { SupplierInventorySyncController } from "./supplier-inventory-sync-controller.js";
import { SupplierInventorySyncManager } from "./supplier-inventory-sync-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface SupplierInventorySyncOptions {
  configuration?: Partial<SupplierInventorySyncConfiguration>;
}

/**
 * Supplier Inventory Sync (PILLOW-SIS-001 / R2-06).
 * Unified supplier inventory synchronization — consumes R2-05 Supplier Product Sync.
 */
export class SupplierInventorySyncEngine {
  private initializedAt: string | null = null;
  private readonly controller: SupplierInventorySyncController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    productSync: SupplierProductSyncEngine,
    options: SupplierInventorySyncOptions = {},
  ) {
    const config = buildSupplierInventorySyncConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new SupplierInventorySyncManager(productSync);
    this.controller = new SupplierInventorySyncController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<SupplierInventorySyncState> {
    const doc = await this.reader.readText(SUPPLIER_INVENTORY_SYNC_SYSTEM_PATH);
    if (!doc?.includes("Supplier Inventory Sync")) {
      throw new Error(
        `${SUPPLIER_INVENTORY_SYNC_SYSTEM_PATH} missing — Supplier Inventory Sync requires R2-06 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendSisLog({
      event: "engine_initialization",
      level: "info",
      details: "R2-06 Supplier Inventory Sync initialized",
    });
    return this.getState();
  }

  getState(): SupplierInventorySyncState {
    if (!this.initializedAt) {
      throw new Error("Supplier Inventory Sync not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const inventory = this.controller.getManager().getInventory();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      inventory,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-SIS-001",
      missionId: "R2-06",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      inventory,
      health,
      performance,
    };
  }

  async syncSupplierInventory(
    input: SyncSupplierInventoryInput = {},
  ): Promise<SupplierInventorySyncReport> {
    return this.controller.syncSupplierInventory(input);
  }

  receiveSupplierInventory(input: ReceiveSupplierInventoryInput): SupplierInventorySyncReport {
    return this.controller.receiveSupplierInventory(input);
  }

  getLatestReport(): SupplierInventorySyncReport | null {
    return this.controller.getLatestReport();
  }

  getInventory() {
    return this.controller.getManager().getInventory();
  }

  updateConfiguration(
    overrides: Partial<SupplierInventorySyncConfiguration>,
  ): SupplierInventorySyncState {
    const next = buildSupplierInventorySyncConfiguration(this.bootstrap.repositoryRoot, {
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
        `Inventory sync status: ${state.status}`,
        `Inventory count: ${state.inventory.length}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No inventory sync operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): SupplierInventorySyncCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      inventoryCount: state.inventory.length,
      lastSynchronizationAt: state.health.lastSynchronizationAt,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      stockIncreasesDetected: state.performance.stockIncreasesDetected,
      stockDecreasesDetected: state.performance.stockDecreasesDetected,
      outOfStockDetected: state.performance.outOfStockDetected,
      discontinuedDetected: state.performance.discontinuedDetected,
      recentLogs: getSisLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createSupplierInventorySyncEngine(
  bootstrap: EmpireBootstrapContext,
  productSync: SupplierProductSyncEngine,
  options?: SupplierInventorySyncOptions,
): SupplierInventorySyncEngine {
  return new SupplierInventorySyncEngine(bootstrap, productSync, options);
}

export function resetSupplierInventorySyncForTesting(): void {
  resetSisLogsForTesting();
  new SupplierInventorySyncManager(null).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
