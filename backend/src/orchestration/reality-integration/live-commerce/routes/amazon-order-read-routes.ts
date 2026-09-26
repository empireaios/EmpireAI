import type { FastifyInstance } from "fastify";
import type { AuditLogger } from "../../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../../auth/middleware.js";
import { getAmazonOrderImportStatus, listImportedAmazonOrders } from "../adapters/amazon-order-import.js";
import { getAmazonUsListingsImportStatus, listCurrentAmazonUsListings } from "../adapters/amazon-listings-import.js";
import { resolveLiveCommerceIntegrationMode } from "../config.js";
import { runLiveCommerceSync } from "../services/live-commerce-integration-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

/**
 * Small production-critical surface for owner-observed read-only Amazon US
 * order import. This route never publishes, purchases or grants commerce.
 */
export async function registerAmazonOrderReadRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  app.get("/commerce/amazon-us/orders/imported", { preHandler: deps.authenticate }, async (request, reply) => {
    const user = request.user!;
    if (user.role !== "founder") return reply.code(403).send({ error: "Founder access required" });
    return reply.send({
      providerId: "amazon-us",
      orders: listImportedAmazonOrders(user.workspaceId, "amazon-us", 100),
      importStatus: getAmazonOrderImportStatus(user.workspaceId, "amazon-us"),
      // These are sanitized provider snapshots, not a fulfilment or profit ledger.
      commerceEffect: "none",
    });
  });

  app.post("/commerce/amazon-us/orders/sync", { preHandler: deps.authenticate }, async (request, reply) => {
    const user = request.user!;
    if (user.role !== "founder") return reply.code(403).send({ error: "Founder access required" });
    if (resolveLiveCommerceIntegrationMode() !== "production") {
      return reply.code(409).send({ error: "Amazon provider sync requires production integration mode" });
    }
    const job = await runLiveCommerceSync({
      workspaceId: user.workspaceId, providerId: "amazon-us",
      syncType: "orders", actor: user.email,
    });
    deps.auditLogger.write({
      action: "reality_integration.live_commerce.sync",
      actor: user.email, workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { providerId: "amazon-us", syncType: "orders", jobId: job.jobId, status: job.status },
    });
    return reply.code(job.status === "completed" ? 200 : 409).send({
      job,
      commerceEffect: "none",
    });
  });

  app.get("/commerce/amazon-us/listings/imported", { preHandler: deps.authenticate }, async (request, reply) => {
    const user = request.user!;
    if (user.role !== "founder") return reply.code(403).send({ error: "Founder access required" });
    return reply.send({ providerId: "amazon-us", listings: listCurrentAmazonUsListings(user.workspaceId),
      importStatus: getAmazonUsListingsImportStatus(user.workspaceId), commerceEffect: "none" });
  });

  app.post("/commerce/amazon-us/listings/sync", { preHandler: deps.authenticate }, async (request, reply) => {
    const user = request.user!;
    if (user.role !== "founder") return reply.code(403).send({ error: "Founder access required" });
    if (resolveLiveCommerceIntegrationMode() !== "production") {
      return reply.code(409).send({ error: "Amazon provider sync requires production integration mode" });
    }
    const job = await runLiveCommerceSync({ workspaceId: user.workspaceId,
      providerId: "amazon-us", syncType: "catalog", actor: user.email });
    deps.auditLogger.write({ action: "reality_integration.live_commerce.sync",
      actor: user.email, workspaceId: user.workspaceId, correlationId: request.id,
      metadata: { providerId: "amazon-us", syncType: "catalog", jobId: job.jobId, status: job.status } });
    return reply.code(job.status === "completed" ? 200 : 409).send({ job, commerceEffect: "none" });
  });
}
