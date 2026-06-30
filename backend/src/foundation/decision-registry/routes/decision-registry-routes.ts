import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import {
  DECISION_CATEGORIES,
  decisionAlternativeSchema,
  decisionTradeoffSchema,
} from "../models/empire-decision.js";
import {
  approveDecision,
  DecisionConflictError,
  DecisionNotFoundError,
  deprecateDecision,
  getDecision,
  initializeDecisionRegistry,
  listDecisionLifecycle,
  listDecisions,
  listWorkspaceDecisionLifecycle,
  modifyDecision,
  proposeDecision,
  recordDecision,
  supersedeDecision,
} from "../services/decision-registry-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerDecisionRegistryRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get("/decision-registry/decisions", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z
      .object({
        status: z.enum(["PROPOSED", "APPROVED", "SUPERSEDED", "DEPRECATED"]).optional(),
        category: z.enum(DECISION_CATEGORIES).optional(),
      })
      .parse(request.query);
    const decisions = listDecisions(user.workspaceId, query);
    return reply.send({ decisions, total: decisions.length });
  });

  app.get("/decision-registry/decisions/:decisionId", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ decisionId: z.string().min(1) }).parse(request.params);
    initializeDecisionRegistry(user.workspaceId);
    const decision = getDecision(params.decisionId);

    if (!decision) {
      return reply.code(404).send({ error: "Decision not found" });
    }
    if (decision.workspaceId !== user.workspaceId && user.role !== "admin") {
      return reply.code(403).send({ error: "Workspace mismatch" });
    }

    return reply.send({ decision });
  });

  app.post("/decision-registry/decisions", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    if (user.role !== "founder" && user.role !== "admin") {
      return reply.code(403).send({ error: "Founder or admin required to record decisions" });
    }

    const body = z
      .object({
        decisionId: z.string().min(1),
        title: z.string().min(1),
        category: z.enum(DECISION_CATEGORIES),
        decision: z.string().min(1),
        reason: z.string().min(1),
        alternatives: z.array(decisionAlternativeSchema).optional(),
        tradeoffs: z.array(decisionTradeoffSchema).optional(),
        approver: z.string().min(1),
        approvedAt: z.string().optional(),
        metadata: z.record(z.string()).optional(),
      })
      .parse(request.body);

    try {
      const decision = recordDecision({
        ...body,
        workspaceId: user.workspaceId,
        actor: user.email,
      });

      auditLogger.write({
        action: "decision_registry.recorded",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: {
          decisionId: decision.decisionId,
          approver: decision.approver,
          approvedAt: decision.approvedAt,
        },
      });

      return reply.code(201).send({ decision });
    } catch (error) {
      if (error instanceof DecisionConflictError) {
        return reply.code(409).send({ error: error.message });
      }
      throw error;
    }
  });

  app.post("/decision-registry/decisions/propose", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z
      .object({
        decisionId: z.string().min(1),
        title: z.string().min(1),
        category: z.enum(DECISION_CATEGORIES),
        decision: z.string().min(1),
        reason: z.string().min(1),
        alternatives: z.array(decisionAlternativeSchema).optional(),
        tradeoffs: z.array(decisionTradeoffSchema).optional(),
        approver: z.string().min(1),
        metadata: z.record(z.string()).optional(),
      })
      .parse(request.body);

    try {
      const decision = proposeDecision({
        ...body,
        workspaceId: user.workspaceId,
        actor: user.email,
      });
      return reply.code(201).send({ decision });
    } catch (error) {
      if (error instanceof DecisionConflictError) {
        return reply.code(409).send({ error: error.message });
      }
      throw error;
    }
  });

  app.post("/decision-registry/decisions/:decisionId/approve", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    if (user.role !== "founder" && user.role !== "admin") {
      return reply.code(403).send({ error: "Founder or admin required to approve decisions" });
    }

    const params = z.object({ decisionId: z.string().min(1) }).parse(request.params);

    try {
      const decision = approveDecision(params.decisionId, user.email, user.email);
      auditLogger.write({
        action: "decision_registry.approved",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { decisionId: decision.decisionId, approvedAt: decision.approvedAt },
      });
      return reply.send({ decision });
    } catch (error) {
      if (error instanceof DecisionNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      if (error instanceof DecisionConflictError) {
        return reply.code(409).send({ error: error.message });
      }
      throw error;
    }
  });

  app.patch("/decision-registry/decisions/:decisionId", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    if (user.role !== "founder" && user.role !== "admin") {
      return reply.code(403).send({ error: "Founder or admin required to modify decisions" });
    }

    const params = z.object({ decisionId: z.string().min(1) }).parse(request.params);
    const body = z
      .object({
        title: z.string().min(1).optional(),
        decision: z.string().min(1).optional(),
        reason: z.string().min(1).optional(),
        alternatives: z.array(decisionAlternativeSchema).optional(),
        tradeoffs: z.array(decisionTradeoffSchema).optional(),
        metadata: z.record(z.string()).optional(),
      })
      .parse(request.body);

    try {
      const decision = modifyDecision({ decisionId: params.decisionId, ...body, actor: user.email });
      auditLogger.write({
        action: "decision_registry.modified",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { decisionId: decision.decisionId, version: decision.version },
      });
      return reply.send({ decision });
    } catch (error) {
      if (error instanceof DecisionNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      if (error instanceof DecisionConflictError) {
        return reply.code(409).send({ error: error.message });
      }
      throw error;
    }
  });

  app.post("/decision-registry/decisions/:decisionId/supersede", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    if (user.role !== "founder" && user.role !== "admin") {
      return reply.code(403).send({ error: "Founder or admin required" });
    }

    const params = z.object({ decisionId: z.string().min(1) }).parse(request.params);
    const body = z.object({ supersededBy: z.string().min(1) }).parse(request.body);

    try {
      const decision = supersedeDecision(params.decisionId, body.supersededBy, user.email);
      auditLogger.write({
        action: "decision_registry.superseded",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { decisionId: decision.decisionId, supersededBy: body.supersededBy },
      });
      return reply.send({ decision });
    } catch (error) {
      if (error instanceof DecisionNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.post("/decision-registry/decisions/:decisionId/deprecate", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    if (user.role !== "founder" && user.role !== "admin") {
      return reply.code(403).send({ error: "Founder or admin required" });
    }

    const params = z.object({ decisionId: z.string().min(1) }).parse(request.params);
    const body = z.object({ reason: z.string().optional() }).parse(request.body ?? {});

    try {
      const decision = deprecateDecision(params.decisionId, user.email, body.reason);
      auditLogger.write({
        action: "decision_registry.deprecated",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { decisionId: decision.decisionId },
      });
      return reply.send({ decision });
    } catch (error) {
      if (error instanceof DecisionNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.get("/decision-registry/lifecycle/:decisionId", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ decisionId: z.string().min(1) }).parse(request.params);
    const query = z.object({ limit: z.coerce.number().int().min(1).max(500).optional() }).parse(request.query);
    initializeDecisionRegistry(user.workspaceId);
    const lifecycle = listDecisionLifecycle(params.decisionId, query.limit);
    return reply.send({ lifecycle });
  });

  app.get("/decision-registry/lifecycle", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ limit: z.coerce.number().int().min(1).max(500).optional() }).parse(request.query);
    initializeDecisionRegistry(user.workspaceId);
    const lifecycle = listWorkspaceDecisionLifecycle(user.workspaceId, query.limit);
    return reply.send({ lifecycle });
  });
}
