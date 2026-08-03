/** X4-04 — Language Intelligence Engine. */

import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildLanguageIntelligenceConfiguration,
  type LanguageIntelligenceConfiguration,
} from "./configuration.js";
import { appendLiLog, getLiLogs, resetLiLogsForTesting } from "./li-logging.js";
import { LANGUAGE_INTELLIGENCE_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectLanguageIntelligenceInput,
  LanguageAnalysisInput,
  LanguageIntelligenceEngineState,
  LiCockpitSnapshot,
  LiRunReport,
  RunLiDiagnosticsInput,
} from "./types.js";
import { LanguageIntelligenceController } from "./language-intelligence-controller.js";
import {
  LanguageIntelligenceManager,
  type LanguageIntelligenceDependencies,
} from "./language-intelligence-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface LanguageIntelligenceEngineOptions {
  configuration?: Partial<LanguageIntelligenceConfiguration>;
}

export type { LanguageIntelligenceDependencies };

/**
 * Language Intelligence (PILLOW-LI-001 / X4-04).
 * Enterprise multilingual intelligence — structural signals only.
 */
export class LanguageIntelligenceEngine {
  private initializedAt: string | null = null;
  private readonly controller: LanguageIntelligenceController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: LanguageIntelligenceDependencies,
    options: LanguageIntelligenceEngineOptions = {},
  ) {
    const config = buildLanguageIntelligenceConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new LanguageIntelligenceManager(dependencies);
    this.controller = new LanguageIntelligenceController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<LanguageIntelligenceEngineState> {
    const doc = await this.reader.readText(LANGUAGE_INTELLIGENCE_SYSTEM_PATH);
    if (!doc?.includes("Language Intelligence")) {
      throw new Error(
        `${LANGUAGE_INTELLIGENCE_SYSTEM_PATH} missing — Language Intelligence requires X4-04 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendLiLog({
      event: "LANGUAGE_INTELLIGENCE_ready",
      level: "info",
      details:
        "X4-04 Language Intelligence initialized — structural signals only; never overwrite canonical source automatically",
    });
    return this.getState();
  }

  getState(): LanguageIntelligenceEngineState {
    if (!this.initializedAt) {
      throw new Error("Language Intelligence not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const records = this.controller.getManager().getLanguageRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalLanguageRecords: records.length,
      unsupportedCount: this.controller.getManager().unsupportedCount(),
      averageQualityScore: this.controller.getManager().averageQualityScore(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-LI-001",
      missionId: "X4-04",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectLanguageIntelligence(input: ConnectLanguageIntelligenceInput = {}): LiRunReport {
    return this.controller.connectLanguageIntelligence(input);
  }

  detectLanguage(input: LanguageAnalysisInput = {}): LiRunReport {
    return this.controller.detectLanguage(input);
  }

  manageSupportedLanguages(input: LanguageAnalysisInput = {}): LiRunReport {
    return this.controller.manageSupportedLanguages(input);
  }

  translateCustomerFacing(input: LanguageAnalysisInput = {}): LiRunReport {
    return this.controller.translateCustomerFacing(input);
  }

  translateOperational(input: LanguageAnalysisInput = {}): LiRunReport {
    return this.controller.translateOperational(input);
  }

  translateAiWorkforce(input: LanguageAnalysisInput = {}): LiRunReport {
    return this.controller.translateAiWorkforce(input);
  }

  maintainTerminology(input: LanguageAnalysisInput = {}): LiRunReport {
    return this.controller.maintainTerminology(input);
  }

  analyzeQuality(input: LanguageAnalysisInput = {}): LiRunReport {
    return this.controller.analyzeQuality(input);
  }

  detectUnsupported(input: LanguageAnalysisInput = {}): LiRunReport {
    return this.controller.detectUnsupported(input);
  }

  recommendLanguage(input: LanguageAnalysisInput = {}): LiRunReport {
    return this.controller.recommendLanguage(input);
  }

  runDiagnostics(input: RunLiDiagnosticsInput = {}): LiRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): LiRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLanguageRecords() {
    return this.controller.getManager().getLanguageRecords();
  }

  getRecommendations() {
    return this.controller.getManager().getRecommendations();
  }

  updateConfiguration(
    overrides: Partial<LanguageIntelligenceConfiguration>,
  ): LanguageIntelligenceEngineState {
    const next = buildLanguageIntelligenceConfiguration(this.bootstrap.repositoryRoot, {
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
        `Language records: ${state.health.totalLanguageRecords}`,
        `Unsupported: ${state.health.unsupportedCount}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No language intelligence operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): LiCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalLanguageRecords: state.health.totalLanguageRecords,
      unsupportedCount: state.health.unsupportedCount,
      averageQualityScore: state.health.averageQualityScore,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected: Object.values(record?.dependencyPresence ?? {}).filter(Boolean)
        .length,
      recentLogs: getLiLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createLanguageIntelligenceEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: LanguageIntelligenceDependencies,
  options?: LanguageIntelligenceEngineOptions,
): LanguageIntelligenceEngine {
  return new LanguageIntelligenceEngine(bootstrap, dependencies, options);
}

export function resetLanguageIntelligenceForTesting(): void {
  resetLiLogsForTesting();
  new LanguageIntelligenceManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
