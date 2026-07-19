/** R3-08 — Reconciliation Manager. */

import type { FinancialFrameworkEngine } from "../financial-framework/engine.js";
import type { PaymentGatewayIntegrationEngine } from "../payment-gateway-integration/engine.js";
import type { BankingIntegrationEngine } from "../banking-integration/engine.js";
import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ExpenseEngine } from "../expense-engine/engine.js";
import type { CashFlowMonitorEngine } from "../cash-flow-monitor/engine.js";
import { RECONCILIATION_ENGINE_ID, RC_METADATA_VERSION } from "./paths.js";
import { appendRcLog } from "./rc-logging.js";
import { ReconciliationRegistry } from "./reconciliation-registry.js";
import { ReconciliationDataSource } from "./reconciliation-data-source.js";
import { TransactionMatchingEngine } from "./transaction-matching-engine.js";
import { PaymentReconciliationEngine } from "./payment-reconciliation-engine.js";
import { BankingReconciliationEngine } from "./banking-reconciliation-engine.js";
import { ReconciliationExecutionEngine } from "./reconciliation-execution-engine.js";
import { FinancialDifferenceAnalyzer } from "./financial-difference-analyzer.js";
import { ReconciliationReportGenerator } from "./reconciliation-report-generator.js";
import { ReconciliationRetryManager } from "./reconciliation-retry-manager.js";
import { ReconciliationValidator, ReconciliationValidationEngine } from "./reconciliation-validator.js";
import { ReconciliationMetadataGenerator } from "./reconciliation-metadata-generator.js";
import type { ReconciliationEngineConfiguration } from "./configuration.js";
import type {
  ConnectReconciliationEngineInput,
  ReconcileAllInput,
  ReconcileBankingInput,
  ReconcileCashFlowInput,
  ReconcileExpensesInput,
  ReconcilePaymentsInput,
  ReconcileRevenueInput,
  ReconciliationEngineRecord,
  ReconciliationRunReport,
} from "./types.js";

export class ReconciliationManager {
  private engineRecord: ReconciliationEngineRecord | null = null;
  private readonly registry = new ReconciliationRegistry();
  private readonly validator = new ReconciliationValidator();
  private readonly validationEngine = new ReconciliationValidationEngine(this.validator);
  private readonly metadataGenerator = new ReconciliationMetadataGenerator();
  private readonly matchingEngine = new TransactionMatchingEngine();
  private readonly differenceAnalyzer = new FinancialDifferenceAnalyzer();
  private readonly reportGenerator: ReconciliationReportGenerator;
  private readonly retryManager = new ReconciliationRetryManager();
  private readonly dataSource: ReconciliationDataSource;
  private readonly paymentEngine: PaymentReconciliationEngine;
  private readonly bankingEngine: BankingReconciliationEngine;
  private readonly executionEngine: ReconciliationExecutionEngine;

  constructor(
    private readonly framework: FinancialFrameworkEngine | null,
    private readonly paymentGateway: PaymentGatewayIntegrationEngine | null,
    private readonly bankingIntegration: BankingIntegrationEngine | null,
    private readonly revenueEngine: RevenueEngine | null,
    private readonly expenseEngine: ExpenseEngine | null,
    private readonly cashFlowMonitor: CashFlowMonitorEngine | null,
  ) {
    this.dataSource = new ReconciliationDataSource(
      paymentGateway,
      bankingIntegration,
      revenueEngine,
      expenseEngine,
      cashFlowMonitor,
    );
    this.reportGenerator = new ReconciliationReportGenerator(this.metadataGenerator);
    this.paymentEngine = new PaymentReconciliationEngine(
      this.registry,
      this.metadataGenerator,
      this.validationEngine,
      this.matchingEngine,
      this.dataSource,
    );
    this.bankingEngine = new BankingReconciliationEngine(
      this.registry,
      this.metadataGenerator,
      this.validationEngine,
      this.matchingEngine,
      this.dataSource,
    );
    this.executionEngine = new ReconciliationExecutionEngine(
      this.registry,
      this.metadataGenerator,
      this.validationEngine,
      this.matchingEngine,
      this.dataSource,
    );
  }

  getEngineRecord(): ReconciliationEngineRecord | null {
    return this.engineRecord;
  }

  getReconciliationRecords() {
    return this.registry.list();
  }

  private isPaymentGatewayConnected(): boolean {
    try {
      const record = this.paymentGateway?.getGatewayRecord?.();
      const state = record?.currentOperationalState;
      return state === "active" || state === "connected";
    } catch {
      return false;
    }
  }

