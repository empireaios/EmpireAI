import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import {
  approveExecutiveLearning,
  archiveExecutiveLearning,
  editExecutiveLearning,
  getLearningReviewStats,
  listExecutiveKnowledgeBase,
  listPendingLearnings,
  mergeExecutiveLearnings,
  rejectExecutiveLearning,
} from "../service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

function requireFounder(request: FastifyRequest, reply: FastifyReply): boolean {
  const user = request.user;
  if (!user) {
    reply.code(401).send({ error: "Authentication required" });
    return false;
  }
  if (user.role !== "founder" && user.role !== "admin") {
    reply.code(403).send({ error: "Founder access required for Executive Learning" });
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

export async function registerExecutiveLearningRoutes(
  app: FastifyInstance,
  deps: {
    authenticate: AuthMiddleware;
    auditLogger?: AuditLogger;
  },
): Promise<void> {
  const { authenticate, auditLogger } = deps;
  const auth = founderAuth(authenticate);

  app.get(
    "/api/pillow/executive-learning/review",
    { preHandler: auth },
    async (request, reply) => {
      const query = z
        .object({ workspaceId: z.string().min(1).default("grand-king-workspace") })
        .parse(request.query);

      return reply.send({
        stats: getLearningReviewStats(query.workspaceId),
        pending: listPendingLearnings(query.workspaceId),
        knowledgeBase: listExecutiveKnowledgeBase(query.workspaceId),
        missionId: "PEI-EXECUTIVE-LEARNING",
      });
    },
  );

  app.post(
    "/api/pillow/executive-learning/:learningId/approve",
    { preHandler: auth },
    async (request, reply) => {
      const params = z.object({ learningId: z.string().min(1) }).parse(request.params);
      const body = z
        .object({ workspaceId: z.string().min(1).default("grand-king-workspace") })
        .parse(request.body ?? {});

      const knowledge = approveExecutiveLearning(
        {
          learningId: params.learningId,
          workspaceId: body.workspaceId,
          actor: request.user!.email ?? request.user!.id,
        },
        auditLogger,
      );
      if (!knowledge) {
        return reply.code(404).send({ error: "Pending learning not found" });
      }
      return reply.send({ knowledge });
    },
  );

  app.post(
    "/api/pillow/executive-learning/:learningId/reject",
    { preHandler: auth },
    async (request, reply) => {
      const params = z.object({ learningId: z.string().min(1) }).parse(request.params);
      const body = z
        .object({
          workspaceId: z.string().min(1).default("grand-king-workspace"),
          notes: z.string().optional(),
        })
        .parse(request.body ?? {});

      const rejected = rejectExecutiveLearning(
        {
          learningId: params.learningId,
          workspaceId: body.workspaceId,
          actor: request.user!.email ?? request.user!.id,
          notes: body.notes,
        },
        auditLogger,
      );
      if (!rejected) {
        return reply.code(404).send({ error: "Pending learning not found" });
      }
      return reply.send({ learning: rejected });
    },
  );

  app.patch(
    "/api/pillow/executive-learning/:learningId",
    { preHandler: auth },
    async (request, reply) => {
      const params = z.object({ learningId: z.string().min(1) }).parse(request.params);
      const body = z
        .object({
          workspaceId: z.string().min(1).default("grand-king-workspace"),
          title: z.string().min(1).optional(),
          description: z.string().min(1).optional(),
          category: z.enum(["A", "B", "C", "D"]).optional(),
        })
        .parse(request.body ?? {});

      const updated = editExecutiveLearning({
        learningId: params.learningId,
        workspaceId: body.workspaceId,
        actor: request.user!.email ?? request.user!.id,
        title: body.title,
        description: body.description,
        category: body.category,
      });
      if (!updated) {
        return reply.code(404).send({ error: "Pending learning not found" });
      }
      return reply.send({ learning: updated });
    },
  );

  app.post(
    "/api/pillow/executive-learning/merge",
    { preHandler: auth },
    async (request, reply) => {
      const body = z
        .object({
          workspaceId: z.string().min(1).default("grand-king-workspace"),
          sourceLearningIds: z.array(z.string().min(1)).min(2),
          targetTitle: z.string().min(1),
          targetDescription: z.string().min(1),
        })
        .parse(request.body ?? {});

      const merged = mergeExecutiveLearnings(
        {
          workspaceId: body.workspaceId,
          actor: request.user!.email ?? request.user!.id,
          sourceLearningIds: body.sourceLearningIds,
          targetTitle: body.targetTitle,
          targetDescription: body.targetDescription,
        },
        auditLogger,
      );
      if (!merged) {
        return reply.code(400).send({ error: "Unable to merge learnings" });
      }
      return reply.send({ learning: merged });
    },
  );

  app.post(
    "/api/pillow/executive-learning/:learningId/archive",
    { preHandler: auth },
    async (request, reply) => {
      const params = z.object({ learningId: z.string().min(1) }).parse(request.params);
      const body = z
        .object({
          workspaceId: z.string().min(1).default("grand-king-workspace"),
          notes: z.string().optional(),
        })
        .parse(request.body ?? {});

      const archived = archiveExecutiveLearning(
        {
          learningId: params.learningId,
          workspaceId: body.workspaceId,
          actor: request.user!.email ?? request.user!.id,
          notes: body.notes,
        },
        auditLogger,
      );
      if (!archived) {
        return reply.code(404).send({ error: "Learning not found" });
      }
      return reply.send({ learning: archived });
    },
  );
}
