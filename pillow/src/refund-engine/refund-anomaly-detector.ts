/** R3-10 — Refund anomaly detector. */

import type { RefundEngineConfiguration } from "./configuration.js";
import type { RefundFinancialSnapshot } from "./refund-data-source.js";
import type { RefundAnomaly, RefundRecord } from "./types.js";

export class RefundAnomalyDetector {
  detect(
    record: RefundRecord,
    snapshot: RefundFinancialSnapshot,
    config: RefundEngineConfiguration,
    priorRefundsTotal: number,
  ): RefundAnomaly[] {
    if (!config.anomalyDetectionEnabled) return [];

    const anomalies: RefundAnomaly[] = [];
    const payment = snapshot.payments.find((p) => p.paymentId === record.paymentReference);

    if (!payment) {
      anomalies.push({
        anomalyId: `rf-anom-${Date.now()}-missing-payment`,
        timestamp: new Date().toISOString(),
        severity: "high",
        description: `Refund references missing payment: ${record.paymentReference}`,
        refundId: record.refundId,
      });
    }

    if (record.invoiceReference) {
      const invoice = snapshot.invoices.find((i) => i.invoiceId === record.invoiceReference);
      if (!invoice) {
        anomalies.push({
          anomalyId: `rf-anom-${Date.now()}-missing-invoice`,
          timestamp: new Date().toISOString(),
          severity: "medium",
          description: `Refund references missing invoice: ${record.invoiceReference}`,
          refundId: record.refundId,
        });
      }
    }

    if (payment && priorRefundsTotal + record.refundAmount > payment.paymentAmount * 1.01) {
      anomalies.push({
        anomalyId: `rf-anom-${Date.now()}-over-refund`,
        timestamp: new Date().toISOString(),
        severity: "high",
        description: "Cumulative refunds exceed payment amount",
        refundId: record.refundId,
      });
    }

    if (record.refundAmount > 10000) {
      anomalies.push({
        anomalyId: `rf-anom-${Date.now()}-large-refund`,
        timestamp: new Date().toISOString(),
        severity: "low",
        description: "Large refund amount detected",
        refundId: record.refundId,
      });
    }

    return anomalies;
  }
}
