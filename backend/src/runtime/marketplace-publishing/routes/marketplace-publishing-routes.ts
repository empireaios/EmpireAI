import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { MARKETPLACE_PUBLISH_IDS } from "../models/marketplace-adapter.js";
import { executeAmazonListingsPublish } from "../services/amazon-listings-publish-executor.js";
import {
  buildMarketplaceListingPackage,
  enqueueMarketplacePublish,
  getMarketplaceListingPackage,
  listMarketplaceAdapters,
  updatePublishQueueAfterExecution,
} from "../services/marketplace-publishing-service.js";
import { resolveMarketplaceAdapter } from "../models/marketplace-adapter.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerMarketplacePublishingRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

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

  app.post("/marketplace-publishing/execute", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z
      .object({
        packageId: z.string().min(1),
        queueId: z.string().optional(),
      })
      .parse(request.body);

    const pkg = getMarketplaceListingPackage(user.workspaceId, body.packageId);
    if (!pkg) {
      return reply.code(404).send({ error: "Listing package not found" });
    }

    const result = await executeAmazonListingsPublish(pkg);
    if (body.queueId) {
      await updatePublishQueueAfterExecution(
        body.queueId,
        user.workspaceId,
        result.ok ? "COMPLETE" : "BLOCKED",
        result.blockers,
      );
    }

    auditLogger.write({
      action: "product_publishing.catalog_published",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: {
        packageId: pkg.packageId,
        sku: result.sku,
        httpStatus: result.httpStatus,
        amazonStatus: result.amazonStatus,
        liveApiCalled: result.liveApiCalled,
        ok: result.ok,
      },
    });

    return reply.code(result.ok ? 200 : 409).send({ package: pkg, publish: result });
  });

  app.get("/health/marketplace-publishing", async (_request, reply) => {
    const adapters = listMarketplaceAdapters();
    const amazon = resolveMarketplaceAdapter("amazon");
    return reply.send({
      status: adapters.length >= 7 ? "HEALTHY" : "WARNING",
      adapterCount: adapters.length,
      livePublishBlocked: !amazon.supportsPublish,
      amazonSupportsPublish: amazon.supportsPublish,
      amazonAdapterStatus: amazon.adapterStatus,
    });
  });
}
