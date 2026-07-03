/**
 * G7-06 — Domain-specific optimisers.
 */

import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import { listCommerceOperations } from "../../grand-king-commerce-operations/services/grand-king-commerce-operations-service.js";
import { listAutomationOperations } from "../../grand-king-business-automation-operations/services/grand-king-business-automation-operations-service.js";
import { aggregateFinancialKpis } from "../../grand-king-revenue-financial-operations/services/financial-kpi-engine.js";
import { aggregateExecutiveKpis } from "../../grand-king-executive-decision-centre/services/executive-kpi-aggregator.js";
import type { OptimizationOpportunity } from "../contracts/continuous-intelligence-types.js";
import { deriveSignalFromRuleRef } from "../registry/continuous-intelligence-registry-resolver.js";

export type OptimiserResult = {
  domain: string;
  suggestedActions: string[];
  signalScore: number;
};

export function runPerformanceOptimiser(context: RegistryLoaderContext = {}): OptimiserResult {
  let score = 0.5;
  try {
    const kpis = aggregateExecutiveKpis(context);
    score = kpis.empireHealthScore / 100;
  } catch {
    score = 0.5;
  }
  return {
    domain: "performance",
    suggestedActions: score < 0.7 ? ["Review provider health", "Reduce incident count"] : ["Maintain current performance"],
    signalScore: score,
  };
}

export function runCommerceOptimiser(context: RegistryLoaderContext = {}): OptimiserResult {
  let running = 0;
  let blocked = 0;
  try {
    const ops = listCommerceOperations();
    running = ops.filter((o) => o.status === "running").length;
    blocked = ops.filter((o) => o.status === "blocked").length;
  } catch {
    /* stack not initialized */
  }
  return {
    domain: "commerce",
    suggestedActions: blocked > 0
      ? ["Resolve commerce blockers", "Increase channel throughput"]
      : ["Scale running commerce channels"],
    signalScore: running / Math.max(running + blocked, 1),
  };
}

export function runAutomationOptimiser(_context: RegistryLoaderContext = {}): OptimiserResult {
  let executing = 0;
  let failed = 0;
  try {
    const ops = listAutomationOperations();
    executing = ops.filter((o) => o.executionStatus === "executing").length;
    failed = ops.filter((o) => o.executionStatus === "failed").length;
  } catch {
    /* stack not initialized */
  }
  return {
    domain: "automation",
    suggestedActions: failed > 0
      ? ["Trigger automation recovery", "Review workflow failures"]
      : ["Optimise workflow queue depth"],
    signalScore: executing / Math.max(executing + failed, 1),
  };
}

export function runWorkflowOptimiser(context: RegistryLoaderContext = {}): OptimiserResult {
  const automation = runAutomationOptimiser(context);
  return {
    domain: "workflows",
    suggestedActions: [...automation.suggestedActions, "Rebalance workflow priorities"],
    signalScore: automation.signalScore,
  };
}

export function runFinancialOptimiser(context: RegistryLoaderContext = {}): OptimiserResult {
  let margin = 0;
  try {
    const kpis = aggregateFinancialKpis(context);
    margin = kpis.profitMargin;
  } catch {
    margin = 0;
  }
  return {
    domain: "financial_operations",
    suggestedActions: margin < 10
      ? ["Reduce operational expenses", "Improve advertising ROI"]
      : ["Reinvest surplus into revenue channels"],
    signalScore: Math.min(margin / 100, 1),
  };
}

export function runAllDomainOptimisers(context: RegistryLoaderContext = {}): OptimiserResult[] {
  return [
    runPerformanceOptimiser(context),
    runCommerceOptimiser(context),
    runAutomationOptimiser(context),
    runWorkflowOptimiser(context),
    runFinancialOptimiser(context),
  ];
}

export function enrichOpportunityWithOptimiser(
  opportunity: OptimizationOpportunity,
  context: RegistryLoaderContext = {},
): string[] {
  const ref = opportunity.ruleReference;
  const signal = deriveSignalFromRuleRef(ref);
  const optimisers = runAllDomainOptimisers(context);
  const match = optimisers.find((o) => o.domain === opportunity.domainId);
  return match?.suggestedActions ?? [`Apply ${opportunity.optimizationType} with signal ${signal}`];
}
