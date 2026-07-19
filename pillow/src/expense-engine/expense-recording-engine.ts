/** R3-05 — Expense recording engine. */

import { appendExLog } from "./ex-logging.js";
import type { PaymentGatewayIntegrationEngine } from "../payment-gateway-integration/engine.js";
import type { BankingIntegrationEngine } from "../banking-integration/engine.js";
import type { ExpenseEngineConfiguration } from "./configuration.js";
import type { ExpenseMetadataGenerator } from "./expense-metadata-generator.js";
import type { ExpenseClassificationEngine } from "./expense-classification-engine.js";
import type { ExpenseValidationEngine } from "./expense-validator.js";
import type { ExpenseRegistry } from "./expense-registry.js";
import type {
  ExpenseRecord,
  RecordAdvertisingExpenseInput,
  RecordExpenseEventInput,
  RecordOperationalExpenseInput,
  RecordPlatformFeeInput,
  RecordShippingExpenseInput,
  RecordSupplierPaymentInput,
} from "./types.js";

export class ExpenseRecordingEngine {
  constructor(
    private readonly registry: ExpenseRegistry,
    private readonly metadataGenerator: ExpenseMetadataGenerator,
    private readonly classificationEngine: ExpenseClassificationEngine,
    private readonly validationEngine: ExpenseValidationEngine,
    private readonly paymentGateway: PaymentGatewayIntegrationEngine | null,
    private readonly bankingIntegration: BankingIntegrationEngine | null,
  ) {}

  recordEvent(
    input: RecordExpenseEventInput,
    config: ExpenseEngineConfiguration,
    explicitDedupeKey?: string,
  ): { record: ExpenseRecord | null; error: string | null } {
    const dedupeKey =
      explicitDedupeKey ??
      `${input.expenseSource}:${input.paymentReference ?? ""}:${input.supplierReference ?? ""}:${input.expenseAmount}`;

    if (this.registry.hasDedupeKey(dedupeKey)) {
      return { record: null, error: "Duplicate expense event" };
    }

    const classification = this.classificationEngine.classify(
      {
        expenseSource: input.expenseSource,
        expenseCategory: input.expenseCategory,
        recurring: input.recurring,
        supplierReference: input.supplierReference,
      },
      config,
    );

    let record = this.metadataGenerator.buildExpenseRecord({
      expenseSource: input.expenseSource,
      paymentReference: input.paymentReference ?? null,
      bankingReference: input.bankingReference ?? null,
      supplierReference: input.supplierReference ?? null,
      expenseCategory: classification.expenseCategory,
      expenseAmount: input.expenseAmount,
      currency: input.currency ?? config.defaultCurrency,
      expenseStatus: "recorded",
      validationStatus: "pending",
    });

    const validation = this.validationEngine.validateForRecording(record, config);
    if (validation.decision === "fail") {
      return { record: null, error: validation.errors.join("; ") };
    }

    record = { ...record, validationStatus: "passed" };
    this.registry.store(record, dedupeKey);

    appendExLog({
      event: "expense_recording",
      level: "info",
      details: `Recorded ${classification.expenseCategory} expense ${record.expenseRecordId}`,
    });

    return { record, error: null };
  }

  recordSupplierPayment(
    input: RecordSupplierPaymentInput,
    config: ExpenseEngineConfiguration,
  ): { record: ExpenseRecord | null; error: string | null; warnings: string[] } {
    const warnings: string[] = [];

    if (input.paymentReference && this.paymentGateway) {
      const payment = this.paymentGateway
        .getPaymentRecords()
        .find((p) => p.paymentId === input.paymentReference);
      if (!payment) warnings.push(`Payment record not found: ${input.paymentReference}`);
    }

    if (input.bankingReference && this.bankingIntegration) {
      const account = this.bankingIntegration
        .getBankingRecords()
        .find((a) => a.bankAccountReference === input.bankingReference);
      if (!account) warnings.push(`Banking record not found: ${input.bankingReference}`);
    }

    const dedupeKey = `supplier:${input.supplierReference}:${input.expenseAmount}`;
    if (this.registry.hasDedupeKey(dedupeKey)) {
      return { record: null, error: "Duplicate supplier payment expense", warnings };
    }

    const result = this.recordEvent(
      {
        expenseSource: "supplier_payment",
        expenseCategory: "supplier_payment",
        paymentReference: input.paymentReference,
        bankingReference: input.bankingReference,
        supplierReference: input.supplierReference,
        expenseAmount: input.expenseAmount,
        currency: input.currency,
        recurring: input.recurring,
      },
      config,
      dedupeKey,
    );

    return { ...result, warnings };
  }

  recordShippingExpense(
    input: RecordShippingExpenseInput,
    config: ExpenseEngineConfiguration,
  ): { record: ExpenseRecord | null; error: string | null } {
    return this.recordEvent({
      expenseSource: "shipping",
      expenseCategory: "shipping",
      paymentReference: input.paymentReference,
      expenseAmount: input.expenseAmount,
      currency: input.currency,
      recurring: input.recurring,
    }, config);
  }

  recordAdvertisingExpense(
    input: RecordAdvertisingExpenseInput,
    config: ExpenseEngineConfiguration,
  ): { record: ExpenseRecord | null; error: string | null } {
    return this.recordEvent({
      expenseSource: "advertising",
      expenseCategory: "advertising",
      paymentReference: input.paymentReference,
      expenseAmount: input.expenseAmount,
      currency: input.currency,
      recurring: input.recurring,
    }, config);
  }

  recordPlatformFee(
    input: RecordPlatformFeeInput,
    config: ExpenseEngineConfiguration,
  ): { record: ExpenseRecord | null; error: string | null } {
    return this.recordEvent({
      expenseSource: "platform_fee",
      expenseCategory: "platform_fee",
      paymentReference: input.paymentReference,
      expenseAmount: input.expenseAmount,
      currency: input.currency,
      recurring: input.recurring,
    }, config);
  }

  recordOperationalExpense(
    input: RecordOperationalExpenseInput,
    config: ExpenseEngineConfiguration,
  ): { record: ExpenseRecord | null; error: string | null } {
    return this.recordEvent({
      expenseSource: "operational",
      expenseCategory: "operational",
      paymentReference: input.paymentReference,
      bankingReference: input.bankingReference,
      expenseAmount: input.expenseAmount,
      currency: input.currency,
      recurring: input.recurring,
    }, config);
  }
}
