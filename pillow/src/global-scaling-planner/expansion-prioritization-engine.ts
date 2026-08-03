/** X3-14 — Expansion Prioritization Engine. */



import type { GlobalScalingPlannerConfiguration } from "./configuration.js";

import type { GlobalScalingRecord } from "./types.js";



const PRIORITY_RANK: Record<GlobalScalingRecord["expansionPriority"], number> = {

  critical: 4,

  high: 3,

  medium: 2,

  low: 1,

};



export class ExpansionPrioritizationEngine {

  rank(

    records: GlobalScalingRecord[],

    config: GlobalScalingPlannerConfiguration,

  ): GlobalScalingRecord[] {

    if (!config.opportunityRankingEnabled) {

      throw new Error("Opportunity ranking disabled");

    }

    // Rank by priority then readiness — never recommend without validated readiness.

    return [...records].sort((a, b) => {

      const priorityDelta =

        PRIORITY_RANK[b.expansionPriority] - PRIORITY_RANK[a.expansionPriority];

      if (priorityDelta !== 0) return priorityDelta;

      const readinessDelta = b.expansionReadinessScore - a.expansionReadinessScore;

      if (readinessDelta !== 0) return readinessDelta;

      return b.regionalOpportunityScore - a.regionalOpportunityScore;

    });

  }

}


