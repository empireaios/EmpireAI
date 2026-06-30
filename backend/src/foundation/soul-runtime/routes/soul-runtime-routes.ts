import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { SOUL_RUNTIME_MEMORY_KEYS } from "../../soul-file/models/soul-file-document.js";
import { soulRuntimeCaptureInputSchema } from "../models/soul-runtime-event.js";
import {
  captureSoulRuntimeEvent,
  getSoulRuntimeEvent,
  listSoulRuntimeEvents,
} from "../services/soul-runtime-engine.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerSoulRuntimeRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.post("/soul-runtime/capture", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = soulRuntimeCaptureInputSchema.parse({
      ...(request.body as Record<string, unknown>),
      workspaceId: user.workspaceId,
      actor: user.email,
      source: "api",
    });

    const event = captureSoulRuntimeEvent(body);

    auditLogger.write({
      action: "soul_runtime.captured",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: {
        eventId: event.eventId,
        memoryKey: event.memoryKey,
        soulFileVersion: event.soulFileVersion,
      },
    });

    return reply.send({ event });
  });

  app.get("/soul-runtime/events", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z
      .object({
        limit: z.coerce.number().int().min(1).max(500).optional(),
        memoryKey: z.enum(SOUL_RUNTIME_MEMORY_KEYS).optional(),
      })
      .parse(request.query);

    let events = listSoulRuntimeEvents(user.workspaceId, query.limit);
    if (query.memoryKey) {
      events = events.filter((event) => event.memoryKey === query.memoryKey);
    }

    return reply.send({ events });
  });

  app.get("/soul-runtime/events/:eventId", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ eventId: z.string().min(1) }).parse(request.params);
    const event = getSoulRuntimeEvent(params.eventId);

    if (!event) {
      return reply.code(404).send({ error: "Soul runtime event not found" });
    }
    if (event.workspaceId !== user.workspaceId && user.role !== "admin") {
      return reply.code(403).send({ error: "Workspace mismatch" });
    }

    return reply.send({ event });
  });
}
