/** R3-11 — Tax Intelligence Manager. */

import type { FinancialFrameworkEngine } from "../financial-framework/engine.js";
import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ExpenseEngine } from "../expense-engine/engine.js";
import type { ProfitCalculationEngine } from "../profit-calculation-engine/engine.js";
import type { ReconciliationEngine } from "../reconciliation-engine/engine.js";
import type { InvoiceGeneratorEngine } from "../invoice-generator/engine.js";
import type { RefundEngine } from "../refund-engine/engine.js";
import { TAX_INTELLIGENCE_ENGINE_ID, TX_METADATA_VERSION } from "./paths.js";
import { appendTxLog } from "./tx-logging.js";
import { TaxRegistry } from "./tax-registry.js";
import { TaxDataSource } from "./tax-data-source.js";
import { TaxRulesEngine } from "./tax-rules-engine.js";
import { TaxClassificationEngine } from "./tax-classification-engine.js";
import { TaxCalculationEngine } from "./tax-calculation-engine.js";
import { TaxAnalyticsEngine } from "./tax-analytics-engine.js";
import { TaxMetadataGenerator } from "./tax-metadata-generator.js";
import { TaxValidator, TaxValidationEngine } from "./tax-validator.js";
import { TaxAnomalyDetector } from "./tax-anomaly-detector.js";
import { TaxRetryManager } from "./tax-retry-manager.js";
import type { TaxIntelligenceEngineConfiguration } from "./configuration.js";
import type {
  CalculateTaxAdjustmentInput,
  CalculateTaxLiabilityInput,
  ClassifyTaxableTransactionInput,
  ConnectTaxIntelligenceEngineInput,
  GenerateTaxSummaryInput,
  RecordTaxPaymentInput,
  TaxIntelligenceEngineRecord,
  TaxIntelligenceRunReport,
  TaxRecord,
} from "./types.js";

export class TaxIntelligenceManager {
  private engineRecord: TaxIntelligenceEngineRecord | null = null;
  private readonly registry = new TaxRegistry();
  private readonly validator = new TaxValidator();
  private readonly validationEngine = new TaxValidationEngine(this.validator);
  private readonly metadataGenerator = new TaxMetadataGenerator();
  private readonly rulesEngine = new TaxRulesEngine();
  private readonly classificationEngine = new TaxClassificationEngine();
  private readonly analyticsEngine = new TaxAnalyticsEngine();
  private readonly anomalyDetector = new TaxAnomalyDetector();
  private readonly retryManager = new TaxRetryManager();
  private readonly dataSource: TaxDataSource;
  private readonly calculationEngine: TaxCalculationEngine;

  constructor(
    private readonly framework: FinancialFrameworkEngine | null,
    private readonly revenueEngine: RevenueEngine | null,
    private readonly expenseEngine: ExpenseEngine | null,
    private readonly profitCalculationEngine: ProfitCalculationEngine | null,
    private readonly reconciliationEngine: ReconciliationEngine | null,
    private readonly invoiceGenerator: InvoiceGeneratorEngine | null,
    private readonly refundEngine: RefundEngine | null,
  ) {
    this.dataSource = new TaxDataSource(
      revenueEngine,
      expenseEngine,
      profitCalculationEngine,
      reconciliationEngine,
      invoiceGenerator,
      refundEngine,
    );
    this.calculationEngine = new TaxCalculationEngine(
      this.rulesEngine,
      this.classificationEngine,
      this.dataSource,
      this.registry,
      this.metadataGenerator,
    );
  }

  getEngineRecord(): TaxIntelligenceEngineRecord | null {
    return this.engineRecord;
  }

  getTaxRecords() {
    return this.registry.list();
  }

  private isConnected(record: { currentOperationalState?: string } | null | undefined): boolean {
    const state = record?.currentOperationalState;
    return state === "active" || state === "connected";
  }

  private probeConnections() {
    const reConnected = this.isConnected(this.revenueEngine?.getEngineRecord?.());
    const exConnected = this.isConnected(this.expenseEngine?.getEngineRecord?.());
    const pcConnected = this.isConnected(this.profitCalculationEngine?.getEngineRecord?.());
    const rcConnected = this.isConnected(this.reconciliationEngine?.getEngineRecord?.());
    const igConnected = this.isConnected(this.invoiceGenerator?.getGeneratorRecord?.());
    const rfConnected = this.isConnected(this.refundEngine?.getEngineRecord?.());
    return { reConnected, exConnected, pcConnected, rcConnected, igConnected, rfConnected };
  }

