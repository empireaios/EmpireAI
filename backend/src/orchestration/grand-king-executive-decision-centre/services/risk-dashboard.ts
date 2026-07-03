/**
 * G7-04 — Risk dashboard.
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import type { ExecutiveRiskSummary } from "../contracts/executive-decision-types.js";
import { resolveExecutiveDecisionDependencies } from "../registry/executive-decision-registry-resolver.js";
import { aggregateExecutiveKpis } from "./executive-kpi-aggregator.js";
import { buildProductionBlockerDashboard } from "./production-blocker-dashboard.js";

export function buildRiskDashboard(context: RegistryLoaderContext = {}): ExecutiveRiskSummary {
  const kpis = aggregateExecutiveKpis(context);
  const blockers = buildProductionBlockerDashboard(context);
  const deps = resolveExecutiveDecisionDependencies(context);
  const risks: ExecutiveRiskSummary["risks"] = [];

  for (const riskRef of deps.riskScoringRefs) {
    if (riskRef === "risk:production-blocker" && blockers.blockerCount > 0) {
      risks.push({
        riskId: randomUUID(),
        domain: "production_certification",
        summary: `${blockers.blockerCount} production blockers active`,
        severity: "high",
      });
    }
    if (riskRef === "risk:provider-degraded" && kpis.providerHealth < 70) {
      risks.push({
        riskId: randomUUID(),
        domain: "commerce",
        summary: "Provider health below threshold",
        severity: "medium",
      });
    }
    if (riskRef === "risk:approval-backlog" && kpis.approvalQueue > 0) {
      risks.push({
        riskId: randomUUID(),
        domain: "approvals",
        summary: `${kpis.approvalQueue} approvals pending in queue`,
        severity: "medium",
      });
    }
  }

  if (process.env.EXECUTIVE_RISK_SIGNAL === "true") {
    risks.push({
      riskId: randomUUID(),
      domain: "incidents",
      summary: "Executive risk governance signal active",
      severity: "critical",
    });
  }

  return {
    riskLevel: kpis.riskLevel,
    riskCount: risks.length,
    risks,
  };
}
