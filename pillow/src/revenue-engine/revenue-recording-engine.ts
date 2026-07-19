/** R3-04 — Revenue recording engine. */

import { appendReLog } from "./re-logging.js";
import type { PaymentGatewayIntegrationEngine } from "../payment-gateway-integration/engine.js";
import type { BankingIntegrationEngine } from "../banking-integration/engine.js";
import type { RevenueEngineConfiguration } from "./configuration.js";
import type { RevenueMetadataGenerator } from "./revenue-metadata-generator.js";
import type { RevenueClassificationEngine } from "./revenue-classification-engine.js";
import type { RevenueRegistry } from "./revenue-registry.js";
import type { RevenueValidator } from "./revenue-validator.js";
import type {
  RecordCompletedPaymentInput,
  RecordMarketplaceRevenueInput,
  RecordRevenueEventInput,
  RecordRevenueRefundInput,
  RecordSupplierSettlementInput,
  RevenueRecord,
} from "./types.js";

export class RevenueRecordingEngine {
  constructor(
    private readonly registry: RevenueRegistry,
    private readonly metadataGenerator: RevenueMetadataGenerator,
    private readonly classificationEngine: RevenueClassificationEngine,
    private readonly validator: RevenueValidator,
    private readonly paymentGateway: PaymentGatewayIntegrationEngine | null,
    private readonly bankingIntegration: BankingIntegrationEngine | null,
  ) {}

  recordEvent(
    input: RecordRevenueEventInput,
    config: RevenueEngineConfiguration,
    explicitDedupeKey?: string,
  ): { record: RevenueRecord | null; error: string | null } {
    const dedupeKey =
      explicitDedupeKey ??
      `${input.revenueSource}:${input.paymentReference ?? ""}:${input.marketplaceReference ?? ""}:${input.grossRevenue}`;
    if (this.registry.hasDedupeKey(dedupeKey)) {
      return { record: null, error: "Duplicate revenue event" };
    }

    const classification = this.classificationEngine.classify(
      {
        revenueSource: input.revenueSource,
        marketplaceReference: input.marketplaceReference,
        businessReference: input.businessReference,
        paymentReference: input.paymentReference,
      },
      config,
    );

    const netRevenue = input.netRevenue ?? input.grossRevenue;
    let record = this.metadataGenerator.buildRevenueRecord({
      revenueSource: input.revenueSource,
      paymentReference: input.paymentReference ?? null,
      bankingReference: input.bankingReference ?? null,
      marketplaceReference: input.marketplaceReference ?? null,
      customerReference: input.customerReference ?? null,
      businessReference: classification.businessReference,
      grossRevenue: input.grossRevenue,
      netRevenue,
      currency: input.currency ?? config.defaultCurrency,
      revenueStatus: "recorded",
      validationStatus: "pending",
    });

    record = this.classificationEngine.applyClassification(record, classification);
    const validation = this.validator.validateRevenueRecord(record);
    if (validation.decision === "fail") {
      record = { ...record, validationStatus: "failed", revenueStatus: "failed" };
      return { record: null, error: validation.errors.join("; ") };
    }

    record = { ...record, validationStatus: "passed" };
    this.registry.store(record, dedupeKey);

    appendReLog({
      event: "revenue_recording",
      level: "info",
      details: `Recorded ${input.revenueSource} revenue ${record.revenueRecordId}`,
    });

    return { record, error: null };
  }

  recordCompletedPayment(
    input: RecordCompletedPaymentInput,
    config: RevenueEngineConfiguration,
  ): { record: RevenueRecord | null; error: string | null; warnings: string[] } {
    const warnings: string[] = [];
    if (!this.paymentGateway) {
      return { record: null, error: "Payment Gateway Integration unavailable", warnings };
    }

    const payments = this.paymentGateway.getPaymentRecords();
    const payment = payments.find((p) => p.paymentId === input.paymentId);
    if (!payment) {
      return { record: null, error: `Payment record not found: ${input.paymentId}`, warnings };
    }
    if (payment.paymentStatus !== "captured" && payment.paymentStatus !== "authorized") {
      warnings.push(`Payment status is ${payment.paymentStatus}, not captured`);
    }

    const dedupeKey = `payment:${payment.paymentId}`;
    if (this.registry.hasDedupeKey(dedupeKey)) {
      return { record: null, error: "Duplicate completed payment revenue event", warnings };
    }

    const result = this.recordEvent(
      {
        revenueSource: "payment",
        paymentReference: payment.paymentId,
        customerReference: payment.customerReference,
        businessReference: input.businessReference,
        grossRevenue: payment.paymentAmount,
        netRevenue: payment.paymentAmount,
        currency: payment.currency,
      },
      config,
      dedupeKey,
    );

    return { ...result, warnings };
  }

  recordMarketplaceRevenue(
    input: RecordMarketplaceRevenueInput,
    config: RevenueEngineConfiguration,
  ): { record: RevenueRecord | null; error: string | null } {
    return this.recordEvent(
      {
        revenueSource: "marketplace",
        marketplaceReference: input.marketplaceReference,
        customerReference: input.customerReference,
        businessReference: input.businessReference,
        grossRevenue: input.grossRevenue,
        netRevenue: input.netRevenue,
        currency: input.currency,
      },
      config,
    );
  }

  recordSupplierSettlement(
    input: RecordSupplierSettlementInput,
    config: RevenueEngineConfiguration,
  ): { record: RevenueRecord | null; error: string | null; warnings: string[] } {
    const warnings: string[] = [];
    if (!this.bankingIntegration) {
      return { record: null, error: "Banking Integration unavailable", warnings };
    }

    const accounts = this.bankingIntegration.getBankingRecords();
    const account = accounts.find((a) => a.bankAccountReference === input.bankingReference);
    if (!account) {
      warnings.push(`Banking record not found: ${input.bankingReference}`);
    }

    const result = this.recordEvent(
      {
        revenueSource: "supplier_settlement",
        bankingReference: input.bankingReference,
        businessReference: input.businessReference,
        grossRevenue: input.grossRevenue,
        netRevenue: input.netRevenue,
        currency: input.currency,
      },
      config,
    );

    return { ...result, warnings };
  }

  recordRefund(
    input: RecordRevenueRefundInput,
    config: RevenueEngineConfiguration,
  ): { record: RevenueRecord | null; error: string | null } {
    const grossRevenue = -Math.abs(input.refundAmount);
    const netRevenue = config.refundDeductionEnabled ? grossRevenue : 0;

    return this.recordEvent(
      {
        revenueSource: "refund",
        paymentReference: input.paymentReference,
        businessReference: input.businessReference,
        grossRevenue,
        netRevenue,
        currency: input.currency,
      },
      config,
    );
  }
}
