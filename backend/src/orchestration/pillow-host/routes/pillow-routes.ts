import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import {
  PillowHostNotRunningError,
  PillowSessionNotFoundError,
  type PillowHost,
} from "../pillow-host.js";
import { pillowWorkspaceContextSchema } from "../workspace-context.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

function requireFounder(
  request: FastifyRequest,
  reply: FastifyReply,
): boolean {
  const user = request.user;
  if (!user) {
    reply.code(401).send({ error: "Authentication required" });
    return false;
  }
  if (user.role !== "founder" && user.role !== "admin") {
    reply.code(403).send({ error: "Founder access required for Pillow" });
    return false;
  }
  return true;
}

function founderAuth(authenticate: AuthMiddleware) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply);
    if (reply.sent) return;
    requireFounder(request, reply);
  };
}

export async function registerPillowRoutes(
  app: FastifyInstance,
  deps: {
    authenticate: AuthMiddleware;
    pillowHost: PillowHost;
    auditLogger: AuditLogger;
  },
): Promise<void> {
  const { authenticate, pillowHost, auditLogger } = deps;
  const pillowAuth = founderAuth(authenticate);

  app.get("/api/pillow/health", async (_request, reply) => {
    const status = pillowHost.getStatus();
    return reply.send({
      health: status.health,
      lifecycle: status.lifecycle,
      missionId: status.missionId,
      lastHeartbeatAt: status.lastHeartbeatAt,
      lastError: status.lastError,
    });
  });

  app.get("/api/pillow/status", { preHandler: pillowAuth }, async (_request, reply) => {
    return reply.send({ status: pillowHost.getStatus() });
  });

  app.get("/api/pillow/objective", { preHandler: pillowAuth }, async (_request, reply) => {
    try {
      const dashboard = pillowHost.getObjectiveDashboard();
      return reply.send({ objective: dashboard });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send({ error: error.message, health: pillowHost.getHealth() });
      }
      throw error;
    }
  });

  app.post("/api/pillow/session", { preHandler: pillowAuth }, async (request, reply) => {
    const user = request.user!;
    const body = z
      .object({
        workspaceId: z.string().min(1).optional(),
      })
      .parse(request.body ?? {});

    const workspaceId = body.workspaceId ?? user.workspaceId;
    if (workspaceId !== user.workspaceId && user.role !== "admin") {
      return reply.code(403).send({ error: "Workspace access denied" });
    }

    try {
      const session = pillowHost.createSession(workspaceId);
      auditLogger.write({
        action: "pillow.session.create",
        actor: user.email,
        workspaceId,
        correlationId: request.id,
        metadata: { sessionId: session.sessionId },
      });
      return reply.code(201).send({ session });
    } catch (error) {
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send({ error: error.message, health: pillowHost.getHealth() });
      }
      throw error;
    }
  });

  app.delete("/api/pillow/session", { preHandler: pillowAuth }, async (request, reply) => {
    const user = request.user!;
    const query = z
      .object({
        sessionId: z.string().min(1),
        workspaceId: z.string().min(1).optional(),
      })
      .parse(request.query);

    const workspaceId = query.workspaceId ?? user.workspaceId;
    if (workspaceId !== user.workspaceId && user.role !== "admin") {
      return reply.code(403).send({ error: "Workspace access denied" });
    }

    const removed = pillowHost.destroySession(workspaceId, query.sessionId);
    if (!removed) {
      return reply.code(404).send({ error: "Session not found" });
    }

    auditLogger.write({
      action: "pillow.session.destroy",
      actor: user.email,
      workspaceId,
      correlationId: request.id,
      metadata: { sessionId: query.sessionId },
    });

    return reply.send({ ok: true, sessionId: query.sessionId });
  });

  app.get("/api/pillow/history", { preHandler: pillowAuth }, async (request, reply) => {
    const user = request.user!;
    const query = z
      .object({
        sessionId: z.string().min(1),
        workspaceId: z.string().min(1).optional(),
      })
      .parse(request.query);

    const workspaceId = query.workspaceId ?? user.workspaceId;
    if (workspaceId !== user.workspaceId && user.role !== "admin") {
      return reply.code(403).send({ error: "Workspace access denied" });
    }

    const session = pillowHost.getSession(workspaceId, query.sessionId);
    if (!session) {
      return reply.code(404).send({ error: "Session not found" });
    }

    return reply.send({
      sessionId: session.sessionId,
      workspaceId: session.workspaceId,
      history: session.conversationHistory,
      tokenUsage: session.tokenUsage,
      repositoryFingerprint: session.repositoryFingerprint,
      currentMission: session.currentMission,
      approvalState: session.approvalState,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      requestLogs: pillowHost.listRequestLogs({
        workspaceId,
        sessionId: query.sessionId,
        limit: 50,
      }),
    });
  });

  app.post("/api/pillow/chat", { preHandler: pillowAuth }, async (request, reply) => {
    const user = request.user!;
    const body = z
      .object({
        message: z.string().min(1),
        sessionId: z.string().min(1),
        workspaceId: z.string().min(1).optional(),
        provider: z.enum(["openai", "anthropic", "gemini"]).optional(),
        workspaceContext: pillowWorkspaceContextSchema.optional(),
      })
      .parse(request.body);

    const workspaceId = body.workspaceId ?? user.workspaceId;
    if (workspaceId !== user.workspaceId && user.role !== "admin") {
      return reply.code(403).send({ error: "Workspace access denied" });
    }

    try {
      const result = await pillowHost.routePrompt({
        workspaceId,
        sessionId: body.sessionId,
        message: body.message,
        actor: user.email,
        correlationId: request.id,
        provider: body.provider,
        workspaceContext: body.workspaceContext,
      });
      return reply.send({ result });
    } catch (error) {
      if (error instanceof PillowSessionNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      if (error instanceof PillowHostNotRunningError) {
        return reply.code(503).send({ error: error.message, health: pillowHost.getHealth() });
      }
      throw error;
    }
  });

  app.post("/api/pillow/chat/stream", { preHandler: pillowAuth }, async (request, reply) => {
    const user = request.user!;
    const body = z
      .object({
        message: z.string().min(1),
        sessionId: z.string().min(1),
        workspaceId: z.string().min(1).optional(),
        provider: z.enum(["openai", "anthropic", "gemini"]).optional(),
        workspaceContext: pillowWorkspaceContextSchema.optional(),
      })
      .parse(request.body);

    const workspaceId = body.workspaceId ?? user.workspaceId;
    if (workspaceId !== user.workspaceId && user.role !== "admin") {
      return reply.code(403).send({ error: "Workspace access denied" });
    }

    reply.hijack();
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });

    const writeEvent = (event: string, data: unknown) => {
      reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      writeEvent("started", { sessionId: body.sessionId });
      const result = await pillowHost.routePrompt({
        workspaceId,
        sessionId: body.sessionId,
        message: body.message,
        actor: user.email,
        correlationId: request.id,
        provider: body.provider,
        workspaceContext: body.workspaceContext,
      });

      const tokens = result.message.match(/\S+\s*|\s+/g) ?? [result.message];
      for (const token of tokens) {
        writeEvent("token", { delta: token });
        await new Promise((resolve) => setTimeout(resolve, 12));
      }

      writeEvent("done", { result });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      writeEvent("error", { message });
    } finally {
      reply.raw.end();
    }
  });

  app.get("/api/pillow/events/stream", { preHandler: pillowAuth }, async (request, reply) => {
    const user = request.user!;
    const query = z
      .object({ workspaceId: z.string().optional() })
      .parse(request.query);
    const workspaceId = query.workspaceId ?? user.workspaceId;

    reply.hijack();
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });

    const writeEvent = (event: string, data: unknown) => {
      reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    writeEvent("connected", { workspaceId });

    const pushStatus = () => {
      const payload: Record<string, unknown> = {
        pillow: pillowHost.getStatus(),
        at: new Date().toISOString(),
      };
      try {
        payload.cursor = pillowHost.getCursorBridge().getStatus(workspaceId);
      } catch {
        payload.cursor = null;
      }
      writeEvent("status", payload);
    };

    pushStatus();
    const timer = setInterval(pushStatus, 4000);
    request.raw.on("close", () => {
      clearInterval(timer);
    });
  });
}
