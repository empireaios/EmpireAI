import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import {
  getAdvertisingLifecycleSnapshot,
  getCapitalLifecycleSnapshot,
  getGrandKingsRevenueCycleById,
  getKpiLifecycleSnapshot,
  getLatestGrandKingsRevenueCycle,
  getOrderLifecycleSnapshot,
  getRevenueLifecycleSnapshot,
  GrandKingsRevenueBlockedError,
  listGrandKingsRevenueCycles,
  runGrandKingsRevenueCycle,
} from "../services/grand-kings-revenue-engine-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerGrandKingsRevenueRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.post(
    "/grand-kings-revenue/cycle/run",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const body = z
        .object({
          companyId: z.string().min(1),
          correlationId: z.string().optional(),
        })
        .parse(request.body);

      try {
        const cycle = runGrandKingsRevenueCycle({
          workspaceId: user.workspaceId,
          companyId: body.companyId,
          correlationId: body.correlationId ?? request.id,
        });

        auditLogger.write({
          action: "grand_kings_revenue.cycle_run",
          actor: user.email,
          workspaceId: user.workspaceId,
          companyId: body.companyId,
          correlationId: cycle.correlationId,
          metadata: {
            cycleId: cycle.cycleId,
            overallHealthScore: cycle.overallHealthScore,
          },
        });

        return reply.send({ cycle });
      } catch (error) {
        if (error instanceof GrandKingsRevenueBlockedError) {
          return reply.code(403).send({ error: error.message, blocked: true });
        }
        throw error;
      }
    },
  );

  app.get(
    "/grand-kings-revenue/lifecycle/revenue",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
      return reply.send({
        lifecycle: getRevenueLifecycleSnapshot(user.workspaceId, query.companyId),
      });
    },
  );

  app.get(
    "/grand-kings-revenue/lifecycle/advertising",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
      return reply.send({
        lifecycle: getAdvertisingLifecycleSnapshot(user.workspaceId, query.companyId),
      });
    },
  );

  app.get(
    "/grand-kings-revenue/lifecycle/orders",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
      return reply.send({
        lifecycle: getOrderLifecycleSnapshot(user.workspaceId, query.companyId),
      });
    },
  );

  app.get(
    "/grand-kings-revenue/lifecycle/capital",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
      return reply.send({
        lifecycle: getCapitalLifecycleSnapshot(user.workspaceId, query.companyId),
      });
    },
  );

  app.get(
    "/grand-kings-revenue/kpi",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
      const kpi = getKpiLifecycleSnapshot(user.workspaceId, query.companyId);

      auditLogger.write({
        action: "grand_kings_revenue.kpi_snapshot",
        actor: user.email,
        workspaceId: user.workspaceId,
        companyId: query.companyId,
        correlationId: request.id,
        metadata: { overallHealthScore: kpi.overallHealthScore },
      });

      return reply.send({ kpi });
    },
  );

  app.get(
    "/grand-kings-revenue/cycles",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const query = z.object({ companyId: z.string().optional() }).parse(request.query);
      const cycles = listGrandKingsRevenueCycles(user.workspaceId, query.companyId);
      return reply.send({ cycles });
    },
  );

  app.get(
    "/grand-kings-revenue/cycles/latest",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const query = z.object({ companyId: z.string().optional() }).parse(request.query);
      const cycle = getLatestGrandKingsRevenueCycle(user.workspaceId, query.companyId);
      if (!cycle) {
        return reply.code(404).send({ error: "No revenue cycle recorded yet" });
      }
      return reply.send({ cycle });
    },
  );

  app.get(
    "/grand-kings-revenue/cycles/:cycleId",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const params = z.object({ cycleId: z.string().min(1) }).parse(request.params);
      const cycle = getGrandKingsRevenueCycleById(params.cycleId);
      if (!cycle) {
        return reply.code(404).send({ error: "Cycle not found" });
      }
      if (cycle.workspaceId !== user.workspaceId && user.role !== "admin") {
        return reply.code(403).send({ error: "Workspace mismatch" });
      }
      return reply.send({ cycle });
    },
  );
}
