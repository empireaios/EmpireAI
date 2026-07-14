import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { AmazonMarketplaceIntegrationEngine } from "../amazon-marketplace-integration/engine.js";
import type { AmazonProductIntelligenceEngine } from "../amazon-product-intelligence/engine.js";
import type { AmazonOrderManagementEngine } from "../amazon-order-management/engine.js";
import {
  buildAmazonInventorySyncConfiguration,
  type AmazonInventorySyncConfiguration,
} from "./configuration.js";
import {
  appendInventoryLog,
  getInventoryLogs,
  resetInventoryLogsForTesting,
} from "./amzinv-logging.js";
import { AMAZON_INVENTORY_SYNC_SYSTEM_PATH } from "./paths.js";
import type {
  AmazonInventoryCockpitSnapshot,
  AmazonInventorySyncReport,
  AmazonInventorySyncState,
  FetchAmazonInventoryInput,
  SyncAmazonInventoryInput,
} from "./types.js";
import { AmazonInventorySyncController } from "./amazon-inventory-sync-controller.js";
import { AmazonInventorySyncManager } from "./amazon-inventory-sync-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface AmazonInventorySyncOptions {
  configuration?: Partial<AmazonInventorySyncConfiguration>;
}

/**
 * Amazon Inventory Sync (PILLOW-AMZINV-001 / R1-05).
 * Amazon inventory synchronization — consumes R1-02 connector, R1-03 products, R1-04 orders.
 */
export class AmazonInventorySyncEngine {
  private initializedAt: string | null = null;
  private readonly controller: AmazonInventorySyncController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    amazonIntegration: AmazonMarketplaceIntegrationEngine,
    productIntelligence: AmazonProductIntelligenceEngine,
    orderManagement: AmazonOrderManagementEngine,
    options: AmazonInventorySyncOptions = {},
  ) {
    const config = buildAmazonInventorySyncConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new AmazonInventorySyncManager(
      amazonIntegration,
      productIntelligence,
      orderManagement,
    );
    this.controller = new AmazonInventorySyncController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<AmazonInventorySyncState> {
    const doc = await this.reader.readText(AMAZON_INVENTORY_SYNC_SYSTEM_PATH);
    if (!doc?.includes("Amazon Inventory Sync")) {
      throw new Error(
        `${AMAZON_INVENTORY_SYNC_SYSTEM_PATH} missing — Amazon Inventory Sync requires R1-05 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendInventoryLog({
      event: "engine_initialization",
      level: "info",
      details: "R1-05 Amazon Inventory Sync initialized",
    });
    return this.getState();
  }

  getState(): AmazonInventorySyncState {
    if (!this.initializedAt) {
      throw new Error("Amazon Inventory Sync not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const inventory = this.controller.getManager().getInventory();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      inventory,
      discrepancyCount: this.controller.getLastDiscrepancyCount(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-AMZINV-001",
      missionId: "R1-05",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      inventory,
      health,
      performance,
    };
  }

  async syncAmazonInventory(input: SyncAmazonInventoryInput = {}): Promise<AmazonInventorySyncReport> {
    return this.controller.syncAmazonInventory(input);
  }

  async fetchAmazonInventory(input: FetchAmazonInventoryInput): Promise<AmazonInventorySyncReport> {
    return this.controller.fetchAmazonInventory(input);
  }

  getLatestReport(): AmazonInventorySyncReport | null {
    return this.controller.getLatestReport();
  }

  getInventory() {
    return this.controller.getManager().getInventory();
  }

  configureInventoryFixture(
    options: Parameters<AmazonInventorySyncManager["setFixtureOptionsForTesting"]>[0],
  ): void {
    this.controller.getManager().setFixtureOptionsForTesting(options);
  }

  setInternalQuantityForTesting(sku: string, quantity: number): void {
    this.controller.getManager().setInternalQuantityForTesting(sku, quantity);
  }

  updateConfiguration(
    overrides: Partial<AmazonInventorySyncConfiguration>,
  ): AmazonInventorySyncState {
    const next = buildAmazonInventorySyncConfiguration(this.bootstrap.repositoryRoot, {
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

  getCockpitSnapshot(): AmazonInventoryCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      inventoryCount: state.inventory.length,
      lowStockCount: state.health.lowStockCount,
      outOfStockCount: state.health.outOfStockCount,
      discrepancyCount: state.health.discrepancyCount,
      lastSyncAt: state.health.lastSyncAt,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      stockChangesDetected: state.performance.stockChangesDetected,
      recentLogs: getInventoryLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createAmazonInventorySyncEngine(
  bootstrap: EmpireBootstrapContext,
  amazonIntegration: AmazonMarketplaceIntegrationEngine,
  productIntelligence: AmazonProductIntelligenceEngine,
  orderManagement: AmazonOrderManagementEngine,
  options?: AmazonInventorySyncOptions,
): AmazonInventorySyncEngine {
  return new AmazonInventorySyncEngine(
    bootstrap,
    amazonIntegration,
    productIntelligence,
    orderManagement,
    options,
  );
}

export function resetAmazonInventorySyncForTesting(): void {
  resetInventoryLogsForTesting();
  new AmazonInventorySyncManager(null, null, null).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
