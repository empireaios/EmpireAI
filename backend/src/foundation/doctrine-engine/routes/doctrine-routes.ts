import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { DOCTRINE_STATUSES, doctrineExecutablePolicySchema } from "../models/doctrine.js";
import {
  deprecateDoctrine,
  DoctrineConflictError,
  DoctrineNotFoundError,
  getDoctrine,
  getExecutableDoctrinePolicies,
  initializeDoctrines,
  listDoctrineLifecycle,
  listDoctrines,
  listWorkspaceDoctrineLifecycle,
  modifyDoctrine,
  publishDoctrine,
  recordDoctrineReference,
  supersedeDoctrine,
} from "../services/doctrine-engine-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerDoctrineRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get("/doctrine/doctrines", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ status: z.enum(DOCTRINE_STATUSES).optional() }).parse(request.query);
    const doctrines = listDoctrines(user.workspaceId, query.status);
    return reply.send({ doctrines });
  });

  app.get("/doctrine/doctrines/:doctrineId", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ doctrineId: z.string().min(1) }).parse(request.params);
    initializeDoctrines(user.workspaceId);
    const doctrine = getDoctrine(params.doctrineId);

    if (!doctrine) {
      return reply.code(404).send({ error: "Doctrine not found" });
    }
    if (doctrine.workspaceId !== user.workspaceId && user.role !== "admin") {
      return reply.code(403).send({ error: "Workspace mismatch" });
    }

    return reply.send({ doctrine });
  });

  app.post("/doctrine/doctrines", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    if (user.role !== "founder" && user.role !== "admin") {
      return reply.code(403).send({ error: "Founder or admin required to publish doctrines" });
    }

    const body = z
      .object({
        doctrineId: z.string().min(1),
        title: z.string().min(1),
        statement: z.string().min(1),
        executablePolicy: doctrineExecutablePolicySchema.optional(),
        metadata: z.record(z.string()).optional(),
      })
      .parse(request.body);

    try {
      const doctrine = publishDoctrine({
        ...body,
        workspaceId: user.workspaceId,
        actor: user.email,
      });

      auditLogger.write({
        action: "doctrine.published",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { doctrineId: doctrine.doctrineId, title: doctrine.title },
      });

      return reply.code(201).send({ doctrine });
    } catch (error) {
      if (error instanceof DoctrineConflictError) {
        return reply.code(409).send({ error: error.message });
      }
      throw error;
    }
  });

  app.patch("/doctrine/doctrines/:doctrineId", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    if (user.role !== "founder" && user.role !== "admin") {
      return reply.code(403).send({ error: "Founder or admin required to modify doctrines" });
    }

    const params = z.object({ doctrineId: z.string().min(1) }).parse(request.params);
    const body = z
      .object({
        title: z.string().min(1).optional(),
        statement: z.string().min(1).optional(),
        executablePolicy: doctrineExecutablePolicySchema.optional(),
        metadata: z.record(z.string()).optional(),
      })
      .parse(request.body);

    try {
      const doctrine = modifyDoctrine({
        doctrineId: params.doctrineId,
        ...body,
        actor: user.email,
      });

      auditLogger.write({
        action: "doctrine.modified",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { doctrineId: doctrine.doctrineId, version: doctrine.version },
      });

      return reply.send({ doctrine });
    } catch (error) {
      if (error instanceof DoctrineNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      if (error instanceof DoctrineConflictError) {
        return reply.code(409).send({ error: error.message });
      }
      throw error;
    }
  });

  app.post("/doctrine/doctrines/:doctrineId/deprecate", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    if (user.role !== "founder" && user.role !== "admin") {
      return reply.code(403).send({ error: "Founder or admin required to deprecate doctrines" });
    }

    const params = z.object({ doctrineId: z.string().min(1) }).parse(request.params);
    const body = z.object({ reason: z.string().optional() }).parse(request.body ?? {});

    try {
      const doctrine = deprecateDoctrine(params.doctrineId, user.email, body.reason);

      auditLogger.write({
        action: "doctrine.deprecated",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { doctrineId: doctrine.doctrineId },
      });

      return reply.send({ doctrine });
    } catch (error) {
      if (error instanceof DoctrineNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.post("/doctrine/doctrines/:doctrineId/supersede", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    if (user.role !== "founder" && user.role !== "admin") {
      return reply.code(403).send({ error: "Founder or admin required to supersede doctrines" });
    }

    const params = z.object({ doctrineId: z.string().min(1) }).parse(request.params);
    const body = z.object({ supersededBy: z.string().min(1) }).parse(request.body);

    try {
      const doctrine = supersedeDoctrine(params.doctrineId, body.supersededBy, user.email);

      auditLogger.write({
        action: "doctrine.superseded",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { doctrineId: doctrine.doctrineId, supersededBy: body.supersededBy },
      });

      return reply.send({ doctrine });
    } catch (error) {
      if (error instanceof DoctrineNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.post("/doctrine/doctrines/:doctrineId/reference", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ doctrineId: z.string().min(1) }).parse(request.params);
    const body = z
      .object({
        module: z.string().optional(),
        action: z.string().optional(),
      })
      .parse(request.body ?? {});

    try {
      const doctrine = recordDoctrineReference(params.doctrineId, {
        actor: user.email,
        correlationId: request.id,
        module: body.module,
        action: body.action,
      });

      auditLogger.write({
        action: "doctrine.referenced",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { doctrineId: doctrine.doctrineId, referenceCount: doctrine.referenceCount },
      });

      return reply.send({ doctrine });
    } catch (error) {
      if (error instanceof DoctrineNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.get("/doctrine/lifecycle/:doctrineId", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ doctrineId: z.string().min(1) }).parse(request.params);
    const query = z.object({ limit: z.coerce.number().int().min(1).max(500).optional() }).parse(request.query);
    initializeDoctrines(user.workspaceId);

    const doctrine = getDoctrine(params.doctrineId);
    if (!doctrine) {
      return reply.code(404).send({ error: "Doctrine not found" });
    }

    const lifecycle = listDoctrineLifecycle(params.doctrineId, query.limit);
    return reply.send({ lifecycle });
  });

  app.get("/doctrine/lifecycle", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ limit: z.coerce.number().int().min(1).max(500).optional() }).parse(request.query);
    initializeDoctrines(user.workspaceId);
    const lifecycle = listWorkspaceDoctrineLifecycle(user.workspaceId, query.limit);
    return reply.send({ lifecycle });
  });

  app.get("/doctrine/policies", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const policies = getExecutableDoctrinePolicies(user.workspaceId);
    return reply.send({ policies });
  });
}
