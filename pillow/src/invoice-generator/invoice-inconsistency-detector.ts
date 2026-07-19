/** R3-09 — Invoice inconsistency detector. */

import { appendIgLog } from "./ig-logging.js";
import type { InvoiceGeneratorConfiguration } from "./configuration.js";
import type { InvoiceRecord, InvoiceInconsistency } from "./types.js";
import type { InvoiceFinancialSnapshot } from "./invoice-data-source.js";

export class InvoiceInconsistencyDetector {
  detect(
    record: InvoiceRecord,
    snapshot: InvoiceFinancialSnapshot,
    config: InvoiceGeneratorConfiguration,
  ): InvoiceInconsistency[] {
    if (!config.inconsistencyDetectionEnabled) return [];

    const inconsistencies: InvoiceInconsistency[] = [];

    if (record.revenueReference) {
      const revenue = snapshot.revenues.find((r) => r.revenueRecordId === record.revenueReference);
      if (!revenue) {
        inconsistencies.push(this.build(record, "high", "Revenue reference not found"));
      } else if (Math.abs(revenue.netRevenue + record.taxAmount - record.invoiceAmount) > 0.02) {
        inconsistencies.push(this.build(record, "medium", "Invoice amount inconsistent with revenue"));
      }
    }

    if (record.expenseReference) {
      const expense = snapshot.expenses.find((e) => e.expenseRecordId === record.expenseReference);
      if (!expense) {
        inconsistencies.push(this.build(record, "high", "Expense reference not found"));
      } else if (Math.abs(expense.expenseAmount + record.taxAmount - record.invoiceAmount) > 0.02) {
        inconsistencies.push(this.build(record, "medium", "Invoice amount inconsistent with expense"));
      }
    }

    if (snapshot.reconciliationRecordCount === 0) {
      inconsistencies.push(this.build(record, "low", "No reconciliation records available"));
    }

    if (inconsistencies.length > 0) {
      appendIgLog({
        event: "invoice_inconsistency",
        level: "warn",
        details: `Detected ${inconsistencies.length} invoice inconsistenc(ies)`,
      });
    }

    return inconsistencies;
  }

  private build(
    record: InvoiceRecord,
    severity: InvoiceInconsistency["severity"],
    description: string,
  ): InvoiceInconsistency {
    return {
      inconsistencyId: `inv-inc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      severity,
      description,
      invoiceId: record.invoiceId,
    };
  }
}
