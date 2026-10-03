import type { FastifyInstance } from "fastify";
import type { AuditLogger } from "../../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../../auth/middleware.js";
import { getAmazonOrderImportStatus, listImportedAmazonOrders } from "../adapters/amazon-order-import.js";
import { getAmazonUsListingsImportStatus, listCurrentAmazonUsListings } from "../adapters/amazon-listings-import.js";
import { getAmazonSellerInventoryImportStatus, listCurrentAmazonSellerInventory } from "../adapters/amazon-seller-inventory-import.js";
import { resolveLiveCommerceIntegrationMode } from "../config.js";
import { runLiveCommerceSync } from "../services/live-commerce-integration-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

/**
 * Small production-critical surface for owner-observed read-only Amazon
 * order import. This route never publishes, purchases or grants commerce.
 */
export async function registerAmazonOrderReadRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  for (const providerId of ["amazon-us", "amazon-sg"] as const) {
  app.get(`/commerce/${providerId}/orders/imported`, { preHandler: deps.authenticate }, async (request, reply) => {
    const user = request.user!;
    if (user.role !== "founder") return reply.code(403).send({ error: "Founder access required" });
    return reply.send({
      providerId,
      orders: listImportedAmazonOrders(user.workspaceId, providerId, 100),
      importStatus: getAmazonOrderImportStatus(user.workspaceId, providerId),
      // These are sanitized provider snapshots, not a fulfilment or profit ledger.
      commerceEffect: "none",
    });
  });

  app.post(`/commerce/${providerId}/orders/sync`, { preHandler: deps.authenticate }, async (request, reply) => {
    const user = request.user!;
    if (user.role !== "founder") return reply.code(403).send({ error: "Founder access required" });
    if (resolveLiveCommerceIntegrationMode() !== "production") {
      return reply.code(409).send({ error: "Amazon provider sync requires production integration mode" });
    }
    const job = await runLiveCommerceSync({
      workspaceId: user.workspaceId, providerId,
      syncType: "orders", actor: user.email,
    });
    deps.auditLogger.write({
      action: "reality_integration.live_commerce.sync",
      actor: user.email, workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { providerId, syncType: "orders", jobId: job.jobId, status: job.status },
    });
    return reply.code(job.status === "completed" ? 200 : 409).send({
      job,
      commerceEffect: "none",
    });
  });

  app.get(`/commerce/${providerId}/listings/imported`, { preHandler: deps.authenticate }, async (request, reply) => {
    const user = request.user!;
    if (user.role !== "founder") return reply.code(403).send({ error: "Founder access required" });
    return reply.send({ providerId, listings: listCurrentAmazonUsListings(user.workspaceId, providerId),
      importStatus: getAmazonUsListingsImportStatus(user.workspaceId, providerId), commerceEffect: "none" });
  });

  app.post(`/commerce/${providerId}/listings/sync`, { preHandler: deps.authenticate }, async (request, reply) => {
    const user = request.user!;
    if (user.role !== "founder") return reply.code(403).send({ error: "Founder access required" });
    if (resolveLiveCommerceIntegrationMode() !== "production") {
      return reply.code(409).send({ error: "Amazon provider sync requires production integration mode" });
    }
    const job = await runLiveCommerceSync({ workspaceId: user.workspaceId,
      providerId, syncType: "catalog", actor: user.email });
    deps.auditLogger.write({ action: "reality_integration.live_commerce.sync",
      actor: user.email, workspaceId: user.workspaceId, correlationId: request.id,
      metadata: { providerId, syncType: "catalog", jobId: job.jobId, status: job.status } });
    return reply.code(job.status === "completed" ? 200 : 409).send({ job, commerceEffect: "none" });
  });

  app.get(`/commerce/${providerId}/inventory/imported`, { preHandler: deps.authenticate }, async (request, reply) => {
    const user = request.user!;
    if (user.role !== "founder") return reply.code(403).send({ error: "Founder access required" });
    return reply.send({ providerId, sellerManagedInventory: listCurrentAmazonSellerInventory(user.workspaceId, providerId),
      importStatus: getAmazonSellerInventoryImportStatus(user.workspaceId, providerId),
      supplierStockVerified: false, commerceEffect: "none" });
  });

  app.post(`/commerce/${providerId}/inventory/sync`, { preHandler: deps.authenticate }, async (request, reply) => {
    const user = request.user!;
    if (user.role !== "founder") return reply.code(403).send({ error: "Founder access required" });
    if (resolveLiveCommerceIntegrationMode() !== "production") {
      return reply.code(409).send({ error: "Amazon provider sync requires production integration mode" });
    }
    const job = await runLiveCommerceSync({ workspaceId: user.workspaceId,
      providerId, syncType: "inventory", actor: user.email });
    deps.auditLogger.write({ action: "reality_integration.live_commerce.sync",
      actor: user.email, workspaceId: user.workspaceId, correlationId: request.id,
      metadata: { providerId, syncType: "inventory", jobId: job.jobId, status: job.status } });
    return reply.code(job.status === "completed" ? 200 : 409).send({ job, commerceEffect: "none" });
  });
  }
}
