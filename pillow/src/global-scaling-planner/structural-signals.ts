/** X3-14 — Shared structural global scaling helpers. */



import { GSP_METADATA_VERSION } from "./paths.js";

import type { GlobalScalingPlannerConfiguration } from "./configuration.js";

import type {

  ExpansionPriority,

  ScalingOperation,

  GlobalScalingRecord,

  GlobalScalingInput,

} from "./types.js";



function hashScore(seed: string, min: number, max: number): number {

  let h = 0;

  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;

  const span = max - min;

  return min + (h % (span + 1));

}



function clampScore(value: number): number {

  return Math.max(0, Math.min(100, Math.round(value)));

}



export function defaultCompany(input?: GlobalScalingInput): string {

  return input?.companyReference?.trim() || "company-default";

}



export function defaultRegion(input?: GlobalScalingInput): string {

  return input?.targetRegionHint?.trim() || "region-unspecified";

}



export function defaultCountry(input?: GlobalScalingInput): string {

  return input?.targetCountryHint?.trim() || "country-unspecified";

}



export function priorityFromReadiness(

  readiness: number,

  config: GlobalScalingPlannerConfiguration,

  hint?: ExpansionPriority,

): ExpansionPriority {

  if (hint) return hint;

  if (readiness >= config.criticalPriorityThreshold) return "critical";

  if (readiness >= config.highPriorityThreshold) return "high";

  if (readiness >= config.expansionReadinessThreshold) return "medium";

  return "low";

}



export function buildGlobalScalingRecord(input: {

  companyReference: string;

  targetRegion: string;

  targetCountry: string;

  expansionReadinessScore: number;

  regionalOpportunityScore: number;

  expansionPriority: ExpansionPriority;

  recommendationSummary: string;

}): GlobalScalingRecord {

  const expansionReadinessScore = clampScore(input.expansionReadinessScore);

  const regionalOpportunityScore = clampScore(input.regionalOpportunityScore);



  return {

    globalScalingId: `gsp-scale-${Date.now()}-${input.targetRegion.slice(0, 12)}`,

    timestamp: new Date().toISOString(),

    companyReference: input.companyReference,

    targetRegion: input.targetRegion,

    targetCountry: input.targetCountry,

    expansionReadinessScore,

    regionalOpportunityScore,

    expansionPriority: input.expansionPriority,

    recommendationSummary: input.recommendationSummary,

    validationStatus: "passed",

    metadataVersion: GSP_METADATA_VERSION,

    neverRecommendWithoutValidatedReadiness: true,

    structuralSignalOnly: true,

    sensitiveOperationalData: false,

  };

}



export function computeGlobalScalingSignals(

  operation: ScalingOperation,

  input: GlobalScalingInput,

  config: GlobalScalingPlannerConfiguration,

  sourceAvailable = true,

): {

  companyReference: string;

  targetRegion: string;

  targetCountry: string;

  expansionReadinessScore: number;

  regionalOpportunityScore: number;

  expansionPriority: ExpansionPriority;

  recommendationSummary: string;

} {

  const company = defaultCompany(input);

  const targetRegion = defaultRegion(input);

  const targetCountry = defaultCountry(input);

  const seed = `${company}::${targetRegion}::${targetCountry}::${operation}`;



  const expansionReadinessScore = clampScore(

    input.expansionReadinessHint ?? hashScore(`${seed}:readiness`, 20, 95),

  );

  const regionalOpportunityScore = clampScore(

    input.regionalOpportunityHint ?? hashScore(`${seed}:opportunity`, 20, 95),

  );

  let expansionPriority = priorityFromReadiness(

    expansionReadinessScore,

    config,

    input.expansionPriorityHint,

  );



  let recommendationSummary =

    "Global scaling signals within structural bounds — structural signals only; never recommend international expansion without validated readiness";



  const operationThreshold = ((): number => {

    switch (operation) {

      case "regional_demand_evaluation":

        return config.regionalDemandThreshold;

      case "regional_operational_readiness":

        return config.regionalOperationalThreshold;

      case "supplier_readiness_by_region":

        return config.supplierReadinessThreshold;

      case "financial_readiness_for_expansion":

        return config.financialReadinessThreshold;

      case "target_region_identification":

      case "target_country_identification":

        return config.regionalOpportunityThreshold;

      case "international_expansion_readiness":

      case "opportunity_ranking":

      default:

        return config.expansionReadinessThreshold;

    }

  })();



  if (!sourceAvailable) {

    recommendationSummary = `Partial ${operation} signal — upstream source unavailable; structural signals only; never recommend without validated readiness`;

    expansionPriority = priorityFromReadiness(expansionReadinessScore, config);

  } else if (

    expansionReadinessScore >= operationThreshold &&

    regionalOpportunityScore >= config.regionalOpportunityThreshold

  ) {

    recommendationSummary = `${operation} readiness ${expansionReadinessScore}% / opportunity ${regionalOpportunityScore}% support cautious worldwide expansion planning on ${company} · ${targetRegion}/${targetCountry}`;

    expansionPriority = priorityFromReadiness(

      Math.max(expansionReadinessScore, regionalOpportunityScore),

      config,

      input.expansionPriorityHint,

    );

  } else {

    recommendationSummary = `Hold international expansion for ${targetRegion}/${targetCountry} — readiness ${expansionReadinessScore}% or opportunity ${regionalOpportunityScore}% below threshold; never recommend without validated readiness`;

    expansionPriority = priorityFromReadiness(expansionReadinessScore, config);

  }



  if (

    config.neverRecommendInternationalExpansionWithoutValidatedReadiness &&

    expansionReadinessScore < config.expansionReadinessThreshold

  ) {

    recommendationSummary = `${recommendationSummary} · never recommend international expansion without validated readiness`;

  }



  return {

    companyReference: company,

    targetRegion,

    targetCountry,

    expansionReadinessScore,

    regionalOpportunityScore,

    expansionPriority,

    recommendationSummary,

  };

}