  private isConnected(
    engine: { getEngineRecord?: () => unknown; getIntegrationRecord?: () => unknown; getMonitorRecord?: () => unknown } | null,
    field: "engine" | "integration" | "monitor",
  ): boolean {
    try {
      const record =
        field === "integration"
          ? (engine as BankingIntegrationEngine | null)?.getIntegrationRecord?.()
          : field === "monitor"
            ? (engine as CashFlowMonitorEngine | null)?.getMonitorRecord?.()
            : (engine as RevenueEngine | null)?.getEngineRecord?.();
      const state = (record as { currentOperationalState?: string } | null)?.currentOperationalState;
      return state === "active" || state === "connected";
    } catch {
      return false;
    }
  }

  registerWithFramework(
    config: ReconciliationEngineConfiguration,
  ): { frameworkModuleId: string | null; validation: ReconciliationRunReport["validation"] } {
    if (!this.framework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.framework.registerFinancialModule({
      definition: {
        financialModuleIdentifier: RECONCILIATION_ENGINE_ID,
        moduleVersion: RC_METADATA_VERSION,
        moduleType: "financial",
        integrationMissionId: "R3-08",
        authenticationMethod: "none",
        apiEndpointConfig: {
          baseUrl: "internal://reconciliation-engine",
          protocol: "sdk",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: ["reconciliation.completed", "reconciliation.mismatch", "reconciliation.failed"],
          maxEventsPerMinute: 120,
          windowMs: 60000,
        },
        rateLimitConfig: {
          enabled: false,
          requestsPerMinute: 120,
          burstLimit: 20,
          windowMs: 60000,
        },
        retryConfig: {
          enabled: true,
          maxAttempts: config.maxRetryAttempts,
          delayMs: config.retryDelayMs,
          backoffMultiplier: config.retryBackoffMultiplier,
        },
        supportedCapabilities: [
          "financial_module_registration",
          "financial_module_activation",
          "financial_event_routing",
        ],
      },
      forceRegister: true,
    });

    appendRcLog({
      event: "engine_initialization",
      level: "info",
      details: `Registered reconciliation engine with Financial Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `rc-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: RC_METADATA_VERSION,
      },
    };
  }

  connectReconciliationEngine(
    _input: ConnectReconciliationEngineInput,
    config: ReconciliationEngineConfiguration,
  ): ReconciliationRunReport {
    const started = Date.now();
    const pgConnected = this.isPaymentGatewayConnected();
    const biConnected = this.isConnected(this.bankingIntegration, "integration");
    const reConnected = this.isConnected(this.revenueEngine, "engine");
    const exConnected = this.isConnected(this.expenseEngine, "engine");
    const cfConnected = this.isConnected(this.cashFlowMonitor, "monitor");

    const frameworkReg = this.registerWithFramework(config);

    if (this.framework) {
      this.framework.activateFinancialModule(RECONCILIATION_ENGINE_ID);
    }

    const allConnected = pgConnected && biConnected && reConnected && exConnected;
    const record = this.metadataGenerator.buildEngineRecord({
      frameworkModuleId: frameworkReg.frameworkModuleId,
      operationalState: allConnected ? "active" : "connected",
      validationStatus: allConnected ? "passed" : "partial",
      paymentGatewayConnected: pgConnected,
      bankingIntegrationConnected: biConnected,
      revenueEngineConnected: reConnected,
      expenseEngineConnected: exConnected,
      cashFlowMonitorConnected: cfConnected,
    });
    this.engineRecord = record;

    const validation = this.validator.validateEngineRecord(record);
    if (!pgConnected) validation.warnings.push("Payment Gateway not active");
    if (!biConnected) validation.warnings.push("Banking Integration not active");
    if (!reConnected) validation.warnings.push("Revenue Engine not active");
    if (!exConnected) validation.warnings.push("Expense Engine not active");
    if (!cfConnected) validation.warnings.push("Cash Flow Monitor not active");
    if (!allConnected) validation.decision = "partial";

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      reconciliationRecords: [],
      report: null,
      mismatches: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  private runReconcileAction(
    action: ReconciliationRunReport["action"],
    sourceType: import("./types.js").ReconciliationMismatch["sourceType"],
    fn: () => {
      record: import("./types.js").ReconciliationRecord | null;
      records?: import("./types.js").ReconciliationRecord[];
      error: string | null;
      warnings: string[];
    },
    config: ReconciliationEngineConfiguration,
    reportScope: string,
  ): ReconciliationRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("Reconciliation engine not connected");

    const result = fn();
    const validation = this.validator.validateEngineRecord(engineRecord);
    if (result.error) {
      validation.decision = "fail";
      validation.errors.push(result.error);
    }
    validation.warnings.push(...result.warnings);

    const reconciliationRecords = result.records ?? (result.record ? [result.record] : []);
    const snapshot = this.dataSource.snapshot();
    const mismatches: import("./types.js").ReconciliationMismatch[] = [];

    for (const rec of reconciliationRecords) {
      mismatches.push(
        ...this.differenceAnalyzer.analyze(
          {
            matched: rec.matchedTransactionCount,
            unmatched: rec.unmatchedTransactionCount,
            differenceAmount: rec.differenceAmount,
            paymentReference: rec.paymentReference,
            bankingReference: rec.bankingReference,
            revenueReference: rec.revenueReference,
            expenseReference: rec.expenseReference,
            cashFlowReference: rec.cashFlowReference,
          },
          snapshot,
          config,
          sourceType,
          rec.reconciliationRecordId,
        ),
      );
      mismatches.push(
        ...this.differenceAnalyzer.detectMissingRecords(snapshot, sourceType, rec.reconciliationRecordId),
      );
    }

    const report =
      reconciliationRecords.length > 0
        ? this.reportGenerator.generate(reportScope, reconciliationRecords)
        : null;

    if (this.framework && reconciliationRecords[0]) {
      this.framework.routeFinancialEvent({
        financialModuleIdentifier: RECONCILIATION_ENGINE_ID,
        topic: mismatches.length > 0 ? "reconciliation.mismatch" : "reconciliation.completed",
        payloadRef: reconciliationRecords[0]!.reconciliationRecordId,
      });
    }

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      reconciliationRecords,
      report,
      mismatches,
      validation,
      durationMs: Date.now() - started,
    });
  }

  reconcilePayments(
    input: ReconcilePaymentsInput,
    config: ReconciliationEngineConfiguration,
  ): ReconciliationRunReport {
    const dedupeKey = `payments:${input.paymentReference ?? "all"}`;
    return this.runReconcileAction(
      "reconcile_payments",
      "payment",
      () => this.paymentEngine.reconcile(input, config, dedupeKey),
      config,
      "payments",
    );
  }

  reconcileBanking(
    input: ReconcileBankingInput,
    config: ReconciliationEngineConfiguration,
  ): ReconciliationRunReport {
    const dedupeKey = `banking:${input.bankingReference ?? "all"}`;
    return this.runReconcileAction(
      "reconcile_banking",
      "banking",
      () => this.bankingEngine.reconcile(input, config, dedupeKey),
      config,
      "banking",
    );
  }

  reconcileRevenue(
    input: ReconcileRevenueInput,
    config: ReconciliationEngineConfiguration,
  ): ReconciliationRunReport {
    const dedupeKey = `revenue:${input.revenueReference ?? "all"}`;
    return this.runReconcileAction(
      "reconcile_revenue",
      "revenue",
      () => this.executionEngine.reconcileRevenue(input, config, dedupeKey),
      config,
      "revenue",
    );
  }

  reconcileExpenses(
    input: ReconcileExpensesInput,
    config: ReconciliationEngineConfiguration,
  ): ReconciliationRunReport {
    const dedupeKey = `expenses:${input.expenseReference ?? "all"}`;
    return this.runReconcileAction(
      "reconcile_expenses",
      "expense",
      () => this.executionEngine.reconcileExpenses(input, config, dedupeKey),
      config,
      "expenses",
    );
  }

  reconcileCashFlow(
    input: ReconcileCashFlowInput,
    config: ReconciliationEngineConfiguration,
  ): ReconciliationRunReport {
    const dedupeKey = `cashflow:${input.cashFlowReference ?? "all"}`;
    return this.runReconcileAction(
      "reconcile_cash_flow",
      "cash_flow",
      () => this.executionEngine.reconcileCashFlow(input, config, dedupeKey),
      config,
      "cash_flow",
    );
  }

  reconcileAll(
    input: ReconcileAllInput,
    config: ReconciliationEngineConfiguration,
  ): ReconciliationRunReport {
    const dedupeKey = `all:${input.currency ?? "default"}`;
    return this.runReconcileAction(
      "reconcile_all",
      "payment",
      () => {
        const result = this.executionEngine.reconcileAll(input, config, dedupeKey);
        return {
          record: result.records[0] ?? null,
          records: result.records,
          error: result.error,
          warnings: result.warnings,
        };
      },
      config,
      "all",
    );
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.registry.resetForTesting();
    this.retryManager.reset();
  }
}
