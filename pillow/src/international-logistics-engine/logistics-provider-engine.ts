/** X4-08 — Logistics Provider Engine. */

import type { InternationalLogisticsEngineConfiguration } from "./configuration.js";
import {
  buildLogisticsRecord,
  computeStructuralLogisticsSignals,
} from "./structural-signals.js";
import type { LogisticsAnalysisInput, LogisticsRecord } from "./types.js";

export class LogisticsProviderEngine {
  monitorProviders(
    input: LogisticsAnalysisInput,
    config: InternationalLogisticsEngineConfiguration,
  ): LogisticsRecord {
    if (!config.logisticsProviderRulesEnabled) {
      throw new Error("Logistics provider rules disabled");
    }
    const signals = computeStructuralLogisticsSignals(
      { ...input, logisticsCategory: "provider" },
      config,
    );
    return buildLogisticsRecord({
      ...signals,
      recommendationSummary: `Monitor logistics provider ${signals.logisticsProvider} on ${signals.originRegion}->${signals.destinationRegion}`,
    });
  }
}
