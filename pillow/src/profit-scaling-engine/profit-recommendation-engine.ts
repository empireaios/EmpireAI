/** X3-17 — Profit Recommendation Engine. */



import type { ProfitScalingEngineConfiguration } from "./configuration.js";

import type {

  ProfitScalingRecommendation,

  ProfitScalingRecord,

} from "./types.js";



export class ProfitRecommendationEngine {

  generate(

    records: ProfitScalingRecord[],

    config: ProfitScalingEngineConfiguration,

  ): ProfitScalingRecommendation[] {

    // Never prioritize growth over validated profitability.

    const eligible = records.filter(

      (r) =>

        r.validationStatus === "passed" &&

        r.profitOptimizationScore >= config.profitOptimizationThreshold &&

        r.profitOptimizationScore >= config.highOptimizationThreshold,

    );



    if (eligible.length === 0) {

      return [

        {

          recommendationId: `pse-rec-${Date.now()}-hold`,

          timestamp: new Date().toISOString(),

          companyReference: records[0]?.companyReference ?? "company-default",

          profitCategory: records[0]?.profitCategory ?? "growth",

          recommendationSummary:

            "Hold profit scaling — validated structural optimization does not clear thresholds (never prioritize growth over validated profitability)",

          profitOptimizationScore: records[0]?.profitOptimizationScore ?? 0,

          grossMargin: records[0]?.grossMargin ?? 0,

          netMargin: records[0]?.netMargin ?? 0,

          operatingMargin: records[0]?.operatingMargin ?? 0,

          structuralSignalOnly: true,

          neverPrioritizeGrowthOverValidatedProfitability: true,

        },

      ];

    }



    return eligible.slice(0, 8).map((record, index) => {

      const posture =

        record.profitOptimizationScore >= config.criticalOptimizationThreshold

          ? "scale-with-profit"

          : record.profitOptimizationScore >= config.highOptimizationThreshold

            ? "prepare"

            : "stage";

      const summary = `${posture} ${record.profitCategory} profit scaling — optimization ${record.profitOptimizationScore}% · never prioritize growth over validated profitability`;

      return {

        recommendationId: `pse-rec-${Date.now()}-${index}`,

        timestamp: new Date().toISOString(),

        companyReference: record.companyReference,

        profitCategory: record.profitCategory,

        recommendationSummary: summary,

        profitOptimizationScore: record.profitOptimizationScore,

        grossMargin: record.grossMargin,

        netMargin: record.netMargin,

        operatingMargin: record.operatingMargin,

        structuralSignalOnly: true,

        neverPrioritizeGrowthOverValidatedProfitability: true,

      };

    });

  }

}

