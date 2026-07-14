import type { FastifyInstance } from "fastify";

import type { AuditLogger } from "../../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../../auth/middleware.js";
import {
  buildMarketplaceCockpitIntegrationView,
  buildMarketplaceIntegrationArchitectureSnapshot,
  listMarketplaceConnectorDefinitions,
  listMarketplaceIntegrationPipelinePhases,
  listMarketplaceSyncDomains,
} from "../services/marketplace-integration-architecture-service.js";
import { MARKETPLACE_FAILURE_RECOVERY_MAPPINGS } from "../data/marketplace-connector-catalog.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerMarketplaceIntegrationArchitectureRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get("/commerce/marketplace-integration/architecture", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const snapshot = buildMarketplaceIntegrationArchitectureSnapshot({
      workspaceId: user.workspaceId,
    });

    auditLogger.write({
      action: "marketplace_integration.architecture_loaded",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: {
        connectorCount: snapshot.connectorCount,
        connectedCount: snapshot.connectedCount,
      },
    });

    return reply.send({ architecture: snapshot });
  });

  app.get("/commerce/marketplace-integration/cockpit", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const view = buildMarketplaceCockpitIntegrationView({ workspaceId: user.workspaceId });
    return reply.send({ view });
  });

  app.get("/commerce/marketplace-integration/connectors", { preHandler: authenticate }, async (_request, reply) => {
    return reply.send({
      connectors: listMarketplaceConnectorDefinitions(),
      total: listMarketplaceConnectorDefinitions().length,
    });
  });

  app.get("/commerce/marketplace-integration/pipeline", { preHandler: authenticate }, async (_request, reply) => {
    return reply.send({
      pipeline: listMarketplaceIntegrationPipelinePhases(),
      syncDomains: listMarketplaceSyncDomains(),
      failureRecovery: MARKETPLACE_FAILURE_RECOVERY_MAPPINGS,
    });
  });
}
