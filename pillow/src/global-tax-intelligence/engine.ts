/** X4-07 — Global Tax Intelligence Engine. */

import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildGlobalTaxIntelligenceConfiguration,
  type GlobalTaxIntelligenceConfiguration,
} from "./configuration.js";
import { appendGtiLog, getGtiLogs, resetGtiLogsForTesting } from "./gti-logging.js";
import { GLOBAL_TAX_INTELLIGENCE_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectGlobalTaxIntelligenceInput,
  GlobalTaxIntelligenceState,
  GtiCockpitSnapshot,
  GtiRunReport,
  RunGtiDiagnosticsInput,
  TaxAnalysisInput,
} from "./types.js";
import { GlobalTaxIntelligenceController } from "./global-tax-intelligence-controller.js";
import {
  GlobalTaxIntelligenceManager,
  type GlobalTaxIntelligenceDependencies,
} from "./global-tax-intelligence-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface GlobalTaxIntelligenceOptions {
  configuration?: Partial<GlobalTaxIntelligenceConfiguration>;
}

export type { GlobalTaxIntelligenceDependencies };

/**
 * Global Tax Intelligence (PILLOW-GTI-001 / X4-07).
 * Enterprise international tax intelligence — structural signals only;
 * never unvalidated calculations as authoritative legal advice.
 */
export class GlobalTaxIntelligenceEngine {
  private initializedAt: string | null = null;
  private readonly controller: GlobalTaxIntelligenceController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: GlobalTaxIntelligenceDependencies,
    options: GlobalTaxIntelligenceOptions = {},
  ) {
    const config = buildGlobalTaxIntelligenceConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new GlobalTaxIntelligenceManager(dependencies);
    this.controller = new GlobalTaxIntelligenceController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<GlobalTaxIntelligenceState> {
    const doc = await this.reader.readText(GLOBAL_TAX_INTELLIGENCE_SYSTEM_PATH);
    if (!doc?.includes("Global Tax Intelligence")) {
      throw new Error(
        `${GLOBAL_TAX_INTELLIGENCE_SYSTEM_PATH} missing — Global Tax Intelligence requires X4-07 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendGtiLog({
      event: "GLOBAL_TAX_INTELLIGENCE_ready",
      level: "info",
      details:
        "X4-07 Global Tax Intelligence initialized — structural signals only; never authoritative legal advice",
    });
    return this.getState();
  }

  getState(): GlobalTaxIntelligenceState {
    if (!this.initializedAt) {
      throw new Error("Global Tax Intelligence not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const records = this.controller.getManager().getTaxRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalTaxRecords: records.length,
      highRiskCount: this.controller.getManager().highRiskCount(),
      optimizationCount: this.controller.getManager().optimizationCount(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-GTI-001",
      missionId: "X4-07",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectGlobalTaxIntelligence(
    input: ConnectGlobalTaxIntelligenceInput = {},
  ): GtiRunReport {
    return this.controller.connectGlobalTaxIntelligence(input);
  }

  manageCountryTaxRules(input: TaxAnalysisInput = {}): GtiRunReport {
    return this.controller.manageCountryTaxRules(input);
  }

  monitorTaxRegulationUpdates(input: TaxAnalysisInput = {}): GtiRunReport {
    return this.controller.monitorTaxRegulationUpdates(input);
  }

  manageIndirectTaxes(input: TaxAnalysisInput = {}): GtiRunReport {
    return this.controller.manageIndirectTaxes(input);
  }

  manageDirectTaxes(input: TaxAnalysisInput = {}): GtiRunReport {
    return this.controller.manageDirectTaxes(input);
  }

  manageCrossBorder(input: TaxAnalysisInput = {}): GtiRunReport {
    return this.controller.manageCrossBorder(input);
  }

  estimateTaxObligation(input: TaxAnalysisInput = {}): GtiRunReport {
    return this.controller.estimateTaxObligation(input);
  }

  detectComplianceRisks(input: TaxAnalysisInput = {}): GtiRunReport {
    return this.controller.detectComplianceRisks(input);
  }

  detectOptimizationOpportunities(input: TaxAnalysisInput = {}): GtiRunReport {
    return this.controller.detectOptimizationOpportunities(input);
  }

  recommendTax(input: TaxAnalysisInput = {}): GtiRunReport {
    return this.controller.recommendTax(input);
  }

  runDiagnostics(input: RunGtiDiagnosticsInput = {}): GtiRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): GtiRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getTaxRecords() {
    return this.controller.getManager().getTaxRecords();
  }

  getRecommendations() {
    return this.controller.getManager().getRecommendations();
  }

  updateConfiguration(
    overrides: Partial<GlobalTaxIntelligenceConfiguration>,
  ): GlobalTaxIntelligenceState {
    const next = buildGlobalTaxIntelligenceConfiguration(this.bootstrap.repositoryRoot, {
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
        `Tax records: ${state.health.totalTaxRecords}`,
        `High-risk: ${state.health.highRiskCount}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No global tax intelligence operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): GtiCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalTaxRecords: state.health.totalTaxRecords,
      highRiskCount: state.health.highRiskCount,
      optimizationCount: state.health.optimizationCount,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected: Object.values(record?.dependencyPresence ?? {}).filter(Boolean)
        .length,
      recentLogs: getGtiLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createGlobalTaxIntelligenceEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: GlobalTaxIntelligenceDependencies,
  options?: GlobalTaxIntelligenceOptions,
): GlobalTaxIntelligenceEngine {
  return new GlobalTaxIntelligenceEngine(bootstrap, dependencies, options);
}

export function resetGlobalTaxIntelligenceForTesting(): void {
  resetGtiLogsForTesting();
  new GlobalTaxIntelligenceManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
