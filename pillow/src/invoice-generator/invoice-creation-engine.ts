/** R3-09 — Invoice creation engine. */

import { appendIgLog } from "./ig-logging.js";
import type { InvoiceGeneratorConfiguration } from "./configuration.js";
import type { InvoiceDataSource } from "./invoice-data-source.js";
import type { InvoiceNumberGenerator } from "./invoice-number-generator.js";
import type { InvoiceCalculationEngine } from "./invoice-calculation-engine.js";
import type { InvoiceMetadataGenerator } from "./invoice-metadata-generator.js";
import type { InvoiceValidationEngine } from "./invoice-validator.js";
import type { InvoiceRegistry } from "./invoice-registry.js";
import type {
  CreateCustomerInvoiceInput,
  CreateSupplierInvoiceInput,
  InvoiceRecord,
} from "./types.js";

export class InvoiceCreationEngine {
  constructor(
    private readonly registry: InvoiceRegistry,
    private readonly metadataGenerator: InvoiceMetadataGenerator,
    private readonly validationEngine: InvoiceValidationEngine,
    private readonly numberGenerator: InvoiceNumberGenerator,
    private readonly calculationEngine: InvoiceCalculationEngine,
    private readonly dataSource: InvoiceDataSource,
  ) {}

  createCustomerInvoice(
    input: CreateCustomerInvoiceInput,
    config: InvoiceGeneratorConfiguration,
    dedupeKey: string,
  ): { record: InvoiceRecord | null; error: string | null; warnings: string[] } {
    if (this.registry.hasDedupeKey(dedupeKey)) {
      return { record: null, error: "Duplicate invoice generation request", warnings: [] };
    }

    const revenue = this.dataSource.getRevenue(input.revenueReference);
    if (!revenue) {
      return { record: null, error: `Revenue record not found: ${input.revenueReference}`, warnings: [] };
    }

    const calc = this.calculationEngine.calculateCustomerInvoice({
      description: `Customer invoice for ${revenue.revenueSource}`,
      amount: revenue.netRevenue,
      currency: input.currency ?? revenue.currency ?? config.defaultCurrency,
      config,
    });

    let record = this.metadataGenerator.buildInvoiceRecord({
      invoiceNumber: this.numberGenerator.generate(config, this.registry),
      customerReference: input.customerReference ?? revenue.customerReference ?? "customer-unknown",
      supplierReference: null,
      orderReference: input.orderReference ?? revenue.paymentReference,
      revenueReference: revenue.revenueRecordId,
      expenseReference: null,
      invoiceAmount: calc.invoiceAmount,
      currency: input.currency ?? revenue.currency ?? config.defaultCurrency,
      taxAmount: calc.taxAmount,
      lineItems: calc.lineItems,
      invoiceStatus: config.defaultInitialStatus,
      validationStatus: "pending",
    });

    const validation = this.validationEngine.validateForGeneration(record, config);
    if (validation.decision === "fail") {
      return { record: null, error: validation.errors.join("; "), warnings: [] };
    }

    record = { ...record, validationStatus: "passed" };
    this.registry.store(record, dedupeKey);

    appendIgLog({
      event: "customer_invoice_generation",
      level: "info",
      details: `Created customer invoice ${record.invoiceId} · ${record.invoiceAmount}`,
    });

    return { record, error: null, warnings: [] };
  }

  createSupplierInvoice(
    input: CreateSupplierInvoiceInput,
    config: InvoiceGeneratorConfiguration,
    dedupeKey: string,
  ): { record: InvoiceRecord | null; error: string | null; warnings: string[] } {
    if (this.registry.hasDedupeKey(dedupeKey)) {
      return { record: null, error: "Duplicate invoice generation request", warnings: [] };
    }

    const expense = this.dataSource.getExpense(input.expenseReference);
    if (!expense) {
      return { record: null, error: `Expense record not found: ${input.expenseReference}`, warnings: [] };
    }

    const calc = this.calculationEngine.calculateSupplierInvoice({
      description: `Supplier invoice for ${expense.expenseCategory}`,
      amount: expense.expenseAmount,
      currency: input.currency ?? expense.currency ?? config.defaultCurrency,
      config,
    });

    let record = this.metadataGenerator.buildInvoiceRecord({
      invoiceNumber: this.numberGenerator.generate(config, this.registry),
      customerReference: null,
      supplierReference: input.supplierReference ?? expense.supplierReference ?? "supplier-unknown",
      orderReference: null,
      revenueReference: null,
      expenseReference: expense.expenseRecordId,
      invoiceAmount: calc.invoiceAmount,
      currency: input.currency ?? expense.currency ?? config.defaultCurrency,
      taxAmount: calc.taxAmount,
      lineItems: calc.lineItems,
      invoiceStatus: config.defaultInitialStatus,
      validationStatus: "pending",
    });

    const validation = this.validationEngine.validateForGeneration(record, config);
    if (validation.decision === "fail") {
      return { record: null, error: validation.errors.join("; "), warnings: [] };
    }

    record = { ...record, validationStatus: "passed" };
    this.registry.store(record, dedupeKey);

    appendIgLog({
      event: "supplier_invoice_generation",
      level: "info",
      details: `Created supplier invoice ${record.invoiceId} · ${record.invoiceAmount}`,
    });

    return { record, error: null, warnings: [] };
  }
}
