/** X3-14 — Country Assessment Engine (region/country identification). */



import type { GlobalScalingPlannerConfiguration } from "./configuration.js";

import type { GlobalScalingRecord, GlobalScalingInput } from "./types.js";

import { buildGlobalScalingRecord, computeGlobalScalingSignals } from "./structural-signals.js";



export class CountryAssessmentEngine {

  identifyTargetRegions(

    input: GlobalScalingInput,

    config: GlobalScalingPlannerConfiguration,

    sourceAvailable = true,

  ): GlobalScalingRecord {

    if (!config.targetRegionIdentificationEnabled) {

      throw new Error("Target region identification disabled");

    }

    const signals = computeGlobalScalingSignals(

      "target_region_identification",

      input,

      config,

      sourceAvailable,

    );

    const region =

      input.targetRegionHint?.trim() ||

      (signals.regionalOpportunityScore >= config.regionalOpportunityThreshold

        ? "region-priority-a"

        : "region-watchlist");

    return buildGlobalScalingRecord({

      ...signals,

      targetRegion: region,

      recommendationSummary: `Identified target region ${region} · opportunity ${signals.regionalOpportunityScore}% — structural signals only`,

    });

  }



  identifyTargetCountries(

    input: GlobalScalingInput,

    config: GlobalScalingPlannerConfiguration,

    sourceAvailable = true,

  ): GlobalScalingRecord {

    if (!config.targetCountryIdentificationEnabled) {

      throw new Error("Target country identification disabled");

    }

    const signals = computeGlobalScalingSignals(

      "target_country_identification",

      input,

      config,

      sourceAvailable,

    );

    const country =

      input.targetCountryHint?.trim() ||

      (signals.regionalOpportunityScore >= config.regionalOpportunityThreshold

        ? "country-priority-a"

        : "country-watchlist");

    return buildGlobalScalingRecord({

      ...signals,

      targetCountry: country,

      recommendationSummary: `Identified target country ${country} in ${signals.targetRegion} · opportunity ${signals.regionalOpportunityScore}% — structural signals only`,

    });

  }

}


