/** X3-09 — Executive Dashboard Engine (scaling status / decisions widgets). */

import type { ExecutiveScalingDashboardConfiguration } from "./configuration.js";
import type {
  ExecutiveDashboardSnapshot,
  ExecutiveScalingDashboardInput,
} from "./types.js";
import {
  buildDashboardSnapshot,
  buildDomainSummary,
  computeDashboardSignals,
} from "./structural-signals.js";

export class ExecutiveDashboardEngine {
  assess(
    input: ExecutiveScalingDashboardInput,
    config: ExecutiveScalingDashboardConfiguration,
    focus: "scaling" | "opportunity" | "decisions" = "scaling",
    sourceAvailability: Partial<Record<string, boolean>> = {},
  ): ExecutiveDashboardSnapshot {
    const signals = computeDashboardSignals(
      focus === "decisions" ? "scaling" : focus,
      input,
      config,
      sourceAvailability,
    );
    const note =
      focus === "decisions"
        ? `Decision visibility · ${signals.recommendationSummary}`
        : focus === "opportunity"
          ? `Opportunity visibility · score ${signals.opportunityScore}`
          : `Scaling status · readiness ${signals.scalingScore}`;

    return buildDashboardSnapshot({
      companyReference: signals.companyReference,
      scalingSummary: buildDomainSummary({
        domain: "scaling",
        readinessScore: signals.scalingScore,
        sourceAvailable: sourceAvailability.scalingDecisionEngine !== false,
        notes: note,
        min: config.minScalingReadiness,
      }),
      opportunitySummary: buildDomainSummary({
        domain: "opportunity",
        readinessScore: signals.opportunityScore,
        sourceAvailable: sourceAvailability.winningProductDetector !== false,
        notes: `Opportunity score ${signals.opportunityScore}`,
        min: config.minOpportunityScore,
      }),
      capacitySummary: buildDomainSummary({
        domain: "capacity",
        readinessScore: signals.capacityScore,
        sourceAvailable: sourceAvailability.capacityPlanningEngine !== false,
        notes: `Capacity score ${signals.capacityScore}`,
        min: config.minCapacityScore,
      }),
      marketingSummary: buildDomainSummary({
        domain: "marketing",
        readinessScore: signals.marketingScore,
        sourceAvailable: sourceAvailability.marketingScaleEngine !== false,
        notes: `Marketing score ${signals.marketingScore}`,
        min: config.minMarketingScore,
      }),
      supplierSummary: buildDomainSummary({
        domain: "supplier",
        readinessScore: signals.supplierScore,
        sourceAvailable: sourceAvailability.supplierScaleEngine !== false,
        notes: `Supplier score ${signals.supplierScore}`,
        min: config.minSupplierScore,
      }),
      financialSummary: buildDomainSummary({
        domain: "financial",
        readinessScore: signals.financialScore,
        sourceAvailable: sourceAvailability.financialScaleEngine !== false,
        notes: `Financial score ${signals.financialScore}`,
        min: config.minFinancialScore,
      }),
      workforceSummary: buildDomainSummary({
        domain: "workforce",
        readinessScore: signals.workforceScore,
        sourceAvailable: sourceAvailability.workforceIntelligence !== false,
        notes: `Workforce score ${signals.workforceScore}`,
        min: config.minWorkforceScore,
      }),
      executiveAlerts: [],
    });
  }
}
