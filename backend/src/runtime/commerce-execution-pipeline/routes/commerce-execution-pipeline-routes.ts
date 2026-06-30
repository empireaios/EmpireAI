import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { SupplierProductInputSchema } from "../../commerce-intelligence-studio/models/commercial-review.js";
import { buildCommerceExecutionPipeline } from "../services/commerce-execution-pipeline-service.js";
import { buildGlobalCommerceExecutionDashboard } from "../services/global-commerce-execution-dashboard-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerCommerceExecutionPipelineRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;

  app.get("/global-commerce-execution/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    const dashboard = buildGlobalCommerceExecutionDashboard(user.workspaceId, query.companyId);
    return reply.send({ dashboard });
  });

  app.get("/commerce-execution-pipeline/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    const dashboard = buildGlobalCommerceExecutionDashboard(user.workspaceId, query.companyId);
    return reply.send({ dashboard });
  });

  app.post("/commerce-execution-pipeline/build", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({
      companyId: z.string().default("co-grand-king"),
      productId: z.string().optional(),
      executiveApproved: z.boolean().default(false),
      kingApproved: z.boolean().default(false),
      marketplaceId: z.enum(["amazon", "shopify"]).default("amazon"),
    }).merge(SupplierProductInputSchema).parse(request.body);
    const { companyId, productId, executiveApproved, kingApproved, marketplaceId, ...product } = body;
    const pipeline = buildCommerceExecutionPipeline(
      user.workspaceId,
      companyId,
      product,
      productId ?? randomUUID(),
      { executiveApproved, kingApproved, marketplaceId },
    );
    return reply.code(201).send({ pipeline });
  });

  app.get("/health/commerce-execution-pipeline", async (_request, reply) => {
    return reply.send({ status: "HEALTHY", governanceEnforced: true, livePublishBlocked: true });
  });
}
