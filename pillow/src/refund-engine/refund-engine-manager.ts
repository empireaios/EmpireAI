/** R3-10 — Refund Engine Manager. */

import type { FinancialFrameworkEngine } from "../financial-framework/engine.js";
import type { PaymentGatewayIntegrationEngine } from "../payment-gateway-integration/engine.js";
import type { BankingIntegrationEngine } from "../banking-integration/engine.js";
import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ExpenseEngine } from "../expense-engine/engine.js";
import type { InvoiceGeneratorEngine } from "../invoice-generator/engine.js";
import { REFUND_ENGINE_ID, RF_METADATA_VERSION } from "./paths.js";
import { appendRfLog } from "./rf-logging.js";
import { RefundRegistry } from "./refund-registry.js";
import { RefundDataSource } from "./refund-data-source.js";
import { RefundValidationEngine } from "./refund-validation-engine.js";
import { RefundMetadataGenerator } from "./refund-metadata-generator.js";
import { RefundValidator, RefundValidationEngineWrapper } from "./refund-validator.js";
import { RefundTransactionEngine } from "./refund-transaction-engine.js";
import { RefundLifecycleManager } from "./refund-lifecycle-manager.js";
import { RefundProcessingEngine } from "./refund-processing-engine.js";
import { FinancialAdjustmentEngine } from "./financial-adjustment-engine.js";
import { RefundAnomalyDetector } from "./refund-anomaly-detector.js";
import { RefundRetryManager } from "./refund-retry-manager.js";
import type { RefundEngineConfiguration } from "./configuration.js";
import type {
  ConnectRefundEngineInput,
  CreateRefundRequestInput,
  ProcessFullRefundInput,
  ProcessPartialRefundInput,
  RefundEngineRecord,
  RefundEngineRunReport,
  ValidateRefundEligibilityInput,
} from "./types.js";

export class RefundEngineManager {
  private engineRecord: RefundEngineRecord | null = null;
  private readonly registry = new RefundRegistry();
  private readonly validator = new RefundValidator();
  private readonly validationWrapper = new RefundValidationEngineWrapper(this.validator);
  private readonly validationEngine = new RefundValidationEngine();
  private readonly metadataGenerator = new RefundMetadataGenerator();
  private readonly transactionEngine = new RefundTransactionEngine(this.registry, this.metadataGenerator);
  private readonly lifecycleManager = new RefundLifecycleManager(this.transactionEngine);
  private readonly financialAdjustmentEngine = new FinancialAdjustmentEngine();
  private readonly anomalyDetector = new RefundAnomalyDetector();
  private readonly retryManager = new RefundRetryManager();
  private readonly dataSource: RefundDataSource;
  private readonly processingEngine: RefundProcessingEngine;

  constructor(
    private readonly framework: FinancialFrameworkEngine | null,
    private readonly paymentGateway: PaymentGatewayIntegrationEngine | null,
    private readonly bankingIntegration: BankingIntegrationEngine | null,
    private readonly revenueEngine: RevenueEngine | null,
    private readonly expenseEngine: ExpenseEngine | null,
    private readonly invoiceGenerator: InvoiceGeneratorEngine | null,
  ) {
    this.dataSource = new RefundDataSource(
      paymentGateway,
      bankingIntegration,
      revenueEngine,
      expenseEngine,
      invoiceGenerator,
    );
    this.processingEngine = new RefundProcessingEngine(
      this.registry,
      this.metadataGenerator,
      this.validationEngine,
      this.validationWrapper,
      this.transactionEngine,
      this.lifecycleManager,
      this.financialAdjustmentEngine,
      this.dataSource,
    );
  }

  getEngineRecord(): RefundEngineRecord | null {
    return this.engineRecord;
  }

  getRefundRecords() {
    return this.registry.list();
  }

  private isConnected(record: { currentOperationalState?: string } | null | undefined): boolean {
    const state = record?.currentOperationalState;
    return state === "active" || state === "connected";
  }

  private probeConnections() {
    const pgConnected = this.isConnected(this.paymentGateway?.getGatewayRecord?.());
    const biConnected = this.isConnected(this.bankingIntegration?.getIntegrationRecord?.());
    const reConnected = this.isConnected(this.revenueEngine?.getEngineRecord?.());
    const exConnected = this.isConnected(this.expenseEngine?.getEngineRecord?.());
    const igConnected = this.isConnected(this.invoiceGenerator?.getGeneratorRecord?.());
    return { pgConnected, biConnected, reConnected, exConnected, igConnected };
  }

