import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { MarketplaceConnectorFrameworkEngine } from "../marketplace-connector-framework/engine.js";
import {
  buildWooCommerceMarketplaceIntegrationConfiguration,
  type WooCommerceMarketplaceIntegrationConfiguration,
} from "./configuration.js";
import {
  appendWooCommerceLog,
  getWooCommerceLogs,
  resetWooCommerceLogsForTesting,
} from "./woocommerce-logging.js";
import { WOOCOMMERCE_MARKETPLACE_INTEGRATION_SYSTEM_PATH } from "./paths.js";
import type {
  WooCommerceCockpitSnapshot,
  WooCommerceConnectorRunReport,
  WooCommerceMarketplaceIntegrationState,
  ConnectWooCommerceInput,
  HandleWooCommerceWebhookInput,
  RouteWooCommerceApiInput,
} from "./types.js";
import { WooCommerceConnectorController } from "./woocommerce-connector-controller.js";
import { WooCommerceConnectorManager } from "./woocommerce-connector-manager.js";

export interface WooCommerceMarketplaceIntegrationOptions {
  configuration?: Partial<WooCommerceMarketplaceIntegrationConfiguration>;
}

/**
 * WooCommerce Marketplace Integration (PILLOW-WOO-001 / R1-11).
 * WooCommerce connector through MCF — structural REST API, no live HTTP.
 */
export class WooCommerceMarketplaceIntegrationEngine {
  private initializedAt: string | null = null;
  private readonly controller: WooCommerceConnectorController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    marketplaceConnectorFramework: MarketplaceConnectorFrameworkEngine,
    options: WooCommerceMarketplaceIntegrationOptions = {},
  ) {
    const config = buildWooCommerceMarketplaceIntegrationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new WooCommerceConnectorManager(marketplaceConnectorFramework);
    this.controller = new WooCommerceConnectorController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<WooCommerceMarketplaceIntegrationState> {
    const doc = await this.reader.readText(WOOCOMMERCE_MARKETPLACE_INTEGRATION_SYSTEM_PATH);
    if (!doc?.includes("WooCommerce Marketplace Integration")) {
      throw new Error(
        `${WOOCOMMERCE_MARKETPLACE_INTEGRATION_SYSTEM_PATH} missing — WooCommerce Integration requires R1-11 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendWooCommerceLog({
      event: "connector_initialization",
      level: "info",
      details: "R1-11 WooCommerce Marketplace Integration initialized",
    });
    return this.getState();
  }

  getState(): WooCommerceMarketplaceIntegrationState {
    if (!this.initializedAt) {
      throw new Error(
        "WooCommerce Marketplace Integration not initialized. Call initialize() first.",
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
      engineVersion: "PILLOW-WOO-001",
      missionId: "R1-11",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      connectorRecord: record,
      health,
      performance,
    };
  }

  connectWooCommerce(input: ConnectWooCommerceInput = {}): WooCommerceConnectorRunReport {
    return this.controller.connectWooCommerce(input);
  }

  testConnection(): WooCommerceConnectorRunReport {
    return this.controller.testConnection();
  }

  async routeWooCommerceApi(input: RouteWooCommerceApiInput): Promise<WooCommerceConnectorRunReport> {
    return this.controller.routeWooCommerceApi(input);
  }

  handleWooCommerceWebhook(input: HandleWooCommerceWebhookInput): WooCommerceConnectorRunReport {
    return this.controller.handleWooCommerceWebhook(input);
  }

  getLatestReport(): WooCommerceConnectorRunReport | null {
    return this.controller.getLatestReport();
  }

  getConnectorRecord() {
    return this.controller.getManager().getConnectorRecord();
  }

  updateConfiguration(
    overrides: Partial<WooCommerceMarketplaceIntegrationConfiguration>,
  ): WooCommerceMarketplaceIntegrationState {
    const next = buildWooCommerceMarketplaceIntegrationConfiguration(this.bootstrap.repositoryRoot, {
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
        `WooCommerce connector status: ${state.status}`,
        `Authentication: ${state.health.authenticationStatus}`,
        `Connection: ${state.health.connectionStatus}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No WooCommerce connector operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): WooCommerceCockpitSnapshot {
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
      storeUrl: record?.storeUrl ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      apiRequests: state.performance.apiRequests,
      frameworkRegistered: Boolean(record?.frameworkConnectorId),
      recentLogs: getWooCommerceLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createWooCommerceMarketplaceIntegrationEngine(
  bootstrap: EmpireBootstrapContext,
  marketplaceConnectorFramework: MarketplaceConnectorFrameworkEngine,
  options?: WooCommerceMarketplaceIntegrationOptions,
): WooCommerceMarketplaceIntegrationEngine {
  return new WooCommerceMarketplaceIntegrationEngine(
    bootstrap,
    marketplaceConnectorFramework,
    options,
  );
}

export function resetWooCommerceMarketplaceIntegrationForTesting(): void {
  resetWooCommerceLogsForTesting();
  new WooCommerceConnectorManager(null).resetForTesting();
}
