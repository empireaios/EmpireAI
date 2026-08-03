/** X3-17 — Profit Analysis Engine (growth monitoring). */



import type { ProfitScalingEngineConfiguration } from "./configuration.js";

import type { ProfitScalingRecord, ProfitScalingInput } from "./types.js";

import {

  buildProfitScalingRecord,

  computeProfitScalingSignals,

} from "./structural-signals.js";



export class ProfitAnalysisEngine {

  monitorGrowth(

    input: ProfitScalingInput,

    config: ProfitScalingEngineConfiguration,

    sourceAvailable = true,

  ): ProfitScalingRecord {

    if (!config.profitGrowthMonitoringEnabled) {

      throw new Error("Profit growth monitoring disabled");

    }

    const signals = computeProfitScalingSignals(

      "profit_growth_monitoring",

      input,

      config,

      sourceAvailable,

    );

    const summary =

      signals.profitOptimizationScore >= config.profitGrowthThreshold

        ? `Profit growth optimization ${signals.profitOptimizationScore}% clears threshold ${config.profitGrowthThreshold} — never prioritize growth over validated profitability`

        : `Profit growth optimization ${signals.profitOptimizationScore}% below threshold — never prioritize growth over validated profitability`;

    return buildProfitScalingRecord({

      ...signals,

      profitCategory: "growth",

      recommendationSummary: summary,

    });

  }

}

