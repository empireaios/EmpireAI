/** R3-12 — Currency anomaly detector. */

import type { MultiCurrencyEngineConfiguration } from "./configuration.js";
import type { CurrencyAnomaly, CurrencyRecord } from "./types.js";

export class CurrencyAnomalyDetector {
  detect(
    record: CurrencyRecord,
    config: MultiCurrencyEngineConfiguration,
  ): CurrencyAnomaly[] {
    if (!config.anomalyDetectionEnabled) return [];

    const anomalies: CurrencyAnomaly[] = [];

    if (record.exchangeRate > 200 || (record.exchangeRate < 0.001 && record.exchangeRate > 0)) {
      anomalies.push({
        anomalyId: `mc-anom-${Date.now()}-rate`,
        timestamp: new Date().toISOString(),
        severity: "medium",
        description: `Unusual exchange rate: ${record.exchangeRate}`,
        currencyRecordId: record.currencyRecordId,
      });
    }

    if (record.originalAmount > 1_000_000) {
      anomalies.push({
        anomalyId: `mc-anom-${Date.now()}-large`,
        timestamp: new Date().toISOString(),
        severity: "low",
        description: "Large conversion amount detected",
        currencyRecordId: record.currencyRecordId,
      });
    }

    const expected = Math.round(record.originalAmount * record.exchangeRate * 100) / 100;
    if (Math.abs(expected - record.convertedAmount) > 0.02) {
      anomalies.push({
        anomalyId: `mc-anom-${Date.now()}-mismatch`,
        timestamp: new Date().toISOString(),
        severity: "high",
        description: "Converted amount does not match rate calculation",
        currencyRecordId: record.currencyRecordId,
      });
    }

    return anomalies;
  }
}
