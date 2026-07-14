import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import {
  buildRealityActivationDashboard,
  evaluateRealityActivation,
  setEmergencyStop,
} from "../services/reality-activation-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerRealityActivationRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get("/reality-activation/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send({ dashboard: buildRealityActivationDashboard(user.workspaceId, query.companyId) });
  });

  app.post("/reality-activation/evaluate", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ companyId: z.string().min(1) }).parse(request.body ?? {});
    const decision = evaluateRealityActivation({ workspaceId: user.workspaceId, companyId: body.companyId });
    auditLogger.write({
      action: "reality_activation.evaluate",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { state: decision.state, confidence: decision.confidence },
    });
    return reply.send({ decision });
  });

  app.post("/reality-activation/emergency-stop", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ companyId: z.string().min(1), active: z.boolean() }).parse(request.body ?? {});
    setEmergencyStop(user.workspaceId, body.companyId, body.active);
    auditLogger.write({
      action: "reality_activation.emergency_stop",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { active: body.active },
    });
    return reply.send({ active: body.active });
  });
}
