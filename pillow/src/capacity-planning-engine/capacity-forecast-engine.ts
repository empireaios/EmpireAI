/** X3-04 — Capacity Forecast Engine. */

import type { CapacityPlanningEngineConfiguration } from "./configuration.js";
import type { CapacityDomain, CapacityPlanningInput, CapacityPlanningRecord } from "./types.js";
import { buildCapacityRecord, computeDomainSignals } from "./structural-signals.js";

export class CapacityForecastEngine {
  forecast(
    input: CapacityPlanningInput,
    config: CapacityPlanningEngineConfiguration,
  ): CapacityPlanningRecord {
    const domain: CapacityDomain = input.domain ?? "operational";
    const signals = computeDomainSignals(domain, input, config);
    const horizonBoost = Math.min(15, Math.round(config.forecastHorizonDays / 10));
    const forecastDemand = Math.min(100, signals.forecastDemand + horizonBoost);
    const capacityUtilization = Math.min(
      100,
      Math.round((forecastDemand / Math.max(1, signals.currentCapacity)) * 100),
    );
    return buildCapacityRecord({
      ...signals,
      domain,
      forecastDemand,
      capacityUtilization,
      bottleneckSummary: `${signals.bottleneckSummary} · ${config.forecastHorizonDays}d horizon`,
      recommendedExpansion: Math.max(
        signals.recommendedExpansion,
        Math.max(0, forecastDemand - signals.currentCapacity),
      ),
      config,
    });
  }
}
