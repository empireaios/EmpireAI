import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { MarketplaceConnectorFrameworkEngine } from "../marketplace-connector-framework/engine.js";
import {
  buildMarketplaceOrderNormalizationConfiguration,
  type MarketplaceOrderNormalizationConfiguration,
} from "./configuration.js";
import {
  appendOrderNormalizationLog,
  getOrderNormalizationLogs,
  resetOrderNormalizationLogsForTesting,
} from "./mon-logging.js";
import { MARKETPLACE_ORDER_NORMALIZATION_SYSTEM_PATH, UNIFIED_ORDER_SCHEMA_VERSION } from "./paths.js";
import type {
  DetectDuplicatesInput,
  NormalizeOrderInput,
  NormalizeOrdersInput,
  OrderNormalizationCockpitSnapshot,
  OrderNormalizationReport,
  MarketplaceOrderNormalizationState,
} from "./types.js";
import { MarketplaceOrderNormalizationController } from "./marketplace-order-normalization-controller.js";
import { MarketplaceOrderNormalizationManager } from "./marketplace-order-normalization-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface MarketplaceOrderNormalizationOptions {
  configuration?: Partial<MarketplaceOrderNormalizationConfiguration>;
}

/**
 * Marketplace Order Normalization (PILLOW-MON-001 / R1-13).
 * Unified order schema across supported marketplace connectors — consumes R1-01 through R1-12.
 */
export class MarketplaceOrderNormalizationEngine {
  private initializedAt: string | null = null;
  private readonly controller: MarketplaceOrderNormalizationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    marketplaceConnectorFramework: MarketplaceConnectorFrameworkEngine,
    options: MarketplaceOrderNormalizationOptions = {},
  ) {
    const config = buildMarketplaceOrderNormalizationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new MarketplaceOrderNormalizationManager(marketplaceConnectorFramework);
    this.controller = new MarketplaceOrderNormalizationController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<MarketplaceOrderNormalizationState> {
    const doc = await this.reader.readText(MARKETPLACE_ORDER_NORMALIZATION_SYSTEM_PATH);
    if (!doc?.includes("Marketplace Order Normalization")) {
      throw new Error(
        `${MARKETPLACE_ORDER_NORMALIZATION_SYSTEM_PATH} missing — Marketplace Order Normalization requires R1-13 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendOrderNormalizationLog({
      event: "engine_initialization",
      level: "info",
      details: "R1-13 Marketplace Order Normalization initialized",
    });
    return this.getState();
  }

  getState(): MarketplaceOrderNormalizationState {
    if (!this.initializedAt) {
      throw new Error(
        "Marketplace Order Normalization not initialized. Call initialize() first.",
      );
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
      engineVersion: "PILLOW-MON-001",
      missionId: "R1-13",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      catalog,
      health,
      performance,
    };
  }

  async normalizeOrders(input: NormalizeOrdersInput = {}): Promise<OrderNormalizationReport> {
    return this.controller.normalizeOrders(input);
  }

  normalizeOrder(input: NormalizeOrderInput): OrderNormalizationReport {
    return this.controller.normalizeOrder(input);
  }

  detectDuplicates(input: DetectDuplicatesInput = {}): OrderNormalizationReport {
    return this.controller.detectDuplicates(input);
  }

  getLatestReport(): OrderNormalizationReport | null {
    return this.controller.getLatestReport();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  setIncludeDuplicateFixturesForTesting(value: boolean): void {
    this.controller.getManager().setIncludeDuplicateFixturesForTesting(value);
  }

  updateConfiguration(
    overrides: Partial<MarketplaceOrderNormalizationConfiguration>,
  ): MarketplaceOrderNormalizationState {
    const next = buildMarketplaceOrderNormalizationConfiguration(this.bootstrap.repositoryRoot, {
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
        `Order normalization status: ${state.status}`,
        `Catalog size: ${state.catalog.length}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No normalization operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): OrderNormalizationCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      catalogSize: state.catalog.length,
      lastNormalizationAt: state.health.lastNormalizationAt,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      duplicatesDetected: state.performance.duplicatesDetected,
      invalidOrdersDetected: state.performance.invalidOrdersDetected,
      schemaVersion: UNIFIED_ORDER_SCHEMA_VERSION,
      recentLogs: getOrderNormalizationLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createMarketplaceOrderNormalizationEngine(
  bootstrap: EmpireBootstrapContext,
  marketplaceConnectorFramework: MarketplaceConnectorFrameworkEngine,
  options?: MarketplaceOrderNormalizationOptions,
): MarketplaceOrderNormalizationEngine {
  return new MarketplaceOrderNormalizationEngine(bootstrap, marketplaceConnectorFramework, options);
}

export function resetMarketplaceOrderNormalizationForTesting(): void {
  resetOrderNormalizationLogsForTesting();
  new MarketplaceOrderNormalizationManager(null).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
