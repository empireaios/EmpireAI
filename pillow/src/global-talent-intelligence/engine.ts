/** X4-13 — Global Talent Intelligence Engine. */

import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildGlobalTalentIntelligenceConfiguration,
  type GlobalTalentIntelligenceConfiguration,
} from "./configuration.js";
import { appendTalLog, getTalLogs, resetTalLogsForTesting } from "./tal-logging.js";
import { GLOBAL_TALENT_INTELLIGENCE_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectGlobalTalentIntelligenceInput,
  GlobalTalentIntelligenceState,
  RunTalDiagnosticsInput,
  TalCockpitSnapshot,
  TalRunReport,
  WorkforceAnalysisInput,
} from "./types.js";
import { GlobalTalentController } from "./global-talent-controller.js";
import {
  GlobalTalentManager,
  type GlobalTalentIntelligenceDependencies,
} from "./global-talent-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface GlobalTalentIntelligenceOptions {
  configuration?: Partial<GlobalTalentIntelligenceConfiguration>;
}

export type { GlobalTalentIntelligenceDependencies };

/**
 * Global Talent Intelligence (PILLOW-TAL-001 / X4-13).
 * Enterprise global workforce intelligence — structural signals only;
 * never make workforce decisions using unvalidated intelligence.
 */
export class GlobalTalentIntelligenceEngine {
  private initializedAt: string | null = null;
  private readonly controller: GlobalTalentController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: GlobalTalentIntelligenceDependencies,
    options: GlobalTalentIntelligenceOptions = {},
  ) {
    const config = buildGlobalTalentIntelligenceConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new GlobalTalentManager(dependencies);
    this.controller = new GlobalTalentController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<GlobalTalentIntelligenceState> {
    const doc = await this.reader.readText(GLOBAL_TALENT_INTELLIGENCE_SYSTEM_PATH);
    if (!doc?.includes("Global Talent Intelligence")) {
      throw new Error(
        `${GLOBAL_TALENT_INTELLIGENCE_SYSTEM_PATH} missing — Global Talent Intelligence requires X4-13 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendTalLog({
      event: "GLOBAL_TALENT_INTELLIGENCE_ready",
      level: "info",
      details:
        "X4-13 Global Talent Intelligence initialized — structural signals only; never make workforce decisions using unvalidated intelligence",
    });
    return this.getState();
  }

  getState(): GlobalTalentIntelligenceState {
    if (!this.initializedAt) {
      throw new Error("Global Talent Intelligence not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const records = this.controller.getManager().getWorkforceRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalWorkforceRecords: records.length,
      shortageCount: this.controller.getManager().shortageCount(),
      opportunityCount: this.controller.getManager().opportunityCount(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-TAL-001",
      missionId: "X4-13",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectGlobalTalentIntelligence(input: ConnectGlobalTalentIntelligenceInput = {}): TalRunReport {
    return this.controller.connectGlobalTalentIntelligence(input);
  }

  monitorGlobalWorkforceAvailability(input: WorkforceAnalysisInput = {}): TalRunReport {
    return this.controller.monitorGlobalWorkforceAvailability(input);
  }

  monitorRegionalTalentMarkets(input: WorkforceAnalysisInput = {}): TalRunReport {
    return this.controller.monitorRegionalTalentMarkets(input);
  }

  monitorWorkforceCapabilities(input: WorkforceAnalysisInput = {}): TalRunReport {
    return this.controller.monitorWorkforceCapabilities(input);
  }

  monitorWorkforcePerformance(input: WorkforceAnalysisInput = {}): TalRunReport {
    return this.controller.monitorWorkforcePerformance(input);
  }

  monitorWorkforceCosts(input: WorkforceAnalysisInput = {}): TalRunReport {
    return this.controller.monitorWorkforceCosts(input);
  }

  monitorWorkforceUtilization(input: WorkforceAnalysisInput = {}): TalRunReport {
    return this.controller.monitorWorkforceUtilization(input);
  }

  detectWorkforceShortages(input: WorkforceAnalysisInput = {}): TalRunReport {
    return this.controller.detectWorkforceShortages(input);
  }

  detectWorkforceOpportunities(input: WorkforceAnalysisInput = {}): TalRunReport {
    return this.controller.detectWorkforceOpportunities(input);
  }

  recommendWorkforce(input: WorkforceAnalysisInput = {}): TalRunReport {
    return this.controller.recommendWorkforce(input);
  }

  runDiagnostics(input: RunTalDiagnosticsInput = {}): TalRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): TalRunReport | null {
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
    overrides: Partial<GlobalTalentIntelligenceConfiguration>,
  ): GlobalTalentIntelligenceState {
    const next = buildGlobalTalentIntelligenceConfiguration(this.bootstrap.repositoryRoot, {
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
        `Shortages: ${state.health.shortageCount}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No global talent intelligence operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): TalCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalWorkforceRecords: state.health.totalWorkforceRecords,
      shortageCount: state.health.shortageCount,
      opportunityCount: state.health.opportunityCount,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected: Object.values(record?.dependencyPresence ?? {}).filter(Boolean)
        .length,
      recentLogs: getTalLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createGlobalTalentIntelligenceEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: GlobalTalentIntelligenceDependencies,
  options?: GlobalTalentIntelligenceOptions,
): GlobalTalentIntelligenceEngine {
  return new GlobalTalentIntelligenceEngine(bootstrap, dependencies, options);
}

export function resetGlobalTalentIntelligenceForTesting(): void {
  resetTalLogsForTesting();
  new GlobalTalentManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
