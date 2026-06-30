import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { MARKETPLACE_PUBLISH_IDS } from "../models/marketplace-adapter.js";
import {
  buildMarketplaceListingPackage,
  enqueueMarketplacePublish,
  listMarketplaceAdapters,
} from "../services/marketplace-publishing-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerMarketplacePublishingRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;

  app.get("/marketplace-publishing/adapters", { preHandler: authenticate }, async (_request, reply) => {
    return reply.send({ adapters: listMarketplaceAdapters() });
  });

  app.post("/marketplace-publishing/build", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({
      companyId: z.string().default("co-grand-king"),
      productId: z.string().min(1),
      marketplaceId: z.enum(MARKETPLACE_PUBLISH_IDS),
      title: z.string().min(1),
      description: z.string().min(1),
      bulletPoints: z.array(z.string()).default([]),
      specifications: z.record(z.string()).default({}),
      price: z.number().nonnegative(),
      images: z.array(z.string()).default([]),
      executiveCouncilApproved: z.boolean().default(false),
      kingApproved: z.boolean().default(false),
    }).parse(request.body);

    const pkg = buildMarketplaceListingPackage({
      workspaceId: user.workspaceId,
      companyId: body.companyId,
      productId: body.productId,
      marketplaceId: body.marketplaceId,
      title: body.title,
      description: body.description,
      bulletPoints: body.bulletPoints,
      specifications: body.specifications,
      price: body.price,
      images: body.images,
      executiveCouncilApproved: body.executiveCouncilApproved,
      kingApproved: body.kingApproved,
    });
    const queueItem = enqueueMarketplacePublish(pkg);
    return reply.code(201).send({ package: pkg, queueItem });
  });

  app.get("/health/marketplace-publishing", async (_request, reply) => {
    const adapters = listMarketplaceAdapters();
    return reply.send({
      status: adapters.length >= 7 ? "HEALTHY" : "WARNING",
      adapterCount: adapters.length,
      livePublishBlocked: true,
    });
  });
}
