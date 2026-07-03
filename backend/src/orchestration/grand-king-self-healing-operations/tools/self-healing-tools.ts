/**
 * G7-08 — Grand King Self-Healing Brain tools.
 */

import type { RegisteredTool } from "../../../brain/types.js";
import { buildCockpitSelfHealingView } from "../contracts/self-healing-cockpit-contracts.js";
import {
  executeHealingAction,
  generateHealingRecommendations,
  getHealingAction,
  getSelfHealingOverview,
  getSelfHealingStatus,
  initializeSelfHealingOperations,
  listHealingActions,
  pauseHealingAction,
} from "../services/grand-king-self-healing-operations-service.js";
import {
  buildExecutiveHealingDashboard,
  getExecutiveSelfHealingSummary,
} from "../services/executive-healing-dashboard.js";
import {
  buildHealingQueue,
  computeSelfHealingStatistics,
  computeRecoveryConfidenceSummary,
} from "../services/healing-execution-monitor.js";
import { listHealingHistory } from "../services/healing-action-store.js";
import { detectHealthDegradation } from "../services/health-degradation-detector.js";
import { resolveSelfHealingDependencies } from "../registry/self-healing-registry-resolver.js";

export const grandKingSelfHealingOperationsTools: RegisteredTool[] = [
  {
    name: "self_healing_overview",
    description: "G7-08 — Self-healing overview and Cockpit view",
    module: "grand-king-self-healing-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => {
      const overview = getSelfHealingOverview();
      const dashboard = buildExecutiveHealingDashboard();
      const summary = getExecutiveSelfHealingSummary();
      return {
        overview,
        cockpitView: buildCockpitSelfHealingView({
          overview,
          queue: dashboard.queue,
          confidence: dashboard.confidence,
          recommendations: dashboard.recommendations,
          activeRecoveries: dashboard.activeRecoveries,
          history: dashboard.history,
          executiveSummary: summary,
        }),
      };
    },
  },
  {
    name: "self_healing_status",
    description: "G7-08 — Self-healing framework status",
    module: "grand-king-self-healing-operations",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { healingId: { type: "string" } },
    },
    handler: async (args) => {
      if (args.healingId) {
        const action = getHealingAction(String(args.healingId));
        return action ? { action } : { error: "Healing action not found" };
      }
      return getSelfHealingStatus();
    },
  },
  {
    name: "self_healing_history",
    description: "G7-08 — Self-healing execution history",
    module: "grand-king-self-healing-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ history: listHealingHistory() }),
  },
  {
    name: "self_healing_recommendations",
    description: "G7-08 — Healing recommendations",
    module: "grand-king-self-healing-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({
      recommendations: generateHealingRecommendations(),
      degradations: detectHealthDegradation(),
    }),
  },
  {
    name: "self_healing_execute",
    description: "G7-08 — Execute approved healing action",
    module: "grand-king-self-healing-operations",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        actorId: { type: "string" },
        ownerId: { type: "string" },
        healingId: { type: "string" },
      },
      required: ["actorId", "healingId"],
    },
    handler: async (args) =>
      executeHealingAction({
        actorId: String(args.actorId),
        ownerId: String(args.ownerId ?? "grand-king"),
        workspaceId: "ws_empire_1",
        healingId: String(args.healingId),
        pillowGovernance: true,
      }),
  },
  {
    name: "self_healing_pause",
    description: "G7-08 — Pause healing action",
    module: "grand-king-self-healing-operations",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        actorId: { type: "string" },
        ownerId: { type: "string" },
        healingId: { type: "string" },
      },
      required: ["actorId", "healingId"],
    },
    handler: async (args) =>
      pauseHealingAction({
        actorId: String(args.actorId),
        ownerId: String(args.ownerId ?? "grand-king"),
        workspaceId: "ws_empire_1",
        healingId: String(args.healingId),
        pillowGovernance: true,
      }),
  },
  {
    name: "self_healing_statistics",
    description: "G7-08 — Self-healing statistics",
    module: "grand-king-self-healing-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({
      statistics: computeSelfHealingStatistics(),
      confidence: computeRecoveryConfidenceSummary(listHealingActions()),
      queue: buildHealingQueue(),
    }),
  },
  {
    name: "self_healing_summary",
    description: "G7-08 — Executive self-healing summary",
    module: "grand-king-self-healing-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ summary: getExecutiveSelfHealingSummary() }),
  },
  {
    name: "initialize_grand_king_self_healing_operations",
    description: "G7-08 — Initialize self-healing operations",
    module: "grand-king-self-healing-operations",
    authorityLevel: "L2",
    parameters: { type: "object", properties: {} },
    handler: async () => initializeSelfHealingOperations(),
  },
  {
    name: "self_healing_dependencies",
    description: "G7-08 — Self-healing registry dependencies",
    module: "grand-king-self-healing-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => resolveSelfHealingDependencies(),
  },
];
