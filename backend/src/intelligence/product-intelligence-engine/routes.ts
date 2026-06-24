import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { requireModuleAccess } from "../../auth/middleware.js";
import {
  productIntelligenceService,
} from "./service.js";

const evaluateBodySchema = z.object({
  productTitle: z.string().min(1),
  category: z.string().min(1),
  productId: z.string().optional(),
  persist: z.boolean().optional(),
});

export async function registerProductIntelligenceRoutes(
  app: FastifyInstance,
  options: {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  },
): Promise<void> {
  const { authenticate } = options;
  const authorizeIntelligence = requireModuleAccess("intelligence");

  app.get(
    "/intelligence/products",
    { preHandler: [authenticate, authorizeIntelligence] },
    async (request) => {
      const workspaceId = request.user!.workspaceId;
      const query = z
        .object({ limit: z.coerce.number().min(1).max(100).optional() })
        .parse(request.query);

      const products = productIntelligenceService.listProducts(
        workspaceId,
        query.limit ?? 50,
      );

      return {
        products,
        count: products.length,
        workspaceId,
      };
    },
  );

  app.get(
    "/intelligence/products/:id",
    { preHandler: [authenticate, authorizeIntelligence] },
    async (request, reply) => {
      const workspaceId = request.user!.workspaceId;
      const params = z.object({ id: z.string().min(1) }).parse(request.params);

      const product = productIntelligenceService.getProduct(workspaceId, params.id);
      if (!product) {
        return reply.code(404).send({ error: "Product not found" });
      }

      return { product };
    },
  );

  app.post(
    "/intelligence/evaluate",
    { preHandler: [authenticate, authorizeIntelligence] },
    async (request) => {
      const workspaceId = request.user!.workspaceId;
      const body = evaluateBodySchema.parse(request.body);

      const product = await productIntelligenceService.evaluateFromConnectors(
        workspaceId,
        body,
      );

      return { product };
    },
  );
}
