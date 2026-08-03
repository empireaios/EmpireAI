/** X3-02 — Product Opportunity Ranking Engine. */

import type { ProductOpportunityRecord } from "./types.js";
import { buildOpportunityRecord } from "./structural-signals.js";

export class ProductOpportunityRankingEngine {
  rank(records: ProductOpportunityRecord[]): ProductOpportunityRecord[] {
    const sorted = [...records].sort(
      (a, b) => b.scalingPotentialScore - a.scalingPotentialScore,
    );
    return sorted.map((record, index) =>
      buildOpportunityRecord(
        {
          companyReference: record.companyReference,
          productReference: record.productReference,
          salesVelocity: record.salesVelocity,
          revenueGrowth: record.revenueGrowth,
          profitGrowth: record.profitGrowth,
          demandScore: record.demandScore,
          trendScore: record.trendScore,
          scalingPotentialScore: record.scalingPotentialScore,
          opportunityClass: record.opportunityClass,
        },
        index + 1,
        `Ranked #${index + 1} by scaling potential (${record.scalingPotentialScore})`,
      ),
    );
  }
}
