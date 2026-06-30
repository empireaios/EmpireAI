import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../auth/middleware.js";
import { buildEmpireAccessRegistry, getEmpireAccessRecord, getPermissionMatrixForPlatform } from "../services/empire-access-registry-service.js";
import { buildAccessDashboard } from "../services/access-dashboard-service.js";
import { ACTION_BOUNDARY_RULES, classifyAction } from "../models/approval-boundary.js";
import { ACCESS_STATE_TRANSITIONS } from "../models/access-state-machine.js";
import { buildAmazonAccessReadiness, buildCjAccessReadiness, buildMarketplaceAccessReadiness, FUTURE_MARKETPLACE_IDS } from "../models/platform-readiness.js";
import { getEmpirePlatform } from "../models/empire-platform-catalog.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerOperationalAccessRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate } = deps;

  app.get("/operational-access/registry", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    return reply.send({ registry: buildEmpireAccessRegistry(user.workspaceId) });
  });

  app.get("/operational-access/registry/:platformId", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const { platformId } = z.object({ platformId: z.string().min(1) }).parse(request.params);
    return reply.send({ record: getEmpireAccessRecord(user.workspaceId, platformId) });
  });

  app.get("/operational-access/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1).default("co-grand-king") }).parse(request.query);
    return reply.send({ dashboard: buildAccessDashboard(user.workspaceId, query.companyId) });
  });

  app.get("/operational-access/lifecycle", { preHandler: authenticate }, async (_request, reply) => {
    return reply.send({ transitions: ACCESS_STATE_TRANSITIONS });
  });

  app.get("/operational-access/permissions/:platformId", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const { platformId } = z.object({ platformId: z.string().min(1) }).parse(request.params);
    const matrix = getPermissionMatrixForPlatform(user.workspaceId, platformId);
    if (!matrix) return reply.code(404).send({ error: "Platform not found" });
    return reply.send({ matrix });
  });

  app.get("/operational-access/approval-boundaries", { preHandler: authenticate }, async (request, reply) => {
    const query = z.object({ platformId: z.string().optional(), action: z.string().optional() }).parse(request.query);
    if (query.action && query.platformId) {
      const rule = classifyAction(query.action as Parameters<typeof classifyAction>[0], query.platformId);
      return reply.send({ rule: rule ?? null });
    }
    return reply.send({ rules: ACTION_BOUNDARY_RULES });
  });

  app.get("/operational-access/readiness/amazon", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const record = getEmpireAccessRecord(user.workspaceId, "amazon-seller");
    return reply.send({
      readiness: buildAmazonAccessReadiness(record.accessState, Boolean(record.credentialsRef), record.scopes),
    });
  });

  app.get("/operational-access/readiness/cj", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const record = getEmpireAccessRecord(user.workspaceId, "cj-dropshipping");
    return reply.send({ readiness: buildCjAccessReadiness(record.accessState, Boolean(record.credentialsRef)) });
  });

  app.get("/operational-access/readiness/marketplaces", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const readiness = FUTURE_MARKETPLACE_IDS.map((id) => {
      const record = getEmpireAccessRecord(user.workspaceId, id);
      const def = getEmpirePlatform(id)!;
      return buildMarketplaceAccessReadiness(id, def.displayName, record.accessState, Boolean(record.credentialsRef));
    });
    return reply.send({ marketplaces: readiness });
  });

  app.get("/health/operational-access", async (_request, reply) => {
    const registry = buildEmpireAccessRegistry("ws_empire_1");
    return reply.send({
      status: registry.summary.architectureComplete ? "HEALTHY" : "WARNING",
      platforms: registry.summary.totalPlatforms,
      architectureComplete: registry.summary.architectureComplete,
    });
  });
}
