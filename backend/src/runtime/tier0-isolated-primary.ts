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
import Fastify, {
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
} from "fastify";
import cors from "@fastify/cors";
import cookie from "@fastify/cookie";
import { z } from "zod";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { createTier0RedisClient } from "./tier0-redis.js";
import {
  SessionStore,
  SessionStoreUnavailableError,
  type SessionStoreBackend,
} from "../auth/session-store.js";
import { resolvePlatformIdentity } from "../auth/platform-identity.js";
import { createAuthMiddleware } from "../auth/middleware.js";
import { requireSafeBootstrapCredentials, UnsafeBootstrapCredentialsError } from "../auth/bootstrap-credential-policy.js";
import { recordTier0Request } from "./tier0-control-plane.js";
import {
  extractChatMessagePreview,
  type PillowProxyAttemptResult,
} from "./pillow-accepted-request-recovery.js";
import {
  listDeliveryForensics,
  searchDeliveryForensics,
} from "./pillow-delivery-forensics.js";
import {
  acceptDurableChatRequestClaim,
  admitChatRequestBody,
  configureChatRequestStore,
  durabilityMeta,
  getChatRequest,
  listRecentChatRequests,
  markChatRequestDelivered,
  PillowDurableStoreUnavailableError,
  PillowIdempotencyConflictError,
  type DurableChatRequest,
} from "./pillow-chat-request-store.js";
import { startDurableReasoningSweeper } from "./pillow-durable-reasoning-worker.js";
import {
  buildTier0ApplicationReadiness,
  probeRedisSessionStore,
} from "./application-readiness.js";

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
  requireSafeBootstrapCredentials({
    production: env.NODE_ENV === "production" || Boolean(
      process.env.RAILWAY_DEPLOYMENT_ID || process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_ENVIRONMENT_NAME),
    founderPassword: env.FOUNDER_PASSWORD,
    adminPassword: env.ADMIN_PASSWORD,
  });
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

export type Tier0WorkerProbeResult = {
  ok: boolean;
  reachable: boolean;
  ms: number;
  body: Record<string, unknown> | null;
};

export type Tier0ReadinessRouteDependencies = {
  probeWorkerReady: (timeoutMs?: number) => Promise<Tier0WorkerProbeResult>;
  probePrimarySessionStore: (timeoutMs?: number) => Promise<boolean>;
  sessionStoreMode: "redis" | "memory";
};

export const TIER0_SHARED_SESSION_UNAVAILABLE = {
  error: "Shared session store temporarily unavailable",
  code: "SHARED_SESSION_STORE_UNAVAILABLE",
  tier0Isolation: true,
  retryable: true,
} as const;

export const TIER0_PILLOW_DURABILITY_UNAVAILABLE = {
  error: "Pillow durable request store temporarily unavailable",
  code: "PILLOW_DURABILITY_UNAVAILABLE",
  tier0Isolation: true,
  retryable: true,
} as const;

export const TIER0_PILLOW_STREAM_DURABILITY_REQUIRED = {
  error: "Streaming chat is disabled on the durable Tier-0 path; use /api/pillow/chat",
  code: "PILLOW_STREAM_DURABILITY_REQUIRED",
  tier0Isolation: true,
  retryable: false,
} as const;

export function classifyTier0PillowPath(url: string): "chat" | "stream" | "reject" | "other" {
  const raw = url.split("?")[0] ?? "";
  if (raw === "/api/pillow/chat") return "chat";
  if (raw === "/api/pillow/chat/stream") return "stream";
  let decoded = raw;
  try {
    for (let i = 0; i < 4 && decoded.includes("%"); i++) {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    }
  } catch { return "reject"; }
  // Fastify decodes static paths. Encoded/alternate chat routes must never fall
  // through to the ordinary action-capable Brain proxy.
  const normalized = path.posix.normalize(decoded).replace(/\/+$/, "");
  return /(?:^|\/)pillow\/chat(?:\/stream)?$/i.test(normalized) ? "reject" : "other";
}

export function createSharedSessionStoreGuard(
  probeSharedSessionStore: () => Promise<boolean>,
) {
  return async (_request: FastifyRequest, reply: FastifyReply) => {
    if (!(await probeSharedSessionStore())) {
      return reply.code(503).send(TIER0_SHARED_SESSION_UNAVAILABLE);
    }
  };
}

