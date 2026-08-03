/** X4-14 — Global Risk Intelligence Engine. */

import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildGlobalRiskIntelligenceConfiguration,
  type GlobalRiskIntelligenceConfiguration,
} from "./configuration.js";
import { appendRgoLog, getRgoLogs, resetRgoLogsForTesting } from "./gri-logging.js";
import { GLOBAL_RISK_INTELLIGENCE_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectGlobalRiskIntelligenceInput,
  GlobalRiskIntelligenceState,
  RegionalOptimizationInput,
  RgoCockpitSnapshot,
  RgoRunReport,
  RunRgoDiagnosticsInput,
} from "./types.js";
import { RegionalGrowthController } from "./global-risk-intelligence-controller.js";
import {
  RegionalGrowthManager,
  type GlobalRiskIntelligenceDependencies,
} from "./global-risk-intelligence-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface GlobalRiskIntelligenceOptions {
  configuration?: Partial<GlobalRiskIntelligenceConfiguration>;
}

export type { GlobalRiskIntelligenceDependencies };

/**
 * Global Risk Intelligence (PILLOW-GRI-001 / X4-15).
 * Structural international risk monitoring only; no risk decision is made
 * from unvalidated intelligence.
 */
export class GlobalRiskIntelligenceEngine {
  private initializedAt: string | null = null;
  private readonly controller: RegionalGrowthController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: GlobalRiskIntelligenceDependencies,
    options: GlobalRiskIntelligenceOptions = {},
  ) {
    const config = buildGlobalRiskIntelligenceConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new RegionalGrowthManager(dependencies);
    this.controller = new RegionalGrowthController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<GlobalRiskIntelligenceState> {
    const doc = await this.reader.readText(GLOBAL_RISK_INTELLIGENCE_SYSTEM_PATH);
    if (!doc?.includes("Global Risk Intelligence")) {
      throw new Error(
        `${GLOBAL_RISK_INTELLIGENCE_SYSTEM_PATH} missing — Global Risk Intelligence requires X4-15 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendRgoLog({
      event: "GLOBAL_RISK_INTELLIGENCE_ready",
      level: "info",
      details:
        "X4-15 Global Risk Intelligence initialized — structural signals only; never make decisions using unvalidated risk intelligence",
    });
    return this.getState();
  }

  getState(): GlobalRiskIntelligenceState {
    if (!this.initializedAt) {
      throw new Error("Global Risk Intelligence not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const records = this.controller.getManager().getOptimizationRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalOptimizationRecords: records.length,
      opportunityCount: this.controller.getManager().opportunityCount(),
      bottleneckCount: this.controller.getManager().bottleneckCount(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-GRI-001",
      missionId: "X4-15",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectGlobalRiskIntelligence(input: ConnectGlobalRiskIntelligenceInput = {}): RgoRunReport {
    return this.controller.connectGlobalRiskIntelligence(input);
  }

  monitorRegionalBusinessPerformance(input: RegionalOptimizationInput = {}): RgoRunReport {
    return this.controller.monitorRegionalBusinessPerformance(input);
  }

  monitorGeopoliticalRisks(input: RegionalOptimizationInput = {}): RgoRunReport {
    return this.controller.monitorRegionalBusinessPerformance(input);
  }

  monitorEconomicRisks(input: RegionalOptimizationInput = {}): RgoRunReport {
    return this.controller.monitorRegionalRevenueGrowth(input);
  }

  monitorRegulatoryRisks(input: RegionalOptimizationInput = {}): RgoRunReport {
    return this.controller.detectRegionalPerformanceBottlenecks(input);
  }

  monitorOperationalRisks(input: RegionalOptimizationInput = {}): RgoRunReport {
    return this.controller.monitorRegionalCustomerGrowth(input);
  }

  monitorLogisticsRisks(input: RegionalOptimizationInput = {}): RgoRunReport {
    return this.controller.monitorRegionalOperationalEfficiency(input);
  }

  monitorFinancialRisks(input: RegionalOptimizationInput = {}): RgoRunReport {
    return this.controller.monitorRegionalProfitability(input);
  }

  monitorRegionalBusinessRisks(input: RegionalOptimizationInput = {}): RgoRunReport {
    return this.controller.monitorRegionalBusinessPerformance(input);
  }

  detectEmergingInternationalRisks(input: RegionalOptimizationInput = {}): RgoRunReport {
    return this.controller.detectRegionalGrowthOpportunities(input);
  }

  rankGlobalRisks(input: RegionalOptimizationInput = {}): RgoRunReport {
    return this.controller.rankRegionalOptimizationPriorities(input);
  }

  recommendRiskMitigation(input: RegionalOptimizationInput = {}): RgoRunReport {
    return this.controller.recommendRegionalGrowth(input);
  }

  monitorRegionalRevenueGrowth(input: RegionalOptimizationInput = {}): RgoRunReport {
    return this.controller.monitorRegionalRevenueGrowth(input);
  }

  monitorRegionalProfitability(input: RegionalOptimizationInput = {}): RgoRunReport {
    return this.controller.monitorRegionalProfitability(input);
  }

  monitorRegionalCustomerGrowth(input: RegionalOptimizationInput = {}): RgoRunReport {
    return this.controller.monitorRegionalCustomerGrowth(input);
  }

  monitorRegionalOperationalEfficiency(input: RegionalOptimizationInput = {}): RgoRunReport {
    return this.controller.monitorRegionalOperationalEfficiency(input);
  }

  detectRegionalGrowthOpportunities(input: RegionalOptimizationInput = {}): RgoRunReport {
    return this.controller.detectRegionalGrowthOpportunities(input);
  }

  detectRegionalPerformanceBottlenecks(input: RegionalOptimizationInput = {}): RgoRunReport {
    return this.controller.detectRegionalPerformanceBottlenecks(input);
  }

  rankRegionalOptimizationPriorities(input: RegionalOptimizationInput = {}): RgoRunReport {
    return this.controller.rankRegionalOptimizationPriorities(input);
  }

  recommendRegionalGrowth(input: RegionalOptimizationInput = {}): RgoRunReport {
    return this.controller.recommendRegionalGrowth(input);
  }

  runDiagnostics(input: RunRgoDiagnosticsInput = {}): RgoRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): RgoRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getOptimizationRecords() {
    return this.controller.getManager().getOptimizationRecords();
  }

  getRiskRecords() {
    return this.getOptimizationRecords();
  }

  getRecommendations() {
    return this.controller.getManager().getRecommendations();
  }

  updateConfiguration(
    overrides: Partial<GlobalRiskIntelligenceConfiguration>,
  ): GlobalRiskIntelligenceState {
    const next = buildGlobalRiskIntelligenceConfiguration(this.bootstrap.repositoryRoot, {
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
        `Optimization records: ${state.health.totalOptimizationRecords}`,
        `Bottlenecks: ${state.health.bottleneckCount}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No regional growth optimization operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): RgoCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalOptimizationRecords: state.health.totalOptimizationRecords,
      opportunityCount: state.health.opportunityCount,
      bottleneckCount: state.health.bottleneckCount,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected: Object.values(record?.dependencyPresence ?? {}).filter(Boolean)
        .length,
      recentLogs: getRgoLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createGlobalRiskIntelligenceEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: GlobalRiskIntelligenceDependencies,
  options?: GlobalRiskIntelligenceOptions,
): GlobalRiskIntelligenceEngine {
  return new GlobalRiskIntelligenceEngine(bootstrap, dependencies, options);
}

export function resetGlobalRiskIntelligenceForTesting(): void {
  resetRgoLogsForTesting();
  new RegionalGrowthManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
