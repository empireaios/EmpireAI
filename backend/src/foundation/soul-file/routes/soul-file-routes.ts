import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import {
  diffSoulFile,
  evolveSoulFile,
  exportSoulFile,
  getSoulFile,
  getSoulFileByVersion,
  importSoulFile,
  initializeSoulFile,
  listSoulFileChangeHistory,
  listSoulFileVersions,
  SoulFileIntegrityError,
  verifySoulFileIntegrity,
} from "../services/soul-file-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerSoulFileRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get("/soul-file", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const document = getSoulFile(user.workspaceId);
    return reply.send({ soulFile: document });
  });

  app.post("/soul-file/initialize", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const document = initializeSoulFile(user.workspaceId, user.email);

    auditLogger.write({
      action: "soul_file.initialized",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { version: document.version, checksum: document.checksum },
    });

    return reply.send({ soulFile: document });
  });

  app.post("/soul-file/evolve", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z
      .object({
        identity: z
          .object({
            empireName: z.string().optional(),
            mission: z.string().optional(),
            vision: z.string().optional(),
            principles: z.array(z.string()).optional(),
          })
          .optional(),
        continuity: z
          .object({
            narrative: z.string().optional(),
          })
          .optional(),
        operationalState: z
          .object({
            activeMissions: z.array(z.string()).optional(),
            completedMissions: z.array(z.string()).optional(),
            grandKingsAccountStatus: z.string().optional(),
          })
          .optional(),
        metadata: z.record(z.string()).optional(),
        summary: z.string().optional(),
      })
      .parse(request.body);

    const document = evolveSoulFile({
      workspaceId: user.workspaceId,
      actor: user.email,
      identity: body.identity,
      continuity: body.continuity,
      operationalState: body.operationalState,
      metadata: body.metadata,
      summary: body.summary,
    });

    auditLogger.write({
      action: "soul_file.evolved",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { version: document.version, checksum: document.checksum },
    });

    return reply.send({ soulFile: document });
  });

  app.get("/soul-file/export", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z
      .object({ format: z.enum(["json", "markdown"]).default("json") })
      .parse(request.query);
    const exported = exportSoulFile(user.workspaceId, query.format);

    auditLogger.write({
      action: "soul_file.exported",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { format: query.format, version: exported.version },
    });

    reply.header(
      "Content-Disposition",
      `attachment; filename="soul-file-v${exported.version}.${query.format === "json" ? "json" : "md"}"`,
    );
    reply.header("Content-Type", query.format === "json" ? "application/json" : "text/markdown");
    return reply.send(exported.content);
  });

  app.post("/soul-file/import", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z
      .object({
        format: z.enum(["json", "markdown"]),
        content: z.string().min(1),
      })
      .parse(request.body);

    try {
      const document = importSoulFile({
        workspaceId: user.workspaceId,
        format: body.format,
        content: body.content,
        actor: user.email,
      });

      auditLogger.write({
        action: "soul_file.imported",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { format: body.format, version: document.version },
      });

      return reply.send({ soulFile: document });
    } catch (error) {
      if (error instanceof SoulFileIntegrityError) {
        return reply.code(422).send({ error: error.message, integrityFailed: true });
      }
      throw error;
    }
  });

  app.get("/soul-file/integrity", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const integrity = verifySoulFileIntegrity(user.workspaceId);
    return reply.send({ integrity });
  });

  app.get("/soul-file/versions", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const versions = listSoulFileVersions(user.workspaceId);
    return reply.send({ versions });
  });

  app.get("/soul-file/versions/:version", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ version: z.coerce.number().int().min(1) }).parse(request.params);
    const document = getSoulFileByVersion(user.workspaceId, params.version);
    if (!document) {
      return reply.code(404).send({ error: `Soul File version v${params.version} not found` });
    }
    return reply.send({ soulFile: document });
  });

  app.get("/soul-file/diff", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z
      .object({
        fromVersion: z.coerce.number().int().min(1),
        toVersion: z.coerce.number().int().min(1),
      })
      .parse(request.query);
    const diff = diffSoulFile(user.workspaceId, query.fromVersion, query.toVersion);
    return reply.send({ diff });
  });

  app.get("/soul-file/history", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ limit: z.coerce.number().int().min(1).max(200).optional() }).parse(request.query);
    const history = listSoulFileChangeHistory(user.workspaceId, query.limit);
    return reply.send({ history });
  });
}
