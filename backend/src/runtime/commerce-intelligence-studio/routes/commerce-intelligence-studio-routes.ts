import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { SupplierProductInputSchema } from "../models/commercial-review.js";
import { WinningListingInputSchema } from "../models/winning-listing.js";
import { runCommercialReview, listCommercialReviews } from "../services/commercial-review-service.js";
import { generateWinningListing, listWinningListings } from "../services/winning-listing-service.js";
import { recommendCommercialStrategy } from "../services/commercial-strategy-service.js";
import { classifyProductExperiment, listExperiments, runFullCommercialIntelligence } from "../services/experiment-service.js";
import { buildCisMissionControlDashboard } from "../services/cis-mission-control-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerCommerceIntelligenceStudioRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.post("/commerce-intelligence-studio/review", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ companyId: z.string().min(1) }).merge(SupplierProductInputSchema).parse(request.body);
    const { companyId, ...product } = body;
    const review = runCommercialReview(user.workspaceId, companyId, product);
    return reply.code(201).send({ review });
  });

  app.post("/commerce-intelligence-studio/listing", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ companyId: z.string().min(1) })
      .merge(SupplierProductInputSchema)
      .merge(WinningListingInputSchema)
      .parse(request.body);
    const { companyId, brandName, tone, targetAudience, ...productFields } = body;
    const product = SupplierProductInputSchema.parse(productFields);
    const listing = generateWinningListing(user.workspaceId, companyId, product, {
      supplierProductId: product.supplierProductId,
      brandName,
      tone,
      targetAudience,
    });
    return reply.code(201).send({ listing });
  });

  app.post("/commerce-intelligence-studio/strategy", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ companyId: z.string().min(1) }).merge(SupplierProductInputSchema).parse(request.body);
    const { companyId, ...product } = body;
    const strategy = recommendCommercialStrategy(user.workspaceId, companyId, product);
    return reply.code(201).send({ strategy });
  });

  app.post("/commerce-intelligence-studio/experiment", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ companyId: z.string().min(1) }).merge(SupplierProductInputSchema).parse(request.body);
    const { companyId, ...product } = body;
    const experiment = classifyProductExperiment(user.workspaceId, companyId, product);
    return reply.code(201).send({ experiment });
  });

  app.post("/commerce-intelligence-studio/analyze", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ companyId: z.string().min(1), brandName: z.string().min(1) })
      .merge(SupplierProductInputSchema)
      .parse(request.body);
    const { companyId, brandName, ...product } = body;
    const result = runFullCommercialIntelligence(user.workspaceId, companyId, product, brandName);

    auditLogger.write({
      action: "commerce_intelligence_studio.analyze",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { supplierProductId: product.supplierProductId, classification: result.experiment.classification },
    });

    return reply.code(201).send(result);
  });

  app.get("/commerce-intelligence-studio/reviews", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send({ reviews: listCommercialReviews(user.workspaceId, query.companyId) });
  });

  app.get("/commerce-intelligence-studio/listings", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send({ listings: listWinningListings(user.workspaceId, query.companyId) });
  });

  app.get("/commerce-intelligence-studio/experiments", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send({ experiments: listExperiments(user.workspaceId, query.companyId) });
  });

  app.get("/commerce-intelligence-studio/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send({ dashboard: buildCisMissionControlDashboard(user.workspaceId, query.companyId) });
  });
}
