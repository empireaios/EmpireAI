/** X4-10 — Executive Global Dashboard Engine. */

import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildExecutiveGlobalDashboardConfiguration,
  type ExecutiveGlobalDashboardConfiguration,
} from "./configuration.js";
import { appendEgdLog, getEgdLogs, resetEgdLogsForTesting } from "./egd-logging.js";
import { EXECUTIVE_GLOBAL_DASHBOARD_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectExecutiveGlobalDashboardInput,
  DashboardAnalysisInput,
  EgdCockpitSnapshot,
  EgdRunReport,
  ExecutiveGlobalDashboardState,
  RunEgdDiagnosticsInput,
} from "./types.js";
import { ExecutiveGlobalDashboardController } from "./executive-global-dashboard-controller.js";
import {
  ExecutiveGlobalDashboardManager,
  type ExecutiveGlobalDashboardDependencies,
} from "./executive-global-dashboard-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface ExecutiveGlobalDashboardOptions {
  configuration?: Partial<ExecutiveGlobalDashboardConfiguration>;
}

export type { ExecutiveGlobalDashboardDependencies };

/**
 * Executive Global Dashboard (PILLOW-EGD-001 / X4-10).
 * Worldwide operational visibility — structural signals only;
 * never expose restricted enterprise information to unauthorized users.
 */
export class ExecutiveGlobalDashboardEngine {
  private initializedAt: string | null = null;
  private readonly controller: ExecutiveGlobalDashboardController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: ExecutiveGlobalDashboardDependencies,
    options: ExecutiveGlobalDashboardOptions = {},
  ) {
    const config = buildExecutiveGlobalDashboardConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new ExecutiveGlobalDashboardManager(dependencies);
    this.controller = new ExecutiveGlobalDashboardController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ExecutiveGlobalDashboardState> {
    const doc = await this.reader.readText(EXECUTIVE_GLOBAL_DASHBOARD_SYSTEM_PATH);
    if (!doc?.includes("Executive Global Dashboard")) {
      throw new Error(
        `${EXECUTIVE_GLOBAL_DASHBOARD_SYSTEM_PATH} missing — Executive Global Dashboard requires X4-10 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendEgdLog({
      event: "EXECUTIVE_GLOBAL_DASHBOARD_ready",
      level: "info",
      details:
        "X4-10 Executive Global Dashboard initialized — structural visibility only; never expose restricted information",
    });
    return this.getState();
  }

  getState(): ExecutiveGlobalDashboardState {
    if (!this.initializedAt) {
      throw new Error("Executive Global Dashboard not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const snapshots = this.controller.getManager().getSnapshots();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalSnapshots: snapshots.length,
      alertCount: this.controller.getManager().alertCount(),
      widgetCount: this.controller.getManager().widgetCount(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-EGD-001",
      missionId: "X4-10",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectExecutiveGlobalDashboard(
    input: ConnectExecutiveGlobalDashboardInput = {},
  ): EgdRunReport {
    return this.controller.connectExecutiveGlobalDashboard(input);
  }

  displayWorldwideOperations(input: DashboardAnalysisInput = {}): EgdRunReport {
    return this.controller.displayWorldwideOperations(input);
  }

  displayCountryExpansion(input: DashboardAnalysisInput = {}): EgdRunReport {
    return this.controller.displayCountryExpansion(input);
  }

  displayRegionalPerformance(input: DashboardAnalysisInput = {}): EgdRunReport {
    return this.controller.displayRegionalPerformance(input);
  }

  displayMarketOpportunities(input: DashboardAnalysisInput = {}): EgdRunReport {
    return this.controller.displayMarketOpportunities(input);
  }

  displayLogisticsPerformance(input: DashboardAnalysisInput = {}): EgdRunReport {
    return this.controller.displayLogisticsPerformance(input);
  }

  displayComplianceStatus(input: DashboardAnalysisInput = {}): EgdRunReport {
    return this.controller.displayComplianceStatus(input);
  }

  displayTaxationStatus(input: DashboardAnalysisInput = {}): EgdRunReport {
    return this.controller.displayTaxationStatus(input);
  }

  displayLocalizationReadiness(input: DashboardAnalysisInput = {}): EgdRunReport {
    return this.controller.displayLocalizationReadiness(input);
  }

  displayExecutiveAlerts(input: DashboardAnalysisInput = {}): EgdRunReport {
    return this.controller.displayExecutiveAlerts(input);
  }

  displayGlobalRecommendations(input: DashboardAnalysisInput = {}): EgdRunReport {
    return this.controller.displayGlobalRecommendations(input);
  }

  refreshDashboard(input: DashboardAnalysisInput = {}): EgdRunReport {
    return this.controller.refreshDashboard(input);
  }

  runDiagnostics(input: RunEgdDiagnosticsInput = {}): EgdRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): EgdRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getSnapshots() {
    return this.controller.getManager().getSnapshots();
  }

  getRecommendations() {
    return this.controller.getManager().getRecommendations();
  }

  updateConfiguration(
    overrides: Partial<ExecutiveGlobalDashboardConfiguration>,
  ): ExecutiveGlobalDashboardState {
    const next = buildExecutiveGlobalDashboardConfiguration(this.bootstrap.repositoryRoot, {
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
        `Snapshots: ${state.health.totalSnapshots}`,
        `Alerts: ${state.health.alertCount}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No executive global dashboard operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): EgdCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalSnapshots: state.health.totalSnapshots,
      alertCount: state.health.alertCount,
      widgetCount: state.health.widgetCount,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected: Object.values(record?.dependencyPresence ?? {}).filter(Boolean)
        .length,
      recentLogs: getEgdLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createExecutiveGlobalDashboardEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: ExecutiveGlobalDashboardDependencies,
  options?: ExecutiveGlobalDashboardOptions,
): ExecutiveGlobalDashboardEngine {
  return new ExecutiveGlobalDashboardEngine(bootstrap, dependencies, options);
}

export function resetExecutiveGlobalDashboardForTesting(): void {
  resetEgdLogsForTesting();
  new ExecutiveGlobalDashboardManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
