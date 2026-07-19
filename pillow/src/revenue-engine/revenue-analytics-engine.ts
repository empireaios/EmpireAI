/** R3-04 — Revenue analytics engine (anomaly detection). */

import { appendReLog } from "./re-logging.js";
import type { RevenueEngineConfiguration } from "./configuration.js";
import type { RevenueRegistry } from "./revenue-registry.js";
import type { RevenueAnomaly, RevenueRecord } from "./types.js";

export class RevenueAnalyticsEngine {
  constructor(private readonly registry: RevenueRegistry) {}

  detectAnomalies(
    records: RevenueRecord[],
    config: RevenueEngineConfiguration,
  ): RevenueAnomaly[] {
    if (!config.anomalyDetectionEnabled) return [];

    const anomalies: RevenueAnomaly[] = [];
    const validated = this.registry.listValidated();
    const avgGross =
      validated.length > 0
        ? validated.reduce((sum, r) => sum + Math.abs(r.grossRevenue), 0) / validated.length
        : 0;

    for (const record of records) {
      if (record.grossRevenue < 0 && record.revenueSource !== "refund") {
        anomalies.push({
          anomalyId: `re-anom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
          severity: "high",
          description: "Negative gross revenue on non-refund source",
          revenueRecordId: record.revenueRecordId,
        });
      }

      if (avgGross > 0 && Math.abs(record.grossRevenue) > avgGross * 5) {
        anomalies.push({
          anomalyId: `re-anom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
          severity: "medium",
          description: "Revenue amount exceeds 5x historical average",
          revenueRecordId: record.revenueRecordId,
        });
      }

      if (record.netRevenue > record.grossRevenue && record.revenueSource !== "refund") {
        anomalies.push({
          anomalyId: `re-anom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
          severity: "low",
          description: "Net revenue exceeds gross revenue",
          revenueRecordId: record.revenueRecordId,
        });
      }
    }

    if (anomalies.length > 0) {
      appendReLog({
        event: "revenue_anomaly",
        level: "warn",
        details: `Detected ${anomalies.length} revenue anomal(ies)`,
      });
    }

    return anomalies;
  }
}
