import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { FinancialFrameworkEngine } from "../financial-framework/engine.js";
import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ExpenseEngine } from "../expense-engine/engine.js";
import {
  buildProfitCalculationEngineConfiguration,
  type ProfitCalculationEngineConfiguration,
} from "./configuration.js";
import { appendPcLog, getPcLogs, resetPcLogsForTesting } from "./pc-logging.js";
import { PROFIT_CALCULATION_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  AggregateProfitInput,
  CalculateProfitByMarketplaceInput,
  CalculateProfitByOrderInput,
  CalculateProfitByProductInput,
  CalculateProfitBySupplierInput,
  CalculateProfitInput,
  ConnectProfitCalculationEngineInput,
  ProfitCalculationRunReport,
  ProfitCalculationEngineState,
  ProfitCockpitSnapshot,
} from "./types.js";
import { ProfitCalculationController } from "./profit-calculation-controller.js";
import { ProfitCalculationManager } from "./profit-calculation-manager.js";

export interface ProfitCalculationEngineOptions {
  configuration?: Partial<ProfitCalculationEngineConfiguration>;
}

/**
 * Profit Calculation Engine (PILLOW-PC-001 / R3-06).
 * Centralized profitability calculation consuming R3-04 and R3-05.
 */
export class ProfitCalculationEngine {
  private initializedAt: string | null = null;
  private readonly controller: ProfitCalculationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    financialFramework: FinancialFrameworkEngine,
    revenueEngine: RevenueEngine,
    expenseEngine: ExpenseEngine,
    options: ProfitCalculationEngineOptions = {},
  ) {
    const config = buildProfitCalculationEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new ProfitCalculationManager(
      financialFramework,
      revenueEngine,
      expenseEngine,
    );
    this.controller = new ProfitCalculationController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ProfitCalculationEngineState> {
    const doc = await this.reader.readText(PROFIT_CALCULATION_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Profit Calculation Engine")) {
      throw new Error(
        `${PROFIT_CALCULATION_ENGINE_SYSTEM_PATH} missing — Profit Calculation Engine requires R3-06 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendPcLog({
      event: "engine_initialization",
      level: "info",
      details: "R3-06 Profit Calculation Engine initialized",
    });
    return this.getState();
  }

  getState(): ProfitCalculationEngineState {
    if (!this.initializedAt) {
      throw new Error("Profit Calculation Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const profitRecords = this.controller.getManager().getProfitRecords();
    const aggregateNetProfit = profitRecords.reduce((s, r) => s + r.netProfit, 0);
    const aggregateProfitMargin =
      profitRecords.length > 0
        ? profitRecords.reduce((s, r) => s + r.profitMargin, 0) / profitRecords.length
        : 0;

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalProfitRecords: profitRecords.length,
      aggregateNetProfit,
      aggregateProfitMargin,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-PC-001",
      missionId: "R3-06",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectProfitCalculationEngine(
    input: ConnectProfitCalculationEngineInput = {},
  ): ProfitCalculationRunReport {
    return this.controller.connectProfitCalculationEngine(input);
  }

  calculateProfit(input: CalculateProfitInput = {}): ProfitCalculationRunReport {
    return this.controller.calculateProfit(input);
  }

  calculateProfitByMarketplace(
    input: CalculateProfitByMarketplaceInput,
  ): ProfitCalculationRunReport {
    return this.controller.calculateProfitByMarketplace(input);
  }

  calculateProfitBySupplier(input: CalculateProfitBySupplierInput): ProfitCalculationRunReport {
    return this.controller.calculateProfitBySupplier(input);
  }

  calculateProfitByProduct(input: CalculateProfitByProductInput): ProfitCalculationRunReport {
    return this.controller.calculateProfitByProduct(input);
  }

  calculateProfitByOrder(input: CalculateProfitByOrderInput): ProfitCalculationRunReport {
    return this.controller.calculateProfitByOrder(input);
  }

  aggregateProfit(input: AggregateProfitInput = {}): ProfitCalculationRunReport {
    return this.controller.aggregateProfit(input);
  }

  getLatestReport(): ProfitCalculationRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getProfitRecords() {
    return this.controller.getManager().getProfitRecords();
  }

  updateConfiguration(
    overrides: Partial<ProfitCalculationEngineConfiguration>,
  ): ProfitCalculationEngineState {
    const next = buildProfitCalculationEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Profit engine status: ${state.status}`,
        `Aggregate net profit: ${state.health.aggregateNetProfit}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No profit operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ProfitCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalProfitRecords: state.health.totalProfitRecords,
      aggregateNetProfit: state.health.aggregateNetProfit,
      aggregateProfitMargin: state.health.aggregateProfitMargin,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      recentLogs: getPcLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createProfitCalculationEngine(
  bootstrap: EmpireBootstrapContext,
  financialFramework: FinancialFrameworkEngine,
  revenueEngine: RevenueEngine,
  expenseEngine: ExpenseEngine,
  options?: ProfitCalculationEngineOptions,
): ProfitCalculationEngine {
  return new ProfitCalculationEngine(
    bootstrap,
    financialFramework,
    revenueEngine,
    expenseEngine,
    options,
  );
}

export function resetProfitCalculationEngineForTesting(): void {
  resetPcLogsForTesting();
  new ProfitCalculationManager(null, null, null).resetForTesting();
}
