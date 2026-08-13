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
import { recordTier0Request, type Tier0Route } from "../runtime/tier0-control-plane.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function tier0RouteFromUrl(url: string): Tier0Route {
  if (url.startsWith("/auth/login")) return "auth_login";
  if (url.startsWith("/auth/logout")) return "auth_logout";
  if (url.startsWith("/auth/me")) return "auth_me";
  if (url.startsWith("/auth/refresh")) return "auth_refresh";
  return "other_tier0";
}

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

  app.addHook("onResponse", async (request, reply) => {
    const path = request.url.split("?")[0] ?? "";
    if (!path.startsWith("/auth/")) return;
    const elapsed =
      typeof reply.elapsedTime === "number" ? reply.elapsedTime : 0;
    // Treat only 5xx as Tier-0 outages; 401 invalid/stale is structurally healthy.
    recordTier0Request({
      route: tier0RouteFromUrl(path),
      durationMs: elapsed,
      ok: reply.statusCode < 500,
    });
  });

  app.post("/auth/login", async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const email = body.email.trim().toLowerCase();
    const password = body.password;
    const user = users.findByEmail(email);

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      auditLogger.write({
        action: "auth.failed",
        actor: email,
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

  app.post("/auth/logout", async (request, reply) => {
    const header = request.headers.authorization;
    const cookieToken = (request.cookies as Record<string, string | undefined>)
      ?.empireai_session;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : cookieToken;

    if (token) {
      const session = await sessionStore.get(token);
      if (session) {
        await sessionStore.destroy(token);
        auditLogger.write({
          action: "auth.logout",
          actor: session.email,
          workspaceId: session.workspaceId,
          correlationId: `auth:${Date.now()}`,
          metadata: { userId: session.id },
        });
      }
    }

    reply.clearCookie("empireai_session", {
      path: "/",
      httpOnly: true,
      secure: env.CORS_ORIGIN.startsWith("https"),
      sameSite: "lax",
    });
    return reply.send({ ok: true });
  });

  app.get("/auth/me", { preHandler: authenticate }, async (request, reply) => {
    if (!request.user) {
      return reply.code(401).send({ error: "Authentication required" });
    }

    const user = request.user;
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
