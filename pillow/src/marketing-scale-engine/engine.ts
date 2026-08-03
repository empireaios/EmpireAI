/** X3-05 — Marketing Scale Engine. */

import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildMarketingScaleEngineConfiguration,
  type MarketingScaleEngineConfiguration,
} from "./configuration.js";
import { appendMseLog, getMseLogs, resetMseLogsForTesting } from "./mse-logging.js";
import { MARKETING_SCALE_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectMarketingScaleEngineInput,
  MarketingScaleEngineState,
  MarketingScaleInput,
  MseCockpitSnapshot,
  MseRunReport,
  RunMseDiagnosticsInput,
} from "./types.js";
import { MarketingScaleController } from "./marketing-scale-controller.js";
import {
  MarketingScaleManager,
  type MarketingScaleEngineDependencies,
} from "./marketing-scale-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface MarketingScaleEngineOptions {
  configuration?: Partial<MarketingScaleEngineConfiguration>;
}

export type { MarketingScaleEngineDependencies };

/**
 * Marketing Scale Engine (PILLOW-MSE-001 / X3-05).
 * Marketing performance scaling — expand only with validated structural marketing signals.
 */
export class MarketingScaleEngine {
  private initializedAt: string | null = null;
  private readonly controller: MarketingScaleController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: MarketingScaleEngineDependencies,
    options: MarketingScaleEngineOptions = {},
  ) {
    const config = buildMarketingScaleEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new MarketingScaleManager(dependencies);
    this.controller = new MarketingScaleController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<MarketingScaleEngineState> {
    const doc = await this.reader.readText(MARKETING_SCALE_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Marketing Scale Engine")) {
      throw new Error(
        `${MARKETING_SCALE_ENGINE_SYSTEM_PATH} missing — Marketing Scale Engine requires X3-05 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendMseLog({
      event: "MARKETING_SCALE_ENGINE_ready",
      level: "info",
      details:
        "X3-05 Marketing Scale Engine initialized — never recommend marketing expansion without validated performance",
    });
    return this.getState();
  }

  getState(): MarketingScaleEngineState {
    if (!this.initializedAt) {
      throw new Error("Marketing Scale Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const plans = this.controller.getManager().getScalingRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalScalingRecords: plans.length,
      bottleneckCount: this.controller.getManager().bottleneckCount(),
      averageReadiness: this.controller.getManager().averageReadiness(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-MSE-001",
      missionId: "X3-05",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectMarketingScaleEngine(
    input: ConnectMarketingScaleEngineInput = {},
  ): MseRunReport {
    return this.controller.connectMarketingScaleEngine(input);
  }

  monitorMarketingPerformance(input: MarketingScaleInput = {}): MseRunReport {
    return this.controller.monitorMarketingPerformance(input);
  }

  monitorCampaignScalability(input: MarketingScaleInput = {}): MseRunReport {
    return this.controller.monitorCampaignScalability(input);
  }

  monitorCustomerAcquisitionCost(input: MarketingScaleInput = {}): MseRunReport {
    return this.controller.monitorCustomerAcquisitionCost(input);
  }

  monitorReturnOnAdvertisingSpend(input: MarketingScaleInput = {}): MseRunReport {
    return this.controller.monitorReturnOnAdvertisingSpend(input);
  }

  monitorConversionPerformance(input: MarketingScaleInput = {}): MseRunReport {
    return this.controller.monitorConversionPerformance(input);
  }

  monitorChannelPerformance(input: MarketingScaleInput = {}): MseRunReport {
    return this.controller.monitorChannelPerformance(input);
  }

  detectScalableCampaigns(input: MarketingScaleInput = {}): MseRunReport {
    return this.controller.detectScalableCampaigns(input);
  }

  detectMarketingBottlenecks(input: MarketingScaleInput = {}): MseRunReport {
    return this.controller.detectMarketingBottlenecks(input);
  }

  recommendMarketingScaling(input: MarketingScaleInput = {}): MseRunReport {
    return this.controller.recommendMarketingScaling(input);
  }

  runDiagnostics(input: RunMseDiagnosticsInput = {}): MseRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): MseRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getScalingRecords() {
    return this.controller.getManager().getScalingRecords();
  }

  getRecommendations() {
    return this.controller.getManager().getRecommendations();
  }

  updateConfiguration(
    overrides: Partial<MarketingScaleEngineConfiguration>,
  ): MarketingScaleEngineState {
    const next = buildMarketingScaleEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Engine status: ${state.status}`,
        `Scaling records: ${state.health.totalScalingRecords}`,
        `Bottlenecks: ${state.health.bottleneckCount} · Avg readiness: ${state.health.averageReadiness}%`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No marketing scale operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): MseCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalScalingRecords: state.health.totalScalingRecords,
      bottleneckCount: state.health.bottleneckCount,
      averageReadiness: state.health.averageReadiness,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected: Object.values(record?.dependencyPresence ?? {}).filter(Boolean)
        .length,
      recentLogs: getMseLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createMarketingScaleEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: MarketingScaleEngineDependencies,
  options?: MarketingScaleEngineOptions,
): MarketingScaleEngine {
  return new MarketingScaleEngine(bootstrap, dependencies, options);
}

export function resetMarketingScaleEngineForTesting(): void {
  resetMseLogsForTesting();
  new MarketingScaleManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
