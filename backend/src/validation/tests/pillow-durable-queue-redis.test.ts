import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";
import { spawn, type ChildProcess } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { Redis } from "ioredis";
import Fastify from "fastify";
import { InMemorySessionStore, SessionStore, SessionStoreUnavailableError } from "../../auth/session-store.js";
import { createTier0RedisClient, waitForRuntimeRedisReady } from "../../runtime/tier0-redis.js";
import { createWorkerRedisBinding, WorkerSharedRedisUnavailableError } from "../../runtime/worker-redis-binding.js";
import { EventBus } from "../../brain/events/event-bus.js";
import { createAuthMiddleware } from "../../auth/middleware.js";
import { handleDurablePillowChat, registerTier0DurableReadRoutes, registerTier0DurabilityErrorHandler } from "../../runtime/tier0-isolated-primary.js";
import {
  acceptDurableChatRequestClaim, claimNextReasoningRequest, configureChatRequestStore,
  dropChatRequestMemoryCacheForTests, getChatRequest, settleReasoningRequest,
  PillowDurableStoreUnavailableError, PillowIdempotencyConflictError,
} from "../../runtime/pillow-chat-request-store.js";
import { runOneDurableReasoningAttempt } from "../../runtime/pillow-durable-reasoning-worker.js";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const queueInput = (message = "A complete reasoning request", ownerId = "owner-a") => ({
  sessionId: "conversation-a", message, ownerId, workspaceId: "workspace-a",
  input: { kind: "reasoning" as const, bodyText: JSON.stringify({ message, sessionId: "conversation-a",
    workspaceContext: { recentConversationTurns: [{ role: "pillow", content: "preserve full context" }] } }),
  sessionToken: "synthetic-test-session-token" },
});

