import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { MarketplaceConnectorFrameworkEngine } from "../marketplace-connector-framework/engine.js";
import {
  buildEbayMarketplaceIntegrationConfiguration,
  type EbayMarketplaceIntegrationConfiguration,
} from "./configuration.js";
import {
  appendEbayLog,
  getEbayLogs,
  resetEbayLogsForTesting,
} from "./ebay-logging.js";
import { EBAY_MARKETPLACE_INTEGRATION_SYSTEM_PATH } from "./paths.js";
import type {
  EbayCockpitSnapshot,
  EbayConnectorRunReport,
  EbayMarketplaceIntegrationState,
  ConnectEbayInput,
  HandleEbayEventInput,
  RouteEbayApiInput,
} from "./types.js";
import { EbayConnectorController } from "./ebay-connector-controller.js";
import { EbayConnectorManager } from "./ebay-connector-manager.js";

export interface EbayMarketplaceIntegrationOptions {
  configuration?: Partial<EbayMarketplaceIntegrationConfiguration>;
}

/**
 * eBay Marketplace Integration (PILLOW-EBAY-001 / R1-08).
 * eBay connector through the Marketplace Connector Framework — structural REST API, no live HTTP.
 */
export class EbayMarketplaceIntegrationEngine {
  private initializedAt: string | null = null;
  private readonly controller: EbayConnectorController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    marketplaceConnectorFramework: MarketplaceConnectorFrameworkEngine,
    options: EbayMarketplaceIntegrationOptions = {},
  ) {
    const config = buildEbayMarketplaceIntegrationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new EbayConnectorManager(marketplaceConnectorFramework);
    this.controller = new EbayConnectorController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<EbayMarketplaceIntegrationState> {
    const doc = await this.reader.readText(EBAY_MARKETPLACE_INTEGRATION_SYSTEM_PATH);
    if (!doc?.includes("eBay Marketplace Integration")) {
      throw new Error(
        `${EBAY_MARKETPLACE_INTEGRATION_SYSTEM_PATH} missing — eBay Marketplace Integration requires R1-08 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendEbayLog({
      event: "connector_initialization",
      level: "info",
      details: "R1-08 eBay Marketplace Integration initialized",
    });
    return this.getState();
  }

  getState(): EbayMarketplaceIntegrationState {
    if (!this.initializedAt) {
      throw new Error(
        "eBay Marketplace Integration not initialized. Call initialize() first.",
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
      engineVersion: "PILLOW-EBAY-001",
      missionId: "R1-08",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      connectorRecord: record,
      health,
      performance,
    };
  }

  connectEbay(input: ConnectEbayInput = {}): EbayConnectorRunReport {
    return this.controller.connectEbay(input);
  }

  testConnection(): EbayConnectorRunReport {
    return this.controller.testConnection();
  }

  async routeEbayApi(input: RouteEbayApiInput): Promise<EbayConnectorRunReport> {
    return this.controller.routeEbayApi(input);
  }

  handleEbayEvent(input: HandleEbayEventInput): EbayConnectorRunReport {
    return this.controller.handleEbayEvent(input);
  }

  getLatestReport(): EbayConnectorRunReport | null {
    return this.controller.getLatestReport();
  }

  getConnectorRecord() {
    return this.controller.getManager().getConnectorRecord();
  }

  updateConfiguration(
    overrides: Partial<EbayMarketplaceIntegrationConfiguration>,
  ): EbayMarketplaceIntegrationState {
    const next = buildEbayMarketplaceIntegrationConfiguration(this.bootstrap.repositoryRoot, {
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
        `eBay connector status: ${state.status}`,
        `Authentication: ${state.health.authenticationStatus}`,
        `Connection: ${state.health.connectionStatus}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No eBay connector operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): EbayCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.connectorRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      authenticationStatus: record?.authenticationStatus ?? null,
      connectionStatus: record?.connectionStatus ?? null,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      apiRequests: state.performance.apiRequests,
      frameworkRegistered: Boolean(record?.frameworkConnectorId),
      recentLogs: getEbayLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createEbayMarketplaceIntegrationEngine(
  bootstrap: EmpireBootstrapContext,
  marketplaceConnectorFramework: MarketplaceConnectorFrameworkEngine,
  options?: EbayMarketplaceIntegrationOptions,
): EbayMarketplaceIntegrationEngine {
  return new EbayMarketplaceIntegrationEngine(
    bootstrap,
    marketplaceConnectorFramework,
    options,
  );
}

export function resetEbayMarketplaceIntegrationForTesting(): void {
  resetEbayLogsForTesting();
  new EbayConnectorManager(null).resetForTesting();
}