export function registerTier0DurabilityErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof UnsafeBootstrapCredentialsError) {
      return reply.code(503).send({ error: "Authentication configuration unavailable", code: "BOOTSTRAP_CREDENTIALS_UNSAFE", retryable: false });
    }
    if (error instanceof SessionStoreUnavailableError) {
      return reply.code(503).send(TIER0_SHARED_SESSION_UNAVAILABLE);
    }
    if (error instanceof PillowIdempotencyConflictError) {
      return reply.code(409).send({ code: "PILLOW_IDEMPOTENCY_CONFLICT", retryable: false });
    }
    if (error instanceof PillowDurableStoreUnavailableError) {
      return reply.code(503).send({
        ...TIER0_PILLOW_DURABILITY_UNAVAILABLE,
        resultRetrievable: false,
      });
    }
    return reply.send(error);
  });
}

/** Status and diagnostics are private, and must never cross owner/workspace boundaries. */
export function registerTier0DurableReadRoutes(
  app: FastifyInstance,
  authenticate: ReturnType<typeof createAuthMiddleware>,
): void {
  const authorized = async (request: FastifyRequest, reply: FastifyReply) => {
    await authenticate(request, reply);
    if (reply.sent) return;
    if (!request.user || !["founder", "admin"].includes(request.user.role)) {
      return reply.code(403).send({ error: "Founder access required for Pillow" });
    }
  };
  const owns = (request: FastifyRequest, rec: DurableChatRequest | null) => Boolean(
    request.user && rec?.ownerId === request.user.id && rec.workspaceId === request.user.workspaceId,
  );
  app.get("/api/pillow/chat-request/:requestId", { preHandler: authorized }, async (request, reply) => {
    const requestId = String((request.params as { requestId?: string }).requestId ?? "");
    const rec = await getChatRequest(requestId);
    if (!rec || !owns(request, rec)) return reply.code(404).send({ ok: false, error: "request_not_found", requestId });
    if (rec.status === "COMPLETED") await markChatRequestDelivered(requestId, "RETRIEVED");
    return reply.send({ ok: true, request: rec, durability: durabilityMeta() });
  });
  app.get("/api/pillow/chat-requests", { preHandler: authorized }, async (request, reply) => {
    const limit = Math.max(1, Math.min(100, Number((request.query as { limit?: string })?.limit) || 40));
    const rows = listRecentChatRequests(500).filter((rec) => owns(request, rec)).slice(0, limit);
    return reply.send({ ok: true, rows, durability: durabilityMeta(), scope: "process_local_recent_cache" });
  });
  app.get("/api/pillow/delivery-forensics", { preHandler: authorized }, async (request, reply) => {
    const q = String((request.query as { q?: string })?.q ?? "").trim();
    const candidates = q ? searchDeliveryForensics(q) : listDeliveryForensics(100);
    const visible = await Promise.all(candidates.map(async (row) =>
      row.requestId && owns(request, await getChatRequest(row.requestId)) ? row : null));
    return reply.send({ ok: true, rows: visible.filter(Boolean) });
  });
}

export function buildTier0ReadinessResult(input: {
  workerReady: boolean;
  primarySessionStoreReady: boolean;
}) {
  const readiness = buildTier0ApplicationReadiness(input);
  return {
    ...readiness,
    redisReady: input.primarySessionStoreReady,
  } as const;
}

export function registerTier0ReadinessRoute(
  app: FastifyInstance,
  dependencies: Tier0ReadinessRouteDependencies,
): void {
  app.get("/health/ready", async (_req, reply) => {
    const [worker, redisPingReady] = await Promise.all([
      dependencies.probeWorkerReady(5_000),
      dependencies.probePrimarySessionStore(1_500),
    ]);
    const workerPillow =
      worker.body?.pillow && typeof worker.body.pillow === "object"
        ? (worker.body.pillow as Record<string, unknown>)
        : null;
    const workerPillowReady =
      workerPillow?.enabled === true &&
      workerPillow.ready === true &&
      workerPillow.lifecycle === "running";
    const workerReady = worker.ok && workerPillowReady;
    const primarySessionStoreReady =
      dependencies.sessionStoreMode === "redis" && redisPingReady;
    const readiness = buildTier0ReadinessResult({
      workerReady,
      primarySessionStoreReady,
    });
    const payload = {
      ready: readiness.ready,
      brain: workerReady ? "online" : "tier0_only",
      process: "running",
      tier0Isolation: true,
      workerOnline: worker.reachable,
      workerReady,
      sessionStore: dependencies.sessionStoreMode,
      pillow: workerPillow,
      checks: {
        tier0Primary: { ok: true },
        redis: { ok: readiness.redisReady, ping: redisPingReady },
        brainWorker: { ok: worker.reachable },
        brainWorkerReady: { ok: workerReady },
        pillow: { ok: workerPillowReady },
      },
    };
    return reply.code(readiness.statusCode).send(payload);
  });
}

