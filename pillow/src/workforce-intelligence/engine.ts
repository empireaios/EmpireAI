/** X3-08 — Workforce Intelligence. */

import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildWorkforceIntelligenceConfiguration,
  type WorkforceIntelligenceConfiguration,
} from "./configuration.js";
import { appendWfiLog, getWfiLogs, resetWfiLogsForTesting } from "./wfi-logging.js";
import { WORKFORCE_INTELLIGENCE_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectWorkforceIntelligenceInput,
  WorkforceIntelligenceState,
  WorkforceIntelligenceInput,
  WfiCockpitSnapshot,
  WfiRunReport,
  RunWfiDiagnosticsInput,
} from "./types.js";
import { WorkforceIntelligenceController } from "./workforce-intelligence-controller.js";
import {
  WorkforceIntelligenceManager,
  type WorkforceIntelligenceDependencies,
} from "./workforce-intelligence-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface WorkforceIntelligenceOptions {
  configuration?: Partial<WorkforceIntelligenceConfiguration>;
}

export type { WorkforceIntelligenceDependencies };

/**
 * Workforce Intelligence (PILLOW-WFI-001 / X3-08).
 * AI workforce coordination — never overload beyond validated structural limits.
 */
export class WorkforceIntelligenceEngine {
  private initializedAt: string | null = null;
  private readonly controller: WorkforceIntelligenceController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: WorkforceIntelligenceDependencies,
    options: WorkforceIntelligenceOptions = {},
  ) {
    const config = buildWorkforceIntelligenceConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new WorkforceIntelligenceManager(dependencies);
    this.controller = new WorkforceIntelligenceController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<WorkforceIntelligenceState> {
    const doc = await this.reader.readText(WORKFORCE_INTELLIGENCE_SYSTEM_PATH);
    if (!doc?.includes("Workforce Intelligence")) {
      throw new Error(
        `${WORKFORCE_INTELLIGENCE_SYSTEM_PATH} missing — Workforce Intelligence requires X3-08 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendWfiLog({
      event: "WORKFORCE_INTELLIGENCE_ready",
      level: "info",
      details:
        "X3-08 Workforce Intelligence initialized — never overload workforce beyond validated limits",
    });
    return this.getState();
  }

  getState(): WorkforceIntelligenceState {
    if (!this.initializedAt) {
      throw new Error("Workforce Intelligence not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const plans = this.controller.getManager().getWorkforceRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalWorkforceRecords: plans.length,
      bottleneckCount: this.controller.getManager().bottleneckCount(),
      averageEfficiency: this.controller.getManager().averageEfficiency(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-WFI-001",
      missionId: "X3-08",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectWorkforceIntelligence(
    input: ConnectWorkforceIntelligenceInput = {},
  ): WfiRunReport {
    return this.controller.connectWorkforceIntelligence(input);
  }

  monitorWorkforceCapacity(input: WorkforceIntelligenceInput = {}): WfiRunReport {
    return this.controller.monitorWorkforceCapacity(input);
  }

  monitorAgentUtilization(input: WorkforceIntelligenceInput = {}): WfiRunReport {
    return this.controller.monitorAgentUtilization(input);
  }

  monitorWorkloadDistribution(input: WorkforceIntelligenceInput = {}): WfiRunReport {
    return this.controller.monitorWorkloadDistribution(input);
  }

  monitorExecutionThroughput(input: WorkforceIntelligenceInput = {}): WfiRunReport {
    return this.controller.monitorExecutionThroughput(input);
  }

  monitorTaskCompletion(input: WorkforceIntelligenceInput = {}): WfiRunReport {
    return this.controller.monitorTaskCompletion(input);
  }

  monitorWorkforceEfficiency(input: WorkforceIntelligenceInput = {}): WfiRunReport {
    return this.controller.monitorWorkforceEfficiency(input);
  }

  detectWorkforceBottlenecks(input: WorkforceIntelligenceInput = {}): WfiRunReport {
    return this.controller.detectWorkforceBottlenecks(input);
  }

  detectUnderutilizedAgents(input: WorkforceIntelligenceInput = {}): WfiRunReport {
    return this.controller.detectUnderutilizedAgents(input);
  }

  recommendWorkforceOptimization(input: WorkforceIntelligenceInput = {}): WfiRunReport {
    return this.controller.recommendWorkforceOptimization(input);
  }

  runDiagnostics(input: RunWfiDiagnosticsInput = {}): WfiRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): WfiRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getWorkforceRecords() {
    return this.controller.getManager().getWorkforceRecords();
  }

  getRecommendations() {
    return this.controller.getManager().getRecommendations();
  }

  updateConfiguration(
    overrides: Partial<WorkforceIntelligenceConfiguration>,
  ): WorkforceIntelligenceState {
    const next = buildWorkforceIntelligenceConfiguration(this.bootstrap.repositoryRoot, {
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
        `Workforce records: ${state.health.totalWorkforceRecords}`,
        `Bottlenecks: ${state.health.bottleneckCount} · Avg efficiency: ${state.health.averageEfficiency}%`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No workforce intelligence operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): WfiCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalWorkforceRecords: state.health.totalWorkforceRecords,
      bottleneckCount: state.health.bottleneckCount,
      averageEfficiency: state.health.averageEfficiency,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected: Object.values(record?.dependencyPresence ?? {}).filter(Boolean)
        .length,
      recentLogs: getWfiLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createWorkforceIntelligenceEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: WorkforceIntelligenceDependencies,
  options?: WorkforceIntelligenceOptions,
): WorkforceIntelligenceEngine {
  return new WorkforceIntelligenceEngine(bootstrap, dependencies, options);
}

export function resetWorkforceIntelligenceForTesting(): void {
  resetWfiLogsForTesting();
  new WorkforceIntelligenceManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
