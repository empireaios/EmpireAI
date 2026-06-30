import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { SupplierProductInputSchema } from "../../commerce-intelligence-studio/models/commercial-review.js";
import { buildProductMediaIntelligence } from "../services/product-media-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerProductMediaRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;

  app.post("/product-media/build", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({
      companyId: z.string().default("co-grand-king"),
    }).merge(SupplierProductInputSchema).parse(request.body);
    const { companyId, ...product } = body;
    const media = buildProductMediaIntelligence(user.workspaceId, companyId, product);
    return reply.code(201).send({ media });
  });

  app.get("/health/product-media", async (_request, reply) => {
    return reply.send({ status: "HEALTHY", imageAiIntegrated: false, architectureOnly: true });
  });
}
