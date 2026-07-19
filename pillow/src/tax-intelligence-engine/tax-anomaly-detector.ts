/** R3-11 — Tax anomaly detector. */

import type { TaxIntelligenceEngineConfiguration } from "./configuration.js";
import type { TaxFinancialSnapshot } from "./tax-data-source.js";
import type { TaxAnomaly, TaxRecord } from "./types.js";

export class TaxAnomalyDetector {
  detect(
    record: TaxRecord,
    snapshot: TaxFinancialSnapshot,
    config: TaxIntelligenceEngineConfiguration,
  ): TaxAnomaly[] {
    if (!config.anomalyDetectionEnabled) return [];

    const anomalies: TaxAnomaly[] = [];

    if (record.revenueReference) {
      const revenue = snapshot.revenues.find((r) => r.revenueRecordId === record.revenueReference);
      if (!revenue) {
        anomalies.push({
          anomalyId: `tx-anom-${Date.now()}-missing-revenue`,
          timestamp: new Date().toISOString(),
          severity: "high",
          description: `Tax record references missing revenue: ${record.revenueReference}`,
          taxRecordId: record.taxRecordId,
        });
      }
    }

    if (record.refundReference) {
      const refund = snapshot.refunds.find((r) => r.refundId === record.refundReference);
      if (!refund) {
        anomalies.push({
          anomalyId: `tx-anom-${Date.now()}-missing-refund`,
          timestamp: new Date().toISOString(),
          severity: "medium",
          description: `Tax record references missing refund: ${record.refundReference}`,
          taxRecordId: record.taxRecordId,
        });
      }
    }

    if (Math.abs(record.taxRate) > 0.5) {
      anomalies.push({
        anomalyId: `tx-anom-${Date.now()}-high-rate`,
        timestamp: new Date().toISOString(),
        severity: "low",
        description: `Unusually high tax rate: ${record.taxRate}`,
        taxRecordId: record.taxRecordId,
      });
    }

    if (Math.abs(record.taxAmount) > 50000) {
      anomalies.push({
        anomalyId: `tx-anom-${Date.now()}-large-amount`,
        timestamp: new Date().toISOString(),
        severity: "low",
        description: "Large tax amount detected",
        taxRecordId: record.taxRecordId,
      });
    }

    return anomalies;
  }
}
