/** X3-02 — Winning Product Detector engine. */

import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildWinningProductDetectorConfiguration,
  type WinningProductDetectorConfiguration,
} from "./configuration.js";
import { appendWpdLog, getWpdLogs, resetWpdLogsForTesting } from "./wpd-logging.js";
import { WINNING_PRODUCT_DETECTOR_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectWinningProductDetectorInput,
  ProductAnalysisInput,
  RunWpdDiagnosticsInput,
  WpdCockpitSnapshot,
  WpdRunReport,
  WinningProductDetectorState,
} from "./types.js";
import { WinningProductDetectorController } from "./winning-product-detector-controller.js";
import {
  WinningProductDetectorManager,
  type WinningProductDetectorDependencies,
} from "./winning-product-detector-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface WinningProductDetectorEngineOptions {
  configuration?: Partial<WinningProductDetectorConfiguration>;
}

export type { WinningProductDetectorDependencies };

/**
 * Winning Product Detector (PILLOW-WPD-001 / X3-02).
 * Product opportunity engine — identifies breakout products early via structural signals.
 */
export class WinningProductDetectorEngine {
  private initializedAt: string | null = null;
  private readonly controller: WinningProductDetectorController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    dependencies: WinningProductDetectorDependencies,
    options: WinningProductDetectorEngineOptions = {},
  ) {
    const config = buildWinningProductDetectorConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new WinningProductDetectorManager(dependencies);
    this.controller = new WinningProductDetectorController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<WinningProductDetectorState> {
    const doc = await this.reader.readText(WINNING_PRODUCT_DETECTOR_SYSTEM_PATH);
    if (!doc?.includes("Winning Product Detector")) {
      throw new Error(
        `${WINNING_PRODUCT_DETECTOR_SYSTEM_PATH} missing — Winning Product Detector requires X3-02 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendWpdLog({
      event: "WINNING_PRODUCT_DETECTOR_ready",
      level: "info",
      details:
        "X3-02 Winning Product Detector initialized — structural signals only; performance data never manipulated",
    });
    return this.getState();
  }

  getState(): WinningProductDetectorState {
    if (!this.initializedAt) {
      throw new Error("Winning Product Detector not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const products = this.controller.getManager().getProductRecords();

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalProductRecords: products.length,
      breakoutCount: this.controller.getManager().breakoutCount(),
      decliningCount: this.controller.getManager().decliningCount(),
      averageScalingPotential: this.controller.getManager().averageScalingPotential(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-WPD-001",
      missionId: "X3-02",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectWinningProductDetector(
    input: ConnectWinningProductDetectorInput = {},
  ): WpdRunReport {
    return this.controller.connectWinningProductDetector(input);
  }

  monitorProductPerformance(input: ProductAnalysisInput = {}): WpdRunReport {
    return this.controller.monitorProductPerformance(input);
  }

  analyzeSalesVelocity(input: ProductAnalysisInput = {}): WpdRunReport {
    return this.controller.analyzeSalesVelocity(input);
  }

  analyzeDemand(input: ProductAnalysisInput = {}): WpdRunReport {
    return this.controller.analyzeDemand(input);
  }

  analyzeTrends(input: ProductAnalysisInput = {}): WpdRunReport {
    return this.controller.analyzeTrends(input);
  }

  detectBreakouts(input: ProductAnalysisInput = {}): WpdRunReport {
    return this.controller.detectBreakouts(input);
  }

  detectDeclining(input: ProductAnalysisInput = {}): WpdRunReport {
    return this.controller.detectDeclining(input);
  }

  rankProducts(input: ProductAnalysisInput = {}): WpdRunReport {
    return this.controller.rankProducts(input);
  }

  generateRecommendations(input: ProductAnalysisInput = {}): WpdRunReport {
    return this.controller.generateRecommendations(input);
  }

  runDiagnostics(input: RunWpdDiagnosticsInput = {}): WpdRunReport {
    return this.controller.runDiagnostics(input);
  }

  getLatestReport(): WpdRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getProductRecords() {
    return this.controller.getManager().getProductRecords();
  }

  getRecommendations() {
    return this.controller.getManager().getRecommendations();
  }

  updateConfiguration(
    overrides: Partial<WinningProductDetectorConfiguration>,
  ): WinningProductDetectorState {
    const next = buildWinningProductDetectorConfiguration(this.bootstrap.repositoryRoot, {
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
        `Detector status: ${state.status}`,
        `Product records: ${state.health.totalProductRecords}`,
        `Breakouts: ${state.health.breakoutCount}`,
        `Declining: ${state.health.decliningCount}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No detector operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): WpdCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalProductRecords: state.health.totalProductRecords,
      breakoutCount: state.health.breakoutCount,
      decliningCount: state.health.decliningCount,
      averageScalingPotential: state.health.averageScalingPotential,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      dependenciesConnected: Object.values(record?.dependencyPresence ?? {}).filter(Boolean)
        .length,
      recentLogs: getWpdLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createWinningProductDetectorEngine(
  bootstrap: EmpireBootstrapContext,
  dependencies: WinningProductDetectorDependencies,
  options?: WinningProductDetectorEngineOptions,
): WinningProductDetectorEngine {
  return new WinningProductDetectorEngine(bootstrap, dependencies, options);
}

export function resetWinningProductDetectorForTesting(): void {
  resetWpdLogsForTesting();
  new WinningProductDetectorManager().resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
