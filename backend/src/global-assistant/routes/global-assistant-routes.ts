import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../auth/middleware.js";
import { ChatRequestSchema, WhyEvidenceQuerySchema } from "../models/global-assistant.js";
import {
  buildGlobalAssistantDashboard,
  buildWhyResponse,
  createAssistantSession,
  getAssistantHistory,
  sendAssistantMessage,
} from "../services/assistant-service.js";
import { buildAssistantContextBundle } from "../services/context-service.js";
import { generateExecutiveAuditArtifact, getExecutiveAuditArtifact } from "../services/audit-service.js";
import {
  decideAssistantCommand,
  getAssistantCommand,
  requestAuditGenerationCommand,
  requestMissionGenerationCommand,
} from "../services/command-service.js";
import { generateAssistantMissions } from "../services/mission-service.js";
import { getContextualHelp, listGuidedWorkflows } from "../services/workflow-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

/** GC-05 — Global AI Assistant routes (REAL-031/032/033 + executive-council owners). */
export async function registerGlobalAssistantRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get("/global-assistant/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send({ dashboard: buildGlobalAssistantDashboard(user.workspaceId, query.companyId) });
  });

  app.get("/global-assistant/context", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z
      .object({
        companyId: z.string().min(1),
        screenPath: z.string().min(1),
        kpiLabel: z.string().optional(),
      })
      .parse(request.query);
    return reply.send({
      context: buildAssistantContextBundle(
        user.workspaceId,
        query.companyId,
        query.screenPath,
        query.kpiLabel,
      ),
    });
  });

  app.post("/global-assistant/session", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z
      .object({
        companyId: z.string().min(1),
        screenPath: z.string().min(1),
        kpiLabel: z.string().optional(),
      })
      .parse(request.body);
    const session = createAssistantSession(
      user.workspaceId,
      body.companyId,
      body.screenPath,
      body.kpiLabel,
    );
    auditLogger.write({
      action: "global_assistant.session.create",
      actor: user.email,
      workspaceId: user.workspaceId,
      companyId: body.companyId,
      correlationId: request.id,
      metadata: { sessionId: session.sessionId, screenPath: body.screenPath },
    });
    return reply.code(201).send({ session });
  });

  app.get("/global-assistant/session/:sessionId/history", { preHandler: authenticate }, async (request, reply) => {
    const params = z.object({ sessionId: z.string().min(1) }).parse(request.params);
    return reply.send({ history: getAssistantHistory(params.sessionId) });
  });

  app.post("/global-assistant/why", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = WhyEvidenceQuerySchema.parse(request.body);
    const result = buildWhyResponse(
      user.workspaceId,
      body.companyId,
      body.screenPath,
      body.kpiLabel,
      body.kpiValue,
    );
    auditLogger.write({
      action: "global_assistant.why",
      actor: user.email,
      workspaceId: user.workspaceId,
      companyId: body.companyId,
      correlationId: request.id,
      metadata: { kpiLabel: body.kpiLabel, evidenceCount: result.evidence.length },
    });
    return reply.send(result);
  });

  app.post("/global-assistant/chat", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = ChatRequestSchema.parse(request.body);
    const result = sendAssistantMessage({
      workspaceId: user.workspaceId,
      companyId: body.companyId,
      sessionId: body.sessionId,
      message: body.message,
      screenPath: body.screenPath,
      kpiLabel: body.kpiLabel,
    });
    auditLogger.write({
      action: "global_assistant.chat",
      actor: user.email,
      workspaceId: user.workspaceId,
      companyId: body.companyId,
      correlationId: request.id,
      metadata: { sessionId: body.sessionId },
    });
    return reply.send(result);
  });

  app.get("/global-assistant/workflows", { preHandler: authenticate }, async (request, reply) => {
    const query = z.object({ screenPath: z.string().min(1) }).parse(request.query);
    return reply.send({ workflows: listGuidedWorkflows(query.screenPath) });
  });

  app.get("/global-assistant/help", { preHandler: authenticate }, async (request, reply) => {
    const query = z.object({ screenPath: z.string().min(1) }).parse(request.query);
    return reply.send(getContextualHelp(query.screenPath));
  });

  app.get("/global-assistant/missions", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send(generateAssistantMissions(user.workspaceId, query.companyId));
  });

  app.post("/global-assistant/missions/generate", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z
      .object({ companyId: z.string().min(1), sessionId: z.string().min(1) })
      .parse(request.body);
    const command = requestMissionGenerationCommand(user.workspaceId, body.companyId, body.sessionId);
    auditLogger.write({
      action: "global_assistant.mission.request",
      actor: user.email,
      workspaceId: user.workspaceId,
      companyId: body.companyId,
      correlationId: request.id,
      metadata: { commandId: command.commandId },
    });
    return reply.code(202).send({ command, requiresApproval: true });
  });

  app.post("/global-assistant/audit/generate", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z
      .object({
        companyId: z.string().min(1),
        sessionId: z.string().min(1),
        screenPath: z.string().min(1),
        missionId: z.string().optional(),
      })
      .parse(request.body);
    const command = requestAuditGenerationCommand(
      user.workspaceId,
      body.companyId,
      body.sessionId,
      body.screenPath,
    );
    auditLogger.write({
      action: "global_assistant.audit.request",
      actor: user.email,
      workspaceId: user.workspaceId,
      companyId: body.companyId,
      correlationId: request.id,
      metadata: { commandId: command.commandId },
    });
    return reply.code(202).send({ command, requiresApproval: true });
  });

  app.get("/global-assistant/audit/:artifactId", { preHandler: authenticate }, async (request, reply) => {
    const params = z.object({ artifactId: z.string().min(1) }).parse(request.params);
    const artifact = getExecutiveAuditArtifact(params.artifactId);
    if (!artifact) return reply.code(404).send({ error: "Audit artifact not found" });
    return reply.send(artifact);
  });

  app.post("/global-assistant/commands/:commandId/decide", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    if (user.role !== "founder" && user.role !== "admin") {
      return reply.code(403).send({ error: "Founder approval required" });
    }
    const params = z.object({ commandId: z.string().min(1) }).parse(request.params);
    const body = z
      .object({
        outcome: z.enum(["approved", "rejected"]),
        screenPath: z.string().optional(),
      })
      .parse(request.body);
    const command = decideAssistantCommand(
      user.workspaceId,
      params.commandId,
      body.outcome,
      body.screenPath,
    );
    if (!command) return reply.code(404).send({ error: "Command not found" });
    auditLogger.write({
      action: "global_assistant.command.decide",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { commandId: params.commandId, outcome: body.outcome, status: command.status },
    });
    return reply.send({ command });
  });

  app.get("/global-assistant/commands/:commandId", { preHandler: authenticate }, async (request, reply) => {
    const params = z.object({ commandId: z.string().min(1) }).parse(request.params);
    const command = getAssistantCommand(params.commandId);
    if (!command) return reply.code(404).send({ error: "Command not found" });
    return reply.send({ command });
  });
}
