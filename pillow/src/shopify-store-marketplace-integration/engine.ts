import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { MarketplaceConnectorFrameworkEngine } from "../marketplace-connector-framework/engine.js";
import {
  buildShopifyStoreMarketplaceIntegrationConfiguration,
  type ShopifyStoreMarketplaceIntegrationConfiguration,
} from "./configuration.js";
import {
  appendShopifyStoreLog,
  getShopifyStoreLogs,
  resetShopifyStoreLogsForTesting,
} from "./shopify-store-logging.js";
import { SHOPIFY_STORE_MARKETPLACE_INTEGRATION_SYSTEM_PATH } from "./paths.js";
import type {
  ShopifyStoreCockpitSnapshot,
  ShopifyStoreConnectorRunReport,
  ShopifyStoreMarketplaceIntegrationState,
  ConnectShopifyStoreInput,
  HandleShopifyStoreWebhookInput,
  RouteShopifyStoreApiInput,
} from "./types.js";
import { ShopifyStoreConnectorController } from "./shopify-store-connector-controller.js";
import { ShopifyStoreConnectorManager } from "./shopify-store-connector-manager.js";

export interface ShopifyStoreMarketplaceIntegrationOptions {
  configuration?: Partial<ShopifyStoreMarketplaceIntegrationConfiguration>;
}

/**
 * Shopify Store Marketplace Integration (PILLOW-SHF-001 / R1-10).
 * Shopify connector through MCF — structural Admin API, no live HTTP.
 */
export class ShopifyStoreMarketplaceIntegrationEngine {
  private initializedAt: string | null = null;
  private readonly controller: ShopifyStoreConnectorController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    marketplaceConnectorFramework: MarketplaceConnectorFrameworkEngine,
    options: ShopifyStoreMarketplaceIntegrationOptions = {},
  ) {
    const config = buildShopifyStoreMarketplaceIntegrationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new ShopifyStoreConnectorManager(marketplaceConnectorFramework);
    this.controller = new ShopifyStoreConnectorController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ShopifyStoreMarketplaceIntegrationState> {
    const doc = await this.reader.readText(SHOPIFY_STORE_MARKETPLACE_INTEGRATION_SYSTEM_PATH);
    if (!doc?.includes("Shopify Store Marketplace Integration")) {
      throw new Error(
        `${SHOPIFY_STORE_MARKETPLACE_INTEGRATION_SYSTEM_PATH} missing — Shopify Store Integration requires R1-10 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendShopifyStoreLog({
      event: "connector_initialization",
      level: "info",
      details: "R1-10 Shopify Store Marketplace Integration initialized",
    });
    return this.getState();
  }

  getState(): ShopifyStoreMarketplaceIntegrationState {
    if (!this.initializedAt) {
      throw new Error(
        "Shopify Store Marketplace Integration not initialized. Call initialize() first.",
      );
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getConnectorRecord();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-SHF-001",
      missionId: "R1-10",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      connectorRecord: record,
      health,
      performance,
    };
  }

  connectShopifyStore(input: ConnectShopifyStoreInput = {}): ShopifyStoreConnectorRunReport {
    return this.controller.connectShopifyStore(input);
  }

  testConnection(): ShopifyStoreConnectorRunReport {
    return this.controller.testConnection();
  }

  async routeShopifyStoreApi(input: RouteShopifyStoreApiInput): Promise<ShopifyStoreConnectorRunReport> {
    return this.controller.routeShopifyStoreApi(input);
  }

  handleShopifyStoreWebhook(input: HandleShopifyStoreWebhookInput): ShopifyStoreConnectorRunReport {
    return this.controller.handleShopifyStoreWebhook(input);
  }

  getLatestReport(): ShopifyStoreConnectorRunReport | null {
    return this.controller.getLatestReport();
  }

  getConnectorRecord() {
    return this.controller.getManager().getConnectorRecord();
  }

  updateConfiguration(
    overrides: Partial<ShopifyStoreMarketplaceIntegrationConfiguration>,
  ): ShopifyStoreMarketplaceIntegrationState {
    const next = buildShopifyStoreMarketplaceIntegrationConfiguration(this.bootstrap.repositoryRoot, {
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
        `Shopify connector status: ${state.status}`,
        `Authentication: ${state.health.authenticationStatus}`,
        `Connection: ${state.health.connectionStatus}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No Shopify connector operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ShopifyStoreCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.connectorRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      authenticationStatus: record?.authenticationStatus ?? null,
      connectionStatus: record?.connectionStatus ?? null,
      operationalState: record?.currentOperationalState ?? null,
      storeId: record?.storeId ?? null,
      storeDomain: record?.storeDomain ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      apiRequests: state.performance.apiRequests,
      frameworkRegistered: Boolean(record?.frameworkConnectorId),
      recentLogs: getShopifyStoreLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createShopifyStoreMarketplaceIntegrationEngine(
  bootstrap: EmpireBootstrapContext,
  marketplaceConnectorFramework: MarketplaceConnectorFrameworkEngine,
  options?: ShopifyStoreMarketplaceIntegrationOptions,
): ShopifyStoreMarketplaceIntegrationEngine {
  return new ShopifyStoreMarketplaceIntegrationEngine(
    bootstrap,
    marketplaceConnectorFramework,
    options,
  );
}

export function resetShopifyStoreMarketplaceIntegrationForTesting(): void {
  resetShopifyStoreLogsForTesting();
  new ShopifyStoreConnectorManager(null).resetForTesting();
}