  registerWithFramework(
    config: RefundEngineConfiguration,
  ): { frameworkModuleId: string | null; validation: RefundEngineRunReport["validation"] } {
    if (!this.framework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.framework.registerFinancialModule({
      definition: {
        financialModuleIdentifier: REFUND_ENGINE_ID,
        moduleVersion: RF_METADATA_VERSION,
        moduleType: "financial",
        integrationMissionId: "R3-10",
        authenticationMethod: "none",
        apiEndpointConfig: {
          baseUrl: "internal://refund-engine",
          protocol: "sdk",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: ["refund.requested", "refund.processed", "refund.failed"],
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

    appendRfLog({
      event: "engine_initialization",
      level: "info",
      details: `Registered refund engine with Financial Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `rf-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: RF_METADATA_VERSION,
      },
    };
  }

  connectRefundEngine(
    _input: ConnectRefundEngineInput,
    config: RefundEngineConfiguration,
  ): RefundEngineRunReport {
    const started = Date.now();
    const { pgConnected, biConnected, reConnected, exConnected, igConnected } = this.probeConnections();

    const frameworkReg = this.registerWithFramework(config);

    if (this.framework) {
      this.framework.activateFinancialModule(REFUND_ENGINE_ID);
    }

    const allConnected = pgConnected && biConnected && reConnected && igConnected;
    const record = this.metadataGenerator.buildEngineRecord({
      frameworkModuleId: frameworkReg.frameworkModuleId,
      operationalState: allConnected ? "active" : "connected",
      validationStatus: allConnected ? "passed" : "partial",
      paymentGatewayConnected: pgConnected,
      bankingIntegrationConnected: biConnected,
      revenueEngineConnected: reConnected,
      expenseEngineConnected: exConnected,
      invoiceGeneratorConnected: igConnected,
    });
    this.engineRecord = record;

    const validation = this.validator.validateEngineRecord(record);
    if (!pgConnected) validation.warnings.push("Payment Gateway not active");
    if (!biConnected) validation.warnings.push("Banking Integration not active");
    if (!reConnected) validation.warnings.push("Revenue Engine not active");
    if (!igConnected) validation.warnings.push("Invoice Generator not active");
    if (!allConnected) validation.decision = "partial";

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      refundRecords: [],
      anomalies: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  private runRefundAction(
    action: RefundEngineRunReport["action"],
    fn: () => {
      record: import("./types.js").RefundRecord | null;
      error: string | null;
      warnings: string[];
    },
    config: RefundEngineConfiguration,
  ): RefundEngineRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("Refund engine not connected");

    const result = fn();
    const validation = this.validator.validateEngineRecord(engineRecord);
    if (result.error) {
      validation.decision = "fail";
      validation.errors.push(result.error);
    }
    validation.warnings.push(...result.warnings);

    const refundRecords = result.record ? [result.record] : [];
    const snapshot = this.dataSource.snapshot();
    const priorTotal = result.record
      ? this.registry.completedRefundTotal(result.record.paymentReference)
      : 0;
    const anomalies = result.record
      ? this.anomalyDetector.detect(result.record, snapshot, config, priorTotal)
      : [];

    if (this.framework && result.record) {
      const topic =
        result.record.refundStatus === "completed"
          ? "refund.processed"
          : result.record.refundStatus === "failed"
            ? "refund.failed"
            : "refund.requested";
      this.framework.routeFinancialEvent({
        financialModuleIdentifier: REFUND_ENGINE_ID,
        topic,
        payloadRef: result.record.refundId,
      });
    }

    return this.metadataGenerator.buildRunReport({
      action,
      engineRecord,
      refundRecords,
      anomalies,
      validation,
      durationMs: Date.now() - started,
    });
  }

  createRefundRequest(
    input: CreateRefundRequestInput,
    config: RefundEngineConfiguration,
  ): RefundEngineRunReport {
    const dedupeKey = `request:${input.paymentReference}:${input.refundAmount}`;
    return this.runRefundAction(
      "create_refund_request",
      () => this.processingEngine.createRefundRequest(input, config, dedupeKey),
      config,
    );
  }

  validateRefundEligibility(
    input: ValidateRefundEligibilityInput,
    config: RefundEngineConfiguration,
  ): RefundEngineRunReport {
    const started = Date.now();
    const engineRecord = this.engineRecord;
    if (!engineRecord) throw new Error("Refund engine not connected");

    const eligibility = this.validationEngine.validateEligibility(
      input.paymentReference,
      input.refundAmount,
      config,
      this.dataSource,
      this.registry,
    );

    const validation = this.validator.validateEngineRecord(engineRecord);
    if (!eligibility.eligible) {
      validation.decision = "fail";
      validation.errors.push(...eligibility.errors);
    } else if (eligibility.warnings.length > 0) {
      validation.decision = "partial";
      validation.warnings.push(...eligibility.warnings);
    }

    return this.metadataGenerator.buildRunReport({
      action: "validate_eligibility",
      engineRecord,
      refundRecords: [],
      anomalies: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  processFullRefund(
    input: ProcessFullRefundInput,
    config: RefundEngineConfiguration,
  ): RefundEngineRunReport {
    const dedupeKey = `full:${input.paymentReference}`;
    return this.runRefundAction(
      "process_full_refund",
      () =>
        this.processingEngine.processFullRefund(
          input,
          config,
          this.revenueEngine,
          this.invoiceGenerator,
          dedupeKey,
        ),
      config,
    );
  }

  processPartialRefund(
    input: ProcessPartialRefundInput,
    config: RefundEngineConfiguration,
  ): RefundEngineRunReport {
    const dedupeKey = `partial:${input.paymentReference}:${input.refundAmount}`;
    return this.runRefundAction(
      "process_partial_refund",
      () =>
        this.processingEngine.processPartialRefund(
          input,
          config,
          this.revenueEngine,
          this.invoiceGenerator,
          dedupeKey,
        ),
      config,
    );
  }

  resetForTesting(): void {
    this.engineRecord = null;
    this.registry.resetForTesting();
    this.retryManager.reset();
  }
}
