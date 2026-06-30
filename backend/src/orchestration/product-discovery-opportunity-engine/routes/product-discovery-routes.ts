import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import {
  approveProductOpportunities,
  buildDiscoveryDashboard,
  discoverOpportunitiesForInput,
  getDiscoverySession,
  listDiscoverySessions,
  ProductDiscoverySessionBlockedError,
  ProductDiscoverySessionNotFoundError,
  runProductDiscovery,
  startProductDiscoverySession,
} from "../services/discovery-workflow-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerProductDiscoveryRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get("/product-discovery/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    const dashboard = buildDiscoveryDashboard(user.workspaceId, query.companyId);
    return reply.send({ dashboard });
  });

  app.get("/product-discovery/sessions", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().optional() }).parse(request.query);
    const sessions = listDiscoverySessions(user.workspaceId, query.companyId);
    return reply.send({ sessions, total: sessions.length });
  });

  app.get("/product-discovery/sessions/:sessionId", { preHandler: authenticate }, async (request, reply) => {
    const params = z.object({ sessionId: z.string().min(1) }).parse(request.params);
    const session = getDiscoverySession(params.sessionId);
    if (!session) {
      return reply.code(404).send({ error: "Discovery session not found" });
    }
    return reply.send({ session });
  });

  app.post("/product-discovery/sessions/start", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z
      .object({
        companyId: z.string().min(1),
        brand: z.string().min(1),
        category: z.string().min(1),
        targetMarket: z.string().optional(),
        budgetCents: z.number().int().min(0).optional(),
        existingSupplierNetwork: z.array(z.string()).optional(),
      })
      .parse(request.body);

    const session = startProductDiscoverySession({
      workspaceId: user.workspaceId,
      companyId: body.companyId,
      brand: body.brand,
      category: body.category,
      targetMarket: body.targetMarket ?? "US",
      budgetCents: body.budgetCents,
      existingSupplierNetwork: body.existingSupplierNetwork ?? ["cj-dropshipping"],
      actor: user.email,
    });

    auditLogger.write({
      action: "product_discovery.session_started",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { sessionId: session.sessionId, brand: body.brand, category: body.category },
    });

    return reply.code(201).send({ session });
  });

  app.post("/product-discovery/sessions/:sessionId/discover", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ sessionId: z.string().min(1) }).parse(request.params);

    try {
      const session = runProductDiscovery(params.sessionId);
      auditLogger.write({
        action: "product_discovery.discovered",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { sessionId: params.sessionId, count: session.opportunities.length },
      });
      return reply.send({ session });
    } catch (error) {
      if (error instanceof ProductDiscoverySessionNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.post("/product-discovery/sessions/:sessionId/approve", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ sessionId: z.string().min(1) }).parse(request.params);
    const body = z.object({ opportunityIds: z.array(z.string().min(1)).min(1) }).parse(request.body);

    try {
      const session = approveProductOpportunities(params.sessionId, body.opportunityIds, user.email);
      auditLogger.write({
        action: "product_discovery.approved",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { sessionId: params.sessionId, opportunityIds: body.opportunityIds },
      });
      return reply.send({ session });
    } catch (error) {
      if (error instanceof ProductDiscoverySessionNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      if (error instanceof ProductDiscoverySessionBlockedError) {
        return reply.code(409).send({ error: error.message });
      }
      throw error;
    }
  });

  app.post("/product-discovery/discover", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z
      .object({
        companyId: z.string().min(1),
        brand: z.string().min(1),
        category: z.string().min(1),
        targetMarket: z.string().optional(),
        budgetCents: z.number().int().min(0).optional(),
        existingSupplierNetwork: z.array(z.string()).optional(),
      })
      .parse(request.body);

    const opportunities = discoverOpportunitiesForInput({
      workspaceId: user.workspaceId,
      companyId: body.companyId,
      brand: body.brand,
      category: body.category,
      targetMarket: body.targetMarket ?? "US",
      budgetCents: body.budgetCents,
      existingSupplierNetwork: body.existingSupplierNetwork ?? ["cj-dropshipping"],
      actor: user.email,
    });

    auditLogger.write({
      action: "product_discovery.discovered",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { count: opportunities.length, brand: body.brand },
    });

    return reply.send({ opportunities, total: opportunities.length });
  });
}
