/**
 * G7-00 — Grand King live operations Brain tools.
 */

import type { RegisteredTool } from "../../../brain/types.js";
import { buildCockpitLiveOperationsView } from "../contracts/live-operations-cockpit-contracts.js";
import {
  blockLiveOperation,
  getLastLiveOperationRun,
  getLiveOperation,
  getLiveOperationEvidence,
  getLiveOperationNextActions,
  getLiveOperationRisks,
  getLiveOperationsOverview,
  initializeLiveOperations,
  listLiveOperations,
  pauseLiveOperation,
  resumeLiveOperation,
  startLiveOperation,
} from "../services/live-operations-service.js";

export const grandKingLiveOperationsTools: RegisteredTool[] = [
  {
    name: "live_operations_overview",
    description: "G7-00 — Grand King live operations overview and Cockpit view",
    module: "grand-king-live-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) => {
      const workspaceId = String(args.workspaceId ?? "ws-foundation");
      const overview = getLiveOperationsOverview({ workspaceId });
      const run = getLastLiveOperationRun();
      const nextActions = getLiveOperationNextActions({ workspaceId });
      return { overview, cockpitView: buildCockpitLiveOperationsView({ overview, run, nextActions }) };
    },
  },
  {
    name: "live_operation_status",
    description: "G7-00 — Live operation status for Grand King account",
    module: "grand-king-live-operations",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, operationId: { type: "string" } },
    },
    handler: async (args) => {
      const workspaceId = String(args.workspaceId ?? "ws-foundation");
      if (args.operationId) {
        return { operation: getLiveOperation(String(args.operationId)) };
      }
      initializeLiveOperations({ workspaceId });
      return { operations: listLiveOperations() };
    },
  },
  {
    name: "start_live_operation",
    description: "G7-00 — Start a live operation (requires G6 production eligibility)",
    module: "grand-king-live-operations",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        actorId: { type: "string" },
        operationId: { type: "string" },
        accountHolderId: { type: "string" },
      },
      required: ["workspaceId", "actorId", "operationId"],
    },
    handler: async (args) =>
      startLiveOperation({
        context: { workspaceId: String(args.workspaceId) },
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        operationId: String(args.operationId),
        accountHolderId: String(args.accountHolderId ?? "grand-king"),
        pillowGovernance: true,
      }),
  },
  {
    name: "pause_live_operation",
    description: "G7-00 — Pause an active live operation",
    module: "grand-king-live-operations",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        actorId: { type: "string" },
        operationId: { type: "string" },
      },
      required: ["workspaceId", "actorId", "operationId"],
    },
    handler: async (args) =>
      pauseLiveOperation({
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        operationId: String(args.operationId),
        accountHolderId: String(args.accountHolderId ?? "grand-king"),
        pillowGovernance: true,
      }),
  },
  {
    name: "resume_live_operation",
    description: "G7-00 — Resume a paused live operation",
    module: "grand-king-live-operations",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        actorId: { type: "string" },
        operationId: { type: "string" },
      },
      required: ["workspaceId", "actorId", "operationId"],
    },
    handler: async (args) =>
      resumeLiveOperation({
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        operationId: String(args.operationId),
        accountHolderId: String(args.accountHolderId ?? "grand-king"),
        pillowGovernance: true,
      }),
  },
  {
    name: "block_live_operation",
    description: "G7-00 — Block a live operation",
    module: "grand-king-live-operations",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        actorId: { type: "string" },
        operationId: { type: "string" },
        reason: { type: "string" },
      },
      required: ["workspaceId", "actorId", "operationId", "reason"],
    },
    handler: async (args) =>
      blockLiveOperation({
        actorId: String(args.actorId),
        workspaceId: String(args.workspaceId),
        operationId: String(args.operationId),
        accountHolderId: String(args.accountHolderId ?? "grand-king"),
        reason: String(args.reason),
        pillowGovernance: true,
      }),
  },
  {
    name: "live_operation_evidence",
    description: "G7-00 — Live operation evidence register",
    module: "grand-king-live-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ evidence: getLiveOperationEvidence() }),
  },
  {
    name: "live_operation_risks",
    description: "G7-00 — Live operation risk register",
    module: "grand-king-live-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ risks: getLiveOperationRisks() }),
  },
  {
    name: "live_operation_next_action",
    description: "G7-00 — Recommended next actions for Grand King live operations",
    module: "grand-king-live-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async (args) => ({
      nextActions: getLiveOperationNextActions({ workspaceId: String(args.workspaceId ?? "ws-foundation") }),
    }),
  },
];
