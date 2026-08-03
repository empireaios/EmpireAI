/** X4-05 — Currency Intelligence Engine. */

import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildCurrencyIntelligenceConfiguration,
  type CurrencyIntelligenceConfiguration,
} from "./configuration.js";
import { appendCurLog, getCurLogs, resetCurLogsForTesting } from "./cur-logging.js";
import { CURRENCY_INTELLIGENCE_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectCurrencyIntelligenceInput,
  CurrencyAnalysisInput,
  CurrencyIntelligenceEngineState,
  CurCockpitSnapshot,
  CurRunReport,
  RunCurDiagnosticsInput,
} from "./types.js";
import { CurrencyIntelligenceController } from "./currency-intelligence-controller.js";
import {
  CurrencyIntelligenceManager,
  type CurrencyIntelligenceDependencies,
} from "./currency-intelligence-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface CurrencyIntelligenceEngineOptions {
  configuration?: Partial<CurrencyIntelligenceConfiguration>;
}

export type { CurrencyIntelligenceDependencies };

/**
 * Currency Intelligence (PILLOW-CUR-001 / X4-05).
 * Enterprise multi-currency intelligence — structural FX only.
 */
export class CurrencyIntelligenceEngine {
  private initializedAt: string | null = null;
  private readonly controller: CurrencyIntelligenceController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: CurrencyIntelligenceDependencies,
    options: CurrencyIntelligenceEngineOptions = {},
  ) {
    const config = buildCurrencyIntelligenceConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new CurrencyIntelligenceManager(dependencies);
    this.controller = new CurrencyIntelligenceController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<CurrencyIntelligenceEngineState> {
    const doc = await this.reader.readText(CURRENCY_INTELLIGENCE_SYSTEM_PATH);
    if (!doc?.includes("Currency Intelligence")) {
      throw new Error(
        `${CURRENCY_INTELLIGENCE_SYSTEM_PATH} missing — Currency Intelligence requires X4-05 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendCurLog({
      event: "CURRENCY_INTELLIGENCE_ready",
      level: "info",
      details:
        "X4-05 Currency Intelligence initialized — structural FX only; never convert with unvalidated exchange data",
    });
    return this.getState();
  }

  getState(): CurrencyIntelligenceEngineState {
    if (!this.initializedAt) {
      throw new Error("Currency Intelligence not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const records = this.controller.getManager().getCurrencyRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalCurrencyRecords: records.length,
      anomalyCount: this.controller.getManager().anomalyCount(),
      averageFluctuationPercent: this.controller.getManager().averageFluctuationPercent(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-CUR-001",
      missionId: "X4-05",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectCurrencyIntelligence(input: ConnectCurrencyIntelligenceInput = {}): CurRunReport {
    return this.controller.connectCurrencyIntelligence(input);
  }

  manageCurrencies(input: CurrencyAnalysisInput = {}): CurRunReport {
    return this.controller.manageCurrencies(input);
  }

  detectPreference(input: CurrencyAnalysisInput = {}): CurRunReport {
    return this.controller.detectPreference(input);
  }

  convertPrice(input: CurrencyAnalysisInput = {}): CurRunReport {
    return this.controller.convertPrice(input);
  }

  refreshExchangeRates(input: CurrencyAnalysisInput = {}): CurRunReport {
    return this.controller.refreshExchangeRates(input);
  }

  monitorFluctuations(input: CurrencyAnalysisInput = {}): CurRunReport {
    return this.controller.monitorFluctuations(input);
  }

  regionalPricing(input: CurrencyAnalysisInput = {}): CurRunReport {
    return this.controller.regionalPricing(input);
  }

  detectAnomalies(input: CurrencyAnalysisInput = {}): CurRunReport {
    return this.controller.detectAnomalies(input);
  }

  recommendCurrency(input: CurrencyAnalysisInput = {}): CurRunReport {
    return this.controller.recommendCurrency(input);
  }

  runDiagnostics(input: RunCurDiagnosticsInput = {}): CurRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): CurRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getCurrencyRecords() {
    return this.controller.getManager().getCurrencyRecords();
  }

  getRecommendations() {
    return this.controller.getManager().getRecommendations();
  }

  updateConfiguration(
    overrides: Partial<CurrencyIntelligenceConfiguration>,
  ): CurrencyIntelligenceEngineState {
    const next = buildCurrencyIntelligenceConfiguration(this.bootstrap.repositoryRoot, {
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
        `Currency records: ${state.health.totalCurrencyRecords}`,
        `Anomalies: ${state.health.anomalyCount}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No currency intelligence operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): CurCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalCurrencyRecords: state.health.totalCurrencyRecords,
      anomalyCount: state.health.anomalyCount,
      averageFluctuationPercent: state.health.averageFluctuationPercent,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected: Object.values(record?.dependencyPresence ?? {}).filter(Boolean)
        .length,
      recentLogs: getCurLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createCurrencyIntelligenceEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: CurrencyIntelligenceDependencies,
  options?: CurrencyIntelligenceEngineOptions,
): CurrencyIntelligenceEngine {
  return new CurrencyIntelligenceEngine(bootstrap, dependencies, options);
}

export function resetCurrencyIntelligenceForTesting(): void {
  resetCurLogsForTesting();
  new CurrencyIntelligenceManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
