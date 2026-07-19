/** R3-10 — Financial adjustment engine. */

import { appendRfLog } from "./rf-logging.js";
import type { RevenueEngine } from "../revenue-engine/engine.js";
import type { InvoiceGeneratorEngine } from "../invoice-generator/engine.js";
import type { RefundRecord } from "./types.js";

export class FinancialAdjustmentEngine {
  applyRefundAdjustments(input: {
    record: RefundRecord;
    fullRefund: boolean;
    revenueEngine: RevenueEngine | null;
    invoiceGenerator: InvoiceGeneratorEngine | null;
  }): { warnings: string[]; errors: string[] } {
    const warnings: string[] = [];
    const errors: string[] = [];

    if (input.revenueEngine) {
      try {
        const report = input.revenueEngine.recordRevenueRefund({
          paymentReference: input.record.paymentReference,
          refundAmount: input.record.refundAmount,
          currency: input.record.currency,
          businessReference: input.record.orderReference ?? undefined,
        });
        if (report.validation.decision === "fail") {
          errors.push(...report.validation.errors);
        } else {
          appendRfLog({
            event: "financial_adjustment",
            level: "info",
            details: `Revenue refund recorded for payment ${input.record.paymentReference}`,
          });
        }
      } catch (error) {
        errors.push(error instanceof Error ? error.message : "Revenue refund failed");
      }
    } else {
      warnings.push("Revenue Engine unavailable — revenue not updated");
    }

    if (input.fullRefund && input.record.invoiceReference && input.invoiceGenerator) {
      try {
        const report = input.invoiceGenerator.updateInvoiceStatus({
          invoiceId: input.record.invoiceReference,
          invoiceStatus: "cancelled",
        });
        if (report.validation.decision === "fail") {
          warnings.push(...report.validation.errors);
        } else {
          appendRfLog({
            event: "invoice_status_update",
            level: "info",
            details: `Invoice ${input.record.invoiceReference} cancelled after full refund`,
          });
        }
      } catch (error) {
        warnings.push(error instanceof Error ? error.message : "Invoice update failed");
      }
    }

    return { warnings, errors };
  }
}