describe("real Redis durable reasoning queue (required, no skipped certification)", { concurrency: false }, () => {
  let dir: string;
  let redisUrl: string;
  let port: number;
  let server: ChildProcess;
  let redis: Redis;
  async function startRedis() {
    server = spawn(process.env.PILLOW_TEST_REDIS_SERVER ?? "redis-server", [
      "--bind", "127.0.0.1", "--port", String(port), "--dir", dir, "--save", "",
      "--appendonly", "yes", "--appendfsync", "always",
    ], { stdio: ["ignore", "pipe", "pipe"], env: process.env });
    await new Promise<void>((resolve, reject) => {
      let logs = "";
      const timer = setTimeout(() => reject(new Error("Redis startup timeout: " + logs.slice(-1000))), 10_000);
      server.once("error", (error) => { clearTimeout(timer); reject(error); });
      server.once("exit", (code) => { clearTimeout(timer); reject(new Error(`Redis exited ${code}: ${logs.slice(-1000)}`)); });
      server.stdout!.on("data", (chunk) => { logs += String(chunk); if (logs.includes("Ready to accept connections")) {
        clearTimeout(timer); resolve();
      } });
    });
    redis = new Redis(redisUrl, { lazyConnect: true, retryStrategy: null, maxRetriesPerRequest: 0 });
    redis.on("error", () => undefined);
    await redis.connect();
    assert.equal(await redis.ping(), "PONG");
    configureChatRequestStore(redis, { requireRedisDurability: true });
  }
  async function stopRedis() {
    redis?.disconnect();
    if (server && server.exitCode === null && server.signalCode === null) {
      const exited = new Promise<void>((resolve) => server.once("exit", () => resolve()));
      server.kill("SIGKILL");
      await exited;
    }
  }
  before(async () => {
    dir = await mkdtemp(path.join(tmpdir(), "pillow-queue-test-"));
    port = await new Promise<number>((resolve, reject) => {
      const listener = createServer();
      listener.once("error", reject);
      listener.listen(0, "127.0.0.1", () => {
        const address = listener.address();
        if (!address || typeof address === "string") return reject(new Error("No local test port"));
        listener.close(() => resolve(address.port));
      });
    });
    redisUrl = `redis://127.0.0.1:${port}`;
    await startRedis();
  });
  beforeEach(async () => { await redis.flushdb(); dropChatRequestMemoryCacheForTests(); });
  after(async () => {
    configureChatRequestStore(null); dropChatRequestMemoryCacheForTests();
    await stopRedis();
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  it("40 simultaneous accepts create one indexed job and 20 workers claim only once", async () => {
    const accepts = await Promise.all(Array.from({ length: 40 }, () => acceptDurableChatRequestClaim(queueInput())));
    assert.equal(accepts.filter((item) => item.disposition === "CREATED").length, 1);
    assert.equal(new Set(accepts.map((item) => item.request.requestId)).size, 1);
    assert.equal(await redis.zcard("pillow:chatreq:due"), 1);
    const claims = await Promise.all(Array.from({ length: 20 }, (_, i) =>
      claimNextReasoningRequest({ owner: `worker-${i}`, leaseMs: 10_000 })));
    assert.equal(claims.filter(Boolean).length, 1);
    assert.equal(claims.find(Boolean)?.request.attemptCount, 1);
  });

  it("returns completed disposition without execution; rejects reused key with changed input", async () => {
    const input = { ...queueInput(), idempotencyKey: "intent-1" };
    const accepted = await acceptDurableChatRequestClaim(input);
    const job = await claimNextReasoningRequest({ owner: "worker", leaseMs: 10_000 });
    assert.equal(await settleReasoningRequest({ requestId: accepted.request.requestId,
      leaseToken: job!.request.leaseToken!, result: { kind: "llm", message: "persisted answer" } }), true);
    const duplicate = await acceptDurableChatRequestClaim(input);
    assert.equal(duplicate.disposition, "EXISTING_COMPLETED");
    assert.equal(duplicate.request.finalResult?.message, "persisted answer");
    assert.equal(await claimNextReasoningRequest({ owner: "other", leaseMs: 1000 }), null);
    await assert.rejects(() => acceptDurableChatRequestClaim({ ...queueInput("changed"), idempotencyKey: "intent-1" }),
      PillowIdempotencyConflictError);
    assert.equal(await redis.get(`pillow:chatreq:job:${accepted.request.requestId}`), null);
  });

  it("actual process death preserves full input and fences the abandoned worker", async () => {
    const accepted = await acceptDurableChatRequestClaim(queueInput("Full message " + "x".repeat(1000)));
    const storeUrl = new URL("../../runtime/pillow-chat-request-store.ts", import.meta.url).href;
    const source = `import {Redis} from 'ioredis'; import {configureChatRequestStore,claimNextReasoningRequest} from ${JSON.stringify(storeUrl)};
      const redis=new Redis(process.env.TEST_REDIS_URL); configureChatRequestStore(redis,{requireRedisDurability:true});
      const job=await claimNextReasoningRequest({owner:'doomed-process',leaseMs:600});
      process.stdout.write(JSON.stringify({id:job.request.requestId,token:job.request.leaseToken})+'\\n');
      setInterval(()=>{},10000);`;
    const child = spawn(process.execPath, ["--import", "tsx", "--input-type=module", "-e", source], {
      cwd: process.cwd(), env: { ...process.env, TEST_REDIS_URL: redisUrl }, stdio: ["ignore", "pipe", "pipe"],
    });
    const claimed = await new Promise<{ id: string; token: number }>((resolve, reject) => {
      let out = "";
      const timeout = setTimeout(() => { child.kill("SIGKILL"); reject(new Error("claim child timeout")); }, 10_000);
      child.stdout!.on("data", (data) => { out += String(data); if (out.includes("\n")) {
        clearTimeout(timeout); resolve(JSON.parse(out.trim()));
      } });
      child.on("error", reject);
      child.once("exit", (code) => { if (!out.includes("\n")) { clearTimeout(timeout); reject(new Error(`child exited ${code}`)); } });
    });
    const died = new Promise<void>((resolve) => child.once("exit", () => resolve()));
    child.kill("SIGKILL"); await died;
    assert.equal(claimed.id, accepted.request.requestId);
    await delay(650);
    dropChatRequestMemoryCacheForTests();
    const recovered = await claimNextReasoningRequest({ owner: "new-process", leaseMs: 10_000 });
    assert.equal(recovered?.input.bodyText, queueInput("Full message " + "x".repeat(1000)).input.bodyText);
    assert.equal(recovered?.input.sessionToken, "synthetic-test-session-token");
    assert.equal(recovered?.request.attemptCount, 2);
    assert.equal(await settleReasoningRequest({ requestId: claimed.id, leaseToken: claimed.token,
      result: { message: "stale answer" } }), false);
    assert.equal(await settleReasoningRequest({ requestId: claimed.id, leaseToken: recovered!.request.leaseToken!,
      result: { message: "recovered answer", kind: "llm" } }), true);
    dropChatRequestMemoryCacheForTests();
    assert.equal((await getChatRequest(claimed.id))?.finalResult?.message, "recovered answer");
  });

  it("survives actual Redis SIGKILL/restart with the accepted job in AOF", async () => {
    const accepted = await acceptDurableChatRequestClaim(queueInput());
    await stopRedis(); dropChatRequestMemoryCacheForTests(); await startRedis();
    const recovered = await claimNextReasoningRequest({ owner: "post-redis-restart", leaseMs: 10_000 });
    assert.equal(recovered?.request.requestId, accepted.request.requestId);
    assert.equal(recovered?.input.bodyText, queueInput().input.bodyText);
  });

  it("same shared session/queue binding recovers from startup outage and later Redis crash", async () => {
    await stopRedis();
    const recovering = createTier0RedisClient(redisUrl);
    const sessions = new SessionStore(recovering);
    const waitUntilReady = async () => {
      for (let i = 0; i < 100 && recovering.status !== "ready"; i++) await delay(50);
      assert.equal(recovering.status, "ready");
    };
    configureChatRequestStore(recovering, { requireRedisDurability: true });
    try {
      await assert.rejects(() => sessions.get("synthetic-missing"), SessionStoreUnavailableError);
      await assert.rejects(() => acceptDurableChatRequestClaim(queueInput()), PillowDurableStoreUnavailableError);
      await startRedis();
      configureChatRequestStore(recovering, { requireRedisDurability: true });
      await waitUntilReady();
      const session = await sessions.create({ id: "owner", email: "synthetic@example.com", name: "Test", role: "founder", workspaceId: "workspace" });
      const accepted = await acceptDurableChatRequestClaim(queueInput());
      await stopRedis(); await delay(30);
      await assert.rejects(() => sessions.get(session.token), SessionStoreUnavailableError);
      await assert.rejects(() => acceptDurableChatRequestClaim(queueInput()), PillowDurableStoreUnavailableError);
      await startRedis();
      configureChatRequestStore(recovering, { requireRedisDurability: true });
      await waitUntilReady();
      assert.equal((await sessions.get(session.token))?.id, "owner");
      assert.equal((await acceptDurableChatRequestClaim(queueInput())).request.requestId, accepted.request.requestId);
      assert.equal(await recovering.zcard("pillow:chatreq:due"), 1);
      assert.ok(await claimNextReasoningRequest({ owner: "recovered", leaseMs: 10_000 }));
      assert.equal(await claimNextReasoningRequest({ owner: "duplicate", leaseMs: 10_000 }), null);
    } finally { recovering.disconnect(); configureChatRequestStore(redis, { requireRedisDurability: true }); }
  });

  it("worker production boot fails closed then primary/worker auth bindings recover together", async () => {
    await stopRedis();
    await assert.rejects(() => createWorkerRedisBinding({ url: redisUrl, production: true, allowDegraded: true }),
      WorkerSharedRedisUnavailableError);
    await startRedis();
    const binding = await createWorkerRedisBinding({ url: redisUrl, production: true, allowDegraded: true });
    assert.equal(binding.redisMode, "connected");
    assert.ok(binding.redis);
    const primary = createTier0RedisClient(redisUrl);
    await waitForRuntimeRedisReady(primary);
    const primarySessions = new SessionStore(primary);
    const workerSessions = new SessionStore(binding.redis!);
    configureChatRequestStore(primary, { requireRedisDurability: true });
    try {
      const session = await primarySessions.create({ id: "shared-owner", email: "synthetic@example.com", name: "Test", role: "founder", workspaceId: "shared-workspace" });
      assert.equal((await workerSessions.get(session.token))?.id, "shared-owner");
      const input = queueInput(); input.input.sessionToken = session.token;
      const accepted = await acceptDurableChatRequestClaim(input);
      await stopRedis(); await delay(30);
      await assert.rejects(() => workerSessions.get(session.token), SessionStoreUnavailableError);
      await assert.rejects(() => primarySessions.get(session.token), SessionStoreUnavailableError);
      await startRedis();
      configureChatRequestStore(primary, { requireRedisDurability: true });
      await Promise.all([waitForRuntimeRedisReady(primary, 5000), waitForRuntimeRedisReady(binding.redis!, 5000)]);
      assert.equal((await workerSessions.get(session.token))?.id, "shared-owner");
      assert.equal((await acceptDurableChatRequestClaim(input)).request.requestId, accepted.request.requestId);
      await runOneDurableReasoningAttempt({ owner: "same-worker", ready: async () => binding.redis!.status === "ready",
        execute: async (job) => {
          assert.equal((await workerSessions.get(job.input.sessionToken))?.id, "shared-owner");
          return { ok: true, result: { kind: "llm", message: "Synthetic authenticated recovery" } };
        } });
      assert.equal((await getChatRequest(accepted.request.requestId))?.status, "COMPLETED");
      assert.equal(await primary.zcard("pillow:chatreq:due"), 0);
    } finally {
      primary.disconnect(); binding.redis?.disconnect(); configureChatRequestStore(redis, { requireRedisDurability: true });
    }
  });

  it("event clients await initial readiness with offline buffering disabled", async () => {
    const binding = await createWorkerRedisBinding({ url: redisUrl, production: true, allowDegraded: false });
    const bus = new EventBus(binding.redis);
    try {
      await bus.start();
      await bus.publish({ type: "test.readiness" as never, source: "test", payload: {} } as never);
    } finally { await bus.stop(); binding.redis?.disconnect(); }
  });

  it("bounded attempts become retained terminal failure/DLQ, not forever-pending", async () => {
    const accepted = await acceptDurableChatRequestClaim(queueInput());
    for (let attempt = 1; attempt <= 3; attempt++) {
      const job = await claimNextReasoningRequest({ owner: "retry-owner", leaseMs: 10_000 });
      assert.equal(job?.request.attemptCount, attempt);
      await settleReasoningRequest({ requestId: job!.request.requestId, leaseToken: job!.request.leaseToken!,
        failureClass: "NETWORK", error: "synthetic_network_fault", retryDelayMs: 0 });
    }
    const rec = await getChatRequest(accepted.request.requestId);
    assert.equal(rec?.status, "FAILED_FATAL");
    assert.equal(await redis.zcard("pillow:chatreq:dead"), 1);
    assert.equal(await redis.zcard("pillow:chatreq:due"), 0);
    assert.equal((await acceptDurableChatRequestClaim(queueInput())).disposition, "EXISTING_FAILED");
    assert.equal(await claimNextReasoningRequest({ owner: "extra", leaseMs: 1000 }), null);
  });

  it("expired third lease moves to DLQ instead of starting a fourth attempt", async () => {
    const accepted = await acceptDurableChatRequestClaim(queueInput());
    for (let i = 0; i < 3; i++) {
      assert.ok(await claimNextReasoningRequest({ owner: "crashed", leaseMs: 10 }));
      await delay(20);
    }
    assert.equal(await claimNextReasoningRequest({ owner: "fourth", leaseMs: 10 }), null);
    assert.equal((await getChatRequest(accepted.request.requestId))?.status, "FAILED_FATAL");
    assert.equal(await redis.zcard("pillow:chatreq:dead"), 1);
  });

  it("Redis write failure after completed computation never creates a false completed state", async () => {
    const accepted = await acceptDurableChatRequestClaim(queueInput());
    const job = await claimNextReasoningRequest({ owner: "compute", leaseMs: 100 });
    configureChatRequestStore({ get: (k) => redis.get(k), setex: (k, s, v) => redis.setex(k, s, v),
      eval: async () => { throw new Error("synthetic_redis_write_failure"); } }, { requireRedisDurability: true });
    await assert.rejects(() => settleReasoningRequest({ requestId: accepted.request.requestId,
      leaseToken: job!.request.leaseToken!, result: { message: "not persisted" } }), PillowDurableStoreUnavailableError);
    assert.equal((await getChatRequest(accepted.request.requestId))?.status, "RUNNING");
    assert.equal((await getChatRequest(accepted.request.requestId))?.finalResult, null);
    configureChatRequestStore(redis, { requireRedisDurability: true });
    await delay(120);
    assert.equal((await claimNextReasoningRequest({ owner: "retry", leaseMs: 1000 }))?.request.attemptCount, 2);
  });

  it("does not consume attempts during delayed worker readiness", async () => {
    const accepted = await acceptDurableChatRequestClaim(queueInput());
    let executed = 0;
    for (let i = 0; i < 5; i++) assert.equal(await runOneDurableReasoningAttempt({ owner: "booting",
      ready: async () => false, execute: async () => { executed++; return { ok: true, result: { message: "no" } }; } }), false);
    assert.equal(executed, 0);
    assert.equal((await getChatRequest(accepted.request.requestId))?.attemptCount, 0);
    await runOneDurableReasoningAttempt({ owner: "ready", ready: async () => true,
      execute: async () => { executed++; return { ok: true, result: { message: "answer", kind: "llm" } }; } });
    assert.equal(executed, 1);
    assert.equal((await getChatRequest(accepted.request.requestId))?.status, "COMPLETED");
  });

  it("strict Redis reads cannot use a stale local completion when Redis is unavailable", async () => {
    const accepted = await acceptDurableChatRequestClaim(queueInput());
    configureChatRequestStore({ get: async () => { throw new Error("connection lost"); }, setex: async () => "OK" },
      { requireRedisDurability: true });
    await assert.rejects(() => getChatRequest(accepted.request.requestId), PillowDurableStoreUnavailableError);
    configureChatRequestStore(redis, { requireRedisDurability: true });
  });

  it("wrong-type due index fails before writes and cannot yield false duplicate acceptance", async () => {
    await redis.set("pillow:chatreq:due", "corrupt-wrong-type");
    for (let i = 0; i < 2; i++) {
      await assert.rejects(() => acceptDurableChatRequestClaim(queueInput()), PillowDurableStoreUnavailableError);
    }
    assert.deepEqual(await redis.keys("pillow:chatreq:v2:*"), []);
    assert.deepEqual(await redis.keys("pillow:chatreq:idem:*"), []);
    assert.deepEqual(await redis.keys("pillow:chatreq:job:*"), []);
  });

  it("previously partial pending records cannot return a new accepted receipt", async () => {
    const accepted = await acceptDurableChatRequestClaim(queueInput());
    await redis.zrem("pillow:chatreq:due", accepted.request.requestId);
    await assert.rejects(() => acceptDurableChatRequestClaim(queueInput()), PillowDurableStoreUnavailableError);
    await redis.zadd("pillow:chatreq:due", Date.now(), accepted.request.requestId);
    await redis.del(`pillow:chatreq:job:${accepted.request.requestId}`);
    await assert.rejects(() => acceptDurableChatRequestClaim(queueInput()), PillowDurableStoreUnavailableError);
  });

  it("late Lua command denial cannot turn a failed write into unindexed duplicate acceptance", async () => {
    await redis.acl("SETUSER", "late-write-fault", "on", "nopass", "~*", "+@all", "-zadd");
    const restricted = new Redis(redisUrl, { username: "late-write-fault", password: "", lazyConnect: true, retryStrategy: null });
    restricted.on("error", () => undefined);
    await restricted.connect();
    configureChatRequestStore(restricted, { requireRedisDurability: true });
    try {
      await assert.rejects(() => acceptDurableChatRequestClaim(queueInput()), PillowDurableStoreUnavailableError);
      // Redis Lua is isolated, not transactional rollback: earlier SETs may exist.
      assert.equal((await redis.keys("pillow:chatreq:v2:*")).length, 1);
      assert.equal(await redis.zcard("pillow:chatreq:due"), 0);
      configureChatRequestStore(redis, { requireRedisDurability: true });
      await assert.rejects(() => acceptDurableChatRequestClaim(queueInput()), PillowDurableStoreUnavailableError);
      assert.equal(await claimNextReasoningRequest({ owner: "must-not-execute", leaseMs: 1000 }), null);
    } finally {
      configureChatRequestStore(redis, { requireRedisDurability: true });
      restricted.disconnect(); await redis.acl("DELUSER", "late-write-fault");
    }
  });

  it("late cleanup command denial retains the committed result for later retrieval", async () => {
    const accepted = await acceptDurableChatRequestClaim(queueInput());
    const job = await claimNextReasoningRequest({ owner: "worker", leaseMs: 10_000 });
    await redis.acl("SETUSER", "cleanup-fault", "on", "nopass", "~*", "+@all", "-zrem");
    const restricted = new Redis(redisUrl, { username: "cleanup-fault", password: "", lazyConnect: true, retryStrategy: null });
    restricted.on("error", () => undefined); await restricted.connect();
    configureChatRequestStore(restricted, { requireRedisDurability: true });
    try {
      await assert.rejects(() => settleReasoningRequest({ requestId: accepted.request.requestId,
        leaseToken: job!.request.leaseToken!, result: { message: "committed before cleanup", kind: "llm" } }),
      PillowDurableStoreUnavailableError);
      configureChatRequestStore(redis, { requireRedisDurability: true });
      dropChatRequestMemoryCacheForTests();
      const record = await getChatRequest(accepted.request.requestId);
      assert.equal(record?.status, "COMPLETED");
      assert.equal(record?.finalResult?.message, "committed before cleanup");
      assert.ok(await redis.get(`pillow:chatreq:job:${accepted.request.requestId}`));
    } finally {
      configureChatRequestStore(redis, { requireRedisDurability: true });
      restricted.disconnect(); await redis.acl("DELUSER", "cleanup-fault");
    }
  });

  it("settlement key corruption preserves recovery input and never reports completion", async () => {
    const accepted = await acceptDurableChatRequestClaim(queueInput());
    const job = await claimNextReasoningRequest({ owner: "worker", leaseMs: 10_000 });
    await redis.set("pillow:chatreq:dead", "wrong-type");
    await assert.rejects(() => settleReasoningRequest({ requestId: accepted.request.requestId,
      leaseToken: job!.request.leaseToken!, result: { kind: "llm", message: "answer" } }), PillowDurableStoreUnavailableError);
    assert.equal((await getChatRequest(accepted.request.requestId))?.status, "RUNNING");
    assert.ok(await redis.get(`pillow:chatreq:job:${accepted.request.requestId}`));
    assert.equal(await redis.zcard("pillow:chatreq:due"), 1);
  });

  it("HTTP accepts only after durable indexing, duplicate posts reuse, owner GET returns persisted result", async () => {
    const app = Fastify();
    const sessions = new InMemorySessionStore();
    const session = await sessions.create({ id: "owner", workspaceId: "workspace", role: "founder", email: "test@example.com", name: "Test" });
    const authenticate = createAuthMiddleware(sessions);
    registerTier0DurabilityErrorHandler(app);
    registerTier0DurableReadRoutes(app, authenticate);
    app.post("/api/pillow/chat", (request, reply) => handleDurablePillowChat(request, reply, { authenticate, probeSharedSessionStore: async () => true }));
    try {
      const request = { method: "POST" as const, url: "/api/pillow/chat", headers: { authorization: `Bearer ${session.token}` },
        payload: { message: "Please reason, no actions", sessionId: "chat" } };
      assert.equal((await app.inject({ ...request, headers: {} })).statusCode, 401);
      assert.equal((await app.inject({ ...request, payload: { ...request.payload, workspaceId: "foreign" } })).statusCode, 403);
      const responses = await Promise.all([app.inject(request), app.inject(request)]);
      assert.ok(responses.every((item) => item.statusCode === 202));
      const id = responses[0]!.json().result.requestId;
      assert.equal(responses[1]!.json().result.requestId, id);
      assert.equal(await redis.zcard("pillow:chatreq:due"), 1);
      const accepted = await getChatRequest(id);
      assert.equal(accepted?.ownerId, "owner");
      assert.equal(accepted?.workspaceId, "workspace");
      assert.ok(!responses[0]!.body.includes(session.token));
      const job = await claimNextReasoningRequest({ owner: "http-worker", leaseMs: 10_000 });
      await settleReasoningRequest({ requestId: id, leaseToken: job!.request.leaseToken!, result: { kind: "llm", message: "Genuine persisted answer" } });
      dropChatRequestMemoryCacheForTests();
      const poll = await app.inject({ method: "GET", url: `/api/pillow/chat-request/${id}`, headers: request.headers });
      assert.equal(poll.statusCode, 200);
      assert.equal(poll.json().request.status, "COMPLETED");
      assert.equal(poll.json().request.finalResult.message, "Genuine persisted answer");
      assert.ok(!poll.body.includes(session.token));
      assert.equal((await app.inject(request)).statusCode, 200);
      assert.equal(await redis.zcard("pillow:chatreq:due"), 0);
    } finally { await app.close(); }
  });

  it("HTTP returns typed 503 and never 202 when atomic Redis acceptance fails", async () => {
    const app = Fastify();
    const sessions = new InMemorySessionStore();
    const session = await sessions.create({ id: "owner", workspaceId: "workspace", role: "founder", email: "test@example.com", name: "Test" });
    const authenticate = createAuthMiddleware(sessions);
    registerTier0DurabilityErrorHandler(app);
    app.post("/api/pillow/chat", (request, reply) => handleDurablePillowChat(request, reply, { authenticate, probeSharedSessionStore: async () => true }));
    configureChatRequestStore({ get: (k) => redis.get(k), setex: (k, s, v) => redis.setex(k, s, v),
      eval: async () => { throw new Error("synthetic_EVAL_failure"); } }, { requireRedisDurability: true });
    try {
      const response = await app.inject({ method: "POST", url: "/api/pillow/chat", headers: { authorization: `Bearer ${session.token}` },
        payload: { message: "ask", sessionId: "chat" } });
      assert.equal(response.statusCode, 503);
      assert.equal(response.json().code, "PILLOW_DURABILITY_UNAVAILABLE");
      assert.equal(await redis.zcard("pillow:chatreq:due"), 0);
    } finally { configureChatRequestStore(redis, { requireRedisDurability: true }); await app.close(); }
  });
});
