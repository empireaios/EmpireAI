import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildFounderJourney } from "../services/founder-journey-service.js";
import { buildHumanActionQueue } from "../services/human-action-queue-service.js";
import { analyzeAutomationOpportunities } from "../services/automation-opportunity-service.js";
import { buildFounderWorkloadDashboard } from "../services/founder-workload-dashboard-service.js";
import { createAutomationPlan, getLatestAutomationPlan } from "../services/automation-planner-service.js";
import { AutomationPlanInputSchema } from "../models/automation-plan.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerFounderAutomationRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get("/founder-automation/journey", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send({ journey: buildFounderJourney(user.workspaceId, query.companyId) });
  });

  app.get("/founder-automation/queue", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send({ queue: buildHumanActionQueue(user.workspaceId, query.companyId) });
  });

  app.get("/founder-automation/opportunities", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send({ opportunities: analyzeAutomationOpportunities(user.workspaceId, query.companyId) });
  });

  app.post("/founder-automation/plan", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ companyId: z.string().min(1) }).merge(AutomationPlanInputSchema).parse(request.body);
    const plan = createAutomationPlan(user.workspaceId, body.companyId, body);

    auditLogger.write({
      action: "founder_automation.plan.created",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { planId: plan.planId, goal: plan.goal, targetCountryCode: plan.targetCountryCode },
    });

    return reply.send({ plan });
  });

  app.get("/founder-automation/plan", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send({ plan: getLatestAutomationPlan(user.workspaceId, query.companyId) });
  });

  app.get("/founder-automation/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send({ dashboard: buildFounderWorkloadDashboard(user.workspaceId, query.companyId) });
  });
}
