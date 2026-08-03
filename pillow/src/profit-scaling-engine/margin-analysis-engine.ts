/** X3-17 — Margin Analysis Engine (gross / net / operating). */



import type { ProfitScalingEngineConfiguration } from "./configuration.js";

import type { ProfitScalingRecord, ProfitScalingInput } from "./types.js";

import {

  buildProfitScalingRecord,

  computeProfitScalingSignals,

} from "./structural-signals.js";



export class MarginAnalysisEngine {

  monitorGrossMargin(

    input: ProfitScalingInput,

    config: ProfitScalingEngineConfiguration,

    sourceAvailable = true,

  ): ProfitScalingRecord {

    if (!config.grossMarginMonitoringEnabled) {

      throw new Error("Gross margin monitoring disabled");

    }

    const signals = computeProfitScalingSignals(

      "gross_margin_monitoring",

      input,

      config,

      sourceAvailable,

    );

    const summary =

      signals.grossMargin >= config.grossMarginThreshold

        ? `Gross margin structural score ${signals.grossMargin}% above ${config.grossMarginThreshold}`

        : signals.recommendationSummary;

    return buildProfitScalingRecord({

      ...signals,

      profitCategory: "gross_margin",

      recommendationSummary: summary,

    });

  }



  monitorNetMargin(

    input: ProfitScalingInput,

    config: ProfitScalingEngineConfiguration,

    sourceAvailable = true,

  ): ProfitScalingRecord {

    if (!config.netMarginMonitoringEnabled) {

      throw new Error("Net margin monitoring disabled");

    }

    const signals = computeProfitScalingSignals(

      "net_margin_monitoring",

      input,

      config,

      sourceAvailable,

    );

    const summary =

      signals.netMargin >= config.netMarginThreshold

        ? `Net margin structural score ${signals.netMargin}% above ${config.netMarginThreshold}`

        : signals.recommendationSummary;

    return buildProfitScalingRecord({

      ...signals,

      profitCategory: "net_margin",

      recommendationSummary: summary,

    });

  }



  monitorOperatingMargin(

    input: ProfitScalingInput,

    config: ProfitScalingEngineConfiguration,

    sourceAvailable = true,

  ): ProfitScalingRecord {

    if (!config.operatingMarginMonitoringEnabled) {

      throw new Error("Operating margin monitoring disabled");

    }

    const signals = computeProfitScalingSignals(

      "operating_margin_monitoring",

      input,

      config,

      sourceAvailable,

    );

    const summary =

      signals.operatingMargin >= config.operatingMarginThreshold

        ? `Operating margin structural score ${signals.operatingMargin}% above ${config.operatingMarginThreshold}`

        : signals.recommendationSummary;

    return buildProfitScalingRecord({

      ...signals,

      profitCategory: "operating_margin",

      recommendationSummary: summary,

    });

  }

}

