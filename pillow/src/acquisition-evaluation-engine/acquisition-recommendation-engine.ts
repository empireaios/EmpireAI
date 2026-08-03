/** X2-15 — Acquisition Recommendation Engine. */

import type { AcquisitionEvaluationEngineConfiguration } from "./configuration.js";
import type { AcquisitionRecommendation, AcquisitionRecord } from "./types.js";

export class AcquisitionRecommendationEngine {
  recommend(input: {
    records: AcquisitionRecord[];
    config: AcquisitionEvaluationEngineConfiguration;
    candidateBusiness?: string;
  }): AcquisitionRecommendation[] {
    const scoped = input.records.filter((r) =>
      input.candidateBusiness ? r.candidateBusiness === input.candidateBusiness : true,
    );
    return scoped.map((record) => {
      const composite =
        record.strategicFitScore * 0.35 +
        record.financialScore * 0.3 +
        record.operationalMaturityScore * 0.2 +
        (100 - record.riskScore) * 0.15;

      let recommendationType: AcquisitionRecommendation["recommendationType"] = "monitor";
      let priority: AcquisitionRecommendation["priority"] = "medium";
      let rationale = `Composite score ${Math.round(composite)} — monitor opportunity`;

      if (record.validationStatus !== "passed" && record.validationStatus !== "partial") {
        recommendationType = "manual_review";
        priority = "high";
        rationale = "Unvalidated acquisition information — recommendation blocked for diligence";
      } else if (
        composite >= input.config.pursueCompositeThreshold &&
        record.strategicFitScore >= input.config.minimumStrategicFitThreshold &&
        record.financialScore >= input.config.minimumFinancialScoreThreshold &&
        record.riskScore <= input.config.maximumRiskScoreThreshold
      ) {
        recommendationType = "pursue";
        priority = "high";
        rationale = `Pursue ${record.candidateBusiness} — strong strategic/financial fit with acceptable risk`;
      } else if (record.riskScore > input.config.maximumRiskScoreThreshold) {
        recommendationType = "pass";
        priority = "medium";
        rationale = `Pass ${record.candidateBusiness} — risk score exceeds threshold`;
      } else if (composite >= input.config.pursueCompositeThreshold - 15) {
        recommendationType = "diligence";
        priority = "medium";
        rationale = `Diligence recommended for ${record.candidateBusiness}`;
      }

      return {
        recommendationId: `aee-rec-${Date.now()}-${record.acquisitionEvaluationId}`,
        timestamp: new Date().toISOString(),
        candidateBusiness: record.candidateBusiness,
        recommendationType,
        rationale,
        priority,
        validatedInformationOnly: true as const,
        structuralSignalOnly: true as const,
      };
    });
  }

  applyRecommendations(
    records: AcquisitionRecord[],
    recommendations: AcquisitionRecommendation[],
  ): AcquisitionRecord[] {
    const byCandidate = new Map(
      recommendations.map((r) => [r.candidateBusiness, r.recommendationType] as const),
    );
    return records.map((record) => ({
      ...record,
      recommendation: byCandidate.get(record.candidateBusiness) ?? record.recommendation,
    }));
  }
}
