/** X3-16 — Revenue Analysis Engine (growth / trend / product / channel / customer). */

import type { RevenueAccelerationEngineConfiguration } from "./configuration.js";
import type { RevenueAccelerationRecord, RevenueAccelerationInput } from "./types.js";
import {
  buildRevenueAccelerationRecord,
  computeRevenueAccelerationSignals,
} from "./structural-signals.js";

export class RevenueAnalysisEngine {
  monitorGrowth(
    input: RevenueAccelerationInput,
    config: RevenueAccelerationEngineConfiguration,
    sourceAvailable = true,
  ): RevenueAccelerationRecord {
    if (!config.revenueGrowthMonitoringEnabled) {
      throw new Error("Revenue growth monitoring disabled");
    }
    const signals = computeRevenueAccelerationSignals(
      "revenue_growth_monitoring",
      input,
      config,
      sourceAvailable,
    );
    const summary =
      signals.revenueOpportunityScore >= config.revenueGrowthThreshold
        ? `Revenue growth opportunity ${signals.revenueOpportunityScore}% clears threshold ${config.revenueGrowthThreshold} — validated supporting data required before recommendation`
        : `Revenue growth opportunity ${signals.revenueOpportunityScore}% below threshold — never recommend revenue actions without validated supporting data`;
    return buildRevenueAccelerationRecord({
      ...signals,
      revenueCategory: "growth",
      recommendationSummary: summary,
    });
  }

  monitorTrends(
    input: RevenueAccelerationInput,
    config: RevenueAccelerationEngineConfiguration,
    sourceAvailable = true,
  ): RevenueAccelerationRecord {
    if (!config.revenueTrendMonitoringEnabled) {
      throw new Error("Revenue trend monitoring disabled");
    }
    const signals = computeRevenueAccelerationSignals(
      "revenue_trend_monitoring",
      input,
      config,
      sourceAvailable,
    );
    const summary =
      signals.revenueOpportunityScore >= config.revenueTrendThreshold
        ? `Revenue trend opportunity ${signals.revenueOpportunityScore}% above ${config.revenueTrendThreshold}`
        : signals.recommendationSummary;
    return buildRevenueAccelerationRecord({
      ...signals,
      revenueCategory: "trend",
      recommendationSummary: summary,
    });
  }

  monitorProduct(
    input: RevenueAccelerationInput,
    config: RevenueAccelerationEngineConfiguration,
    sourceAvailable = true,
  ): RevenueAccelerationRecord {
    if (!config.productRevenueMonitoringEnabled) {
      throw new Error("Product revenue monitoring disabled");
    }
    const signals = computeRevenueAccelerationSignals(
      "product_revenue_monitoring",
      input,
      config,
      sourceAvailable,
    );
    const summary =
      signals.revenueOpportunityScore >= config.productRevenueThreshold
        ? `Product revenue opportunity ${signals.revenueOpportunityScore}% above ${config.productRevenueThreshold}`
        : signals.recommendationSummary;
    return buildRevenueAccelerationRecord({
      ...signals,
      revenueCategory: "product",
      recommendationSummary: summary,
    });
  }

  monitorChannel(
    input: RevenueAccelerationInput,
    config: RevenueAccelerationEngineConfiguration,
    sourceAvailable = true,
  ): RevenueAccelerationRecord {
    if (!config.channelRevenueMonitoringEnabled) {
      throw new Error("Channel revenue monitoring disabled");
    }
    const signals = computeRevenueAccelerationSignals(
      "channel_revenue_monitoring",
      input,
      config,
      sourceAvailable,
    );
    const summary =
      signals.revenueOpportunityScore >= config.channelRevenueThreshold
        ? `Channel revenue opportunity ${signals.revenueOpportunityScore}% above ${config.channelRevenueThreshold}`
        : signals.recommendationSummary;
    return buildRevenueAccelerationRecord({
      ...signals,
      revenueCategory: "channel",
      recommendationSummary: summary,
    });
  }

  monitorCustomer(
    input: RevenueAccelerationInput,
    config: RevenueAccelerationEngineConfiguration,
    sourceAvailable = true,
  ): RevenueAccelerationRecord {
    if (!config.customerRevenueMonitoringEnabled) {
      throw new Error("Customer revenue monitoring disabled");
    }
    const signals = computeRevenueAccelerationSignals(
      "customer_revenue_monitoring",
      input,
      config,
      sourceAvailable,
    );
    const summary =
      signals.revenueOpportunityScore >= config.customerRevenueThreshold
        ? `Customer revenue opportunity ${signals.revenueOpportunityScore}% above ${config.customerRevenueThreshold}`
        : signals.recommendationSummary;
    return buildRevenueAccelerationRecord({
      ...signals,
      revenueCategory: "customer",
      recommendationSummary: summary,
    });
  }
}
