/** R3-09 — Invoice Generator Manager. */

import type { FinancialFrameworkEngine } from "../financial-framework/engine.js";
import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ExpenseEngine } from "../expense-engine/engine.js";
import type { ReconciliationEngine } from "../reconciliation-engine/engine.js";
import { INVOICE_GENERATOR_ID, IG_METADATA_VERSION } from "./paths.js";
import { appendIgLog } from "./ig-logging.js";
import { InvoiceRegistry } from "./invoice-registry.js";
import { InvoiceDataSource } from "./invoice-data-source.js";
import { InvoiceNumberGenerator } from "./invoice-number-generator.js";
import { InvoiceCalculationEngine } from "./invoice-calculation-engine.js";
import { InvoiceCreationEngine } from "./invoice-creation-engine.js";
import { InvoiceLifecycleManager } from "./invoice-lifecycle-manager.js";
import { InvoiceInconsistencyDetector } from "./invoice-inconsistency-detector.js";
import { InvoiceRetryManager } from "./invoice-retry-manager.js";
import { InvoiceValidator, InvoiceValidationEngine } from "./invoice-validator.js";
import { InvoiceMetadataGenerator } from "./invoice-metadata-generator.js";
import type { InvoiceGeneratorConfiguration } from "./configuration.js";
import type {
  ConnectInvoiceGeneratorInput,
  CreateCustomerInvoiceInput,
  CreateSupplierInvoiceInput,
  InvoiceGeneratorRecord,
  InvoiceGeneratorRunReport,
  UpdateInvoiceStatusInput,
} from "./types.js";

export class InvoiceGeneratorManager {
  private generatorRecord: InvoiceGeneratorRecord | null = null;
  private readonly registry = new InvoiceRegistry();
  private readonly validator = new InvoiceValidator();
  private readonly validationEngine = new InvoiceValidationEngine(this.validator);
  private readonly metadataGenerator = new InvoiceMetadataGenerator();
  private readonly numberGenerator = new InvoiceNumberGenerator();
  private readonly calculationEngine = new InvoiceCalculationEngine();
  private readonly inconsistencyDetector = new InvoiceInconsistencyDetector();
  private readonly lifecycleManager = new InvoiceLifecycleManager();
  private readonly retryManager = new InvoiceRetryManager();
  private readonly dataSource: InvoiceDataSource;
  private readonly creationEngine: InvoiceCreationEngine;

  constructor(
    private readonly framework: FinancialFrameworkEngine | null,
    private readonly revenueEngine: RevenueEngine | null,
    private readonly expenseEngine: ExpenseEngine | null,
    private readonly reconciliationEngine: ReconciliationEngine | null,
  ) {
    this.dataSource = new InvoiceDataSource(
      revenueEngine,
      expenseEngine,
      reconciliationEngine,
    );
    this.creationEngine = new InvoiceCreationEngine(
      this.registry,
      this.metadataGenerator,
      this.validationEngine,
      this.numberGenerator,
      this.calculationEngine,
      this.dataSource,
    );
  }

  getGeneratorRecord(): InvoiceGeneratorRecord | null {
    return this.generatorRecord;
  }

  getInvoiceRecords() {
    return this.registry.list();
  }

  private isEngineConnected(engine: { getEngineRecord?: () => unknown } | null): boolean {
    try {
      const record = engine?.getEngineRecord?.();
      const state = (record as { currentOperationalState?: string } | null)?.currentOperationalState;
      return state === "active" || state === "connected";
    } catch {
      return false;
    }
  }

