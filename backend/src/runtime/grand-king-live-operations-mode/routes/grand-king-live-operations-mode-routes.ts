import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import {
  approveOperationsModeTransition,
  buildGrandKingLiveOperationsMode,
  requestOperationsModeTransition,
} from "../services/grand-king-live-operations-mode-service.js";
import { OPERATIONS_MODES } from "../models/grand-king-live-operations-mode.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerGrandKingLiveOperationsModeRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;
  app.get("/grand-king-live-operations-mode/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildGrandKingLiveOperationsMode(user.workspaceId, query.companyId) });
  });
  app.post("/grand-king-live-operations-mode/transition", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({
      companyId: z.string().default("co-grand-king"),
      targetMode: z.enum(OPERATIONS_MODES),
      evidence: z.string(),
      approved: z.boolean().default(false),
    }).parse(request.body);
    const dash = body.approved
      ? approveOperationsModeTransition(user.workspaceId, body.companyId, body.targetMode, body.evidence)
      : requestOperationsModeTransition(user.workspaceId, body.companyId, body.targetMode, body.evidence);
    return reply.send({ dashboard: dash });
  });
  app.get("/health/grand-king-live-operations-mode", async (_req, reply) => {
    return reply.send({ status: "HEALTHY", mode: "DEVELOPMENT" });
  });
}
