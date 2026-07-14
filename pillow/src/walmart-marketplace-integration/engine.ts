import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { MarketplaceConnectorFrameworkEngine } from "../marketplace-connector-framework/engine.js";
import {
  buildWalmartMarketplaceIntegrationConfiguration,
  type WalmartMarketplaceIntegrationConfiguration,
} from "./configuration.js";
import {
  appendWalmartLog,
  getWalmartLogs,
  resetWalmartLogsForTesting,
} from "./wmt-logging.js";
import { WALMART_MARKETPLACE_INTEGRATION_SYSTEM_PATH } from "./paths.js";
import type {
  WalmartCockpitSnapshot,
  WalmartConnectorRunReport,
  WalmartMarketplaceIntegrationState,
  ConnectWalmartInput,
  RouteWalmartApiInput,
} from "./types.js";
import { WalmartConnectorController } from "./walmart-connector-controller.js";
import { WalmartConnectorManager } from "./walmart-connector-manager.js";

export interface WalmartMarketplaceIntegrationOptions {
  configuration?: Partial<WalmartMarketplaceIntegrationConfiguration>;
}

/**
 * Walmart Marketplace Integration (PILLOW-WMT-001 / R1-06).
 * Walmart connector through the Marketplace Connector Framework — structural API, no live HTTP.
 */
export class WalmartMarketplaceIntegrationEngine {
  private initializedAt: string | null = null;
  private readonly controller: WalmartConnectorController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    marketplaceConnectorFramework: MarketplaceConnectorFrameworkEngine,
    options: WalmartMarketplaceIntegrationOptions = {},
  ) {
    const config = buildWalmartMarketplaceIntegrationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new WalmartConnectorManager(marketplaceConnectorFramework);
    this.controller = new WalmartConnectorController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<WalmartMarketplaceIntegrationState> {
    const doc = await this.reader.readText(WALMART_MARKETPLACE_INTEGRATION_SYSTEM_PATH);
    if (!doc?.includes("Walmart Marketplace Integration")) {
      throw new Error(
        `${WALMART_MARKETPLACE_INTEGRATION_SYSTEM_PATH} missing — Walmart Marketplace Integration requires R1-06 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendWalmartLog({
      event: "connector_initialization",
      level: "info",
      details: "R1-06 Walmart Marketplace Integration initialized",
    });
    return this.getState();
  }

  getState(): WalmartMarketplaceIntegrationState {
    if (!this.initializedAt) {
      throw new Error(
        "Walmart Marketplace Integration not initialized. Call initialize() first.",
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
      engineVersion: "PILLOW-WMT-001",
      missionId: "R1-06",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      connectorRecord: record,
      health,
      performance,
    };
  }

  connectWalmart(input: ConnectWalmartInput = {}): WalmartConnectorRunReport {
    return this.controller.connectWalmart(input);
  }

  testConnection(): WalmartConnectorRunReport {
    return this.controller.testConnection();
  }

  async routeWalmartApi(input: RouteWalmartApiInput): Promise<WalmartConnectorRunReport> {
    return this.controller.routeWalmartApi(input);
  }

  getLatestReport(): WalmartConnectorRunReport | null {
    return this.controller.getLatestReport();
  }

  getConnectorRecord() {
    return this.controller.getManager().getConnectorRecord();
  }

  updateConfiguration(
    overrides: Partial<WalmartMarketplaceIntegrationConfiguration>,
  ): WalmartMarketplaceIntegrationState {
    const next = buildWalmartMarketplaceIntegrationConfiguration(this.bootstrap.repositoryRoot, {
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
        `Walmart connector status: ${state.status}`,
        `Authentication: ${state.health.authenticationStatus}`,
        `Connection: ${state.health.connectionStatus}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No Walmart connector operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): WalmartCockpitSnapshot {
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
      recentLogs: getWalmartLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createWalmartMarketplaceIntegrationEngine(
  bootstrap: EmpireBootstrapContext,
  marketplaceConnectorFramework: MarketplaceConnectorFrameworkEngine,
  options?: WalmartMarketplaceIntegrationOptions,
): WalmartMarketplaceIntegrationEngine {
  return new WalmartMarketplaceIntegrationEngine(
    bootstrap,
    marketplaceConnectorFramework,
    options,
  );
}

export function resetWalmartMarketplaceIntegrationForTesting(): void {
  resetWalmartLogsForTesting();
  new WalmartConnectorManager(null).resetForTesting();
}
