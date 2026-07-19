/** R3-11 — Tax classification engine. */

import type { TaxIntelligenceEngineConfiguration } from "./configuration.js";
import type { TaxDataSource } from "./tax-data-source.js";
import type { TaxCategory } from "./types.js";

export type ClassificationResult = {
  category: TaxCategory;
  taxableAmount: number;
  jurisdiction: string;
  revenueReference: string | null;
  expenseReference: string | null;
  invoiceReference: string | null;
  refundReference: string | null;
  errors: string[];
  warnings: string[];
};

export class TaxClassificationEngine {
  classify(
    input: {
      revenueReference?: string;
      expenseReference?: string;
      invoiceReference?: string;
      refundReference?: string;
      taxJurisdiction?: string;
    },
    config: TaxIntelligenceEngineConfiguration,
    dataSource: TaxDataSource,
  ): ClassificationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const jurisdiction = input.taxJurisdiction ?? config.defaultJurisdiction;

    if (input.refundReference) {
      const refund = dataSource.getRefund(input.refundReference);
      if (!refund) errors.push(`Refund record not found: ${input.refundReference}`);
      return {
        category: "refund_adjustment",
        taxableAmount: refund ? -Math.abs(refund.refundAmount) : 0,
        jurisdiction,
        revenueReference: null,
        expenseReference: null,
        invoiceReference: refund?.invoiceReference ?? null,
        refundReference: input.refundReference,
        errors,
        warnings,
      };
    }

    if (input.invoiceReference) {
      const invoice = dataSource.getInvoice(input.invoiceReference);
      if (!invoice) errors.push(`Invoice record not found: ${input.invoiceReference}`);
      const category: TaxCategory = jurisdiction === "US" ? "sales_tax" : "vat";
      return {
        category,
        taxableAmount: invoice?.invoiceAmount ?? 0,
        jurisdiction,
        revenueReference: invoice?.revenueReference ?? null,
        expenseReference: invoice?.expenseReference ?? null,
        invoiceReference: input.invoiceReference,
        refundReference: null,
        errors,
        warnings,
      };
    }

    if (input.revenueReference) {
      const revenue = dataSource.getRevenue(input.revenueReference);
      if (!revenue) errors.push(`Revenue record not found: ${input.revenueReference}`);
      const category: TaxCategory =
        revenue?.revenueSource === "refund" ? "refund_adjustment" : "sales_tax";
      return {
        category,
        taxableAmount: revenue ? Math.abs(revenue.grossRevenue) : 0,
        jurisdiction,
        revenueReference: input.revenueReference,
        expenseReference: null,
        invoiceReference: null,
        refundReference: null,
        errors,
        warnings,
      };
    }

    if (input.expenseReference) {
      const expense = dataSource.getExpense(input.expenseReference);
      if (!expense) errors.push(`Expense record not found: ${input.expenseReference}`);
      return {
        category: "deductible",
        taxableAmount: expense ? Math.abs(expense.expenseAmount) : 0,
        jurisdiction,
        revenueReference: null,
        expenseReference: input.expenseReference,
        invoiceReference: null,
        refundReference: null,
        errors,
        warnings,
      };
    }

    errors.push("At least one financial reference required for classification");
    return {
      category: "sales_tax",
      taxableAmount: 0,
      jurisdiction,
      revenueReference: null,
      expenseReference: null,
      invoiceReference: null,
      refundReference: null,
      errors,
      warnings,
    };
  }
}
