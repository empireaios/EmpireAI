/** X3-19 — Self-Balancing Enterprise. */

import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildSelfBalancingEnterpriseConfiguration,
  type SelfBalancingEnterpriseConfiguration,
} from "./configuration.js";
import { appendSbeLog, getSbeLogs, resetSbeLogsForTesting } from "./sbe-logging.js";
import { SELF_BALANCING_ENTERPRISE_SYSTEM_PATH } from "./paths.js";
import type {
  SelfBalancingInput,
  SelfBalancingEnterpriseState,
  SbeCockpitSnapshot,
  SbeRunReport,
  ConnectSelfBalancingEnterpriseInput,
  RunSbeDiagnosticsInput,
} from "./types.js";
import { SelfBalancingEnterpriseController } from "./self-balancing-enterprise-controller.js";
import {
  SelfBalancingEnterpriseManager,
  type SelfBalancingEnterpriseDependencies,
} from "./self-balancing-enterprise-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface SelfBalancingEnterpriseOptions {
  configuration?: Partial<SelfBalancingEnterpriseConfiguration>;
}

export type { SelfBalancingEnterpriseDependencies };

/**
 * Self-Balancing Enterprise (PILLOW-SBE-001 / X3-19).
 * Autonomous enterprise self-balancing — structural signals only; policy-gated reallocation; never reallocate protected resources beyond approval policies.
 */
export class SelfBalancingEnterprise {
  private initializedAt: string | null = null;
  private readonly controller: SelfBalancingEnterpriseController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: SelfBalancingEnterpriseDependencies,
    options: SelfBalancingEnterpriseOptions = {},
  ) {
    const config = buildSelfBalancingEnterpriseConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new SelfBalancingEnterpriseManager(dependencies);
    this.controller = new SelfBalancingEnterpriseController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<SelfBalancingEnterpriseState> {
    const doc = await this.reader.readText(SELF_BALANCING_ENTERPRISE_SYSTEM_PATH);
    if (!doc?.includes("Self-Balancing Enterprise")) {
      throw new Error(
        `${SELF_BALANCING_ENTERPRISE_SYSTEM_PATH} missing — Self-Balancing Enterprise requires X3-19 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendSbeLog({
      event: "SELF_BALANCING_ENTERPRISE_ready",
      level: "info",
      details:
        "X3-19 Self-Balancing Enterprise initialized — never reallocate protected resources beyond approval policies",
    });
    return this.getState();
  }

  getState(): SelfBalancingEnterpriseState {
    if (!this.initializedAt) {
      throw new Error("Self-Balancing Enterprise not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const records = this.controller.getManager().getBalancingRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalBalancingRecords: records.length,
      highScoreCount: this.controller.getManager().highScoreCount(config),
      averageBalanceScore: this.controller.getManager().averageBalanceScore(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-SBE-001",
      missionId: "X3-19",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectSelfBalancingEnterprise(
    input: ConnectSelfBalancingEnterpriseInput = {},
  ): SbeRunReport {
    return this.controller.connectSelfBalancingEnterprise(input);
  }

  monitorEnterpriseResourceUtilization(input: SelfBalancingInput = {}): SbeRunReport {
    return this.controller.monitorEnterpriseResourceUtilization(input);
  }

  monitorOperationalBalance(input: SelfBalancingInput = {}): SbeRunReport {
    return this.controller.monitorOperationalBalance(input);
  }

  monitorFinancialBalance(input: SelfBalancingInput = {}): SbeRunReport {
    return this.controller.monitorFinancialBalance(input);
  }

  monitorWorkforceBalance(input: SelfBalancingInput = {}): SbeRunReport {
    return this.controller.monitorWorkforceBalance(input);
  }

  monitorSupplierBalance(input: SelfBalancingInput = {}): SbeRunReport {
    return this.controller.monitorSupplierBalance(input);
  }

  monitorInfrastructureBalance(input: SelfBalancingInput = {}): SbeRunReport {
    return this.controller.monitorInfrastructureBalance(input);
  }

  detectResourceImbalances(input: SelfBalancingInput = {}): SbeRunReport {
    return this.controller.detectResourceImbalances(input);
  }

  reallocateResourcesPerPolicy(input: SelfBalancingInput = {}): SbeRunReport {
    return this.controller.reallocateResourcesPerPolicy(input);
  }

  optimizeEnterpriseEquilibrium(input: SelfBalancingInput = {}): SbeRunReport {
    return this.controller.optimizeEnterpriseEquilibrium(input);
  }

  recommendBalancingActions(input: SelfBalancingInput = {}): SbeRunReport {
    return this.controller.recommendBalancingActions(input);
  }

  runDiagnostics(input: RunSbeDiagnosticsInput = {}): SbeRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): SbeRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getBalancingRecords() {
    return this.controller.getManager().getBalancingRecords();
  }

  getRecommendations() {
    return this.controller.getManager().getRecommendations();
  }

  updateConfiguration(
    overrides: Partial<SelfBalancingEnterpriseConfiguration>,
  ): SelfBalancingEnterpriseState {
    const next = buildSelfBalancingEnterpriseConfiguration(this.bootstrap.repositoryRoot, {
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
        `Balancing records: ${state.health.totalBalancingRecords}`,
        `High score: ${state.health.highScoreCount} · Avg score: ${state.health.averageBalanceScore}%`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No self-balancing enterprise operations yet",
        "Never reallocate protected resources beyond approval policies",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): SbeCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalBalancingRecords: state.health.totalBalancingRecords,
      highScoreCount: state.health.highScoreCount,
      averageBalanceScore: state.health.averageBalanceScore,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected: Object.values(record?.dependencyPresence ?? {}).filter(Boolean)
        .length,
      recentLogs: getSbeLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createSelfBalancingEnterprise(
  bootstrap: EmpireBootstrapContext,
  dependencies: SelfBalancingEnterpriseDependencies,
  options?: SelfBalancingEnterpriseOptions,
): SelfBalancingEnterprise {
  return new SelfBalancingEnterprise(bootstrap, dependencies, options);
}

export function resetSelfBalancingEnterpriseForTesting(): void {
  resetSbeLogsForTesting();
  new SelfBalancingEnterpriseManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
