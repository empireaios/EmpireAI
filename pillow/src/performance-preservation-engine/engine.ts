/** X3-12 — Performance Preservation Engine. */

import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildPerformancePreservationEngineConfiguration,
  type PerformancePreservationEngineConfiguration,
} from "./configuration.js";
import { appendPpeLog, getPpeLogs, resetPpeLogsForTesting } from "./ppe-logging.js";
import { PERFORMANCE_PRESERVATION_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  PerformancePreservationInput,
  PerformancePreservationEngineState,
  PpeCockpitSnapshot,
  PpeRunReport,
  ConnectPerformancePreservationEngineInput,
  RunPpeDiagnosticsInput,
} from "./types.js";
import { PerformancePreservationController } from "./performance-preservation-controller.js";
import {
  PerformancePreservationManager,
  type PerformancePreservationEngineDependencies,
} from "./performance-preservation-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface PerformancePreservationEngineOptions {
  configuration?: Partial<PerformancePreservationEngineConfiguration>;
}

export type { PerformancePreservationEngineDependencies };

/**
 * Performance Preservation Engine (PILLOW-PPE-001 / X3-12).
 * Maintain quality/CX while scaling — structural signals only; never compromise CX for scaling.
 */
export class PerformancePreservationEngine {
  private initializedAt: string | null = null;
  private readonly controller: PerformancePreservationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: PerformancePreservationEngineDependencies,
    options: PerformancePreservationEngineOptions = {},
  ) {
    const config = buildPerformancePreservationEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new PerformancePreservationManager(dependencies);
    this.controller = new PerformancePreservationController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<PerformancePreservationEngineState> {
    const doc = await this.reader.readText(PERFORMANCE_PRESERVATION_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Performance Preservation Engine")) {
      throw new Error(
        `${PERFORMANCE_PRESERVATION_ENGINE_SYSTEM_PATH} missing — Performance Preservation Engine requires X3-12 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendPpeLog({
      event: "PERFORMANCE_PRESERVATION_ENGINE_ready",
      level: "info",
      details:
        "X3-12 Performance Preservation Engine initialized — never compromise customer experience for scaling",
    });
    return this.getState();
  }

  getState(): PerformancePreservationEngineState {
    if (!this.initializedAt) {
      throw new Error("Performance Preservation Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const records = this.controller.getManager().getPreservationRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalPreservationRecords: records.length,
      degradationCount: this.controller.getManager().degradationCount(config),
      averageQualityScore: this.controller.getManager().averageQualityScore(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-PPE-001",
      missionId: "X3-12",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectPerformancePreservationEngine(
    input: ConnectPerformancePreservationEngineInput = {},
  ): PpeRunReport {
    return this.controller.connectPerformancePreservationEngine(input);
  }

  monitorServiceQuality(input: PerformancePreservationInput = {}): PpeRunReport {
    return this.controller.monitorServiceQuality(input);
  }

  monitorCustomerExperience(input: PerformancePreservationInput = {}): PpeRunReport {
    return this.controller.monitorCustomerExperience(input);
  }

  monitorOperationalPerformance(input: PerformancePreservationInput = {}): PpeRunReport {
    return this.controller.monitorOperationalPerformance(input);
  }

  monitorResponseTimes(input: PerformancePreservationInput = {}): PpeRunReport {
    return this.controller.monitorResponseTimes(input);
  }

  monitorFulfilmentQuality(input: PerformancePreservationInput = {}): PpeRunReport {
    return this.controller.monitorFulfilmentQuality(input);
  }

  monitorReliability(input: PerformancePreservationInput = {}): PpeRunReport {
    return this.controller.monitorReliability(input);
  }

  detectPerformanceDegradation(input: PerformancePreservationInput = {}): PpeRunReport {
    return this.controller.detectPerformanceDegradation(input);
  }

  detectQualityRegressions(input: PerformancePreservationInput = {}): PpeRunReport {
    return this.controller.detectQualityRegressions(input);
  }

  recommendPreservationActions(input: PerformancePreservationInput = {}): PpeRunReport {
    return this.controller.recommendPreservationActions(input);
  }

  runDiagnostics(input: RunPpeDiagnosticsInput = {}): PpeRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): PpeRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getPreservationRecords() {
    return this.controller.getManager().getPreservationRecords();
  }

  getRecommendations() {
    return this.controller.getManager().getRecommendations();
  }

  updateConfiguration(
    overrides: Partial<PerformancePreservationEngineConfiguration>,
  ): PerformancePreservationEngineState {
    const next = buildPerformancePreservationEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Preservation records: ${state.health.totalPreservationRecords}`,
        `Degradations: ${state.health.degradationCount} · Avg quality: ${state.health.averageQualityScore}%`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No performance preservation operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): PpeCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalPreservationRecords: state.health.totalPreservationRecords,
      degradationCount: state.health.degradationCount,
      averageQualityScore: state.health.averageQualityScore,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected: Object.values(record?.dependencyPresence ?? {}).filter(Boolean)
        .length,
      recentLogs: getPpeLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createPerformancePreservationEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: PerformancePreservationEngineDependencies,
  options?: PerformancePreservationEngineOptions,
): PerformancePreservationEngine {
  return new PerformancePreservationEngine(bootstrap, dependencies, options);
}

export function resetPerformancePreservationEngineForTesting(): void {
  resetPpeLogsForTesting();
  new PerformancePreservationManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
