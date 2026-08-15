/**
 * Tier-0 isolated primary process.
 *
 * Architectural fact: synchronous sql.js `db.export()` on the Brain worker monopolises
 * the Node event loop for minutes on multi-hundred-MB databases. Auth/session/health
 * that share that loop cannot remain responsive — timers/guards only defer the outage.
 *
 * This primary process:
 * - Binds the public PORT
 * - Serves /health/live, /health/ready, and /auth/* without loading sql.js
 * - Forks the Brain worker (sql.js + Pillow + commerce) on an internal port
 * - Proxies non-Tier-0 traffic to the worker
 *
 * Grand King login/session therefore survives worker flush, stall, or restart.
 */
import { createHash } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import Fastify from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import { z } from "zod";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import {
  createRedisClient,
  probeRedisAvailable,
  shouldAllowRedisDegradedMode,
} from "../config/redis-client.js";
import {
  SessionStore,
  InMemorySessionStore,
  type SessionStoreBackend,
} from "../auth/session-store.js";
import { resolvePlatformIdentity } from "../auth/platform-identity.js";
import { createAuthMiddleware } from "../auth/middleware.js";
import { recordTier0Request } from "./tier0-control-plane.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export function tier0IsolationEnabled(): boolean {
  if (process.env.EMPIRE_ROLE === "brain-worker") return false;
  const raw = (process.env.EMPIRE_TIER0_ISOLATION ?? "true").toLowerCase();
  if (raw === "false" || raw === "0" || raw === "off") return false;
  if (raw === "force") return true;
  // Enable on Railway even if NODE_ENV is mis-set; default "true" opts in.
  const onRailway = Boolean(
    process.env.RAILWAY_ENVIRONMENT ||
      process.env.RAILWAY_ENVIRONMENT_NAME ||
      process.env.RAILWAY_DEPLOYMENT_ID,
  );
  return env.NODE_ENV === "production" || onRailway || raw === "1" || raw === "on";
}

function stableUserId(email: string): string {
  return `usr_${createHash("sha256").update(email.toLowerCase()).digest("hex").slice(0, 16)}`;
}

type SeedAccount = {
  email: string;
  password: string;
  name: string;
  role: "founder" | "admin";
  workspaceId: string;
};

function seedAccounts(): SeedAccount[] {
  return [
    {
      email: env.FOUNDER_EMAIL.toLowerCase(),
      password: env.FOUNDER_PASSWORD,
      name: "Empire Founder",
      role: "founder",
      workspaceId: "ws_empire_1",
    },
    {
      email: env.ADMIN_EMAIL.toLowerCase(),
      password: env.ADMIN_PASSWORD,
      name: "Platform Admin",
      role: "admin",
      workspaceId: "ws_empire_1",
    },
  ];
}

function authenticateSeedUser(email: string, password: string): SeedAccount | null {
  const account = seedAccounts().find((a) => a.email === email.toLowerCase());
  if (!account) return null;
  // Env plaintext is canonical for bootstrap accounts (same contract as seedDefaultUsers).
  if (password !== account.password) return null;
  return account;
}

function workerEntryPath(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../index.js");
}

type WorkerState = {
  child: ChildProcess | null;
  port: number;
  restarts: number;
  lastExitAt: number | null;
  lastExitCode: number | null;
  starting: boolean;
};

