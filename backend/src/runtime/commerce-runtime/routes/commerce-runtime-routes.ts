import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { RuntimeOperationSchema } from "../models/execution-request.js";
import { buildCommerceRuntimeDashboard } from "../services/commerce-runtime-dashboard-service.js";
import { resolveCapabilities } from "../services/capability-resolver-service.js";
import { createExecutionPlan, listPendingPlans } from "../services/execution-planner-service.js";
import { normalizeExecutionRequest } from "../services/execution-pipeline-service.js";
import { dispatchPlanById } from "../services/runtime-dispatcher-service.js";
import { listRuntimeEvents, publishRuntimeEvent } from "../services/runtime-event-bus-service.js";
import { buildRuntimeRegistry } from "../services/runtime-registry-service.js";
import { inspectCommerceRuntime } from "../services/runtime-inspector-service.js";
import { buildRuntimeHealthReport } from "../services/runtime-health-service.js";
import {
  buildPluginRegistrySnapshot,
  dispatchViaPlugin,
  lookupPluginCapabilitySupport,
} from "../services/plugin-dispatch-service.js";
import { getRuntimePluginRegistry } from "../../plugins/index.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerCommerceRuntimeRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get("/commerce-runtime/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    const dashboard = buildCommerceRuntimeDashboard(user.workspaceId, query.companyId);
    return reply.send({ dashboard });
  });

  app.get("/commerce-runtime/health", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    const health = buildRuntimeHealthReport(user.workspaceId, query.companyId);
    return reply.send({ health });
  });

  app.get("/commerce-runtime/registry", { preHandler: authenticate }, async (_request, reply) => {
    const registry = buildRuntimeRegistry();
    return reply.send({ registry });
  });

  app.get("/commerce-runtime/inspect", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    const inspection = inspectCommerceRuntime(user.workspaceId, query.companyId);
    return reply.send({ inspection });
  });

  app.get("/commerce-runtime/capabilities", { preHandler: authenticate }, async (request, reply) => {
    const query = z.object({ operation: RuntimeOperationSchema }).parse(request.query);
    const resolution = resolveCapabilities(query.operation);
    return reply.send({ resolution });
  });

  app.get("/commerce-runtime/plans", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    const plans = listPendingPlans(user.workspaceId, query.companyId);
    return reply.send({ plans, total: plans.length });
  });

  app.post("/commerce-runtime/plan", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z
      .object({
        companyId: z.string().min(1),
        operation: RuntimeOperationSchema,
        businessId: z.string().optional(),
        productId: z.string().optional(),
        marketplaceId: z.string().optional(),
        supplierId: z.string().optional(),
      })
      .parse(request.body);

    const plan = createExecutionPlan({
      workspaceId: user.workspaceId,
      companyId: body.companyId,
      operation: body.operation,
      businessId: body.businessId,
      productId: body.productId,
      marketplaceId: body.marketplaceId,
      supplierId: body.supplierId,
    });

    auditLogger.write({
      action: "commerce_runtime.plan.created",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { planId: plan.planId, operation: plan.operation, status: plan.status },
    });

    return reply.send({ plan });
  });

  app.post("/commerce-runtime/pipeline", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z
      .object({
        companyId: z.string().min(1),
        operation: RuntimeOperationSchema,
        businessId: z.string().optional(),
        productId: z.string().optional(),
        marketplaceId: z.string().optional(),
        supplierId: z.string().optional(),
        payload: z.record(z.unknown()).optional(),
      })
      .parse(request.body);

    const result = normalizeExecutionRequest({
      workspaceId: user.workspaceId,
      companyId: body.companyId,
      operation: body.operation,
      businessId: body.businessId,
      productId: body.productId,
      marketplaceId: body.marketplaceId,
      supplierId: body.supplierId,
      payload: body.payload,
      correlationId: request.id,
    });

    auditLogger.write({
      action: "commerce_runtime.pipeline.normalized",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { requestId: result.request.requestId, kernel: result.routedKernel },
    });

    return reply.send({ result });
  });

  app.post("/commerce-runtime/dispatch", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ companyId: z.string().min(1), planId: z.string().min(1) }).parse(request.body);
    const dispatch = dispatchPlanById(body.planId, user.workspaceId, body.companyId);
    if (!dispatch) {
      return reply.code(404).send({ error: "Plan not found" });
    }

    auditLogger.write({
      action: "commerce_runtime.dispatch.blocked",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { planId: body.planId, dispatchId: dispatch.dispatchId },
    });

    return reply.send({ dispatch });
  });

  app.post("/commerce-runtime/events/publish", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z
      .object({
        companyId: z.string().min(1),
        eventType: z.string().min(1),
        adapterId: z.string().min(1),
        entityRefs: z.array(z.object({ type: z.string(), id: z.string() })).optional(),
        payload: z.record(z.unknown()).optional(),
        verification: z.enum(["REAL", "SIMULATED"]).optional(),
      })
      .parse(request.body);

    const event = publishRuntimeEvent({
      eventType: body.eventType as Parameters<typeof publishRuntimeEvent>[0]["eventType"],
      workspaceId: user.workspaceId,
      companyId: body.companyId,
      adapterId: body.adapterId,
      entityRefs: body.entityRefs,
      payload: body.payload,
      verification: body.verification,
      correlationId: request.id,
    });

    auditLogger.write({
      action: "commerce_runtime.event.processed",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { eventId: event.eventId, eventType: event.eventType },
    });

    return reply.send({ event });
  });

  app.get("/commerce-runtime/events", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z
      .object({ companyId: z.string().min(1), limit: z.coerce.number().int().min(1).max(100).optional() })
      .parse(request.query);
    const events = listRuntimeEvents(user.workspaceId, query.companyId, query.limit ?? 25);
    return reply.send({ events, total: events.length });
  });

  app.get("/commerce-runtime/plugins", { preHandler: authenticate }, async (_request, reply) => {
    const snapshot = buildPluginRegistrySnapshot();
    return reply.send({ snapshot });
  });

  app.get("/commerce-runtime/plugins/capabilities", { preHandler: authenticate }, async (request, reply) => {
    const query = z.object({ capabilityId: z.string().min(1) }).parse(request.query);
    const matches = lookupPluginCapabilitySupport(query.capabilityId);
    return reply.send({ capabilityId: query.capabilityId, matches });
  });

  app.post("/commerce-runtime/plugins/dispatch", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z
      .object({
        companyId: z.string().min(1),
        operation: RuntimeOperationSchema,
        pluginId: z.string().optional(),
        businessId: z.string().optional(),
        productId: z.string().optional(),
        marketplaceId: z.string().optional(),
      })
      .parse(request.body);

    const dispatch = dispatchViaPlugin({
      workspaceId: user.workspaceId,
      companyId: body.companyId,
      operation: body.operation,
      pluginId: body.pluginId,
      businessId: body.businessId,
      productId: body.productId,
      marketplaceId: body.marketplaceId,
    });

    auditLogger.write({
      action: "commerce_runtime.plugin.dispatch",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { pluginId: dispatch.pluginId, outcome: dispatch.outcome, capabilityId: dispatch.capabilityId },
    });

    return reply.send({ dispatch });
  });

  app.post("/commerce-runtime/plugins/:pluginId/enable", { preHandler: authenticate }, async (request, reply) => {
    const params = z.object({ pluginId: z.string().min(1) }).parse(request.params);
    const enabled = getRuntimePluginRegistry().enable(params.pluginId);
    if (!enabled) return reply.code(404).send({ error: "Plugin not found" });
    return reply.send({ pluginId: params.pluginId, enabled: true });
  });

  app.post("/commerce-runtime/plugins/:pluginId/disable", { preHandler: authenticate }, async (request, reply) => {
    const params = z.object({ pluginId: z.string().min(1) }).parse(request.params);
    const disabled = getRuntimePluginRegistry().disable(params.pluginId);
    if (!disabled) return reply.code(404).send({ error: "Plugin not found" });
    return reply.send({ pluginId: params.pluginId, enabled: false });
  });
}