  registerWithFramework(
    config: TaxIntelligenceEngineConfiguration,
  ): { frameworkModuleId: string | null; validation: TaxIntelligenceRunReport["validation"] } {
    if (!this.framework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.framework.registerFinancialModule({
      definition: {
        financialModuleIdentifier: TAX_INTELLIGENCE_ENGINE_ID,
        moduleVersion: TX_METADATA_VERSION,
        moduleType: "financial",
        integrationMissionId: "R3-11",
        authenticationMethod: "none",
        apiEndpointConfig: {
          baseUrl: "internal://tax-intelligence-engine",
          protocol: "sdk",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: ["tax.classified", "tax.calculated", "tax.failed"],
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

    appendTxLog({
      event: "engine_initialization",
      level: "info",
      details: `Registered tax intelligence engine with Financial Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `tx-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: TX_METADATA_VERSION,
      },
    };
  }

  connectTaxIntelligenceEngine(
    _input: ConnectTaxIntelligenceEngineInput,
    config: TaxIntelligenceEngineConfiguration,
  ): TaxIntelligenceRunReport {
    const started = Date.now();
    const { reConnected, exConnected, pcConnected, rcConnected, igConnected, rfConnected } =
      this.probeConnections();

    const frameworkReg = this.registerWithFramework(config);

    if (this.framework) {
      this.framework.activateFinancialModule(TAX_INTELLIGENCE_ENGINE_ID);
    }

    const allConnected = reConnected && exConnected && igConnected;
    const record = this.metadataGenerator.buildEngineRecord({
      frameworkModuleId: frameworkReg.frameworkModuleId,
      operationalState: allConnected ? "active" : "connected",
      validationStatus: allConnected ? "passed" : "partial",
      revenueEngineConnected: reConnected,
      expenseEngineConnected: exConnected,
      profitCalculationEngineConnected: pcConnected,
      reconciliationEngineConnected: rcConnected,
      invoiceGeneratorConnected: igConnected,
      refundEngineConnected: rfConnected,
    });
    this.engineRecord = record;

    const validation = this.validator.validateEngineRecord(record);
    if (!reConnected) validation.warnings.push("Revenue Engine not active");
    if (!exConnected) validation.warnings.push("Expense Engine not active");
    if (!igConnected) validation.warnings.push("Invoice Generator not active");
    if (!allConnected) validation.decision = "partial";

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      taxRecords: [],
      anomalies: [],
      summary: null,
      validation,
      durationMs: Date.now() - started,
    });
  }

  private runTaxAction(
    action: TaxIntelligenceRunReport["action"],
    fn: () => {
      records: TaxRecord[];
      error: string | null;
      warnings: string[];
      summary?: import("./types.js").TaxSummary | null;
    },
    config: TaxIntelligenceEngineConfiguration,
    eventTopic?: string,
  ): TaxIntelligenceRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("Tax intelligence engine not connected");

    const result = fn();
    const validation = this.validator.validateEngineRecord(engineRecord);
    if (result.error) {
      validation.decision = "fail";
      validation.errors.push(result.error);
    }
    validation.warnings.push(...result.warnings);

    const snapshot = this.dataSource.snapshot();
    const anomalies = result.records.flatMap((r) =>
      this.anomalyDetector.detect(r, snapshot, config),
    );

    if (this.framework && result.records.length > 0 && eventTopic) {
      for (const record of result.records) {
        this.framework.routeFinancialEvent({
          financialModuleIdentifier: TAX_INTELLIGENCE_ENGINE_ID,
          topic: eventTopic,
          payloadRef: record.taxRecordId,
        });
      }
    }

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      taxRecords: result.records,
      anomalies,
      summary: result.summary ?? null,
      validation,
      durationMs: Date.now() - started,
    });
  }

