/** X3-09 — Scaling Metrics Aggregator (tolerates missing upstream engines). */

import type { AutonomousScalingFrameworkEngine } from "../autonomous-scaling-framework/engine.js";
import type { WinningProductDetectorEngine } from "../winning-product-detector/engine.js";
import type { ScalingDecisionEngine } from "../scaling-decision-engine/engine.js";
import type { CapacityPlanningEngine } from "../capacity-planning-engine/engine.js";
import type { MarketingScaleEngine } from "../marketing-scale-engine/engine.js";
import type { SupplierScaleEngine } from "../supplier-scale-engine/engine.js";
import type { FinancialScaleEngine } from "../financial-scale-engine/engine.js";
import type { WorkforceIntelligenceEngine } from "../workforce-intelligence/engine.js";
import type { ExecutiveScalingDashboardConfiguration } from "./configuration.js";
import type {
  ExecutiveDashboardSnapshot,
  ExecutiveScalingDashboardInput,
} from "./types.js";
import {
  buildDashboardSnapshot,
  buildDomainSummary,
  computeDashboardSignals,
  defaultCompany,
} from "./structural-signals.js";
import { appendEsdLog } from "./esd-logging.js";

export type ScalingMetricsAggregatorDependencies = {
  autonomousScalingFramework?: AutonomousScalingFrameworkEngine | null;
  winningProductDetector?: WinningProductDetectorEngine | null;
  scalingDecisionEngine?: ScalingDecisionEngine | null;
  capacityPlanningEngine?: CapacityPlanningEngine | null;
  marketingScaleEngine?: MarketingScaleEngine | null;
  supplierScaleEngine?: SupplierScaleEngine | null;
  financialScaleEngine?: FinancialScaleEngine | null;
  workforceIntelligence?: WorkforceIntelligenceEngine | null;
};

