/**
 * G7-06 — Grand King Continuous Intelligence Brain tools.
 */

import type { RegisteredTool } from "../../../brain/types.js";
import { buildCockpitContinuousIntelligenceView } from "../contracts/continuous-intelligence-cockpit-contracts.js";
import {
  approveOptimization,
  executeOptimization,
  getOptimizationOperationsOverview,
  getOptimizationStatus,
  initializeContinuousIntelligenceOptimization,
  listOptimizationHistory,
  listOptimizationRecommendations,
} from "../services/grand-king-continuous-intelligence-optimization-service.js";
import {
  buildExecutiveOptimizationDashboard,
  getExecutiveOptimizationSummary,
  listOptimizationOpportunities,
} from "../services/executive-optimization-dashboard.js";
import { resolveOptimizationDependencies } from "../registry/continuous-intelligence-registry-resolver.js";
import { prioritiseOptimizationRecommendations, computeOptimizationRoi } from "../services/recommendation-prioritiser.js";

export const grandKingContinuousIntelligenceOptimizationTools: RegisteredTool[] = [
  {
    name: "optimization_overview",
    description: "G7-06 — Grand King optimization overview and Cockpit view",
    module: "grand-king-continuous-intelligence-optimization",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => {
      const overview = getOptimizationOperationsOverview();
      const dashboard = buildExecutiveOptimizationDashboard();
      const summary = getExecutiveOptimizationSummary();
      return {
        overview,
        cockpitView: buildCockpitContinuousIntelligenceView({
          overview,
          opportunities: dashboard.opportunities,
          priorityQueue: dashboard.priorityQueue,
          roi: dashboard.roi,
          history: dashboard.history,
          recommendations: dashboard.recommendations,
          executiveOptimizationSummary: summary,
        }),
      };
    },
  },
  {
    name: "optimization_opportunities",
    description: "G7-06 — Detected optimization opportunities",
    module: "grand-king-continuous-intelligence-optimization",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ opportunities: listOptimizationOpportunities() }),
  },
  {
    name: "optimization_recommendations",
    description: "G7-06 — Optimization recommendations",
    module: "grand-king-continuous-intelligence-optimization",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ recommendations: listOptimizationRecommendations() }),
  },
  {
    name: "optimization_priority_queue",
    description: "G7-06 — Priority-ranked optimization queue",
    module: "grand-king-continuous-intelligence-optimization",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({
      queue: prioritiseOptimizationRecommendations(listOptimizationRecommendations()),
    }),
  },
  {
    name: "optimization_roi",
    description: "G7-06 — Optimization ROI summary",
    module: "grand-king-continuous-intelligence-optimization",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => computeOptimizationRoi(listOptimizationRecommendations()),
  },
  {
    name: "optimization_status",
    description: "G7-06 — Continuous intelligence status",
    module: "grand-king-continuous-intelligence-optimization",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => getOptimizationStatus(),
  },
  {
    name: "optimization_history",
    description: "G7-06 — Optimization execution history",
    module: "grand-king-continuous-intelligence-optimization",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ history: listOptimizationHistory() }),
  },
  {
    name: "optimization_summary",
    description: "G7-06 — Executive optimization summary",
    module: "grand-king-continuous-intelligence-optimization",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ summary: getExecutiveOptimizationSummary() }),
  },
  {
    name: "initialize_grand_king_continuous_intelligence_optimization",
    description: "G7-06 — Initialize continuous intelligence optimization",
    module: "grand-king-continuous-intelligence-optimization",
    authorityLevel: "L2",
    parameters: { type: "object", properties: {} },
    handler: async () => initializeContinuousIntelligenceOptimization(),
  },
  {
    name: "optimization_dependencies",
    description: "G7-06 — Optimization registry dependencies",
    module: "grand-king-continuous-intelligence-optimization",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => resolveOptimizationDependencies(),
  },
  {
    name: "approve_optimization",
    description: "G7-06 — Approve and schedule optimization",
    module: "grand-king-continuous-intelligence-optimization",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        actorId: { type: "string" },
        ownerId: { type: "string" },
        optimizationId: { type: "string" },
      },
      required: ["actorId", "optimizationId"],
    },
    handler: async (args) =>
      approveOptimization({
        actorId: String(args.actorId),
        ownerId: String(args.ownerId ?? "grand-king"),
        workspaceId: "ws_empire_1",
        optimizationId: String(args.optimizationId),
        pillowGovernance: true,
      }),
  },
  {
    name: "execute_optimization",
    description: "G7-06 — Execute approved optimization",
    module: "grand-king-continuous-intelligence-optimization",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        actorId: { type: "string" },
        ownerId: { type: "string" },
        optimizationId: { type: "string" },
      },
      required: ["actorId", "optimizationId"],
    },
    handler: async (args) =>
      executeOptimization({
        actorId: String(args.actorId),
        ownerId: String(args.ownerId ?? "grand-king"),
        workspaceId: "ws_empire_1",
        optimizationId: String(args.optimizationId),
        pillowGovernance: true,
      }),
  },
];
