import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { AmazonMarketplaceIntegrationEngine } from "../amazon-marketplace-integration/engine.js";
import {
  buildAmazonProductIntelligenceConfiguration,
  type AmazonProductIntelligenceConfiguration,
} from "./configuration.js";
import {
  appendProductLog,
  getProductLogs,
  resetProductLogsForTesting,
} from "./amzprod-logging.js";
import { AMAZON_PRODUCT_INTELLIGENCE_SYSTEM_PATH } from "./paths.js";
import type {
  AmazonProductCockpitSnapshot,
  AmazonProductSyncReport,
  AmazonProductIntelligenceState,
  FetchAmazonProductInput,
  SyncAmazonProductsInput,
} from "./types.js";
import { AmazonProductIntelligenceController } from "./amazon-product-intelligence-controller.js";
import { AmazonProductIntelligenceManager } from "./amazon-product-intelligence-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface AmazonProductIntelligenceOptions {
  configuration?: Partial<AmazonProductIntelligenceConfiguration>;
}

/**
 * Amazon Product Intelligence (PILLOW-AMZPI-001 / R1-03).
 * Amazon catalog synchronization and product visibility — consumes R1-02 connector.
 */
export class AmazonProductIntelligenceEngine {
  private initializedAt: string | null = null;
  private readonly controller: AmazonProductIntelligenceController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    amazonIntegration: AmazonMarketplaceIntegrationEngine,
    options: AmazonProductIntelligenceOptions = {},
  ) {
    const config = buildAmazonProductIntelligenceConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new AmazonProductIntelligenceManager(amazonIntegration);
    this.controller = new AmazonProductIntelligenceController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<AmazonProductIntelligenceState> {
    const doc = await this.reader.readText(AMAZON_PRODUCT_INTELLIGENCE_SYSTEM_PATH);
    if (!doc?.includes("Amazon Product Intelligence")) {
      throw new Error(
        `${AMAZON_PRODUCT_INTELLIGENCE_SYSTEM_PATH} missing — Amazon Product Intelligence requires R1-03 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendProductLog({
      event: "engine_initialization",
      level: "info",
      details: "R1-03 Amazon Product Intelligence initialized",
    });
    return this.getState();
  }

  getState(): AmazonProductIntelligenceState {
    if (!this.initializedAt) {
      throw new Error(
        "Amazon Product Intelligence not initialized. Call initialize() first.",
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
      engineVersion: "PILLOW-AMZPI-001",
      missionId: "R1-03",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      catalog,
      health,
      performance,
    };
  }

  async syncAmazonProducts(input: SyncAmazonProductsInput = {}): Promise<AmazonProductSyncReport> {
    return this.controller.syncAmazonProducts(input);
  }

  async fetchAmazonProduct(input: FetchAmazonProductInput): Promise<AmazonProductSyncReport> {
    return this.controller.fetchAmazonProduct(input);
  }

  getLatestReport(): AmazonProductSyncReport | null {
    return this.controller.getLatestReport();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  configureSyncFixture(options: { updatedTitle?: string; omitAsin?: string }): void {
    this.controller.getManager().setSyncOptionsForTesting(options);
  }

  updateConfiguration(
    overrides: Partial<AmazonProductIntelligenceConfiguration>,
  ): AmazonProductIntelligenceState {
    const next = buildAmazonProductIntelligenceConfiguration(this.bootstrap.repositoryRoot, {
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
        `Product intelligence status: ${state.status}`,
        `Catalog size: ${state.catalog.length}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No product sync operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): AmazonProductCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      catalogSize: state.catalog.length,
      lastSyncAt: state.health.lastSyncAt,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      newProductsDetected: state.performance.newProductsDetected,
      updatedProductsDetected: state.performance.updatedProductsDetected,
      inactiveProductsDetected: state.performance.inactiveProductsDetected,
      recentLogs: getProductLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createAmazonProductIntelligenceEngine(
  bootstrap: EmpireBootstrapContext,
  amazonIntegration: AmazonMarketplaceIntegrationEngine,
  options?: AmazonProductIntelligenceOptions,
): AmazonProductIntelligenceEngine {
  return new AmazonProductIntelligenceEngine(bootstrap, amazonIntegration, options);
}

export function resetAmazonProductIntelligenceForTesting(): void {
  resetProductLogsForTesting();
  new AmazonProductIntelligenceManager(null).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
