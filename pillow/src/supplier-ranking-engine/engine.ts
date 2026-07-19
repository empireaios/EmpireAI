import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { SupplierProductSyncEngine } from "../supplier-product-sync/engine.js";
import type { SupplierInventorySyncEngine } from "../supplier-inventory-sync/engine.js";
import type { SupplierPricingEngine } from "../supplier-pricing-engine/engine.js";
import {
  buildSupplierRankingEngineConfiguration,
  type SupplierRankingEngineConfiguration,
} from "./configuration.js";
import { appendSreLog, getSreLogs, resetSreLogsForTesting } from "./sre-logging.js";
import { SUPPLIER_RANKING_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  EvaluateSupplierInput,
  RankSuppliersInput,
  SupplierRankingCockpitSnapshot,
  SupplierRankingReport,
  SupplierRankingEngineState,
} from "./types.js";
import { SupplierRankingController } from "./supplier-ranking-controller.js";
import { SupplierRankingManager } from "./supplier-ranking-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface SupplierRankingEngineOptions {
  configuration?: Partial<SupplierRankingEngineConfiguration>;
}

/**
 * Supplier Ranking Engine (PILLOW-SRE-001 / R2-08).
 * Intelligent supplier evaluation — consumes R2-05, R2-06, and R2-07.
 */
export class SupplierRankingEngine {
  private initializedAt: string | null = null;
  private readonly controller: SupplierRankingController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    productSync: SupplierProductSyncEngine,
    inventorySync: SupplierInventorySyncEngine,
    pricingEngine: SupplierPricingEngine,
    options: SupplierRankingEngineOptions = {},
  ) {
    const config = buildSupplierRankingEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new SupplierRankingManager(productSync, inventorySync, pricingEngine);
    this.controller = new SupplierRankingController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<SupplierRankingEngineState> {
    const doc = await this.reader.readText(SUPPLIER_RANKING_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Supplier Ranking Engine")) {
      throw new Error(
        `${SUPPLIER_RANKING_ENGINE_SYSTEM_PATH} missing — Supplier Ranking Engine requires R2-08 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendSreLog({
      event: "engine_initialization",
      level: "info",
      details: "R2-08 Supplier Ranking Engine initialized",
    });
    return this.getState();
  }

  getState(): SupplierRankingEngineState {
    if (!this.initializedAt) {
      throw new Error("Supplier Ranking Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const rankings = this.controller.getManager().getRankings();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      rankings,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-SRE-001",
      missionId: "R2-08",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      rankings,
      health,
      performance,
    };
  }

  rankSuppliers(input: RankSuppliersInput = {}): SupplierRankingReport {
    return this.controller.rankSuppliers(input);
  }

  evaluateSupplier(input: EvaluateSupplierInput): SupplierRankingReport {
    return this.controller.evaluateSupplier(input);
  }

  getLatestReport(): SupplierRankingReport | null {
    return this.controller.getLatestReport();
  }

  getRankings() {
    return this.controller.getManager().getRankings();
  }

  updateConfiguration(
    overrides: Partial<SupplierRankingEngineConfiguration>,
  ): SupplierRankingEngineState {
    const next = buildSupplierRankingEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Ranking engine status: ${state.status}`,
        `Ranking count: ${state.rankings.length}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No ranking operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): SupplierRankingCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const top = state.rankings.find((r) => r.rankingPosition === 1);

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      rankingCount: state.rankings.length,
      lastRankingAt: state.health.lastRankingAt,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      highPerformersDetected: state.performance.highPerformersDetected,
      decliningPerformersDetected: state.performance.decliningPerformersDetected,
      topSupplierId: top?.supplierId ?? null,
      recentLogs: getSreLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createSupplierRankingEngine(
  bootstrap: EmpireBootstrapContext,
  productSync: SupplierProductSyncEngine,
  inventorySync: SupplierInventorySyncEngine,
  pricingEngine: SupplierPricingEngine,
  options?: SupplierRankingEngineOptions,
): SupplierRankingEngine {
  return new SupplierRankingEngine(bootstrap, productSync, inventorySync, pricingEngine, options);
}

export function resetSupplierRankingEngineForTesting(): void {
  resetSreLogsForTesting();
  new SupplierRankingManager(null, null, null).resetForTesting();
  new HealthMonitor().resetForTesting();
  new RecoveryManager().reset();
}
