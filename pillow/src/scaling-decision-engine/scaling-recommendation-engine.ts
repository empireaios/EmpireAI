/** X3-03 — Scaling Recommendation Engine. */

import type { ScalingDecisionRecord, ScalingRecommendation } from "./types.js";

export class ScalingRecommendationEngine {
  generate(records: ScalingDecisionRecord[]): ScalingRecommendation[] {
    const source =
      records.length > 0
        ? records
        : [
            {
              scalingDecisionId: "sde-dec-seed",
              timestamp: new Date().toISOString(),
              companyReference: "company-default",
              productReference: "product-default",
              readinessScore: 50,
              riskScore: 40,
              scalingConfidence: 50,
              decision: "hold" as const,
              recommendationSummary: "Collect additional readiness and risk signals",
              validationStatus: "partial" as const,
              metadataVersion: "SDE-001-v1",
              opportunityRanking: 1,
              productReadiness: 50,
              operationalReadiness: 50,
              financialReadiness: 50,
              supplierReadiness: 50,
              marketReadiness: 50,
              neverApproveWithoutValidation: true as const,
              structuralSignalOnly: true as const,
              sensitiveOperationalData: false as const,
            },
          ];

    return source.slice(0, 5).map((record, index) => {
      let summary = record.recommendationSummary;
      if (record.decision === "scale") {
        summary = `Prioritize capacity expansion for ${record.productReference} (confidence ${record.scalingConfidence})`;
      } else if (record.decision === "reject") {
        summary = `Do not scale ${record.productReference} until readiness rises or risk falls`;
      } else {
        summary = `Hold scaling for ${record.productReference}; reassess after readiness improvements`;
      }
      return {
        recommendationId: `sde-rec-${Date.now()}-${index}`,
        timestamp: new Date().toISOString(),
        companyReference: record.companyReference,
        productReference: record.productReference,
        recommendationSummary: summary,
        decision: record.decision,
        scalingConfidence: record.scalingConfidence,
        structuralSignalOnly: true,
        neverApproveWithoutValidation: true,
      };
    });
  }
}
