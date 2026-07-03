import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import {
  assessImplementationRecommendation,
  buildObjectiveDashboard,
  evaluateAllActiveObjectives,
  evaluateObjective,
  getObjective,
  getObjectiveReportingSummary,
  initializeObjectiveManagement,
  listActiveObjectives,
} from "../services/objective-management-service.js";
import { getObjectiveManagementRepository } from "../repositories/sqlite-objective-management-repository.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerObjectiveManagementRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;

  app.get("/objective-management/objectives", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().optional() }).parse(request.query);
    initializeObjectiveManagement(user.workspaceId, query.companyId ?? "co-grand-king");
    const objectives = listActiveObjectives(user.workspaceId, query.companyId);
    return reply.send({ objectives, total: objectives.length });
  });

  app.get("/objective-management/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send(buildObjectiveDashboard(user.workspaceId, query.companyId));
  });

  app.get("/objective-management/reporting", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().default("co-grand-king") }).parse(request.query);
    return reply.send(getObjectiveReportingSummary(user.workspaceId, query.companyId));
  });

  app.post("/objective-management/evaluate", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z
      .object({
        objectiveId: z.string().optional(),
        companyId: z.string().optional(),
      })
      .parse(request.body ?? {});

    if (body.objectiveId) {
      return reply.send(evaluateObjective(body.objectiveId));
    }

    return reply.send(
      evaluateAllActiveObjectives(user.workspaceId, body.companyId ?? "co-grand-king"),
    );
  });

  app.get("/objective-management/objectives/:objectiveId", { preHandler: authenticate }, async (request, reply) => {
    const params = z.object({ objectiveId: z.string() }).parse(request.params);
    const objective = getObjective(params.objectiveId);
    if (!objective) {
      return reply.code(404).send({ error: "Objective not found" });
    }
    return reply.send(objective);
  });

  app.get("/objective-management/alerts", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ limit: z.coerce.number().int().min(1).max(100).default(20) }).parse(request.query);
    const alerts = getObjectiveManagementRepository().listAlerts(user.workspaceId, query.limit);
    return reply.send({ alerts, total: alerts.length });
  });

  app.post("/objective-management/assess", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z
      .object({
        title: z.string().min(1),
        summary: z.string().min(1),
        objectiveIds: z.array(z.string()).optional(),
        companyId: z.string().optional(),
      })
      .parse(request.body);

    return reply.send(
      assessImplementationRecommendation({
        title: body.title,
        summary: body.summary,
        objectiveIds: body.objectiveIds,
        workspaceId: user.workspaceId,
        companyId: body.companyId ?? "co-grand-king",
      }),
    );
  });
}
