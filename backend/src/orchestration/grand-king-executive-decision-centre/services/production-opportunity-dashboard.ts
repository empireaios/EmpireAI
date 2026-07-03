/**
 * G7-04 — Production opportunity dashboard.
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import { listCommerceOperations } from "../../grand-king-commerce-operations/services/grand-king-commerce-operations-service.js";
import { listAutomationOperations } from "../../grand-king-business-automation-operations/services/grand-king-business-automation-operations-service.js";
import type { ExecutiveOpportunitySummary } from "../contracts/executive-decision-types.js";
import { aggregateExecutiveKpis } from "./executive-kpi-aggregator.js";

export function buildProductionOpportunityDashboard(context: RegistryLoaderContext = {}): ExecutiveOpportunitySummary {
  const opportunities: ExecutiveOpportunitySummary["opportunities"] = [];
  const kpis = aggregateExecutiveKpis(context);

  try {
    for (const op of listCommerceOperations().filter((item) => item.status === "ready")) {
      opportunities.push({
        opportunityId: randomUUID(),
        domain: "commerce",
        summary: `Start commerce operation for ${op.providerId}`,
        priority: "medium",
      });
    }
  } catch {
    /* not initialized */
  }

  try {
    for (const op of listAutomationOperations().filter((item) => item.executionStatus === "ready")) {
      opportunities.push({
        opportunityId: randomUUID(),
        domain: "automation",
        summary: `Launch automation domain ${op.domainName}`,
        priority: "medium",
      });
    }
  } catch {
    /* not initialized */
  }

  if (kpis.empireHealthScore >= 80) {
    opportunities.push({
      opportunityId: randomUUID(),
      domain: "financial_health",
      summary: "Empire health strong — expand live channel operations",
      priority: "low",
    });
  }

  return { opportunityCount: opportunities.length, opportunities };
}
