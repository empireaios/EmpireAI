import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { startMarketplaceConnection } from "../../../orchestration/marketplace-infrastructure-engine/services/marketplace-infrastructure-service.js";
import { connectProvider } from "../../../orchestration/reality-integration/services/reality-integration-service.js";
import { MARKETPLACE_IDS } from "../../../orchestration/marketplace-infrastructure-engine/models/marketplace-connection.js";
import {
  buildIntegrationsHubDashboard,
  getIntegrationsHubConnectTarget,
} from "../services/integrations-hub-service.js";
import { getIntegrationsHubDefinition } from "../models/integrations-hub-catalog.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

function requireFounder(request: { user?: { role: string } }, reply: { code: (n: number) => { send: (b: unknown) => void }; sent?: boolean }): boolean {
  const user = request.user;
  if (!user) {
    reply.code(401).send({ error: "Authentication required" });
    return false;
  }
  if (user.role !== "founder" && user.role !== "admin") {
    reply.code(403).send({ error: "Integrations Hub is founder-only" });
    return false;
  }
  return true;
}

export async function registerIntegrationsHubRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get("/integrations-hub/dashboard", { preHandler: authenticate }, async (request, reply) => {
    if (!requireFounder(request, reply)) return;
    const user = request.user!;
    return reply.send({ dashboard: buildIntegrationsHubDashboard(user.workspaceId) });
  });

  app.post("/integrations-hub/:integrationId/connect", { preHandler: authenticate }, async (request, reply) => {
    if (!requireFounder(request, reply)) return;
    const user = request.user!;
    const { integrationId } = z.object({ integrationId: z.string().min(1) }).parse(request.params);
    const body = z
      .object({
        credentials: z.record(z.string()).optional(),
        credentialType: z.enum(["oauth", "api_key", "refresh_token", "secret"]).default("api_key"),
      })
      .parse(request.body ?? {});

    const definition = getIntegrationsHubDefinition(integrationId);
    if (!definition) {
      return reply.code(404).send({ error: "Integration not found" });
    }
    if (definition.future) {
      return reply.code(400).send({ error: "Integration adapter not yet available" });
    }

    const target = getIntegrationsHubConnectTarget(integrationId);
    if (!target) {
      return reply.code(400).send({ error: "Connect not available for this integration" });
    }

    if (target.connectKind === "env") {
      return reply.code(400).send({
        error: "Configure via environment variables",
        hint: `Set API keys in backend environment for ${definition.displayName}`,
      });
    }

    if (target.connectKind === "marketplace" && target.marketplaceInfrastructureId) {
      const marketplaceId = target.marketplaceInfrastructureId as (typeof MARKETPLACE_IDS)[number];
      if (!MARKETPLACE_IDS.includes(marketplaceId)) {
        return reply.code(400).send({ error: "Marketplace connect not registered" });
      }
      const connection = startMarketplaceConnection(user.workspaceId, marketplaceId, user.email);
      auditLogger.write({
        action: "marketplace_infrastructure.connect_started",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: `ih:${integrationId}`,
        metadata: { integrationId, marketplaceId, source: "integrations-hub" },
      });
      return reply.send({ ok: true, connection });
    }

    if (target.connectKind === "reality" && target.realityProviderId) {
      if (!body.credentials || Object.keys(body.credentials).length === 0) {
        return reply.code(400).send({
          error: "Credentials required",
          hint: "Provide credentials object for vault storage",
        });
      }
      const state = await connectProvider({
        workspaceId: user.workspaceId,
        providerId: target.realityProviderId,
        credentialType: body.credentialType,
        secretPayload: body.credentials,
        actor: user.email,
      });
      auditLogger.write({
        action: "reality_integration.connect",
        actor: user.email,
        workspaceId: user.workspaceId,
        correlationId: `ih:${integrationId}`,
        metadata: { integrationId, providerId: target.realityProviderId, source: "integrations-hub" },
      });
      return reply.code(201).send({ ok: true, state });
    }

    return reply.code(400).send({ error: "Unsupported connect kind" });
  });

  app.get("/health/integrations-hub", async (_request, reply) => {
    const dashboard = buildIntegrationsHubDashboard("ws_empire_1");
    return reply.send({
      status: "HEALTHY",
      totalIntegrations: dashboard.summary.total,
      connected: dashboard.summary.connected,
    });
  });
}
