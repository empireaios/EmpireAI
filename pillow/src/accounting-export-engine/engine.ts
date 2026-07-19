import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { FinancialFrameworkEngine } from "../financial-framework/engine.js";
import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ExpenseEngine } from "../expense-engine/engine.js";
import type { ProfitCalculationEngine } from "../profit-calculation-engine/engine.js";
import type { ReconciliationEngine } from "../reconciliation-engine/engine.js";
import type { InvoiceGeneratorEngine } from "../invoice-generator/engine.js";
import type { RefundEngine } from "../refund-engine/engine.js";
import type { TaxIntelligenceEngine } from "../tax-intelligence-engine/engine.js";
import {
  buildAccountingExportEngineConfiguration,
  type AccountingExportEngineConfiguration,
} from "./configuration.js";
import { appendAeeLog, getAeeLogs, resetAeeLogsForTesting } from "./aee-logging.js";
import { ACCOUNTING_EXPORT_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  AccountingExportEngineState,
  AccountingExportRunReport,
  ConnectAccountingExportEngineInput,
  DetectExportFailuresInput,
  ExportCockpitSnapshot,
  ExportFinancialRecordsInput,
  PackageExportInput,
  ValidateExportInput,
} from "./types.js";
import { AccountingExportController } from "./accounting-export-controller.js";
import { AccountingExportManager } from "./accounting-export-manager.js";

export interface AccountingExportEngineOptions {
  configuration?: Partial<AccountingExportEngineConfiguration>;
}

/**
 * Accounting Export Engine (PILLOW-AEE-001 / R3-17).
 * Standardized accounting exports consuming R3-04 through R3-11.
 */
export class AccountingExportEngine {
  private initializedAt: string | null = null;
  private readonly controller: AccountingExportController;
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
    taxIntelligenceEngine: TaxIntelligenceEngine,
    options: AccountingExportEngineOptions = {},
  ) {
    const config = buildAccountingExportEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new AccountingExportManager(
      financialFramework,
      revenueEngine,
      expenseEngine,
      profitCalculationEngine,
      reconciliationEngine,
      invoiceGenerator,
      refundEngine,
      taxIntelligenceEngine,
    );
    this.controller = new AccountingExportController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<AccountingExportEngineState> {
    const doc = await this.reader.readText(ACCOUNTING_EXPORT_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Accounting Export Engine")) {
      throw new Error(
        `${ACCOUNTING_EXPORT_ENGINE_SYSTEM_PATH} missing — Accounting Export Engine requires R3-17 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendAeeLog({
      event: "engine_initialization",
      level: "info",
      details: "R3-17 Accounting Export Engine initialized",
    });
    return this.getState();
  }

  getState(): AccountingExportEngineState {
    if (!this.initializedAt) {
      throw new Error("Accounting Export Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const exportRecords = this.controller.getManager().getExportRecords();
    const latestExport = exportRecords[exportRecords.length - 1];

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalExportRecords: exportRecords.length,
      lastExportFormat: latestExport?.exportFormat ?? null,
      lastExportStatus: latestExport?.exportStatus ?? null,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-AEE-001",
      missionId: "R3-17",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectAccountingExportEngine(
    input: ConnectAccountingExportEngineInput = {},
  ): AccountingExportRunReport {
    return this.controller.connectAccountingExportEngine(input);
  }

  exportFinancialRecords(
    input: ExportFinancialRecordsInput = {},
  ): AccountingExportRunReport {
    return this.controller.exportFinancialRecords(input);
  }

  validateExport(input: ValidateExportInput = {}): AccountingExportRunReport {
    return this.controller.validateExport(input);
  }

  detectExportFailures(
    input: DetectExportFailuresInput = {},
  ): AccountingExportRunReport {
    return this.controller.detectExportFailures(input);
  }

  packageExport(input: PackageExportInput = {}): AccountingExportRunReport {
    return this.controller.packageExport(input);
  }

  getLatestReport(): AccountingExportRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getExportRecords() {
    return this.controller.getManager().getExportRecords();
  }

  getPackages() {
    return this.controller.getManager().getPackages();
  }

  updateConfiguration(
    overrides: Partial<AccountingExportEngineConfiguration>,
  ): AccountingExportEngineState {
    const next = buildAccountingExportEngineConfiguration(this.bootstrap.repositoryRoot, {
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
        `Accounting export status: ${state.status}`,
        `Last export: ${state.health.lastExportFormat ?? "none"}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No export operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ExportCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalExportRecords: state.health.totalExportRecords,
      lastExportFormat: state.health.lastExportFormat,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      recentLogs: getAeeLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createAccountingExportEngine(
  bootstrap: EmpireBootstrapContext,
  financialFramework: FinancialFrameworkEngine,
  revenueEngine: RevenueEngine,
  expenseEngine: ExpenseEngine,
  profitCalculationEngine: ProfitCalculationEngine,
  reconciliationEngine: ReconciliationEngine,
  invoiceGenerator: InvoiceGeneratorEngine,
  refundEngine: RefundEngine,
  taxIntelligenceEngine: TaxIntelligenceEngine,
  options?: AccountingExportEngineOptions,
): AccountingExportEngine {
  return new AccountingExportEngine(
    bootstrap,
    financialFramework,
    revenueEngine,
    expenseEngine,
    profitCalculationEngine,
    reconciliationEngine,
    invoiceGenerator,
    refundEngine,
    taxIntelligenceEngine,
    options,
  );
}

export function resetAccountingExportEngineForTesting(): void {
  resetAeeLogsForTesting();
  new AccountingExportManager(null, null, null, null, null, null, null, null).resetForTesting();
}
