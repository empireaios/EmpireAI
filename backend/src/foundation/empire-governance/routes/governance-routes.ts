import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { GOVERNANCE_DOMAINS, governanceDecisionRequestSchema } from "../models/governance-policy.js";
import {
  getGovernanceEngine,
  GovernanceBlockedError,
  initializeGovernancePolicies,
} from "../services/governance-engine.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerGovernanceRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;
  const engine = getGovernanceEngine();

  app.post("/governance/evaluate", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = governanceDecisionRequestSchema.parse({
      ...(request.body as Record<string, unknown>),
      workspaceId: user.workspaceId,
      actorRole: user.role,
      actor: user.email,
    });

    try {
      const verdict = engine.evaluateDecision(body, { actor: user.email });
      auditLogger.write({
        action: "governance.decision",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: {
          domain: body.domain,
          module: body.module,
          action: body.action,
          allowed: verdict.allowed,
          code: verdict.code,
        },
      });
      return reply.send({ verdict });
    } catch (error) {
      if (error instanceof GovernanceBlockedError) {
        return reply.code(403).send({ error: error.message, verdict: error.verdict, blocked: true });
      }
      throw error;
    }
  });

  app.get("/governance/policies", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ domain: z.enum(GOVERNANCE_DOMAINS).optional() }).parse(request.query);
    initializeGovernancePolicies(user.workspaceId);
    const policies = engine.listPolicies(user.workspaceId, query.domain);
    return reply.send({ policies });
  });

  app.patch("/governance/policies/:policyId", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    if (user.role !== "founder" && user.role !== "admin") {
      return reply.code(403).send({ error: "Founder or admin required to update governance policies" });
    }

    const params = z.object({ policyId: z.string().min(1) }).parse(request.params);
    const body = z
      .object({
        enabled: z.boolean().optional(),
        priority: z.number().int().min(0).optional(),
        description: z.string().optional(),
      })
      .parse(request.body);

    const updated = engine.updatePolicy(params.policyId, body);
    if (!updated) {
      return reply.code(404).send({ error: "Governance policy not found" });
    }

    auditLogger.write({
      action: "governance.policy_updated",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { policyId: params.policyId, enabled: updated.enabled },
    });

    return reply.send({ policy: updated });
  });

  app.get("/governance/decisions", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ limit: z.coerce.number().int().min(1).max(500).optional() }).parse(request.query);
    const decisions = engine.listDecisions(user.workspaceId, query.limit);
    return reply.send({ decisions });
  });

  app.get("/governance/capabilities", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const capabilities = engine.getCapabilities(user.workspaceId);
    return reply.send({ capabilities });
  });
}