function safeReadiness(
  label: string,
  read: () => number | null | undefined,
  fallback: number,
): { score: number; available: boolean } {
  try {
    const value = read();
    if (typeof value === "number" && Number.isFinite(value)) {
      return { score: Math.max(0, Math.min(100, Math.round(value))), available: true };
    }
    return { score: fallback, available: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    appendEsdLog({
      event: "upstream_partial",
      level: "warn",
      details: `${label} unavailable — using structural fallback (${message.slice(0, 80)})`,
    });
    return { score: fallback, available: false };
  }
}

export class ScalingMetricsAggregator {
  constructor(private readonly deps: ScalingMetricsAggregatorDependencies = {}) {}

  sourceAvailability(): Record<string, boolean> {
    return {
      autonomousScalingFramework: Boolean(this.deps.autonomousScalingFramework),
      winningProductDetector: Boolean(this.deps.winningProductDetector),
      scalingDecisionEngine: Boolean(this.deps.scalingDecisionEngine),
      capacityPlanningEngine: Boolean(this.deps.capacityPlanningEngine),
      marketingScaleEngine: Boolean(this.deps.marketingScaleEngine),
      supplierScaleEngine: Boolean(this.deps.supplierScaleEngine),
      financialScaleEngine: Boolean(this.deps.financialScaleEngine),
      workforceIntelligence: Boolean(this.deps.workforceIntelligence),
    };
  }

  aggregate(
    input: ExecutiveScalingDashboardInput,
    config: ExecutiveScalingDashboardConfiguration,
  ): ExecutiveDashboardSnapshot {
    const signals = computeDashboardSignals(
      "dashboard",
      input,
      config,
      this.sourceAvailability(),
    );
    const company = defaultCompany(input);

    const scaling = safeReadiness(
      "scalingDecisionEngine",
      () => {
        if (!this.deps.scalingDecisionEngine) return null;
        const sync = this.deps.scalingDecisionEngine.validateForSupervisorSync();
        return sync.readinessScore;
      },
      signals.scalingScore,
    );
    const opportunity = safeReadiness(
      "winningProductDetector",
      () => {
        if (!this.deps.winningProductDetector) return null;
        const sync = this.deps.winningProductDetector.validateForSupervisorSync();
        return sync.readinessScore;
      },
      signals.opportunityScore,
    );
    const capacity = safeReadiness(
      "capacityPlanningEngine",
      () => {
        if (!this.deps.capacityPlanningEngine) return null;
        const sync = this.deps.capacityPlanningEngine.validateForSupervisorSync();
        return sync.readinessScore;
      },
      signals.capacityScore,
    );
    const marketing = safeReadiness(
      "marketingScaleEngine",
      () => {
        if (!this.deps.marketingScaleEngine) return null;
        const sync = this.deps.marketingScaleEngine.validateForSupervisorSync();
        return sync.readinessScore;
      },
      signals.marketingScore,
    );
    const supplier = safeReadiness(
      "supplierScaleEngine",
      () => {
        if (!this.deps.supplierScaleEngine) return null;
        const sync = this.deps.supplierScaleEngine.validateForSupervisorSync();
        return sync.readinessScore;
      },
      signals.supplierScore,
    );
    const financial = safeReadiness(
      "financialScaleEngine",
      () => {
        if (!this.deps.financialScaleEngine) return null;
        const sync = this.deps.financialScaleEngine.validateForSupervisorSync();
        return sync.readinessScore;
      },
      signals.financialScore,
    );
    const workforce = safeReadiness(
      "workforceIntelligence",
      () => {
        if (!this.deps.workforceIntelligence) return null;
        const sync = this.deps.workforceIntelligence.validateForSupervisorSync();
        return sync.readinessScore;
      },
      signals.workforceScore,
    );

    // Prefer explicit hints when provided (tests / controlled inputs).
    const scalingScore = input.scalingHint ?? scaling.score;
    const opportunityScore = input.opportunityHint ?? opportunity.score;
    const capacityScore = input.capacityHint ?? capacity.score;
    const marketingScore = input.marketingHint ?? marketing.score;
    const supplierScore = input.supplierHint ?? supplier.score;
    const financialScore = input.financialHint ?? financial.score;
    const workforceScore = input.workforceHint ?? workforce.score;

    return buildDashboardSnapshot({
      companyReference: company,
      scalingSummary: buildDomainSummary({
        domain: "scaling",
        readinessScore: scalingScore,
        sourceAvailable: scaling.available || Boolean(input.scalingHint),
        notes: `Aggregated scaling readiness ${scalingScore}`,
        min: config.minScalingReadiness,
      }),
      opportunitySummary: buildDomainSummary({
        domain: "opportunity",
        readinessScore: opportunityScore,
        sourceAvailable: opportunity.available || Boolean(input.opportunityHint),
        notes: `Aggregated opportunity ${opportunityScore}`,
        min: config.minOpportunityScore,
      }),
      capacitySummary: buildDomainSummary({
        domain: "capacity",
        readinessScore: capacityScore,
        sourceAvailable: capacity.available || Boolean(input.capacityHint),
        notes: `Aggregated capacity ${capacityScore}`,
        min: config.minCapacityScore,
      }),
      marketingSummary: buildDomainSummary({
        domain: "marketing",
        readinessScore: marketingScore,
        sourceAvailable: marketing.available || Boolean(input.marketingHint),
        notes: `Aggregated marketing ${marketingScore}`,
        min: config.minMarketingScore,
      }),
      supplierSummary: buildDomainSummary({
        domain: "supplier",
        readinessScore: supplierScore,
        sourceAvailable: supplier.available || Boolean(input.supplierHint),
        notes: `Aggregated supplier ${supplierScore}`,
        min: config.minSupplierScore,
      }),
      financialSummary: buildDomainSummary({
        domain: "financial",
        readinessScore: financialScore,
        sourceAvailable: financial.available || Boolean(input.financialHint),
        notes: `Aggregated financial ${financialScore}`,
        min: config.minFinancialScore,
      }),
      workforceSummary: buildDomainSummary({
        domain: "workforce",
        readinessScore: workforceScore,
        sourceAvailable: workforce.available || Boolean(input.workforceHint),
        notes: `Aggregated workforce ${workforceScore}`,
        min: config.minWorkforceScore,
      }),
      executiveAlerts: [],
    });
  }
}
