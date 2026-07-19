import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { SupplierFrameworkEngine } from "../supplier-framework/engine.js";
import {
  buildOss1688IntegrationConfiguration,
  type Oss1688IntegrationConfiguration,
} from "./configuration.js";
import { appendOssLog, getOssLogs, resetOssLogsForTesting } from "./oss-logging.js";
import { OSS1688_INTEGRATION_SYSTEM_PATH } from "./paths.js";
import type {
  Oss1688CockpitSnapshot,
  Oss1688ConnectorRunReport,
  Oss1688IntegrationState,
  ConnectOss1688Input,
  RouteOss1688ApiInput,
  HandleOss1688WebhookInput,
} from "./types.js";
import { Oss1688ConnectorController } from "./oss1688-connector-controller.js";
import { Oss1688ConnectorManager } from "./oss1688-connector-manager.js";

export interface Oss1688IntegrationOptions {
  configuration?: Partial<Oss1688IntegrationConfiguration>;
}

/**
 * 1688 Integration (PILLOW-1688-001 / R2-04).
 * 1688 connector through the Supplier Framework — structural API, no live HTTP.
 */
export class Oss1688IntegrationEngine {
  private initializedAt: string | null = null;
  private readonly controller: Oss1688ConnectorController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    supplierFramework: SupplierFrameworkEngine,
    options: Oss1688IntegrationOptions = {},
  ) {
    const config = buildOss1688IntegrationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new Oss1688ConnectorManager(supplierFramework);
    this.controller = new Oss1688ConnectorController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<Oss1688IntegrationState> {
    const doc = await this.reader.readText(OSS1688_INTEGRATION_SYSTEM_PATH);
    if (!doc?.includes("1688 Integration")) {
      throw new Error(
        `${OSS1688_INTEGRATION_SYSTEM_PATH} missing — 1688 Integration requires R2-04 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendOssLog({
      event: "connector_initialization",
      level: "info",
      details: "R2-04 1688 Integration initialized",
    });
    return this.getState();
  }

  getState(): Oss1688IntegrationState {
    if (!this.initializedAt) {
      throw new Error("1688 Integration not initialized. Call initialize() first.");
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
      engineVersion: "PILLOW-1688-001",
      missionId: "R2-04",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      connectorRecord: record,
      health,
      performance,
    };
  }

  connectOss1688(input: ConnectOss1688Input = {}): Oss1688ConnectorRunReport {
    return this.controller.connectOss1688(input);
  }

  testConnection(): Oss1688ConnectorRunReport {
    return this.controller.testConnection();
  }

  async routeOss1688Api(input: RouteOss1688ApiInput): Promise<Oss1688ConnectorRunReport> {
    return this.controller.routeOss1688Api(input);
  }

  handleOss1688Webhook(input: HandleOss1688WebhookInput): Oss1688ConnectorRunReport {
    return this.controller.handleOss1688Webhook(input);
  }

  getLatestReport(): Oss1688ConnectorRunReport | null {
    return this.controller.getLatestReport();
  }

  getConnectorRecord() {
    return this.controller.getManager().getConnectorRecord();
  }

  updateConfiguration(
    overrides: Partial<Oss1688IntegrationConfiguration>,
  ): Oss1688IntegrationState {
    const next = buildOss1688IntegrationConfiguration(this.bootstrap.repositoryRoot, {
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
        `1688 connector status: ${state.status}`,
        `Authentication: ${state.health.authenticationStatus}`,
        `Connection: ${state.health.connectionStatus}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No 1688 connector operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): Oss1688CockpitSnapshot {
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
      recentLogs: getOssLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createOss1688IntegrationEngine(
  bootstrap: EmpireBootstrapContext,
  supplierFramework: SupplierFrameworkEngine,
  options?: Oss1688IntegrationOptions,
): Oss1688IntegrationEngine {
  return new Oss1688IntegrationEngine(bootstrap, supplierFramework, options);
}

export function resetOss1688IntegrationForTesting(): void {
  resetOssLogsForTesting();
  new Oss1688ConnectorManager(null).resetForTesting();
}
