import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { SupplierFrameworkEngine } from "../supplier-framework/engine.js";
import {
  buildCjDropshippingIntegrationConfiguration,
  type CjDropshippingIntegrationConfiguration,
} from "./configuration.js";
import { appendCjLog, getCjLogs, resetCjLogsForTesting } from "./cj-logging.js";
import { CJDROPSHIPPING_INTEGRATION_SYSTEM_PATH } from "./paths.js";
import type {
  CjCockpitSnapshot,
  CjConnectorRunReport,
  CjDropshippingIntegrationState,
  ConnectCjDropshippingInput,
  RouteCjApiInput,
  HandleCjWebhookInput,
} from "./types.js";
import { CjConnectorController } from "./cj-connector-controller.js";
import { CjConnectorManager } from "./cj-connector-manager.js";

export interface CjDropshippingIntegrationOptions {
  configuration?: Partial<CjDropshippingIntegrationConfiguration>;
}

/**
 * CJdropshipping Integration (PILLOW-CJ-001 / R2-02).
 * CJdropshipping connector through the Supplier Framework — structural API, no live HTTP.
 */
export class CjDropshippingIntegrationEngine {
  private initializedAt: string | null = null;
  private readonly controller: CjConnectorController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    supplierFramework: SupplierFrameworkEngine,
    options: CjDropshippingIntegrationOptions = {},
  ) {
    const config = buildCjDropshippingIntegrationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new CjConnectorManager(supplierFramework);
    this.controller = new CjConnectorController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<CjDropshippingIntegrationState> {
    const doc = await this.reader.readText(CJDROPSHIPPING_INTEGRATION_SYSTEM_PATH);
    if (!doc?.includes("CJdropshipping Integration")) {
      throw new Error(
        `${CJDROPSHIPPING_INTEGRATION_SYSTEM_PATH} missing — CJdropshipping Integration requires R2-02 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendCjLog({
      event: "connector_initialization",
      level: "info",
      details: "R2-02 CJdropshipping Integration initialized",
    });
    return this.getState();
  }

  getState(): CjDropshippingIntegrationState {
    if (!this.initializedAt) {
      throw new Error("CJdropshipping Integration not initialized. Call initialize() first.");
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
      engineVersion: "PILLOW-CJ-001",
      missionId: "R2-02",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      connectorRecord: record,
      health,
      performance,
    };
  }

  connectCjDropshipping(input: ConnectCjDropshippingInput = {}): CjConnectorRunReport {
    return this.controller.connectCjDropshipping(input);
  }

  testConnection(): CjConnectorRunReport {
    return this.controller.testConnection();
  }

  async routeCjApi(input: RouteCjApiInput): Promise<CjConnectorRunReport> {
    return this.controller.routeCjApi(input);
  }

  handleCjWebhook(input: HandleCjWebhookInput): CjConnectorRunReport {
    return this.controller.handleCjWebhook(input);
  }

  getLatestReport(): CjConnectorRunReport | null {
    return this.controller.getLatestReport();
  }

  getConnectorRecord() {
    return this.controller.getManager().getConnectorRecord();
  }

  updateConfiguration(
    overrides: Partial<CjDropshippingIntegrationConfiguration>,
  ): CjDropshippingIntegrationState {
    const next = buildCjDropshippingIntegrationConfiguration(this.bootstrap.repositoryRoot, {
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
        `CJdropshipping connector status: ${state.status}`,
        `Authentication: ${state.health.authenticationStatus}`,
        `Connection: ${state.health.connectionStatus}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No CJdropshipping connector operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): CjCockpitSnapshot {
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
      recentLogs: getCjLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createCjDropshippingIntegrationEngine(
  bootstrap: EmpireBootstrapContext,
  supplierFramework: SupplierFrameworkEngine,
  options?: CjDropshippingIntegrationOptions,
): CjDropshippingIntegrationEngine {
  return new CjDropshippingIntegrationEngine(bootstrap, supplierFramework, options);
}

export function resetCjDropshippingIntegrationForTesting(): void {
  resetCjLogsForTesting();
  new CjConnectorManager(null).resetForTesting();
}
