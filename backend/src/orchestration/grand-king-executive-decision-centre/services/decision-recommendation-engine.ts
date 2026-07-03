/**
 * G7-04 — Decision recommendation engine (registry-driven rules).
 */

import { randomUUID } from "node:crypto";
import type { ExecutiveRecommendation } from "../contracts/executive-decision-types.js";
import { resolveExecutiveDecisionDependencies } from "../registry/executive-decision-registry-resolver.js";
import { aggregateExecutiveKpis } from "./executive-kpi-aggregator.js";
import { buildProductionBlockerDashboard } from "./production-blocker-dashboard.js";
import { buildProductionOpportunityDashboard } from "./production-opportunity-dashboard.js";

export function generateExecutiveRecommendations(context: Record<string, unknown> = {}): ExecutiveRecommendation[] {
  const deps = resolveExecutiveDecisionDependencies(context);
  const kpis = aggregateExecutiveKpis(context);
  const blockers = buildProductionBlockerDashboard(context);
  const opportunities = buildProductionOpportunityDashboard(context);
  const recommendations: ExecutiveRecommendation[] = [];
  const now = new Date().toISOString();

  for (const ruleRef of deps.decisionRuleRefs) {
    if (ruleRef === "rule:approve-when-ready" && kpis.productionReadiness >= 100 && kpis.commerceReadiness >= 100) {
      recommendations.push({
        recommendationId: randomUUID(),
        domainId: "production_certification",
        decisionType: "approve",
        priority: "medium",
        summary: "Production and commerce readiness signals green — approve continued operations",
        recommendedAction: "approve",
        ruleReference: ruleRef,
        generatedAt: now,
      });
    }
    if (ruleRef === "rule:pause-on-risk" && (kpis.riskLevel === "high" || kpis.riskLevel === "critical")) {
      recommendations.push({
        recommendationId: randomUUID(),
        domainId: "incidents",
        decisionType: "pause",
        priority: "high",
        summary: "Elevated risk level detected — consider pausing affected operations",
        recommendedAction: "pause",
        ruleReference: ruleRef,
        generatedAt: now,
      });
    }
    if (ruleRef === "rule:escalate-on-blocker" && blockers.blockerCount > 0) {
      recommendations.push({
        recommendationId: randomUUID(),
        domainId: "incidents",
        decisionType: "escalate",
        priority: "critical",
        summary: `${blockers.blockerCount} production blockers require executive escalation`,
        recommendedAction: "escalate",
        ruleReference: ruleRef,
        generatedAt: now,
      });
    }
    if (ruleRef === "rule:delegate-to-module" && opportunities.opportunityCount > 0) {
      recommendations.push({
        recommendationId: randomUUID(),
        domainId: "live_operations",
        decisionType: "delegate",
        priority: "medium",
        summary: "Operational opportunities identified — delegate to responsible module",
        recommendedAction: "delegate",
        ruleReference: ruleRef,
        generatedAt: now,
      });
    }
  }

  return recommendations;
}
