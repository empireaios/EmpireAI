/** X3-03 — Scaling Decision Engine. */

import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildScalingDecisionEngineConfiguration,
  type ScalingDecisionEngineConfiguration,
} from "./configuration.js";
import { appendSdeLog, getSdeLogs, resetSdeLogsForTesting } from "./sde-logging.js";
import { SCALING_DECISION_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectScalingDecisionEngineInput,
  RunSdeDiagnosticsInput,
  ScalingDecisionInput,
  SdeCockpitSnapshot,
  SdeRunReport,
  ScalingDecisionEngineState,
} from "./types.js";
import { ScalingDecisionController } from "./scaling-decision-controller.js";
import {
  ScalingDecisionManager,
  type ScalingDecisionEngineDependencies,
} from "./scaling-decision-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface ScalingDecisionEngineOptions {
  configuration?: Partial<ScalingDecisionEngineConfiguration>;
}

export type { ScalingDecisionEngineDependencies };

/**
 * Scaling Decision Engine (PILLOW-SDE-001 / X3-03).
 * Scale/no-scale intelligence — confident scaling decisions via structural readiness and risk signals.
 */
export class ScalingDecisionEngine {
  private initializedAt: string | null = null;
  private readonly controller: ScalingDecisionController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: ScalingDecisionEngineDependencies,
    options: ScalingDecisionEngineOptions = {},
  ) {
    const config = buildScalingDecisionEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new ScalingDecisionManager(dependencies);
    this.controller = new ScalingDecisionController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ScalingDecisionEngineState> {
    const doc = await this.reader.readText(SCALING_DECISION_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Scaling Decision Engine")) {
      throw new Error(
        `${SCALING_DECISION_ENGINE_SYSTEM_PATH} missing — Scaling Decision Engine requires X3-03 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendSdeLog({
      event: "SCALING_DECISION_ENGINE_ready",
      level: "info",
      details:
        "X3-03 Scaling Decision Engine initialized — never approve scaling without validation",
    });
    return this.getState();
  }

  getState(): ScalingDecisionEngineState {
    if (!this.initializedAt) {
      throw new Error("Scaling Decision Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const decisions = this.controller.getManager().getDecisionRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalDecisionRecords: decisions.length,
      scaleCount: this.controller.getManager().scaleCount(),
      holdCount: this.controller.getManager().holdCount(),
      rejectCount: this.controller.getManager().rejectCount(),
      averageConfidence: this.controller.getManager().averageConfidence(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-SDE-001",
      missionId: "X3-03",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectScalingDecisionEngine(
    input: ConnectScalingDecisionEngineInput = {},
  ): SdeRunReport {
    return this.controller.connectScalingDecisionEngine(input);
  }

  evaluateCandidate(input: ScalingDecisionInput = {}): SdeRunReport {
    return this.controller.evaluateCandidate(input);
  }

  assessReadiness(input: ScalingDecisionInput = {}): SdeRunReport {
    return this.controller.assessReadiness(input);
  }

  assessRisk(input: ScalingDecisionInput = {}): SdeRunReport {
    return this.controller.assessRisk(input);
  }

  decideScale(input: ScalingDecisionInput = {}): SdeRunReport {
    return this.controller.decideScale(input);
  }

  rankPriorities(input: ScalingDecisionInput = {}): SdeRunReport {
    return this.controller.rankPriorities(input);
  }

  generateRecommendations(input: ScalingDecisionInput = {}): SdeRunReport {
    return this.controller.generateRecommendations(input);
  }

  runDiagnostics(input: RunSdeDiagnosticsInput = {}): SdeRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): SdeRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getDecisionRecords() {
    return this.controller.getManager().getDecisionRecords();
  }

  getRecommendations() {
    return this.controller.getManager().getRecommendations();
  }

  updateConfiguration(
    overrides: Partial<ScalingDecisionEngineConfiguration>,
  ): ScalingDecisionEngineState {
    const next = buildScalingDecisionEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Decision records: ${state.health.totalDecisionRecords}`,
        `Scale: ${state.health.scaleCount} · Hold: ${state.health.holdCount} · Reject: ${state.health.rejectCount}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No decision operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): SdeCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalDecisionRecords: state.health.totalDecisionRecords,
      scaleCount: state.health.scaleCount,
      holdCount: state.health.holdCount,
      rejectCount: state.health.rejectCount,
      averageConfidence: state.health.averageConfidence,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected: Object.values(record?.dependencyPresence ?? {}).filter(Boolean)
        .length,
      recentLogs: getSdeLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createScalingDecisionEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: ScalingDecisionEngineDependencies,
  options?: ScalingDecisionEngineOptions,
): ScalingDecisionEngine {
  return new ScalingDecisionEngine(bootstrap, dependencies, options);
}

export function resetScalingDecisionEngineForTesting(): void {
  resetSdeLogsForTesting();
  new ScalingDecisionManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
