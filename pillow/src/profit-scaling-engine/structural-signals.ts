/** X3-17 — Shared structural profit scaling helpers. */



import { PSE_METADATA_VERSION } from "./paths.js";

import type { ProfitScalingEngineConfiguration } from "./configuration.js";

import type {

  ProfitCategory,

  ProfitOperation,

  ProfitScalingRecord,

  ProfitScalingInput,

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



export function defaultCompany(input?: ProfitScalingInput): string {

  return input?.companyReference?.trim() || "company-default";

}



export function defaultCategory(

  operation: ProfitOperation,

  input?: ProfitScalingInput,

): ProfitCategory {

  if (input?.profitCategoryHint) return input.profitCategoryHint;

  switch (operation) {

    case "gross_margin_monitoring":

      return "gross_margin";

    case "net_margin_monitoring":

      return "net_margin";

    case "operating_margin_monitoring":

      return "operating_margin";

    case "scaling_cost_monitoring":

      return "scaling_cost";

    case "roi_monitoring":

      return "roi";

    case "profit_erosion_detection":

      return "erosion";

    case "unprofitable_growth_detection":

      return "unprofitable_growth";

    case "profit_growth_monitoring":

    case "profit_optimization_during_scaling":

    default:

      return "growth";

  }

}



export function buildProfitScalingRecord(input: {

  companyReference: string;

  profitCategory: ProfitCategory;

  grossMargin: number;

  netMargin: number;

  operatingMargin: number;

  profitOptimizationScore: number;

  recommendationSummary: string;

}): ProfitScalingRecord {

  return {

    profitScalingId: `pse-acc-${Date.now()}-${input.profitCategory.slice(0, 12)}`,

    timestamp: new Date().toISOString(),

    companyReference: input.companyReference,

    profitCategory: input.profitCategory,

    grossMargin: clampScore(input.grossMargin),

    netMargin: clampScore(input.netMargin),

    operatingMargin: clampScore(input.operatingMargin),

    profitOptimizationScore: clampScore(input.profitOptimizationScore),

    recommendationSummary: input.recommendationSummary,

    validationStatus: "passed",

    metadataVersion: PSE_METADATA_VERSION,

    neverPrioritizeGrowthOverValidatedProfitability: true,

    structuralSignalOnly: true,

    sensitiveOperationalData: false,

    sensitiveFinancialData: false,

  };

}



export function computeProfitScalingSignals(

  operation: ProfitOperation,

  input: ProfitScalingInput,

  config: ProfitScalingEngineConfiguration,

  sourceAvailable = true,

): {

  companyReference: string;

  profitCategory: ProfitCategory;

  grossMargin: number;

  netMargin: number;

  operatingMargin: number;

  profitOptimizationScore: number;

  recommendationSummary: string;

} {

  const company = defaultCompany(input);

  const profitCategory = defaultCategory(operation, input);

  const seed = `${company}::${profitCategory}::${operation}`;



  const profitOptimizationScore = clampScore(

    input.profitOptimizationHint ?? hashScore(`${seed}:optimization`, 20, 95),

  );

  const grossMargin = clampScore(

    input.grossMarginHint ?? hashScore(`${seed}:gross`, 25, 90),

  );

  const netMargin = clampScore(

    input.netMarginHint ?? hashScore(`${seed}:net`, 20, 85),

  );

  const operatingMargin = clampScore(

    input.operatingMarginHint ?? hashScore(`${seed}:operating`, 22, 88),

  );



  let recommendationSummary =

    "Profit scaling signals within structural bounds — structural signals only; never prioritize growth over validated profitability";



  const operationThreshold = ((): number => {

    switch (operation) {

      case "profit_growth_monitoring":

        return config.profitGrowthThreshold;

      case "gross_margin_monitoring":

        return config.grossMarginThreshold;

      case "net_margin_monitoring":

        return config.netMarginThreshold;

      case "operating_margin_monitoring":

        return config.operatingMarginThreshold;

      case "scaling_cost_monitoring":

        return config.scalingCostThreshold;

      case "roi_monitoring":

        return config.roiThreshold;

      case "profit_erosion_detection":

      case "unprofitable_growth_detection":

        return config.profitGrowthThreshold;

      case "profit_optimization_during_scaling":

      default:

        return config.profitOptimizationThreshold;

    }

  })();



  if (!sourceAvailable) {

    recommendationSummary = `Partial ${operation} signal — upstream source unavailable; structural signals only; never prioritize growth over validated profitability`;

  } else if (profitOptimizationScore >= operationThreshold) {

    recommendationSummary = `${operation} optimization ${profitOptimizationScore}% supports cautious profit-preserving scale on ${company} · ${profitCategory}`;

  } else {

    recommendationSummary = `Hold profit scaling for ${profitCategory} — optimization ${profitOptimizationScore}% below threshold; never prioritize growth over validated profitability`;

  }



  if (

    config.neverPrioritizeGrowthOverValidatedProfitability &&

    profitOptimizationScore < config.profitOptimizationThreshold

  ) {

    recommendationSummary = `${recommendationSummary} · never prioritize growth over validated profitability`;

  }



  return {

    companyReference: company,

    profitCategory,

    grossMargin,

    netMargin,

    operatingMargin,

    profitOptimizationScore,

    recommendationSummary,

  };

}

