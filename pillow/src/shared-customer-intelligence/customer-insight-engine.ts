/** X2-12 — Customer Insight Engine (LTV, preferences, cross-sell, risks). */

import type { SharedCustomerIntelligenceConfiguration } from "./configuration.js";
import type { CustomerKnowledgeEngine } from "./customer-knowledge-engine.js";
import type {
  CustomerIntelligenceRecord,
  CustomerRiskSignal,
  RiskLevel,
} from "./types.js";

export class CustomerInsightEngine {
  constructor(private readonly knowledge: CustomerKnowledgeEngine) {}

  generateInsights(
    records: CustomerIntelligenceRecord[],
    config: SharedCustomerIntelligenceConfiguration,
  ): CustomerIntelligenceRecord[] {
    if (!config.insightGenerationRulesEnabled) return records;
    return records.map((record) => {
      const ltv = record.lifetimeValueEstimate;
      const prefs =
        record.preferenceSignals.length > 0
          ? record.preferenceSignals
          : ["quality", "reliability"];
      const opportunities = [...record.recommendedOpportunities];
      if (ltv >= config.highValueLtvThreshold && !opportunities.includes("loyalty_upsell")) {
        opportunities.push("loyalty_upsell");
      }
      if (
        record.crossCompanyRelationship &&
        ltv >= config.crossSellAffinityThreshold &&
        !opportunities.includes("cross_company_offer")
      ) {
        opportunities.push("cross_company_offer");
      }
      return this.knowledge.upsert({
        customerReference: record.customerReference,
        associatedCompanies: record.associatedCompanies,
        customerProfileSummary: record.customerProfileSummary,
        behaviourSummary: record.behaviourSummary,
        lifetimeValueEstimate: ltv,
        recommendedOpportunities: opportunities,
        preferenceSignals: prefs,
        riskLevel: record.riskLevel,
        crossCompanyRelationship: record.crossCompanyRelationship,
      });
    });
  }

  detectCrossSell(
    records: CustomerIntelligenceRecord[],
    config: SharedCustomerIntelligenceConfiguration,
  ): CustomerIntelligenceRecord[] {
    const matched: CustomerIntelligenceRecord[] = [];
    for (const record of records) {
      if (
        record.crossCompanyRelationship &&
        record.lifetimeValueEstimate >= config.crossSellAffinityThreshold
      ) {
        const opportunities = [
          ...new Set([...record.recommendedOpportunities, "cross_sell_bundle"]),
        ];
        matched.push(
          this.knowledge.upsert({
            customerReference: record.customerReference,
            associatedCompanies: record.associatedCompanies,
            customerProfileSummary: record.customerProfileSummary,
            behaviourSummary: record.behaviourSummary,
            lifetimeValueEstimate: record.lifetimeValueEstimate,
            recommendedOpportunities: opportunities,
            preferenceSignals: record.preferenceSignals,
            riskLevel: record.riskLevel,
            crossCompanyRelationship: true,
          }),
        );
      }
    }
    return matched;
  }

  detectRisks(
    records: CustomerIntelligenceRecord[],
    config: SharedCustomerIntelligenceConfiguration,
  ): CustomerRiskSignal[] {
    const signals: CustomerRiskSignal[] = [];
    for (const record of records) {
      if (record.lifetimeValueEstimate < 100 - config.riskScoreThreshold) {
        const severity: RiskLevel =
          record.lifetimeValueEstimate < 25 ? "high" : "medium";
        signals.push({
          riskId: `sci-risk-${Date.now()}-${record.customerIntelligenceId}`,
          timestamp: new Date().toISOString(),
          customerReference: record.customerReference,
          riskType: "churn",
          severity,
          rationale: `Low lifetime value estimate (${record.lifetimeValueEstimate}) indicates churn risk`,
          structuralSignalOnly: true,
        });
        this.knowledge.upsert({
          customerReference: record.customerReference,
          associatedCompanies: record.associatedCompanies,
          customerProfileSummary: record.customerProfileSummary,
          behaviourSummary: record.behaviourSummary,
          lifetimeValueEstimate: record.lifetimeValueEstimate,
          recommendedOpportunities: record.recommendedOpportunities,
          preferenceSignals: record.preferenceSignals,
          riskLevel: severity,
          crossCompanyRelationship: record.crossCompanyRelationship,
        });
      }
      if (record.associatedCompanies.length >= 3) {
        signals.push({
          riskId: `sci-risk-${Date.now()}-conc-${record.customerIntelligenceId}`,
          timestamp: new Date().toISOString(),
          customerReference: record.customerReference,
          riskType: "concentration",
          severity: "low",
          rationale: "Customer present across many portfolio companies — monitor concentration",
          structuralSignalOnly: true,
        });
      }
    }
    return signals;
  }
}
