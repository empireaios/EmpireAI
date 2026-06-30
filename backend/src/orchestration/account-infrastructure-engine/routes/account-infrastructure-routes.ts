import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import { ACCOUNT_PROVIDER_IDS } from "../models/account-provider.js";
import {
  completeAccountConnection,
  disableAccount,
  getAccountHealthSnapshot,
  getAccountProviderRegistry,
  getAccountReadiness,
  getExternalAccount,
  listExternalAccounts,
  markAccountError,
  startAccountSetup,
} from "../services/account-infrastructure-service.js";
import { formatReadinessSummaryText } from "../services/account-readiness-service.js";
import { listHumanActionQueue, markHumanActionComplete } from "../services/human-action-queue-service.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerAccountInfrastructureRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get("/account-infrastructure/registry", { preHandler: authenticate }, async (_request, reply) => {
    return reply.send({ providers: getAccountProviderRegistry() });
  });

  app.get("/account-infrastructure/accounts", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ accountType: z.enum(["grand_king", "founder"]).optional() }).parse(request.query);
    const accounts = listExternalAccounts(user.workspaceId, query.accountType ?? "grand_king");
    return reply.send({ accounts, total: accounts.length });
  });

  app.get("/account-infrastructure/accounts/:providerId", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ providerId: z.enum(ACCOUNT_PROVIDER_IDS) }).parse(request.params);
    const query = z.object({ accountType: z.enum(["grand_king", "founder"]).optional() }).parse(request.query);
    const snapshot = getAccountHealthSnapshot(user.workspaceId, params.providerId);
    return reply.send({
      account: getExternalAccount(user.workspaceId, params.providerId, query.accountType ?? "grand_king"),
      health: snapshot.health,
      pendingHumanActions: snapshot.pendingHumanActions,
    });
  });

  app.get("/account-infrastructure/readiness", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z.object({ accountType: z.enum(["grand_king", "founder"]).optional() }).parse(request.query);
    const summary = getAccountReadiness(user.workspaceId, query.accountType ?? "grand_king");
    return reply.send({
      summary,
      formatted: formatReadinessSummaryText(summary),
    });
  });

  app.get("/account-infrastructure/human-actions", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const query = z
      .object({
        providerId: z.enum(ACCOUNT_PROVIDER_IDS).optional(),
        status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "BLOCKED"]).optional(),
      })
      .parse(request.query);
    const actions = listHumanActionQueue(user.workspaceId, query);
    return reply.send({ actions, total: actions.length });
  });

  app.post("/account-infrastructure/accounts/:providerId/setup", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ providerId: z.enum(ACCOUNT_PROVIDER_IDS) }).parse(request.params);
    const account = startAccountSetup(user.workspaceId, params.providerId, user.email);
    auditLogger.write({
      action: "account_infrastructure.setup_started",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { providerId: params.providerId },
    });
    return reply.send({ account });
  });

  app.post("/account-infrastructure/accounts/:providerId/complete", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ providerId: z.enum(ACCOUNT_PROVIDER_IDS) }).parse(request.params);
    const body = z.object({ credentialsRef: z.string().min(1) }).parse(request.body);
    const account = completeAccountConnection(user.workspaceId, params.providerId, {
      credentialsRef: body.credentialsRef,
      actor: user.email,
    });
    auditLogger.write({
      action: "account_infrastructure.connect_completed",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { providerId: params.providerId },
    });
    return reply.send({ account });
  });

  app.post("/account-infrastructure/accounts/:providerId/error", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ providerId: z.enum(ACCOUNT_PROVIDER_IDS) }).parse(request.params);
    const body = z.object({ reason: z.string().min(1) }).parse(request.body);
    const account = markAccountError(user.workspaceId, params.providerId, body.reason);
    auditLogger.write({
      action: "account_infrastructure.error_marked",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { providerId: params.providerId, reason: body.reason },
    });
    return reply.send({ account });
  });

  app.post("/account-infrastructure/accounts/:providerId/disable", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ providerId: z.enum(ACCOUNT_PROVIDER_IDS) }).parse(request.params);
    const body = z.object({ reason: z.string().min(1) }).parse(request.body);
    const account = disableAccount(user.workspaceId, params.providerId, body.reason);
    auditLogger.write({
      action: "account_infrastructure.disabled",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { providerId: params.providerId, reason: body.reason },
    });
    return reply.send({ account });
  });

  app.post("/account-infrastructure/human-actions/:actionId/complete", { preHandler: authenticate }, async (request, reply) => {
    const user = request.user!;
    const params = z.object({ actionId: z.string().min(1) }).parse(request.params);
    const action = markHumanActionComplete(user.workspaceId, params.actionId, user.email);
    if (!action) {
      return reply.code(404).send({ error: "Human action not found" });
    }
    auditLogger.write({
      action: "account_infrastructure.human_action_completed",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: request.id,
      metadata: { actionId: params.actionId, providerId: action.providerId },
    });
    return reply.send({ action });
  });
}
