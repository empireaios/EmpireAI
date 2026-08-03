/** X3-02 — Product Recommendation Engine. */

import type { ProductOpportunityRecord, ProductRecommendation } from "./types.js";

export class ProductRecommendationEngine {
  generate(records: ProductOpportunityRecord[]): ProductRecommendation[] {
    const source =
      records.length > 0
        ? records
        : [
            {
              productOpportunityId: "wpd-opp-seed",
              timestamp: new Date().toISOString(),
              companyReference: "company-default",
              productReference: "product-default",
              salesVelocity: 50,
              revenueGrowth: 10,
              profitGrowth: 8,
              demandScore: 50,
              trendScore: 50,
              scalingPotentialScore: 50,
              opportunityRanking: 1,
              recommendationSummary: "Collect additional product signals",
              validationStatus: "partial" as const,
              metadataVersion: "WPD-001-v1",
              opportunityClass: "stable" as const,
              neverManipulateProductPerformanceData: true as const,
              structuralSignalOnly: true as const,
              sensitiveOperationalData: false as const,
            },
          ];

    return source.slice(0, 5).map((record, index) => {
      let summary = record.recommendationSummary;
      if (record.opportunityClass === "breakout") {
        summary = `Prioritize scaling capacity for breakout product ${record.productReference}`;
      } else if (record.opportunityClass === "declining") {
        summary = `Review declining product ${record.productReference} before further scale investment`;
      } else if (record.opportunityClass === "emerging") {
        summary = `Watch emerging product ${record.productReference} for breakout confirmation`;
      }
      return {
        recommendationId: `wpd-rec-${Date.now()}-${index}`,
        timestamp: new Date().toISOString(),
        companyReference: record.companyReference,
        productReference: record.productReference,
        recommendationSummary: summary,
        scalingPotentialScore: record.scalingPotentialScore,
        opportunityClass: record.opportunityClass,
        structuralSignalOnly: true,
        neverManipulateProductPerformanceData: true,
      };
    });
  }
}
