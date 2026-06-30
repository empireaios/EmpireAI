import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import {
  decideExecutiveRecommendation,
  getCouncilDebate,
  getCouncilRecordByRequest,
  listPendingRecommendations,
} from "../service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

function requireFounder(request: FastifyRequest, reply: FastifyReply): boolean {
  const user = request.user;
  if (!user) {
    reply.code(401).send({ error: "Authentication required" });
    return false;
  }
  if (user.role !== "founder" && user.role !== "admin") {
    reply.code(403).send({ error: "Founder access required for Pillow Executive Council" });
    return false;
  }
  return true;
}

function founderAuth(authenticate: AuthMiddleware) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply);
    if (reply.sent) return;
    requireFounder(request, reply);
  };
}

export async function registerPillowExecutiveCouncilRoutes(
  app: FastifyInstance,
  deps: {
    authenticate: AuthMiddleware;
    auditLogger?: AuditLogger;
  },
): Promise<void> {
  const { authenticate, auditLogger } = deps;
  const auth = founderAuth(authenticate);

  app.get(
    "/api/pillow/executive-council/pending",
    { preHandler: auth },
    async (request, reply) => {
      const query = z
        .object({ workspaceId: z.string().min(1).default("grand-king-workspace") })
        .parse(request.query);
      return reply.send({
        pending: listPendingRecommendations(query.workspaceId),
        missionId: "PILLOW-EXECUTIVE-COUNCIL",
      });
    },
  );

  app.get(
    "/api/pillow/executive-council/recommendation/:requestId",
    { preHandler: auth },
    async (request, reply) => {
      const params = z.object({ requestId: z.string().min(1) }).parse(request.params);
      const query = z
        .object({ workspaceId: z.string().min(1).default("grand-king-workspace") })
        .parse(request.query);

      const record = getCouncilRecordByRequest(query.workspaceId, params.requestId);
      if (!record) {
        return reply.code(404).send({ error: "Recommendation not found" });
      }

      return reply.send({
        publicRecommendation: record.publicRecommendation,
        debateId: record.debateId,
        status: record.status,
      });
    },
  );

  app.get(
    "/api/pillow/executive-council/debate/:debateId",
    { preHandler: auth },
    async (request, reply) => {
      const params = z.object({ debateId: z.string().min(1) }).parse(request.params);
      const query = z
        .object({ workspaceId: z.string().min(1).default("grand-king-workspace") })
        .parse(request.query);

      const debate = getCouncilDebate(query.workspaceId, params.debateId);
      if (!debate) {
        return reply.code(404).send({ error: "Executive debate not found" });
      }

      return reply.send({ debate });
    },
  );

  app.post(
    "/api/pillow/executive-council/recommendation/:recommendationId/decide",
    { preHandler: auth },
    async (request, reply) => {
      const params = z.object({ recommendationId: z.string().min(1) }).parse(request.params);
      const body = z
        .object({
          workspaceId: z.string().min(1).default("grand-king-workspace"),
          outcome: z.enum(["approved", "rejected", "deferred"]),
          notes: z.string().optional(),
        })
        .parse(request.body ?? {});

      const updated = decideExecutiveRecommendation(
        {
          workspaceId: body.workspaceId,
          recommendationId: params.recommendationId,
          outcome: body.outcome,
          actor: request.user!.email ?? request.user!.id,
          notes: body.notes,
        },
        auditLogger,
      );

      if (!updated) {
        return reply.code(404).send({ error: "Recommendation not found" });
      }

      return reply.send({
        record: updated,
        cursorRule: "Executive Council never dispatches Cursor directly. Implementation requires separate Grand King approval.",
      });
    },
  );
}
