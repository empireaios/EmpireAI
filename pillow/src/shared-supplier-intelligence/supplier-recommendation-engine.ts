/** X2-13 — Supplier Recommendation Engine. */

import type { SharedSupplierIntelligenceConfiguration } from "./configuration.js";
import type {
  SupplierIntelligenceRecommendation,
  SupplierIntelligenceRecord,
  SupplierRiskSignal,
} from "./types.js";

export class SupplierRecommendationEngine {
  recommend(input: {
    records: SupplierIntelligenceRecord[];
    risks: SupplierRiskSignal[];
    config: SharedSupplierIntelligenceConfiguration;
    supplierReference?: string;
    companyReference?: string;
  }): SupplierIntelligenceRecommendation[] {
    if (!input.config.recommendationRulesEnabled) {
      return [
        {
          recommendationId: `ssi-rec-${Date.now()}-disabled`,
          timestamp: new Date().toISOString(),
          supplierReference: null,
          companyReference: null,
          recommendationType: "manual_review",
          rationale: "Recommendation rules disabled",
          priority: "low",
          structuralSignalOnly: true,
        },
      ];
    }

    const recommendations: SupplierIntelligenceRecommendation[] = [];
    const scoped = input.records.filter((r) => {
      if (input.supplierReference && r.supplierReference !== input.supplierReference) {
        return false;
      }
      if (
        input.companyReference &&
        !r.associatedCompanies.includes(input.companyReference)
      ) {
        return false;
      }
      return true;
    });

    for (const record of scoped) {
      if (
        record.supplierPerformanceScore >= input.config.optimalPerformanceThreshold &&
        record.reliabilityScore >= input.config.reliabilityThreshold
      ) {
        recommendations.push({
          recommendationId: `ssi-rec-${Date.now()}-prefer-${record.supplierIntelligenceId}`,
          timestamp: new Date().toISOString(),
          supplierReference: record.supplierReference,
          companyReference: record.associatedCompanies[0] ?? null,
          recommendationType: "prefer",
          rationale: `Prefer supplier ${record.supplierReference} — strong performance and reliability`,
          priority: "high",
          structuralSignalOnly: true,
        });
        if (!record.sharedAcrossCompanies) {
          recommendations.push({
            recommendationId: `ssi-rec-${Date.now()}-share-${record.supplierIntelligenceId}`,
            timestamp: new Date().toISOString(),
            supplierReference: record.supplierReference,
            companyReference: record.associatedCompanies[0] ?? null,
            recommendationType: "share",
            rationale: "Share optimal supplier across portfolio companies",
            priority: "medium",
            structuralSignalOnly: true,
          });
        }
      }
      if (record.duplicateDetected) {
        recommendations.push({
          recommendationId: `ssi-rec-${Date.now()}-div-${record.supplierIntelligenceId}`,
          timestamp: new Date().toISOString(),
          supplierReference: record.supplierReference,
          companyReference: record.associatedCompanies[0] ?? null,
          recommendationType: "diversify",
          rationale: "Duplicate supplier identity detected — consolidate or diversify",
          priority: "medium",
          structuralSignalOnly: true,
        });
      }
      if (
        record.costCompetitivenessScore < input.config.costCompetitivenessThreshold - 15
      ) {
        recommendations.push({
          recommendationId: `ssi-rec-${Date.now()}-replace-${record.supplierIntelligenceId}`,
          timestamp: new Date().toISOString(),
          supplierReference: record.supplierReference,
          companyReference: record.associatedCompanies[0] ?? null,
          recommendationType: "replace",
          rationale: "Cost competitiveness weak — evaluate replacement suppliers",
          priority: "medium",
          structuralSignalOnly: true,
        });
      }
    }

    for (const risk of input.risks) {
      if (input.supplierReference && risk.supplierReference !== input.supplierReference) {
        continue;
      }
      recommendations.push({
        recommendationId: `ssi-rec-${Date.now()}-risk-${risk.riskId}`,
        timestamp: new Date().toISOString(),
        supplierReference: risk.supplierReference,
        companyReference: null,
        recommendationType: "mitigate_risk",
        rationale: risk.rationale,
        priority: risk.severity === "high" ? "high" : "medium",
        structuralSignalOnly: true,
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        recommendationId: `ssi-rec-${Date.now()}-review`,
        timestamp: new Date().toISOString(),
        supplierReference: input.supplierReference ?? null,
        companyReference: input.companyReference ?? null,
        recommendationType: "manual_review",
        rationale: "No automated supplier optimization actions — portfolio posture balanced",
        priority: "low",
        structuralSignalOnly: true,
      });
    }

    return recommendations;
  }
}
