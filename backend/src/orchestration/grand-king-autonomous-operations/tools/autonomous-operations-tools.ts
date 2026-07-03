/**
 * G7-07 — Grand King Autonomous Operations Brain tools.
 */

import type { RegisteredTool } from "../../../brain/types.js";
import { buildCockpitAutonomousOperationsView } from "../contracts/autonomous-operations-cockpit-contracts.js";
import {
  cancelAutonomousOperation,
  getAutonomousOperation,
  getAutonomousOperationStatus,
  getAutonomousOperationsOverview,
  initializeAutonomousOperations,
  listAutonomousOperations,
  pauseAutonomousOperation,
  resumeAutonomousOperation,
} from "../services/grand-king-autonomous-operations-service.js";
import {
  buildExecutiveAutonomyDashboard,
  getExecutiveAutonomySummary,
} from "../services/executive-autonomy-dashboard.js";
import { buildAutonomousQueue, monitorAutonomousOperations } from "../services/autonomous-execution-monitor.js";
import { listAutonomousOperationHistory } from "../services/autonomous-operation-store.js";
import { routeAutonomousDecisions } from "../services/autonomous-decision-router.js";
import { resolveAutonomousOperationDependencies } from "../registry/autonomous-operations-registry-resolver.js";

export const grandKingAutonomousOperationsTools: RegisteredTool[] = [
  {
    name: "autonomous_operations_overview",
    description: "G7-07 — Grand King autonomous operations overview and Cockpit view",
    module: "grand-king-autonomous-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => {
      const overview = getAutonomousOperationsOverview();
      const dashboard = buildExecutiveAutonomyDashboard();
      const summary = getExecutiveAutonomySummary();
      return {
        overview,
        cockpitView: buildCockpitAutonomousOperationsView({
          overview,
          queue: dashboard.queue,
          health: dashboard.health,
          recommendations: dashboard.recommendations,
          history: dashboard.history,
          operations: dashboard.operations,
          executiveSummary: summary,
        }),
      };
    },
  },
  {
    name: "autonomous_operation_status",
    description: "G7-07 — Autonomous operation status",
    module: "grand-king-autonomous-operations",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { autonomousOperationId: { type: "string" } },
    },
    handler: async (args) => {
      if (args.autonomousOperationId) {
        const operation = getAutonomousOperation(String(args.autonomousOperationId));
        return operation ? { operation } : { error: "Operation not found" };
      }
      return getAutonomousOperationStatus();
    },
  },
  {
    name: "autonomous_operation_queue",
    description: "G7-07 — Autonomous operation queue",
    module: "grand-king-autonomous-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ queue: buildAutonomousQueue() }),
  },
  {
    name: "autonomous_operation_history",
    description: "G7-07 — Autonomous operation history",
    module: "grand-king-autonomous-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ history: listAutonomousOperationHistory() }),
  },
  {
    name: "autonomous_operation_health",
    description: "G7-07 — Autonomous operation health monitor",
    module: "grand-king-autonomous-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => monitorAutonomousOperations(),
  },
  {
    name: "autonomous_operation_pause",
    description: "G7-07 — Pause autonomous operation",
    module: "grand-king-autonomous-operations",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        actorId: { type: "string" },
        ownerId: { type: "string" },
        autonomousOperationId: { type: "string" },
      },
      required: ["actorId", "autonomousOperationId"],
    },
    handler: async (args) =>
      pauseAutonomousOperation({
        actorId: String(args.actorId),
        ownerId: String(args.ownerId ?? "grand-king"),
        workspaceId: "ws_empire_1",
        autonomousOperationId: String(args.autonomousOperationId),
        pillowGovernance: true,
      }),
  },
  {
    name: "autonomous_operation_resume",
    description: "G7-07 — Resume autonomous operation",
    module: "grand-king-autonomous-operations",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        actorId: { type: "string" },
        ownerId: { type: "string" },
        autonomousOperationId: { type: "string" },
      },
      required: ["actorId", "autonomousOperationId"],
    },
    handler: async (args) =>
      resumeAutonomousOperation({
        actorId: String(args.actorId),
        ownerId: String(args.ownerId ?? "grand-king"),
        workspaceId: "ws_empire_1",
        autonomousOperationId: String(args.autonomousOperationId),
        pillowGovernance: true,
      }),
  },
  {
    name: "autonomous_operation_cancel",
    description: "G7-07 — Cancel autonomous operation",
    module: "grand-king-autonomous-operations",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        actorId: { type: "string" },
        ownerId: { type: "string" },
        autonomousOperationId: { type: "string" },
      },
      required: ["actorId", "autonomousOperationId"],
    },
    handler: async (args) =>
      cancelAutonomousOperation({
        actorId: String(args.actorId),
        ownerId: String(args.ownerId ?? "grand-king"),
        workspaceId: "ws_empire_1",
        autonomousOperationId: String(args.autonomousOperationId),
        pillowGovernance: true,
      }),
  },
  {
    name: "autonomous_operation_summary",
    description: "G7-07 — Executive autonomous operations summary",
    module: "grand-king-autonomous-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ summary: getExecutiveAutonomySummary() }),
  },
  {
    name: "initialize_grand_king_autonomous_operations",
    description: "G7-07 — Initialize autonomous operations",
    module: "grand-king-autonomous-operations",
    authorityLevel: "L2",
    parameters: { type: "object", properties: {} },
    handler: async () => initializeAutonomousOperations(),
  },
  {
    name: "autonomous_operation_dependencies",
    description: "G7-07 — Autonomous registry dependencies",
    module: "grand-king-autonomous-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => resolveAutonomousOperationDependencies(),
  },
  {
    name: "autonomous_operation_recommendations",
    description: "G7-07 — Routed autonomous recommendations",
    module: "grand-king-autonomous-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ recommendations: routeAutonomousDecisions() }),
  },
];
