/** X3-17 — Profit Optimization Engine (erosion / unprofitable growth / optimize). */



import type { ProfitScalingEngineConfiguration } from "./configuration.js";

import type { ProfitScalingRecord, ProfitScalingInput } from "./types.js";

import {

  buildProfitScalingRecord,

  computeProfitScalingSignals,

} from "./structural-signals.js";



export class ProfitOptimizationEngine {

  detectErosion(

    input: ProfitScalingInput,

    config: ProfitScalingEngineConfiguration,

    sourceAvailable = true,

  ): ProfitScalingRecord {

    if (!config.profitErosionDetectionEnabled) {

      throw new Error("Profit erosion detection disabled");

    }

    const signals = computeProfitScalingSignals(

      "profit_erosion_detection",

      input,

      config,

      sourceAvailable,

    );

    const eroded = signals.profitOptimizationScore < config.profitGrowthThreshold;

    const summary = eroded

      ? `Profit erosion detected for ${signals.profitCategory} — optimization ${signals.profitOptimizationScore}% below growth threshold; never prioritize growth over validated profitability`

      : `No hard profit erosion for ${signals.profitCategory} at optimization ${signals.profitOptimizationScore}% — remain within validated profitability`;

    return buildProfitScalingRecord({

      ...signals,

      profitCategory: "erosion",

      recommendationSummary: summary,

    });

  }



  detectUnprofitableGrowth(

    input: ProfitScalingInput,

    config: ProfitScalingEngineConfiguration,

    sourceAvailable = true,

  ): ProfitScalingRecord {

    if (!config.unprofitableGrowthDetectionEnabled) {

      throw new Error("Unprofitable growth detection disabled");

    }

    const signals = computeProfitScalingSignals(

      "unprofitable_growth_detection",

      input,

      config,

      sourceAvailable,

    );

    const unprofitable =

      signals.profitOptimizationScore < config.profitOptimizationThreshold ||

      signals.netMargin < config.netMarginThreshold;

    const summary = unprofitable

      ? `Unprofitable growth detected — optimization ${signals.profitOptimizationScore}% / net margin ${signals.netMargin}% below thresholds; never prioritize growth over validated profitability`

      : `Growth remains within validated profitability bounds at optimization ${signals.profitOptimizationScore}%`;

    return buildProfitScalingRecord({

      ...signals,

      profitCategory: "unprofitable_growth",

      recommendationSummary: summary,

    });

  }



  optimizeDuringScaling(

    input: ProfitScalingInput,

    config: ProfitScalingEngineConfiguration,

    sourceAvailable = true,

  ): ProfitScalingRecord {

    if (!config.profitOptimizationDuringScalingEnabled) {

      throw new Error("Profit optimization during scaling disabled");

    }

    const signals = computeProfitScalingSignals(

      "profit_optimization_during_scaling",

      input,

      config,

      sourceAvailable,

    );

    const summary =

      signals.profitOptimizationScore >= config.profitOptimizationThreshold

        ? `Optimized profit during scaling for ${signals.profitCategory} at optimization ${signals.profitOptimizationScore}% — never prioritize growth over validated profitability`

        : signals.recommendationSummary;

    return buildProfitScalingRecord({

      ...signals,

      recommendationSummary: summary,

    });

  }

}

