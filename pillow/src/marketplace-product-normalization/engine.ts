import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { MarketplaceConnectorFrameworkEngine } from "../marketplace-connector-framework/engine.js";
import {
  buildMarketplaceProductNormalizationConfiguration,
  type MarketplaceProductNormalizationConfiguration,
} from "./configuration.js";
import {
  appendNormalizationLog,
  getNormalizationLogs,
  resetNormalizationLogsForTesting,
} from "./mpn-logging.js";
import { MARKETPLACE_PRODUCT_NORMALIZATION_SYSTEM_PATH, UNIFIED_PRODUCT_SCHEMA_VERSION } from "./paths.js";
import type {
  DetectDuplicatesInput,
  NormalizeProductInput,
  NormalizeProductsInput,
  ProductNormalizationCockpitSnapshot,
  ProductNormalizationReport,
  MarketplaceProductNormalizationState,
} from "./types.js";
import { MarketplaceProductNormalizationController } from "./marketplace-product-normalization-controller.js";
import { MarketplaceProductNormalizationManager } from "./marketplace-product-normalization-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface MarketplaceProductNormalizationOptions {
  configuration?: Partial<MarketplaceProductNormalizationConfiguration>;
}

/**
 * Marketplace Product Normalization (PILLOW-MPN-001 / R1-12).
 * Unified product schema across supported marketplace connectors — consumes R1-01 through R1-11.
 */
export class MarketplaceProductNormalizationEngine {
  private initializedAt: string | null = null;
  private readonly controller: MarketplaceProductNormalizationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    marketplaceConnectorFramework: MarketplaceConnectorFrameworkEngine,
    options: MarketplaceProductNormalizationOptions = {},
  ) {
    const config = buildMarketplaceProductNormalizationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new MarketplaceProductNormalizationManager(marketplaceConnectorFramework);
    this.controller = new MarketplaceProductNormalizationController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<MarketplaceProductNormalizationState> {
    const doc = await this.reader.readText(MARKETPLACE_PRODUCT_NORMALIZATION_SYSTEM_PATH);
    if (!doc?.includes("Marketplace Product Normalization")) {
      throw new Error(
        `${MARKETPLACE_PRODUCT_NORMALIZATION_SYSTEM_PATH} missing — Marketplace Product Normalization requires R1-12 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendNormalizationLog({
      event: "engine_initialization",
      level: "info",
      details: "R1-12 Marketplace Product Normalization initialized",
    });
    return this.getState();
  }

  getState(): MarketplaceProductNormalizationState {
    if (!this.initializedAt) {
      throw new Error(
        "Marketplace Product Normalization not initialized. Call initialize() first.",
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
      engineVersion: "PILLOW-MPN-001",
      missionId: "R1-12",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      catalog,
      health,
      performance,
    };
  }

  async normalizeProducts(input: NormalizeProductsInput = {}): Promise<ProductNormalizationReport> {
    return this.controller.normalizeProducts(input);
  }

  normalizeProduct(input: NormalizeProductInput): ProductNormalizationReport {
    return this.controller.normalizeProduct(input);
  }

  detectDuplicates(input: DetectDuplicatesInput = {}): ProductNormalizationReport {
    return this.controller.detectDuplicates(input);
  }

  getLatestReport(): ProductNormalizationReport | null {
    return this.controller.getLatestReport();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  setIncludeDuplicateFixturesForTesting(value: boolean): void {
    this.controller.getManager().setIncludeDuplicateFixturesForTesting(value);
  }

  updateConfiguration(
    overrides: Partial<MarketplaceProductNormalizationConfiguration>,
  ): MarketplaceProductNormalizationState {
    const next = buildMarketplaceProductNormalizationConfiguration(this.bootstrap.repositoryRoot, {
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
        `Product normalization status: ${state.status}`,
        `Catalog size: ${state.catalog.length}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No normalization operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ProductNormalizationCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      catalogSize: state.catalog.length,
      lastNormalizationAt: state.health.lastNormalizationAt,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      duplicatesDetected: state.performance.duplicatesDetected,
      invalidProductsDetected: state.performance.invalidProductsDetected,
      schemaVersion: UNIFIED_PRODUCT_SCHEMA_VERSION,
      recentLogs: getNormalizationLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createMarketplaceProductNormalizationEngine(
  bootstrap: EmpireBootstrapContext,
  marketplaceConnectorFramework: MarketplaceConnectorFrameworkEngine,
  options?: MarketplaceProductNormalizationOptions,
): MarketplaceProductNormalizationEngine {
  return new MarketplaceProductNormalizationEngine(bootstrap, marketplaceConnectorFramework, options);
}

export function resetMarketplaceProductNormalizationForTesting(): void {
  resetNormalizationLogsForTesting();
  new MarketplaceProductNormalizationManager(null).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
