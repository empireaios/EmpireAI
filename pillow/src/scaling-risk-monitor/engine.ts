/** X3-13 — Scaling Risk Monitor Engine. */

import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildScalingRiskMonitorConfiguration,
  type ScalingRiskMonitorConfiguration,
} from "./configuration.js";
import { appendSrmLog, getSrmLogs, resetSrmLogsForTesting } from "./srm-logging.js";
import { SCALING_RISK_MONITOR_SYSTEM_PATH } from "./paths.js";
import type {
  ScalingRiskInput,
  ScalingRiskMonitorState,
  SrmCockpitSnapshot,
  SrmRunReport,
  ConnectScalingRiskMonitorInput,
  RunSrmDiagnosticsInput,
} from "./types.js";
import { ScalingRiskController } from "./scaling-risk-controller.js";
import {
  ScalingRiskManager,
  type ScalingRiskMonitorDependencies,
} from "./scaling-risk-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface ScalingRiskMonitorOptions {
  configuration?: Partial<ScalingRiskMonitorConfiguration>;
}

export type { ScalingRiskMonitorDependencies };

/**
 * Scaling Risk Monitor (PILLOW-SRM-001 / X3-13).
 * Continuous scaling risk analysis — structural signals only; never suppress critical scaling risks.
 */
export class ScalingRiskMonitorEngine {
  private initializedAt: string | null = null;
  private readonly controller: ScalingRiskController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: ScalingRiskMonitorDependencies,
    options: ScalingRiskMonitorOptions = {},
  ) {
    const config = buildScalingRiskMonitorConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new ScalingRiskManager(dependencies);
    this.controller = new ScalingRiskController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ScalingRiskMonitorState> {
    const doc = await this.reader.readText(SCALING_RISK_MONITOR_SYSTEM_PATH);
    if (!doc?.includes("Scaling Risk Monitor")) {
      throw new Error(
        `${SCALING_RISK_MONITOR_SYSTEM_PATH} missing — Scaling Risk Monitor requires X3-13 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendSrmLog({
      event: "SCALING_RISK_MONITOR_ready",
      level: "info",
      details:
        "X3-13 Scaling Risk Monitor initialized — never suppress critical scaling risks",
    });
    return this.getState();
  }

  getState(): ScalingRiskMonitorState {
    if (!this.initializedAt) {
      throw new Error("Scaling Risk Monitor not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const records = this.controller.getManager().getScalingRiskRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalScalingRiskRecords: records.length,
      criticalRiskCount: this.controller.getManager().criticalRiskCount(),
      averageRiskProbability: this.controller.getManager().averageRiskProbability(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-SRM-001",
      missionId: "X3-13",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectScalingRiskMonitor(input: ConnectScalingRiskMonitorInput = {}): SrmRunReport {
    return this.controller.connectScalingRiskMonitor(input);
  }

  monitorScalingRisks(input: ScalingRiskInput = {}): SrmRunReport {
    return this.controller.monitorScalingRisks(input);
  }

  monitorOperationalRisks(input: ScalingRiskInput = {}): SrmRunReport {
    return this.controller.monitorOperationalRisks(input);
  }

  monitorFinancialRisks(input: ScalingRiskInput = {}): SrmRunReport {
    return this.controller.monitorFinancialRisks(input);
  }

  monitorSupplierRisks(input: ScalingRiskInput = {}): SrmRunReport {
    return this.controller.monitorSupplierRisks(input);
  }

  monitorMarketingRisks(input: ScalingRiskInput = {}): SrmRunReport {
    return this.controller.monitorMarketingRisks(input);
  }

  monitorWorkforceRisks(input: ScalingRiskInput = {}): SrmRunReport {
    return this.controller.monitorWorkforceRisks(input);
  }

  monitorInfrastructureRisks(input: ScalingRiskInput = {}): SrmRunReport {
    return this.controller.monitorInfrastructureRisks(input);
  }

  detectUncontrolledExpansion(input: ScalingRiskInput = {}): SrmRunReport {
    return this.controller.detectUncontrolledExpansion(input);
  }

  rankScalingRisks(input: ScalingRiskInput = {}): SrmRunReport {
    return this.controller.rankScalingRisks(input);
  }

  recommendRiskMitigations(input: ScalingRiskInput = {}): SrmRunReport {
    return this.controller.recommendRiskMitigations(input);
  }

  runDiagnostics(input: RunSrmDiagnosticsInput = {}): SrmRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): SrmRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getScalingRiskRecords() {
    return this.controller.getManager().getScalingRiskRecords();
  }

  getRecommendations() {
    return this.controller.getManager().getRecommendations();
  }

  updateConfiguration(
    overrides: Partial<ScalingRiskMonitorConfiguration>,
  ): ScalingRiskMonitorState {
    const next = buildScalingRiskMonitorConfiguration(this.bootstrap.repositoryRoot, {
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
        `Scaling risk records: ${state.health.totalScalingRiskRecords}`,
        `Critical: ${state.health.criticalRiskCount} · Avg probability: ${state.health.averageRiskProbability}%`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No scaling risk monitor operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): SrmCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalScalingRiskRecords: state.health.totalScalingRiskRecords,
      criticalRiskCount: state.health.criticalRiskCount,
      averageRiskProbability: state.health.averageRiskProbability,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected: Object.values(record?.dependencyPresence ?? {}).filter(Boolean)
        .length,
      recentLogs: getSrmLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createScalingRiskMonitorEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: ScalingRiskMonitorDependencies,
  options?: ScalingRiskMonitorOptions,
): ScalingRiskMonitorEngine {
  return new ScalingRiskMonitorEngine(bootstrap, dependencies, options);
}

export function resetScalingRiskMonitorForTesting(): void {
  resetSrmLogsForTesting();
  new ScalingRiskManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
