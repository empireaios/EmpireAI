import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { env } from "../../../config/env.js";
import { GRAND_KING_WORKSPACE_ID } from "../../../grand-king/constants.js";
import type { PillowHost } from "../pillow-host.js";
import { collectMissionRuntimeSnapshot } from "../mission-runtime-bridge.js";

import { createMissionExecutionService, type MissionExecutionService } from "../mission-execution/service.js";
import { registerMissionExecutionRoutes } from "./mission-execution-routes.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

/** One shared owner/admin organization; this is not per-user mission privacy. */
export function createMissionRuntimeAuth(authenticate: AuthMiddleware) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply);
    if (reply.sent) return;
    const user = request.user;
    if (!user) return reply.code(401).send({ error: "Authentication required" });
    const email = user.email.trim().toLowerCase();
    const expected = user.role === "founder" ? env.FOUNDER_EMAIL : user.role === "admin" ? env.ADMIN_EMAIL : "";
    const configuredIdentity = expected.trim().toLowerCase();
    const suppliedWorkspace = request.headers["x-workspace-id"];
    const body = request.body as Record<string, unknown> | null | undefined;
    const bodyWorkspace = body && typeof body === "object" ? body.workspaceId : undefined;
    if (!configuredIdentity || email !== configuredIdentity || user.workspaceId !== GRAND_KING_WORKSPACE_ID ||
      (suppliedWorkspace !== undefined && suppliedWorkspace !== user.workspaceId) ||
      (bodyWorkspace !== undefined && bodyWorkspace !== user.workspaceId)) {
      return reply.code(403).send({ error: "Mission runtime organization scope denied", code: "MISSION_SCOPE_DENIED" });
    }
  };
}

