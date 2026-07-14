import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import {
  createVisualAsset,
  exportVisualDesign,
  generateCommerceCreative,
  generateMarketingCreative,
  getVisualGenerationHealth,
} from "../services/visual-generation-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerVisualGenerationRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.post(
    "/visual-generation/create",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const body = z
        .object({
          companyId: z.string().min(1),
          useCase: z.string().optional(),
          title: z.string().optional(),
          prompt: z.string().optional(),
          format: z.enum(["png", "jpg", "pdf", "mp4"]).optional(),
        })
        .parse(request.body);

      const result = await createVisualAsset({
        workspaceId: user.workspaceId,
        companyId: body.companyId,
        useCase: (body.useCase as "general") ?? "general",
        title: body.title,
        prompt: body.prompt,
        format: body.format,
      });

      auditLogger.write({
        action: "visual_generation.create",
        actor: user.email,
        workspaceId: user.workspaceId,
        companyId: body.companyId,
        correlationId: request.id,
        metadata: { provider: result.provider, designId: result.designId, status: result.status },
      });

      return reply.send({ result });
    },
  );

  app.post(
    "/visual-generation/commerce",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const body = z
        .object({
          companyId: z.string().min(1),
          title: z.string().optional(),
          prompt: z.string().optional(),
        })
        .parse(request.body);

      const result = await generateCommerceCreative({
        workspaceId: user.workspaceId,
        companyId: body.companyId,
        title: body.title,
        prompt: body.prompt,
      });

      auditLogger.write({
        action: "visual_generation.commerce",
        actor: user.email,
        workspaceId: user.workspaceId,
        companyId: body.companyId,
        correlationId: request.id,
        metadata: { provider: result.provider, designId: result.designId },
      });

      return reply.send({ result });
    },
  );

  app.post(
    "/visual-generation/marketing",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const body = z
        .object({
          companyId: z.string().min(1),
          title: z.string().optional(),
          prompt: z.string().optional(),
        })
        .parse(request.body);

      const result = await generateMarketingCreative({
        workspaceId: user.workspaceId,
        companyId: body.companyId,
        title: body.title,
        prompt: body.prompt,
      });

      return reply.send({ result });
    },
  );

  app.post(
    "/visual-generation/export",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const body = z
        .object({
          companyId: z.string().min(1),
          designId: z.string().min(1),
          format: z.enum(["png", "jpg", "pdf", "mp4"]).optional(),
        })
        .parse(request.body);

      const result = await exportVisualDesign({
        workspaceId: user.workspaceId,
        companyId: body.companyId,
        designId: body.designId,
        format: body.format,
        useCase: "general",
      });

      return reply.send({ result });
    },
  );

  app.get(
    "/visual-generation/health",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
      const health = await getVisualGenerationHealth(user.workspaceId, query.companyId);
      return reply.send({ health });
    },
  );
}
