import type { FastifyReply, FastifyRequest } from "fastify";
import { logger } from "../config/logger.js";
import { canAccessModule, type SessionUser } from "./permissions.js";
import type { SessionStoreBackend } from "./session-store.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: SessionUser;
    sessionToken?: string;
  }
}

export function createAuthMiddleware(sessionStore: SessionStoreBackend) {
  return async function authenticate(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const header = request.headers.authorization;
    const cookieToken = (request.cookies as Record<string, string | undefined>)
      ?.empireai_session;
    const token = header?.startsWith("Bearer ")
      ? header.slice(7)
      : cookieToken;

    if (!token) {
      return reply.code(401).send({ error: "Authentication required" });
    }

    let session;
    try {
      session = await sessionStore.get(token);
    } catch (error) {
      logger.error(
        { err: error instanceof Error ? error : new Error(String(error)) },
        "Session lookup failed",
      );
      return reply.code(503).send({ error: "Session store unavailable" });
    }

    if (!session) {
      return reply.code(401).send({ error: "Invalid or expired session" });
    }

    request.user = {
      id: session.id,
      email: session.email,
      name: session.name,
      role: session.role,
      workspaceId: session.workspaceId,
    };
    request.sessionToken = token;
  };
}

export function requireModuleAccess(module: string) {
  return async function authorizeModule(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    if (!request.user) {
      return reply.code(401).send({ error: "Authentication required" });
    }

    if (!canAccessModule(request.user.role, module)) {
      return reply.code(403).send({ error: `Access denied for module: ${module}` });
    }
  };
}
