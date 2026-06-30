import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import {
  decideMission,
  getCommerceIntelligenceDashboard,
  getMission,
  listLaunchStatus,
  listMissions,
  listQueueEntries,
  MissionNotReadyError,
  runCommerceIntelligencePipeline,
} from "../services/pipeline-service.js";
import { executeApprovedLaunch, LaunchAutomationBlockedError } from "../services/launch-automation-service.js";
import { buildCommercePillowContext } from "../services/commerce-pillow-context-service.js";
import {
  getMissionPerformance,
  monitorMissionPerformance,
} from "../services/performance-monitoring-service.js";
import { listFollowUpMissions } from "../store/commerce-intelligence-store.js";
import { isMissionWhyDecisionOutcome } from "../models/commerce-intelligence-core.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

function requireFounder(
  request: { user?: { role: string } },
  reply: { code: (n: number) => { send: (b: unknown) => void }; sent?: boolean },
): boolean {
  const user = request.user;
  if (!user) {
    reply.code(401).send({ error: "Authentication required" });
    return false;
  }
  if (user.role !== "founder" && user.role !== "admin") {
    reply.code(403).send({ error: "Commerce Intelligence OS is founder-only" });
    return false;
  }
  return true;
}

export async function registerCommerceIntelligenceCoreRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get("/commerce-intelligence-core/dashboard", { preHandler: authenticate }, async (request, reply) => {
    if (!requireFounder(request, reply)) return;
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1).default("co-grand-king") }).parse(request.query);
    return reply.send({
      dashboard: getCommerceIntelligenceDashboard(user.workspaceId, query.companyId),
    });
  });

  app.get("/commerce-intelligence-core/queue", { preHandler: authenticate }, async (request, reply) => {
    if (!requireFounder(request, reply)) return;
    const user = request.user!;
    const queue = listQueueEntries(user.workspaceId);
    return reply.send({ queue, total: queue.length, intelligenceOwner: "pillow" });
  });

  app.post("/commerce-intelligence-core/pull", { preHandler: authenticate }, async (request, reply) => {
    if (!requireFounder(request, reply)) return;
    const user = request.user!;
    const body = z
      .object({
        companyId: z.string().min(1).default("co-grand-king"),
        keyword: z.string().optional(),
      })
      .parse(request.body ?? {});

    const result = await runCommerceIntelligencePipeline(
      user.workspaceId,
      body.companyId,
      body.keyword,
    );

    auditLogger.write({
      action: "commerce_intelligence.pull",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: {
        pulled: result.pulled,
        missionsCreated: result.missionsCreated,
        rejected: result.rejected,
        intelligenceOwner: "pillow",
      },
    });

    return reply.code(201).send({ result, intelligenceOwner: "pillow" });
  });

  app.get("/commerce-intelligence-core/missions", { preHandler: authenticate }, async (request, reply) => {
    if (!requireFounder(request, reply)) return;
    const user = request.user!;
    const missions = listMissions(user.workspaceId);
    return reply.send({ missions, total: missions.length, intelligenceOwner: "pillow" });
  });

  app.get("/commerce-intelligence-core/missions/:missionId", { preHandler: authenticate }, async (request, reply) => {
    if (!requireFounder(request, reply)) return;
    const user = request.user!;
    const { missionId } = z.object({ missionId: z.string().min(1) }).parse(request.params);
    const mission = getMission(user.workspaceId, missionId);
    if (!mission) return reply.code(404).send({ error: "Mission not found" });
    return reply.send({ mission, intelligenceOwner: "pillow" });
  });

  app.post(
    "/commerce-intelligence-core/missions/:missionId/decide",
    { preHandler: authenticate },
    async (request, reply) => {
      if (!requireFounder(request, reply)) return;
      const user = request.user!;
      const { missionId } = z.object({ missionId: z.string().min(1) }).parse(request.params);
      const body = z
        .object({
          decision: z.enum(["approve", "reject", "defer", "why"]),
          note: z.string().optional(),
        })
        .parse(request.body);

      try {
        const outcome = decideMission(
          user.workspaceId,
          missionId,
          body.decision,
          user.email,
          body.note,
        );

        if (isMissionWhyDecisionOutcome(outcome)) {
          return reply.send({ whyEvidence: outcome.whyEvidence, mission: outcome.mission });
        }

        auditLogger.write({
          action: "commerce_intelligence.mission_decision",
          actor: user.email,
          workspaceId: user.workspaceId,
          correlationId: request.id,
          metadata: { missionId, decision: body.decision, status: outcome.status },
        });

        return reply.send({ mission: outcome, intelligenceOwner: "pillow" });
      } catch (error) {
        if (error instanceof MissionNotReadyError) {
          return reply.code(403).send({ error: error.message, proposalReadiness: "NOT_READY" });
        }
        const message = error instanceof Error ? error.message : "Decision failed";
        return reply.code(404).send({ error: message });
      }
    },
  );

  app.post(
    "/commerce-intelligence-core/missions/:missionId/execute-launch",
    { preHandler: authenticate },
    async (request, reply) => {
      if (!requireFounder(request, reply)) return;
      const user = request.user!;
      const { missionId } = z.object({ missionId: z.string().min(1) }).parse(request.params);

      try {
        const mission = executeApprovedLaunch(user.workspaceId, missionId, user.email);

        auditLogger.write({
          action: "commerce_intelligence.launch_executed",
          actor: user.email,
          workspaceId: user.workspaceId,
          correlationId: request.id,
          metadata: {
            missionId,
            gkrProductId: mission.gkrProductId,
            approvalGated: true,
          },
        });

        return reply.send({ mission, intelligenceOwner: "pillow" });
      } catch (error) {
        if (error instanceof LaunchAutomationBlockedError) {
          return reply.code(403).send({ error: error.message, approvalGated: true });
        }
        const message = error instanceof Error ? error.message : "Launch execution failed";
        return reply.code(400).send({ error: message });
      }
    },
  );

  app.get("/commerce-intelligence-core/pillow-context", { preHandler: authenticate }, async (request, reply) => {
    if (!requireFounder(request, reply)) return;
    const user = request.user!;
    const query = z
      .object({ missionId: z.string().optional(), candidateId: z.string().optional() })
      .parse(request.query);
    const context = buildCommercePillowContext(user.workspaceId, query.missionId, query.candidateId);
    return reply.send({ context, intelligenceOwner: "pillow" });
  });

  app.get(
    "/commerce-intelligence-core/missions/:missionId/performance",
    { preHandler: authenticate },
    async (request, reply) => {
      if (!requireFounder(request, reply)) return;
      const user = request.user!;
      const { missionId } = z.object({ missionId: z.string().min(1) }).parse(request.params);
      const performance = getMissionPerformance(user.workspaceId, missionId);
      return reply.send({ ...performance, intelligenceOwner: "pillow" });
    },
  );

  app.post(
    "/commerce-intelligence-core/missions/:missionId/monitor",
    { preHandler: authenticate },
    async (request, reply) => {
      if (!requireFounder(request, reply)) return;
      const user = request.user!;
      const { missionId } = z.object({ missionId: z.string().min(1) }).parse(request.params);
      try {
        const result = monitorMissionPerformance(user.workspaceId, missionId);
        auditLogger.write({
          action: "commerce_intelligence.monitor",
          actor: user.email,
          workspaceId: user.workspaceId,
          correlationId: request.id,
          metadata: { missionId, followUpCount: result.followUps.length },
        });
        return reply.send({ ...result, intelligenceOwner: "pillow" });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Monitoring failed";
        return reply.code(400).send({ error: message });
      }
    },
  );

  app.get("/commerce-intelligence-core/follow-up-missions", { preHandler: authenticate }, async (request, reply) => {
    if (!requireFounder(request, reply)) return;
    const user = request.user!;
    const followUps = listFollowUpMissions(user.workspaceId);
    return reply.send({ followUps, total: followUps.length, intelligenceOwner: "pillow" });
  });

  app.get("/commerce-intelligence-core/launch-status", { preHandler: authenticate }, async (request, reply) => {
    if (!requireFounder(request, reply)) return;
    const user = request.user!;
    const entries = listLaunchStatus(user.workspaceId);
    return reply.send({ entries, total: entries.length, intelligenceOwner: "pillow" });
  });

  app.get("/health/commerce-intelligence-core", async (_request, reply) => {
    return reply.send({
      status: "HEALTHY",
      moduleId: "commerce-intelligence-core",
      missionId: "PILLOW-020",
      programLabel: "Commerce Intelligence Operating System",
      intelligenceOwner: "pillow",
      approvalGatedLaunch: true,
    });
  });
}
