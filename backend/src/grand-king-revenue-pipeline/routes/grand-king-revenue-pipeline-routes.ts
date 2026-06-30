import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../auth/middleware.js";
import { RevenuePipelineStateSchema } from "../models/revenue-state-machine.js";
import { ProductCandidateInputSchema } from "../models/revenue-pipeline-core.js";
import {
  registerProductCandidate,
  transitionProductState,
  listPipelineProducts,
  getRevenuePipelineRuntime,
  getProductTimeline,
  seedRevenuePipeline,
} from "../services/revenue-pipeline-runtime.js";
import { buildProductTimelineSummary } from "../services/revenue-timeline-service.js";
import { buildRevenuePipelineDashboard } from "../services/revenue-pipeline-dashboard-service.js";
import { buildRevenuePipelineHeadquarters } from "../services/revenue-headquarters-service.js";
import { getIntegrationSnapshot } from "../services/revenue-integration-service.js";
import { REVENUE_PIPELINE_LIFECYCLE } from "../models/revenue-state-machine.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerGrandKingRevenuePipelineRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get("/grand-king-revenue-pipeline/runtime", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send({ runtime: getRevenuePipelineRuntime(user.workspaceId, query.companyId) });
  });

  app.get("/grand-king-revenue-pipeline/lifecycle", { preHandler: authenticate }, async (_request, reply) => {
    return reply.send({ lifecycle: REVENUE_PIPELINE_LIFECYCLE });
  });

  app.get("/grand-king-revenue-pipeline/products", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send({ products: listPipelineProducts(user.workspaceId, query.companyId) });
  });

  app.post("/grand-king-revenue-pipeline/products", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ companyId: z.string().min(1) }).merge(ProductCandidateInputSchema).parse(request.body);
    const { companyId, ...input } = body;
    const product = registerProductCandidate(user.workspaceId, companyId, input);
    return reply.code(201).send({ product });
  });

  app.post("/grand-king-revenue-pipeline/products/:productId/transition", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ productId: z.string().min(1) }).parse(request.params);
    const body = z.object({ companyId: z.string().min(1), toState: RevenuePipelineStateSchema, reason: z.string().optional() }).parse(request.body);
    const product = transitionProductState(user.workspaceId, body.companyId, params.productId, body.toState, body.reason ?? "Manual transition");

    auditLogger.write({
      action: "grand_king_revenue_pipeline.transition",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { productId: params.productId, toState: body.toState },
    });

    return reply.send({ product });
  });

  app.get("/grand-king-revenue-pipeline/products/:productId/timeline", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ productId: z.string().min(1) }).parse(request.params);
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    const product = listPipelineProducts(user.workspaceId, query.companyId).find((p) => p.productId === params.productId);
    if (!product) return reply.code(404).send({ error: "Product not found" });
    return reply.send({
      timeline: getProductTimeline(user.workspaceId, query.companyId, params.productId),
      summary: buildProductTimelineSummary(product),
    });
  });

  app.get("/grand-king-revenue-pipeline/integrations", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send(getIntegrationSnapshot(user.workspaceId, query.companyId));
  });

  app.get("/grand-king-revenue-pipeline/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    seedRevenuePipeline(user.workspaceId, query.companyId);
    return reply.send({ dashboard: buildRevenuePipelineDashboard(user.workspaceId, query.companyId) });
  });

  app.get("/grand-king-revenue-pipeline/headquarters", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send({ dashboard: buildRevenuePipelineHeadquarters(user.workspaceId, query.companyId) });
  });
}
