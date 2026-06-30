import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { importedProductSchema } from "../../product-import/models/imported-product.js";
import { mappedProductSchema } from "../../product-import/models/mapped-product.js";
import {
  applyProductUpdates,
  getCatalogPublishById,
  getPublishedProductById,
  listCatalogPublishes,
  listPublishedProducts,
  prepareCatalogPublish,
  ProductPublishingBlockedError,
  publishCatalogToStorefront,
  syncPublishedAvailability,
  syncPublishedInventory,
  syncPublishedPrices,
} from "../services/product-publishing-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerProductPublishingRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.post(
    "/product-publishing/prepare",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const body = z
        .object({
          companyId: z.string().min(1),
          storeId: z.string().min(1),
          importedProducts: z.array(importedProductSchema),
          mappedProducts: z.array(mappedProductSchema),
        })
        .parse(request.body);

      try {
        const publish = prepareCatalogPublish({
          workspaceId: user.workspaceId,
          companyId: body.companyId,
          storeId: body.storeId,
          importedProducts: body.importedProducts,
          mappedProducts: body.mappedProducts,
        });

        auditLogger.write({
          action: "product_publishing.catalog_prepared",
          actor: user.email,
          workspaceId: user.workspaceId,
          companyId: body.companyId,
          correlationId: request.id,
          metadata: { publishId: publish.publishId, productCount: publish.productCount },
        });

        return reply.send({ publish });
      } catch (error) {
        if (error instanceof ProductPublishingBlockedError) {
          return reply.code(403).send({ error: error.message, blocked: true });
        }
        throw error;
      }
    },
  );

  app.post(
    "/product-publishing/publish",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const body = z.object({ publishId: z.string().min(1) }).parse(request.body);
      const publish = publishCatalogToStorefront(body.publishId);

      if (publish.workspaceId !== user.workspaceId && user.role !== "admin") {
        return reply.code(403).send({ error: "Workspace mismatch" });
      }

      auditLogger.write({
        action: "product_publishing.catalog_published",
        actor: user.email,
        workspaceId: publish.workspaceId,
        companyId: publish.companyId,
        correlationId: request.id,
        metadata: {
          publishId: publish.publishId,
          status: publish.status,
          publishedProductCount: publish.publishedProductCount,
        },
      });

      return reply.send({ publish });
    },
  );

  app.post(
    "/product-publishing/sync/inventory",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const body = z.object({ publishId: z.string().min(1) }).parse(request.body);
      const publish = await syncPublishedInventory(body.publishId);

      if (publish.workspaceId !== user.workspaceId && user.role !== "admin") {
        return reply.code(403).send({ error: "Workspace mismatch" });
      }

      auditLogger.write({
        action: "product_publishing.inventory_synced",
        actor: user.email,
        workspaceId: publish.workspaceId,
        companyId: publish.companyId,
        correlationId: request.id,
        metadata: { publishId: publish.publishId },
      });

      return reply.send({ publish });
    },
  );

  app.post(
    "/product-publishing/sync/prices",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const body = z.object({ publishId: z.string().min(1) }).parse(request.body);
      const publish = await syncPublishedPrices(body.publishId);

      if (publish.workspaceId !== user.workspaceId && user.role !== "admin") {
        return reply.code(403).send({ error: "Workspace mismatch" });
      }

      auditLogger.write({
        action: "product_publishing.prices_synced",
        actor: user.email,
        workspaceId: publish.workspaceId,
        companyId: publish.companyId,
        correlationId: request.id,
        metadata: { publishId: publish.publishId },
      });

      return reply.send({ publish });
    },
  );

  app.post(
    "/product-publishing/sync/availability",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const body = z.object({ publishId: z.string().min(1) }).parse(request.body);
      const publish = syncPublishedAvailability(body.publishId);

      if (publish.workspaceId !== user.workspaceId && user.role !== "admin") {
        return reply.code(403).send({ error: "Workspace mismatch" });
      }

      auditLogger.write({
        action: "product_publishing.availability_synced",
        actor: user.email,
        workspaceId: publish.workspaceId,
        companyId: publish.companyId,
        correlationId: request.id,
        metadata: { publishId: publish.publishId },
      });

      return reply.send({ publish });
    },
  );

  app.post(
    "/product-publishing/updates",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const body = z
        .object({
          publishId: z.string().min(1),
          updates: z.array(
            z.object({
              publishedProductId: z.string().min(1),
              title: z.string().optional(),
              description: z.string().optional(),
              priceCents: z.number().int().min(0).optional(),
              compareAtPriceCents: z.number().int().min(0).nullable().optional(),
              inventoryQuantity: z.number().int().min(0).optional(),
            }),
          ),
        })
        .parse(request.body);

      const publish = applyProductUpdates(body.publishId, body.updates);

      if (publish.workspaceId !== user.workspaceId && user.role !== "admin") {
        return reply.code(403).send({ error: "Workspace mismatch" });
      }

      auditLogger.write({
        action: "product_publishing.products_updated",
        actor: user.email,
        workspaceId: publish.workspaceId,
        companyId: publish.companyId,
        correlationId: request.id,
        metadata: { publishId: publish.publishId, updateCount: body.updates.length },
      });

      return reply.send({ publish });
    },
  );

  app.get(
    "/product-publishing/catalogs",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const query = z.object({ companyId: z.string().optional() }).parse(request.query);
      const catalogs = listCatalogPublishes(user.workspaceId, query.companyId);
      return reply.send({ catalogs });
    },
  );

  app.get(
    "/product-publishing/catalogs/:publishId",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const params = z.object({ publishId: z.string().min(1) }).parse(request.params);
      const publish = getCatalogPublishById(params.publishId);
      if (!publish) {
        return reply.code(404).send({ error: "Catalog publish not found" });
      }
      if (publish.workspaceId !== user.workspaceId && user.role !== "admin") {
        return reply.code(403).send({ error: "Workspace mismatch" });
      }
      const products = listPublishedProducts(publish.storeId);
      return reply.send({ publish, products });
    },
  );

  app.get(
    "/product-publishing/products/:publishedProductId",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const params = z
        .object({ publishedProductId: z.string().min(1) })
        .parse(request.params);
      const product = getPublishedProductById(params.publishedProductId);
      if (!product) {
        return reply.code(404).send({ error: "Published product not found" });
      }
      if (product.workspaceId !== user.workspaceId && user.role !== "admin") {
        return reply.code(403).send({ error: "Workspace mismatch" });
      }
      return reply.send({ product });
    },
  );
}