/** One availability probe followed by, at most, one upstream request. */
export async function runSingleWorkerProxyAttempt(
  probeWorker: () => Promise<boolean>,
  forwardRequest: () => Promise<PillowProxyAttemptResult>,
): Promise<PillowProxyAttemptResult> {
  if (!(await probeWorker())) {
    return { ok: false, reason: "worker_unavailable" };
  }
  return forwardRequest();
}

export function buildTier0ProxyFailure(reason: string) {
  if (reason === "worker_unavailable") {
    return {
      error: "Brain worker temporarily unavailable",
      code: "BRAIN_WORKER_UNAVAILABLE",
      tier0Isolation: true,
      retryable: true,
    } as const;
  }
  return {
    error: "Brain worker proxy failed",
    code: "BRAIN_WORKER_PROXY_FAILED",
    tier0Isolation: true,
    retryable: true,
  } as const;
}

export async function handleDurablePillowChat(
  request: FastifyRequest,
  reply: FastifyReply,
  dependencies: { authenticate: ReturnType<typeof createAuthMiddleware>; probeSharedSessionStore: () => Promise<boolean> },
) {
  await dependencies.authenticate(request, reply);
  if (reply.sent) return;
  if (!request.user || !["founder", "admin"].includes(request.user.role)) {
    return reply.code(403).send({ error: "Founder access required for Pillow" });
  }
  if (!(await dependencies.probeSharedSessionStore())) {
    return reply.code(503).send(TIER0_PILLOW_DURABILITY_UNAVAILABLE);
  }
  const admitted = admitChatRequestBody(typeof request.body === "string" || Buffer.isBuffer(request.body) ? request.body : JSON.stringify(request.body ?? {}));
  let input: Record<string, unknown>;
  try {
    const validated = z.object({
      message: z.string().trim().min(1).max(100_000),
      sessionId: z.string().min(1).max(200),
      workspaceId: z.string().min(1).max(200).optional(),
      provider: z.enum(["openai", "anthropic", "gemini"]).optional(),
      workspaceContext: z.record(z.unknown()).optional(),
    }).safeParse(JSON.parse(admitted.bodyText || "{}"));
    if (!validated.success) return reply.code(400).send({ code: "PILLOW_INVALID_CHAT_INPUT" });
    input = validated.data;
  } catch {
    return reply.code(400).send({ code: "PILLOW_INVALID_CHAT_INPUT" });
  }
  // Queue authority is deliberately narrower than the worker's optional admin override.
  if (input.workspaceId && input.workspaceId !== request.user.workspaceId) {
    return reply.code(403).send({ error: "Workspace access denied" });
  }
  input.workspaceId = request.user.workspaceId;
  const claim = await acceptDurableChatRequestClaim({
    sessionId: String(input.sessionId),
    message: String(input.message),
    idempotencyKey: typeof request.headers["idempotency-key"] === "string"
      ? request.headers["idempotency-key"] : undefined,
    deploymentId: process.env.RAILWAY_DEPLOYMENT_ID || null,
    contextAdmission: admitted.contextAdmission,
    ownerId: request.user.id,
    workspaceId: request.user.workspaceId,
    input: { kind: "reasoning", bodyText: JSON.stringify(input), sessionToken: request.sessionToken! },
  });
  const durable = claim.request;
  reply.header("x-empire-pillow-request-id", durable.requestId);
  reply.header("x-empire-chat-request-status", durable.status);
  if (claim.disposition === "EXISTING_COMPLETED") {
    return reply.code(200).send({ result: durable.finalResult ?? durable.brainResult });
  }
  if (claim.disposition === "EXISTING_FAILED") {
    return reply.code(200).send({ result: {
      message: "This request could not be completed after bounded recovery. Its failure is retained for review.",
      kind: "terminal_infrastructure", requestId: durable.requestId, durableRequestId: durable.requestId,
      status: "FAILED_FATAL", failureClass: durable.failureClass, recoveryExhausted: true,
      requestRemainsRunning: false, userResubmissionRequired: false, durableRequest: true,
      resultRetrievable: false,
    } });
  }
  // Redis contains both full recovery input and an indexed job before this receipt.
  // The independent sweeper, not this HTTP request or its socket, owns execution.
  reply.header("retry-after", "2");
  return reply.code(202).send({ result: {
    message: "PILLOW_RESULT_PENDING: requestId=" + durable.requestId +
      "\nYour request is queued. This receipt is not the completed answer.",
    kind: "durable_pending", requestId: durable.requestId, durableRequestId: durable.requestId,
    status: durable.status, requestRemainsRunning: true, userResubmissionRequired: false,
    durableRequest: true, resultRetrievable: true, brainCompleted: false,
    contextAdmission: admitted.contextAdmission,
  } });
}

