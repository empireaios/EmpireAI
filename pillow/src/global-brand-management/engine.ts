/** X4-11 — Global Brand Management Engine. */

import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildGlobalBrandManagementConfiguration,
  type GlobalBrandManagementConfiguration,
} from "./configuration.js";
import { appendGbmLog, getGbmLogs, resetGbmLogsForTesting } from "./gbm-logging.js";
import { GLOBAL_BRAND_MANAGEMENT_SYSTEM_PATH } from "./paths.js";
import type {
  BrandAnalysisInput,
  ConnectGlobalBrandManagementInput,
  GbmCockpitSnapshot,
  GbmRunReport,
  GlobalBrandManagementState,
  RunGbmDiagnosticsInput,
} from "./types.js";
import { GlobalBrandController } from "./global-brand-controller.js";
import {
  GlobalBrandManager,
  type GlobalBrandManagementDependencies,
} from "./global-brand-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface GlobalBrandManagementOptions {
  configuration?: Partial<GlobalBrandManagementConfiguration>;
}

export type { GlobalBrandManagementDependencies };

/**
 * Global Brand Management (PILLOW-GBM-001 / X4-11).
 * Enterprise worldwide brand governance — structural signals only;
 * never modify protected brand assets without authorization.
 */
export class GlobalBrandManagementEngine {
  private initializedAt: string | null = null;
  private readonly controller: GlobalBrandController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: GlobalBrandManagementDependencies,
    options: GlobalBrandManagementOptions = {},
  ) {
    const config = buildGlobalBrandManagementConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new GlobalBrandManager(dependencies);
    this.controller = new GlobalBrandController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<GlobalBrandManagementState> {
    const doc = await this.reader.readText(GLOBAL_BRAND_MANAGEMENT_SYSTEM_PATH);
    if (!doc?.includes("Global Brand Management")) {
      throw new Error(
        `${GLOBAL_BRAND_MANAGEMENT_SYSTEM_PATH} missing — Global Brand Management requires X4-11 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendGbmLog({
      event: "GLOBAL_BRAND_MANAGEMENT_ready",
      level: "info",
      details:
        "X4-11 Global Brand Management initialized — structural signals only; never modify protected assets without authorization",
    });
    return this.getState();
  }

  getState(): GlobalBrandManagementState {
    if (!this.initializedAt) {
      throw new Error("Global Brand Management not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const records = this.controller.getManager().getBrandRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalBrandRecords: records.length,
      inconsistencyCount: this.controller.getManager().inconsistencyCount(),
      reputationRiskCount: this.controller.getManager().reputationRiskCount(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-GBM-001",
      missionId: "X4-11",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectGlobalBrandManagement(input: ConnectGlobalBrandManagementInput = {}): GbmRunReport {
    return this.controller.connectGlobalBrandManagement(input);
  }

  manageWorldwideIdentity(input: BrandAnalysisInput = {}): GbmRunReport {
    return this.controller.manageWorldwideIdentity(input);
  }

  manageRegionalAdaptations(input: BrandAnalysisInput = {}): GbmRunReport {
    return this.controller.manageRegionalAdaptations(input);
  }

  manageBrandConsistency(input: BrandAnalysisInput = {}): GbmRunReport {
    return this.controller.manageBrandConsistency(input);
  }

  monitorBrandPerformance(input: BrandAnalysisInput = {}): GbmRunReport {
    return this.controller.monitorBrandPerformance(input);
  }

  monitorBrandReputation(input: BrandAnalysisInput = {}): GbmRunReport {
    return this.controller.monitorBrandReputation(input);
  }

  monitorBrandCompliance(input: BrandAnalysisInput = {}): GbmRunReport {
    return this.controller.monitorBrandCompliance(input);
  }

  detectBrandInconsistencies(input: BrandAnalysisInput = {}): GbmRunReport {
    return this.controller.detectBrandInconsistencies(input);
  }

  detectReputationRisks(input: BrandAnalysisInput = {}): GbmRunReport {
    return this.controller.detectReputationRisks(input);
  }

  recommendBrand(input: BrandAnalysisInput = {}): GbmRunReport {
    return this.controller.recommendBrand(input);
  }

  runDiagnostics(input: RunGbmDiagnosticsInput = {}): GbmRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): GbmRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getBrandRecords() {
    return this.controller.getManager().getBrandRecords();
  }

  getRecommendations() {
    return this.controller.getManager().getRecommendations();
  }

  updateConfiguration(
    overrides: Partial<GlobalBrandManagementConfiguration>,
  ): GlobalBrandManagementState {
    const next = buildGlobalBrandManagementConfiguration(this.bootstrap.repositoryRoot, {
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
        `Brand records: ${state.health.totalBrandRecords}`,
        `Inconsistencies: ${state.health.inconsistencyCount}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No global brand management operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): GbmCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalBrandRecords: state.health.totalBrandRecords,
      inconsistencyCount: state.health.inconsistencyCount,
      reputationRiskCount: state.health.reputationRiskCount,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected: Object.values(record?.dependencyPresence ?? {}).filter(Boolean)
        .length,
      recentLogs: getGbmLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createGlobalBrandManagementEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: GlobalBrandManagementDependencies,
  options?: GlobalBrandManagementOptions,
): GlobalBrandManagementEngine {
  return new GlobalBrandManagementEngine(bootstrap, dependencies, options);
}

export function resetGlobalBrandManagementForTesting(): void {
  resetGbmLogsForTesting();
  new GlobalBrandManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