export async function registerMissionRuntimeRoutes(app: FastifyInstance, deps: {
  authenticate: AuthMiddleware;
  pillowHost: PillowHost;
  onUnavailableRead?: () => void;
  missionExecutionService?: MissionExecutionService;
}): Promise<void> {
  const { pillowHost, onUnavailableRead } = deps;
  const missionAuth = createMissionRuntimeAuth(deps.authenticate);
  // Explicit host enablement: read-only authority inspection only, never a commerce switch.
  let executor = deps.missionExecutionService ?? null;
  if (!executor && process.env.MISSION_AUTHORITY_EXECUTOR_ENABLED === "true") {
    try {
      executor = createMissionExecutionService({ databasePath: env.DATABASE_PATH,
        scope: { workspaceId: "ws_empire_1", ownerEmail: env.FOUNDER_EMAIL.trim().toLowerCase() },
        buildSha: process.env.RAILWAY_GIT_COMMIT_SHA ?? process.env.EMPIREAI_BUILD_SHA ?? "",
        host: pillowHost });
    } catch { executor = null; }
  }
  await registerMissionExecutionRoutes(app, executor, missionAuth);
  app.get("/api/pillow/mission-runtime", { preHandler: missionAuth }, async (_request, reply) => {
    if (pillowHost.getStatus().lifecycle !== "running") {
      onUnavailableRead?.();
      return reply.send(collectMissionRuntimeSnapshot());
    }
    return reply.send({ missionRuntime: pillowHost.getMissionRuntime() });
  });
  const missionRuntimeAction = (
    method:
      | "connect"
      | "create-mission"
      | "queue"
      | "ready"
      | "execute"
      | "pause"
      | "resume"
      | "retry"
      | "cancel"
      | "recover"
      | "archive"
      | "monitor"
      | "produce-report"
      | "submit-report"
      | "list"
      | "validate"
      | "diagnostics"
      | "history"
      | "q1004-contract",
  ) =>
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (pillowHost.getStatus().lifecycle !== "running") {
        return reply.code(503).send(collectMissionRuntimeSnapshot());
      }
      const body = (request.body ?? {}) as Record<string, unknown>;
      const report =
        method === "connect" ? pillowHost.connectMissionRuntime(body)
          : method === "create-mission" ? pillowHost.createMissionRuntimeMission(body)
            : method === "queue" ? pillowHost.queueMissionRuntime(body)
              : method === "ready" ? pillowHost.readyMissionRuntime(body)
                : method === "execute" ? pillowHost.executeMissionRuntime(body)
                  : method === "pause" ? pillowHost.pauseMissionRuntime(body)
                    : method === "resume" ? pillowHost.resumeMissionRuntime(body)
                      : method === "retry" ? pillowHost.retryMissionRuntime(body)
                        : method === "cancel" ? pillowHost.cancelMissionRuntime(body)
                          : method === "recover" ? pillowHost.recoverMissionRuntime(body)
                            : method === "archive" ? pillowHost.archiveMissionRuntime(body)
                              : method === "monitor" ? pillowHost.monitorMissionRuntime(body)
                                : method === "produce-report" ? pillowHost.produceMissionRuntimeReport(body)
                                  : method === "submit-report" ? pillowHost.submitMissionRuntimeReport(body)
                                    : method === "list" ? pillowHost.listMissionRuntime()
                                      : method === "validate" ? pillowHost.validateMissionRuntime(body)
                                        : method === "history" ? pillowHost.getMissionRuntimeHistory()
                                          : method === "q1004-contract" ? pillowHost.getMissionRuntimeQ1004Contract()
                                            : pillowHost.runMissionRuntimeDiagnostics();
      return reply.send({ computedAt: new Date().toISOString(), report });
    };
  app.post("/api/pillow/mission-runtime/connect", { preHandler: missionAuth }, missionRuntimeAction("connect"));
  app.post("/api/pillow/mission-runtime/create-mission", { preHandler: missionAuth }, missionRuntimeAction("create-mission"));
  app.post("/api/pillow/mission-runtime/queue", { preHandler: missionAuth }, missionRuntimeAction("queue"));
  app.post("/api/pillow/mission-runtime/ready", { preHandler: missionAuth }, missionRuntimeAction("ready"));
  app.post("/api/pillow/mission-runtime/execute", { preHandler: missionAuth }, missionRuntimeAction("execute"));
  app.post("/api/pillow/mission-runtime/pause", { preHandler: missionAuth }, missionRuntimeAction("pause"));
  app.post("/api/pillow/mission-runtime/resume", { preHandler: missionAuth }, missionRuntimeAction("resume"));
  app.post("/api/pillow/mission-runtime/retry", { preHandler: missionAuth }, missionRuntimeAction("retry"));
  app.post("/api/pillow/mission-runtime/cancel", { preHandler: missionAuth }, missionRuntimeAction("cancel"));
  app.post("/api/pillow/mission-runtime/recover", { preHandler: missionAuth }, missionRuntimeAction("recover"));
  app.post("/api/pillow/mission-runtime/archive", { preHandler: missionAuth }, missionRuntimeAction("archive"));
  app.post("/api/pillow/mission-runtime/monitor", { preHandler: missionAuth }, missionRuntimeAction("monitor"));
  app.post("/api/pillow/mission-runtime/produce-report", { preHandler: missionAuth }, missionRuntimeAction("produce-report"));
  app.post("/api/pillow/mission-runtime/submit-report", { preHandler: missionAuth }, missionRuntimeAction("submit-report"));
  app.post("/api/pillow/mission-runtime/list", { preHandler: missionAuth }, missionRuntimeAction("list"));
  app.post("/api/pillow/mission-runtime/validate", { preHandler: missionAuth }, missionRuntimeAction("validate"));
  app.post("/api/pillow/mission-runtime/diagnostics", { preHandler: missionAuth }, missionRuntimeAction("diagnostics"));
  app.post("/api/pillow/mission-runtime/history", { preHandler: missionAuth }, missionRuntimeAction("history"));
  app.post("/api/pillow/mission-runtime/q1004-contract", { preHandler: missionAuth }, missionRuntimeAction("q1004-contract"));
}
