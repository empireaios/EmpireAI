import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildGlobalCommerceRegistry, getMarketplacesByCountry } from "../services/global-commerce-registry-service.js";
import { buildOrLoadGlobalCommerceIdentity, getGlobalCommerceIdentity } from "../services/global-commerce-identity-service.js";
import { computeOnboardingReadiness, computeCountryOnboardingBatch } from "../services/onboarding-readiness-service.js";
import { createGlobalExpansionPlan, getLatestExpansionPlan } from "../services/global-expansion-planner-service.js";
import { buildGlobalCommerceDashboard } from "../services/global-commerce-dashboard-service.js";
import { ExpansionPlanInputSchema } from "../models/expansion-plan.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerGlobalCommerceRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get("/global-commerce/registry", { preHandler: authenticate }, async (_request, reply) => {
    return reply.send({ registry: buildGlobalCommerceRegistry() });
  });

  app.get("/global-commerce/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    const dashboard = buildGlobalCommerceDashboard(user.workspaceId, query.companyId);
    return reply.send({ dashboard });
  });

  app.get("/global-commerce/identity", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    const identity = getGlobalCommerceIdentity(user.workspaceId, query.companyId)
      ?? buildOrLoadGlobalCommerceIdentity({ workspaceId: user.workspaceId, companyId: query.companyId });
    return reply.send({ identity });
  });

  app.get("/global-commerce/onboarding", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1), countryCode: z.string().min(2), providerId: z.string().optional() }).parse(request.query);
    if (query.providerId) {
      const readiness = computeOnboardingReadiness(user.workspaceId, query.companyId, query.countryCode, query.providerId);
      return reply.send({ readiness });
    }
    const batch = computeCountryOnboardingBatch(user.workspaceId, query.companyId, query.countryCode);
    return reply.send({ countryCode: query.countryCode, onboarding: batch });
  });

  app.get("/global-commerce/countries/:countryCode/marketplaces", { preHandler: authenticate }, async (request, reply) => {
    const params = z.object({ countryCode: z.string().min(2) }).parse(request.params);
    return reply.send({ marketplaces: getMarketplacesByCountry(params.countryCode) });
  });

  app.post("/global-commerce/expansion/plan", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ companyId: z.string().min(1) }).merge(ExpansionPlanInputSchema).parse(request.body);
    const plan = createGlobalExpansionPlan(user.workspaceId, body.companyId, body);

    auditLogger.write({
      action: "global_commerce.expansion.planned",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { planId: plan.planId, productCategory: plan.productCategory, countries: plan.launchSequence.length },
    });

    return reply.send({ plan });
  });

  app.get("/global-commerce/expansion/plan", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    const plan = getLatestExpansionPlan(user.workspaceId, query.companyId);
    return reply.send({ plan });
  });
}
