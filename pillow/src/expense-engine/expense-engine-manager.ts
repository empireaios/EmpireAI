/** R3-05 — Expense Engine Manager. */

import type { FinancialFrameworkEngine } from "../financial-framework/engine.js";
import type { PaymentGatewayIntegrationEngine } from "../payment-gateway-integration/engine.js";
import type { BankingIntegrationEngine } from "../banking-integration/engine.js";
import type { RevenueEngine } from "../revenue-engine/engine.js";
import { EXPENSE_ENGINE_ID, EX_METADATA_VERSION } from "./paths.js";
import { appendExLog } from "./ex-logging.js";
import { ExpenseRegistry } from "./expense-registry.js";
import { ExpenseRecordingEngine } from "./expense-recording-engine.js";
import { ExpenseAggregationEngine } from "./expense-aggregation-engine.js";
import { ExpenseClassificationEngine } from "./expense-classification-engine.js";
import { ExpenseAnalyticsEngine } from "./expense-analytics-engine.js";
import { ExpenseRetryManager } from "./expense-retry-manager.js";
import { ExpenseValidator, ExpenseValidationEngine } from "./expense-validator.js";
import { ExpenseMetadataGenerator } from "./expense-metadata-generator.js";
import type { ExpenseEngineConfiguration } from "./configuration.js";
import type {
  AggregateExpensesInput,
  ConnectExpenseEngineInput,
  ExpenseEngineRecord,
  ExpenseEngineRunReport,
  RecordAdvertisingExpenseInput,
  RecordExpenseEventInput,
  RecordOperationalExpenseInput,
  RecordPlatformFeeInput,
  RecordShippingExpenseInput,
  RecordSupplierPaymentInput,
} from "./types.js";

export class ExpenseEngineManager {
  private engineRecord: ExpenseEngineRecord | null = null;
  private readonly registry = new ExpenseRegistry();
  private readonly validator = new ExpenseValidator();
  private readonly validationEngine = new ExpenseValidationEngine(this.validator);
  private readonly metadataGenerator = new ExpenseMetadataGenerator();
  private readonly classificationEngine = new ExpenseClassificationEngine();
  private readonly retryManager = new ExpenseRetryManager();
  private readonly recordingEngine: ExpenseRecordingEngine;
  private readonly aggregationEngine: ExpenseAggregationEngine;
  private readonly analyticsEngine: ExpenseAnalyticsEngine;

  constructor(
    private readonly framework: FinancialFrameworkEngine | null,
    private readonly paymentGateway: PaymentGatewayIntegrationEngine | null,
    private readonly bankingIntegration: BankingIntegrationEngine | null,
    private readonly revenueEngine: RevenueEngine | null,
  ) {
    this.recordingEngine = new ExpenseRecordingEngine(
      this.registry,
      this.metadataGenerator,
      this.classificationEngine,
      this.validationEngine,
      paymentGateway,
      bankingIntegration,
    );
    this.aggregationEngine = new ExpenseAggregationEngine(this.registry, this.metadataGenerator);
    this.analyticsEngine = new ExpenseAnalyticsEngine(this.registry);
  }

  getEngineRecord(): ExpenseEngineRecord | null {
    return this.engineRecord;
  }

  getExpenseRecords() {
    return this.registry.list();
  }

  private isPaymentGatewayConnected(): boolean {
    try {
      const record = this.paymentGateway?.getGatewayRecord();
      return record?.currentOperationalState === "active";
    } catch {
      return false;
    }
  }

  private isBankingIntegrationConnected(): boolean {
    try {
      const record = this.bankingIntegration?.getIntegrationRecord();
      return record?.currentOperationalState === "active";
    } catch {
      return false;
    }
  }

  private isRevenueEngineConnected(): boolean {
    try {
      const record = this.revenueEngine?.getEngineRecord();
      return (
        record?.currentOperationalState === "active" ||
        record?.currentOperationalState === "connected"
      );
    } catch {
      return false;
    }
  }

