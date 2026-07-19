/** R3-04 — Revenue Engine Manager. */

import type { FinancialFrameworkEngine } from "../financial-framework/engine.js";
import type { PaymentGatewayIntegrationEngine } from "../payment-gateway-integration/engine.js";
import type { BankingIntegrationEngine } from "../banking-integration/engine.js";
import { REVENUE_ENGINE_ID, RE_METADATA_VERSION } from "./paths.js";
import { appendReLog } from "./re-logging.js";
import { RevenueRegistry } from "./revenue-registry.js";
import { RevenueRecordingEngine } from "./revenue-recording-engine.js";
import { RevenueAggregationEngine } from "./revenue-aggregation-engine.js";
import { RevenueClassificationEngine } from "./revenue-classification-engine.js";
import { RevenueAnalyticsEngine } from "./revenue-analytics-engine.js";
import { RevenueRetryManager } from "./revenue-retry-manager.js";
import { RevenueValidator } from "./revenue-validator.js";
import { RevenueMetadataGenerator } from "./revenue-metadata-generator.js";
import type { RevenueEngineConfiguration } from "./configuration.js";
import type {
  AggregateRevenueInput,
  ConnectRevenueEngineInput,
  RecordCompletedPaymentInput,
  RecordMarketplaceRevenueInput,
  RecordRevenueEventInput,
  RecordRevenueRefundInput,
  RecordSupplierSettlementInput,
  RevenueEngineRecord,
  RevenueEngineRunReport,
} from "./types.js";

export class RevenueEngineManager {
  private engineRecord: RevenueEngineRecord | null = null;
  private readonly registry = new RevenueRegistry();
  private readonly validator = new RevenueValidator();
  private readonly metadataGenerator = new RevenueMetadataGenerator();
  private readonly classificationEngine = new RevenueClassificationEngine();
  private readonly retryManager = new RevenueRetryManager();
  private readonly recordingEngine: RevenueRecordingEngine;
  private readonly aggregationEngine: RevenueAggregationEngine;
  private readonly analyticsEngine: RevenueAnalyticsEngine;

  constructor(
    private readonly framework: FinancialFrameworkEngine | null,
    private readonly paymentGateway: PaymentGatewayIntegrationEngine | null,
    private readonly bankingIntegration: BankingIntegrationEngine | null,
  ) {
    this.recordingEngine = new RevenueRecordingEngine(
      this.registry,
      this.metadataGenerator,
      this.classificationEngine,
      this.validator,
      paymentGateway,
      bankingIntegration,
    );
    this.aggregationEngine = new RevenueAggregationEngine(this.registry, this.metadataGenerator);
    this.analyticsEngine = new RevenueAnalyticsEngine(this.registry);
  }

  getEngineRecord(): RevenueEngineRecord | null {
    return this.engineRecord;
  }

