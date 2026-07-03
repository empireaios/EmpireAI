/**
 * G7-02 — Grand King commerce operations Brain tools.
 */

import type { RegisteredTool } from "../../../brain/types.js";
import { buildCockpitCommerceOperationsView } from "../contracts/commerce-operations-cockpit-contracts.js";
import {
  getCommerceOperation,
  getCommerceOperationDependencies,
  getCommerceOperationHealth,
  getCommerceOperationSummary,
  getCommerceOperationsOverview,
  getExecutiveCommerceDashboard,
  initializeCommerceOperations,
  listCommerceOperations,
  pauseCommerceOperation,
  resumeCommerceOperation,
  startCommerceOperation,
  stopCommerceOperation,
} from "../services/grand-king-commerce-operations-service.js";

export const grandKingCommerceOperationsTools: RegisteredTool[] = [
  {
    name: "commerce_operations_overview",
    description: "G7-02 — Grand King commerce operations overview and Cockpit view",
    module: "grand-king-commerce-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" } } },
    handler: async () => {
      const overview = getCommerceOperationsOverview();
      const operations = listCommerceOperations();
      const dependencies = getCommerceOperationDependencies();
      const dashboard = getExecutiveCommerceDashboard();
      const summary = getCommerceOperationSummary();
      return {
        overview,
        cockpitView: buildCockpitCommerceOperationsView({
          overview,
          operations,
          ...dashboard,
          dependencies,
          executiveSummary: summary,
        }),
      };
    },
  },
  {
    name: "commerce_operation_status",
    description: "G7-02 — Commerce operation status by operationId",
    module: "grand-king-commerce-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { operationId: { type: "string" } }, required: ["operationId"] },
    handler: async (args) => {
      const operation = getCommerceOperation(String(args.operationId));
      if (!operation) return { error: "Commerce operation not found" };
      return { operation };
    },
  },
  {
    name: "start_commerce_operation",
    description: "G7-02 — Start a commerce operation",
    module: "grand-king-commerce-operations",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { actorId: { type: "string" }, ownerId: { type: "string" }, operationId: { type: "string" } },
      required: ["actorId", "operationId"],
    },
    handler: async (args) =>
      startCommerceOperation({
        actorId: String(args.actorId),
        ownerId: String(args.ownerId ?? "grand-king"),
        operationId: String(args.operationId),
        pillowGovernance: true,
      }),
  },
  {
    name: "pause_commerce_operation",
    description: "G7-02 — Pause a commerce operation",
    module: "grand-king-commerce-operations",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { actorId: { type: "string" }, ownerId: { type: "string" }, operationId: { type: "string" } },
      required: ["actorId", "operationId"],
    },
    handler: async (args) =>
      pauseCommerceOperation({
        actorId: String(args.actorId),
        ownerId: String(args.ownerId ?? "grand-king"),
        operationId: String(args.operationId),
        pillowGovernance: true,
      }),
  },
  {
    name: "resume_commerce_operation",
    description: "G7-02 — Resume a commerce operation",
    module: "grand-king-commerce-operations",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { actorId: { type: "string" }, ownerId: { type: "string" }, operationId: { type: "string" } },
      required: ["actorId", "operationId"],
    },
    handler: async (args) =>
      resumeCommerceOperation({
        actorId: String(args.actorId),
        ownerId: String(args.ownerId ?? "grand-king"),
        operationId: String(args.operationId),
        pillowGovernance: true,
      }),
  },
  {
    name: "stop_commerce_operation",
    description: "G7-02 — Stop a commerce operation",
    module: "grand-king-commerce-operations",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { actorId: { type: "string" }, ownerId: { type: "string" }, operationId: { type: "string" } },
      required: ["actorId", "operationId"],
    },
    handler: async (args) =>
      stopCommerceOperation({
        actorId: String(args.actorId),
        ownerId: String(args.ownerId ?? "grand-king"),
        operationId: String(args.operationId),
        pillowGovernance: true,
      }),
  },
  {
    name: "commerce_operation_health",
    description: "G7-02 — Commerce operation health",
    module: "grand-king-commerce-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { operationId: { type: "string" } }, required: ["operationId"] },
    handler: async (args) => getCommerceOperationHealth(String(args.operationId)),
  },
  {
    name: "commerce_operation_dependencies",
    description: "G7-02 — Commerce operation registry dependencies",
    module: "grand-king-commerce-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => getCommerceOperationDependencies(),
  },
  {
    name: "commerce_operation_summary",
    description: "G7-02 — Grand King commerce operations executive summary",
    module: "grand-king-commerce-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ summary: getCommerceOperationSummary() }),
  },
  {
    name: "initialize_grand_king_commerce_operations",
    description: "G7-02 — Initialize commerce operations from registry",
    module: "grand-king-commerce-operations",
    authorityLevel: "L2",
    parameters: { type: "object", properties: {} },
    handler: async () => initializeCommerceOperations(),
  },
];