  registerWithFramework(
    config: ExpenseEngineConfiguration,
  ): { frameworkModuleId: string | null; validation: ExpenseEngineRunReport["validation"] } {
    if (!this.framework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.framework.registerFinancialModule({
      definition: {
        financialModuleIdentifier: EXPENSE_ENGINE_ID,
        moduleVersion: EX_METADATA_VERSION,
        moduleType: "financial",
        integrationMissionId: "R3-05",
        authenticationMethod: "none",
        apiEndpointConfig: {
          baseUrl: "internal://expense-engine",
          protocol: "sdk",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: ["expense.recorded", "expense.aggregated", "expense.anomaly"],
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

    appendExLog({
      event: "engine_initialization",
      level: "info",
      details: `Registered expense engine with Financial Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `ex-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: EX_METADATA_VERSION,
      },
    };
  }

  connectExpenseEngine(
    _input: ConnectExpenseEngineInput,
    config: ExpenseEngineConfiguration,
  ): ExpenseEngineRunReport {
    const started = Date.now();
    const pgConnected = this.isPaymentGatewayConnected();
    const biConnected = this.isBankingIntegrationConnected();
    const reConnected = this.isRevenueEngineConnected();

    const frameworkReg = this.registerWithFramework(config);

    if (this.framework) {
      this.framework.activateFinancialModule(EXPENSE_ENGINE_ID);
    }

    const allConnected = pgConnected && biConnected && reConnected;
    const record = this.metadataGenerator.buildEngineRecord({
      frameworkModuleId: frameworkReg.frameworkModuleId,
      operationalState: allConnected ? "active" : "connected",
      validationStatus: allConnected ? "passed" : "partial",
      paymentGatewayConnected: pgConnected,
      bankingIntegrationConnected: biConnected,
      revenueEngineConnected: reConnected,
    });
    this.engineRecord = record;

    const validation = this.validator.validateEngineRecord(record);
    if (!pgConnected) validation.warnings.push("Payment Gateway Integration not active");
    if (!biConnected) validation.warnings.push("Banking Integration not active");
    if (!reConnected) validation.warnings.push("Revenue Engine not active");
    if (!allConnected) validation.decision = "partial";

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      expenseRecords: [],
      aggregation: null,
      anomalies: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  private runRecordingAction(
    action: ExpenseEngineRunReport["action"],
    recordFn: () => {
      record: import("./types.js").ExpenseRecord | null;
      error: string | null;
      warnings?: string[];
    },
    config: ExpenseEngineConfiguration,
  ): ExpenseEngineRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("Expense engine not connected");

    const result = recordFn();
    const validation = this.validator.validateEngineRecord(engineRecord);
    if (result.error) {
      validation.decision = "fail";
      validation.errors.push(result.error);
    }
    if (result.warnings) validation.warnings.push(...result.warnings);

    const expenseRecords = result.record ? [result.record] : [];
    const anomalies = result.record
      ? this.analyticsEngine.detectAnomalies(expenseRecords, config)
      : [];

    if (this.framework && result.record) {
      this.framework.routeFinancialEvent({
        financialModuleIdentifier: EXPENSE_ENGINE_ID,
        topic: "expense.recorded",
        payloadRef: result.record.expenseRecordId,
      });
    }

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      expenseRecords,
      aggregation: null,
      anomalies,
      validation,
      durationMs: Date.now() - started,
    });
  }

  recordExpenseEvent(
    input: RecordExpenseEventInput,
    config: ExpenseEngineConfiguration,
  ): ExpenseEngineRunReport {
    return this.runRecordingAction(
      "record_event",
      () => this.recordingEngine.recordEvent(input, config),
      config,
    );
  }

  recordSupplierPayment(
    input: RecordSupplierPaymentInput,
    config: ExpenseEngineConfiguration,
  ): ExpenseEngineRunReport {
    return this.runRecordingAction(
      "record_supplier_payment",
      () => this.recordingEngine.recordSupplierPayment(input, config),
      config,
    );
  }

  recordShippingExpense(
    input: RecordShippingExpenseInput,
    config: ExpenseEngineConfiguration,
  ): ExpenseEngineRunReport {
    return this.runRecordingAction(
      "record_shipping",
      () => this.recordingEngine.recordShippingExpense(input, config),
      config,
    );
  }

  recordAdvertisingExpense(
    input: RecordAdvertisingExpenseInput,
    config: ExpenseEngineConfiguration,
  ): ExpenseEngineRunReport {
    return this.runRecordingAction(
      "record_advertising",
      () => this.recordingEngine.recordAdvertisingExpense(input, config),
      config,
    );
  }

  recordPlatformFee(
    input: RecordPlatformFeeInput,
    config: ExpenseEngineConfiguration,
  ): ExpenseEngineRunReport {
    return this.runRecordingAction(
      "record_platform_fee",
      () => this.recordingEngine.recordPlatformFee(input, config),
      config,
    );
  }

  recordOperationalExpense(
    input: RecordOperationalExpenseInput,
    config: ExpenseEngineConfiguration,
  ): ExpenseEngineRunReport {
    return this.runRecordingAction(
      "record_operational",
      () => this.recordingEngine.recordOperationalExpense(input, config),
      config,
    );
  }

  aggregateExpenses(
    input: AggregateExpensesInput,
    config: ExpenseEngineConfiguration,
  ): ExpenseEngineRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("Expense engine not connected");

    try {
      const aggregation = this.aggregationEngine.aggregate(input, config);
      const validation = this.validator.validateEngineRecord(engineRecord);

      if (this.framework) {
        this.framework.routeFinancialEvent({
          financialModuleIdentifier: EXPENSE_ENGINE_ID,
          topic: "expense.aggregated",
          payloadRef: aggregation.summaryId,
        });
      }

      return this.metadataGenerator.buildRunReport({
        action: "aggregate",
        engineRecord,
        expenseRecords: this.registry.listValidated(),
        aggregation,
        anomalies: [],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const validation = this.validator.validateEngineRecord(engineRecord);
      validation.decision = "fail";
      validation.errors.push(error instanceof Error ? error.message : "Aggregation failed");
      return this.metadataGenerator.buildRunReport({
        action: "aggregate",
        engineRecord,
        expenseRecords: [],
        aggregation: null,
        anomalies: [],
        validation,
        durationMs: Date.now() - started,
      });
    }
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.registry.resetForTesting();
    this.retryManager.reset();
  }
}
