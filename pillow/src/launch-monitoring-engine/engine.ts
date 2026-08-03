import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildLaunchMonitoringEngineConfiguration,
  type LaunchMonitoringEngineConfiguration,
} from "./configuration.js";
import { appendLmeLog, getLmeLogs, resetLmeLogsForTesting } from "./lme-logging.js";
import { LAUNCH_MONITORING_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectLaunchMonitoringEngineInput,
  LaunchMonitoringActionInput,
  LaunchMonitoringCockpitSnapshot,
  LaunchMonitoringEngineState,
  LaunchMonitoringRunReport,
  MonitorLaunchInput,
} from "./types.js";
import { LaunchMonitoringController } from "./launch-monitoring-controller.js";
import {
  LaunchMonitoringManager,
  type LaunchMonitoringEngineDependencies,
} from "./launch-monitoring-manager.js";

export interface LaunchMonitoringEngineOptions {
  configuration?: Partial<LaunchMonitoringEngineConfiguration>;
}

export type { LaunchMonitoringEngineDependencies };

/**
 * Launch Monitoring Engine (PILLOW-LME-001 / X1-13).
 * Post-launch monitoring — structural signals only; never modify production without validation.
 */
export class LaunchMonitoringEngine {
  private initializedAt: string | null = null;
  private readonly controller: LaunchMonitoringController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: LaunchMonitoringEngineDependencies,
    options: LaunchMonitoringEngineOptions = {},
  ) {
    const config = buildLaunchMonitoringEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new LaunchMonitoringManager(dependencies);
    this.controller = new LaunchMonitoringController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<LaunchMonitoringEngineState> {
    const doc = await this.reader.readText(LAUNCH_MONITORING_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Launch Monitoring Engine")) {
      throw new Error(
        `${LAUNCH_MONITORING_ENGINE_SYSTEM_PATH} missing — requires X1-13 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendLmeLog({
      event: "engine_initialization",
      level: "info",
      details: "X1-13 Launch Monitoring Engine initialized",
    });
    return this.getState();
  }

  getState(): LaunchMonitoringEngineState {
    if (!this.initializedAt) {
      throw new Error("Launch Monitoring Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const monitoringRecords = this.controller.getManager().getMonitoringRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalMonitoringRecords: monitoringRecords.length,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-LME-001",
      missionId: "X1-13",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectLaunchMonitoringEngine(
    input: ConnectLaunchMonitoringEngineInput = {},
  ): LaunchMonitoringRunReport {
    return this.controller.connectLaunchMonitoringEngine(input);
  }

  monitorLaunch(input: MonitorLaunchInput = {}): LaunchMonitoringRunReport {
    return this.controller.monitorLaunch(input);
  }

  monitorOperationalHealth(input: LaunchMonitoringActionInput = {}): LaunchMonitoringRunReport {
    return this.controller.monitorOperationalHealth(input);
  }

  monitorCustomerActivity(input: LaunchMonitoringActionInput = {}): LaunchMonitoringRunReport {
    return this.controller.monitorCustomerActivity(input);
  }

  monitorSalesPerformance(input: LaunchMonitoringActionInput = {}): LaunchMonitoringRunReport {
    return this.controller.monitorSalesPerformance(input);
  }

  monitorOrderActivity(input: LaunchMonitoringActionInput = {}): LaunchMonitoringRunReport {
    return this.controller.monitorOrderActivity(input);
  }

  monitorSystemStability(input: LaunchMonitoringActionInput = {}): LaunchMonitoringRunReport {
    return this.controller.monitorSystemStability(input);
  }

  detectLaunchAnomalies(input: LaunchMonitoringActionInput = {}): LaunchMonitoringRunReport {
    return this.controller.detectLaunchAnomalies(input);
  }

  detectOperationalFailures(input: LaunchMonitoringActionInput = {}): LaunchMonitoringRunReport {
    return this.controller.detectOperationalFailures(input);
  }

  generateLaunchHealthRecommendations(
    input: LaunchMonitoringActionInput = {},
  ): LaunchMonitoringRunReport {
    return this.controller.generateLaunchHealthRecommendations(input);
  }

  getLatestReport(): LaunchMonitoringRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getMonitoringRecords() {
    return this.controller.getManager().getMonitoringRecords();
  }

  updateConfiguration(
    overrides: Partial<LaunchMonitoringEngineConfiguration>,
  ): LaunchMonitoringEngineState {
    const next = buildLaunchMonitoringEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Launch Monitoring Engine status: ${state.status}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No launch monitoring operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): LaunchMonitoringCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;
    const dependenciesConnected = record
      ? Object.values(record.dependencyPresence).filter(Boolean).length
      : 0;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalMonitoringRecords: state.health.totalMonitoringRecords,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected,
      recentLogs: getLmeLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createLaunchMonitoringEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: LaunchMonitoringEngineDependencies,
  options?: LaunchMonitoringEngineOptions,
): LaunchMonitoringEngine {
  return new LaunchMonitoringEngine(bootstrap, dependencies, options);
}

export function resetLaunchMonitoringEngineForTesting(): void {
  resetLmeLogsForTesting();
  new LaunchMonitoringManager({
    companyFactoryFramework: null,
    businessLaunchOrchestrator: null,
    growthInitializationEngine: null,
  }).resetForTesting();
}
