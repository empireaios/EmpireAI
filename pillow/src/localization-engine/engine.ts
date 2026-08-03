/** X4-03 — Localization Engine. */

import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildLocalizationEngineConfiguration,
  type LocalizationEngineConfiguration,
} from "./configuration.js";
import { appendLocLog, getLocLogs, resetLocLogsForTesting } from "./loc-logging.js";
import { LOCALIZATION_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectLocalizationEngineInput,
  LocalizationInput,
  LocalizationEngineState,
  LocCockpitSnapshot,
  LocRunReport,
  RunLocDiagnosticsInput,
} from "./types.js";
import { LocalizationController } from "./localization-controller.js";
import {
  LocalizationManager,
  type LocalizationEngineDependencies,
} from "./localization-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface LocalizationEngineOptions {
  configuration?: Partial<LocalizationEngineConfiguration>;
}

export type { LocalizationEngineDependencies };

/**
 * Localization Engine (PILLOW-LOC-001 / X4-03).
 * Enterprise localization for international operations — structural signals only.
 */
export class LocalizationEngine {
  private initializedAt: string | null = null;
  private readonly controller: LocalizationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: LocalizationEngineDependencies,
    options: LocalizationEngineOptions = {},
  ) {
    const config = buildLocalizationEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new LocalizationManager(dependencies);
    this.controller = new LocalizationController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<LocalizationEngineState> {
    const doc = await this.reader.readText(LOCALIZATION_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Localization Engine")) {
      throw new Error(
        `${LOCALIZATION_ENGINE_SYSTEM_PATH} missing — Localization Engine requires X4-03 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendLocLog({
      event: "LOCALIZATION_ENGINE_ready",
      level: "info",
      details:
        "X4-03 Localization Engine initialized — structural signals only; never overwrite canonical source content",
    });
    return this.getState();
  }

  getState(): LocalizationEngineState {
    if (!this.initializedAt) {
      throw new Error("Localization Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const records = this.controller.getManager().getLocalizationRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalLocalizationRecords: records.length,
      gapCount: this.controller.getManager().gapCount(),
      averageReadinessScore: this.controller.getManager().averageReadinessScore(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-LOC-001",
      missionId: "X4-03",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectLocalizationEngine(input: ConnectLocalizationEngineInput = {}): LocRunReport {
    return this.controller.connectLocalizationEngine(input);
  }

  localizeProduct(input: LocalizationInput = {}): LocRunReport {
    return this.controller.localizeProduct(input);
  }

  localizeService(input: LocalizationInput = {}): LocRunReport {
    return this.controller.localizeService(input);
  }

  localizeStorefront(input: LocalizationInput = {}): LocRunReport {
    return this.controller.localizeStorefront(input);
  }

  localizeBrand(input: LocalizationInput = {}): LocRunReport {
    return this.controller.localizeBrand(input);
  }

  localizeMarketing(input: LocalizationInput = {}): LocRunReport {
    return this.controller.localizeMarketing(input);
  }

  localizeCustomerExperience(input: LocalizationInput = {}): LocRunReport {
    return this.controller.localizeCustomerExperience(input);
  }

  adaptRegion(input: LocalizationInput = {}): LocRunReport {
    return this.controller.adaptRegion(input);
  }

  detectGaps(input: LocalizationInput = {}): LocRunReport {
    return this.controller.detectGaps(input);
  }

  recommendLocalization(input: LocalizationInput = {}): LocRunReport {
    return this.controller.recommendLocalization(input);
  }

  runDiagnostics(input: RunLocDiagnosticsInput = {}): LocRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): LocRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLocalizationRecords() {
    return this.controller.getManager().getLocalizationRecords();
  }

  getRecommendations() {
    return this.controller.getManager().getRecommendations();
  }

  updateConfiguration(
    overrides: Partial<LocalizationEngineConfiguration>,
  ): LocalizationEngineState {
    const next = buildLocalizationEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Localization records: ${state.health.totalLocalizationRecords}`,
        `Gaps: ${state.health.gapCount}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No localization operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): LocCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalLocalizationRecords: state.health.totalLocalizationRecords,
      gapCount: state.health.gapCount,
      averageReadinessScore: state.health.averageReadinessScore,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected: Object.values(record?.dependencyPresence ?? {}).filter(Boolean)
        .length,
      recentLogs: getLocLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createLocalizationEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: LocalizationEngineDependencies,
  options?: LocalizationEngineOptions,
): LocalizationEngine {
  return new LocalizationEngine(bootstrap, dependencies, options);
}

export function resetLocalizationEngineForTesting(): void {
  resetLocLogsForTesting();
  new LocalizationManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
