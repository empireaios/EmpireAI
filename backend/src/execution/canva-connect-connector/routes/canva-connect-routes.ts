import type { FastifyInstance } from "fastify";
import { z } from "zod";

import type { AuditLogger } from "../../../brain/audit/audit-logger.js";
import type { createAuthMiddleware } from "../../../auth/middleware.js";
import {
  disconnectCanvaAccount,
  exchangeCanvaOAuthCode,
  getCanvaHealthStatus,
  getCanvaOAuthStatus,
  getCanvaOAuthUrl,
} from "../services/canva-oauth-service.js";
import { parseOAuthState } from "../services/pkce.js";

type AuthMiddleware = ReturnType<typeof createAuthMiddleware>;

export async function registerCanvaConnectRoutes(
  app: FastifyInstance,
  deps: { authenticate: AuthMiddleware; auditLogger: AuditLogger },
): Promise<void> {
  const { authenticate, auditLogger } = deps;

  app.get(
    "/canva/oauth/url",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
      const result = getCanvaOAuthUrl({
        workspaceId: user.workspaceId,
        companyId: query.companyId,
      });
      return reply.send(result);
    },
  );

  app.get(
    "/canva/oauth/callback",
    async (request, reply) => {
      const query = z
        .object({
          code: z.string().min(1).optional(),
          state: z.string().min(1).optional(),
          error: z.string().optional(),
          error_description: z.string().optional(),
        })
        .parse(request.query);

      if (query.error) {
        return reply.code(400).send({
          error: query.error_description ?? query.error,
        });
      }
      if (!query.code || !query.state) {
        return reply.code(400).send({ error: "Missing OAuth code or state" });
      }

      const parsed = parseOAuthState(query.state);
      if (!parsed) {
        return reply.code(400).send({ error: "Invalid OAuth state" });
      }

      const connection = await exchangeCanvaOAuthCode({
        workspaceId: parsed.workspaceId,
        companyId: parsed.companyId,
        code: query.code,
        state: query.state,
      });

      auditLogger.write({
        action: "canva.oauth_connected",
        actor: "grand-king",
        workspaceId: parsed.workspaceId,
        companyId: parsed.companyId,
        correlationId: request.id,
        metadata: { mock: connection.mock, connectionId: connection.connectionId },
      });

      return reply.send({
        connected: true,
        mock: connection.mock,
        connectionId: connection.connectionId,
      });
    },
  );

  app.post(
    "/canva/oauth/exchange",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const body = z
        .object({
          companyId: z.string().min(1),
          code: z.string().min(1),
          state: z.string().min(1),
        })
        .parse(request.body);

      const connection = await exchangeCanvaOAuthCode({
        workspaceId: user.workspaceId,
        companyId: body.companyId,
        code: body.code,
        state: body.state,
      });

      auditLogger.write({
        action: "canva.oauth_connected",
        actor: user.email,
        workspaceId: user.workspaceId,
        companyId: body.companyId,
        correlationId: request.id,
        metadata: { mock: connection.mock },
      });

      return reply.send({
        connection: {
          connectionId: connection.connectionId,
          mock: connection.mock,
          scopes: connection.scopes,
        },
      });
    },
  );

  app.get(
    "/canva/oauth/status",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
      const connection = getCanvaOAuthStatus(user.workspaceId, query.companyId);
      return reply.send({
        connected: Boolean(connection),
        mock: connection?.mock ?? false,
        scopes: connection?.scopes ?? [],
      });
    },
  );

  app.post(
    "/canva/oauth/disconnect",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const body = z.object({ companyId: z.string().min(1) }).parse(request.body);
      await disconnectCanvaAccount({
        workspaceId: user.workspaceId,
        companyId: body.companyId,
      });

      auditLogger.write({
        action: "canva.oauth_disconnected",
        actor: user.email,
        workspaceId: user.workspaceId,
        companyId: body.companyId,
        correlationId: request.id,
        metadata: {},
      });

      return reply.send({ disconnected: true });
    },
  );

  app.get(
    "/canva/health",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = request.user!;
      const query = z.object({ companyId: z.string().min(1) }).parse(request.query);
      const health = await getCanvaHealthStatus(user.workspaceId, query.companyId);
      return reply.send({ health });
    },
  );
}
