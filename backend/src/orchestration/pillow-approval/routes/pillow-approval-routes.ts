import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import {
  ApprovalGateError,
  ApprovalNotFoundError,
  type ApprovalGateEngine,
} from "../approval-gate-engine.js";
import { CursorBridgeError, type CursorBridgeAdapter } from "../cursor-bridge-adapter.js";
import type { PillowHost } from "../../pillow-host/pillow-host.js";

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
    reply.code(403).send({ error: "Founder access required for Pillow approvals" });
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

export async function registerPillowApprovalRoutes(
  app: FastifyInstance,
  deps: {
    authenticate: AuthMiddleware;
    pillowHost: PillowHost;
    approvalGate: ApprovalGateEngine;
    cursorBridge: CursorBridgeAdapter;
    auditLogger: AuditLogger;
  },
): Promise<void> {
  const { authenticate, pillowHost, approvalGate, cursorBridge, auditLogger } = deps;
  const pillowAuth = founderAuth(authenticate);

  app.post("/api/pillow/approval", { preHandler: pillowAuth }, async (request, reply) => {
    const user = request.user!;
    const body = z
      .discriminatedUnion("action", [
        z.object({
          action: z.literal("register"),
          type: z.enum([
            "repository_write",
            "cursor_mission_execution",
            "file_generation",
            "executive_audit_generation",
            "runtime_operation",
          ]),
          title: z.string().min(1),
          summary: z.string().min(1),
          ownerRoute: z.string().optional(),
          evidence: z.array(z.string()).optional(),
          missionId: z.string().optional(),
          targetPaths: z.array(z.string()).optional(),
          metadata: z.record(z.unknown()).optional(),
          workspaceId: z.string().optional(),
          ttlHours: z.number().positive().optional(),
        }),
        z.object({
          action: z.literal("decide"),
          approvalId: z.string().min(1),
          outcome: z.enum(["Approved", "Rejected", "Cancelled"]),
          notes: z.string().optional(),
          workspaceId: z.string().optional(),
        }),
      ])
      .parse(request.body);

    const workspaceId = body.workspaceId ?? user.workspaceId;
    if (workspaceId !== user.workspaceId && user.role !== "admin") {
      return reply.code(403).send({ error: "Workspace access denied" });
    }

    try {
      if (body.action === "register") {
        const approval = approvalGate.register({
          workspaceId,
          type: body.type,
          proposal: {
            title: body.title,
            summary: body.summary,
            ownerRoute: body.ownerRoute,
            evidence: body.evidence,
            missionId: body.missionId,
            targetPaths: body.targetPaths,
            metadata: body.metadata,
          },
          requestedBy: user.email,
          correlationId: request.id,
          ttlHours: body.ttlHours,
        });
        auditLogger.write({
          action: "pillow.approval.register",
          actor: user.email,
          workspaceId,
          correlationId: request.id,
          metadata: { approvalId: approval.approvalId, type: approval.type },
        });
        return reply.code(201).send({ approval });
      }

      const approval = approvalGate.decide({
        approvalId: body.approvalId,
        workspaceId,
        outcome: body.outcome,
        actor: user.email,
        notes: body.notes,
        correlationId: request.id,
      });
      auditLogger.write({
        action: "pillow.approval.decide",
        actor: user.email,
        workspaceId,
        correlationId: request.id,
        metadata: { approvalId: approval.approvalId, status: approval.status },
      });
      return reply.send({ approval });
    } catch (error) {
      if (error instanceof ApprovalGateError || error instanceof ApprovalNotFoundError) {
        return reply.code(422).send({ error: error.message });
      }
      throw error;
    }
  });

  app.get("/api/pillow/approval", { preHandler: pillowAuth }, async (request, reply) => {
    const user = request.user!;
    const query = z
      .object({
        status: z
          .enum(["Pending", "Approved", "Rejected", "Expired", "Cancelled"])
          .optional(),
        workspaceId: z.string().optional(),
        includeHistory: z.coerce.boolean().optional(),
      })
      .parse(request.query);

    const workspaceId = query.workspaceId ?? user.workspaceId;
    if (workspaceId !== user.workspaceId && user.role !== "admin") {
      return reply.code(403).send({ error: "Workspace access denied" });
    }

    const approvals = query.status
      ? approvalGate.list(workspaceId, query.status)
      : approvalGate.listPending(workspaceId);

    const payload: Record<string, unknown> = {
      approvals,
      pendingCount: approvalGate.listPending(workspaceId).length,
    };

    if (query.includeHistory) {
      payload.history = approvalGate.listHistory(workspaceId, 100);
      payload.dispatchHistory = cursorBridge.listDispatchHistory(workspaceId, 100);
      payload.recoveryHistory = cursorBridge.listRecoveryHistory(workspaceId, 100);
    }

    return reply.send(payload);
  });

  app.post("/api/pillow/cursor/dispatch", { preHandler: pillowAuth }, async (request, reply) => {
    const user = request.user!;
    const body = z
      .object({
        approvalId: z.string().optional(),
        missionId: z.string().optional(),
        workspaceId: z.string().optional(),
        dryRun: z.boolean().optional(),
      })
      .parse(request.body ?? {});

    const workspaceId = body.workspaceId ?? user.workspaceId;
    if (workspaceId !== user.workspaceId && user.role !== "admin") {
      return reply.code(403).send({ error: "Workspace access denied" });
    }

    const status = pillowHost.getStatus();
    if (status.lifecycle !== "running") {
      return reply.code(503).send({ error: "Pillow host not running", status });
    }

    try {
      const result = cursorBridge.dispatchMission({
        workspaceId,
        approvalId: body.approvalId,
        missionId: body.missionId,
        actor: user.email,
        correlationId: request.id,
        dryRun: body.dryRun,
      });
      return reply.code(201).send(result);
    } catch (error) {
      if (error instanceof CursorBridgeError) {
        return reply.code(422).send({ error: error.message });
      }
      throw error;
    }
  });

  app.get("/api/pillow/cursor/status", { preHandler: pillowAuth }, async (request, reply) => {
    const user = request.user!;
    const query = z
      .object({
        workspaceId: z.string().optional(),
        missionId: z.string().optional(),
      })
      .parse(request.query);

    const workspaceId = query.workspaceId ?? user.workspaceId;
    if (workspaceId !== user.workspaceId && user.role !== "admin") {
      return reply.code(403).send({ error: "Workspace access denied" });
    }

    await cursorBridge.monitorActiveMissions(workspaceId);

    const status = cursorBridge.getStatus(workspaceId);
    const mission = query.missionId
      ? cursorBridge.getMission(query.missionId)
      : null;

    return reply.send({
      status,
      mission,
      missions: cursorBridge.listMissionBoard(workspaceId),
      objectiveQueue: cursorBridge.listObjectiveMissionQueue(workspaceId),
      pillowHost: {
        lifecycle: pillowHost.getStatus().lifecycle,
        health: pillowHost.getHealth(),
      },
    });
  });

  app.get("/api/pillow/missions", { preHandler: pillowAuth }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ workspaceId: z.string().optional() }).parse(request.query);
    const workspaceId = query.workspaceId ?? user.workspaceId;
    if (workspaceId !== user.workspaceId && user.role !== "admin") {
      return reply.code(403).send({ error: "Workspace access denied" });
    }
    return reply.send({
      board: cursorBridge.listMissionBoard(workspaceId),
      objectiveQueue: cursorBridge.listObjectiveMissionQueue(workspaceId),
    });
  });

  app.post("/api/pillow/cursor/heartbeat", { preHandler: pillowAuth }, async (request, reply) => {
    const user = request.user!;
    const body = z
      .object({
        missionId: z.string().optional(),
        detail: z.string().default("cursor heartbeat"),
        kind: z
          .enum([
            "repository_inspection",
            "validation",
            "executive_audit",
            "state_transition",
          ])
          .optional(),
        completed: z.boolean().optional(),
        failed: z.boolean().optional(),
        error: z.string().optional(),
      })
      .parse(request.body ?? {});

    cursorBridge.recordCursorPresence();

    if (body.failed && body.missionId) {
      const mission = cursorBridge.markMissionFailed(
        body.missionId,
        body.error ?? "Mission failed",
      );
      return reply.send({ ok: true, mission, presence: "MissionFailed" });
    }

    if (body.completed && body.missionId) {
      const mission = cursorBridge.markMissionCompleted(body.missionId, body.detail);
      return reply.send({ ok: true, mission, presence: "MissionCompleted" });
    }

    if (body.missionId) {
      const mission = cursorBridge.recordMissionHeartbeat(
        body.missionId,
        body.detail,
        body.kind,
      );
      return reply.send({ ok: true, mission, presence: mission?.presence ?? "MissionRunning" });
    }

    return reply.send({ ok: true, presence: "CursorOnline" });
  });
}
