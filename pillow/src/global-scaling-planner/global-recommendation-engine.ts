/** X3-14 — Global Recommendation Engine. */



import type { GlobalScalingPlannerConfiguration } from "./configuration.js";

import type { GlobalExpansionRecommendation, GlobalScalingRecord } from "./types.js";



export class GlobalRecommendationEngine {

  generate(

    records: GlobalScalingRecord[],

    config: GlobalScalingPlannerConfiguration,

  ): GlobalExpansionRecommendation[] {

    // Never recommend international expansion without validated readiness.

    const eligible = records.filter(

      (r) =>

        r.validationStatus === "passed" &&

        r.expansionReadinessScore >= config.expansionReadinessThreshold &&

        (r.expansionPriority === "critical" ||

          r.expansionPriority === "high" ||

          r.regionalOpportunityScore >= config.regionalOpportunityThreshold),

    );



    if (eligible.length === 0) {

      return [

        {

          recommendationId: `gsp-rec-${Date.now()}-hold`,

          timestamp: new Date().toISOString(),

          companyReference: records[0]?.companyReference ?? "company-default",

          targetRegion: records[0]?.targetRegion ?? "region-unspecified",

          targetCountry: records[0]?.targetCountry ?? "country-unspecified",

          recommendationSummary:

            "Hold international expansion — validated structural readiness does not clear thresholds (never recommend international expansion without validated readiness)",

          expansionPriority: records[0]?.expansionPriority ?? "low",

          expansionReadinessScore: records[0]?.expansionReadinessScore ?? 0,

          regionalOpportunityScore: records[0]?.regionalOpportunityScore ?? 0,

          structuralSignalOnly: true,

          neverRecommendWithoutValidatedReadiness: true,

        },

      ];

    }



    return eligible.slice(0, 8).map((record, index) => {

      const posture =

        record.expansionPriority === "critical"

          ? "accelerate"

          : record.expansionPriority === "high"

            ? "prepare"

            : "stage";

      const summary = `${posture} worldwide expansion to ${record.targetRegion}/${record.targetCountry} — readiness ${record.expansionReadinessScore}%, opportunity ${record.regionalOpportunityScore}% · never recommend without validated readiness`;

      return {

        recommendationId: `gsp-rec-${Date.now()}-${index}`,

        timestamp: new Date().toISOString(),

        companyReference: record.companyReference,

        targetRegion: record.targetRegion,

        targetCountry: record.targetCountry,

        recommendationSummary: summary,

        expansionPriority: record.expansionPriority,

        expansionReadinessScore: record.expansionReadinessScore,

        regionalOpportunityScore: record.regionalOpportunityScore,

        structuralSignalOnly: true,

        neverRecommendWithoutValidatedReadiness: true,

      };

    });

  }

}


