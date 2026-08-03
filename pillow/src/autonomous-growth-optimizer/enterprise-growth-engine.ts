/** X3-15 — Enterprise Growth Engine (enterprise / revenue / profit / customer / operational). */

import type { AutonomousGrowthOptimizerConfiguration } from "./configuration.js";
import type { GrowthOptimizationRecord, GrowthOptimizationInput } from "./types.js";
import {
  buildGrowthOptimizationRecord,
  computeGrowthOptimizationSignals,
} from "./structural-signals.js";

export class EnterpriseGrowthEngine {
  monitorEnterprise(
    input: GrowthOptimizationInput,
    config: AutonomousGrowthOptimizerConfiguration,
    sourceAvailable = true,
  ): GrowthOptimizationRecord {
    if (!config.enterpriseGrowthMonitoringEnabled) {
      throw new Error("Enterprise growth monitoring disabled");
    }
    const signals = computeGrowthOptimizationSignals(
      "enterprise_growth_monitoring",
      input,
      config,
      sourceAvailable,
    );
    const summary =
      signals.growthOpportunityScore >= config.enterpriseGrowthThreshold
        ? `Enterprise growth opportunity ${signals.growthOpportunityScore}% clears threshold ${config.enterpriseGrowthThreshold} — validated operational limits required before optimization`
        : `Enterprise growth opportunity ${signals.growthOpportunityScore}% below threshold — never optimize beyond validated operational limits`;
    return buildGrowthOptimizationRecord({
      ...signals,
      growthCategory: "enterprise",
      recommendationSummary: summary,
    });
  }

  monitorRevenue(
    input: GrowthOptimizationInput,
    config: AutonomousGrowthOptimizerConfiguration,
    sourceAvailable = true,
  ): GrowthOptimizationRecord {
    if (!config.revenueGrowthMonitoringEnabled) {
      throw new Error("Revenue growth monitoring disabled");
    }
    const signals = computeGrowthOptimizationSignals(
      "revenue_growth_monitoring",
      input,
      config,
      sourceAvailable,
    );
    const summary =
      signals.growthOpportunityScore >= config.revenueGrowthThreshold
        ? `Revenue growth opportunity ${signals.growthOpportunityScore}% above ${config.revenueGrowthThreshold}`
        : signals.recommendationSummary;
    return buildGrowthOptimizationRecord({
      ...signals,
      growthCategory: "revenue",
      recommendationSummary: summary,
    });
  }

  monitorProfit(
    input: GrowthOptimizationInput,
    config: AutonomousGrowthOptimizerConfiguration,
    sourceAvailable = true,
  ): GrowthOptimizationRecord {
    if (!config.profitGrowthMonitoringEnabled) {
      throw new Error("Profit growth monitoring disabled");
    }
    const signals = computeGrowthOptimizationSignals(
      "profit_growth_monitoring",
      input,
      config,
      sourceAvailable,
    );
    const summary =
      signals.growthOpportunityScore >= config.profitGrowthThreshold
        ? `Profit growth opportunity ${signals.growthOpportunityScore}% above ${config.profitGrowthThreshold}`
        : signals.recommendationSummary;
    return buildGrowthOptimizationRecord({
      ...signals,
      growthCategory: "profit",
      recommendationSummary: summary,
    });
  }

  monitorCustomer(
    input: GrowthOptimizationInput,
    config: AutonomousGrowthOptimizerConfiguration,
    sourceAvailable = true,
  ): GrowthOptimizationRecord {
    if (!config.customerGrowthMonitoringEnabled) {
      throw new Error("Customer growth monitoring disabled");
    }
    const signals = computeGrowthOptimizationSignals(
      "customer_growth_monitoring",
      input,
      config,
      sourceAvailable,
    );
    const summary =
      signals.growthOpportunityScore >= config.customerGrowthThreshold
        ? `Customer growth opportunity ${signals.growthOpportunityScore}% above ${config.customerGrowthThreshold}`
        : signals.recommendationSummary;
    return buildGrowthOptimizationRecord({
      ...signals,
      growthCategory: "customer",
      recommendationSummary: summary,
    });
  }

  monitorOperational(
    input: GrowthOptimizationInput,
    config: AutonomousGrowthOptimizerConfiguration,
    sourceAvailable = true,
  ): GrowthOptimizationRecord {
    if (!config.operationalGrowthMonitoringEnabled) {
      throw new Error("Operational growth monitoring disabled");
    }
    const signals = computeGrowthOptimizationSignals(
      "operational_growth_monitoring",
      input,
      config,
      sourceAvailable,
    );
    const summary =
      signals.growthOpportunityScore >= config.operationalGrowthThreshold
        ? `Operational growth opportunity ${signals.growthOpportunityScore}% above ${config.operationalGrowthThreshold}`
        : signals.recommendationSummary;
    return buildGrowthOptimizationRecord({
      ...signals,
      growthCategory: "operational",
      recommendationSummary: summary,
    });
  }
}
