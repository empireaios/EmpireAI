/** X2-12 — Customer Recommendation Engine. */

import type {
  CustomerIntelligenceRecord,
  CustomerIntelligenceRecommendation,
  CustomerRiskSignal,
} from "./types.js";

export class CustomerRecommendationEngine {
  recommend(input: {
    records: CustomerIntelligenceRecord[];
    risks: CustomerRiskSignal[];
    customerReference?: string;
    companyReference?: string;
  }): CustomerIntelligenceRecommendation[] {
    const recommendations: CustomerIntelligenceRecommendation[] = [];
    const scoped = input.records.filter((r) => {
      if (input.customerReference && r.customerReference !== input.customerReference) {
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
      if (record.recommendedOpportunities.includes("cross_sell_bundle")) {
        recommendations.push({
          recommendationId: `sci-rec-${Date.now()}-xsell-${record.customerIntelligenceId}`,
          timestamp: new Date().toISOString(),
          customerReference: record.customerReference,
          companyReference: record.associatedCompanies[0] ?? null,
          recommendationType: "cross_sell",
          rationale: `Cross-sell opportunity across ${record.associatedCompanies.length} companies`,
          priority: "high",
          structuralSignalOnly: true,
        });
      }
      if (record.lifetimeValueEstimate >= 70) {
        recommendations.push({
          recommendationId: `sci-rec-${Date.now()}-upsell-${record.customerIntelligenceId}`,
          timestamp: new Date().toISOString(),
          customerReference: record.customerReference,
          companyReference: record.associatedCompanies[0] ?? null,
          recommendationType: "upsell",
          rationale: `High LTV estimate (${record.lifetimeValueEstimate}) supports upsell`,
          priority: "medium",
          structuralSignalOnly: true,
        });
      }
      if (!record.crossCompanyRelationship && record.associatedCompanies.length === 1) {
        recommendations.push({
          recommendationId: `sci-rec-${Date.now()}-id-${record.customerIntelligenceId}`,
          timestamp: new Date().toISOString(),
          customerReference: record.customerReference,
          companyReference: record.associatedCompanies[0] ?? null,
          recommendationType: "resolve_identity",
          rationale: "Expand identity resolution to detect cross-company relationships",
          priority: "low",
          structuralSignalOnly: true,
        });
      }
    }

    for (const risk of input.risks) {
      if (input.customerReference && risk.customerReference !== input.customerReference) {
        continue;
      }
      recommendations.push({
        recommendationId: `sci-rec-${Date.now()}-risk-${risk.riskId}`,
        timestamp: new Date().toISOString(),
        customerReference: risk.customerReference,
        companyReference: null,
        recommendationType: risk.riskType === "churn" ? "retain" : "mitigate_risk",
        rationale: risk.rationale,
        priority: risk.severity === "high" ? "high" : "medium",
        structuralSignalOnly: true,
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        recommendationId: `sci-rec-${Date.now()}-review`,
        timestamp: new Date().toISOString(),
        customerReference: input.customerReference ?? null,
        companyReference: input.companyReference ?? null,
        recommendationType: "manual_review",
        rationale: "No automated customer intelligence actions — portfolio posture is balanced",
        priority: "low",
        structuralSignalOnly: true,
      });
    }

    return recommendations;
  }
}
