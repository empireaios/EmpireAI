/** X3-11 — Operational Elasticity Engine. */

import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildOperationalElasticityEngineConfiguration,
  type OperationalElasticityEngineConfiguration,
} from "./configuration.js";
import { appendOeeLog, getOeeLogs, resetOeeLogsForTesting } from "./oee-logging.js";
import { OPERATIONAL_ELASTICITY_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  OperationalElasticityInput,
  OperationalElasticityEngineState,
  OeeCockpitSnapshot,
  OeeRunReport,
  ConnectOperationalElasticityEngineInput,
  RunOeeDiagnosticsInput,
} from "./types.js";
import { OperationalElasticityController } from "./operational-elasticity-controller.js";
import {
  OperationalElasticityManager,
  type OperationalElasticityEngineDependencies,
} from "./operational-elasticity-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface OperationalElasticityEngineOptions {
  configuration?: Partial<OperationalElasticityEngineConfiguration>;
}

export type { OperationalElasticityEngineDependencies };

/**
 * Operational Elasticity Engine (PILLOW-OEE-001 / X3-11).
 * Dynamic operational scaling — structural signals only; never exceed validated operational limits.
 */
export class OperationalElasticityEngine {
  private initializedAt: string | null = null;
  private readonly controller: OperationalElasticityController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: OperationalElasticityEngineDependencies,
    options: OperationalElasticityEngineOptions = {},
  ) {
    const config = buildOperationalElasticityEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new OperationalElasticityManager(dependencies);
    this.controller = new OperationalElasticityController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<OperationalElasticityEngineState> {
    const doc = await this.reader.readText(OPERATIONAL_ELASTICITY_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Operational Elasticity Engine")) {
      throw new Error(
        `${OPERATIONAL_ELASTICITY_ENGINE_SYSTEM_PATH} missing — Operational Elasticity Engine requires X3-11 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendOeeLog({
      event: "OPERATIONAL_ELASTICITY_ENGINE_ready",
      level: "info",
      details:
        "X3-11 Operational Elasticity Engine initialized — never exceed validated operational limits",
    });
    return this.getState();
  }

  getState(): OperationalElasticityEngineState {
    if (!this.initializedAt) {
      throw new Error("Operational Elasticity Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const records = this.controller.getManager().getElasticityRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalElasticityRecords: records.length,
      highUtilizationCount: this.controller.getManager().highUtilizationCount(config),
      averageUtilization: this.controller.getManager().averageUtilization(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-OEE-001",
      missionId: "X3-11",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectOperationalElasticityEngine(
    input: ConnectOperationalElasticityEngineInput = {},
  ): OeeRunReport {
    return this.controller.connectOperationalElasticityEngine(input);
  }

  monitorOperationalDemand(input: OperationalElasticityInput = {}): OeeRunReport {
    return this.controller.monitorOperationalDemand(input);
  }

  monitorOperationalUtilization(input: OperationalElasticityInput = {}): OeeRunReport {
    return this.controller.monitorOperationalUtilization(input);
  }

  scaleCapacityUpward(input: OperationalElasticityInput = {}): OeeRunReport {
    return this.controller.scaleCapacityUpward(input);
  }

  scaleCapacityDownward(input: OperationalElasticityInput = {}): OeeRunReport {
    return this.controller.scaleCapacityDownward(input);
  }

  balanceWorkloadsDynamically(input: OperationalElasticityInput = {}): OeeRunReport {
    return this.controller.balanceWorkloadsDynamically(input);
  }

  optimizeResourceUtilization(input: OperationalElasticityInput = {}): OeeRunReport {
    return this.controller.optimizeResourceUtilization(input);
  }

  detectOvercapacity(input: OperationalElasticityInput = {}): OeeRunReport {
    return this.controller.detectOvercapacity(input);
  }

  detectUndercapacity(input: OperationalElasticityInput = {}): OeeRunReport {
    return this.controller.detectUndercapacity(input);
  }

  recommendElasticityActions(input: OperationalElasticityInput = {}): OeeRunReport {
    return this.controller.recommendElasticityActions(input);
  }

  runDiagnostics(input: RunOeeDiagnosticsInput = {}): OeeRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): OeeRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getElasticityRecords() {
    return this.controller.getManager().getElasticityRecords();
  }

  getRecommendations() {
    return this.controller.getManager().getRecommendations();
  }

  updateConfiguration(
    overrides: Partial<OperationalElasticityEngineConfiguration>,
  ): OperationalElasticityEngineState {
    const next = buildOperationalElasticityEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Elasticity records: ${state.health.totalElasticityRecords}`,
        `High utilization: ${state.health.highUtilizationCount} · Avg utilization: ${state.health.averageUtilization}%`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No operational elasticity operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): OeeCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalElasticityRecords: state.health.totalElasticityRecords,
      highUtilizationCount: state.health.highUtilizationCount,
      averageUtilization: state.health.averageUtilization,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected: Object.values(record?.dependencyPresence ?? {}).filter(Boolean)
        .length,
      recentLogs: getOeeLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createOperationalElasticityEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: OperationalElasticityEngineDependencies,
  options?: OperationalElasticityEngineOptions,
): OperationalElasticityEngine {
  return new OperationalElasticityEngine(bootstrap, dependencies, options);
}

export function resetOperationalElasticityEngineForTesting(): void {
  resetOeeLogsForTesting();
  new OperationalElasticityManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
