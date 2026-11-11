// Exact compiled native Tier0 registrations, mechanically extracted; no handler changes.
import {env} from '/app/backend/dist/config/env.js';
import {recordTier0Request} from '/app/backend/dist/runtime/tier0-control-plane.js';
import {resolvePlatformIdentity} from '/app/backend/dist/auth/platform-identity.js';
export function registerExactNativeTier0SessionRoutes(app,sessionStore,requireSharedSessionStore,authenticate){
    app.post("/auth/logout", async (request, reply) => {
        const t0 = performance.now();
        const header = request.headers.authorization;
        const cookieToken = request.cookies?.empireai_session;
        const token = header?.startsWith("Bearer ") ? header.slice(7) : cookieToken;
        if (token)
            await sessionStore.destroy(token);
        reply.clearCookie("empireai_session", {
            path: "/",
            httpOnly: true,
            secure: env.CORS_ORIGIN.startsWith("https"),
            sameSite: "lax",
        });
        recordTier0Request({ route: "auth_logout", durationMs: performance.now() - t0, ok: true });
        return reply.send({ ok: true, tier0Isolation: true });
    });
    app.get("/auth/me", { preHandler: [requireSharedSessionStore, authenticate] }, async (request, reply) => {
        const t0 = performance.now();
        if (!request.user) {
            recordTier0Request({ route: "auth_me", durationMs: performance.now() - t0, ok: true });
            return reply.code(401).send({ error: "Authentication required" });
        }
        recordTier0Request({ route: "auth_me", durationMs: performance.now() - t0, ok: true });
        return {
            user: {
                ...request.user,
                platformIdentity: resolvePlatformIdentity(request.user.email, request.user.role),
            },
            tier0Isolation: true,
        };
    });
    app.post("/auth/refresh", {
        preHandler: [requireSharedSessionStore, authenticate],
    }, async (request, reply) => {
        const t0 = performance.now();
        if (!request.sessionToken || !request.user) {
            recordTier0Request({ route: "auth_refresh", durationMs: performance.now() - t0, ok: true });
            return reply.code(401).send({ error: "Authentication required" });
        }
        const session = await sessionStore.refresh(request.sessionToken);
        if (!session) {
            recordTier0Request({ route: "auth_refresh", durationMs: performance.now() - t0, ok: true });
            return reply.code(401).send({ error: "Session expired" });
        }
        reply.setCookie("empireai_session", session.token, {
            httpOnly: true,
            secure: env.CORS_ORIGIN.startsWith("https"),
            sameSite: "lax",
            path: "/",
            maxAge: env.SESSION_TTL_SECONDS,
        });
        recordTier0Request({ route: "auth_refresh", durationMs: performance.now() - t0, ok: true });
        return reply.send({
            user: request.user,
            expiresAt: session.expiresAt,
            tier0Isolation: true,
        });
    });
}
