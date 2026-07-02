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
import { assessProductionInfrastructureReadiness } from "../production-infrastructure-readiness.js";
import { assessB6CredentialImplementation } from "../b6-credential-implementation.js";
import { runCjLiveAuthProof } from "../../../suppliers/cj-dropshipping/cj-live-auth-proof.js";
import { runStripeLiveAuthProof } from "../../../revenue/shared/stripe-live-auth-proof.js";

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

  app.get("/health/production-deploy", async (_request, reply) => {
    const infrastructure = assessProductionInfrastructureReadiness();
    const b5Status = infrastructure.b5Closed
      ? "CLOSED"
      : infrastructure.hostingConfigured
        ? "RUNTIME_PENDING"
        : "OPEN";
    return reply.send({
      status: infrastructure.b5Closed ? "ok" : "blocked",
      b5Status,
      blockerId: "B5",
      hostingConfigured: infrastructure.hostingConfigured,
      runtimeVerified: infrastructure.runtimeVerified,
      b5Closed: infrastructure.b5Closed,
      blockers: infrastructure.blockers,
      warnings: infrastructure.warnings,
      liveCommerceSafelyBlocked: infrastructure.liveCommerceSafelyBlocked,
      liveCommerceMode: infrastructure.liveCommerceMode,
      credentialReadinessForB6: infrastructure.credentialReadinessForB6,
      secretsChecklist: infrastructure.secretsChecklist,
      domainReadiness: infrastructure.domainReadiness,
      deploymentTargets: infrastructure.deploymentTargets,
      computedAt: infrastructure.computedAt,
    });
  });

  app.get(
    "/version-1-activation/production-deploy",
    { preHandler: authenticate },
    async (_request, reply) => {
      const infrastructure = assessProductionInfrastructureReadiness();
      const review = runVersion1ProductionReadinessReview();
      return reply.send({
        infrastructure,
        review: {
          infrastructureDeploymentPassed: review.infrastructureDeploymentPassed,
          productionReadinessPassed: review.productionReadinessPassed,
          findingsPreventingOperation: review.findingsPreventingOperation,
        },
      });
    },
  );

  app.get("/health/b6-implementation", async (_request, reply) => {
    const tracking = assessB6CredentialImplementation();
    return reply.send({
      status: tracking.b6Closed ? "ok" : "in_progress",
      ...tracking,
    });
  });

  app.get("/health/b6-02-cj-live-auth", async (_request, reply) => {
    const proof = await runCjLiveAuthProof();
    return reply.code(proof.success ? 200 : 503).send({
      status: proof.success ? "ok" : "failed",
      ...proof,
    });
  });

  app.get("/health/b6-03-stripe-live-auth", async (_request, reply) => {
    const proof = await runStripeLiveAuthProof();
    const remainingBlockers = proof.success
      ? [
          ...(proof.paymentService.livePaymentEnabled
            ? []
            : ["LIVE_PAYMENT_ENABLED=false — live charges gated (Protect The Empire)"]),
        ]
      : [];
    return reply.code(proof.success ? 200 : 503).send({
      status: proof.success ? "ok" : "failed",
      remainingBlockers,
      ...proof,
    });
  });
}
