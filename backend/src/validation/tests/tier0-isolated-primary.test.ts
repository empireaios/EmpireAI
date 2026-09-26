import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import Fastify from "fastify";
import {
  buildTier0ProxyFailure,
  buildTier0ReadinessResult,
  createSharedSessionStoreGuard,
  registerTier0ReadinessRoute,
  registerTier0DurabilityErrorHandler,
  runSingleWorkerProxyAttempt,
  tier0IsolationEnabled,
} from "../../runtime/tier0-isolated-primary.js";
import {
  buildWorkerApplicationReadiness,
  probeRedisSessionStore,
  registerWorkerApplicationReadinessRoute,
} from "../../runtime/application-readiness.js";
import {
  acceptPillowChatRequest,
  runAcceptedPillowChatRecovery,
} from "../../runtime/pillow-accepted-request-recovery.js";
import { PillowDurableStoreUnavailableError } from "../../runtime/pillow-chat-request-store.js";

function restoreEnvironment(key: string, value: string | undefined): void {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

describe("tier0 isolated primary", () => {
  it("disables isolation for brain-worker role", () => {
    const prevRole = process.env.EMPIRE_ROLE;
    const prevIso = process.env.EMPIRE_TIER0_ISOLATION;
    try {
      process.env.EMPIRE_ROLE = "brain-worker";
      process.env.EMPIRE_TIER0_ISOLATION = "true";
      assert.equal(tier0IsolationEnabled(), false);
    } finally {
      restoreEnvironment("EMPIRE_ROLE", prevRole);
      restoreEnvironment("EMPIRE_TIER0_ISOLATION", prevIso);
    }
  });

  it("can force isolation outside production", () => {
    const prevRole = process.env.EMPIRE_ROLE;
    const prevIso = process.env.EMPIRE_TIER0_ISOLATION;
    try {
      delete process.env.EMPIRE_ROLE;
      process.env.EMPIRE_TIER0_ISOLATION = "force";
      assert.equal(tier0IsolationEnabled(), true);
    } finally {
      restoreEnvironment("EMPIRE_ROLE", prevRole);
      restoreEnvironment("EMPIRE_TIER0_ISOLATION", prevIso);
    }
  });

  it("enables isolation when Railway env is present", () => {
    const prevRole = process.env.EMPIRE_ROLE;
    const prevIso = process.env.EMPIRE_TIER0_ISOLATION;
    const prevRail = process.env.RAILWAY_DEPLOYMENT_ID;
    try {
      delete process.env.EMPIRE_ROLE;
      process.env.EMPIRE_TIER0_ISOLATION = "true";
      process.env.RAILWAY_DEPLOYMENT_ID = "test-deploy";
      assert.equal(tier0IsolationEnabled(), true);
    } finally {
      restoreEnvironment("EMPIRE_ROLE", prevRole);
      restoreEnvironment("EMPIRE_TIER0_ISOLATION", prevIso);
      restoreEnvironment("RAILWAY_DEPLOYMENT_ID", prevRail);
    }
  });

  it("admits Railway traffic through readiness and forbids monolith fallback", () => {
    const railway = readFileSync(
      new URL("../../../../railway.toml", import.meta.url),
      "utf8",
    );
    const indexSource = readFileSync(new URL("../../index.ts", import.meta.url), "utf8");
    assert.match(railway, /healthcheckPath\s*=\s*"\/health\/ready"/);
    assert.doesNotMatch(indexSource, /monolith-fallback/);
    assert.match(indexSource, /refusing unsafe monolith fallback/);
  });

  it("reports not-ready when the Brain worker is unavailable", () => {
    assert.deepEqual(
      buildTier0ReadinessResult({
        workerReady: false,
        primarySessionStoreReady: true,
      }),
      { statusCode: 503, ready: false, redisReady: true },
    );
  });

  it("reports ready only when every required readiness dependency is available", () => {
    assert.deepEqual(
      buildTier0ReadinessResult({
        workerReady: true,
        primarySessionStoreReady: true,
      }),
      { statusCode: 200, ready: true, redisReady: true },
    );
    assert.deepEqual(
      buildTier0ReadinessResult({
        workerReady: true,
        primarySessionStoreReady: false,
      }),
      { statusCode: 503, ready: false, redisReady: false },
    );
  });

  it("requires an authoritative running Pillow lifecycle", () => {
    assert.deepEqual(
      buildWorkerApplicationReadiness({
        authReady: true,
        redisReady: true,
        pillowEnabled: true,
        pillowLifecycle: "starting",
      }),
      { statusCode: 503, ready: false, pillowReady: false },
    );
    assert.deepEqual(
      buildWorkerApplicationReadiness({
        authReady: true,
        redisReady: true,
        pillowEnabled: true,
        pillowLifecycle: "running",
      }),
      { statusCode: 200, ready: true, pillowReady: true },
    );
  });

  it("checks the live Redis client rather than a startup snapshot", async () => {
    assert.equal(await probeRedisSessionStore(null), false);
    assert.equal(
      await probeRedisSessionStore({ ping: async () => "PONG" }),
      true,
    );
    assert.equal(
      await probeRedisSessionStore({ ping: async () => "OK" }),
      false,
    );
    assert.equal(
      await probeRedisSessionStore({
        ping: async () => {
          throw new Error("redis_down");
        },
      }),
      false,
    );
  });

  it("serves route-level 503 until both worker/Pillow and Redis sessions are ready", async () => {
    const app = Fastify();
    registerTier0ReadinessRoute(app, {
      probeWorkerReady: async () => ({
        ok: false,
        reachable: true,
        ms: 2,
        body: {
          ready: false,
          pillow: { enabled: true, ready: false, lifecycle: "starting" },
        },
      }),
      probePrimarySessionStore: async () => true,
      sessionStoreMode: "redis",
    });

    const response = await app.inject({ method: "GET", url: "/health/ready" });
    assert.equal(response.statusCode, 503);
    assert.deepEqual(response.json(), {
      ready: false,
      brain: "tier0_only",
      process: "running",
      tier0Isolation: true,
      workerOnline: true,
      workerReady: false,
      sessionStore: "redis",
      pillow: { enabled: true, ready: false, lifecycle: "starting" },
      checks: {
        tier0Primary: { ok: true },
        redis: { ok: true, ping: true },
        brainWorker: { ok: true },
        brainWorkerReady: { ok: false },
        pillow: { ok: false },
      },
    });
    await app.close();
  });

  it("fails Tier-0 closed for memory sessions even if a synthetic probe passes", async () => {
    const app = Fastify();
    registerTier0ReadinessRoute(app, {
      probeWorkerReady: async () => ({
        ok: true,
        reachable: true,
        ms: 1,
        body: {
          ready: true,
          pillow: { enabled: true, ready: true, lifecycle: "running" },
        },
      }),
      probePrimarySessionStore: async () => true,
      sessionStoreMode: "memory",
    });

    const response = await app.inject({ method: "GET", url: "/health/ready" });
    assert.equal(response.statusCode, 503);
    assert.equal(response.json().checks.redis.ok, false);
    assert.equal(response.json().checks.redis.ping, true);
    await app.close();
  });

  it("rejects a worker ready claim that omits authoritative Pillow state", async () => {
    const app = Fastify();
    registerTier0ReadinessRoute(app, {
      probeWorkerReady: async () => ({
        ok: true,
        reachable: true,
        ms: 1,
        body: { ready: true },
      }),
      probePrimarySessionStore: async () => true,
      sessionStoreMode: "redis",
    });

    const response = await app.inject({ method: "GET", url: "/health/ready" });
    assert.equal(response.statusCode, 503);
    assert.equal(response.json().workerReady, false);
    assert.equal(response.json().checks.pillow.ok, false);
    await app.close();
  });

  it("re-evaluates Tier-0 Redis readiness on every request", async () => {
    const app = Fastify();
    let redisReady = true;
    registerTier0ReadinessRoute(app, {
      probeWorkerReady: async () => ({
        ok: true,
        reachable: true,
        ms: 1,
        body: {
          ready: true,
          pillow: { enabled: true, ready: true, lifecycle: "running" },
        },
      }),
      probePrimarySessionStore: async () => redisReady,
      sessionStoreMode: "redis",
    });

    assert.equal(
      (await app.inject({ method: "GET", url: "/health/ready" })).statusCode,
      200,
    );
    redisReady = false;
    assert.equal(
      (await app.inject({ method: "GET", url: "/health/ready" })).statusCode,
      503,
    );
    await app.close();
  });

  it("returns 503 before an auth handler can issue a private-memory session", async () => {
    const app = Fastify();
    let handlerCalls = 0;
    app.post(
      "/auth/login",
      { preHandler: createSharedSessionStoreGuard(async () => false) },
      async () => {
        handlerCalls += 1;
        return { ok: true };
      },
    );

    const response = await app.inject({ method: "POST", url: "/auth/login" });
    assert.equal(response.statusCode, 503);
    assert.equal(response.json().code, "SHARED_SESSION_STORE_UNAVAILABLE");
    assert.equal(handlerCalls, 0);
    await app.close();
  });

  it("maps durable-store write failures to an explicit 503 contract", async () => {
    const app = Fastify();
    registerTier0DurabilityErrorHandler(app);
    app.post("/durability-failure", async () => {
      throw new PillowDurableStoreUnavailableError();
    });

    const response = await app.inject({ method: "POST", url: "/durability-failure" });
    assert.equal(response.statusCode, 503);
    assert.deepEqual(response.json(), {
      error: "Pillow durable request store temporarily unavailable",
      code: "PILLOW_DURABILITY_UNAVAILABLE",
      tier0Isolation: true,
      retryable: true,
      resultRetrievable: false,
    });
    await app.close();
  });

  it("serves worker readiness from live Redis and Pillow lifecycle state", async () => {
    const app = Fastify();
    let redisReachable = true;
    let pillowLifecycle = "starting";
    registerWorkerApplicationReadinessRoute(app, {
      assessAuthReadiness: () => ({
        ready: true,
        status: "ready",
        checks: [],
        blockers: [],
      }),
      probeRedisConnectivity: async () => redisReachable,
      redisMode: "connected",
      redisRequired: true,
      pillowEnabled: true,
      pillowRequired: true,
      getPillowStatus: () => ({
        lifecycle: pillowLifecycle,
        health: "Idle",
        lastError: null,
      }),
    });

    const starting = await app.inject({ method: "GET", url: "/health/ready" });
    assert.equal(starting.statusCode, 503);
    assert.equal(starting.json().pillow.ready, false);

    pillowLifecycle = "running";
    const running = await app.inject({ method: "GET", url: "/health/ready" });
    assert.equal(running.statusCode, 200);
    assert.equal(running.json().pillow.ready, true);

    redisReachable = false;
    const redisLost = await app.inject({ method: "GET", url: "/health/ready" });
    assert.equal(redisLost.statusCode, 503);
    assert.equal(redisLost.json().redis.reachable, false);
    await app.close();
  });

  it("serves route-level 200 only for a ready worker and live shared sessions", async () => {
    const app = Fastify();
    registerTier0ReadinessRoute(app, {
      probeWorkerReady: async () => ({
        ok: true,
        reachable: true,
        ms: 2,
        body: {
          ready: true,
          pillow: { enabled: true, ready: true, lifecycle: "running" },
        },
      }),
      probePrimarySessionStore: async () => true,
      sessionStoreMode: "redis",
    });

    const response = await app.inject({ method: "GET", url: "/health/ready" });
    assert.equal(response.statusCode, 200);
    assert.equal(response.json().ready, true);
    assert.equal(response.json().checks.pillow.ok, true);
    await app.close();
  });

  it("runs one worker probe and at most one upstream request per proxy attempt", async () => {
    let probes = 0;
    let forwards = 0;
    const unavailable = await runSingleWorkerProxyAttempt(
      async () => {
        probes += 1;
        return false;
      },
      async () => {
        forwards += 1;
        return { ok: false, reason: "network" };
      },
    );
    assert.deepEqual(unavailable, { ok: false, reason: "worker_unavailable" });
    assert.equal(probes, 1);
    assert.equal(forwards, 0);

    probes = 0;
    const forwarded = await runSingleWorkerProxyAttempt(
      async () => {
        probes += 1;
        return true;
      },
      async () => {
        forwards += 1;
        return { ok: false, reason: "upstream_error", status: 502 };
      },
    );
    assert.deepEqual(forwarded, { ok: false, reason: "upstream_error", status: 502 });
    assert.equal(probes, 1);
    assert.equal(forwards, 1);
  });

  it("preserves the worker-unavailable response contract after the single probe", () => {
    assert.deepEqual(buildTier0ProxyFailure("worker_unavailable"), {
      error: "Brain worker temporarily unavailable",
      code: "BRAIN_WORKER_UNAVAILABLE",
      tier0Isolation: true,
      retryable: true,
    });
    assert.equal(buildTier0ProxyFailure("timeout").code, "BRAIN_WORKER_PROXY_FAILED");
  });

  it("reuses the chat recovery readiness probe instead of nesting another probe", async () => {
    let probes = 0;
    let forwards = 0;
    const accepted = acceptPillowChatRequest({ message: "Synthetic single-probe check" });
    const result = await runAcceptedPillowChatRecovery({
      accepted,
      probeWorker: async () => {
        probes += 1;
        return true;
      },
      attempt: async () => {
        forwards += 1;
        return {
          ok: true,
          status: 200,
          body: Buffer.from(JSON.stringify({ result: { message: "ready" } })),
          headers: new Headers(),
          messagePreview: "ready",
        };
      },
      totalBudgetMs: 10_000,
      attempt1Ms: 5_000,
      attempt2Ms: 5_000,
      workerWaitMs: 10,
    });
    assert.equal(result.ok, true);
    assert.equal(probes, 1);
    assert.equal(forwards, 1);
  });

  it("never forwards or marks an attempt when chat readiness never succeeds", async () => {
    let probes = 0;
    let forwards = 0;
    const events: string[] = [];
    const accepted = acceptPillowChatRequest({ message: "Synthetic unavailable check" });
    const result = await runAcceptedPillowChatRecovery({
      accepted,
      probeWorker: async () => {
        probes += 1;
        return false;
      },
      attempt: async () => {
        forwards += 1;
        return { ok: false, reason: "network" };
      },
      onEvent: (event) => events.push(event),
      totalBudgetMs: 10_000,
      attempt1Ms: 5_000,
      attempt2Ms: 5_000,
      workerWaitMs: 0,
    });
    assert.deepEqual(result, { ok: false, reason: "worker_unavailable" });
    assert.equal(probes, 2);
    assert.equal(forwards, 0);
    assert.equal(events.includes("attempt_started"), false);
  });

  it("preserves the bounded retry after a transient upstream failure", async () => {
    let probes = 0;
    let forwards = 0;
    const accepted = acceptPillowChatRequest({ message: "Synthetic transient retry" });
    const result = await runAcceptedPillowChatRecovery({
      accepted,
      probeWorker: async () => {
        probes += 1;
        return true;
      },
      attempt: async (_timeoutMs, attemptIndex) => {
        forwards += 1;
        if (attemptIndex === 1) {
          return { ok: false, reason: "upstream_error", status: 500 };
        }
        return {
          ok: true,
          status: 200,
          body: Buffer.from('{"result":{"message":"recovered"}}'),
          headers: new Headers(),
          messagePreview: "recovered",
        };
      },
      totalBudgetMs: 15_000,
      attempt1Ms: 5_000,
      attempt2Ms: 5_000,
      workerWaitMs: 10,
    });
    assert.equal(result.ok, true);
    assert.equal(probes, 2);
    assert.equal(forwards, 2);
  });
});
