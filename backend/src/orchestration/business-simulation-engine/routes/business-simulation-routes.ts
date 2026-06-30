import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import {
  BusinessSimulationBlockedError,
  BusinessSimulationNotFoundError,
  buildBusinessSimulationSummary,
  compareBusinessSimulations,
  getBusinessSimulation,
  getBusinessSimulationForecast,
  getBusinessSimulationRecommendation,
  runBusinessSimulationForBuild,
} from "../services/business-simulation-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerBusinessSimulationRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.post("/business-simulation/run", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z
      .object({
        buildId: z.string().min(1),
        configuredCapitalConstraint: z.number().min(0).optional(),
      })
      .parse(request.body);

    try {
      const simulation = runBusinessSimulationForBuild(body.buildId, user.email, {
        configuredCapitalConstraint: body.configuredCapitalConstraint,
      });
      auditLogger.write({
        action: "business_simulation.run",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: {
          simulationId: simulation.simulationId,
          recommendation: simulation.finalRecommendation.recommendation,
        },
      });
      return reply.code(201).send({ simulation });
    } catch (error) {
      if (error instanceof BusinessSimulationBlockedError) {
        return reply.code(409).send({ error: error.message });
      }
      throw error;
    }
  });

  app.get("/business-simulation/summary", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    const summary = buildBusinessSimulationSummary(user.workspaceId, query.companyId);
    return reply.send({ summary });
  });

  app.get("/business-simulation/:simulationId/forecast", { preHandler: authenticate }, async (request, reply) => {
    const params = z.object({ simulationId: z.string().min(1) }).parse(request.params);
    const forecast = getBusinessSimulationForecast(params.simulationId);
    if (!forecast) {
      return reply.code(404).send({ error: "Simulation not found" });
    }
    return reply.send({ forecast });
  });

  app.get("/business-simulation/compare", { preHandler: authenticate }, async (request, reply) => {
    const query = z
      .object({
        simulationA: z.string().min(1),
        simulationB: z.string().min(1),
      })
      .parse(request.query);

    try {
      const comparison = compareBusinessSimulations(query.simulationA, query.simulationB);
      return reply.send({ comparison });
    } catch (error) {
      if (error instanceof BusinessSimulationNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.get("/business-simulation/:simulationId/recommendation", { preHandler: authenticate }, async (request, reply) => {
    const params = z.object({ simulationId: z.string().min(1) }).parse(request.params);
    const recommendation = getBusinessSimulationRecommendation(params.simulationId);
    if (!recommendation) {
      return reply.code(404).send({ error: "Simulation not found" });
    }
    return reply.send({ recommendation });
  });

  app.get("/business-simulation/:simulationId", { preHandler: authenticate }, async (request, reply) => {
    const params = z.object({ simulationId: z.string().min(1) }).parse(request.params);
    const simulation = getBusinessSimulation(params.simulationId);
    if (!simulation) {
      return reply.code(404).send({ error: "Simulation not found" });
    }
    return reply.send({ simulation });
  });
}
