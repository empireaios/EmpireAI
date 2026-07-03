/**
 * G7-04 — Grand King Executive Decision Centre Brain tools.
 */

import type { RegisteredTool } from "../../../brain/types.js";
import { buildCockpitExecutiveDecisionCentreView } from "../contracts/executive-decision-cockpit-contracts.js";
import {
  executeExecutiveDecision,
  getExecutiveDecision,
  getExecutiveGlobalDashboard,
  getExecutiveHealth,
  getExecutiveOperationsOverview,
  getExecutiveRecommendations,
  getExecutiveSummary,
  initializeExecutiveDecisionCentre,
  listExecutiveDecisions,
} from "../services/grand-king-executive-decision-centre-service.js";
import { resolveExecutiveDecisionDependencies } from "../registry/executive-decision-registry-resolver.js";
import { listExecutiveNotifications } from "../services/executive-notification-centre.js";

export const grandKingExecutiveDecisionCentreTools: RegisteredTool[] = [
  {
    name: "executive_overview",
    description: "G7-04 — Grand King executive overview and Cockpit view",
    module: "grand-king-executive-decision-centre",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => {
      const overview = getExecutiveOperationsOverview();
      const dashboard = getExecutiveGlobalDashboard();
      const summary = getExecutiveSummary();
      return {
        overview,
        cockpitView: buildCockpitExecutiveDecisionCentreView({
          overview,
          kpis: dashboard.kpis,
          decisionQueue: {
            pendingCount: overview.pendingDecisions,
            decisions: listExecutiveDecisions().map((d) => ({
              decisionId: d.decisionId,
              decisionType: d.decisionType,
              status: d.status,
            })),
          },
          recommendations: dashboard.recommendations,
          timeline: dashboard.timeline,
          notifications: listExecutiveNotifications(),
          blockers: dashboard.blockers,
          risks: dashboard.risks,
          approvals: dashboard.approvals,
          opportunities: dashboard.opportunities,
          executiveSummary: summary,
        }),
      };
    },
  },
  {
    name: "executive_health",
    description: "G7-04 — Empire health KPIs",
    module: "grand-king-executive-decision-centre",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => getExecutiveHealth(),
  },
  {
    name: "executive_decisions",
    description: "G7-04 — List executive decisions",
    module: "grand-king-executive-decision-centre",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { decisionId: { type: "string" } },
    },
    handler: async (args) => {
      if (args.decisionId) {
        const decision = getExecutiveDecision(String(args.decisionId));
        return decision ? { decision } : { error: "Decision not found" };
      }
      return { decisions: listExecutiveDecisions() };
    },
  },
  {
    name: "executive_recommendations",
    description: "G7-04 — Executive recommendations",
    module: "grand-king-executive-decision-centre",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ recommendations: getExecutiveRecommendations() }),
  },
  {
    name: "executive_blockers",
    description: "G7-04 — Production blockers dashboard",
    module: "grand-king-executive-decision-centre",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => getExecutiveGlobalDashboard().blockers,
  },
  {
    name: "executive_opportunities",
    description: "G7-04 — Production opportunities dashboard",
    module: "grand-king-executive-decision-centre",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => getExecutiveGlobalDashboard().opportunities,
  },
  {
    name: "executive_notifications",
    description: "G7-04 — Executive notification centre",
    module: "grand-king-executive-decision-centre",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ notifications: listExecutiveNotifications() }),
  },
  {
    name: "executive_timeline",
    description: "G7-04 — Operational timeline",
    module: "grand-king-executive-decision-centre",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ timeline: getExecutiveGlobalDashboard().timeline }),
  },
  {
    name: "executive_summary",
    description: "G7-04 — Executive summary",
    module: "grand-king-executive-decision-centre",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ summary: getExecutiveSummary() }),
  },
  {
    name: "execute_executive_decision",
    description: "G7-04 — Execute executive decision",
    module: "grand-king-executive-decision-centre",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        actorId: { type: "string" },
        ownerId: { type: "string" },
        decisionId: { type: "string" },
        decisionType: { type: "string" },
      },
      required: ["actorId", "decisionId", "decisionType"],
    },
    handler: async (args) =>
      executeExecutiveDecision({
        actorId: String(args.actorId),
        ownerId: String(args.ownerId ?? "grand-king"),
        decisionId: String(args.decisionId),
        decisionType: String(args.decisionType) as "approve",
        pillowGovernance: true,
      }),
  },
  {
    name: "initialize_grand_king_executive_decision_centre",
    description: "G7-04 — Initialize executive decision centre",
    module: "grand-king-executive-decision-centre",
    authorityLevel: "L2",
    parameters: { type: "object", properties: {} },
    handler: async () => initializeExecutiveDecisionCentre(),
  },
  {
    name: "executive_dependencies",
    description: "G7-04 — Executive registry dependencies",
    module: "grand-king-executive-decision-centre",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => resolveExecutiveDecisionDependencies(),
  },
];
