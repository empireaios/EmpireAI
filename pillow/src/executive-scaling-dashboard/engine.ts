/** X3-09 — Executive Scaling Dashboard. */

import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildExecutiveScalingDashboardConfiguration,
  type ExecutiveScalingDashboardConfiguration,
} from "./configuration.js";
import { appendEsdLog, getEsdLogs, resetEsdLogsForTesting } from "./esd-logging.js";
import { EXECUTIVE_SCALING_DASHBOARD_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectExecutiveScalingDashboardInput,
  EsdCockpitSnapshot,
  EsdRunReport,
  ExecutiveScalingDashboardInput,
  ExecutiveScalingDashboardState,
  RunEsdDiagnosticsInput,
} from "./types.js";
import { ExecutiveScalingDashboardController } from "./executive-scaling-dashboard-controller.js";
import {
  ExecutiveScalingDashboardManager,
  type ExecutiveScalingDashboardDependencies,
} from "./executive-scaling-dashboard-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface ExecutiveScalingDashboardOptions {
  configuration?: Partial<ExecutiveScalingDashboardConfiguration>;
}

export type { ExecutiveScalingDashboardDependencies };

/**
 * Executive Scaling Dashboard (PILLOW-ESD-001 / X3-09).
 * Growth cockpit — structural summaries only; never expose restricted enterprise information.
 */
export class ExecutiveScalingDashboardEngine {
  private initializedAt: string | null = null;
  private readonly controller: ExecutiveScalingDashboardController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: ExecutiveScalingDashboardDependencies,
    options: ExecutiveScalingDashboardOptions = {},
  ) {
    const config = buildExecutiveScalingDashboardConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new ExecutiveScalingDashboardManager(dependencies);
    this.controller = new ExecutiveScalingDashboardController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ExecutiveScalingDashboardState> {
    const doc = await this.reader.readText(EXECUTIVE_SCALING_DASHBOARD_SYSTEM_PATH);
    if (!doc?.includes("Executive Scaling Dashboard")) {
      throw new Error(
        `${EXECUTIVE_SCALING_DASHBOARD_SYSTEM_PATH} missing — Executive Scaling Dashboard requires X3-09 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendEsdLog({
      event: "EXECUTIVE_SCALING_DASHBOARD_ready",
      level: "info",
      details:
        "X3-09 Executive Scaling Dashboard initialized — never expose restricted enterprise information",
    });
    return this.getState();
  }

  getState(): ExecutiveScalingDashboardState {
    if (!this.initializedAt) {
      throw new Error("Executive Scaling Dashboard not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const snapshots = this.controller.getManager().getDashboardSnapshots();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalDashboardSnapshots: snapshots.length,
      alertCount: this.controller.getManager().alertCount(),
      averageReadiness: this.controller.getManager().averageReadiness(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-ESD-001",
      missionId: "X3-09",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectExecutiveScalingDashboard(
    input: ConnectExecutiveScalingDashboardInput = {},
  ): EsdRunReport {
    return this.controller.connectExecutiveScalingDashboard(input);
  }

  refreshDashboard(input: ExecutiveScalingDashboardInput = {}): EsdRunReport {
    return this.controller.refreshDashboard(input);
  }

  getScalingStatus(input: ExecutiveScalingDashboardInput = {}): EsdRunReport {
    return this.controller.getScalingStatus(input);
  }

  getScalingOpportunities(input: ExecutiveScalingDashboardInput = {}): EsdRunReport {
    return this.controller.getScalingOpportunities(input);
  }

  getScalingDecisions(input: ExecutiveScalingDashboardInput = {}): EsdRunReport {
    return this.controller.getScalingDecisions(input);
  }

  getOperationalCapacity(input: ExecutiveScalingDashboardInput = {}): EsdRunReport {
    return this.controller.getOperationalCapacity(input);
  }

  getMarketingGrowth(input: ExecutiveScalingDashboardInput = {}): EsdRunReport {
    return this.controller.getMarketingGrowth(input);
  }

  getSupplierReadiness(input: ExecutiveScalingDashboardInput = {}): EsdRunReport {
    return this.controller.getSupplierReadiness(input);
  }

  getFinancialReadiness(input: ExecutiveScalingDashboardInput = {}): EsdRunReport {
    return this.controller.getFinancialReadiness(input);
  }

  getWorkforceUtilization(input: ExecutiveScalingDashboardInput = {}): EsdRunReport {
    return this.controller.getWorkforceUtilization(input);
  }

  getExecutiveAlerts(input: ExecutiveScalingDashboardInput = {}): EsdRunReport {
    return this.controller.getExecutiveAlerts(input);
  }

  getScalingRecommendations(input: ExecutiveScalingDashboardInput = {}): EsdRunReport {
    return this.controller.getScalingRecommendations(input);
  }

  runDiagnostics(input: RunEsdDiagnosticsInput = {}): EsdRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): EsdRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getDashboardSnapshots() {
    return this.controller.getManager().getDashboardSnapshots();
  }

  getRecommendations() {
    return this.controller.getManager().getRecommendations();
  }

  updateConfiguration(
    overrides: Partial<ExecutiveScalingDashboardConfiguration>,
  ): ExecutiveScalingDashboardState {
    const next = buildExecutiveScalingDashboardConfiguration(this.bootstrap.repositoryRoot, {
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
        `Dashboard snapshots: ${state.health.totalDashboardSnapshots}`,
        `Alerts: ${state.health.alertCount} · Avg readiness: ${state.health.averageReadiness}%`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No executive scaling dashboard operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): EsdCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalDashboardSnapshots: state.health.totalDashboardSnapshots,
      alertCount: state.health.alertCount,
      averageReadiness: state.health.averageReadiness,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected: Object.values(record?.dependencyPresence ?? {}).filter(Boolean)
        .length,
      recentLogs: getEsdLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createExecutiveScalingDashboardEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: ExecutiveScalingDashboardDependencies,
  options?: ExecutiveScalingDashboardOptions,
): ExecutiveScalingDashboardEngine {
  return new ExecutiveScalingDashboardEngine(bootstrap, dependencies, options);
}

export function resetExecutiveScalingDashboardForTesting(): void {
  resetEsdLogsForTesting();
  new ExecutiveScalingDashboardManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
