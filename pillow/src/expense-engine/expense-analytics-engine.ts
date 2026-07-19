/** R3-05 — Expense analytics engine (anomaly detection). */

import { appendExLog } from "./ex-logging.js";
import type { ExpenseEngineConfiguration } from "./configuration.js";
import type { ExpenseRegistry } from "./expense-registry.js";
import type { ExpenseAnomaly, ExpenseRecord } from "./types.js";

export class ExpenseAnalyticsEngine {
  constructor(private readonly registry: ExpenseRegistry) {}

  detectAnomalies(
    records: ExpenseRecord[],
    config: ExpenseEngineConfiguration,
  ): ExpenseAnomaly[] {
    if (!config.anomalyDetectionEnabled) return [];

    const anomalies: ExpenseAnomaly[] = [];
    const validated = this.registry.listValidated();
    const avgAmount =
      validated.length > 0
        ? validated.reduce((sum, r) => sum + r.expenseAmount, 0) / validated.length
        : 0;

    for (const record of records) {
      if (record.expenseAmount < 0) {
        anomalies.push({
          anomalyId: `ex-anom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
          severity: "high",
          description: "Negative expense amount detected",
          expenseRecordId: record.expenseRecordId,
        });
      }

      if (avgAmount > 0 && record.expenseAmount > avgAmount * 5) {
        anomalies.push({
          anomalyId: `ex-anom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
          severity: "medium",
          description: "Expense amount exceeds 5x historical average",
          expenseRecordId: record.expenseRecordId,
        });
      }
    }

    if (anomalies.length > 0) {
      appendExLog({
        event: "expense_anomaly",
        level: "warn",
        details: `Detected ${anomalies.length} expense anomal(ies)`,
      });
    }

    return anomalies;
  }
}
