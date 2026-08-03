/** X3-17 — Cost Efficiency Engine (scaling cost / ROI). */



import type { ProfitScalingEngineConfiguration } from "./configuration.js";

import type { ProfitScalingRecord, ProfitScalingInput } from "./types.js";

import {

  buildProfitScalingRecord,

  computeProfitScalingSignals,

} from "./structural-signals.js";



export class CostEfficiencyEngine {

  monitorScalingCosts(

    input: ProfitScalingInput,

    config: ProfitScalingEngineConfiguration,

    sourceAvailable = true,

  ): ProfitScalingRecord {

    if (!config.scalingCostMonitoringEnabled) {

      throw new Error("Scaling cost monitoring disabled");

    }

    const signals = computeProfitScalingSignals(

      "scaling_cost_monitoring",

      input,

      config,

      sourceAvailable,

    );

    const summary =

      signals.profitOptimizationScore >= config.scalingCostThreshold

        ? `Scaling cost efficiency ${signals.profitOptimizationScore}% above ${config.scalingCostThreshold} — structural signals only`

        : signals.recommendationSummary;

    return buildProfitScalingRecord({

      ...signals,

      profitCategory: "scaling_cost",

      recommendationSummary: summary,

    });

  }



  monitorReturnOnInvestment(

    input: ProfitScalingInput,

    config: ProfitScalingEngineConfiguration,

    sourceAvailable = true,

  ): ProfitScalingRecord {

    if (!config.roiMonitoringEnabled) {

      throw new Error("ROI monitoring disabled");

    }

    const signals = computeProfitScalingSignals(

      "roi_monitoring",

      input,

      config,

      sourceAvailable,

    );

    const summary =

      signals.profitOptimizationScore >= config.roiThreshold

        ? `ROI structural score ${signals.profitOptimizationScore}% above ${config.roiThreshold} — never prioritize growth over validated profitability`

        : signals.recommendationSummary;

    return buildProfitScalingRecord({

      ...signals,

      profitCategory: "roi",

      recommendationSummary: summary,

    });

  }

}

