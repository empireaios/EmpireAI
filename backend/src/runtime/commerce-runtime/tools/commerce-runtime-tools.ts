import type { RegisteredTool } from "../../../brain/types.js";
import { RuntimeOperationSchema } from "../models/execution-request.js";
import { buildCommerceRuntimeDashboard } from "../services/commerce-runtime-dashboard-service.js";
import { resolveCapabilities } from "../services/capability-resolver-service.js";
import { createExecutionPlan } from "../services/execution-planner-service.js";
import { normalizeExecutionRequest } from "../services/execution-pipeline-service.js";
import { dispatchPlanById } from "../services/runtime-dispatcher-service.js";
import { publishRuntimeEvent } from "../services/runtime-event-bus-service.js";
import { buildRuntimeRegistry } from "../services/runtime-registry-service.js";
import { inspectCommerceRuntime } from "../services/runtime-inspector-service.js";
import { buildPluginRegistrySnapshot, dispatchViaPlugin } from "../services/plugin-dispatch-service.js";
import { buildRuntimeHealthReport } from "../services/runtime-health-service.js";

export const commerceRuntimeTools: RegisteredTool[] = [
  {
    name: "commerce_runtime.dashboard",
    description: "Commerce Runtime dashboard — health, adapters, queue, plans, capability coverage (CRT-001)",
    module: "commerce-runtime",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
      required: ["companyId"],
    },
    handler: async (args) =>
      buildCommerceRuntimeDashboard(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
      ),
  },
  {
    name: "commerce_runtime.health",
    description: "Commerce Runtime health report — runtime, adapters, kernels, execution, events",
    module: "commerce-runtime",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
      required: ["companyId"],
    },
    handler: async (args) =>
      buildRuntimeHealthReport(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
      ),
  },
  {
    name: "commerce_runtime.registry",
    description: "List registered marketplace, supplier, payment, advertising, logistics, analytics, and agent adapters",
    module: "commerce-runtime",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => buildRuntimeRegistry(),
  },
  {
    name: "commerce_runtime.capabilities.resolve",
    description: "Resolve adapter capability support for a runtime operation — planning only",
    module: "commerce-runtime",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { operation: { type: "string" } },
      required: ["operation"],
    },
    handler: async (args) => resolveCapabilities(RuntimeOperationSchema.parse(args.operation)),
  },
  {
    name: "commerce_runtime.plan.create",
    description: "Create deterministic execution plan — blocked, planning only (CRT-001)",
    module: "commerce-runtime",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        operation: { type: "string" },
        businessId: { type: "string" },
        productId: { type: "string" },
        marketplaceId: { type: "string" },
        supplierId: { type: "string" },
      },
      required: ["companyId", "operation"],
    },
    handler: async (args) =>
      createExecutionPlan({
        workspaceId: args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        companyId: String(args.companyId),
        operation: RuntimeOperationSchema.parse(args.operation),
        businessId: args.businessId ? String(args.businessId) : undefined,
        productId: args.productId ? String(args.productId) : undefined,
        marketplaceId: args.marketplaceId ? String(args.marketplaceId) : undefined,
        supplierId: args.supplierId ? String(args.supplierId) : undefined,
      }),
  },
  {
    name: "commerce_runtime.pipeline.normalize",
    description: "Normalize runtime request and route to kernel — execution blocked",
    module: "commerce-runtime",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        operation: { type: "string" },
        businessId: { type: "string" },
        productId: { type: "string" },
        marketplaceId: { type: "string" },
        supplierId: { type: "string" },
      },
      required: ["companyId", "operation"],
    },
    handler: async (args) =>
      normalizeExecutionRequest({
        workspaceId: args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        companyId: String(args.companyId),
        operation: RuntimeOperationSchema.parse(args.operation),
        businessId: args.businessId ? String(args.businessId) : undefined,
        productId: args.productId ? String(args.productId) : undefined,
        marketplaceId: args.marketplaceId ? String(args.marketplaceId) : undefined,
        supplierId: args.supplierId ? String(args.supplierId) : undefined,
      }),
  },
  {
    name: "commerce_runtime.dispatch",
    description: "Route approved plan to adapter interfaces — no live execution (CRT-001)",
    module: "commerce-runtime",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        planId: { type: "string" },
      },
      required: ["companyId", "planId"],
    },
    handler: async (args) => {
      const dispatch = dispatchPlanById(
        String(args.planId),
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
      );
      if (!dispatch) return { error: "Plan not found" };
      return dispatch;
    },
  },
  {
    name: "commerce_runtime.event.publish",
    description: "Publish universal commerce runtime event — COS event envelope, SIMULATED by default",
    module: "commerce-runtime",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        eventType: { type: "string" },
        adapterId: { type: "string" },
        payload: { type: "object" },
        verification: { type: "string", enum: ["REAL", "SIMULATED"] },
      },
      required: ["companyId", "eventType", "adapterId"],
    },
    handler: async (args) =>
      publishRuntimeEvent({
        eventType: args.eventType as Parameters<typeof publishRuntimeEvent>[0]["eventType"],
        workspaceId: args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        companyId: String(args.companyId),
        adapterId: String(args.adapterId),
        payload: (args.payload as Record<string, unknown>) ?? {},
        verification: (args.verification as "REAL" | "SIMULATED") ?? "SIMULATED",
      }),
  },
  {
    name: "commerce_runtime.inspect",
    description: "ESIS-compatible Commerce Runtime inspection payload",
    module: "commerce-runtime",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
      },
      required: ["companyId"],
    },
    handler: async (args) =>
      inspectCommerceRuntime(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
      ),
  },
  {
    name: "commerce_runtime.plugins.list",
    description: "List registered runtime plugins with health and capability coverage (B-004)",
    module: "commerce-runtime",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => buildPluginRegistrySnapshot(),
  },
  {
    name: "commerce_runtime.plugins.dispatch",
    description: "Plugin-aware dispatch — resolves plugin, validates capability, returns BLOCKED (B-005)",
    module: "commerce-runtime",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        operation: { type: "string" },
        pluginId: { type: "string" },
        productId: { type: "string" },
        marketplaceId: { type: "string" },
      },
      required: ["companyId", "operation"],
    },
    handler: async (args) =>
      dispatchViaPlugin({
        workspaceId: args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        companyId: String(args.companyId),
        operation: RuntimeOperationSchema.parse(args.operation),
        pluginId: args.pluginId ? String(args.pluginId) : undefined,
        productId: args.productId ? String(args.productId) : undefined,
        marketplaceId: args.marketplaceId ? String(args.marketplaceId) : undefined,
      }),
  },
];
