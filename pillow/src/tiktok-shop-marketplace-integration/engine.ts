import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { MarketplaceConnectorFrameworkEngine } from "../marketplace-connector-framework/engine.js";
import {
  buildTikTokShopMarketplaceIntegrationConfiguration,
  type TikTokShopMarketplaceIntegrationConfiguration,
} from "./configuration.js";
import {
  appendTikTokShopLog,
  getTikTokShopLogs,
  resetTikTokShopLogsForTesting,
} from "./tiktok-shop-logging.js";
import { TIKTOK_SHOP_MARKETPLACE_INTEGRATION_SYSTEM_PATH } from "./paths.js";
import type {
  TikTokShopCockpitSnapshot,
  TikTokShopConnectorRunReport,
  TikTokShopMarketplaceIntegrationState,
  ConnectTikTokShopInput,
  HandleTikTokShopEventInput,
  RouteTikTokShopApiInput,
} from "./types.js";
import { TikTokShopConnectorController } from "./tiktok-shop-connector-controller.js";
import { TikTokShopConnectorManager } from "./tiktok-shop-connector-manager.js";

export interface TikTokShopMarketplaceIntegrationOptions {
  configuration?: Partial<TikTokShopMarketplaceIntegrationConfiguration>;
}

/**
 * TikTok Shop Marketplace Integration (PILLOW-TTS-001 / R1-09).
 * TikTok Shop connector through MCF — structural Open API, no live HTTP.
 */
export class TikTokShopMarketplaceIntegrationEngine {
  private initializedAt: string | null = null;
  private readonly controller: TikTokShopConnectorController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    marketplaceConnectorFramework: MarketplaceConnectorFrameworkEngine,
    options: TikTokShopMarketplaceIntegrationOptions = {},
  ) {
    const config = buildTikTokShopMarketplaceIntegrationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new TikTokShopConnectorManager(marketplaceConnectorFramework);
    this.controller = new TikTokShopConnectorController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<TikTokShopMarketplaceIntegrationState> {
    const doc = await this.reader.readText(TIKTOK_SHOP_MARKETPLACE_INTEGRATION_SYSTEM_PATH);
    if (!doc?.includes("TikTok Shop Marketplace Integration")) {
      throw new Error(
        `${TIKTOK_SHOP_MARKETPLACE_INTEGRATION_SYSTEM_PATH} missing — TikTok Shop Integration requires R1-09 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendTikTokShopLog({
      event: "connector_initialization",
      level: "info",
      details: "R1-09 TikTok Shop Marketplace Integration initialized",
    });
    return this.getState();
  }

  getState(): TikTokShopMarketplaceIntegrationState {
    if (!this.initializedAt) {
      throw new Error(
        "TikTok Shop Marketplace Integration not initialized. Call initialize() first.",
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
      engineVersion: "PILLOW-TTS-001",
      missionId: "R1-09",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      connectorRecord: record,
      health,
      performance,
    };
  }

  connectTikTokShop(input: ConnectTikTokShopInput = {}): TikTokShopConnectorRunReport {
    return this.controller.connectTikTokShop(input);
  }

  testConnection(): TikTokShopConnectorRunReport {
    return this.controller.testConnection();
  }

  async routeTikTokShopApi(input: RouteTikTokShopApiInput): Promise<TikTokShopConnectorRunReport> {
    return this.controller.routeTikTokShopApi(input);
  }

  handleTikTokShopEvent(input: HandleTikTokShopEventInput): TikTokShopConnectorRunReport {
    return this.controller.handleTikTokShopEvent(input);
  }

  getLatestReport(): TikTokShopConnectorRunReport | null {
    return this.controller.getLatestReport();
  }

  getConnectorRecord() {
    return this.controller.getManager().getConnectorRecord();
  }

  updateConfiguration(
    overrides: Partial<TikTokShopMarketplaceIntegrationConfiguration>,
  ): TikTokShopMarketplaceIntegrationState {
    const next = buildTikTokShopMarketplaceIntegrationConfiguration(this.bootstrap.repositoryRoot, {
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
        `TikTok Shop connector status: ${state.status}`,
        `Authentication: ${state.health.authenticationStatus}`,
        `Connection: ${state.health.connectionStatus}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No TikTok Shop connector operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): TikTokShopCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.connectorRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      authenticationStatus: record?.authenticationStatus ?? null,
      connectionStatus: record?.connectionStatus ?? null,
      operationalState: record?.currentOperationalState ?? null,
      shopId: record?.shopId ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      apiRequests: state.performance.apiRequests,
      frameworkRegistered: Boolean(record?.frameworkConnectorId),
      recentLogs: getTikTokShopLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createTikTokShopMarketplaceIntegrationEngine(
  bootstrap: EmpireBootstrapContext,
  marketplaceConnectorFramework: MarketplaceConnectorFrameworkEngine,
  options?: TikTokShopMarketplaceIntegrationOptions,
): TikTokShopMarketplaceIntegrationEngine {
  return new TikTokShopMarketplaceIntegrationEngine(
    bootstrap,
    marketplaceConnectorFramework,
    options,
  );
}

export function resetTikTokShopMarketplaceIntegrationForTesting(): void {
  resetTikTokShopLogsForTesting();
  new TikTokShopConnectorManager(null).resetForTesting();
}
