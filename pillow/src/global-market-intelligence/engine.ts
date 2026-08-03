/** X4-09 — Global Market Intelligence Engine. */

import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildGlobalMarketIntelligenceConfiguration,
  type GlobalMarketIntelligenceConfiguration,
} from "./configuration.js";
import { appendGmiLog, getGmiLogs, resetGmiLogsForTesting } from "./gmi-logging.js";
import { GLOBAL_MARKET_INTELLIGENCE_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectGlobalMarketIntelligenceInput,
  GlobalMarketIntelligenceState,
  GmiCockpitSnapshot,
  GmiRunReport,
  MarketAnalysisInput,
  RunGmiDiagnosticsInput,
} from "./types.js";
import { GlobalMarketIntelligenceController } from "./global-market-intelligence-controller.js";
import {
  GlobalMarketIntelligenceManager,
  type GlobalMarketIntelligenceDependencies,
} from "./global-market-intelligence-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface GlobalMarketIntelligenceOptions {
  configuration?: Partial<GlobalMarketIntelligenceConfiguration>;
}

export type { GlobalMarketIntelligenceDependencies };

/**
 * Global Market Intelligence (PILLOW-GMI-001 / X4-09).
 * Enterprise worldwide market monitoring — structural signals only;
 * never recommend with unvalidated intelligence.
 */
export class GlobalMarketIntelligenceEngine {
  private initializedAt: string | null = null;
  private readonly controller: GlobalMarketIntelligenceController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: GlobalMarketIntelligenceDependencies,
    options: GlobalMarketIntelligenceOptions = {},
  ) {
    const config = buildGlobalMarketIntelligenceConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new GlobalMarketIntelligenceManager(dependencies);
    this.controller = new GlobalMarketIntelligenceController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<GlobalMarketIntelligenceState> {
    const doc = await this.reader.readText(GLOBAL_MARKET_INTELLIGENCE_SYSTEM_PATH);
    if (!doc?.includes("Global Market Intelligence")) {
      throw new Error(
        `${GLOBAL_MARKET_INTELLIGENCE_SYSTEM_PATH} missing — Global Market Intelligence requires X4-09 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendGmiLog({
      event: "GLOBAL_MARKET_INTELLIGENCE_ready",
      level: "info",
      details:
        "X4-09 Global Market Intelligence initialized — structural signals only; never recommend with unvalidated intelligence",
    });
    return this.getState();
  }

  getState(): GlobalMarketIntelligenceState {
    if (!this.initializedAt) {
      throw new Error("Global Market Intelligence not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const records = this.controller.getManager().getMarketRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalMarketRecords: records.length,
      emergingCount: this.controller.getManager().emergingCount(),
      decliningCount: this.controller.getManager().decliningCount(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-GMI-001",
      missionId: "X4-09",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectGlobalMarketIntelligence(
    input: ConnectGlobalMarketIntelligenceInput = {},
  ): GmiRunReport {
    return this.controller.connectGlobalMarketIntelligence(input);
  }

  monitorInternationalMarkets(input: MarketAnalysisInput = {}): GmiRunReport {
    return this.controller.monitorInternationalMarkets(input);
  }

  monitorMarketTrends(input: MarketAnalysisInput = {}): GmiRunReport {
    return this.controller.monitorMarketTrends(input);
  }

  monitorCustomerDemand(input: MarketAnalysisInput = {}): GmiRunReport {
    return this.controller.monitorCustomerDemand(input);
  }

  monitorCompetitorActivity(input: MarketAnalysisInput = {}): GmiRunReport {
    return this.controller.monitorCompetitorActivity(input);
  }

  monitorProductOpportunities(input: MarketAnalysisInput = {}): GmiRunReport {
    return this.controller.monitorProductOpportunities(input);
  }

  monitorRegionalGrowth(input: MarketAnalysisInput = {}): GmiRunReport {
    return this.controller.monitorRegionalGrowth(input);
  }

  detectEmergingMarkets(input: MarketAnalysisInput = {}): GmiRunReport {
    return this.controller.detectEmergingMarkets(input);
  }

  detectDecliningMarkets(input: MarketAnalysisInput = {}): GmiRunReport {
    return this.controller.detectDecliningMarkets(input);
  }

  rankGlobalOpportunities(input: MarketAnalysisInput = {}): GmiRunReport {
    return this.controller.rankGlobalOpportunities(input);
  }

  recommendMarket(input: MarketAnalysisInput = {}): GmiRunReport {
    return this.controller.recommendMarket(input);
  }

  runDiagnostics(input: RunGmiDiagnosticsInput = {}): GmiRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): GmiRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getMarketRecords() {
    return this.controller.getManager().getMarketRecords();
  }

  getRecommendations() {
    return this.controller.getManager().getRecommendations();
  }

  updateConfiguration(
    overrides: Partial<GlobalMarketIntelligenceConfiguration>,
  ): GlobalMarketIntelligenceState {
    const next = buildGlobalMarketIntelligenceConfiguration(this.bootstrap.repositoryRoot, {
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
        `Market records: ${state.health.totalMarketRecords}`,
        `Emerging: ${state.health.emergingCount}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No global market intelligence operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): GmiCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalMarketRecords: state.health.totalMarketRecords,
      emergingCount: state.health.emergingCount,
      decliningCount: state.health.decliningCount,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected: Object.values(record?.dependencyPresence ?? {}).filter(Boolean)
        .length,
      recentLogs: getGmiLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createGlobalMarketIntelligenceEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: GlobalMarketIntelligenceDependencies,
  options?: GlobalMarketIntelligenceOptions,
): GlobalMarketIntelligenceEngine {
  return new GlobalMarketIntelligenceEngine(bootstrap, dependencies, options);
}

export function resetGlobalMarketIntelligenceForTesting(): void {
  resetGmiLogsForTesting();
  new GlobalMarketIntelligenceManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
