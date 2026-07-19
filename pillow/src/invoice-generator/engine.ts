import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { FinancialFrameworkEngine } from "../financial-framework/engine.js";
import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ExpenseEngine } from "../expense-engine/engine.js";
import type { ReconciliationEngine } from "../reconciliation-engine/engine.js";
import {
  buildInvoiceGeneratorConfiguration,
  type InvoiceGeneratorConfiguration,
} from "./configuration.js";
import { appendIgLog, getIgLogs, resetIgLogsForTesting } from "./ig-logging.js";
import { INVOICE_GENERATOR_SYSTEM_PATH } from "./paths.js";
import type {
  ConnectInvoiceGeneratorInput,
  CreateCustomerInvoiceInput,
  CreateSupplierInvoiceInput,
  InvoiceCockpitSnapshot,
  InvoiceGeneratorRunReport,
  InvoiceGeneratorState,
  UpdateInvoiceStatusInput,
} from "./types.js";
import { InvoiceGeneratorController } from "./invoice-generator-controller.js";
import { InvoiceGeneratorManager } from "./invoice-generator-manager.js";

export interface InvoiceGeneratorOptions {
  configuration?: Partial<InvoiceGeneratorConfiguration>;
}

/**
 * Invoice Generator (PILLOW-IG-001 / R3-09).
 * Automated invoice generation consuming R3-04, R3-05 and R3-08.
 */
export class InvoiceGeneratorEngine {
  private initializedAt: string | null = null;
  private readonly controller: InvoiceGeneratorController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    financialFramework: FinancialFrameworkEngine,
    revenueEngine: RevenueEngine,
    expenseEngine: ExpenseEngine,
    reconciliationEngine: ReconciliationEngine,
    options: InvoiceGeneratorOptions = {},
  ) {
    const config = buildInvoiceGeneratorConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new InvoiceGeneratorManager(
      financialFramework,
      revenueEngine,
      expenseEngine,
      reconciliationEngine,
    );
    this.controller = new InvoiceGeneratorController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<InvoiceGeneratorState> {
    const doc = await this.reader.readText(INVOICE_GENERATOR_SYSTEM_PATH);
    if (!doc?.includes("Invoice Generator")) {
      throw new Error(
        `${INVOICE_GENERATOR_SYSTEM_PATH} missing — Invoice Generator requires R3-09 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendIgLog({
      event: "generator_initialization",
      level: "info",
      details: "R3-09 Invoice Generator initialized",
    });
    return this.getState();
  }

  getState(): InvoiceGeneratorState {
    if (!this.initializedAt) {
      throw new Error("Invoice Generator not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getGeneratorRecord();
    const invoiceRecords = this.controller.getManager().getInvoiceRecords();
    const aggregateInvoiceAmount = invoiceRecords.reduce((s, r) => s + r.invoiceAmount, 0);
    const latestRecord = invoiceRecords[invoiceRecords.length - 1];

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalInvoiceRecords: invoiceRecords.length,
      aggregateInvoiceAmount,
      lastInvoiceStatus: latestRecord?.invoiceStatus ?? null,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-IG-001",
      missionId: "R3-09",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      generatorRecord: record,
      health,
      performance,
    };
  }

  connectInvoiceGenerator(
    input: ConnectInvoiceGeneratorInput = {},
  ): InvoiceGeneratorRunReport {
    return this.controller.connectInvoiceGenerator(input);
  }

  createCustomerInvoice(input: CreateCustomerInvoiceInput): InvoiceGeneratorRunReport {
    return this.controller.createCustomerInvoice(input);
  }

  createSupplierInvoice(input: CreateSupplierInvoiceInput): InvoiceGeneratorRunReport {
    return this.controller.createSupplierInvoice(input);
  }

  updateInvoiceStatus(input: UpdateInvoiceStatusInput): InvoiceGeneratorRunReport {
    return this.controller.updateInvoiceStatus(input);
  }

  getLatestReport(): InvoiceGeneratorRunReport | null {
    return this.controller.getLatestReport();
  }

  getGeneratorRecord() {
    return this.controller.getManager().getGeneratorRecord();
  }

  getInvoiceRecords() {
    return this.controller.getManager().getInvoiceRecords();
  }

  updateConfiguration(
    overrides: Partial<InvoiceGeneratorConfiguration>,
  ): InvoiceGeneratorState {
    const next = buildInvoiceGeneratorConfiguration(this.bootstrap.repositoryRoot, {
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
        `Invoice generator status: ${state.status}`,
        `Last invoice: ${state.health.lastInvoiceStatus ?? "unknown"}`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No invoice operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): InvoiceCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.generatorRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalInvoiceRecords: state.health.totalInvoiceRecords,
      aggregateInvoiceAmount: state.health.aggregateInvoiceAmount,
      lastInvoiceStatus: state.health.lastInvoiceStatus,
      frameworkRegistered: Boolean(record?.frameworkModuleId),
      recentLogs: getIgLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createInvoiceGeneratorEngine(
  bootstrap: EmpireBootstrapContext,
  financialFramework: FinancialFrameworkEngine,
  revenueEngine: RevenueEngine,
  expenseEngine: ExpenseEngine,
  reconciliationEngine: ReconciliationEngine,
  options?: InvoiceGeneratorOptions,
): InvoiceGeneratorEngine {
  return new InvoiceGeneratorEngine(
    bootstrap,
    financialFramework,
    revenueEngine,
    expenseEngine,
    reconciliationEngine,
    options,
  );
}

export function resetInvoiceGeneratorForTesting(): void {
  resetIgLogsForTesting();
  new InvoiceGeneratorManager(null, null, null, null).resetForTesting();
}
