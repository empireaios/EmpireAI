import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { STRATEGIC_MEMORY_CATEGORIES } from "../models/strategic-memory.js";
import {
  archiveStrategicMemory,
  getStrategicMemory,
  getStrategicMemorySummary,
  initializeStrategicMemory,
  listStrategicMemories,
  listStrategicMemoryLifecycle,
  listWorkspaceStrategicMemoryLifecycle,
  modifyStrategicMemory,
  recallStrategicMemories,
  recordStrategicMemory,
  StrategicMemoryConflictError,
  StrategicMemoryNotFoundError,
  supersedeStrategicMemory,
} from "../services/strategic-memory-engine-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerStrategicMemoryRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get("/strategic-memory/memories", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z
      .object({
        category: z.enum(STRATEGIC_MEMORY_CATEGORIES).optional(),
        status: z.enum(["ACTIVE", "ARCHIVED", "SUPERSEDED"]).optional(),
      })
      .parse(request.query);
    const memories = listStrategicMemories(user.workspaceId, query);
    return reply.send({ memories, total: memories.length });
  });

  app.get("/strategic-memory/summary", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const summary = getStrategicMemorySummary(user.workspaceId);
    return reply.send({ summary });
  });

  app.get("/strategic-memory/memories/:memoryId", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ memoryId: z.string().min(1) }).parse(request.params);
    initializeStrategicMemory(user.workspaceId);
    const memory = getStrategicMemory(params.memoryId);

    if (!memory) {
      return reply.code(404).send({ error: "Strategic memory not found" });
    }
    if (memory.workspaceId !== user.workspaceId && user.role !== "admin") {
      return reply.code(403).send({ error: "Workspace mismatch" });
    }

    return reply.send({ memory });
  });

  app.post("/strategic-memory/memories", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;

    const body = z
      .object({
        memoryId: z.string().min(1),
        category: z.enum(STRATEGIC_MEMORY_CATEGORIES),
        title: z.string().min(1),
        insight: z.string().min(1),
        context: z.string().optional(),
        tags: z.array(z.string()).optional(),
        source: z.string().optional(),
        importance: z.number().int().min(1).max(5).optional(),
        metadata: z.record(z.string()).optional(),
      })
      .parse(request.body);

    try {
      const memory = recordStrategicMemory({
        ...body,
        workspaceId: user.workspaceId,
        actor: user.email,
        correlationId: request.id,
      });

      auditLogger.write({
        action: "strategic_memory.recorded",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { memoryId: memory.memoryId, category: memory.category },
      });

      return reply.code(201).send({ memory });
    } catch (error) {
      if (error instanceof StrategicMemoryConflictError) {
        return reply.code(409).send({ error: error.message });
      }
      throw error;
    }
  });

  app.post("/strategic-memory/recall", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z
      .object({
        category: z.enum(STRATEGIC_MEMORY_CATEGORIES).optional(),
        query: z.string().optional(),
        tags: z.array(z.string()).optional(),
        limit: z.number().int().min(1).max(100).optional(),
      })
      .parse(request.body ?? {});

    const memories = recallStrategicMemories({
      workspaceId: user.workspaceId,
      ...body,
      actor: user.email,
    });

    auditLogger.write({
      action: "strategic_memory.recalled",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { count: memories.length, category: body.category ?? "all" },
    });

    return reply.send({ memories, total: memories.length });
  });

  app.patch("/strategic-memory/memories/:memoryId", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ memoryId: z.string().min(1) }).parse(request.params);
    const body = z
      .object({
        title: z.string().min(1).optional(),
        insight: z.string().min(1).optional(),
        context: z.string().optional(),
        tags: z.array(z.string()).optional(),
        importance: z.number().int().min(1).max(5).optional(),
        metadata: z.record(z.string()).optional(),
      })
      .parse(request.body);

    try {
      const memory = modifyStrategicMemory({ memoryId: params.memoryId, ...body, actor: user.email });
      auditLogger.write({
        action: "strategic_memory.modified",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { memoryId: memory.memoryId },
      });
      return reply.send({ memory });
    } catch (error) {
      if (error instanceof StrategicMemoryNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      if (error instanceof StrategicMemoryConflictError) {
        return reply.code(409).send({ error: error.message });
      }
      throw error;
    }
  });

  app.post("/strategic-memory/memories/:memoryId/archive", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ memoryId: z.string().min(1) }).parse(request.params);
    const body = z.object({ reason: z.string().optional() }).parse(request.body ?? {});

    try {
      const memory = archiveStrategicMemory(params.memoryId, user.email, body.reason);
      auditLogger.write({
        action: "strategic_memory.archived",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { memoryId: memory.memoryId },
      });
      return reply.send({ memory });
    } catch (error) {
      if (error instanceof StrategicMemoryNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.post("/strategic-memory/memories/:memoryId/supersede", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ memoryId: z.string().min(1) }).parse(request.params);
    const body = z.object({ supersededBy: z.string().min(1) }).parse(request.body);

    try {
      const memory = supersedeStrategicMemory(params.memoryId, body.supersededBy, user.email);
      auditLogger.write({
        action: "strategic_memory.superseded",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { memoryId: memory.memoryId, supersededBy: body.supersededBy },
      });
      return reply.send({ memory });
    } catch (error) {
      if (error instanceof StrategicMemoryNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.get("/strategic-memory/lifecycle/:memoryId", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ memoryId: z.string().min(1) }).parse(request.params);
    const query = z.object({ limit: z.coerce.number().int().min(1).max(500).optional() }).parse(request.query);
    initializeStrategicMemory(user.workspaceId);
    const lifecycle = listStrategicMemoryLifecycle(params.memoryId, query.limit);
    return reply.send({ lifecycle });
  });

  app.get("/strategic-memory/lifecycle", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ limit: z.coerce.number().int().min(1).max(500).optional() }).parse(request.query);
    initializeStrategicMemory(user.workspaceId);
    const lifecycle = listWorkspaceStrategicMemoryLifecycle(user.workspaceId, query.limit);
    return reply.send({ lifecycle });
  });
}
