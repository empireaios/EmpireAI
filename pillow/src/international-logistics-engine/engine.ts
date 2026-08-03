/** X4-08 — International Logistics Engine. */

import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildInternationalLogisticsEngineConfiguration,
  type InternationalLogisticsEngineConfiguration,
} from "./configuration.js";
import { appendIleLog, getIleLogs, resetIleLogsForTesting } from "./ile-logging.js";
import { INTERNATIONAL_LOGISTICS_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectInternationalLogisticsEngineInput,
  IleCockpitSnapshot,
  IleRunReport,
  InternationalLogisticsEngineState,
  LogisticsAnalysisInput,
  RunIleDiagnosticsInput,
} from "./types.js";
import { InternationalLogisticsController } from "./international-logistics-controller.js";
import {
  InternationalLogisticsManager,
  type InternationalLogisticsEngineDependencies,
} from "./international-logistics-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface InternationalLogisticsEngineOptions {
  configuration?: Partial<InternationalLogisticsEngineConfiguration>;
}

export type { InternationalLogisticsEngineDependencies };

/**
 * International Logistics Engine (PILLOW-ILE-001 / X4-08).
 * Enterprise worldwide logistics — structural signals only;
 * never recommend shipping with unvalidated logistics data.
 */
export class InternationalLogisticsEngine {
  private initializedAt: string | null = null;
  private readonly controller: InternationalLogisticsController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: InternationalLogisticsEngineDependencies,
    options: InternationalLogisticsEngineOptions = {},
  ) {
    const config = buildInternationalLogisticsEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new InternationalLogisticsManager(dependencies);
    this.controller = new InternationalLogisticsController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<InternationalLogisticsEngineState> {
    const doc = await this.reader.readText(INTERNATIONAL_LOGISTICS_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("International Logistics Engine")) {
      throw new Error(
        `${INTERNATIONAL_LOGISTICS_ENGINE_SYSTEM_PATH} missing — International Logistics Engine requires X4-08 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendIleLog({
      event: "INTERNATIONAL_LOGISTICS_ENGINE_ready",
      level: "info",
      details:
        "X4-08 International Logistics Engine initialized — structural signals only; never recommend with unvalidated data",
    });
    return this.getState();
  }

  getState(): InternationalLogisticsEngineState {
    if (!this.initializedAt) {
      throw new Error(
        "International Logistics Engine not initialized. Call initialize() first.",
      );
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const records = this.controller.getManager().getLogisticsRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalLogisticsRecords: records.length,
      bottleneckCount: this.controller.getManager().bottleneckCount(),
      fulfillmentRiskCount: this.controller.getManager().fulfillmentRiskCount(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-ILE-001",
      missionId: "X4-08",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectInternationalLogisticsEngine(
    input: ConnectInternationalLogisticsEngineInput = {},
  ): IleRunReport {
    return this.controller.connectInternationalLogisticsEngine(input);
  }

  manageShippingNetworks(input: LogisticsAnalysisInput = {}): IleRunReport {
    return this.controller.manageShippingNetworks(input);
  }

  monitorProviders(input: LogisticsAnalysisInput = {}): IleRunReport {
    return this.controller.monitorProviders(input);
  }

  monitorShippingPerformance(input: LogisticsAnalysisInput = {}): IleRunReport {
    return this.controller.monitorShippingPerformance(input);
  }

  monitorDeliveryTimes(input: LogisticsAnalysisInput = {}): IleRunReport {
    return this.controller.monitorDeliveryTimes(input);
  }

  monitorFulfillmentCapacity(input: LogisticsAnalysisInput = {}): IleRunReport {
    return this.controller.monitorFulfillmentCapacity(input);
  }

  monitorShippingCosts(input: LogisticsAnalysisInput = {}): IleRunReport {
    return this.controller.monitorShippingCosts(input);
  }

  detectBottlenecks(input: LogisticsAnalysisInput = {}): IleRunReport {
    return this.controller.detectBottlenecks(input);
  }

  detectFulfillmentRisks(input: LogisticsAnalysisInput = {}): IleRunReport {
    return this.controller.detectFulfillmentRisks(input);
  }

  optimizeRoutes(input: LogisticsAnalysisInput = {}): IleRunReport {
    return this.controller.optimizeRoutes(input);
  }

  recommendLogistics(input: LogisticsAnalysisInput = {}): IleRunReport {
    return this.controller.recommendLogistics(input);
  }

  runDiagnostics(input: RunIleDiagnosticsInput = {}): IleRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): IleRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLogisticsRecords() {
    return this.controller.getManager().getLogisticsRecords();
  }

  getRecommendations() {
    return this.controller.getManager().getRecommendations();
  }

  updateConfiguration(
    overrides: Partial<InternationalLogisticsEngineConfiguration>,
  ): InternationalLogisticsEngineState {
    const next = buildInternationalLogisticsEngineConfiguration(
      this.bootstrap.repositoryRoot,
      {
        ...this.controller.getConfiguration(),
        ...overrides,
      },
    );
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
        `Engine status: ${state.status}`,
        `Logistics records: ${state.health.totalLogisticsRecords}`,
        `Bottlenecks: ${state.health.bottleneckCount}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No international logistics operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): IleCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalLogisticsRecords: state.health.totalLogisticsRecords,
      bottleneckCount: state.health.bottleneckCount,
      fulfillmentRiskCount: state.health.fulfillmentRiskCount,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected: Object.values(record?.dependencyPresence ?? {}).filter(Boolean)
        .length,
      recentLogs: getIleLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createInternationalLogisticsEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: InternationalLogisticsEngineDependencies,
  options?: InternationalLogisticsEngineOptions,
): InternationalLogisticsEngine {
  return new InternationalLogisticsEngine(bootstrap, dependencies, options);
}

export function resetInternationalLogisticsEngineForTesting(): void {
  resetIleLogsForTesting();
  new InternationalLogisticsManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
