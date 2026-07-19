/** R3-10 — Refund processing engine. */

import { appendRfLog } from "./rf-logging.js";
import type { RefundEngineConfiguration } from "./configuration.js";
import type { RefundDataSource } from "./refund-data-source.js";
import type { RefundRegistry } from "./refund-registry.js";
import type { RefundValidationEngine } from "./refund-validation-engine.js";
import type { RefundMetadataGenerator } from "./refund-metadata-generator.js";
import type { RefundValidationEngineWrapper } from "./refund-validator.js";
import type { RefundTransactionEngine } from "./refund-transaction-engine.js";
import type { RefundLifecycleManager } from "./refund-lifecycle-manager.js";
import type { FinancialAdjustmentEngine } from "./financial-adjustment-engine.js";
import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { InvoiceGeneratorEngine } from "../invoice-generator/engine.js";
import type {
  CreateRefundRequestInput,
  ProcessFullRefundInput,
  ProcessPartialRefundInput,
  RefundRecord,
} from "./types.js";

export class RefundProcessingEngine {
  constructor(
    private readonly registry: RefundRegistry,
    private readonly metadataGenerator: RefundMetadataGenerator,
    private readonly validationEngine: RefundValidationEngine,
    private readonly validationWrapper: RefundValidationEngineWrapper,
    private readonly transactionEngine: RefundTransactionEngine,
    private readonly lifecycleManager: RefundLifecycleManager,
    private readonly financialAdjustmentEngine: FinancialAdjustmentEngine,
    private readonly dataSource: RefundDataSource,
  ) {}

  createRefundRequest(
    input: CreateRefundRequestInput,
    config: RefundEngineConfiguration,
    dedupeKey: string,
  ): { record: RefundRecord | null; error: string | null; warnings: string[] } {
    if (this.registry.hasDedupeKey(dedupeKey)) {
      return { record: null, error: "Duplicate refund request", warnings: [] };
    }

    const eligibility = this.validationEngine.validateEligibility(
      input.paymentReference,
      input.refundAmount,
      config,
      this.dataSource,
      this.registry,
    );

    if (!eligibility.eligible) {
      return { record: null, error: eligibility.errors.join("; "), warnings: eligibility.warnings };
    }

    const payment = eligibility.payment!;
    const record = this.metadataGenerator.buildRefundRecord({
      paymentReference: input.paymentReference,
      bankingReference: this.dataSource.resolveBankingReference(payment),
      invoiceReference: input.invoiceReference ?? null,
      customerReference: input.customerReference ?? payment.customerReference ?? null,
      orderReference: input.orderReference ?? payment.orderReference ?? null,
      refundAmount: input.refundAmount,
      currency: input.currency ?? payment.currency ?? config.defaultCurrency,
      refundReason: input.refundReason,
      refundStatus: "pending",
      validationStatus: "passed",
    });

    const validation = this.validationWrapper.validateForProcessing(record, config);
    if (validation.decision === "fail") {
      return { record: null, error: validation.errors.join("; "), warnings: validation.warnings };
    }

    this.registry.store(record, dedupeKey);
    appendRfLog({
      event: "refund_request",
      level: "info",
      details: `Refund request ${record.refundId} for payment ${input.paymentReference}`,
    });

    return { record, error: null, warnings: [...eligibility.warnings, ...validation.warnings] };
  }

  processRefund(
    input: {
      paymentReference: string;
      refundAmount: number;
      refundReason: string;
      invoiceReference?: string;
      currency?: string;
      fullRefund: boolean;
    },
    config: RefundEngineConfiguration,
    revenueEngine: RevenueEngine | null,
    invoiceGenerator: InvoiceGeneratorEngine | null,
    dedupeKey: string,
  ): { record: RefundRecord | null; error: string | null; warnings: string[] } {
    if (this.registry.hasDedupeKey(dedupeKey)) {
      return { record: null, error: "Duplicate refund processing request", warnings: [] };
    }

    const eligibility = this.validationEngine.validateEligibility(
      input.paymentReference,
      input.refundAmount,
      config,
      this.dataSource,
      this.registry,
    );

    if (!eligibility.eligible) {
      return { record: null, error: eligibility.errors.join("; "), warnings: eligibility.warnings };
    }

    const payment = eligibility.payment!;
    let record = this.metadataGenerator.buildRefundRecord({
      paymentReference: input.paymentReference,
      bankingReference: this.dataSource.resolveBankingReference(payment),
      invoiceReference: input.invoiceReference ?? null,
      customerReference: payment.customerReference ?? null,
      orderReference: payment.orderReference ?? null,
      refundAmount: input.refundAmount,
      currency: input.currency ?? payment.currency ?? config.defaultCurrency,
      refundReason: input.refundReason,
      refundStatus: "validated",
      validationStatus: "passed",
    });

    record = this.lifecycleManager.advance(record, "processing", this.registry);

    const adjustments = this.financialAdjustmentEngine.applyRefundAdjustments({
      record,
      fullRefund: input.fullRefund,
      revenueEngine,
      invoiceGenerator,
    });

    if (adjustments.errors.length > 0) {
      record = this.lifecycleManager.markFailed(record, this.registry);
      return {
        record,
        error: adjustments.errors.join("; "),
        warnings: [...eligibility.warnings, ...adjustments.warnings],
      };
    }

    record = this.lifecycleManager.markCompleted(record, this.registry);
    this.registry.store(record, dedupeKey);

    appendRfLog({
      event: "refund_processing",
      level: "info",
      details: `${input.fullRefund ? "Full" : "Partial"} refund ${record.refundId} completed`,
    });

    return {
      record,
      error: null,
      warnings: [...eligibility.warnings, ...adjustments.warnings],
    };
  }

  processFullRefund(
    input: ProcessFullRefundInput,
    config: RefundEngineConfiguration,
    revenueEngine: RevenueEngine | null,
    invoiceGenerator: InvoiceGeneratorEngine | null,
    dedupeKey: string,
  ) {
    const payment = this.dataSource.getPayment(input.paymentReference);
    if (!payment) {
      return { record: null, error: `Payment not found: ${input.paymentReference}`, warnings: [] };
    }
    const priorRefunds = this.registry.completedRefundTotal(input.paymentReference);
    const refundAmount = payment.paymentAmount - priorRefunds;

    return this.processRefund(
      {
        paymentReference: input.paymentReference,
        refundAmount,
        refundReason: input.refundReason,
        invoiceReference: input.invoiceReference,
        currency: input.currency,
        fullRefund: true,
      },
      config,
      revenueEngine,
      invoiceGenerator,
      dedupeKey,
    );
  }

  processPartialRefund(
    input: ProcessPartialRefundInput,
    config: RefundEngineConfiguration,
    revenueEngine: RevenueEngine | null,
    invoiceGenerator: InvoiceGeneratorEngine | null,
    dedupeKey: string,
  ) {
    return this.processRefund(
      {
        paymentReference: input.paymentReference,
        refundAmount: input.refundAmount,
        refundReason: input.refundReason,
        invoiceReference: input.invoiceReference,
        currency: input.currency,
        fullRefund: false,
      },
      config,
      revenueEngine,
      invoiceGenerator,
      dedupeKey,
    );
  }
}