  registerWithFramework(
    config: InvoiceGeneratorConfiguration,
  ): { frameworkModuleId: string | null; validation: InvoiceGeneratorRunReport["validation"] } {
    if (!this.framework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.framework.registerFinancialModule({
      definition: {
        financialModuleIdentifier: INVOICE_GENERATOR_ID,
        moduleVersion: IG_METADATA_VERSION,
        moduleType: "financial",
        integrationMissionId: "R3-09",
        authenticationMethod: "none",
        apiEndpointConfig: {
          baseUrl: "internal://invoice-generator",
          protocol: "sdk",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: ["invoice.created", "invoice.updated", "invoice.failed"],
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

    appendIgLog({
      event: "generator_initialization",
      level: "info",
      details: `Registered invoice generator with Financial Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `inv-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: IG_METADATA_VERSION,
      },
    };
  }

  connectInvoiceGenerator(
    _input: ConnectInvoiceGeneratorInput,
    config: InvoiceGeneratorConfiguration,
  ): InvoiceGeneratorRunReport {
    const started = Date.now();
    const reConnected = this.isEngineConnected(this.revenueEngine);
    const exConnected = this.isEngineConnected(this.expenseEngine);
    const rcConnected = this.isEngineConnected(this.reconciliationEngine);

    const frameworkReg = this.registerWithFramework(config);

    if (this.framework) {
      this.framework.activateFinancialModule(INVOICE_GENERATOR_ID);
    }

    const allConnected = reConnected && exConnected && rcConnected;
    const record = this.metadataGenerator.buildGeneratorRecord({
      frameworkModuleId: frameworkReg.frameworkModuleId,
      operationalState: allConnected ? "active" : "connected",
      validationStatus: allConnected ? "passed" : "partial",
      revenueEngineConnected: reConnected,
      expenseEngineConnected: exConnected,
      reconciliationEngineConnected: rcConnected,
    });
    this.generatorRecord = record;

    const validation = this.validator.validateGeneratorRecord(record);
    if (!reConnected) validation.warnings.push("Revenue Engine not active");
    if (!exConnected) validation.warnings.push("Expense Engine not active");
    if (!rcConnected) validation.warnings.push("Reconciliation Engine not active");
    if (!allConnected) validation.decision = "partial";

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      generatorRecord: record,
      invoiceRecords: [],
      inconsistencies: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  private runInvoiceAction(
    action: InvoiceGeneratorRunReport["action"],
    fn: () => {
      record: import("./types.js").InvoiceRecord | null;
      error: string | null;
      warnings: string[];
    },
    config: InvoiceGeneratorConfiguration,
  ): InvoiceGeneratorRunReport {
    const started = Date.now();
    const generatorRecord = this.generatorRecord;
    if (!generatorRecord) throw new Error("Invoice generator not connected");

    const result = fn();
    const validation = this.validator.validateGeneratorRecord(generatorRecord);
    if (result.error) {
      validation.decision = "fail";
      validation.errors.push(result.error);
    }
    validation.warnings.push(...result.warnings);

    const invoiceRecords = result.record ? [result.record] : [];
    const snapshot = this.dataSource.snapshot();
    const inconsistencies = result.record
      ? this.inconsistencyDetector.detect(result.record, snapshot, config)
      : [];

    if (this.framework && result.record) {
      this.framework.routeFinancialEvent({
        financialModuleIdentifier: INVOICE_GENERATOR_ID,
        topic: action === "update_invoice_status" ? "invoice.updated" : "invoice.created",
        payloadRef: result.record.invoiceId,
      });
    }

    return this.metadataGenerator.buildRunReport({
      action,
      generatorRecord,
      invoiceRecords,
      inconsistencies,
      validation,
      durationMs: Date.now() - started,
    });
  }

  createCustomerInvoice(
    input: CreateCustomerInvoiceInput,
    config: InvoiceGeneratorConfiguration,
  ): InvoiceGeneratorRunReport {
    const dedupeKey = `customer:${input.revenueReference}`;
    return this.runInvoiceAction(
      "create_customer_invoice",
      () => this.creationEngine.createCustomerInvoice(input, config, dedupeKey),
      config,
    );
  }

  createSupplierInvoice(
    input: CreateSupplierInvoiceInput,
    config: InvoiceGeneratorConfiguration,
  ): InvoiceGeneratorRunReport {
    const dedupeKey = `supplier:${input.expenseReference}`;
    return this.runInvoiceAction(
      "create_supplier_invoice",
      () => this.creationEngine.createSupplierInvoice(input, config, dedupeKey),
      config,
    );
  }

  updateInvoiceStatus(
    input: UpdateInvoiceStatusInput,
    config: InvoiceGeneratorConfiguration,
  ): InvoiceGeneratorRunReport {
    return this.runInvoiceAction(
      "update_invoice_status",
      () => {
        const result = this.lifecycleManager.updateStatus(input, config, this.registry);
        return { record: result.record, error: result.error, warnings: [] };
      },
      config,
    );
  }

  resetForTesting(): void {
    this.generatorRecord = null;
    this.registry.resetForTesting();
    this.retryManager.reset();
  }
}
