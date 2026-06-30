import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../auth/middleware.js";
import { ObservationOutcomeSchema } from "../models/observation-history.js";
import { getExecutiveSurveillanceRuntime } from "../services/executive-surveillance-runtime.js";
import { initializeWatcherRegistry, listRegisteredWatchers, registerWatcher } from "../services/watcher-registry-service.js";
import { runExecutiveSurveillance, listActiveSignals } from "../services/signal-engine-service.js";
import { generateMissionsFromSignals, listSurveillanceMissions } from "../services/mission-generator-service.js";
import { buildSurveillanceDashboard } from "../services/surveillance-dashboard-service.js";
import { buildExecutiveSurveillanceHeadquarters } from "../services/surveillance-headquarters-service.js";
import { buildExecutiveBriefings } from "../services/executive-briefing-service.js";
import { recordObservationOutcome, listObservationHistory } from "../services/observation-history-service.js";
import { collectModuleObservations } from "../services/cross-module-observer.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerExecutiveSurveillanceRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get("/executive-surveillance/runtime", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send({ runtime: getExecutiveSurveillanceRuntime(user.workspaceId, query.companyId) });
  });

  app.get("/executive-surveillance/watchers", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send({ watchers: listRegisteredWatchers(user.workspaceId, query.companyId) });
  });

  app.post("/executive-surveillance/watchers", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({
      companyId: z.string().min(1),
      watcherId: z.string().min(1),
      title: z.string().min(1),
      domain: z.string().min(1),
      watchedModules: z.array(z.string()).min(1),
    }).parse(request.body);
    const { companyId, ...input } = body;
    return reply.code(201).send({ watcher: registerWatcher(user.workspaceId, companyId, input) });
  });

  app.post("/executive-surveillance/observe", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ companyId: z.string().min(1) }).parse(request.body);
    initializeWatcherRegistry(user.workspaceId, body.companyId);
    const result = runExecutiveSurveillance(user.workspaceId, body.companyId);
    const missions = generateMissionsFromSignals(user.workspaceId, body.companyId, result.signals);

    auditLogger.write({
      action: "executive_surveillance.observe",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { signals: result.signals.length, missions: missions.length },
    });

    return reply.code(201).send({ ...result, missions });
  });

  app.get("/executive-surveillance/signals", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send({ signals: listActiveSignals(user.workspaceId, query.companyId) });
  });

  app.get("/executive-surveillance/missions", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send({ missions: listSurveillanceMissions(user.workspaceId, query.companyId) });
  });

  app.get("/executive-surveillance/briefings", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    const signals = listActiveSignals(user.workspaceId, query.companyId);
    const missions = listSurveillanceMissions(user.workspaceId, query.companyId);
    return reply.send({ briefings: buildExecutiveBriefings(signals, missions) });
  });

  app.get("/executive-surveillance/modules", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send({ observations: collectModuleObservations(user.workspaceId, query.companyId) });
  });

  app.post("/executive-surveillance/history", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({
      companyId: z.string().min(1),
      observationId: z.string().optional(),
      signalId: z.string().optional(),
      missionId: z.string().optional(),
      outcome: ObservationOutcomeSchema,
      accuracy: z.number().optional(),
      learningReference: z.string().optional(),
    }).parse(request.body);
    const { companyId, ...input } = body;
    return reply.code(201).send({ record: recordObservationOutcome(user.workspaceId, companyId, input) });
  });

  app.get("/executive-surveillance/history", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send({ history: listObservationHistory(user.workspaceId, query.companyId) });
  });

  app.get("/executive-surveillance/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send({ dashboard: buildSurveillanceDashboard(user.workspaceId, query.companyId) });
  });

  app.get("/executive-surveillance/headquarters", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send({ dashboard: buildExecutiveSurveillanceHeadquarters(user.workspaceId, query.companyId) });
  });
}
