/** X2-19 — Valuation Analytics Engine (history + anomaly detection). */

import type { EnterpriseValueEngineConfiguration } from "./configuration.js";
import type {
  AnomalySeverity,
  ValuationAnomaly,
  ValuationHistoryEntry,
  ValuationRecord,
} from "./types.js";
import { ANOMALY_SEVERITIES, EVE_METADATA_VERSION } from "./paths.js";

export class ValuationAnalyticsEngine {
  private readonly historyRing: ValuationHistoryEntry[] = [];
  private readonly maxHistory = 50;

  trackHistory(record: ValuationRecord): ValuationHistoryEntry {
    const entry: ValuationHistoryEntry = {
      historyId: `eve-hist-${Date.now()}-${record.enterpriseValueId}`,
      timestamp: record.timestamp,
      portfolioReference: record.portfolioReference,
      companyReference: record.companyReference,
      enterpriseValuation: record.enterpriseValuation,
      portfolioValuation: record.portfolioValuation,
      companyValuation: record.companyValuation,
      valueGrowthRate: record.valueGrowthRate,
      valuationMethodology: record.valuationMethodology,
      metadataVersion: EVE_METADATA_VERSION,
    };

    this.historyRing.push(entry);
    if (this.historyRing.length > this.maxHistory) {
      this.historyRing.splice(0, this.historyRing.length - this.maxHistory);
    }

    return { ...entry };
  }

  getHistory(input?: {
    portfolioReference?: string;
    companyReference?: string | null;
  }): ValuationHistoryEntry[] {
    return this.historyRing
      .filter((h) => {
        if (input?.portfolioReference && h.portfolioReference !== input.portfolioReference) {
          return false;
        }
        if (input?.companyReference !== undefined && h.companyReference !== input.companyReference) {
          return false;
        }
        return true;
      })
      .map((h) => ({ ...h }));
  }

  private severityFromDeviation(deviationPercent: number): AnomalySeverity {
    if (deviationPercent >= 40) return "high";
    if (deviationPercent >= 20) return "medium";
    return "low";
  }

  detectAnomalies(input: {
    records: ValuationRecord[];
    config: EnterpriseValueEngineConfiguration;
    portfolioReference?: string;
    companyReference?: string | null;
  }): { anomalies: ValuationAnomaly[]; updatedRecords: ValuationRecord[] } {
    const scoped = input.records.filter((r) => {
      if (input.portfolioReference && r.portfolioReference !== input.portfolioReference) {
        return false;
      }
      if (input.companyReference !== undefined && r.companyReference !== input.companyReference) {
        return false;
      }
      return true;
    });

    const history = this.getHistory({
      portfolioReference: input.portfolioReference,
      companyReference: input.companyReference,
    });

    const anomalies: ValuationAnomaly[] = [];
    const updatedRecords: ValuationRecord[] = [];

    for (const record of scoped) {
      const prior = history.filter(
        (h) =>
          h.portfolioReference === record.portfolioReference &&
          h.companyReference === record.companyReference,
      );
      const baseline =
        prior.length > 0
          ? prior.reduce(
              (sum, h) =>
                sum +
                (h.companyReference ? h.companyValuation : h.portfolioValuation || h.enterpriseValuation),
              0,
            ) / prior.length
          : record.companyReference
            ? record.companyValuation
            : record.portfolioValuation;

      const current = record.companyReference
        ? record.companyValuation
        : record.portfolioValuation || record.enterpriseValuation;

      const deviationPercent =
        baseline > 0 ? Math.abs(Math.round(((current - baseline) / baseline) * 1000) / 10) : 0;

      const anomalyDetected = deviationPercent >= input.config.anomalyDeviationThreshold;

      if (anomalyDetected) {
        anomalies.push({
          anomalyId: `eve-anom-${Date.now()}-${record.enterpriseValueId}`,
          timestamp: new Date().toISOString(),
          portfolioReference: record.portfolioReference,
          companyReference: record.companyReference,
          severity: this.severityFromDeviation(deviationPercent),
          deviationPercent,
          description: `Structural valuation deviation ${deviationPercent}% detected — estimated value, not guaranteed market price`,
          notGuaranteedMarketPrice: true,
          structuralSignalOnly: true,
        });
      }

      updatedRecords.push({ ...record, anomalyDetected });
    }

    return { anomalies, updatedRecords };
  }

  resetForTesting(): void {
    this.historyRing.length = 0;
  }

  allSeverities(): typeof ANOMALY_SEVERITIES {
    return ANOMALY_SEVERITIES;
  }
}
