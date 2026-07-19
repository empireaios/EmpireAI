/** R3-10 — Refund data source (consumes R3-02 through R3-05 and R3-09). */

import type { PaymentGatewayIntegrationEngine } from "../payment-gateway-integration/engine.js";
import type { BankingIntegrationEngine } from "../banking-integration/engine.js";
import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { ExpenseEngine } from "../expense-engine/engine.js";
import type { InvoiceGeneratorEngine } from "../invoice-generator/engine.js";
import type { PaymentRecord } from "../payment-gateway-integration/types.js";
import type { BankingRecord } from "../banking-integration/types.js";
import type { InvoiceRecord } from "../invoice-generator/types.js";

export type RefundFinancialSnapshot = {
  payments: PaymentRecord[];
  bankingRecords: BankingRecord[];
  invoices: InvoiceRecord[];
  warnings: string[];
};

export class RefundDataSource {
  constructor(
    private readonly paymentGateway: PaymentGatewayIntegrationEngine | null,
    private readonly bankingIntegration: BankingIntegrationEngine | null,
    private readonly revenueEngine: RevenueEngine | null,
    private readonly expenseEngine: ExpenseEngine | null,
    private readonly invoiceGenerator: InvoiceGeneratorEngine | null,
  ) {}

  snapshot(): RefundFinancialSnapshot {
    const warnings: string[] = [];
    let payments: PaymentRecord[] = [];
    let bankingRecords: BankingRecord[] = [];
    let invoices: InvoiceRecord[] = [];

    if (this.paymentGateway) {
      payments = this.paymentGateway
        .getPaymentRecords()
        .filter((p) => p.validationStatus === "passed");
    } else {
      warnings.push("Payment Gateway unavailable");
    }

    if (this.bankingIntegration) {
      bankingRecords = this.bankingIntegration
        .getBankingRecords()
        .filter((r) => r.validationStatus === "passed");
    } else {
      warnings.push("Banking Integration unavailable");
    }

    if (this.invoiceGenerator) {
      invoices = this.invoiceGenerator
        .getInvoiceRecords()
        .filter((r) => r.validationStatus === "passed");
    } else {
      warnings.push("Invoice Generator unavailable");
    }

    if (!this.revenueEngine) warnings.push("Revenue Engine unavailable");
    if (!this.expenseEngine) warnings.push("Expense Engine unavailable");

    return { payments, bankingRecords, invoices, warnings };
  }

  getPayment(paymentReference: string): PaymentRecord | null {
    return this.snapshot().payments.find((p) => p.paymentId === paymentReference) ?? null;
  }

  getInvoice(invoiceReference: string): InvoiceRecord | null {
    return this.snapshot().invoices.find((i) => i.invoiceId === invoiceReference) ?? null;
  }

  resolveBankingReference(payment: PaymentRecord): string | null {
    const accounts = this.snapshot().bankingRecords;
    return accounts[0]?.bankAccountReference ?? null;
  }
}
