import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { CjDropshippingIntegrationEngine } from "../cj-dropshipping-integration/engine.js";
import type { AliExpressIntegrationEngine } from "../aliexpress-integration/engine.js";
import type { Oss1688IntegrationEngine } from "../1688-integration/engine.js";
import type { SupplierFrameworkEngine } from "../supplier-framework/engine.js";
import {
  buildSupplierProductSyncConfiguration,
  type SupplierProductSyncConfiguration,
} from "./configuration.js";
import { appendSpsLog, getSpsLogs, resetSpsLogsForTesting } from "./sps-logging.js";
import { SUPPLIER_PRODUCT_SYNC_SYSTEM_PATH, SUPPLIER_PRODUCT_CATALOG_VERSION } from "./paths.js";
import type {
  DetectDuplicatesInput,
  ReceiveSupplierProductInput,
  SupplierProductSyncCockpitSnapshot,
  SupplierProductSyncReport,
  SupplierProductSyncState,
  SyncSupplierProductsInput,
} from "./types.js";
import { SupplierProductSyncController } from "./supplier-product-sync-controller.js";
import { SupplierProductSyncManager } from "./supplier-product-sync-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface SupplierProductSyncOptions {
  configuration?: Partial<SupplierProductSyncConfiguration>;
}

/**
 * Supplier Product Sync (PILLOW-SPS-001 / R2-05).
 * Unified supplier catalog synchronization — consumes R2-02 through R2-04.
 */
export class SupplierProductSyncEngine {
  private initializedAt: string | null = null;
  private readonly controller: SupplierProductSyncController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    cj: CjDropshippingIntegrationEngine,
    aliexpress: AliExpressIntegrationEngine,
    oss1688: Oss1688IntegrationEngine,
    supplierFramework: SupplierFrameworkEngine,
    options: SupplierProductSyncOptions = {},
  ) {
    const config = buildSupplierProductSyncConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new SupplierProductSyncManager(cj, aliexpress, oss1688, supplierFramework);
    this.controller = new SupplierProductSyncController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<SupplierProductSyncState> {
    const doc = await this.reader.readText(SUPPLIER_PRODUCT_SYNC_SYSTEM_PATH);
    if (!doc?.includes("Supplier Product Sync")) {
      throw new Error(
        `${SUPPLIER_PRODUCT_SYNC_SYSTEM_PATH} missing — Supplier Product Sync requires R2-05 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendSpsLog({
      event: "engine_initialization",
      level: "info",
      details: "R2-05 Supplier Product Sync initialized",
    });
    return this.getState();
  }

  getState(): SupplierProductSyncState {
    if (!this.initializedAt) {
      throw new Error("Supplier Product Sync not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const catalog = this.controller.getManager().getCatalog();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      catalog,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-SPS-001",
      missionId: "R2-05",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      catalog,
      health,
      performance,
    };
  }

  async syncSupplierProducts(
    input: SyncSupplierProductsInput = {},
  ): Promise<SupplierProductSyncReport> {
    return this.controller.syncSupplierProducts(input);
  }

  receiveSupplierProduct(input: ReceiveSupplierProductInput): SupplierProductSyncReport {
    return this.controller.receiveSupplierProduct(input);
  }

  detectDuplicates(input: DetectDuplicatesInput = {}): SupplierProductSyncReport {
    return this.controller.detectDuplicates(input);
  }

  getLatestReport(): SupplierProductSyncReport | null {
    return this.controller.getLatestReport();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  setIncludeDuplicateFixturesForTesting(value: boolean): void {
    this.controller.getManager().setIncludeDuplicateFixturesForTesting(value);
  }

  updateConfiguration(
    overrides: Partial<SupplierProductSyncConfiguration>,
  ): SupplierProductSyncState {
    const next = buildSupplierProductSyncConfiguration(this.bootstrap.repositoryRoot, {
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
        `Product sync status: ${state.status}`,
        `Catalog size: ${state.catalog.length}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No product sync operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): SupplierProductSyncCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      catalogSize: state.catalog.length,
      lastSynchronizationAt: state.health.lastSynchronizationAt,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      newProductsDetected: state.performance.newProductsDetected,
      updatedProductsDetected: state.performance.updatedProductsDetected,
      discontinuedProductsDetected: state.performance.discontinuedProductsDetected,
      duplicatesDetected: state.performance.duplicatesDetected,
      invalidProductsDetected: state.performance.invalidProductsDetected,
      catalogVersion: SUPPLIER_PRODUCT_CATALOG_VERSION,
      recentLogs: getSpsLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createSupplierProductSyncEngine(
  bootstrap: EmpireBootstrapContext,
  cj: CjDropshippingIntegrationEngine,
  aliexpress: AliExpressIntegrationEngine,
  oss1688: Oss1688IntegrationEngine,
  supplierFramework: SupplierFrameworkEngine,
  options?: SupplierProductSyncOptions,
): SupplierProductSyncEngine {
  return new SupplierProductSyncEngine(
    bootstrap,
    cj,
    aliexpress,
    oss1688,
    supplierFramework,
    options,
  );
}

export function resetSupplierProductSyncForTesting(): void {
  resetSpsLogsForTesting();
  new SupplierProductSyncManager(null, null, null, null).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
