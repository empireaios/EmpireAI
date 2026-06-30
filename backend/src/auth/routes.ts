import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { logger } from "../config/logger.js";
import { env } from "../config/env.js";
import type { AuditLogger } from "../brain/audit/audit-logger.js";
import { createAuthMiddleware } from "./middleware.js";
import { type SessionStoreBackend, UserStore } from "./session-store.js";
import { verifyPassword } from "./seed-users.js";
import { resolvePlatformIdentity } from "./platform-identity.js";
import { getDatabase } from "../brain/database.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function registerAuthRoutes(
  app: FastifyInstance,
  deps: {
    sessionStore: SessionStoreBackend;
    auditLogger: AuditLogger;
  },
): Promise<void> {
  const { sessionStore, auditLogger } = deps;
  const users = new UserStore(getDatabase());
  const authenticate = createAuthMiddleware(sessionStore);

  app.post("/auth/login", async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const user = users.findByEmail(body.email);

    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      auditLogger.write({
        action: "auth.failed",
        actor: body.email,
        workspaceId: "unknown",
        correlationId: `auth:${Date.now()}`,
        metadata: { reason: "invalid_credentials" },
      });
      return reply.code(401).send({ error: "Invalid email or password" });
    }

    const session = await sessionStore.create({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      workspaceId: user.workspaceId,
    });

    auditLogger.write({
      action: "auth.login",
      actor: user.email,
      workspaceId: user.workspaceId,
      correlationId: `auth:${session.token.slice(0, 8)}`,
      metadata: { userId: user.id, role: user.role },
    });

    reply.setCookie("empireai_session", session.token, {
      httpOnly: true,
      secure: env.CORS_ORIGIN.startsWith("https"),
      sameSite: "lax",
      path: "/",
      maxAge: env.SESSION_TTL_SECONDS,
    });

    return reply.send({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        workspaceId: user.workspaceId,
        platformIdentity: resolvePlatformIdentity(user.email, user.role),
      },
      expiresAt: session.expiresAt,
    });
  });

  app.post("/auth/logout", { preHandler: authenticate }, async (request, reply) => {
    if (request.sessionToken) {
      await sessionStore.destroy(request.sessionToken);
      auditLogger.write({
        action: "auth.logout",
        actor: request.user!.email,
        workspaceId: request.user!.workspaceId,
        correlationId: `auth:${Date.now()}`,
        metadata: { userId: request.user!.id },
      });
    }

    reply.clearCookie("empireai_session", { path: "/" });
    return reply.send({ ok: true });
  });

  app.get("/auth/me", { preHandler: authenticate }, async (request) => {
    const user = request.user!;
    return {
      user: {
        ...user,
        platformIdentity: resolvePlatformIdentity(user.email, user.role),
      },
    };
  });

  app.post("/auth/refresh", { preHandler: authenticate }, async (request, reply) => {
    if (!request.sessionToken || !request.user) {
      return reply.code(401).send({ error: "Authentication required" });
    }

    const session = await sessionStore.refresh(request.sessionToken);
    if (!session) {
      return reply.code(401).send({ error: "Session expired" });
    }

    reply.setCookie("empireai_session", session.token, {
      httpOnly: true,
      secure: env.CORS_ORIGIN.startsWith("https"),
      sameSite: "lax",
      path: "/",
      maxAge: env.SESSION_TTL_SECONDS,
    });

    return reply.send({
      user: request.user,
      expiresAt: session.expiresAt,
    });
  });

  logger.info("Auth routes registered");
}
