import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildMarketplaceConnectorFrameworkConfiguration,
  type MarketplaceConnectorFrameworkConfiguration,
} from "./configuration.js";
import {
  appendFrameworkLog,
  getFrameworkLogs,
  resetFrameworkLogsForTesting,
} from "./mcf-logging.js";
import { MARKETPLACE_CONNECTOR_FRAMEWORK_SYSTEM_PATH } from "./paths.js";
import type {
  FrameworkCockpitSnapshot,
  FrameworkRunReport,
  HandleWebhookInput,
  MarketplaceConnectorFrameworkState,
  RegisterConnectorInput,
  RouteApiRequestInput,
} from "./types.js";
import { MarketplaceConnectorFrameworkController } from "./marketplace-connector-framework-controller.js";
import { MarketplaceConnectorFrameworkManager } from "./marketplace-connector-framework-manager.js";

export interface MarketplaceConnectorFrameworkOptions {
  configuration?: Partial<MarketplaceConnectorFrameworkConfiguration>;
}

/**
 * Marketplace Connector Framework (PILLOW-MCF-001 / R1-01).
 * Unified marketplace connector architecture — framework only, no live marketplace APIs.
 */
export class MarketplaceConnectorFrameworkEngine {
  private initializedAt: string | null = null;
  private readonly controller: MarketplaceConnectorFrameworkController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    options: MarketplaceConnectorFrameworkOptions = {},
  ) {
    const config = buildMarketplaceConnectorFrameworkConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new MarketplaceConnectorFrameworkController(config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<MarketplaceConnectorFrameworkState> {
    const doc = await this.reader.readText(MARKETPLACE_CONNECTOR_FRAMEWORK_SYSTEM_PATH);
    if (!doc?.includes("Marketplace Connector Framework")) {
      throw new Error(
        `${MARKETPLACE_CONNECTOR_FRAMEWORK_SYSTEM_PATH} missing — Marketplace Connector Framework requires R1-01 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendFrameworkLog({
      event: "marketplace_connector_framework_ready",
      level: "info",
      details: "R1-01 Marketplace Connector Framework initialized",
    });
    return this.getState();
  }

  getState(): MarketplaceConnectorFrameworkState {
    if (!this.initializedAt) {
      throw new Error(
        "Marketplace Connector Framework not initialized. Call initialize() first.",
      );
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const connectors = this.controller.getManager().getConnectors();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      connectors,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-MCF-001",
      missionId: "R1-01",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      registeredConnectors: connectors,
      health,
      performance,
    };
  }

  registerConnector(input: RegisterConnectorInput): FrameworkRunReport {
    return this.controller.registerConnector(input);
  }

  activateConnector(marketplaceId: string): FrameworkRunReport {
    return this.controller.activateConnector(marketplaceId);
  }

  suspendConnector(marketplaceId: string): FrameworkRunReport {
    return this.controller.suspendConnector(marketplaceId);
  }

  shutdownConnector(marketplaceId: string): FrameworkRunReport {
    return this.controller.shutdownConnector(marketplaceId);
  }

  async routeApiRequest(input: RouteApiRequestInput): Promise<FrameworkRunReport> {
    return this.controller.routeApiRequest(input);
  }

  handleWebhook(input: HandleWebhookInput): FrameworkRunReport {
    return this.controller.handleWebhook(input);
  }

  getLatestReport(): FrameworkRunReport | null {
    return this.controller.getLatestReport();
  }

  getRegisteredConnectors() {
    return this.controller.getManager().getConnectors();
  }

  updateConfiguration(
    overrides: Partial<MarketplaceConnectorFrameworkConfiguration>,
  ): MarketplaceConnectorFrameworkState {
    const next = buildMarketplaceConnectorFrameworkConfiguration(this.bootstrap.repositoryRoot, {
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
        `Framework status: ${state.status}`,
        `Registered connectors: ${state.registeredConnectors.length}`,
        `Active connectors: ${state.health.activeConnectors}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No framework operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): FrameworkCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      registeredConnectorCount: state.registeredConnectors.length,
      activeConnectorCount: state.health.activeConnectors,
      totalApiRequests: state.performance.totalApiRequests,
      rateLimitedRequests: state.performance.rateLimitedRequests,
      recoveryAttempts: state.health.recoveryAttempts,
      recentLogs: getFrameworkLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createMarketplaceConnectorFrameworkEngine(
  bootstrap: EmpireBootstrapContext,
  options?: MarketplaceConnectorFrameworkOptions,
): MarketplaceConnectorFrameworkEngine {
  return new MarketplaceConnectorFrameworkEngine(bootstrap, options);
}

export function resetMarketplaceConnectorFrameworkForTesting(): void {
  resetFrameworkLogsForTesting();
  new MarketplaceConnectorFrameworkManager().resetForTesting();
}
