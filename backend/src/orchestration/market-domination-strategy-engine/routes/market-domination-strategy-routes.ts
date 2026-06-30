import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import {
  compareMarketStrategies,
  generateMarketStrategyForOpportunity,
  getMarketStrategy,
  listMarketStrategies,
  MarketStrategyBlockedError,
  MarketStrategyNotFoundError,
  buildMarketStrategySummary,
} from "../services/market-domination-strategy-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerMarketDominationStrategyRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.post("/market-strategy/generate", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ businessOpportunityId: z.string().min(1) }).parse(request.body);

    try {
      const strategy = generateMarketStrategyForOpportunity(body.businessOpportunityId, user.email);
      auditLogger.write({
        action: "market_strategy.generated",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: {
          strategyId: strategy.strategyId,
          recommendation: strategy.grandKingRecommendation.recommendation,
        },
      });
      return reply.code(201).send({ strategy });
    } catch (error) {
      if (error instanceof MarketStrategyBlockedError) {
        return reply.code(409).send({ error: error.message });
      }
      throw error;
    }
  });

  app.get("/market-strategy/strategies", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    const strategies = listMarketStrategies(user.workspaceId, query.companyId);
    return reply.send({ strategies, total: strategies.length });
  });

  app.get("/market-strategy/strategies/:strategyId", { preHandler: authenticate }, async (request, reply) => {
    const params = z.object({ strategyId: z.string().min(1) }).parse(request.params);
    const strategy = getMarketStrategy(params.strategyId);
    if (!strategy) {
      return reply.code(404).send({ error: "Strategy not found" });
    }
    return reply.send({ strategy });
  });

  app.get("/market-strategy/compare", { preHandler: authenticate }, async (request, reply) => {
    const query = z
      .object({
        strategyA: z.string().min(1),
        strategyB: z.string().min(1),
      })
      .parse(request.query);

    try {
      const comparison = compareMarketStrategies(query.strategyA, query.strategyB);
      return reply.send({ comparison });
    } catch (error) {
      if (error instanceof MarketStrategyNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.get("/market-strategy/summary", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    const summary = buildMarketStrategySummary(user.workspaceId, query.companyId);
    return reply.send({ summary });
  });
}
