import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { SupplierProductInputSchema } from "../../commerce-intelligence-studio/models/commercial-review.js";
import { buildGlobalMarketplaceDistributionDashboard } from "../services/global-marketplace-distribution-dashboard-service.js";
import { buildGlobalMarketplaceOperations, getCountryOperationsView } from "../services/country-marketplace-operations-service.js";
import { buildGlobalDistributionPlan } from "../services/global-product-distribution-engine-service.js";
import {
  buildGlobalDistributionExecutiveDebate,
  recordGlobalDistributionKingDecision,
} from "../services/global-distribution-executive-debate-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerGlobalMarketplaceOperationsRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get("/global-marketplace-operations/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    const dashboard = buildGlobalMarketplaceDistributionDashboard(user.workspaceId, query.companyId);
    return reply.send({ dashboard });
  });

  app.get("/global-marketplace-operations/operations", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    const operations = buildGlobalMarketplaceOperations(user.workspaceId, query.companyId);
    return reply.send({ operations });
  });

  app.get("/global-marketplace-operations/country/:countryCode", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ countryCode: z.string().min(2) }).parse(request.params);
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    const country = getCountryOperationsView(user.workspaceId, query.companyId, params.countryCode.toUpperCase());
    if (!country) return reply.code(404).send({ error: "Country not found" });
    return reply.send({ country });
  });

  app.post("/global-marketplace-operations/distribution-plan", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({
      companyId: z.string().default("co-grand-king"),
      productId: z.string().min(1),
    }).merge(SupplierProductInputSchema).parse(request.body);
    const { companyId, productId, ...product } = body;
    const plan = buildGlobalDistributionPlan(user.workspaceId, companyId, product, productId);
    return reply.code(201).send({ plan });
  });

  app.post("/global-marketplace-operations/distribution-debate", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({
      companyId: z.string().default("co-grand-king"),
      productId: z.string().min(1),
    }).merge(SupplierProductInputSchema).parse(request.body);
    const { companyId, productId, ...product } = body;
    const plan = buildGlobalDistributionPlan(user.workspaceId, companyId, product, productId);
    const debate = buildGlobalDistributionExecutiveDebate(user.workspaceId, companyId, plan);
    return reply.code(201).send({ plan, debate });
  });

  app.post("/global-marketplace-operations/king-decision", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({
      debate: z.record(z.unknown()),
      decision: z.enum(["APPROVE", "REJECT", "REQUEST_FURTHER_INVESTIGATION"]),
      rationale: z.string().optional(),
    }).parse(request.body);
    const debate = recordGlobalDistributionKingDecision(
      body.debate as Parameters<typeof recordGlobalDistributionKingDecision>[0],
      body.decision,
      body.rationale,
    );
    auditLogger.write({
      action: "executive_council.debate",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { decision: body.decision, missionId: "REAL-012" },
    });
    return reply.send({ debate });
  });

  app.get("/health/global-marketplace-operations", async (_request, reply) => {
    const dashboard = buildGlobalMarketplaceDistributionDashboard("ws_empire_1", "co-grand-king");
    return reply.send({
      status: dashboard.architectureComplete ? "HEALTHY" : "WARNING",
      architecturePercent: dashboard.architecturePercent,
      countries: dashboard.worldOverview.totalCountries,
    });
  });
}
