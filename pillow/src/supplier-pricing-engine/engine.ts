import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { SupplierProductSyncEngine } from "../supplier-product-sync/engine.js";
import type { SupplierInventorySyncEngine } from "../supplier-inventory-sync/engine.js";
import {
  buildSupplierPricingEngineConfiguration,
  type SupplierPricingEngineConfiguration,
} from "./configuration.js";
import { appendSpeLog, getSpeLogs, resetSpeLogsForTesting } from "./spe-logging.js";
import { SUPPLIER_PRICING_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  ReceiveSupplierPricingInput,
  SupplierPricingCockpitSnapshot,
  SupplierPricingSyncReport,
  SupplierPricingEngineState,
  SyncSupplierPricingInput,
} from "./types.js";
import { SupplierPricingController } from "./supplier-pricing-controller.js";
import { SupplierPricingManager } from "./supplier-pricing-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface SupplierPricingEngineOptions {
  configuration?: Partial<SupplierPricingEngineConfiguration>;
}

/**
 * Supplier Pricing Engine (PILLOW-SPE-001 / R2-07).
 * Centralized supplier pricing — consumes R2-05 Product Sync and R2-06 Inventory Sync.
 */
export class SupplierPricingEngine {
  private initializedAt: string | null = null;
  private readonly controller: SupplierPricingController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    productSync: SupplierProductSyncEngine,
    inventorySync: SupplierInventorySyncEngine,
    options: SupplierPricingEngineOptions = {},
  ) {
    const config = buildSupplierPricingEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new SupplierPricingManager(productSync, inventorySync);
    this.controller = new SupplierPricingController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<SupplierPricingEngineState> {
    const doc = await this.reader.readText(SUPPLIER_PRICING_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Supplier Pricing Engine")) {
      throw new Error(
        `${SUPPLIER_PRICING_ENGINE_SYSTEM_PATH} missing — Supplier Pricing Engine requires R2-07 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendSpeLog({
      event: "engine_initialization",
      level: "info",
      details: "R2-07 Supplier Pricing Engine initialized",
    });
    return this.getState();
  }

  getState(): SupplierPricingEngineState {
    if (!this.initializedAt) {
      throw new Error("Supplier Pricing Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const pricing = this.controller.getManager().getPricing();
    const history = this.controller.getManager().getHistory();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      pricing,
      historyCount: history.length,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-SPE-001",
      missionId: "R2-07",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      pricing,
      history,
      health,
      performance,
    };
  }

  async syncSupplierPricing(
    input: SyncSupplierPricingInput = {},
  ): Promise<SupplierPricingSyncReport> {
    return this.controller.syncSupplierPricing(input);
  }

  receiveSupplierPricing(input: ReceiveSupplierPricingInput): SupplierPricingSyncReport {
    return this.controller.receiveSupplierPricing(input);
  }

  getLatestReport(): SupplierPricingSyncReport | null {
    return this.controller.getLatestReport();
  }

  getPricing() {
    return this.controller.getManager().getPricing();
  }

  getHistory() {
    return this.controller.getManager().getHistory();
  }

  updateConfiguration(
    overrides: Partial<SupplierPricingEngineConfiguration>,
  ): SupplierPricingEngineState {
    const next = buildSupplierPricingEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Pricing engine status: ${state.status}`,
        `Pricing count: ${state.pricing.length}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No pricing sync operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): SupplierPricingCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      pricingCount: state.pricing.length,
      historyCount: state.history.length,
      lastSynchronizationAt: state.health.lastSynchronizationAt,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      priceIncreasesDetected: state.performance.priceIncreasesDetected,
      priceDecreasesDetected: state.performance.priceDecreasesDetected,
      anomaliesDetected: state.performance.anomaliesDetected,
      recentLogs: getSpeLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createSupplierPricingEngine(
  bootstrap: EmpireBootstrapContext,
  productSync: SupplierProductSyncEngine,
  inventorySync: SupplierInventorySyncEngine,
  options?: SupplierPricingEngineOptions,
): SupplierPricingEngine {
  return new SupplierPricingEngine(bootstrap, productSync, inventorySync, options);
}

export function resetSupplierPricingEngineForTesting(): void {
  resetSpeLogsForTesting();
  new SupplierPricingManager(null, null).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
