import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { MarketplaceConnectorFrameworkEngine } from "../marketplace-connector-framework/engine.js";
import {
  buildEtsyMarketplaceIntegrationConfiguration,
  type EtsyMarketplaceIntegrationConfiguration,
} from "./configuration.js";
import {
  appendEtsyLog,
  getEtsyLogs,
  resetEtsyLogsForTesting,
} from "./etsy-logging.js";
import { ETSY_MARKETPLACE_INTEGRATION_SYSTEM_PATH } from "./paths.js";
import type {
  EtsyCockpitSnapshot,
  EtsyConnectorRunReport,
  EtsyMarketplaceIntegrationState,
  ConnectEtsyInput,
  HandleEtsyEventInput,
  RouteEtsyApiInput,
} from "./types.js";
import { EtsyConnectorController } from "./etsy-connector-controller.js";
import { EtsyConnectorManager } from "./etsy-connector-manager.js";

export interface EtsyMarketplaceIntegrationOptions {
  configuration?: Partial<EtsyMarketplaceIntegrationConfiguration>;
}

/**
 * Etsy Marketplace Integration (PILLOW-ETSY-001 / R1-07).
 * Etsy connector through the Marketplace Connector Framework — structural Open API, no live HTTP.
 */
export class EtsyMarketplaceIntegrationEngine {
  private initializedAt: string | null = null;
  private readonly controller: EtsyConnectorController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    marketplaceConnectorFramework: MarketplaceConnectorFrameworkEngine,
    options: EtsyMarketplaceIntegrationOptions = {},
  ) {
    const config = buildEtsyMarketplaceIntegrationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new EtsyConnectorManager(marketplaceConnectorFramework);
    this.controller = new EtsyConnectorController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<EtsyMarketplaceIntegrationState> {
    const doc = await this.reader.readText(ETSY_MARKETPLACE_INTEGRATION_SYSTEM_PATH);
    if (!doc?.includes("Etsy Marketplace Integration")) {
      throw new Error(
        `${ETSY_MARKETPLACE_INTEGRATION_SYSTEM_PATH} missing — Etsy Marketplace Integration requires R1-07 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendEtsyLog({
      event: "connector_initialization",
      level: "info",
      details: "R1-07 Etsy Marketplace Integration initialized",
    });
    return this.getState();
  }

  getState(): EtsyMarketplaceIntegrationState {
    if (!this.initializedAt) {
      throw new Error(
        "Etsy Marketplace Integration not initialized. Call initialize() first.",
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
      engineVersion: "PILLOW-ETSY-001",
      missionId: "R1-07",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      connectorRecord: record,
      health,
      performance,
    };
  }

  connectEtsy(input: ConnectEtsyInput = {}): EtsyConnectorRunReport {
    return this.controller.connectEtsy(input);
  }

  testConnection(): EtsyConnectorRunReport {
    return this.controller.testConnection();
  }

  async routeEtsyApi(input: RouteEtsyApiInput): Promise<EtsyConnectorRunReport> {
    return this.controller.routeEtsyApi(input);
  }

  handleEtsyEvent(input: HandleEtsyEventInput): EtsyConnectorRunReport {
    return this.controller.handleEtsyEvent(input);
  }

  getLatestReport(): EtsyConnectorRunReport | null {
    return this.controller.getLatestReport();
  }

  getConnectorRecord() {
    return this.controller.getManager().getConnectorRecord();
  }

  updateConfiguration(
    overrides: Partial<EtsyMarketplaceIntegrationConfiguration>,
  ): EtsyMarketplaceIntegrationState {
    const next = buildEtsyMarketplaceIntegrationConfiguration(this.bootstrap.repositoryRoot, {
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
        `Etsy connector status: ${state.status}`,
        `Authentication: ${state.health.authenticationStatus}`,
        `Connection: ${state.health.connectionStatus}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No Etsy connector operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): EtsyCockpitSnapshot {
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
      recentLogs: getEtsyLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createEtsyMarketplaceIntegrationEngine(
  bootstrap: EmpireBootstrapContext,
  marketplaceConnectorFramework: MarketplaceConnectorFrameworkEngine,
  options?: EtsyMarketplaceIntegrationOptions,
): EtsyMarketplaceIntegrationEngine {
  return new EtsyMarketplaceIntegrationEngine(
    bootstrap,
    marketplaceConnectorFramework,
    options,
  );
}

export function resetEtsyMarketplaceIntegrationForTesting(): void {
  resetEtsyLogsForTesting();
  new EtsyConnectorManager(null).resetForTesting();
}
