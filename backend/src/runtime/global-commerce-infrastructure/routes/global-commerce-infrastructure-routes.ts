import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildCountryInfrastructureProfile, listCountryInfrastructureProfiles } from "../services/infrastructure-model-service.js";
import { getProviderDependencies, listProviderDependenciesForCountry } from "../services/infrastructure-dependency-service.js";
import { computeInfrastructureReadiness, listInfrastructureReadiness } from "../services/infrastructure-readiness-service.js";
import { buildExpansionDependencyGraph, listExpansionDependencyGraphs } from "../services/expansion-dependency-graph-service.js";
import { buildGlobalCommerceInfrastructureDashboard } from "../services/global-commerce-infrastructure-dashboard-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerGlobalCommerceInfrastructureRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;

  app.get("/global-commerce-infrastructure/countries", { preHandler: authenticate }, async (_request, reply) => {
    return reply.send({ profiles: listCountryInfrastructureProfiles() });
  });

  app.get("/global-commerce-infrastructure/countries/:countryCode", { preHandler: authenticate }, async (request, reply) => {
    const params = z.object({ countryCode: z.string().min(2) }).parse(request.params);
    const profile = buildCountryInfrastructureProfile(params.countryCode);
    if (!profile) return reply.status(404).send({ error: "Country not in registry" });
    return reply.send({ profile });
  });

  app.get("/global-commerce-infrastructure/dependencies", { preHandler: authenticate }, async (request, reply) => {
    const query = z.object({ countryCode: z.string().min(2), providerId: z.string().optional() }).parse(request.query);
    if (query.providerId) {
      const profile = getProviderDependencies(query.providerId, query.countryCode);
      if (!profile) return reply.status(404).send({ error: "Provider not found for country" });
      return reply.send({ profile });
    }
    return reply.send({ profiles: listProviderDependenciesForCountry(query.countryCode) });
  });

  app.get("/global-commerce-infrastructure/readiness", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1), countryCode: z.string().optional() }).parse(request.query);
    if (query.countryCode) {
      const readiness = computeInfrastructureReadiness(user.workspaceId, query.companyId, query.countryCode);
      if (!readiness) return reply.status(404).send({ error: "Country not in registry" });
      return reply.send({ readiness });
    }
    return reply.send({ readiness: listInfrastructureReadiness(user.workspaceId, query.companyId) });
  });

  app.get("/global-commerce-infrastructure/graph/:countryCode", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ countryCode: z.string().min(2) }).parse(request.params);
    const query = z.object({ companyId: z.string().min(1), providerId: z.string().optional() }).parse(request.query);
    if (query.providerId) {
      const graph = buildExpansionDependencyGraph(user.workspaceId, query.companyId, params.countryCode, query.providerId);
      if (!graph) return reply.status(404).send({ error: "Graph could not be built" });
      return reply.send({ graph });
    }
    return reply.send({ graphs: listExpansionDependencyGraphs(user.workspaceId, query.companyId, params.countryCode) });
  });

  app.get("/global-commerce-infrastructure/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    const dashboard = buildGlobalCommerceInfrastructureDashboard(user.workspaceId, query.companyId);
    return reply.send({ dashboard });
  });
}
