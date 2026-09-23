import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { env } from "../../../config/env.js";
import { GRAND_KING_WORKSPACE_ID } from "../../../grand-king/constants.js";
import { getPillowAuthority } from "../../../orchestration/pillow-commissioning/pillow-authority.js";
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

/** Preparing a draft is not a live action. Only the configured owner may request
 * publishing, and even that identity cannot replace canonical Birth/commerce authority. */
function requirePublishingOwner(request: FastifyRequest, reply: FastifyReply): boolean {
  const user = request.user;
  if (!user) {
    reply.code(401).send({ error: "Authentication required" });
    return false;
  }
  const ownerEmail = env.FOUNDER_EMAIL.trim().toLowerCase();
  const body = request.body as Record<string, unknown> | null | undefined;
  const bodyWorkspace = body && typeof body === "object" ? body.workspaceId : undefined;
  const headerWorkspace = request.headers["x-workspace-id"];
  if (!ownerEmail || user.role !== "founder" || user.email.trim().toLowerCase() !== ownerEmail ||
      user.workspaceId !== GRAND_KING_WORKSPACE_ID ||
      (headerWorkspace !== undefined && headerWorkspace !== user.workspaceId) ||
      (bodyWorkspace !== undefined && bodyWorkspace !== user.workspaceId)) {
    reply.code(403).send({ error: "Configured owner and organization required for marketplace publishing", code: "PUBLISH_OWNER_SCOPE_DENIED" });
    return false;
  }
  return true;
}

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
      // Accepted for compatibility with old clients, but a request boolean is
      // not an authenticated, scoped approval receipt. No acceptance path exists.
      executiveCouncilApproved: false,
      kingApproved: false,
    });
    const queueItem = enqueueMarketplacePublish(pkg);
    return reply.code(201).send({ package: pkg, queueItem });
  });

  app.post("/marketplace-publishing/execute", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    if (!requirePublishingOwner(request, reply)) return;
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
        result.submissionAccepted ? "EXECUTING" : "BLOCKED",
        result.blockers,
      );
    }

    auditLogger.write({
      action: result.submissionAccepted ? "commerce_runtime.event.processed" : "commerce_runtime.dispatch.blocked",
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
        submissionAccepted: result.submissionAccepted,
        submissionId: result.submissionId,
        submissionBinding: result.submissionBinding,
        listingVerified: result.listingVerified,
      },
    });

    return reply.code(result.submissionAccepted ? 202 : 409).send({ package: pkg, publish: result });
  });

  app.get("/health/marketplace-publishing", async (_request, reply) => {
    const adapters = listMarketplaceAdapters();
    const amazon = resolveMarketplaceAdapter("amazon");
    const amazonUs = resolveMarketplaceAdapter("amazon-us");
    const authority = getPillowAuthority();
    const publishingAuthorized = authority.realCommerceAuthorized;
    return reply.send({
      status: adapters.length >= 7 ? "HEALTHY" : "WARNING",
      adapterCount: adapters.length,
      livePublishBlocked: !publishingAuthorized || !amazonUs.supportsPublish,
      amazonSupportsPublish: publishingAuthorized && amazon.supportsPublish,
      amazonUsSupportsPublish: publishingAuthorized && amazonUs.supportsPublish,
      birthStatus: authority.birthStatus,
      commerceStatus: authority.commerceStatus,
      publishBlocker: publishingAuthorized ? null : authority.reason,
      amazonAdapterStatus: amazon.adapterStatus,
      amazonUsAdapterStatus: amazonUs.adapterStatus,
    });
  });
}
