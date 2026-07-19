/** R3-09 — Invoice calculation engine. */

import { IG_METADATA_VERSION } from "./paths.js";
import type { InvoiceGeneratorConfiguration } from "./configuration.js";
import type { InvoiceLineItem } from "./types.js";

export type InvoiceCalculation = {
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxAmount: number;
  invoiceAmount: number;
};

export class InvoiceCalculationEngine {
  calculateCustomerInvoice(input: {
    description: string;
    amount: number;
    currency: string;
    config: InvoiceGeneratorConfiguration;
  }): InvoiceCalculation {
    const lineItems: InvoiceLineItem[] = [
      this.buildLineItem(input.description, 1, input.amount),
    ];
    return this.summarize(lineItems, input.config);
  }

  calculateSupplierInvoice(input: {
    description: string;
    amount: number;
    currency: string;
    config: InvoiceGeneratorConfiguration;
  }): InvoiceCalculation {
    const lineItems: InvoiceLineItem[] = [
      this.buildLineItem(input.description, 1, input.amount),
    ];
    return this.summarize(lineItems, input.config);
  }

  private buildLineItem(description: string, quantity: number, unitAmount: number): InvoiceLineItem {
    return {
      lineItemId: `inv-li-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      description,
      quantity,
      unitAmount,
      lineTotal: quantity * unitAmount,
      metadataVersion: IG_METADATA_VERSION,
    };
  }

  private summarize(
    lineItems: InvoiceLineItem[],
    config: InvoiceGeneratorConfiguration,
  ): InvoiceCalculation {
    const subtotal = lineItems.reduce((s, item) => s + item.lineTotal, 0);
    const taxAmount = config.taxCalculationRulesEnabled
      ? Math.round(subtotal * config.defaultTaxRate * 100) / 100
      : 0;
    const invoiceAmount = Math.round((subtotal + taxAmount) * 100) / 100;
    return { lineItems, subtotal, taxAmount, invoiceAmount };
  }
}
