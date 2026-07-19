import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { ProcurementEngine } from "../procurement-engine/engine.js";
import type { SupplierRankingEngine } from "../supplier-ranking-engine/engine.js";
import type { SupplierPricingEngine } from "../supplier-pricing-engine/engine.js";
import type { SupplierRiskMonitorEngine } from "../supplier-risk-monitor/engine.js";
import type { LogisticsOptimizationEngine } from "../logistics-optimization/engine.js";
import {
  buildProcurementIntelligenceConfiguration,
  type ProcurementIntelligenceConfiguration,
} from "./configuration.js";
import { appendPiLog, getPiLogs, resetPiLogsForTesting } from "./pi-logging.js";
import { PROCUREMENT_INTELLIGENCE_SYSTEM_PATH } from "./paths.js";
import type {
  AnalyzeProcurementInput,
  ProcurementIntelligenceCockpitSnapshot,
  ProcurementIntelligenceReport,
  ProcurementIntelligenceState,
} from "./types.js";
import { ProcurementIntelligenceController } from "./procurement-intelligence-controller.js";
import { ProcurementIntelligenceManager } from "./procurement-intelligence-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface ProcurementIntelligenceOptions {
  configuration?: Partial<ProcurementIntelligenceConfiguration>;
}

/**
 * Procurement Intelligence (PILLOW-PI-001 / R2-19).
 * Intelligent procurement decisions — consumes R2-07, R2-08, R2-09, R2-16, R2-17.
 */
export class ProcurementIntelligenceEngine {
  private initializedAt: string | null = null;
  private readonly controller: ProcurementIntelligenceController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    procurementEngine: ProcurementEngine,
    rankingEngine: SupplierRankingEngine,
    pricingEngine: SupplierPricingEngine,
    riskMonitor: SupplierRiskMonitorEngine,
    logisticsOptimization: LogisticsOptimizationEngine,
    options: ProcurementIntelligenceOptions = {},
  ) {
    const config = buildProcurementIntelligenceConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new ProcurementIntelligenceManager(
      procurementEngine,
      rankingEngine,
      pricingEngine,
      riskMonitor,
      logisticsOptimization,
    );
    this.controller = new ProcurementIntelligenceController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ProcurementIntelligenceState> {
    const doc = await this.reader.readText(PROCUREMENT_INTELLIGENCE_SYSTEM_PATH);
    if (!doc?.includes("Procurement Intelligence")) {
      throw new Error(
        `${PROCUREMENT_INTELLIGENCE_SYSTEM_PATH} missing — Procurement Intelligence requires R2-19 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendPiLog({
      event: "engine_initialization",
      level: "info",
      details: "R2-19 Procurement Intelligence initialized",
    });
    return this.getState();
  }

  getState(): ProcurementIntelligenceState {
    if (!this.initializedAt) {
      throw new Error("Procurement Intelligence not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const records = this.controller.getManager().getRecords();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      records,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-PI-001",
      missionId: "R2-19",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      records,
      health,
      performance,
    };
  }

  analyzeProcurement(input: AnalyzeProcurementInput = {}): ProcurementIntelligenceReport {
    return this.controller.analyzeProcurement(input);
  }

  getLatestReport(): ProcurementIntelligenceReport | null {
    return this.controller.getLatestReport();
  }

  getRecords() {
    return this.controller.getManager().getRecords();
  }

  updateConfiguration(
    overrides: Partial<ProcurementIntelligenceConfiguration>,
  ): ProcurementIntelligenceState {
    const next = buildProcurementIntelligenceConfiguration(this.bootstrap.repositoryRoot, {
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
        `Procurement intelligence status: ${state.status}`,
        `Intelligence record count: ${state.records.length}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No procurement analysis operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ProcurementIntelligenceCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      intelligenceRecordCount: state.records.length,
      lastAnalyzeAt: state.health.lastAnalyzeAt,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      anomaliesDetected: state.health.anomaliesDetected,
      recommendationsGenerated: state.health.recommendationsGenerated,
      costsOptimized: state.performance.costsOptimized,
      recentLogs: getPiLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createProcurementIntelligenceEngine(
  bootstrap: EmpireBootstrapContext,
  procurementEngine: ProcurementEngine,
  rankingEngine: SupplierRankingEngine,
  pricingEngine: SupplierPricingEngine,
  riskMonitor: SupplierRiskMonitorEngine,
  logisticsOptimization: LogisticsOptimizationEngine,
  options?: ProcurementIntelligenceOptions,
): ProcurementIntelligenceEngine {
  return new ProcurementIntelligenceEngine(
    bootstrap,
    procurementEngine,
    rankingEngine,
    pricingEngine,
    riskMonitor,
    logisticsOptimization,
    options,
  );
}

export function resetProcurementIntelligenceForTesting(): void {
  resetPiLogsForTesting();
  new ProcurementIntelligenceManager(null, null, null, null, null).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
