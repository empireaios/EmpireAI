import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildAmazonCapabilityProfile } from "../services/amazon-capability-profile-service.js";
import { createAmazonListingPackage, evaluateListingById, listListingEvaluations } from "../services/amazon-readiness-service.js";
import { buildAmazonMissionControlDashboard } from "../services/amazon-mission-control-service.js";
import { AmazonListingPackageInputSchema } from "../models/amazon-listing-package.js";
import { getAmazonListingRepository } from "../repositories/sqlite-amazon-listing-repository.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerAmazonGlobalSellerRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get("/amazon-global-seller/capability-profile", { preHandler: authenticate }, async (_request, reply) => {
    return reply.send({ profile: buildAmazonCapabilityProfile() });
  });

  app.post("/amazon-global-seller/listing", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ companyId: z.string().min(1) }).merge(AmazonListingPackageInputSchema).parse(request.body);
    const listing = createAmazonListingPackage(user.workspaceId, body.companyId, body);

    auditLogger.write({
      action: "amazon_global_seller.listing.created",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { listingId: listing.listingId, sku: listing.sku },
    });

    return reply.code(201).send({ listing });
  });

  app.get("/amazon-global-seller/listings", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send({ listings: getAmazonListingRepository().listListings(user.workspaceId, query.companyId) });
  });

  app.get("/amazon-global-seller/readiness", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1), listingId: z.string().optional() }).parse(request.query);
    if (query.listingId) {
      const evaluation = evaluateListingById(user.workspaceId, query.companyId, query.listingId);
      if (!evaluation) return reply.code(404).send({ error: "Listing not found" });
      return reply.send({ evaluation });
    }
    return reply.send({ evaluations: listListingEvaluations(user.workspaceId, query.companyId) });
  });

  app.get("/amazon-global-seller/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send({ dashboard: buildAmazonMissionControlDashboard(user.workspaceId, query.companyId) });
  });
}
