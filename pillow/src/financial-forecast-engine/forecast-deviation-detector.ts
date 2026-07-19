/** R3-13 — Forecast deviation and risk detector. */

import type { FinancialForecastEngineConfiguration } from "./configuration.js";
import type { ForecastFinancialSnapshot } from "./forecast-data-source.js";
import type { FinancialRisk, ForecastDeviation, ForecastRecord } from "./types.js";

export class ForecastDeviationDetector {
  detectDeviations(
    record: ForecastRecord,
    prior: ForecastRecord | null,
    config: FinancialForecastEngineConfiguration,
  ): ForecastDeviation[] {
    if (!config.anomalyDetectionEnabled) return [];

    const deviations: ForecastDeviation[] = [];
    if (!prior) return deviations;

    const revenueDelta = Math.abs(record.revenueForecast - prior.revenueForecast);
    const revenuePct = prior.revenueForecast > 0 ? revenueDelta / prior.revenueForecast : 0;

    if (revenuePct > 0.5) {
      deviations.push({
        deviationId: `fct-dev-${Date.now()}-revenue`,
        timestamp: new Date().toISOString(),
        severity: "high",
        description: `Revenue forecast deviates ${Math.round(revenuePct * 100)}% from prior period`,
        forecastRecordId: record.forecastRecordId,
      });
    } else if (revenuePct > 0.2) {
      deviations.push({
        deviationId: `fct-dev-${Date.now()}-revenue-mid`,
        timestamp: new Date().toISOString(),
        severity: "medium",
        description: `Revenue forecast deviates ${Math.round(revenuePct * 100)}% from prior period`,
        forecastRecordId: record.forecastRecordId,
      });
    }

    if (record.profitForecast < 0 && prior.profitForecast >= 0) {
      deviations.push({
        deviationId: `fct-dev-${Date.now()}-profit`,
        timestamp: new Date().toISOString(),
        severity: "high",
        description: "Profit forecast turned negative vs prior positive forecast",
        forecastRecordId: record.forecastRecordId,
      });
    }

    return deviations;
  }

  detectRisks(
    record: ForecastRecord,
    snapshot: ForecastFinancialSnapshot,
    config: FinancialForecastEngineConfiguration,
  ): FinancialRisk[] {
    if (!config.anomalyDetectionEnabled) return [];

    const risks: FinancialRisk[] = [];

    if (record.liquidityForecast < 0) {
      risks.push({
        riskId: `fct-risk-${Date.now()}-liquidity`,
        timestamp: new Date().toISOString(),
        severity: "high",
        description: "Projected liquidity below zero",
        forecastRecordId: record.forecastRecordId,
      });
    }

    if (record.profitForecast < 0) {
      risks.push({
        riskId: `fct-risk-${Date.now()}-profit`,
        timestamp: new Date().toISOString(),
        severity: "medium",
        description: "Negative profit forecast indicates financial risk",
        forecastRecordId: record.forecastRecordId,
      });
    }

    if (record.forecastConfidenceScore < config.confidenceThreshold) {
      risks.push({
        riskId: `fct-risk-${Date.now()}-confidence`,
        timestamp: new Date().toISOString(),
        severity: "low",
        description: `Low forecast confidence: ${record.forecastConfidenceScore}`,
        forecastRecordId: record.forecastRecordId,
      });
    }

    if (snapshot.revenues.length === 0) {
      risks.push({
        riskId: `fct-risk-${Date.now()}-data`,
        timestamp: new Date().toISOString(),
        severity: "medium",
        description: "Missing revenue history increases forecast uncertainty",
        forecastRecordId: record.forecastRecordId,
      });
    }

    return risks;
  }
}
