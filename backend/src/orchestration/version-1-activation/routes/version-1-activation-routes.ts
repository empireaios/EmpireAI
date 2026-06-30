import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { buildVersion1GoLivePreparation } from "../go-live-preparation.js";
import { runVersion1ProductionReadinessReview } from "../production-readiness-review.js";
import {
  assessVersion1OperationalActivation,
  isPillowProductionModeEnabled,
} from "../version-1-activation-config.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerVersion1ActivationRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;

  app.get("/version-1-activation/readiness", { preHandler: authenticate }, async (_request, reply) => {
    const review = runVersion1ProductionReadinessReview();
    return reply.send({ review });
  });

  app.get("/version-1-activation/assessment", { preHandler: authenticate }, async (_request, reply) => {
    return reply.send({ assessment: assessVersion1OperationalActivation() });
  });

  app.get(
    "/version-1-activation/go-live-preparation",
    { preHandler: authenticate },
    async (request, reply) => {
      const query = z
        .object({
          companyId: z.string().default("co-grand-king"),
        })
        .parse(request.query);
      const user = request.user!;
      const preparation = buildVersion1GoLivePreparation(user.workspaceId, query.companyId);
      return reply.send({ preparation });
    },
  );

  app.get("/health/version-1-activation", async (_request, reply) => {
    const assessment = assessVersion1OperationalActivation();
    const status = assessment.ready ? "HEALTHY" : "BLOCKED";
    return reply.send({
      status,
      ready: assessment.ready,
      blockers: assessment.blockers,
      pillowProductionMode: isPillowProductionModeEnabled(),
    });
  });
}
