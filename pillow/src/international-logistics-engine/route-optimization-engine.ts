/** X4-08 — Route Optimization Engine. */

import type { InternationalLogisticsEngineConfiguration } from "./configuration.js";
import {
  buildLogisticsRecord,
  computeStructuralLogisticsSignals,
} from "./structural-signals.js";
import type { LogisticsAnalysisInput, LogisticsRecord } from "./types.js";

export class RouteOptimizationEngine {
  optimizeRoutes(
    input: LogisticsAnalysisInput,
    config: InternationalLogisticsEngineConfiguration,
  ): LogisticsRecord {
    if (!config.routeOptimizationRulesEnabled) {
      throw new Error("Route optimization rules disabled");
    }
    const signals = computeStructuralLogisticsSignals(
      { ...input, logisticsCategory: "route_optimization" },
      config,
    );
    return buildLogisticsRecord(
      {
        ...signals,
        routeOptimized: input.validated === true,
        recommendationSummary: `Optimize route ${signals.originRegion}->${signals.destinationRegion} via ${signals.logisticsProvider}`,
      },
      input.validated === true ? "passed" : "failed",
    );
  }
}
