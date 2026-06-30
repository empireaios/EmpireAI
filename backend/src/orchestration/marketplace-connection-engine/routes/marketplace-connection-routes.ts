import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { MARKETPLACE_IDS } from "../../marketplace-infrastructure-engine/models/marketplace-connection.js";
import { MARKETPLACE_ACCOUNT_TYPES } from "../models/marketplace-connection-record.js";
import {
  completeMarketplaceConnectionFlow,
  getMarketplaceConnectionCapabilities,
  getMarketplaceConnectionRecord,
  getMarketplacePublishingReadiness,
  listConnectedMarketplaces,
  listMarketplaceConnectionRecords,
  refreshMarketplaceConnectionFlow,
  revokeMarketplaceConnectionFlow,
  startMarketplaceConnectionFlow,
  verifyMarketplaceConnectionFlow,
} from "../services/marketplace-connection-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerMarketplaceConnectionRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get("/marketplace-connection/records", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ accountType: z.enum(MARKETPLACE_ACCOUNT_TYPES).optional() }).parse(request.query);
    const records = listMarketplaceConnectionRecords(user.workspaceId, query.accountType ?? "GRAND_KING");
    return reply.send({ records, total: records.length });
  });

  app.get("/marketplace-connection/records/:marketplaceId", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ marketplaceId: z.enum(MARKETPLACE_IDS) }).parse(request.params);
    const query = z.object({ accountType: z.enum(MARKETPLACE_ACCOUNT_TYPES).optional() }).parse(request.query);
    const record = getMarketplaceConnectionRecord(
      user.workspaceId,
      params.marketplaceId,
      query.accountType ?? "GRAND_KING",
    );
    const capabilities = getMarketplaceConnectionCapabilities(params.marketplaceId);
    return reply.send({ record, capabilities });
  });

  app.get("/marketplace-connection/readiness", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ accountType: z.enum(MARKETPLACE_ACCOUNT_TYPES).optional() }).parse(request.query);
    const readiness = getMarketplacePublishingReadiness(user.workspaceId, query.accountType ?? "GRAND_KING");
    return reply.send({ readiness });
  });

  app.get("/marketplace-connection/connected", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ accountType: z.enum(MARKETPLACE_ACCOUNT_TYPES).optional() }).parse(request.query);
    const connected = listConnectedMarketplaces(user.workspaceId, query.accountType ?? "GRAND_KING");
    return reply.send({ connected, total: connected.length });
  });

  app.post("/marketplace-connection/:marketplaceId/start", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ marketplaceId: z.enum(MARKETPLACE_IDS) }).parse(request.params);
    const body = z.object({ accountType: z.enum(MARKETPLACE_ACCOUNT_TYPES).optional() }).parse(request.body ?? {});
    const record = startMarketplaceConnectionFlow({
      workspaceId: user.workspaceId,
      marketplaceId: params.marketplaceId,
      accountType: body.accountType ?? "GRAND_KING",
      actor: user.email,
    });
    auditLogger.write({
      action: "marketplace_connection.started",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { marketplaceId: params.marketplaceId },
    });
    return reply.send({ record });
  });

  app.post("/marketplace-connection/:marketplaceId/complete", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ marketplaceId: z.enum(MARKETPLACE_IDS) }).parse(request.params);
    const body = z
      .object({
        credentialsRef: z.string().min(1),
        grantedScopes: z.array(z.string()).optional(),
        accountType: z.enum(MARKETPLACE_ACCOUNT_TYPES).optional(),
        expiresAt: z.string().optional(),
      })
      .parse(request.body);
    const record = completeMarketplaceConnectionFlow({
      workspaceId: user.workspaceId,
      marketplaceId: params.marketplaceId,
      credentialsRef: body.credentialsRef,
      grantedScopes: body.grantedScopes,
      accountType: body.accountType ?? "GRAND_KING",
      actor: user.email,
      expiresAt: body.expiresAt,
    });
    auditLogger.write({
      action: "marketplace_connection.completed",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { marketplaceId: params.marketplaceId },
    });
    return reply.send({ record });
  });

  app.post("/marketplace-connection/:marketplaceId/refresh", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ marketplaceId: z.enum(MARKETPLACE_IDS) }).parse(request.params);
    const body = z.object({ accountType: z.enum(MARKETPLACE_ACCOUNT_TYPES).optional() }).parse(request.body ?? {});
    const record = refreshMarketplaceConnectionFlow({
      workspaceId: user.workspaceId,
      marketplaceId: params.marketplaceId,
      accountType: body.accountType ?? "GRAND_KING",
      actor: user.email,
    });
    auditLogger.write({
      action: "marketplace_connection.refreshed",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { marketplaceId: params.marketplaceId },
    });
    return reply.send({ record });
  });

  app.post("/marketplace-connection/:marketplaceId/revoke", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ marketplaceId: z.enum(MARKETPLACE_IDS) }).parse(request.params);
    const body = z
      .object({
        accountType: z.enum(MARKETPLACE_ACCOUNT_TYPES).optional(),
        reason: z.string().optional(),
      })
      .parse(request.body ?? {});
    const record = revokeMarketplaceConnectionFlow({
      workspaceId: user.workspaceId,
      marketplaceId: params.marketplaceId,
      accountType: body.accountType ?? "GRAND_KING",
      actor: user.email,
      reason: body.reason,
    });
    auditLogger.write({
      action: "marketplace_connection.revoked",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { marketplaceId: params.marketplaceId, reason: body.reason },
    });
    return reply.send({ record });
  });

  app.post("/marketplace-connection/:marketplaceId/verify", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ marketplaceId: z.enum(MARKETPLACE_IDS) }).parse(request.params);
    const body = z.object({ accountType: z.enum(MARKETPLACE_ACCOUNT_TYPES).optional() }).parse(request.body ?? {});
    const record = verifyMarketplaceConnectionFlow({
      workspaceId: user.workspaceId,
      marketplaceId: params.marketplaceId,
      accountType: body.accountType ?? "GRAND_KING",
    });
    auditLogger.write({
      action: "marketplace_connection.verified",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { marketplaceId: params.marketplaceId },
    });
    return reply.send({ record });
  });
}