  classifyTaxableTransaction(
    input: ClassifyTaxableTransactionInput,
    config: TaxIntelligenceEngineConfiguration,
  ): TaxIntelligenceRunReport {
    const dedupeKey = `classify:${input.revenueReference ?? ""}:${input.expenseReference ?? ""}:${input.invoiceReference ?? ""}:${input.refundReference ?? ""}`;
    return this.runTaxAction(
      "classify_transaction",
      () => {
        if (this.registry.hasDedupeKey(dedupeKey)) {
          return { records: [], error: "Duplicate tax classification", warnings: [] };
        }

        const classified = this.classificationEngine.classify(input, config, this.dataSource);
        if (classified.errors.length > 0) {
          return { records: [], error: classified.errors.join("; "), warnings: classified.warnings };
        }

        const record = this.metadataGenerator.buildTaxRecord({
          revenueReference: classified.revenueReference,
          expenseReference: classified.expenseReference,
          invoiceReference: classified.invoiceReference,
          refundReference: classified.refundReference,
          taxJurisdiction: classified.jurisdiction,
          taxCategory: classified.category,
          taxRate: 0,
          taxAmount: 0,
          taxStatus: "classified",
          validationStatus: "passed",
        });

        this.registry.store(record, dedupeKey);
        appendTxLog({
          event: "tax_classification",
          level: "info",
          details: `Classified ${record.taxRecordId} as ${classified.category}`,
        });

        return { records: [record], error: null, warnings: classified.warnings };
      },
      config,
      "tax.classified",
    );
  }

  calculateTaxLiability(
    input: CalculateTaxLiabilityInput,
    config: TaxIntelligenceEngineConfiguration,
  ): TaxIntelligenceRunReport {
    const dedupeKey = `liability:${input.revenueReference ?? ""}:${input.invoiceReference ?? ""}:${input.taxableAmount}:${input.taxJurisdiction ?? config.defaultJurisdiction}`;
    return this.runTaxAction(
      "calculate_liability",
      () => {
        const result = this.calculationEngine.calculateLiability(input, config, dedupeKey);
        if (result.error || !result.record) {
          return { records: [], error: result.error, warnings: result.warnings };
        }
        const validation = this.validationEngine.validateForCalculation(result.record, config);
        if (validation.decision === "fail") {
          return { records: [], error: validation.errors.join("; "), warnings: [...result.warnings, ...validation.warnings] };
        }
        return { records: [result.record], error: null, warnings: [...result.warnings, ...validation.warnings] };
      },
      config,
      "tax.calculated",
    );
  }

  calculateTaxAdjustment(
    input: CalculateTaxAdjustmentInput,
    config: TaxIntelligenceEngineConfiguration,
  ): TaxIntelligenceRunReport {
    const dedupeKey = `adjustment:${input.refundReference}`;
    return this.runTaxAction(
      "calculate_adjustment",
      () => {
        const result = this.calculationEngine.calculateAdjustment(input, config, dedupeKey);
        if (result.error || !result.record) {
          return { records: [], error: result.error, warnings: result.warnings };
        }
        return { records: [result.record], error: null, warnings: result.warnings };
      },
      config,
      "tax.calculated",
    );
  }

  recordTaxPayment(
    input: RecordTaxPaymentInput,
    config: TaxIntelligenceEngineConfiguration,
  ): TaxIntelligenceRunReport {
    return this.runTaxAction(
      "record_tax_payment",
      () => {
        const result = this.calculationEngine.recordPayment(input, this.registry);
        if (result.error || !result.record) {
          return { records: [], error: result.error, warnings: result.warnings };
        }
        return { records: [result.record], error: null, warnings: result.warnings };
      },
      config,
      "tax.calculated",
    );
  }

  generateTaxSummary(
    input: GenerateTaxSummaryInput,
    config: TaxIntelligenceEngineConfiguration,
  ): TaxIntelligenceRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("Tax intelligence engine not connected");

    this.analyticsEngine.markObligations(this.registry);
    const summary = this.analyticsEngine.generateSummary(this.registry, input.taxJurisdiction);
    const validation = this.validator.validateEngineRecord(engineRecord);

    appendTxLog({
      event: "tax_summary",
      level: "info",
      details: `Summary generated: ${summary.recordCount} records, liability=${summary.totalTaxLiability}`,
    });

    return this.metadataGenerator.buildRunReport({
      action: "generate_summary",
      engineRecord,
      taxRecords: [],
      anomalies: [],
      summary,
      validation,
      durationMs: Date.now() - started,
    });
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.registry.resetForTesting();
    this.retryManager.reset();
  }
}
