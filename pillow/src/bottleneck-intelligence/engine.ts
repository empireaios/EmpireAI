/** X3-10 — Bottleneck Intelligence. */

import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildBottleneckIntelligenceConfiguration,
  type BottleneckIntelligenceConfiguration,
} from "./configuration.js";
import { appendBniLog, getBniLogs, resetBniLogsForTesting } from "./bni-logging.js";
import { BOTTLENECK_INTELLIGENCE_SYSTEM_PATH } from "./paths.js";
import type {
  BottleneckIntelligenceInput,
  BottleneckIntelligenceState,
  BniCockpitSnapshot,
  BniRunReport,
  ConnectBottleneckIntelligenceInput,
  RunBniDiagnosticsInput,
} from "./types.js";
import { BottleneckIntelligenceController } from "./bottleneck-intelligence-controller.js";
import {
  BottleneckIntelligenceManager,
  type BottleneckIntelligenceDependencies,
} from "./bottleneck-intelligence-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface BottleneckIntelligenceOptions {
  configuration?: Partial<BottleneckIntelligenceConfiguration>;
}

export type { BottleneckIntelligenceDependencies };

/**
 * Bottleneck Intelligence (PILLOW-BNI-001 / X3-10).
 * Continuous bottleneck detection — structural signals only; never unsupported conclusions.
 */
export class BottleneckIntelligenceEngine {
  private initializedAt: string | null = null;
  private readonly controller: BottleneckIntelligenceController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: BottleneckIntelligenceDependencies,
    options: BottleneckIntelligenceOptions = {},
  ) {
    const config = buildBottleneckIntelligenceConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new BottleneckIntelligenceManager(dependencies);
    this.controller = new BottleneckIntelligenceController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<BottleneckIntelligenceState> {
    const doc = await this.reader.readText(BOTTLENECK_INTELLIGENCE_SYSTEM_PATH);
    if (!doc?.includes("Bottleneck Intelligence")) {
      throw new Error(
        `${BOTTLENECK_INTELLIGENCE_SYSTEM_PATH} missing — Bottleneck Intelligence requires X3-10 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendBniLog({
      event: "BOTTLENECK_INTELLIGENCE_ready",
      level: "info",
      details:
        "X3-10 Bottleneck Intelligence initialized — never generate unsupported bottleneck conclusions",
    });
    return this.getState();
  }

  getState(): BottleneckIntelligenceState {
    if (!this.initializedAt) {
      throw new Error("Bottleneck Intelligence not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const records = this.controller.getManager().getBottleneckRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalBottleneckRecords: records.length,
      highSeverityCount: this.controller.getManager().highSeverityCount(config),
      averageImpact: this.controller.getManager().averageImpact(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-BNI-001",
      missionId: "X3-10",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectBottleneckIntelligence(
    input: ConnectBottleneckIntelligenceInput = {},
  ): BniRunReport {
    return this.controller.connectBottleneckIntelligence(input);
  }

  monitorOperationalBottlenecks(input: BottleneckIntelligenceInput = {}): BniRunReport {
    return this.controller.monitorOperationalBottlenecks(input);
  }

  monitorInfrastructureBottlenecks(input: BottleneckIntelligenceInput = {}): BniRunReport {
    return this.controller.monitorInfrastructureBottlenecks(input);
  }

  monitorSupplierBottlenecks(input: BottleneckIntelligenceInput = {}): BniRunReport {
    return this.controller.monitorSupplierBottlenecks(input);
  }

  monitorMarketingBottlenecks(input: BottleneckIntelligenceInput = {}): BniRunReport {
    return this.controller.monitorMarketingBottlenecks(input);
  }

  monitorFinancialBottlenecks(input: BottleneckIntelligenceInput = {}): BniRunReport {
    return this.controller.monitorFinancialBottlenecks(input);
  }

  monitorWorkforceBottlenecks(input: BottleneckIntelligenceInput = {}): BniRunReport {
    return this.controller.monitorWorkforceBottlenecks(input);
  }

  detectThroughputConstraints(input: BottleneckIntelligenceInput = {}): BniRunReport {
    return this.controller.detectThroughputConstraints(input);
  }

  rankBottlenecksByImpact(input: BottleneckIntelligenceInput = {}): BniRunReport {
    return this.controller.rankBottlenecksByImpact(input);
  }

  recommendBottleneckResolutions(input: BottleneckIntelligenceInput = {}): BniRunReport {
    return this.controller.recommendBottleneckResolutions(input);
  }

  runDiagnostics(input: RunBniDiagnosticsInput = {}): BniRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): BniRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getBottleneckRecords() {
    return this.controller.getManager().getBottleneckRecords();
  }

  getRecommendations() {
    return this.controller.getManager().getRecommendations();
  }

  updateConfiguration(
    overrides: Partial<BottleneckIntelligenceConfiguration>,
  ): BottleneckIntelligenceState {
    const next = buildBottleneckIntelligenceConfiguration(this.bootstrap.repositoryRoot, {
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
        `Bottleneck records: ${state.health.totalBottleneckRecords}`,
        `High severity: ${state.health.highSeverityCount} · Avg impact: ${state.health.averageImpact}%`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No bottleneck intelligence operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): BniCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalBottleneckRecords: state.health.totalBottleneckRecords,
      highSeverityCount: state.health.highSeverityCount,
      averageImpact: state.health.averageImpact,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected: Object.values(record?.dependencyPresence ?? {}).filter(Boolean)
        .length,
      recentLogs: getBniLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createBottleneckIntelligenceEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: BottleneckIntelligenceDependencies,
  options?: BottleneckIntelligenceOptions,
): BottleneckIntelligenceEngine {
  return new BottleneckIntelligenceEngine(bootstrap, dependencies, options);
}

export function resetBottleneckIntelligenceForTesting(): void {
  resetBniLogsForTesting();
  new BottleneckIntelligenceManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
