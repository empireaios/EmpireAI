import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { FinancialFrameworkEngine } from "../financial-framework/engine.js";
import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ExpenseEngine } from "../expense-engine/engine.js";
import type { ProfitCalculationEngine } from "../profit-calculation-engine/engine.js";
import type { ReconciliationEngine } from "../reconciliation-engine/engine.js";
import type { InvoiceGeneratorEngine } from "../invoice-generator/engine.js";
import type { RefundEngine } from "../refund-engine/engine.js";
import {
  buildTaxIntelligenceEngineConfiguration,
  type TaxIntelligenceEngineConfiguration,
} from "./configuration.js";
import { appendTxLog, getTxLogs, resetTxLogsForTesting } from "./tx-logging.js";
import { TAX_INTELLIGENCE_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  CalculateTaxAdjustmentInput,
  CalculateTaxLiabilityInput,
  ClassifyTaxableTransactionInput,
  ConnectTaxIntelligenceEngineInput,
  GenerateTaxSummaryInput,
  RecordTaxPaymentInput,
  TaxCockpitSnapshot,
  TaxIntelligenceRunReport,
  TaxIntelligenceEngineState,
} from "./types.js";
import { TaxIntelligenceController } from "./tax-intelligence-controller.js";
import { TaxIntelligenceManager } from "./tax-intelligence-manager.js";

export interface TaxIntelligenceEngineOptions {
  configuration?: Partial<TaxIntelligenceEngineConfiguration>;
}

/**
 * Tax Intelligence Engine (PILLOW-TX-001 / R3-11).
 * Centralized tax intelligence consuming R3-04 through R3-10.
 */
export class TaxIntelligenceEngine {
  private initializedAt: string | null = null;
  private readonly controller: TaxIntelligenceController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    financialFramework: FinancialFrameworkEngine,
    revenueEngine: RevenueEngine,
    expenseEngine: ExpenseEngine,
    profitCalculationEngine: ProfitCalculationEngine,
    reconciliationEngine: ReconciliationEngine,
    invoiceGenerator: InvoiceGeneratorEngine,
    refundEngine: RefundEngine,
    options: TaxIntelligenceEngineOptions = {},
  ) {
    const config = buildTaxIntelligenceEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new TaxIntelligenceManager(
      financialFramework,
      revenueEngine,
      expenseEngine,
      profitCalculationEngine,
      reconciliationEngine,
      invoiceGenerator,
      refundEngine,
    );
    this.controller = new TaxIntelligenceController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<TaxIntelligenceEngineState> {
    const doc = await this.reader.readText(TAX_INTELLIGENCE_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Tax Intelligence Engine")) {
      throw new Error(
        `${TAX_INTELLIGENCE_ENGINE_SYSTEM_PATH} missing — Tax Intelligence Engine requires R3-11 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendTxLog({
      event: "engine_initialization",
      level: "info",
      details: "R3-11 Tax Intelligence Engine initialized",
    });
    return this.getState();
  }

  getState(): TaxIntelligenceEngineState {
    if (!this.initializedAt) {
      throw new Error("Tax Intelligence Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const taxRecords = this.controller.getManager().getTaxRecords();
    const aggregateTaxAmount = taxRecords.reduce((s, r) => s + r.taxAmount, 0);
    const latestRecord = taxRecords[taxRecords.length - 1];

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalTaxRecords: taxRecords.length,
      aggregateTaxAmount,
      lastTaxStatus: latestRecord?.taxStatus ?? null,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-TX-001",
      missionId: "R3-11",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectTaxIntelligenceEngine(
    input: ConnectTaxIntelligenceEngineInput = {},
  ): TaxIntelligenceRunReport {
    return this.controller.connectTaxIntelligenceEngine(input);
  }

  classifyTaxableTransaction(
    input: ClassifyTaxableTransactionInput,
  ): TaxIntelligenceRunReport {
    return this.controller.classifyTaxableTransaction(input);
  }

  calculateTaxLiability(input: CalculateTaxLiabilityInput): TaxIntelligenceRunReport {
    return this.controller.calculateTaxLiability(input);
  }

  calculateTaxAdjustment(input: CalculateTaxAdjustmentInput): TaxIntelligenceRunReport {
    return this.controller.calculateTaxAdjustment(input);
  }

  recordTaxPayment(input: RecordTaxPaymentInput): TaxIntelligenceRunReport {
    return this.controller.recordTaxPayment(input);
  }

  generateTaxSummary(input: GenerateTaxSummaryInput = {}): TaxIntelligenceRunReport {
    return this.controller.generateTaxSummary(input);
  }

  getLatestReport(): TaxIntelligenceRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getTaxRecords() {
    return this.controller.getManager().getTaxRecords();
  }

  updateConfiguration(
    overrides: Partial<TaxIntelligenceEngineConfiguration>,
  ): TaxIntelligenceEngineState {
    const next = buildTaxIntelligenceEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Tax intelligence status: ${state.status}`,
        `Last tax: ${state.health.lastTaxStatus ?? "unknown"}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No tax operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): TaxCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalTaxRecords: state.health.totalTaxRecords,
      aggregateTaxAmount: state.health.aggregateTaxAmount,
      lastTaxStatus: state.health.lastTaxStatus,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      recentLogs: getTxLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createTaxIntelligenceEngine(
  bootstrap: EmpireBootstrapContext,
  financialFramework: FinancialFrameworkEngine,
  revenueEngine: RevenueEngine,
  expenseEngine: ExpenseEngine,
  profitCalculationEngine: ProfitCalculationEngine,
  reconciliationEngine: ReconciliationEngine,
  invoiceGenerator: InvoiceGeneratorEngine,
  refundEngine: RefundEngine,
  options?: TaxIntelligenceEngineOptions,
): TaxIntelligenceEngine {
  return new TaxIntelligenceEngine(
    bootstrap,
    financialFramework,
    revenueEngine,
    expenseEngine,
    profitCalculationEngine,
    reconciliationEngine,
    invoiceGenerator,
    refundEngine,
    options,
  );
}

export function resetTaxIntelligenceEngineForTesting(): void {
  resetTxLogsForTesting();
  new TaxIntelligenceManager(null, null, null, null, null, null, null).resetForTesting();
}
