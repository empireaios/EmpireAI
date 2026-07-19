/** R1-14 — Health alert manager. */

import type { MarketplaceHealthMonitorConfiguration } from "./configuration.js";
import type { HealthAlert, MarketplaceHealthRecord } from "./types.js";

export class AlertManager {
  generateAlerts(
    records: MarketplaceHealthRecord[],
    config: MarketplaceHealthMonitorConfiguration,
  ): HealthAlert[] {
    if (!config.alertThresholdsEnabled) return [];

    const alerts: HealthAlert[] = [];

    for (const record of records) {
      for (const alertMessage of record.activeAlerts) {
        alerts.push({
          alertId: `mhm-alert-${record.marketplaceIdentifier}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          marketplaceIdentifier: record.marketplaceIdentifier,
          severity: record.overallHealthStatus === "failed" ? "critical" : "warn",
          message: alertMessage,
          timestamp: new Date().toISOString(),
        });
      }

      if (record.apiLatencyMs > config.apiLatencyThresholdMs) {
        alerts.push({
          alertId: `mhm-alert-latency-${record.marketplaceIdentifier}-${Date.now()}`,
          marketplaceIdentifier: record.marketplaceIdentifier,
          severity: "warn",
          message: `API latency ${record.apiLatencyMs}ms exceeds threshold ${config.apiLatencyThresholdMs}ms`,
          timestamp: new Date().toISOString(),
        });
      }

      if (record.apiErrorRate > config.apiErrorRateThreshold) {
        alerts.push({
          alertId: `mhm-alert-error-${record.marketplaceIdentifier}-${Date.now()}`,
          marketplaceIdentifier: record.marketplaceIdentifier,
          severity: "critical",
          message: `API error rate ${(record.apiErrorRate * 100).toFixed(1)}% exceeds threshold`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return alerts;
  }
}