export async function startTier0IsolatedPrimary(): Promise<void> {
  const workerPort = Number(process.env.EMPIRE_BRAIN_WORKER_PORT ?? env.PORT + 1);
  const workerState: WorkerState = {
    child: null,
    port: workerPort,
    restarts: 0,
    lastExitAt: null,
    lastExitCode: null,
    starting: false,
  };

  const redisOk = await probeRedisAvailable(env.REDIS_URL);
  let sessionStore: SessionStoreBackend;
  if (redisOk) {
    sessionStore = new SessionStore(createRedisClient(env.REDIS_URL));
    logger.info("Tier-0 primary session store: Redis");
  } else {
    // Prefer available Grand King auth over hard crash if Redis flaps during incident.
    sessionStore = new InMemorySessionStore();
    logger.error(
      "Tier-0 primary Redis probe failed — using in-memory sessions so login remains possible",
    );
  }

  const app = Fastify({
    logger: false,
    requestTimeout: 120_000,
    bodyLimit: 25 * 1024 * 1024,
  });
  await app.register(cors, { origin: true, credentials: true });
  await app.register(cookie);

  const authenticate = createAuthMiddleware(sessionStore);
  const startedAt = Date.now();

  async function probeWorkerLive(timeoutMs = 2_500): Promise<{
    ok: boolean;
    ms: number;
    body: Record<string, unknown> | null;
  }> {
    const t0 = Date.now();
    try {
      const res = await fetch(`http://127.0.0.1:${workerState.port}/health/live`, {
        signal: AbortSignal.timeout(timeoutMs),
      });
      const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
      return { ok: res.ok, ms: Date.now() - t0, body };
    } catch {
      return { ok: false, ms: Date.now() - t0, body: null };
    }
  }

  app.get("/health/live", async () => {
    const started = performance.now();
    const worker = await probeWorkerLive();
    const payload = {
      status: "ok" as const,
      brain: worker.ok ? ("online" as const) : ("tier0_only" as const),
      tier0Isolation: true,
      role: "tier0-primary",
      eventLoopLagMs: 0,
      eventLoopLagSmoothedMs: 0,
      worker: {
        online: worker.ok,
        probeMs: worker.ms,
        port: workerState.port,
        restarts: workerState.restarts,
        lastExitAt: workerState.lastExitAt,
        lastExitCode: workerState.lastExitCode,
        sqlite: worker.body?.sqlite ?? null,
        disk: worker.body?.disk ?? null,
        tier0: worker.body?.tier0 ?? null,
      },
      sqlite: worker.body?.sqlite ?? {
        pending: false,
        flushCount: null,
        lastFlushMs: null,
        lastFlushDurationMs: null,
        flushInFlight: null,
        note: "worker_unreachable",
      },
      admission: worker.body?.admission ?? null,
      disk: worker.body?.disk ?? null,
      tier0: {
        isolatedPrimary: true,
        processUptimeMs: Date.now() - startedAt,
        workerOnline: worker.ok,
      },
      deploy: {
        gitCommitSha:
          process.env.RAILWAY_GIT_COMMIT_SHA ||
          process.env.RAILWAY_GIT_COMMIT ||
          null,
        serviceName: process.env.RAILWAY_SERVICE_NAME || null,
        environmentName: process.env.RAILWAY_ENVIRONMENT_NAME || null,
        deploymentId: process.env.RAILWAY_DEPLOYMENT_ID || null,
      },
    };
    recordTier0Request({
      route: "health_live",
      durationMs: performance.now() - started,
      ok: true,
    });
    return payload;
  });

  app.get("/health/ready", async (_req, reply) => {
    const worker = await probeWorkerLive(3_000);
    const payload = {
      ready: true,
      brain: worker.ok ? "online" : "tier0_only",
      process: "running",
      tier0Isolation: true,
      workerOnline: worker.ok,
      sessionStore: redisOk ? "redis" : "memory",
      checks: {
        tier0Primary: { ok: true },
        redis: { ok: redisOk || shouldAllowRedisDegradedMode() },
        brainWorker: { ok: worker.ok },
      },
    };
    // Auth succeeds on primary even if worker is down.
    return reply.send(payload);
  });

  app.post("/auth/login", async (request, reply) => {
    const t0 = performance.now();
    const parsed = loginSchema.parse(request.body);
    const email = parsed.email.trim().toLowerCase();
    const account = authenticateSeedUser(email, parsed.password);
    if (!account) {
      recordTier0Request({ route: "auth_login", durationMs: performance.now() - t0, ok: true });
      return reply.code(401).send({ error: "Invalid email or password" });
    }

    const userId = stableUserId(account.email);
    const session = await sessionStore.create({
      id: userId,
      email: account.email,
      name: account.name,
      role: account.role,
      workspaceId: account.workspaceId,
    });

    reply.setCookie("empireai_session", session.token, {
      httpOnly: true,
      secure: env.CORS_ORIGIN.startsWith("https"),
      sameSite: "lax",
      path: "/",
      maxAge: env.SESSION_TTL_SECONDS,
    });

    recordTier0Request({ route: "auth_login", durationMs: performance.now() - t0, ok: true });
    return reply.send({
      user: {
        id: userId,
        email: account.email,
        name: account.name,
        role: account.role,
        workspaceId: account.workspaceId,
        platformIdentity: resolvePlatformIdentity(account.email, account.role),
      },
      expiresAt: session.expiresAt,
      tier0Isolation: true,
    });
  });

  app.post("/auth/logout", async (request, reply) => {
    const t0 = performance.now();
    const header = request.headers.authorization;
    const cookieToken = (request.cookies as Record<string, string | undefined>)?.empireai_session;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : cookieToken;
    if (token) await sessionStore.destroy(token);
    reply.clearCookie("empireai_session", {
      path: "/",
      httpOnly: true,
      secure: env.CORS_ORIGIN.startsWith("https"),
      sameSite: "lax",
    });
    recordTier0Request({ route: "auth_logout", durationMs: performance.now() - t0, ok: true });
    return reply.send({ ok: true, tier0Isolation: true });
  });

  app.get("/auth/me", { preHandler: authenticate }, async (request, reply) => {
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

  app.post("/auth/refresh", { preHandler: authenticate }, async (request, reply) => {
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

  app.setNotFoundHandler(async (request, reply) => {
    const urlPath = request.url.split("?")[0] ?? "";
    if (urlPath.startsWith("/auth/") || urlPath === "/health/live" || urlPath === "/health/ready") {
      return reply.code(404).send({ error: "not_found" });
    }
    // CORS preflight is handled by @fastify/cors — never proxy OPTIONS to the worker.
    if (request.method === "OPTIONS") {
      return reply.code(204).send();
    }

    const isPillowChat =
      request.method === "POST" &&
      (urlPath === "/api/pillow/chat" || urlPath.endsWith("/pillow/chat"));

    let worker = await probeWorkerLive(1_500);
    if (!worker.ok && isPillowChat) {
      for (let i = 0; i < 3 && !worker.ok; i++) {
        await new Promise((r) => setTimeout(r, 1_500));
        worker = await probeWorkerLive(2_000);
      }
    }

    if (!worker.ok) {
      if (isPillowChat) {
        return reply.code(200).send({
          result: {
            message: [
              "I received your executive request and the deep reasoning worker is temporarily restarting.",
              "You do not need to resubmit — I am answering from standing verified posture now.",
              "Birth remains unauthorised (timestamp null). Realised commerce and product focus must be read from live commissioning state before strong claims.",
            ].join(" "),
            kind: "degraded_useful",
            tier0Isolation: true,
            workerOnline: false,
          },
        });
      }
      return reply.code(503).send({
        error: "Brain worker temporarily unavailable",
        code: "BRAIN_WORKER_UNAVAILABLE",
        tier0Isolation: true,
        retryable: true,
      });
    }

    const target = `http://127.0.0.1:${workerState.port}${request.url}`;
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(request.headers)) {
      if (v == null) continue;
      if (k === "host" || k === "connection" || k === "content-length") continue;
      headers[k] = Array.isArray(v) ? v.join(",") : String(v);
    }

    try {
      const init: RequestInit = {
        method: request.method,
        headers,
        signal: AbortSignal.timeout(120_000),
      };
      if (request.method !== "GET" && request.method !== "HEAD") {
        if (request.body !== undefined && request.body !== null) {
          init.body =
            typeof request.body === "string" || Buffer.isBuffer(request.body)
              ? (request.body as string | Buffer)
              : JSON.stringify(request.body);
          headers["content-type"] = headers["content-type"] ?? "application/json";
          init.headers = headers;
        }
      }

      const upstream = await fetch(target, init);
      const buf = Buffer.from(await upstream.arrayBuffer());
      if (isPillowChat && upstream.status >= 500) {
        return reply.code(200).send({
          result: {
            message: [
              "I received your request; the reasoning worker returned a transient fault.",
              "You do not need to resubmit. Birth remains unauthorised.",
              "I can continue from verified operating state — ask which part to deepen next.",
            ].join(" "),
            kind: "degraded_useful",
            tier0Isolation: true,
            upstreamStatus: upstream.status,
          },
        });
      }
      const skip = new Set(["transfer-encoding", "connection", "content-encoding"]);
      upstream.headers.forEach((value, key) => {
        if (!skip.has(key.toLowerCase())) reply.header(key, value);
      });
      return reply.code(upstream.status).send(buf);
    } catch (error) {
      logger.warn({ err: error, url: request.url }, "Tier-0 primary proxy to worker failed");
      if (isPillowChat) {
        return reply.code(200).send({
          result: {
            message: [
              "I received your executive request; the worker proxy timed out or failed transiently.",
              "You do not need to resubmit. Birth remains unauthorised.",
              "Continuing from verified posture — tell me which theme to deepen.",
            ].join(" "),
            kind: "degraded_useful",
            tier0Isolation: true,
          },
        });
      }
      return reply.code(503).send({
        error: "Brain worker proxy failed",
        code: "BRAIN_WORKER_PROXY_FAILED",
        tier0Isolation: true,
        retryable: true,
      });
    }
  });

  function spawnWorker(): void {
    if (workerState.starting || workerState.child) return;
    workerState.starting = true;
    const childEnv = {
      ...process.env,
      EMPIRE_ROLE: "brain-worker",
      EMPIRE_TIER0_ISOLATION: "false",
      PORT: String(workerState.port),
      HOST: "127.0.0.1",
    };
    try {
      const child = spawn(process.execPath, [workerEntryPath()], {
        env: childEnv,
        stdio: "inherit",
        detached: false,
      });
      workerState.child = child;
      logger.info(
        { workerPort: workerState.port, pid: child.pid },
        "Tier-0 primary spawned Brain worker",
      );

      child.on("exit", (code, signal) => {
        workerState.child = null;
        workerState.starting = false;
        workerState.restarts += 1;
        workerState.lastExitAt = Date.now();
        workerState.lastExitCode = code;
        logger.error(
          { code, signal, restarts: workerState.restarts },
          "Brain worker exited — Tier-0 primary remains up; respawning worker",
        );
        const delay = Math.min(30_000, 2_000 * Math.max(1, workerState.restarts));
        setTimeout(() => spawnWorker(), delay);
      });

      child.on("error", (error) => {
        workerState.child = null;
        workerState.starting = false;
        logger.error({ err: error }, "Brain worker spawn error");
        setTimeout(() => spawnWorker(), 5_000);
      });

      child.on("spawn", () => {
        workerState.starting = false;
      });
    } catch (error) {
      workerState.starting = false;
      logger.error({ err: error }, "Brain worker spawn threw");
      setTimeout(() => spawnWorker(), 5_000);
    }
  }

  await app.listen({ port: env.PORT, host: env.HOST });
  logger.info(
    { port: env.PORT, workerPort: workerState.port },
    "Tier-0 isolated primary listening (auth/health independent of sql.js worker)",
  );

  // Spawn heavy sql.js worker AFTER public Tier-0 is accepting traffic so
  // Railway healthchecks and Grand King auth survive worker boot/OOM/flush.
  setTimeout(() => spawnWorker(), Number(process.env.EMPIRE_BRAIN_WORKER_SPAWN_DELAY_MS ?? 1_500));
}
