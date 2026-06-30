import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import {
  buildConnectorHealthCenter,
  buildRealityIntegrationDashboard,
  buildRealityReadinessDashboard,
  buildProviderCapabilityMatrix,
  getProviderCapabilityMatrixEntry,
  listApprovalPolicies,
  assessApprovalRequired,
  buildCredentialGovernanceSummary,
  listExpiringCredentials,
  verifyCredential,
  connectProvider,
  connectorCost,
  connectorDependencies,
  connectorHealth,
  connectorHeartbeat,
  connectorRefresh,
  connectorValidate,
  disconnectProvider,
  getConnectorRegistryEntry,
  getConnectorRuntimeState,
  listConnectorRegistry,
  validateRealityIntegration,
} from "../services/reality-integration-service.js";
import { getCredentialVaultRepository } from "../repositories/sqlite-credential-vault-repository.js";
import { connectorGovernanceFlow } from "../services/connector-governance-service.js";
import { getConnectorMonitoringRepository } from "../repositories/sqlite-connector-monitoring-repository.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerRealityIntegrationRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get("/reality-integration/registry", { preHandler: authenticate }, async (_request, reply) => {
    return reply.send({ providers: listConnectorRegistry() });
  });

  app.get("/reality-integration/registry/:providerId", { preHandler: authenticate }, async (request, reply) => {
    const { providerId } = z.object({ providerId: z.string().min(1) }).parse(request.params);
    const entry = getConnectorRegistryEntry(providerId);
    if (!entry) return reply.code(404).send({ error: "Provider not found" });
    return reply.send({ entry });
  });

  app.post("/reality-integration/connect", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({
      providerId: z.string().min(1),
      credentialType: z.enum(["oauth", "api_key", "refresh_token", "secret"]),
      secretPayload: z.record(z.unknown()),
      scopes: z.array(z.string()).optional(),
    }).parse(request.body);

    const state = await connectProvider({
      workspaceId: user.workspaceId,
      providerId: body.providerId,
      credentialType: body.credentialType,
      secretPayload: body.secretPayload,
      scopes: body.scopes,
      actor: user.email,
    });

    auditLogger.write({
      action: "reality_integration.connect",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { providerId: body.providerId, credentialsRef: state.credentialsRef },
    });

    return reply.code(201).send({ state });
  });

  app.post("/reality-integration/disconnect", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ providerId: z.string().min(1) }).parse(request.body);
    const state = await disconnectProvider(user.workspaceId, body.providerId, user.email);
    auditLogger.write({
      action: "reality_integration.disconnect",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { providerId: body.providerId },
    });
    return reply.send({ state });
  });

  app.post("/reality-integration/validate", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ providerId: z.string().min(1) }).parse(request.body);
    return reply.send(await connectorValidate(user.workspaceId, body.providerId));
  });

  app.post("/reality-integration/heartbeat", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ providerId: z.string().min(1) }).parse(request.body);
    return reply.send(await connectorHeartbeat(user.workspaceId, body.providerId));
  });

  app.post("/reality-integration/refresh", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ providerId: z.string().min(1) }).parse(request.body);
    const state = await connectorRefresh(user.workspaceId, body.providerId);
    auditLogger.write({
      action: "reality_integration.refresh",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { providerId: body.providerId },
    });
    return reply.send({ state });
  });

  app.get("/reality-integration/health/:providerId", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const { providerId } = z.object({ providerId: z.string().min(1) }).parse(request.params);
    return reply.send(connectorHealth(user.workspaceId, providerId));
  });

  app.get("/reality-integration/cost/:providerId", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const { providerId } = z.object({ providerId: z.string().min(1) }).parse(request.params);
    return reply.send(connectorCost(user.workspaceId, providerId));
  });

  app.get("/reality-integration/dependencies/:providerId", { preHandler: authenticate }, async (request, reply) => {
    const { providerId } = z.object({ providerId: z.string().min(1) }).parse(request.params);
    return reply.send({ dependencies: connectorDependencies(providerId) });
  });

  app.get("/reality-integration/runtime/:providerId", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const { providerId } = z.object({ providerId: z.string().min(1) }).parse(request.params);
    const state = getConnectorRuntimeState(user.workspaceId, providerId);
    if (!state) return reply.code(404).send({ error: "Runtime state not found" });
    return reply.send({ state });
  });

  app.get("/reality-integration/vault", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    return reply.send({ credentials: getCredentialVaultRepository().listByWorkspace(user.workspaceId) });
  });

  app.post("/reality-integration/vault/revoke", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ credentialsRef: z.string().min(1) }).parse(request.body);
    getCredentialVaultRepository().revokeCredential(body.credentialsRef);
    auditLogger.write({
      action: "reality_integration.vault.revoke",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { credentialsRef: body.credentialsRef },
    });
    return reply.send({ revoked: true });
  });

  app.get("/reality-integration/health-center", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    return reply.send(buildConnectorHealthCenter(user.workspaceId));
  });

  app.get("/reality-integration/dashboard", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send(buildRealityIntegrationDashboard(user.workspaceId, query.companyId));
  });

  app.get("/reality-integration/governance/flow", { preHandler: authenticate }, async (_request, reply) => {
    return reply.send(connectorGovernanceFlow());
  });

  app.get("/reality-integration/monitoring", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ providerId: z.string().optional() }).parse(request.query);
    return reply.send({
      events: getConnectorMonitoringRepository().listEvents(user.workspaceId, query.providerId),
    });
  });

  app.post("/reality-integration/validate-all", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const result = await validateRealityIntegration(user.workspaceId);
    auditLogger.write({
      action: "reality_integration.validate_all",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { valid: result.valid, providersValidated: result.providersValidated },
    });
    return reply.code(201).send({ validation: result });
  });

  app.get("/reality-integration/capability-matrix", { preHandler: authenticate }, async (_request, reply) => {
    return reply.send({ matrix: buildProviderCapabilityMatrix() });
  });

  app.get("/reality-integration/capability-matrix/:providerId", { preHandler: authenticate }, async (request, reply) => {
    const { providerId } = z.object({ providerId: z.string().min(1) }).parse(request.params);
    const entry = getProviderCapabilityMatrixEntry(providerId);
    if (!entry) return reply.code(404).send({ error: "Provider not found" });
    return reply.send({ entry });
  });

  app.get("/reality-integration/approval-policies", { preHandler: authenticate }, async (_request, reply) => {
    return reply.send({ policies: listApprovalPolicies() });
  });

  app.post("/reality-integration/approval/assess", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({
      action: z.enum(["publish_product", "launch_ads", "capture_payment", "refund", "cancel_order", "delete_listing", "charge_customer", "modify_inventory", "send_fulfillment", "delete_account", "activate_runtime"]),
      providerId: z.string().optional(),
    }).parse(request.body);
    return reply.send({
      assessment: assessApprovalRequired({
        workspaceId: user.workspaceId,
        action: body.action,
        providerId: body.providerId,
        actor: user.email,
      }),
    });
  });

  app.get("/reality-integration/credential-governance", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    return reply.send({ governance: buildCredentialGovernanceSummary(user.workspaceId) });
  });

  app.post("/reality-integration/credential-governance/verify", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ credentialsRef: z.string().min(1) }).parse(request.body);
    const result = verifyCredential(body.credentialsRef, user.email);
    auditLogger.write({
      action: "reality_integration.credential.verified",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { credentialsRef: body.credentialsRef, verified: result.verified },
    });
    return reply.send({ verification: result });
  });

  app.get("/reality-integration/readiness", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
    return reply.send({ dashboard: buildRealityReadinessDashboard(user.workspaceId, query.companyId) });
  });

  app.get("/reality-integration/live-commerce", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const { buildLiveCommerceFoundationDashboard } = await import("../services/live-commerce-foundation-service.js");
    return reply.send({ dashboard: buildLiveCommerceFoundationDashboard(user.workspaceId) });
  });

  app.get("/reality-integration/operational-access", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const { buildOperationalAccessRegistry } = await import("../services/operational-access-registry-service.js");
    return reply.send({ registry: buildOperationalAccessRegistry(user.workspaceId) });
  });

  app.get("/reality-integration/operational-access/:providerId", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const { providerId } = z.object({ providerId: z.string().min(1) }).parse(request.params);
    const { getOperationalAccessRecord } = await import("../services/operational-access-registry-service.js");
    return reply.send({ record: getOperationalAccessRecord(user.workspaceId, providerId) });
  });

  app.get("/reality-integration/capabilities/:providerId", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const { providerId } = z.object({ providerId: z.string().min(1) }).parse(request.params);
    const { verifyProviderCapabilities } = await import("../services/provider-capability-verification-service.js");
    return reply.send({ verification: verifyProviderCapabilities(user.workspaceId, providerId) });
  });

  app.get("/reality-integration/activation/:providerId", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const { providerId } = z.object({ providerId: z.string().min(1) }).parse(request.params);
    const { assessRuntimeActivation } = await import("../services/runtime-activation-service.js");
    return reply.send({ assessment: assessRuntimeActivation(user.workspaceId, providerId, user.email) });
  });

  app.get("/reality-integration/vault/profiles", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const { listCredentialVaultProfiles } = await import("../services/credential-vault-profile-service.js");
    return reply.send({ profiles: listCredentialVaultProfiles(user.workspaceId) });
  });

  app.get("/reality-integration/live-commerce/integration", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const { buildLiveCommerceIntegrationDashboard } = await import(
      "../live-commerce/services/live-commerce-integration-service.js"
    );
    return reply.send({ dashboard: buildLiveCommerceIntegrationDashboard(user.workspaceId) });
  });

  app.post("/reality-integration/live-commerce/oauth/start", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({
      providerId: z.string().min(1),
      redirectUri: z.string().url(),
      scopes: z.array(z.string()).optional(),
    }).parse(request.body);
    const { startMarketplaceOAuth } = await import(
      "../live-commerce/services/oauth-lifecycle-service.js"
    );
    const result = startMarketplaceOAuth({
      workspaceId: user.workspaceId,
      providerId: body.providerId,
      redirectUri: body.redirectUri,
      scopes: body.scopes,
    });
    auditLogger.write({
      action: "reality_integration.live_commerce.oauth.start",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { providerId: body.providerId, stateId: result.stateId },
    });
    return reply.send(result);
  });

  app.post("/reality-integration/live-commerce/oauth/complete", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({ stateId: z.string().min(1), code: z.string().min(1) }).parse(request.body);
    const { completeMarketplaceOAuth } = await import(
      "../live-commerce/services/oauth-lifecycle-service.js"
    );
    const result = await completeMarketplaceOAuth(body);
    auditLogger.write({
      action: "reality_integration.live_commerce.oauth.complete",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { stateId: body.stateId, providerId: result.state.providerId },
    });
    return reply.send(result);
  });

  app.post("/reality-integration/live-commerce/sync", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({
      providerId: z.string().min(1),
      syncType: z.enum(["catalog", "inventory", "pricing", "orders"]),
    }).parse(request.body);
    const { runLiveCommerceSync } = await import(
      "../live-commerce/services/live-commerce-integration-service.js"
    );
    const job = await runLiveCommerceSync({
      workspaceId: user.workspaceId,
      providerId: body.providerId,
      syncType: body.syncType,
      actor: user.email,
    });
    auditLogger.write({
      action: "reality_integration.live_commerce.sync",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { providerId: body.providerId, syncType: body.syncType, jobId: job.jobId },
    });
    return reply.send({ job });
  });

  app.post("/reality-integration/live-commerce/webhooks", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const body = z.object({
      providerId: z.string().min(1),
      topic: z.string().min(1),
      payload: z.string().min(1),
      signature: z.string().min(1),
      secret: z.string().min(1),
    }).parse(request.body);
    const { processLiveCommerceWebhook } = await import(
      "../live-commerce/services/live-commerce-integration-service.js"
    );
    const event = processLiveCommerceWebhook({
      workspaceId: user.workspaceId,
      ...body,
    });
    return reply.send({ event });
  });

  app.get("/reality-integration/live-commerce/go-live", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const { assessLiveCommerceGoLive } = await import(
      "../live-commerce/services/live-commerce-integration-service.js"
    );
    return reply.send({ assessment: assessLiveCommerceGoLive(user.workspaceId) });
  });
}
