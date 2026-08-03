/** X3-14 — Global Readiness Engine (expansion / supplier / financial readiness). */



import type { GlobalScalingPlannerConfiguration } from "./configuration.js";

import type { GlobalScalingRecord, GlobalScalingInput } from "./types.js";

import { buildGlobalScalingRecord, computeGlobalScalingSignals } from "./structural-signals.js";



export class GlobalReadinessEngine {

  evaluateInternationalExpansionReadiness(

    input: GlobalScalingInput,

    config: GlobalScalingPlannerConfiguration,

    sourceAvailable = true,

  ): GlobalScalingRecord {

    if (!config.internationalExpansionReadinessEnabled) {

      throw new Error("International expansion readiness evaluation disabled");

    }

    const signals = computeGlobalScalingSignals(

      "international_expansion_readiness",

      input,

      config,

      sourceAvailable,

    );

    const summary =

      signals.expansionReadinessScore >= config.expansionReadinessThreshold

        ? `International expansion readiness ${signals.expansionReadinessScore}% clears threshold ${config.expansionReadinessThreshold} — validated readiness required before recommendation`

        : `International expansion readiness ${signals.expansionReadinessScore}% below threshold — never recommend without validated readiness`;

    return buildGlobalScalingRecord({

      ...signals,

      recommendationSummary: summary,

    });

  }



  evaluateSupplierReadinessByRegion(

    input: GlobalScalingInput,

    config: GlobalScalingPlannerConfiguration,

    sourceAvailable = true,

  ): GlobalScalingRecord {

    if (!config.supplierReadinessByRegionEnabled) {

      throw new Error("Supplier readiness by region evaluation disabled");

    }

    const signals = computeGlobalScalingSignals(

      "supplier_readiness_by_region",

      input,

      config,

      sourceAvailable,

    );

    const summary =

      signals.expansionReadinessScore >= config.supplierReadinessThreshold

        ? `Supplier readiness ${signals.expansionReadinessScore}% above ${config.supplierReadinessThreshold} for ${signals.targetRegion}`

        : signals.recommendationSummary;

    return buildGlobalScalingRecord({

      ...signals,

      recommendationSummary: summary,

    });

  }



  evaluateFinancialReadinessForExpansion(

    input: GlobalScalingInput,

    config: GlobalScalingPlannerConfiguration,

    sourceAvailable = true,

  ): GlobalScalingRecord {

    if (!config.financialReadinessForExpansionEnabled) {

      throw new Error("Financial readiness for expansion evaluation disabled");

    }

    const signals = computeGlobalScalingSignals(

      "financial_readiness_for_expansion",

      input,

      config,

      sourceAvailable,

    );

    const summary =

      signals.expansionReadinessScore >= config.financialReadinessThreshold

        ? `Financial readiness ${signals.expansionReadinessScore}% above ${config.financialReadinessThreshold} for worldwide expansion planning`

        : signals.recommendationSummary;

    return buildGlobalScalingRecord({

      ...signals,

      recommendationSummary: summary,

    });

  }

}


