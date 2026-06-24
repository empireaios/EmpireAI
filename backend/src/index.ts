import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import { z } from "zod";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { createBrain } from "./brain/index.js";
import { registerAuthRoutes } from "./auth/routes.js";
import { registerProductIntelligenceRoutes } from "./intelligence/product-intelligence-engine/routes.js";
import { seedDefaultUsers } from "./auth/seed-users.js";
import { createAuthMiddleware } from "./auth/middleware.js";
import { canAccessModule } from "./auth/permissions.js";
import { EventStreamHub } from "./brain/events/event-stream.js";
import { GuardianBlockedError } from "./guardian/guardian-engine.js";
import { seedDomainData } from "./domain/seed.js";
import { bootstrapFoundation } from "./foundation/index.js";
import { getObservabilitySnapshot, recordRequest } from "./observability/metrics.js";

const dispatchSchema = z.object({
  module: z.string().min(1),
  action: z.string().min(1),
  workspaceId: z.string().min(1).optional(),
  companyId: z.string().optional(),
  payload: z.record(z.unknown()).default({}),
  correlationId: z.string().optional(),
});

async function main() {
  const brain = await createBrain({ startWorkers: true, startScheduler: true });
  await seedDefaultUsers();
  seedDomainData();
  bootstrapFoundation("ws_empire_1");

  const sessionStore = brain.sessionStore;
  const authenticate = createAuthMiddleware(sessionStore);
  const eventStream = new EventStreamHub(brain.eventBus);
  eventStream.start();

  const app = Fastify({ logger: false });

  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });

  await app.register(cookie, {
    secret: env.SESSION_SECRET,
  });

  app.addHook("onRequest", async (request) => {
    (request as typeof request & { startTime: number }).startTime = Date.now();
  });

  app.addHook("onResponse", async (request, reply) => {
    const startTime = (request as typeof request & { startTime?: number }).startTime;
    recordRequest({
      path: request.url,
      method: request.method,
      statusCode: reply.statusCode,
      durationMs: startTime ? Date.now() - startTime : 0,
    });
  });

  app.setErrorHandler((error, request, reply) => {
    const err = error instanceof Error ? error : new Error(String(error));
    const statusFromError =
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      typeof (error as { statusCode?: unknown }).statusCode === "number"
        ? (error as { statusCode: number }).statusCode
        : undefined;

    logger.error(
      {
        error: err.message,
        stack: err.stack,
        path: request.url,
        method: request.method,
      },
      "Request failed",
    );

    if (error instanceof z.ZodError) {
      return reply.code(400).send({
        error: "Validation failed",
        details: error.flatten(),
      });
    }

    if (error instanceof GuardianBlockedError) {
      return reply.code(403).send({
        error: error.message,
        guardian: error.verdict,
      });
    }

    const statusCode = statusFromError ?? 500;

    return reply.code(statusCode).send({
      error: err.message || "Internal server error",
    });
  });

  app.get("/health", async () => {
    let guardianReport: Record<string, unknown> = { overall: "unknown" };
    try {
      guardianReport = (await brain.guardian.checkHealth(brain, {
        recordRisks: false,
      })) as unknown as Record<string, unknown>;
    } catch (error) {
      guardianReport = {
        overall: "failed",
        summary: error instanceof Error ? error.message : "Health check failed",
      };
    }

    let queueStats: Record<string, number> | { error: string } = {};
    try {
      queueStats = await brain.taskQueue.getStats();
    } catch (error) {
      queueStats = {
        error: error instanceof Error ? error.message : "Queue unavailable",
      };
    }

    return {
      status: "ok",
      brain: "online",
      redisMode: brain.redisMode,
      observability: getObservabilitySnapshot(),
      guardian: {
        overall: guardianReport.overall,
        summary: guardianReport.summary,
        openRisks: guardianReport.openRisks,
      },
      llmProviders: brain.llmRouter.listAvailable(),
      queue: queueStats,
    };
  });

  app.get(
    "/guardian/health",
    { preHandler: authenticate },
    async () => brain.guardian.checkHealth(brain),
  );

  app.get(
    "/guardian/risks",
    { preHandler: authenticate },
    async (request, reply) => {
      if (request.user!.role !== "admin") {
        return reply.code(403).send({ error: "Admin access required" });
      }
      return {
        risks: brain.guardian.listOpenRisks(),
        lastHealth: brain.guardian.getLastHealthReport(),
      };
    },
  );

  app.post(
    "/guardian/risks/:riskId/resolve",
    { preHandler: authenticate },
    async (request, reply) => {
      if (request.user!.role !== "admin") {
        return reply.code(403).send({ error: "Admin access required" });
      }
      const params = z.object({ riskId: z.string() }).parse(request.params);
      const resolved = brain.guardian.resolveRisk(params.riskId);
      if (!resolved) {
        return reply.code(404).send({ error: "Risk not found or already resolved" });
      }
      return { ok: true, riskId: params.riskId };
    },
  );

  app.get(
    "/metrics",
    { preHandler: authenticate },
    async (request, reply) => {
      if (request.user!.role !== "admin") {
        return reply.code(403).send({ error: "Admin access required" });
      }
      return getObservabilitySnapshot();
    },
  );

  await registerAuthRoutes(app, {
    sessionStore,
    auditLogger: brain.auditLogger,
  });

  await registerProductIntelligenceRoutes(app, { authenticate });

  app.get(
    "/brain/events/stream",
    { preHandler: authenticate },
    async (request, reply) => {
      const workspaceId = request.user!.workspaceId;
      eventStream.attach(request, reply, workspaceId);
      return reply;
    },
  );

  app.post(
    "/brain/dispatch",
    { preHandler: authenticate },
    async (request, reply) => {
      const body = dispatchSchema.parse(request.body);
      const user = request.user!;

      if (!canAccessModule(user.role, body.module)) {
        return reply.code(403).send({
          error: `Access denied for module: ${body.module}`,
        });
      }

      const workspaceId = user.workspaceId;
      if (body.workspaceId && body.workspaceId !== workspaceId) {
        return reply.code(403).send({ error: "Workspace mismatch" });
      }

      const payload = { ...body.payload };
      const isFounderApproval =
        body.module === "ai-ceo" &&
        (body.action === "approve" || body.action === "approve_all") &&
        (user.role === "founder" || user.role === "admin");

      if (isFounderApproval) {
        payload.founderApproved = true;
      }

      const result = await brain.orchestrator.dispatch({
        module: body.module,
        action: body.action,
        workspaceId,
        companyId: body.companyId,
        payload,
        correlationId: body.correlationId,
      });

      return reply.send(result);
    },
  );

  app.get(
    "/brain/agents",
    { preHandler: authenticate },
    async (request, reply) => {
      if (request.user!.role !== "admin") {
        return reply.code(403).send({ error: "Admin access required" });
      }
      return reply.send({ agents: brain.agentManager.list() });
    },
  );

  app.get(
    "/brain/tools",
    { preHandler: authenticate },
    async (request, reply) => {
      if (request.user!.role !== "admin") {
        return reply.code(403).send({ error: "Admin access required" });
      }
      return reply.send({ tools: brain.toolRegistry.list() });
    },
  );

  app.get(
    "/brain/audit",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const query = z
        .object({
          workspaceId: z.string().optional(),
          correlationId: z.string().optional(),
          limit: z.coerce.number().optional(),
        })
        .parse(request.query);

      const workspaceId = query.workspaceId ?? user.workspaceId;
      if (workspaceId !== user.workspaceId && user.role !== "admin") {
        return reply.code(403).send({ error: "Workspace access denied" });
      }

      return reply.send(
        brain.auditLogger.query({
          workspaceId,
          correlationId: query.correlationId,
          limit: query.limit,
        }),
      );
    },
  );

  app.get(
    "/brain/memory",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const query = z
        .object({
          scope: z.enum(["session", "workspace", "company", "agent"]),
          workspaceId: z.string().optional(),
          companyId: z.string().optional(),
          agentId: z.string().optional(),
          prefix: z.string().optional(),
        })
        .parse(request.query);

      const workspaceId = query.workspaceId ?? user.workspaceId;
      if (workspaceId !== user.workspaceId && user.role !== "admin") {
        return reply.code(403).send({ error: "Workspace access denied" });
      }

      return reply.send(
        brain.memoryStore.list({ ...query, workspaceId }),
      );
    },
  );

  const shutdown = async () => {
    eventStream.stop();
    await app.close();
    await brain.shutdown();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await app.listen({ port: env.PORT, host: env.HOST });
  logger.info({ port: env.PORT }, "EmpireAI Brain API listening");
}

main().catch((error) => {
  logger.error({ error }, "Failed to start EmpireAI Brain API");
  process.exit(1);
});
