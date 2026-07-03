/**
 * G7-04 — Global operational dashboard.
 */

import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import { EXECUTIVE_DOMAIN_IDS } from "../../../registry/types/executive-decision-registry-types.js";
import { aggregateExecutiveKpis } from "./executive-kpi-aggregator.js";
import { buildApprovalDashboard } from "./approval-dashboard.js";
import { buildProductionBlockerDashboard } from "./production-blocker-dashboard.js";
import { buildProductionOpportunityDashboard } from "./production-opportunity-dashboard.js";
import { buildRiskDashboard } from "./risk-dashboard.js";
import { generateExecutiveRecommendations } from "./decision-recommendation-engine.js";
import { buildOperationalTimeline } from "./operational-timeline.js";
import { listExecutiveNotifications, publishExecutiveNotifications } from "./executive-notification-centre.js";
import { listExecutiveDecisions } from "./grand-king-executive-decision-centre-service.js";

export function buildGlobalOperationalDashboard(context: RegistryLoaderContext = {}) {
  publishExecutiveNotifications(context);
  return {
    domains: [...EXECUTIVE_DOMAIN_IDS],
    kpis: aggregateExecutiveKpis(context),
    blockers: buildProductionBlockerDashboard(context),
    opportunities: buildProductionOpportunityDashboard(context),
    risks: buildRiskDashboard(context),
    approvals: buildApprovalDashboard(context),
    recommendations: generateExecutiveRecommendations(context),
    timeline: buildOperationalTimeline(listExecutiveDecisions()),
    notifications: listExecutiveNotifications(),
    pendingDecisions: listExecutiveDecisions().filter((d) => d.status === "pending").length,
  };
}
