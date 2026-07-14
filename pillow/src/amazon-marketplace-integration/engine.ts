import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { MarketplaceConnectorFrameworkEngine } from "../marketplace-connector-framework/engine.js";
import {
  buildAmazonMarketplaceIntegrationConfiguration,
  type AmazonMarketplaceIntegrationConfiguration,
} from "./configuration.js";
import {
  appendAmazonLog,
  getAmazonLogs,
  resetAmazonLogsForTesting,
} from "./amz-logging.js";
import { AMAZON_MARKETPLACE_INTEGRATION_SYSTEM_PATH } from "./paths.js";
import type {
  AmazonCockpitSnapshot,
  AmazonConnectorRunReport,
  AmazonMarketplaceIntegrationState,
  ConnectAmazonInput,
  HandleAmazonEventInput,
  RouteAmazonApiInput,
} from "./types.js";
import { AmazonConnectorController } from "./amazon-connector-controller.js";
import { AmazonConnectorManager } from "./amazon-connector-manager.js";

export interface AmazonMarketplaceIntegrationOptions {
  configuration?: Partial<AmazonMarketplaceIntegrationConfiguration>;
}

/**
 * Amazon Marketplace Integration (PILLOW-AMZ-001 / R1-02).
 * Amazon connector through the Marketplace Connector Framework — structural SP-API, no live HTTP.
 */
export class AmazonMarketplaceIntegrationEngine {
  private initializedAt: string | null = null;
  private readonly controller: AmazonConnectorController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    marketplaceConnectorFramework: MarketplaceConnectorFrameworkEngine,
    options: AmazonMarketplaceIntegrationOptions = {},
  ) {
    const config = buildAmazonMarketplaceIntegrationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new AmazonConnectorManager(marketplaceConnectorFramework);
    this.controller = new AmazonConnectorController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<AmazonMarketplaceIntegrationState> {
    const doc = await this.reader.readText(AMAZON_MARKETPLACE_INTEGRATION_SYSTEM_PATH);
    if (!doc?.includes("Amazon Marketplace Integration")) {
      throw new Error(
        `${AMAZON_MARKETPLACE_INTEGRATION_SYSTEM_PATH} missing — Amazon Marketplace Integration requires R1-02 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendAmazonLog({
      event: "connector_initialization",
      level: "info",
      details: "R1-02 Amazon Marketplace Integration initialized",
    });
    return this.getState();
  }

  getState(): AmazonMarketplaceIntegrationState {
    if (!this.initializedAt) {
      throw new Error(
        "Amazon Marketplace Integration not initialized. Call initialize() first.",
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
      engineVersion: "PILLOW-AMZ-001",
      missionId: "R1-02",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      connectorRecord: record,
      health,
      performance,
    };
  }

  connectAmazon(input: ConnectAmazonInput = {}): AmazonConnectorRunReport {
    return this.controller.connectAmazon(input);
  }

  testConnection(): AmazonConnectorRunReport {
    return this.controller.testConnection();
  }

  async routeAmazonApi(input: RouteAmazonApiInput): Promise<AmazonConnectorRunReport> {
    return this.controller.routeAmazonApi(input);
  }

  handleAmazonEvent(input: HandleAmazonEventInput): AmazonConnectorRunReport {
    return this.controller.handleAmazonEvent(input);
  }

  getLatestReport(): AmazonConnectorRunReport | null {
    return this.controller.getLatestReport();
  }

  getConnectorRecord() {
    return this.controller.getManager().getConnectorRecord();
  }

  updateConfiguration(
    overrides: Partial<AmazonMarketplaceIntegrationConfiguration>,
  ): AmazonMarketplaceIntegrationState {
    const next = buildAmazonMarketplaceIntegrationConfiguration(this.bootstrap.repositoryRoot, {
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
        `Amazon connector status: ${state.status}`,
        `Authentication: ${state.health.authenticationStatus}`,
        `Connection: ${state.health.connectionStatus}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No Amazon connector operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): AmazonCockpitSnapshot {
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
      recentLogs: getAmazonLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createAmazonMarketplaceIntegrationEngine(
  bootstrap: EmpireBootstrapContext,
  marketplaceConnectorFramework: MarketplaceConnectorFrameworkEngine,
  options?: AmazonMarketplaceIntegrationOptions,
): AmazonMarketplaceIntegrationEngine {
  return new AmazonMarketplaceIntegrationEngine(
    bootstrap,
    marketplaceConnectorFramework,
    options,
  );
}

export function resetAmazonMarketplaceIntegrationForTesting(): void {
  resetAmazonLogsForTesting();
  new AmazonConnectorManager(null).resetForTesting();
}
