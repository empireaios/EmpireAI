/** X4-08 — Global Shipping Engine. */

import type { InternationalLogisticsEngineConfiguration } from "./configuration.js";
import {
  buildLogisticsRecord,
  computeStructuralLogisticsSignals,
} from "./structural-signals.js";
import type { LogisticsAnalysisInput, LogisticsRecord } from "./types.js";

export class GlobalShippingEngine {
  manageShippingNetworks(
    input: LogisticsAnalysisInput,
    config: InternationalLogisticsEngineConfiguration,
  ): LogisticsRecord {
    const signals = computeStructuralLogisticsSignals(
      { ...input, logisticsCategory: "shipping_network" },
      config,
    );
    return buildLogisticsRecord({
      ...signals,
      recommendationSummary: `Manage shipping network ${signals.originRegion}->${signals.destinationRegion}`,
    });
  }

  monitorShippingPerformance(
    input: LogisticsAnalysisInput,
    config: InternationalLogisticsEngineConfiguration,
  ): LogisticsRecord {
    const signals = computeStructuralLogisticsSignals(
      { ...input, logisticsCategory: "shipping_performance" },
      config,
    );
    return buildLogisticsRecord({
      ...signals,
      recommendationSummary: `Monitor shipping performance ${signals.originRegion}->${signals.destinationRegion} (perf=${signals.deliveryPerformance})`,
    });
  }

  monitorDeliveryTimes(
    input: LogisticsAnalysisInput,
    config: InternationalLogisticsEngineConfiguration,
  ): LogisticsRecord {
    const signals = computeStructuralLogisticsSignals(
      { ...input, logisticsCategory: "delivery_time" },
      config,
    );
    return buildLogisticsRecord(
      {
        ...signals,
        recommendationSummary: `Monitor delivery times ${signals.originRegion}->${signals.destinationRegion} vs threshold=${config.deliveryThreshold}`,
      },
      signals.deliveryPerformance > config.deliveryThreshold ? "partial" : "passed",
    );
  }

  monitorShippingCosts(
    input: LogisticsAnalysisInput,
    config: InternationalLogisticsEngineConfiguration,
  ): LogisticsRecord {
    const signals = computeStructuralLogisticsSignals(
      { ...input, logisticsCategory: "shipping_cost" },
      config,
    );
    return buildLogisticsRecord({
      ...signals,
      recommendationSummary: `Monitor shipping cost signals ${signals.originRegion}->${signals.destinationRegion}`,
    });
  }
}
