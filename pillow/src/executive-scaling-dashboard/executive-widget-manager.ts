/** X3-09 — Executive Widget Manager (domain widget views). */

import type { ExecutiveScalingDashboardConfiguration } from "./configuration.js";
import type {
  ExecutiveDashboardSnapshot,
  ExecutiveScalingDashboardInput,
} from "./types.js";
import { ExecutiveDashboardEngine } from "./executive-dashboard-engine.js";
import { ScalingMetricsAggregator } from "./scaling-metrics-aggregator.js";

export class ExecutiveWidgetManager {
  private readonly dashboardEngine = new ExecutiveDashboardEngine();

  constructor(private readonly aggregator: ScalingMetricsAggregator) {}

  private base(
    input: ExecutiveScalingDashboardInput,
    config: ExecutiveScalingDashboardConfiguration,
  ): ExecutiveDashboardSnapshot {
    return this.aggregator.aggregate(input, config);
  }

  getScalingStatus(
    input: ExecutiveScalingDashboardInput,
    config: ExecutiveScalingDashboardConfiguration,
  ): ExecutiveDashboardSnapshot {
    const snap = this.base(input, config);
    return {
      ...snap,
      executiveAlerts: [],
      scalingSummary: {
        ...snap.scalingSummary,
        notes: `Widget · scaling status ${snap.scalingSummary.readinessScore}`,
      },
    };
  }

  getScalingOpportunities(
    input: ExecutiveScalingDashboardInput,
    config: ExecutiveScalingDashboardConfiguration,
  ): ExecutiveDashboardSnapshot {
    return this.dashboardEngine.assess(
      input,
      config,
      "opportunity",
      this.aggregator.sourceAvailability(),
    );
  }

  getScalingDecisions(
    input: ExecutiveScalingDashboardInput,
    config: ExecutiveScalingDashboardConfiguration,
  ): ExecutiveDashboardSnapshot {
    return this.dashboardEngine.assess(
      input,
      config,
      "decisions",
      this.aggregator.sourceAvailability(),
    );
  }

  getOperationalCapacity(
    input: ExecutiveScalingDashboardInput,
    config: ExecutiveScalingDashboardConfiguration,
  ): ExecutiveDashboardSnapshot {
    const snap = this.base(input, config);
    return {
      ...snap,
      capacitySummary: {
        ...snap.capacitySummary,
        notes: `Widget · operational capacity ${snap.capacitySummary.readinessScore}`,
      },
    };
  }

  getMarketingGrowth(
    input: ExecutiveScalingDashboardInput,
    config: ExecutiveScalingDashboardConfiguration,
  ): ExecutiveDashboardSnapshot {
    const snap = this.base(input, config);
    return {
      ...snap,
      marketingSummary: {
        ...snap.marketingSummary,
        notes: `Widget · marketing growth ${snap.marketingSummary.readinessScore}`,
      },
    };
  }

  getSupplierReadiness(
    input: ExecutiveScalingDashboardInput,
    config: ExecutiveScalingDashboardConfiguration,
  ): ExecutiveDashboardSnapshot {
    const snap = this.base(input, config);
    return {
      ...snap,
      supplierSummary: {
        ...snap.supplierSummary,
        notes: `Widget · supplier readiness ${snap.supplierSummary.readinessScore}`,
      },
    };
  }

  getFinancialReadiness(
    input: ExecutiveScalingDashboardInput,
    config: ExecutiveScalingDashboardConfiguration,
  ): ExecutiveDashboardSnapshot {
    const snap = this.base(input, config);
    return {
      ...snap,
      financialSummary: {
        ...snap.financialSummary,
        notes: `Widget · financial readiness ${snap.financialSummary.readinessScore}`,
      },
    };
  }

  getWorkforceUtilization(
    input: ExecutiveScalingDashboardInput,
    config: ExecutiveScalingDashboardConfiguration,
  ): ExecutiveDashboardSnapshot {
    const snap = this.base(input, config);
    return {
      ...snap,
      workforceSummary: {
        ...snap.workforceSummary,
        notes: `Widget · workforce utilization ${snap.workforceSummary.readinessScore}`,
      },
    };
  }
}
