/** X4-02 — Country Intelligence Engine. */

import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildCountryIntelligenceEngineConfiguration,
  type CountryIntelligenceEngineConfiguration,
} from "./configuration.js";
import { appendCieLog, getCieLogs, resetCieLogsForTesting } from "./cie-logging.js";
import { COUNTRY_INTELLIGENCE_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  CieCockpitSnapshot,
  CieRunReport,
  ConnectCountryIntelligenceEngineInput,
  CountryAnalysisInput,
  CountryIntelligenceEngineState,
  RunCieDiagnosticsInput,
} from "./types.js";
import { CountryIntelligenceController } from "./country-intelligence-controller.js";
import {
  CountryIntelligenceManager,
  type CountryIntelligenceEngineDependencies,
} from "./country-intelligence-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface CountryIntelligenceEngineOptions {
  configuration?: Partial<CountryIntelligenceEngineConfiguration>;
}

export type { CountryIntelligenceEngineDependencies };

/**
 * Country Intelligence Engine (PILLOW-CIE-001 / X4-02).
 * Country evaluation for international expansion — structural signals only.
 */
export class CountryIntelligenceEngine {
  private initializedAt: string | null = null;
  private readonly controller: CountryIntelligenceController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: CountryIntelligenceEngineDependencies,
    options: CountryIntelligenceEngineOptions = {},
  ) {
    const config = buildCountryIntelligenceEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new CountryIntelligenceManager(dependencies);
    this.controller = new CountryIntelligenceController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<CountryIntelligenceEngineState> {
    const doc = await this.reader.readText(COUNTRY_INTELLIGENCE_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Country Intelligence Engine")) {
      throw new Error(
        `${COUNTRY_INTELLIGENCE_ENGINE_SYSTEM_PATH} missing — Country Intelligence Engine requires X4-02 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendCieLog({
      event: "COUNTRY_INTELLIGENCE_ENGINE_ready",
      level: "info",
      details:
        "X4-02 Country Intelligence Engine initialized — structural signals only; never recommend unvalidated country data",
    });
    return this.getState();
  }

  getState(): CountryIntelligenceEngineState {
    if (!this.initializedAt) {
      throw new Error("Country Intelligence Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const countries = this.controller.getManager().getCountryRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalCountryRecords: countries.length,
      highPriorityCount: this.controller.getManager().highPriorityCount(),
      averageCompositeScore: this.controller.getManager().averageCompositeScore(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-CIE-001",
      missionId: "X4-02",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectCountryIntelligenceEngine(
    input: ConnectCountryIntelligenceEngineInput = {},
  ): CieRunReport {
    return this.controller.connectCountryIntelligenceEngine(input);
  }

  evaluateCountry(input: CountryAnalysisInput = {}): CieRunReport {
    return this.controller.evaluateCountry(input);
  }

  monitorEconomicIndicators(input: CountryAnalysisInput = {}): CieRunReport {
    return this.controller.monitorEconomicIndicators(input);
  }

  analyzeMarket(input: CountryAnalysisInput = {}): CieRunReport {
    return this.controller.analyzeMarket(input);
  }

  assessCommerceReadiness(input: CountryAnalysisInput = {}): CieRunReport {
    return this.controller.assessCommerceReadiness(input);
  }

  rankCountries(input: CountryAnalysisInput = {}): CieRunReport {
    return this.controller.rankCountries(input);
  }

  recommendCountries(input: CountryAnalysisInput = {}): CieRunReport {
    return this.controller.recommendCountries(input);
  }

  runDiagnostics(input: RunCieDiagnosticsInput = {}): CieRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): CieRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getCountryRecords() {
    return this.controller.getManager().getCountryRecords();
  }

  getRecommendations() {
    return this.controller.getManager().getRecommendations();
  }

  updateConfiguration(
    overrides: Partial<CountryIntelligenceEngineConfiguration>,
  ): CountryIntelligenceEngineState {
    const next = buildCountryIntelligenceEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Country records: ${state.health.totalCountryRecords}`,
        `High/critical priority: ${state.health.highPriorityCount}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No country intelligence operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): CieCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalCountryRecords: state.health.totalCountryRecords,
      highPriorityCount: state.health.highPriorityCount,
      averageCompositeScore: state.health.averageCompositeScore,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected: Object.values(record?.dependencyPresence ?? {}).filter(Boolean)
        .length,
      recentLogs: getCieLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createCountryIntelligenceEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: CountryIntelligenceEngineDependencies,
  options?: CountryIntelligenceEngineOptions,
): CountryIntelligenceEngine {
  return new CountryIntelligenceEngine(bootstrap, dependencies, options);
}

export function resetCountryIntelligenceEngineForTesting(): void {
  resetCieLogsForTesting();
  new CountryIntelligenceManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
