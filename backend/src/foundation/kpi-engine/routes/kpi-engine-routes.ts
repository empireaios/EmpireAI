import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { KPI_METRIC_KEYS } from "../models/kpi-metric.js";
import {
  getKpiByKey,
  getKpiDashboard,
  getKpiMetric,
  initializeKpiEngine,
  KpiNotFoundError,
  listKpiLifecycle,
  listKpiMetrics,
  listKpiObservations,
  listWorkspaceKpiLifecycle,
  recordKpiBatch,
  recordKpiObservation,
  syncKpisFromLedger,
  updateKpiTarget,
} from "../services/kpi-engine-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerKpiEngineRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get("/kpi-engine/metrics", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const metrics = listKpiMetrics(user.workspaceId);
    return reply.send({ metrics });
  });

  app.get("/kpi-engine/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const dashboard = getKpiDashboard(user.workspaceId);
    return reply.send({ dashboard });
  });

  app.get("/kpi-engine/metrics/:kpiId", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ kpiId: z.string().min(1) }).parse(request.params);
    initializeKpiEngine(user.workspaceId);
    const metric = getKpiMetric(params.kpiId);

    if (!metric) {
      return reply.code(404).send({ error: "KPI metric not found" });
    }
    if (metric.workspaceId !== user.workspaceId && user.role !== "admin") {
      return reply.code(403).send({ error: "Workspace mismatch" });
    }

    return reply.send({ metric });
  });

  app.get("/kpi-engine/metrics/key/:metricKey", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ metricKey: z.enum(KPI_METRIC_KEYS) }).parse(request.params);
    const metric = getKpiByKey(user.workspaceId, params.metricKey);

    if (!metric) {
      return reply.code(404).send({ error: "KPI metric not found" });
    }

    return reply.send({ metric });
  });

  app.post("/kpi-engine/observations", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z
      .object({
        kpiId: z.string().optional(),
        metricKey: z.enum(KPI_METRIC_KEYS).optional(),
        value: z.number(),
        source: z.string().optional(),
        metadata: z.record(z.string()).optional(),
      })
      .parse(request.body);

    try {
      const result = recordKpiObservation({
        workspaceId: user.workspaceId,
        ...body,
        actor: user.email,
        correlationId: request.id,
      });

      auditLogger.write({
        action: "kpi_engine.observation_recorded",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: {
          kpiId: result.metric.kpiId,
          metricKey: result.metric.metricKey,
          value: result.metric.currentValue,
        },
      });

      return reply.code(201).send(result);
    } catch (error) {
      if (error instanceof KpiNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.post("/kpi-engine/observations/batch", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z
      .object({
        observations: z.array(
          z.object({
            metricKey: z.enum(KPI_METRIC_KEYS),
            value: z.number(),
            source: z.string().optional(),
          }),
        ),
      })
      .parse(request.body);

    const metrics = recordKpiBatch(user.workspaceId, body.observations, user.email);
    auditLogger.write({
      action: "kpi_engine.batch_recorded",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { count: metrics.length },
    });

    return reply.send({ metrics });
  });

  app.patch("/kpi-engine/metrics/:kpiId/target", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    if (user.role !== "founder" && user.role !== "admin") {
      return reply.code(403).send({ error: "Founder or admin required to set KPI targets" });
    }

    const params = z.object({ kpiId: z.string().min(1) }).parse(request.params);
    const body = z.object({ targetValue: z.number() }).parse(request.body);

    try {
      const metric = updateKpiTarget(params.kpiId, body.targetValue, user.email);
      auditLogger.write({
        action: "kpi_engine.target_set",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { kpiId: metric.kpiId, targetValue: body.targetValue },
      });
      return reply.send({ metric });
    } catch (error) {
      if (error instanceof KpiNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.post("/kpi-engine/sync/ledger", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const metrics = syncKpisFromLedger(user.workspaceId, user.email);

    auditLogger.write({
      action: "kpi_engine.synced",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { count: metrics.length },
    });

    return reply.send({ metrics });
  });

  app.get("/kpi-engine/observations/:kpiId", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ kpiId: z.string().min(1) }).parse(request.params);
    const query = z.object({ limit: z.coerce.number().int().min(1).max(500).optional() }).parse(request.query);
    initializeKpiEngine(user.workspaceId);
    const observations = listKpiObservations(params.kpiId, query.limit);
    return reply.send({ observations });
  });

  app.get("/kpi-engine/lifecycle/:kpiId", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ kpiId: z.string().min(1) }).parse(request.params);
    const query = z.object({ limit: z.coerce.number().int().min(1).max(500).optional() }).parse(request.query);
    initializeKpiEngine(user.workspaceId);
    const lifecycle = listKpiLifecycle(params.kpiId, query.limit);
    return reply.send({ lifecycle });
  });

  app.get("/kpi-engine/lifecycle", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ limit: z.coerce.number().int().min(1).max(500).optional() }).parse(request.query);
    initializeKpiEngine(user.workspaceId);
    const lifecycle = listWorkspaceKpiLifecycle(user.workspaceId, query.limit);
    return reply.send({ lifecycle });
  });
}
