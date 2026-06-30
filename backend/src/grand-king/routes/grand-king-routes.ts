import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../auth/middleware.js";
import { GRAND_KING_WORKSPACE_ID } from "../constants.js";
import { buildGrandKingAccountDashboard } from "../services/grand-king-dashboard-service.js";
import { getGrandKingRepository } from "../repositories/sqlite-grand-king-repository.js";
import { GRAND_KING_AUTOMATION_JOBS, runGrandKingAutomationJob, runAllGrandKingAutomationJobs } from "../automation/grand-king-automation-jobs.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerGrandKingRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get("/grand-king/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    return reply.send({ dashboard: buildGrandKingAccountDashboard(user.workspaceId) });
  });

  app.get("/grand-king/products", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    return reply.send({ products: getGrandKingRepository().listProducts(user.workspaceId) });
  });

  app.get("/grand-king/tasks", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    return reply.send({ tasks: getGrandKingRepository().listTasks(user.workspaceId) });
  });

  app.get("/grand-king/suppliers", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    return reply.send({ suppliers: getGrandKingRepository().listSuppliers(user.workspaceId) });
  });

  app.get("/grand-king/orders", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    return reply.send({ orders: getGrandKingRepository().listOrders(user.workspaceId) });
  });

  app.get("/grand-king/decisions", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    return reply.send({ decisions: getGrandKingRepository().listAiDecisions(user.workspaceId) });
  });

  app.get("/grand-king/automation/jobs", { preHandler: authenticate }, async (_request, reply) => {
    return reply.send({
      jobs: GRAND_KING_AUTOMATION_JOBS.map((j) => ({ name: j.name, cron: j.cron, description: j.description })),
      scope: "grand-king-only",
      workspaceId: GRAND_KING_WORKSPACE_ID,
    });
  });

  app.post("/grand-king/automation/run", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ jobName: z.string().optional() }).parse(request.body ?? {});
    const result = body.jobName
      ? await runGrandKingAutomationJob(body.jobName)
      : { ok: true, detail: JSON.stringify(await runAllGrandKingAutomationJobs()) };

    auditLogger.write({
      action: "grand_king.automation.run",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { jobName: body.jobName ?? "all" },
    });

    return reply.send(result);
  });
}
