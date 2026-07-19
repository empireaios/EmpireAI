import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { MarketplaceConnectorFrameworkEngine } from "../marketplace-connector-framework/engine.js";
import type { MarketplaceProductNormalizationEngine } from "../marketplace-product-normalization/engine.js";
import type { MarketplaceOrderNormalizationEngine } from "../marketplace-order-normalization/engine.js";
import {
  buildMarketplaceHealthMonitorConfiguration,
  type MarketplaceHealthMonitorConfiguration,
} from "./configuration.js";
import {
  appendHealthMonitorLog,
  getHealthMonitorLogs,
  resetHealthMonitorLogsForTesting,
} from "./mhm-logging.js";
import { MARKETPLACE_HEALTH_MONITOR_SYSTEM_PATH, HEALTH_RECORD_SCHEMA_VERSION } from "./paths.js";
import type {
  DetectFailuresInput,
  MarketplaceHealthCockpitSnapshot,
  MarketplaceHealthCheckReport,
  MarketplaceHealthMonitorState,
  RunHealthCheckInput,
} from "./types.js";
import { MarketplaceHealthMonitorController } from "./marketplace-health-monitor-controller.js";
import { MarketplaceHealthMonitorManager } from "./marketplace-health-monitor-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface MarketplaceHealthMonitorOptions {
  configuration?: Partial<MarketplaceHealthMonitorConfiguration>;
}

/**
 * Marketplace Health Monitor (PILLOW-MHM-001 / R1-14).
 * Monitors marketplace connectors and normalization pipelines — consumes R1-01 through R1-13.
 */
export class MarketplaceHealthMonitorEngine {
  private initializedAt: string | null = null;
  private readonly controller: MarketplaceHealthMonitorController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    marketplaceConnectorFramework: MarketplaceConnectorFrameworkEngine,
    productNormalization: MarketplaceProductNormalizationEngine | null = null,
    orderNormalization: MarketplaceOrderNormalizationEngine | null = null,
    options: MarketplaceHealthMonitorOptions = {},
  ) {
    const config = buildMarketplaceHealthMonitorConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new MarketplaceHealthMonitorManager(
      marketplaceConnectorFramework,
      productNormalization,
      orderNormalization,
    );
    this.controller = new MarketplaceHealthMonitorController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<MarketplaceHealthMonitorState> {
    const doc = await this.reader.readText(MARKETPLACE_HEALTH_MONITOR_SYSTEM_PATH);
    if (!doc?.includes("Marketplace Health Monitor")) {
      throw new Error(
        `${MARKETPLACE_HEALTH_MONITOR_SYSTEM_PATH} missing — Marketplace Health Monitor requires R1-14 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendHealthMonitorLog({
      event: "engine_initialization",
      level: "info",
      details: "R1-14 Marketplace Health Monitor initialized",
    });
    return this.getState();
  }

  getState(): MarketplaceHealthMonitorState {
    if (!this.initializedAt) {
      throw new Error(
        "Marketplace Health Monitor not initialized. Call initialize() first.",
      );
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const records = this.controller.getManager().getRecords();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      records,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-MHM-001",
      missionId: "R1-14",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      records,
      health,
      performance,
    };
  }

  async runHealthCheck(input: RunHealthCheckInput = {}): Promise<MarketplaceHealthCheckReport> {
    return this.controller.runHealthCheck(input);
  }

  detectFailures(input: DetectFailuresInput = {}): MarketplaceHealthCheckReport {
    return this.controller.detectFailures(input);
  }

  getLatestReport(): MarketplaceHealthCheckReport | null {
    return this.controller.getLatestReport();
  }

  getHealthRecords() {
    return this.controller.getManager().getRecords();
  }

  setUseDegradedFixtureForTesting(value: boolean): void {
    this.controller.getManager().setUseDegradedFixtureForTesting(value);
  }

  updateConfiguration(
    overrides: Partial<MarketplaceHealthMonitorConfiguration>,
  ): MarketplaceHealthMonitorState {
    const next = buildMarketplaceHealthMonitorConfiguration(this.bootstrap.repositoryRoot, {
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
        `Health monitor status: ${state.status}`,
        `Records: ${state.records.length}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No health check operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): MarketplaceHealthCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      monitoredMarketplaces: state.records.length,
      lastHealthCheckAt: state.health.lastHealthCheckAt,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      failuresDetected: state.performance.failuresDetected,
      alertsActive: report?.alerts.length ?? 0,
      schemaVersion: HEALTH_RECORD_SCHEMA_VERSION,
      recentLogs: getHealthMonitorLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createMarketplaceHealthMonitorEngine(
  bootstrap: EmpireBootstrapContext,
  marketplaceConnectorFramework: MarketplaceConnectorFrameworkEngine,
  productNormalization?: MarketplaceProductNormalizationEngine | null,
  orderNormalization?: MarketplaceOrderNormalizationEngine | null,
  options?: MarketplaceHealthMonitorOptions,
): MarketplaceHealthMonitorEngine {
  return new MarketplaceHealthMonitorEngine(
    bootstrap,
    marketplaceConnectorFramework,
    productNormalization ?? null,
    orderNormalization ?? null,
    options,
  );
}

export function resetMarketplaceHealthMonitorForTesting(): void {
  resetHealthMonitorLogsForTesting();
  new MarketplaceHealthMonitorManager(null, null, null).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
