import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { getCountryIntelligenceProfile, listCountryIntelligenceProfiles } from "../services/country-intelligence-service.js";
import { buildCommerceEcosystemProfile, listCommerceEcosystemProfiles } from "../services/commerce-ecosystem-service.js";
import { computeExpansionIntelligenceScore, listExpansionIntelligenceScores } from "../services/expansion-intelligence-score-service.js";
import { rankGlobalOpportunities, getLatestOpportunityRanking } from "../services/opportunity-ranking-service.js";
import { buildGlobalCommerceIntelligenceDashboard } from "../services/global-commerce-intelligence-dashboard-service.js";
import { OpportunityRankingInputSchema } from "../models/opportunity-ranking.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerGlobalCommerceIntelligenceRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get("/global-commerce-intelligence/countries", { preHandler: authenticate }, async (_request, reply) => {
    return reply.send({ profiles: listCountryIntelligenceProfiles() });
  });

  app.get("/global-commerce-intelligence/countries/:countryCode", { preHandler: authenticate }, async (request, reply) => {
    const params = z.object({ countryCode: z.string().min(2) }).parse(request.params);
    const profile = getCountryIntelligenceProfile(params.countryCode);
    if (!profile) return reply.status(404).send({ error: "Country not in registry" });
    return reply.send({ profile });
  });

  app.get("/global-commerce-intelligence/ecosystems", { preHandler: authenticate }, async (_request, reply) => {
    return reply.send({ ecosystems: listCommerceEcosystemProfiles() });
  });

  app.get("/global-commerce-intelligence/ecosystems/:countryCode", { preHandler: authenticate }, async (request, reply) => {
    const params = z.object({ countryCode: z.string().min(2) }).parse(request.params);
    const ecosystem = buildCommerceEcosystemProfile(params.countryCode);
    if (!ecosystem) return reply.status(404).send({ error: "Country not in registry" });
    return reply.send({ ecosystem });
  });

  app.get("/global-commerce-intelligence/expansion-scores", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send({ scores: listExpansionIntelligenceScores(user.workspaceId, query.companyId) });
  });

  app.get("/global-commerce-intelligence/expansion-scores/:countryCode", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ countryCode: z.string().min(2) }).parse(request.params);
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    const score = computeExpansionIntelligenceScore(user.workspaceId, query.companyId, params.countryCode);
    if (!score) return reply.status(404).send({ error: "Country not in registry" });
    return reply.send({ score });
  });

  app.post("/global-commerce-intelligence/opportunity/rank", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ companyId: z.string().min(1) }).merge(OpportunityRankingInputSchema).parse(request.body);
    const ranking = rankGlobalOpportunities(user.workspaceId, body.companyId, body);

    auditLogger.write({
      action: "global_commerce_intelligence.opportunity.ranked",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { rankingId: ranking.rankingId, productCategory: ranking.productCategory, countries: ranking.rankedCountries.length },
    });

    return reply.send({ ranking });
  });

  app.get("/global-commerce-intelligence/opportunity/rank", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    const ranking = getLatestOpportunityRanking(user.workspaceId, query.companyId);
    return reply.send({ ranking });
  });

  app.get("/global-commerce-intelligence/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    const dashboard = buildGlobalCommerceIntelligenceDashboard(user.workspaceId, query.companyId);
    return reply.send({ dashboard });
  });
}
