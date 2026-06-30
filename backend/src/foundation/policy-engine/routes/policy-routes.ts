import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import {
  POLICY_CATEGORIES,
  POLICY_DECISION_MODES,
  policyExecutableEnforcementSchema,
} from "../models/business-policy.js";
import {
  disablePolicy,
  enablePolicy,
  getExecutableBusinessPolicies,
  getPolicy,
  getPolicyForCategory,
  initializePolicies,
  listPolicies,
  listPolicyLifecycle,
  listWorkspacePolicyLifecycle,
  PolicyConflictError,
  PolicyNotFoundError,
  resolvePolicy,
  setProductSelectionMode,
  updatePolicy,
  upsertPolicy,
} from "../services/policy-engine-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerPolicyRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get("/policy/policies", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ status: z.enum(["ACTIVE", "DISABLED"]).optional() }).parse(request.query);
    const policies = listPolicies(user.workspaceId, query.status);
    return reply.send({ policies });
  });

  app.get("/policy/policies/:policyId", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ policyId: z.string().min(1) }).parse(request.params);
    initializePolicies(user.workspaceId);
    const policy = getPolicy(params.policyId);

    if (!policy) {
      return reply.code(404).send({ error: "Business policy not found" });
    }
    if (policy.workspaceId !== user.workspaceId && user.role !== "admin") {
      return reply.code(403).send({ error: "Workspace mismatch" });
    }

    return reply.send({ policy });
  });

  app.get("/policy/category/:category", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ category: z.enum(POLICY_CATEGORIES) }).parse(request.params);
    const policy = getPolicyForCategory(user.workspaceId, params.category);

    if (!policy) {
      return reply.code(404).send({ error: "No active policy for category" });
    }

    return reply.send({ policy });
  });

  app.post("/policy/policies", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    if (user.role !== "founder" && user.role !== "admin") {
      return reply.code(403).send({ error: "Founder or admin required to create policies" });
    }

    const body = z
      .object({
        policyId: z.string().min(1),
        category: z.enum(POLICY_CATEGORIES),
        name: z.string().min(1),
        description: z.string().min(1),
        decisionMode: z.enum(POLICY_DECISION_MODES),
        config: z.record(z.unknown()).optional(),
        executableEnforcement: policyExecutableEnforcementSchema.optional(),
        metadata: z.record(z.string()).optional(),
      })
      .parse(request.body);

    try {
      const policy = upsertPolicy({
        ...body,
        workspaceId: user.workspaceId,
        actor: user.email,
      });

      auditLogger.write({
        action: "policy.created",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { policyId: policy.policyId, category: policy.category },
      });

      return reply.code(201).send({ policy });
    } catch (error) {
      if (error instanceof PolicyConflictError) {
        return reply.code(409).send({ error: error.message });
      }
      throw error;
    }
  });

  app.patch("/policy/policies/:policyId", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    if (user.role !== "founder" && user.role !== "admin") {
      return reply.code(403).send({ error: "Founder or admin required to update policies" });
    }

    const params = z.object({ policyId: z.string().min(1) }).parse(request.params);
    const body = z
      .object({
        name: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        decisionMode: z.enum(POLICY_DECISION_MODES).optional(),
        config: z.record(z.unknown()).optional(),
        executableEnforcement: policyExecutableEnforcementSchema.optional(),
        metadata: z.record(z.string()).optional(),
      })
      .parse(request.body);

    try {
      const policy = updatePolicy({ policyId: params.policyId, ...body, actor: user.email });

      auditLogger.write({
        action: "policy.modified",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { policyId: policy.policyId, version: policy.version },
      });

      return reply.send({ policy });
    } catch (error) {
      if (error instanceof PolicyNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.post("/policy/policies/:policyId/disable", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    if (user.role !== "founder" && user.role !== "admin") {
      return reply.code(403).send({ error: "Founder or admin required" });
    }

    const params = z.object({ policyId: z.string().min(1) }).parse(request.params);
    const body = z.object({ reason: z.string().optional() }).parse(request.body ?? {});

    try {
      const policy = disablePolicy(params.policyId, user.email, body.reason);
      auditLogger.write({
        action: "policy.disabled",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { policyId: policy.policyId },
      });
      return reply.send({ policy });
    } catch (error) {
      if (error instanceof PolicyNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.post("/policy/policies/:policyId/enable", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    if (user.role !== "founder" && user.role !== "admin") {
      return reply.code(403).send({ error: "Founder or admin required" });
    }

    const params = z.object({ policyId: z.string().min(1) }).parse(request.params);

    try {
      const policy = enablePolicy(params.policyId, user.email);
      auditLogger.write({
        action: "policy.enabled",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: { policyId: policy.policyId },
      });
      return reply.send({ policy });
    } catch (error) {
      if (error instanceof PolicyNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.post("/policy/resolve", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z
      .object({
        category: z.enum(POLICY_CATEGORIES).optional(),
        policyId: z.string().optional(),
        module: z.string().optional(),
        action: z.string().optional(),
        context: z.record(z.unknown()).optional(),
      })
      .parse(request.body);

    try {
      const resolution = resolvePolicy({
        workspaceId: user.workspaceId,
        ...body,
        actor: user.email,
        correlationId: request.id,
      });

      auditLogger.write({
        action: "policy.resolved",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: request.id,
        metadata: {
          policyId: resolution.policyId,
          category: resolution.category,
          requiresApproval: resolution.requiresApproval,
        },
      });

      return reply.send({ resolution });
    } catch (error) {
      if (error instanceof PolicyNotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      throw error;
    }
  });

  app.patch("/policy/product-selection/mode", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    if (user.role !== "founder" && user.role !== "admin") {
      return reply.code(403).send({ error: "Founder or admin required" });
    }

    const body = z.object({ mode: z.enum(["manual", "automatic"]) }).parse(request.body);
    const policy = setProductSelectionMode(user.workspaceId, body.mode, user.email);

    auditLogger.write({
      action: "policy.modified",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { policyId: policy.policyId, mode: body.mode },
    });

    return reply.send({ policy });
  });

  app.get("/policy/lifecycle/:policyId", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ policyId: z.string().min(1) }).parse(request.params);
    const query = z.object({ limit: z.coerce.number().int().min(1).max(500).optional() }).parse(request.query);
    initializePolicies(user.workspaceId);
    const lifecycle = listPolicyLifecycle(params.policyId, query.limit);
    return reply.send({ lifecycle });
  });

  app.get("/policy/lifecycle", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ limit: z.coerce.number().int().min(1).max(500).optional() }).parse(request.query);
    initializePolicies(user.workspaceId);
    const lifecycle = listWorkspacePolicyLifecycle(user.workspaceId, query.limit);
    return reply.send({ lifecycle });
  });

  app.get("/policy/governance-rules", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const rules = getExecutableBusinessPolicies(user.workspaceId);
    return reply.send({ rules });
  });
}
