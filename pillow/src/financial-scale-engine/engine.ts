/** X3-07 — Financial Scale Engine. */

import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildFinancialScaleEngineConfiguration,
  type FinancialScaleEngineConfiguration,
} from "./configuration.js";
import { appendFseLog, getFseLogs, resetFseLogsForTesting } from "./fse-logging.js";
import { FINANCIAL_SCALE_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectFinancialScaleEngineInput,
  FinancialScaleEngineState,
  FinancialScaleInput,
  FseCockpitSnapshot,
  FseRunReport,
  RunFseDiagnosticsInput,
} from "./types.js";
import { FinancialScaleController } from "./financial-scale-controller.js";
import {
  FinancialScaleManager,
  type FinancialScaleEngineDependencies,
} from "./financial-scale-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface FinancialScaleEngineOptions {
  configuration?: Partial<FinancialScaleEngineConfiguration>;
}

export type { FinancialScaleEngineDependencies };

/**
 * Financial Scale Engine (PILLOW-FSE-001 / X3-07).
 * Financial readiness scaling — expand only with validated structural financial signals.
 */
export class FinancialScaleEngine {
  private initializedAt: string | null = null;
  private readonly controller: FinancialScaleController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: FinancialScaleEngineDependencies,
    options: FinancialScaleEngineOptions = {},
  ) {
    const config = buildFinancialScaleEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new FinancialScaleManager(dependencies);
    this.controller = new FinancialScaleController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<FinancialScaleEngineState> {
    const doc = await this.reader.readText(FINANCIAL_SCALE_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Financial Scale Engine")) {
      throw new Error(
        `${FINANCIAL_SCALE_ENGINE_SYSTEM_PATH} missing — Financial Scale Engine requires X3-07 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendFseLog({
      event: "FINANCIAL_SCALE_ENGINE_ready",
      level: "info",
      details:
        "X3-07 Financial Scale Engine initialized — never recommend scaling without validated financial readiness",
    });
    return this.getState();
  }

  getState(): FinancialScaleEngineState {
    if (!this.initializedAt) {
      throw new Error("Financial Scale Engine not initialized. Call initialize() first.");
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
      engineVersion: "PILLOW-FSE-001",
      missionId: "X3-07",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectFinancialScaleEngine(
    input: ConnectFinancialScaleEngineInput = {},
  ): FseRunReport {
    return this.controller.connectFinancialScaleEngine(input);
  }

  monitorCapitalRequirements(input: FinancialScaleInput = {}): FseRunReport {
    return this.controller.monitorCapitalRequirements(input);
  }

  monitorCashFlowReadiness(input: FinancialScaleInput = {}): FseRunReport {
    return this.controller.monitorCashFlowReadiness(input);
  }

  monitorProfitability(input: FinancialScaleInput = {}): FseRunReport {
    return this.controller.monitorProfitability(input);
  }

  monitorWorkingCapital(input: FinancialScaleInput = {}): FseRunReport {
    return this.controller.monitorWorkingCapital(input);
  }

  monitorOperatingExpenses(input: FinancialScaleInput = {}): FseRunReport {
    return this.controller.monitorOperatingExpenses(input);
  }

  monitorInvestmentEfficiency(input: FinancialScaleInput = {}): FseRunReport {
    return this.controller.monitorInvestmentEfficiency(input);
  }

  detectFinancialBottlenecks(input: FinancialScaleInput = {}): FseRunReport {
    return this.controller.detectFinancialBottlenecks(input);
  }

  detectCapitalShortages(input: FinancialScaleInput = {}): FseRunReport {
    return this.controller.detectCapitalShortages(input);
  }

  recommendFinancialScaling(input: FinancialScaleInput = {}): FseRunReport {
    return this.controller.recommendFinancialScaling(input);
  }

  runDiagnostics(input: RunFseDiagnosticsInput = {}): FseRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): FseRunReport | null {
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
    overrides: Partial<FinancialScaleEngineConfiguration>,
  ): FinancialScaleEngineState {
    const next = buildFinancialScaleEngineConfiguration(this.bootstrap.repositoryRoot, {
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
          : "No financial scale operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): FseCockpitSnapshot {
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
      recentLogs: getFseLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createFinancialScaleEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: FinancialScaleEngineDependencies,
  options?: FinancialScaleEngineOptions,
): FinancialScaleEngine {
  return new FinancialScaleEngine(bootstrap, dependencies, options);
}

export function resetFinancialScaleEngineForTesting(): void {
  resetFseLogsForTesting();
  new FinancialScaleManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
