import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { SupplierProductInputSchema } from "../../commerce-intelligence-studio/models/commercial-review.js";
import { buildListingIntelligence } from "../services/listing-intelligence-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerListingIntelligenceRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;

  app.post("/listing-intelligence/build", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({
      companyId: z.string().default("co-grand-king"),
      brandName: z.string().optional(),
    }).merge(SupplierProductInputSchema).parse(request.body);
    const { companyId, brandName, ...product } = body;
    const listing = buildListingIntelligence(user.workspaceId, companyId, product, brandName);
    return reply.code(201).send({ listing });
  });

  app.get("/health/listing-intelligence", async (_request, reply) => {
    return reply.send({ status: "HEALTHY", reusesCis: true, duplicateIntelligence: false });
  });
}