  getRevenueRecords() {
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

  registerWithFramework(
    config: RevenueEngineConfiguration,
  ): { frameworkModuleId: string | null; validation: RevenueEngineRunReport["validation"] } {
    if (!this.framework) {
      return {
        frameworkModuleId: null,
        validation: this.validator.validateConfiguration(config),
      };
    }

    const report = this.framework.registerFinancialModule({
      definition: {
        financialModuleIdentifier: REVENUE_ENGINE_ID,
        moduleVersion: RE_METADATA_VERSION,
        moduleType: "financial",
        integrationMissionId: "R3-04",
        authenticationMethod: "none",
        apiEndpointConfig: {
          baseUrl: "internal://revenue-engine",
          protocol: "sdk",
          timeoutMs: config.connectionTimeoutMs,
          version: "v1",
        },
        eventRoutingConfig: {
          enabled: true,
          topics: [
            "revenue.recorded",
            "revenue.aggregated",
            "revenue.refund",
            "revenue.anomaly",
          ],
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

    appendReLog({
      event: "engine_initialization",
      level: "info",
      details: `Registered revenue engine with Financial Framework: ${report.validation.decision}`,
    });

    return {
      frameworkModuleId: report.records[0]?.frameworkId ?? null,
      validation: {
        validationReportId: `re-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: report.validation.decision,
        errors: report.validation.errors,
        warnings: report.validation.warnings,
        durationMs: report.durationMs,
        metadataVersion: RE_METADATA_VERSION,
      },
    };
  }

  connectRevenueEngine(
    _input: ConnectRevenueEngineInput,
    config: RevenueEngineConfiguration,
  ): RevenueEngineRunReport {
    const started = Date.now();
    const pgConnected = this.isPaymentGatewayConnected();
    const biConnected = this.isBankingIntegrationConnected();

    const frameworkReg = this.registerWithFramework(config);

    if (this.framework) {
      this.framework.activateFinancialModule(REVENUE_ENGINE_ID);
    }

    const record = this.metadataGenerator.buildEngineRecord({
      frameworkModuleId: frameworkReg.frameworkModuleId,
      operationalState: pgConnected && biConnected ? "active" : "connected",
      validationStatus: pgConnected && biConnected ? "passed" : "partial",
      paymentGatewayConnected: pgConnected,
      bankingIntegrationConnected: biConnected,
    });
    this.engineRecord = record;

    const validation = this.validator.validateEngineRecord(record);
    if (!pgConnected) validation.warnings.push("Payment Gateway Integration not active");
    if (!biConnected) validation.warnings.push("Banking Integration not active");
    if (!pgConnected || !biConnected) validation.decision = "partial";

    return this.metadataGenerator.buildRunReport({
      action: "connect",
      engineRecord: record,
      revenueRecords: [],
      aggregation: null,
      anomalies: [],
      validation,
      durationMs: Date.now() - started,
    });
  }

  recordRevenueEvent(
    input: RecordRevenueEventInput,
    config: RevenueEngineConfiguration,
  ): RevenueEngineRunReport {
    const started = Date.now();
    const record = this.engineRecord;
    if (!record || record.currentOperationalState === "failed") {
      throw new Error("Revenue engine not connected");
    }

    const result = this.recordingEngine.recordEvent(input, config);
    const validation = this.validator.validateEngineRecord(record);
    if (result.error) {
      validation.decision = "fail";
      validation.errors.push(result.error);
    }

    const revenueRecords = result.record ? [result.record] : [];
    const anomalies = result.record
      ? this.analyticsEngine.detectAnomalies(revenueRecords, config)
      : [];

    if (this.framework && result.record) {
      this.framework.routeFinancialEvent({
        financialModuleIdentifier: REVENUE_ENGINE_ID,
        topic: "revenue.recorded",
        payloadRef: result.record.revenueRecordId,
      });
    }

    return this.metadataGenerator.buildRunReport({
      action: "record_event",
      engineRecord: record,
      revenueRecords,
      aggregation: null,
      anomalies,
      validation,
      durationMs: Date.now() - started,
    });
  }

  recordCompletedPayment(
    input: RecordCompletedPaymentInput,
    config: RevenueEngineConfiguration,
  ): RevenueEngineRunReport {
    const started = Date.now();
    const record = this.engineRecord;
    if (!record) throw new Error("Revenue engine not connected");

    const result = this.recordingEngine.recordCompletedPayment(input, config);
    const validation = this.validator.validateEngineRecord(record);
    if (result.error) {
      validation.decision = "fail";
      validation.errors.push(result.error);
    }
    validation.warnings.push(...result.warnings);

    const revenueRecords = result.record ? [result.record] : [];
    const anomalies = result.record
      ? this.analyticsEngine.detectAnomalies(revenueRecords, config)
      : [];

    if (this.framework && result.record) {
      this.framework.routeFinancialEvent({
        financialModuleIdentifier: REVENUE_ENGINE_ID,
        topic: "revenue.recorded",
        payloadRef: result.record.revenueRecordId,
      });
    }

    return this.metadataGenerator.buildRunReport({
      action: "record_payment",
      engineRecord: record,
      revenueRecords,
      aggregation: null,
      anomalies,
      validation,
      durationMs: Date.now() - started,
    });
  }

  recordMarketplaceRevenue(
    input: RecordMarketplaceRevenueInput,
    config: RevenueEngineConfiguration,
  ): RevenueEngineRunReport {
    const started = Date.now();
    const record = this.engineRecord;
    if (!record) throw new Error("Revenue engine not connected");

    const result = this.recordingEngine.recordMarketplaceRevenue(input, config);
    const validation = this.validator.validateEngineRecord(record);
    if (result.error) {
      validation.decision = "fail";
      validation.errors.push(result.error);
    }

    const revenueRecords = result.record ? [result.record] : [];
    const anomalies = result.record
      ? this.analyticsEngine.detectAnomalies(revenueRecords, config)
      : [];

    return this.metadataGenerator.buildRunReport({
      action: "record_marketplace",
      engineRecord: record,
      revenueRecords,
      aggregation: null,
      anomalies,
      validation,
      durationMs: Date.now() - started,
    });
  }

  recordSupplierSettlement(
    input: RecordSupplierSettlementInput,
    config: RevenueEngineConfiguration,
  ): RevenueEngineRunReport {
    const started = Date.now();
    const record = this.engineRecord;
    if (!record) throw new Error("Revenue engine not connected");

    const result = this.recordingEngine.recordSupplierSettlement(input, config);
    const validation = this.validator.validateEngineRecord(record);
    if (result.error) {
      validation.decision = "fail";
      validation.errors.push(result.error);
    }
    validation.warnings.push(...result.warnings);

    const revenueRecords = result.record ? [result.record] : [];
    const anomalies = result.record
      ? this.analyticsEngine.detectAnomalies(revenueRecords, config)
      : [];

    return this.metadataGenerator.buildRunReport({
      action: "record_settlement",
      engineRecord: record,
      revenueRecords,
      aggregation: null,
      anomalies,
      validation,
      durationMs: Date.now() - started,
    });
  }

  recordRevenueRefund(
    input: RecordRevenueRefundInput,
    config: RevenueEngineConfiguration,
  ): RevenueEngineRunReport {
    const started = Date.now();
    const record = this.engineRecord;
    if (!record) throw new Error("Revenue engine not connected");

    const result = this.recordingEngine.recordRefund(input, config);
    const validation = this.validator.validateEngineRecord(record);
    if (result.error) {
      validation.decision = "fail";
      validation.errors.push(result.error);
    }

    const revenueRecords = result.record ? [result.record] : [];
    const anomalies = result.record
      ? this.analyticsEngine.detectAnomalies(revenueRecords, config)
      : [];

    if (this.framework && result.record) {
      this.framework.routeFinancialEvent({
        financialModuleIdentifier: REVENUE_ENGINE_ID,
        topic: "revenue.refund",
        payloadRef: result.record.revenueRecordId,
      });
    }

    return this.metadataGenerator.buildRunReport({
      action: "record_refund",
      engineRecord: record,
      revenueRecords,
      aggregation: null,
      anomalies,
      validation,
      durationMs: Date.now() - started,
    });
  }

  aggregateRevenue(
    input: AggregateRevenueInput,
    config: RevenueEngineConfiguration,
  ): RevenueEngineRunReport {
    const started = Date.now();
    const record = this.engineRecord;
    if (!record) throw new Error("Revenue engine not connected");

    try {
      const aggregation = this.aggregationEngine.aggregate(input, config);
      const validation = this.validator.validateEngineRecord(record);

      if (this.framework) {
        this.framework.routeFinancialEvent({
          financialModuleIdentifier: REVENUE_ENGINE_ID,
          topic: "revenue.aggregated",
          payloadRef: aggregation.summaryId,
        });
      }

      return this.metadataGenerator.buildRunReport({
        action: "aggregate",
        engineRecord: record,
        revenueRecords: this.registry.listValidated(),
        aggregation,
        anomalies: [],
        validation,
        durationMs: Date.now() - started,
      });
    } catch (error) {
      const validation = this.validator.validateEngineRecord(record);
      validation.decision = "fail";
      validation.errors.push(error instanceof Error ? error.message : "Aggregation failed");
      return this.metadataGenerator.buildRunReport({
        action: "aggregate",
        engineRecord: record,
        revenueRecords: [],
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
