/** X3-14 — Regional Evaluation Engine (demand + operational readiness). */



import type { GlobalScalingPlannerConfiguration } from "./configuration.js";

import type { GlobalScalingRecord, GlobalScalingInput } from "./types.js";

import { buildGlobalScalingRecord, computeGlobalScalingSignals } from "./structural-signals.js";



export class RegionalEvaluationEngine {

  evaluateDemand(

    input: GlobalScalingInput,

    config: GlobalScalingPlannerConfiguration,

    sourceAvailable = true,

  ): GlobalScalingRecord {

    if (!config.regionalDemandEvaluationEnabled) {

      throw new Error("Regional demand evaluation disabled");

    }

    const signals = computeGlobalScalingSignals(

      "regional_demand_evaluation",

      input,

      config,

      sourceAvailable,

    );

    const summary =

      signals.regionalOpportunityScore >= config.regionalDemandThreshold

        ? `Regional demand opportunity ${signals.regionalOpportunityScore}% above ${config.regionalDemandThreshold} for ${signals.targetRegion} — structural signals only`

        : signals.recommendationSummary;

    return buildGlobalScalingRecord({

      ...signals,

      recommendationSummary: summary,

    });

  }



  evaluateOperationalReadiness(

    input: GlobalScalingInput,

    config: GlobalScalingPlannerConfiguration,

    sourceAvailable = true,

  ): GlobalScalingRecord {

    if (!config.regionalOperationalReadinessEnabled) {

      throw new Error("Regional operational readiness evaluation disabled");

    }

    const signals = computeGlobalScalingSignals(

      "regional_operational_readiness",

      input,

      config,

      sourceAvailable,

    );

    const summary =

      signals.expansionReadinessScore >= config.regionalOperationalThreshold

        ? `Regional operational readiness ${signals.expansionReadinessScore}% above ${config.regionalOperationalThreshold} for ${signals.targetRegion}`

        : signals.recommendationSummary;

    return buildGlobalScalingRecord({

      ...signals,

      recommendationSummary: summary,

    });

  }

}


