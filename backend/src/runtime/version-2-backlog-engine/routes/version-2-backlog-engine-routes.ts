import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { addVersion2BacklogEntry, buildVersion2BacklogEngine } from "../services/version-2-backlog-engine-service.js";
import { BACKLOG_PRIORITIES, BACKLOG_STATUSES } from "../models/version-2-backlog-engine.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerVersion2BacklogEngineRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;
  app.get("/version-2-backlog-engine/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildVersion2BacklogEngine(user.workspaceId, query.companyId) });
  });
  app.post("/version-2-backlog-engine/entries", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({
      companyId: z.string().default("co-grand-king"),
      origin: z.string(),
      reason: z.string(),
      businessValue: z.string(),
      architectureImpact: z.string(),
      revenueImpact: z.string(),
      uxImpact: z.string(),
      priority: z.enum(BACKLOG_PRIORITIES),
      status: z.enum(BACKLOG_STATUSES).default("OPEN"),
      relatedModules: z.array(z.string()),
      trigger: z.string(),
      owner: z.string(),
    }).parse(request.body);
    const { companyId, ...entry } = body;
    const created = addVersion2BacklogEntry(user.workspaceId, companyId, entry);
    auditLogger.write({ action: "tool.execute", actor: user.email, workspaceId: user.workspaceId, correlationId: request.id, metadata: { entryId: created.entryId, tool: "version_2_backlog_engine.add_entry" } });
    return reply.code(201).send({ entry: created });
  });
}