export function registerTier0LoginRoute(
  app: FastifyInstance,
  sessionStore: SessionStoreBackend,
  requireSharedSessionStore: ReturnType<typeof createSharedSessionStoreGuard>,
): void {
  app.post("/auth/login", { preHandler: requireSharedSessionStore }, async (request, reply) => {
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

}

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

  const redisClient = createTier0RedisClient(env.REDIS_URL);
  const sessionStore: SessionStoreBackend = new SessionStore(redisClient);
  configureChatRequestStore(redisClient, { requireRedisDurability: true });
  logger.info("Tier-0 primary binds shared Redis; unavailable commands fail closed while connection recovers");

  const app = Fastify({
    logger: false,
    // Must exceed pillow chat recovery budget (260s) + BFF headroom so Fastify
    // does not kill mid-retry. Aligned with PILLOW_CHAT_TIMEOUTS.frontendChatMs.
    requestTimeout: 300_000,
    bodyLimit: 25 * 1024 * 1024,
  });
  await app.register(cors, { origin: true, credentials: true });
  await app.register(cookie);
  registerTier0DurabilityErrorHandler(app);

  const authenticate = createAuthMiddleware(sessionStore);
  const startedAt = Date.now();

  async function probeWorkerEndpoint(
    endpoint: "/health/live" | "/health/ready",
    timeoutMs: number,
  ): Promise<Tier0WorkerProbeResult> {
    const t0 = Date.now();
    try {
      const res = await fetch(`http://127.0.0.1:${workerState.port}${endpoint}`, {
        signal: AbortSignal.timeout(timeoutMs),
      });
      const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
      const pillow =
        body?.pillow && typeof body.pillow === "object"
          ? (body.pillow as Record<string, unknown>)
          : null;
      const responseReady =
        endpoint === "/health/live" ||
        (body?.ready === true &&
          pillow?.enabled === true &&
          pillow.ready === true &&
          pillow.lifecycle === "running");
      return {
        ok: res.ok && responseReady,
        reachable: true,
        ms: Date.now() - t0,
        body,
      };
    } catch {
      return { ok: false, reachable: false, ms: Date.now() - t0, body: null };
    }
  }

  const probeWorkerLive = (timeoutMs = 2_500) =>
    probeWorkerEndpoint("/health/live", timeoutMs);
  const probeWorkerReady = (timeoutMs = 5_000) =>
    probeWorkerEndpoint("/health/ready", timeoutMs);

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

  const sessionStoreMode = "redis" as const;
  const probeSharedSessionStore = async (timeoutMs = 1_500): Promise<boolean> =>
    sessionStoreMode === "redis" &&
    (await probeRedisSessionStore(redisClient, timeoutMs));

  registerTier0ReadinessRoute(app, {
    probeWorkerReady,
    probePrimarySessionStore: probeSharedSessionStore,
    sessionStoreMode,
  });

  const requireSharedSessionStore = createSharedSessionStoreGuard(() =>
    probeSharedSessionStore(),
  );

  registerTier0DurableReadRoutes(app, authenticate);

  registerTier0LoginRoute(app, sessionStore, requireSharedSessionStore);

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

  app.get(
    "/auth/me",
    { preHandler: [requireSharedSessionStore, authenticate] },
    async (request, reply) => {
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
    },
  );

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

  app.setNotFoundHandler(async (request, reply) => {
    const urlPath = request.url.split("?")[0] ?? "";
    if (urlPath.startsWith("/auth/") || urlPath === "/health/live" || urlPath === "/health/ready") {
      return reply.code(404).send({ error: "not_found" });
    }
    // CORS preflight is handled by @fastify/cors — never proxy OPTIONS to the worker.
    if (request.method === "OPTIONS") {
      return reply.code(204).send();
    }

    const pillowPath = classifyTier0PillowPath(request.url);
    if (pillowPath === "reject") {
      return reply.code(400).send({ code: "PILLOW_NONCANONICAL_PATH", retryable: false });
    }
    const isPillowChatStream = request.method === "POST" && pillowPath === "stream";
    const isPillowChat = request.method === "POST" && pillowPath === "chat";

    // The SSE route has no durable acceptance/result-retrieval protocol. Fail
    // closed instead of bypassing the canonical Tier-0-owned chat lifecycle.
    if (isPillowChatStream) {
      return reply.code(503).send(TIER0_PILLOW_STREAM_DURABILITY_REQUIRED);
    }

    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(request.headers)) {
      if (v == null) continue;
      if (k === "host" || k === "connection" || k === "content-length") continue;
      headers[k] = Array.isArray(v) ? v.join(",") : String(v);
    }

    const rawBody =
      request.method !== "GET" && request.method !== "HEAD" && request.body != null
        ? typeof request.body === "string" || Buffer.isBuffer(request.body)
          ? (request.body as string | Buffer)
          : JSON.stringify(request.body)
        : undefined;
    if (rawBody !== undefined) {
      headers["content-type"] = headers["content-type"] ?? "application/json";
    }

    async function probeWorkerOk(timeoutMs: number): Promise<boolean> {
      const worker = await probeWorkerReady(timeoutMs);
      if (worker.ok && (workerState.starting || !workerState.child)) {
        return false;
      }
      return worker.ok;
    }

    async function forwardOnce(
      timeoutMs: number,
      bodyOverride?: string | Buffer,
      onForwardStart?: () => void | Promise<void>,
    ): Promise<PillowProxyAttemptResult> {
      const target = `http://127.0.0.1:${workerState.port}${request.url}`;
      const bodyForProxy = bodyOverride !== undefined ? bodyOverride : rawBody;
      try {
        const init: RequestInit = {
          method: request.method,
          headers: { ...headers },
          signal: AbortSignal.timeout(timeoutMs),
        };
        if (bodyForProxy !== undefined) init.body = bodyForProxy;
        await onForwardStart?.();
        const upstream = await fetch(target, init);
        const buf = Buffer.from(await upstream.arrayBuffer());
        const messagePreview = extractChatMessagePreview(buf);
        const upstreamOk = upstream.status >= 200 && upstream.status < 300;
        if (!upstreamOk) {
          return {
            ok: false,
            reason: "upstream_error",
            status: upstream.status,
          };
        }
        if (isPillowChat && messagePreview.length === 0) {
          return { ok: false, reason: "empty_message", status: upstream.status };
        }
        return {
          ok: true,
          status: upstream.status,
          body: buf,
          headers: upstream.headers,
          messagePreview,
        };
      } catch (error) {
        if (error instanceof PillowDurableStoreUnavailableError) throw error;
        const timedOut = error instanceof Error && error.name === "TimeoutError";
        return {
          ok: false,
          reason: timedOut ? "timeout" : "network",
          error,
        };
      }
    }

    async function proxyOnce(
      timeoutMs: number,
      bodyOverride?: string | Buffer,
    ): Promise<PillowProxyAttemptResult> {
      return runSingleWorkerProxyAttempt(
        () => probeWorkerOk(Math.min(2_000, timeoutMs)),
        () => forwardOnce(timeoutMs, bodyOverride),
      );
    }

    if (isPillowChat) {
      return handleDurablePillowChat(request, reply, { authenticate, probeSharedSessionStore });
    }

    const once = await proxyOnce(120_000);
    if (once.ok) {
      const skip = new Set(["transfer-encoding", "connection", "content-encoding"]);
      once.headers.forEach((value, key) => {
        if (!skip.has(key.toLowerCase())) reply.header(key, value);
      });
      return reply.code(once.status).send(once.body);
    }
    logger.warn({ reason: once.reason, url: request.url }, "Tier-0 primary proxy to worker failed");
    return reply.code(503).send(buildTier0ProxyFailure(once.reason));
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
        // Cap respawn delay — long backoff after exit(78) left chat hitting 404 races.
        const delay = Math.min(8_000, 1_000 * Math.max(1, Math.min(workerState.restarts, 6)));
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

  if (redisClient) {
    const stopSweeper = startDurableReasoningSweeper({
      owner: process.env.RAILWAY_REPLICA_ID || process.env.HOSTNAME || "tier0",
      workerPort,
      ready: async () => !workerState.starting && Boolean(workerState.child) && (await probeWorkerReady(2_000)).ok,
      onError: (error) => logger.error({ error: error instanceof Error ? error.message : "queue_error" }, "pillow_durable_sweeper_error"),
    });
    app.addHook("onClose", async () => { stopSweeper(); });
  }
  app.addHook("onClose", async () => { redisClient.disconnect(); });
  await app.listen({ port: env.PORT, host: env.HOST });
  logger.info(
    { port: env.PORT, workerPort: workerState.port },
    "Tier-0 isolated primary listening (auth/health independent of sql.js worker)",
  );

  // Spawn heavy sql.js worker AFTER public Tier-0 is accepting traffic so
  // Railway healthchecks and Grand King auth survive worker boot/OOM/flush.
  setTimeout(() => spawnWorker(), Number(process.env.EMPIRE_BRAIN_WORKER_SPAWN_DELAY_MS ?? 1_500));
}
