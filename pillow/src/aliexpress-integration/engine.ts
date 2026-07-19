import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { SupplierFrameworkEngine } from "../supplier-framework/engine.js";
import {
  buildAliExpressIntegrationConfiguration,
  type AliExpressIntegrationConfiguration,
} from "./configuration.js";
import { appendAexLog, getAexLogs, resetAexLogsForTesting } from "./aex-logging.js";
import { ALIEXPRESS_INTEGRATION_SYSTEM_PATH } from "./paths.js";
import type {
  AliExpressCockpitSnapshot,
  AliExpressConnectorRunReport,
  AliExpressIntegrationState,
  ConnectAliExpressInput,
  RouteAliExpressApiInput,
  HandleAliExpressWebhookInput,
} from "./types.js";
import { AliExpressConnectorController } from "./aliexpress-connector-controller.js";
import { AliExpressConnectorManager } from "./aliexpress-connector-manager.js";

export interface AliExpressIntegrationOptions {
  configuration?: Partial<AliExpressIntegrationConfiguration>;
}

/**
 * AliExpress Integration (PILLOW-AEX-001 / R2-03).
 * AliExpress connector through the Supplier Framework — structural API, no live HTTP.
 */
export class AliExpressIntegrationEngine {
  private initializedAt: string | null = null;
  private readonly controller: AliExpressConnectorController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    supplierFramework: SupplierFrameworkEngine,
    options: AliExpressIntegrationOptions = {},
  ) {
    const config = buildAliExpressIntegrationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new AliExpressConnectorManager(supplierFramework);
    this.controller = new AliExpressConnectorController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<AliExpressIntegrationState> {
    const doc = await this.reader.readText(ALIEXPRESS_INTEGRATION_SYSTEM_PATH);
    if (!doc?.includes("AliExpress Integration")) {
      throw new Error(
        `${ALIEXPRESS_INTEGRATION_SYSTEM_PATH} missing — AliExpress Integration requires R2-03 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendAexLog({
      event: "connector_initialization",
      level: "info",
      details: "R2-03 AliExpress Integration initialized",
    });
    return this.getState();
  }

  getState(): AliExpressIntegrationState {
    if (!this.initializedAt) {
      throw new Error("AliExpress Integration not initialized. Call initialize() first.");
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
      engineVersion: "PILLOW-AEX-001",
      missionId: "R2-03",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      connectorRecord: record,
      health,
      performance,
    };
  }

  connectAliExpress(input: ConnectAliExpressInput = {}): AliExpressConnectorRunReport {
    return this.controller.connectAliExpress(input);
  }

  testConnection(): AliExpressConnectorRunReport {
    return this.controller.testConnection();
  }

  async routeAliExpressApi(input: RouteAliExpressApiInput): Promise<AliExpressConnectorRunReport> {
    return this.controller.routeAliExpressApi(input);
  }

  handleAliExpressWebhook(input: HandleAliExpressWebhookInput): AliExpressConnectorRunReport {
    return this.controller.handleAliExpressWebhook(input);
  }

  getLatestReport(): AliExpressConnectorRunReport | null {
    return this.controller.getLatestReport();
  }

  getConnectorRecord() {
    return this.controller.getManager().getConnectorRecord();
  }

  updateConfiguration(
    overrides: Partial<AliExpressIntegrationConfiguration>,
  ): AliExpressIntegrationState {
    const next = buildAliExpressIntegrationConfiguration(this.bootstrap.repositoryRoot, {
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
        `AliExpress connector status: ${state.status}`,
        `Authentication: ${state.health.authenticationStatus}`,
        `Connection: ${state.health.connectionStatus}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No AliExpress connector operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): AliExpressCockpitSnapshot {
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
      frameworkRegistered: Boolean(record?.frameworkSupplierId),
      recentLogs: getAexLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createAliExpressIntegrationEngine(
  bootstrap: EmpireBootstrapContext,
  supplierFramework: SupplierFrameworkEngine,
  options?: AliExpressIntegrationOptions,
): AliExpressIntegrationEngine {
  return new AliExpressIntegrationEngine(bootstrap, supplierFramework, options);
}

export function resetAliExpressIntegrationForTesting(): void {
  resetAexLogsForTesting();
  new AliExpressConnectorManager(null).resetForTesting();
}
