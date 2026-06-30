import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { listKnowledgeObjects, getKnowledgeObject, createKnowledgeObject } from "../services/knowledge-object-service.js";
import { listKnowledgeEdges, queryKnowledgeGraph, createKnowledgeEdge, findRelatedObjects } from "../services/knowledge-graph-service.js";
import { listLearningRecords, createLearningRecord, getLearningRecord } from "../services/learning-record-service.js";
import { reasonAboutProduct } from "../services/knowledge-reasoning-service.js";
import { buildEmpireKnowledgeDashboard } from "../services/empire-knowledge-dashboard-service.js";
import { CreateKnowledgeObjectInputSchema } from "../models/knowledge-object.js";
import { CreateKnowledgeEdgeInputSchema } from "../models/knowledge-graph.js";
import { CreateLearningRecordInputSchema } from "../models/learning-record.js";
import { KnowledgeReasoningInputSchema } from "../models/knowledge-reasoning.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerEmpireKnowledgeRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get("/empire-knowledge/objects", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ objectType: z.string().optional() }).parse(request.query);
    return reply.send({ objects: listKnowledgeObjects(user.workspaceId, query.objectType) });
  });

  app.get("/empire-knowledge/objects/:objectId", { preHandler: authenticate }, async (request, reply) => {
    const params = z.object({ objectId: z.string() }).parse(request.params);
    const obj = getKnowledgeObject(params.objectId);
    if (!obj) return reply.status(404).send({ error: "Knowledge object not found" });
    return reply.send({ object: obj });
  });

  app.post("/empire-knowledge/objects", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = CreateKnowledgeObjectInputSchema.parse(request.body);
    const obj = createKnowledgeObject(user.workspaceId, body);
    auditLogger.write({
      action: "empire_knowledge.object.created",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { objectId: obj.objectId, objectType: obj.objectType },
    });
    return reply.send({ object: obj });
  });

  app.get("/empire-knowledge/graph", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    return reply.send({ edges: listKnowledgeEdges(user.workspaceId) });
  });

  app.get("/empire-knowledge/graph/:objectId", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ objectId: z.string() }).parse(request.params);
    const query = z.object({ depth: z.coerce.number().int().min(1).max(5).default(2) }).parse(request.query);
    const graph = queryKnowledgeGraph(user.workspaceId, params.objectId, query.depth);
    if (!graph) return reply.status(404).send({ error: "Root object not found" });
    return reply.send({ graph });
  });

  app.get("/empire-knowledge/graph/:objectId/related", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ objectId: z.string() }).parse(request.params);
    const query = z.object({ relationship: z.string().optional() }).parse(request.query);
    const related = findRelatedObjects(user.workspaceId, params.objectId, query.relationship as never);
    return reply.send({ related });
  });

  app.post("/empire-knowledge/graph/edges", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = CreateKnowledgeEdgeInputSchema.parse(request.body);
    const edge = createKnowledgeEdge(user.workspaceId, body);
    return reply.send({ edge });
  });

  app.get("/empire-knowledge/learnings", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    return reply.send({ learnings: listLearningRecords(user.workspaceId) });
  });

  app.get("/empire-knowledge/learnings/:learningId", { preHandler: authenticate }, async (request, reply) => {
    const params = z.object({ learningId: z.string() }).parse(request.params);
    const record = getLearningRecord(params.learningId);
    if (!record) return reply.status(404).send({ error: "Learning record not found" });
    return reply.send({ learning: record });
  });

  app.post("/empire-knowledge/learnings", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = CreateLearningRecordInputSchema.parse(request.body);
    const learning = createLearningRecord(user.workspaceId, body);
    auditLogger.write({
      action: "empire_knowledge.learning.recorded",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { learningId: learning.learningId, importance: learning.importance },
    });
    return reply.send({ learning });
  });

  app.post("/empire-knowledge/reason", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = KnowledgeReasoningInputSchema.parse(request.body);
    const result = reasonAboutProduct(user.workspaceId, body);
    return reply.send({ reasoning: result });
  });

  app.get("/empire-knowledge/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().optional() }).parse(request.query);
    const dashboard = buildEmpireKnowledgeDashboard(user.workspaceId, query.companyId);
    return reply.send({ dashboard });
  });
}
