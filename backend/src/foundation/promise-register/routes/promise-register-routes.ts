import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { PROMISE_STATUSES } from "../models/king-promise.js";
import {
  addPromiseDependency,
  fulfillPromise,
  getPromise,
  getPromiseDependencyGraph,
  initializePromiseRegister,
  listPromiseLifecycle,
  listPromises,
  listWorkspacePromiseLifecycle,
  markPromiseObsolete,
  modifyPromise,
  PromiseConflictError,
  PromiseNotFoundError,
  registerPromise,
  removePromiseDependency,
  supersedePromise,
  updatePromiseProgress,
} from "../services/promise-register-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerPromiseRegisterRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get("/promise-register/promises", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ status: z.enum(PROMISE_STATUSES).optional() }).parse(request.query);
    const promises = listPromises(user.workspaceId, query.status);
    return reply.send({ promises, total: promises.length });
  });

  app.get("/promise-register/promises/:promiseId", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ promiseId: z.string().min(1) }).parse(request.params);
    initializePromiseRegister(user.workspaceId);
    const promise = getPromise(params.promiseId);

    if (!promise) {
      return reply.code(404).send({ error: "Promise not found" });
    }
    if (promise.workspaceId !== user.workspaceId && user.role !== "admin") {
      return reply.code(403).send({ error: "Workspace mismatch" });
    }

    return reply.send({ promise });
  });

  app.post("/promise-register/promises", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;

    const body = z
      .object({
        promiseId: z.string().min(1),
        title: z.string().min(1),
        statement: z.string().min(1),
        madeToKingId: z.string().optional(),
        dependencies: z.array(z.string()).optional(),
        metadata: z.record(z.string()).optional(),
      })
      .parse(request.body);

    try {
      const promise = registerPromise({
        ...body,
        workspaceId: user.workspaceId,
        actor: user.email,
      });

      auditLogger.write({
        action: "promise_register.registered",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { promiseId: promise.promiseId, title: promise.title },
      });

      return reply.code(201).send({ promise });
    } catch (error) {
      if (error instanceof PromiseConflictError) {
        return reply.code(409).send({ error: error.message });
      }
      throw error;
    }
  });

  app.patch("/promise-register/promises/:promiseId", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ promiseId: z.string().min(1) }).parse(request.params);
    const body = z
      .object({
        title: z.string().min(1).optional(),
        statement: z.string().min(1).optional(),
        metadata: z.record(z.string()).optional(),
      })
      .parse(request.body);

    try {
      const promise = modifyPromise({ promiseId: params.promiseId, ...body, actor: user.email });
      auditLogger.write({
        action: "promise_register.modified",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { promiseId: promise.promiseId },
      });
      return reply.send({ promise });
    } catch (error) {
      if (error instanceof PromiseNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      if (error instanceof PromiseConflictError) {
        return reply.code(409).send({ error: error.message });
      }
      throw error;
    }
  });

  app.patch("/promise-register/promises/:promiseId/progress", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ promiseId: z.string().min(1) }).parse(request.params);
    const body = z
      .object({
        progressPercent: z.number().int().min(0).max(100),
        progressNotes: z.string().optional(),
        status: z.enum(["PENDING", "IN_PROGRESS"]).optional(),
      })
      .parse(request.body);

    try {
      const promise = updatePromiseProgress({
        promiseId: params.promiseId,
        ...body,
        actor: user.email,
      });
      auditLogger.write({
        action: "promise_register.progress_updated",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { promiseId: promise.promiseId, progressPercent: promise.progressPercent },
      });
      return reply.send({ promise });
    } catch (error) {
      if (error instanceof PromiseNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      if (error instanceof PromiseConflictError) {
        return reply.code(409).send({ error: error.message });
      }
      throw error;
    }
  });

  app.post("/promise-register/promises/:promiseId/dependencies", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ promiseId: z.string().min(1) }).parse(request.params);
    const body = z.object({ dependencyId: z.string().min(1) }).parse(request.body);

    try {
      const promise = addPromiseDependency(params.promiseId, body.dependencyId, user.email);
      return reply.send({ promise });
    } catch (error) {
      if (error instanceof PromiseNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      if (error instanceof PromiseConflictError) {
        return reply.code(409).send({ error: error.message });
      }
      throw error;
    }
  });

  app.delete("/promise-register/promises/:promiseId/dependencies/:dependencyId", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z
      .object({ promiseId: z.string().min(1), dependencyId: z.string().min(1) })
      .parse(request.params);

    try {
      const promise = removePromiseDependency(params.promiseId, params.dependencyId, user.email);
      return reply.send({ promise });
    } catch (error) {
      if (error instanceof PromiseNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      if (error instanceof PromiseConflictError) {
        return reply.code(409).send({ error: error.message });
      }
      throw error;
    }
  });

  app.post("/promise-register/promises/:promiseId/fulfill", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ promiseId: z.string().min(1) }).parse(request.params);
    const body = z.object({ notes: z.string().optional() }).parse(request.body ?? {});

    try {
      const promise = fulfillPromise(params.promiseId, user.email, body.notes);
      auditLogger.write({
        action: "promise_register.fulfilled",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { promiseId: promise.promiseId },
      });
      return reply.send({ promise });
    } catch (error) {
      if (error instanceof PromiseNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      if (error instanceof PromiseConflictError) {
        return reply.code(409).send({ error: error.message });
      }
      throw error;
    }
  });

  app.post("/promise-register/promises/:promiseId/obsolete", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ promiseId: z.string().min(1) }).parse(request.params);
    const body = z.object({ reason: z.string().optional() }).parse(request.body ?? {});

    try {
      const promise = markPromiseObsolete(params.promiseId, user.email, body.reason);
      auditLogger.write({
        action: "promise_register.obsoleted",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { promiseId: promise.promiseId },
      });
      return reply.send({ promise });
    } catch (error) {
      if (error instanceof PromiseNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.post("/promise-register/promises/:promiseId/supersede", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ promiseId: z.string().min(1) }).parse(request.params);
    const body = z.object({ supersededBy: z.string().min(1) }).parse(request.body);

    try {
      const promise = supersedePromise(params.promiseId, body.supersededBy, user.email);
      auditLogger.write({
        action: "promise_register.superseded",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { promiseId: promise.promiseId, supersededBy: body.supersededBy },
      });
      return reply.send({ promise });
    } catch (error) {
      if (error instanceof PromiseNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.get("/promise-register/lifecycle/:promiseId", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ promiseId: z.string().min(1) }).parse(request.params);
    const query = z.object({ limit: z.coerce.number().int().min(1).max(500).optional() }).parse(request.query);
    initializePromiseRegister(user.workspaceId);
    const lifecycle = listPromiseLifecycle(params.promiseId, query.limit);
    return reply.send({ lifecycle });
  });

  app.get("/promise-register/lifecycle", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ limit: z.coerce.number().int().min(1).max(500).optional() }).parse(request.query);
    initializePromiseRegister(user.workspaceId);
    const lifecycle = listWorkspacePromiseLifecycle(user.workspaceId, query.limit);
    return reply.send({ lifecycle });
  });

  app.get("/promise-register/dependency-graph", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const graph = getPromiseDependencyGraph(user.workspaceId);
    return reply.send(graph);
  });
}
