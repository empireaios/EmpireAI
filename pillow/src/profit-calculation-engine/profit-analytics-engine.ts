/** R3-06 — Profit analytics engine (anomaly detection). */

import { appendPcLog } from "./pc-logging.js";
import type { ProfitCalculationEngineConfiguration } from "./configuration.js";
import type { ProfitRegistry } from "./profit-registry.js";
import type { ProfitAnomaly, ProfitRecord } from "./types.js";

export class ProfitAnalyticsEngine {
  constructor(private readonly registry: ProfitRegistry) {}

  detectAnomalies(
    records: ProfitRecord[],
    config: ProfitCalculationEngineConfiguration,
  ): ProfitAnomaly[] {
    if (!config.anomalyDetectionEnabled) return [];

    const anomalies: ProfitAnomaly[] = [];
    const validated = this.registry.listValidated();
    const avgMargin =
      validated.length > 0
        ? validated.reduce((s, r) => s + r.profitMargin, 0) / validated.length
        : 0;

    for (const record of records) {
      if (record.netProfit < 0 && record.grossProfit > 0) {
        anomalies.push({
          anomalyId: `pc-anom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
          severity: "medium",
          description: "Negative net profit with positive gross profit",
          profitRecordId: record.profitRecordId,
        });
      }

      if (avgMargin > 0 && record.profitMargin < avgMargin * 0.2) {
        anomalies.push({
          anomalyId: `pc-anom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
          severity: "low",
          description: "Profit margin significantly below historical average",
          profitRecordId: record.profitRecordId,
        });
      }

      if (record.profitMargin < -50) {
        anomalies.push({
          anomalyId: `pc-anom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
          severity: "high",
          description: "Severely negative profit margin",
          profitRecordId: record.profitRecordId,
        });
      }
    }

    if (anomalies.length > 0) {
      appendPcLog({
        event: "profit_anomaly",
        level: "warn",
        details: `Detected ${anomalies.length} profit anomal(ies)`,
      });
    }

    return anomalies;
  }
}
