/** X3-13 — Risk Recommendation Engine. */

import type { ScalingRiskMonitorConfiguration } from "./configuration.js";
import type { RiskMitigationRecommendation, ScalingRiskRecord } from "./types.js";

export class RiskRecommendationEngine {
  generate(
    records: ScalingRiskRecord[],
    config: ScalingRiskMonitorConfiguration,
  ): RiskMitigationRecommendation[] {
    // Never suppress critical scaling risks — always surface critical/high first.
    const eligible = records.filter(
      (r) =>
        r.riskSeverity === "critical" ||
        r.riskSeverity === "high" ||
        r.riskProbability >= config.riskProbabilityThreshold,
    );

    if (eligible.length === 0) {
      return [
        {
          recommendationId: `srm-rec-${Date.now()}-hold`,
          timestamp: new Date().toISOString(),
          companyReference: records[0]?.companyReference ?? "company-default",
          riskCategory: records[0]?.riskCategory ?? "operational",
          recommendationSummary:
            "Hold mitigation actions — validated structural evidence does not clear risk thresholds (never suppress critical scaling risks)",
          riskSeverity: records[0]?.riskSeverity ?? "low",
          riskProbability: records[0]?.riskProbability ?? 0,
          structuralSignalOnly: true,
          neverSuppressCriticalScalingRisks: true,
        },
      ];
    }

    return eligible.slice(0, 8).map((record, index) => {
      const posture =
        record.riskSeverity === "critical"
          ? "contain"
          : record.riskSeverity === "high"
            ? "mitigate"
            : "monitor";
      const summary = `${posture} ${record.riskCategory} risk — severity ${record.riskSeverity}, probability ${record.riskProbability}% · never suppress critical scaling risks`;
      return {
        recommendationId: `srm-rec-${Date.now()}-${index}`,
        timestamp: new Date().toISOString(),
        companyReference: record.companyReference,
        riskCategory: record.riskCategory,
        recommendationSummary: summary,
        riskSeverity: record.riskSeverity,
        riskProbability: record.riskProbability,
        structuralSignalOnly: true,
        neverSuppressCriticalScalingRisks: true,
      };
    });
  }
}
