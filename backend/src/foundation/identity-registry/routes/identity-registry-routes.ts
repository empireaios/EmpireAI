import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { IDENTITY_ENTITY_TYPES } from "../models/identity-entity.js";
import {
  addIdentityAlias,
  getIdentityEntity,
  IdentityEntityExistsError,
  IdentityEntityNotFoundError,
  initializeIdentityRegistry,
  listIdentityEntities,
  listIdentityHistory,
  registerIdentityEntity,
  removeIdentityAlias,
  resolveIdentity,
  updateIdentityDisplayName,
} from "../services/identity-registry-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerIdentityRegistryRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get("/identity-registry/entities", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const entities = listIdentityEntities(user.workspaceId);
    return reply.send({ entities });
  });

  app.get("/identity-registry/entities/:canonicalId", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ canonicalId: z.string().min(1) }).parse(request.params);
    const entity = getIdentityEntity(params.canonicalId);

    if (!entity) {
      return reply.code(404).send({ error: "Identity entity not found" });
    }
    if (entity.workspaceId && entity.workspaceId !== user.workspaceId && user.role !== "admin") {
      return reply.code(403).send({ error: "Workspace mismatch" });
    }

    return reply.send({ entity });
  });

  app.get("/identity-registry/resolve", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ q: z.string().min(1) }).parse(request.query);
    const resolved = resolveIdentity(query.q, user.workspaceId);

    if (!resolved) {
      return reply.code(404).send({ error: "No identity entity matched query" });
    }

    return reply.send(resolved);
  });

  app.post("/identity-registry/entities", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    if (user.role !== "founder" && user.role !== "admin") {
      return reply.code(403).send({ error: "Founder or admin required to register identities" });
    }

    const body = z
      .object({
        canonicalId: z.string().min(1),
        entityType: z.enum(IDENTITY_ENTITY_TYPES),
        displayName: z.string().min(1),
        aliases: z.array(z.string()).optional(),
        metadata: z.record(z.string()).optional(),
      })
      .parse(request.body);

    try {
      const entity = registerIdentityEntity({
        ...body,
        workspaceId: user.workspaceId,
        actor: user.email,
      });

      auditLogger.write({
        action: "identity_registry.registered",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { canonicalId: entity.canonicalId, displayName: entity.displayName },
      });

      return reply.send({ entity });
    } catch (error) {
      if (error instanceof IdentityEntityExistsError) {
        return reply.code(409).send({ error: error.message });
      }
      throw error;
    }
  });

  app.patch(
    "/identity-registry/entities/:canonicalId/display-name",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      if (user.role !== "founder" && user.role !== "admin") {
        return reply.code(403).send({ error: "Founder or admin required to rename identities" });
      }

      const params = z.object({ canonicalId: z.string().min(1) }).parse(request.params);
      const body = z.object({ displayName: z.string().min(1) }).parse(request.body);

      try {
        const entity = updateIdentityDisplayName(params.canonicalId, body.displayName, user.email);

        auditLogger.write({
          action: "identity_registry.display_name_updated",
          actor: user.email,
          workspaceId: user.workspaceId,
          correlationId: request.id,
          metadata: { canonicalId: entity.canonicalId, displayName: entity.displayName },
        });

        return reply.send({ entity });
      } catch (error) {
        if (error instanceof IdentityEntityNotFoundError) {
          return reply.code(404).send({ error: error.message });
        }
        throw error;
      }
    },
  );

  app.post(
    "/identity-registry/entities/:canonicalId/aliases",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const params = z.object({ canonicalId: z.string().min(1) }).parse(request.params);
      const body = z.object({ alias: z.string().min(1) }).parse(request.body);

      try {
        const entity = addIdentityAlias(params.canonicalId, body.alias, user.email);
        return reply.send({ entity });
      } catch (error) {
        if (error instanceof IdentityEntityNotFoundError) {
          return reply.code(404).send({ error: error.message });
        }
        throw error;
      }
    },
  );

  app.delete(
    "/identity-registry/entities/:canonicalId/aliases/:alias",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const params = z
        .object({ canonicalId: z.string().min(1), alias: z.string().min(1) })
        .parse(request.params);

      try {
        const entity = removeIdentityAlias(params.canonicalId, params.alias, user.email);
        return reply.send({ entity });
      } catch (error) {
        if (error instanceof IdentityEntityNotFoundError) {
          return reply.code(404).send({ error: error.message });
        }
        throw error;
      }
    },
  );

  app.get(
    "/identity-registry/entities/:canonicalId/history",
    { preHandler: authenticate },
    async (request, reply) => {
      const params = z.object({ canonicalId: z.string().min(1) }).parse(request.params);
      const query = z.object({ limit: z.coerce.number().int().min(1).max(500).optional() }).parse(request.query);
      const history = listIdentityHistory(params.canonicalId, query.limit);
      return reply.send({ history });
    },
  );

  app.post("/identity-registry/initialize", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const entities = initializeIdentityRegistry(user.workspaceId);
    return reply.send({ entities });
  });
}
