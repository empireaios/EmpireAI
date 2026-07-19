/** R3-07 — Cash flow analysis engine (anomalies, negative cash flow). */

import { appendCfLog } from "./cf-logging.js";
import type { CashFlowMonitorConfiguration } from "./configuration.js";
import type { CashFlowRegistry } from "./cash-flow-registry.js";
import type { CashFlowAnomaly, CashFlowRecord } from "./types.js";

export class CashFlowAnalysisEngine {
  constructor(private readonly registry: CashFlowRegistry) {}

  detectAnomalies(
    records: CashFlowRecord[],
    config: CashFlowMonitorConfiguration,
  ): CashFlowAnomaly[] {
    if (!config.anomalyDetectionEnabled) return [];

    const anomalies: CashFlowAnomaly[] = [];
    const validated = this.registry.listValidated();
    const avgNet =
      validated.length > 0
        ? validated.reduce((s, r) => s + r.netCashFlow, 0) / validated.length
        : 0;

    for (const record of records) {
      if (record.netCashFlow < 0) {
        anomalies.push({
          anomalyId: `cf-anom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
          severity: "high",
          description: "Negative net cash flow detected",
          cashFlowRecordId: record.cashFlowRecordId,
        });
      }

      if (record.liquidityStatus === "critical") {
        anomalies.push({
          anomalyId: `cf-anom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
          severity: "high",
          description: "Critical liquidity status",
          cashFlowRecordId: record.cashFlowRecordId,
        });
      }

      if (avgNet > 0 && record.netCashFlow < avgNet * 0.25) {
        anomalies.push({
          anomalyId: `cf-anom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
          severity: "medium",
          description: "Net cash flow significantly below historical average",
          cashFlowRecordId: record.cashFlowRecordId,
        });
      }
    }

    if (anomalies.length > 0) {
      appendCfLog({
        event: "cash_flow_anomaly",
        level: "warn",
        details: `Detected ${anomalies.length} cash flow anomal(ies)`,
      });
    }

    return anomalies;
  }
}
