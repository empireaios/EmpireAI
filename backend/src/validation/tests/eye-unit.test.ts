import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EyeConnectorRegistry,
  HealthMonitor,
  RetryPolicy,
  TokenBucketRateLimiter,
  SlidingWindowRateLimiter,
  ConnectorRateLimiterRegistry,
  SignalNormalizationPipeline,
  MockEyeConnector,
  createMockEyeConnector,
  buildSubjectKey,
} from "../../eye/index.js";
import type { EyeRawObservation } from "../../eye/types.js";

describe("Mission 018 Eye — unit tests", () => {
  describe("EyeConnectorRegistry", () => {
    it("registers, lists, and unregisters connectors by provider id", () => {
      const registry = new EyeConnectorRegistry();
      const connector = createMockEyeConnector({ providerId: "test-provider" });

      registry.register(connector);
      assert.equal(registry.list().length, 1);
      assert.equal(registry.listProviderIds()[0], "test-provider");
      assert.ok(registry.has("test-provider"));
      assert.equal(registry.get("test-provider")?.definition.providerName, "Mock Eye Connector");

      assert.throws(() => registry.register(connector), /already registered/);
      assert.ok(registry.unregister("test-provider"));
      assert.equal(registry.list().length, 0);
    });

    it("require() throws for unknown provider", () => {
      const registry = new EyeConnectorRegistry();
      assert.throws(() => registry.require("missing"), /Unknown Eye connector/);
    });
  });

  describe("HealthMonitor", () => {
    it("tracks healthy, degraded, and unhealthy states from consecutive failures", () => {
      const health = new HealthMonitor({ degradedThreshold: 1, unhealthyThreshold: 3 });

      health.recordSuccess("ws-1", "mock-eye", 42);
      assert.equal(health.getHealthState("ws-1", "mock-eye"), "healthy");

      health.recordFailure("ws-1", "mock-eye", "timeout");
      assert.equal(health.getHealthState("ws-1", "mock-eye"), "degraded");

      health.recordFailure("ws-1", "mock-eye", "timeout");
      health.recordFailure("ws-1", "mock-eye", "timeout");
      assert.equal(health.getHealthState("ws-1", "mock-eye"), "unhealthy");

      const record = health.get("ws-1", "mock-eye");
      assert.equal(record?.consecutiveFailures, 3);
      assert.ok(record?.lastFailureAt);
    });

    it("resets to healthy on success after failures", () => {
      const health = new HealthMonitor();
      health.recordFailure("ws-2", "p1", "err");
      health.recordSuccess("ws-2", "p1");
      assert.equal(health.get("ws-2", "p1")?.consecutiveFailures, 0);
      assert.equal(health.getHealthState("ws-2", "p1"), "healthy");
    });
  });

  describe("RetryPolicy", () => {
    it("retries failed operations with exponential backoff", async () => {
      let attempts = 0;
      const retry = new RetryPolicy({
        maxAttempts: 3,
        initialDelayMs: 1,
        maxDelayMs: 10,
        backoffMultiplier: 2,
        jitterRatio: 0,
      });

      const result = await retry.execute(async () => {
        attempts += 1;
        if (attempts < 3) throw new Error("transient");
        return "ok";
      });

      assert.equal(result, "ok");
      assert.equal(attempts, 3);
    });

    it("throws after max attempts exhausted", async () => {
      const retry = new RetryPolicy({ maxAttempts: 2, initialDelayMs: 1, maxDelayMs: 5, backoffMultiplier: 2 });
      await assert.rejects(
        () =>
          retry.execute(async () => {
            throw new Error("permanent");
          }),
        /permanent/,
      );
    });

    it("computeDelayMs grows exponentially up to max", () => {
      const retry = new RetryPolicy({
        maxAttempts: 5,
        initialDelayMs: 100,
        maxDelayMs: 500,
        backoffMultiplier: 2,
        jitterRatio: 0,
      });
      assert.equal(retry.computeDelayMs(1), 100);
      assert.equal(retry.computeDelayMs(2), 200);
      assert.equal(retry.computeDelayMs(3), 400);
      assert.equal(retry.computeDelayMs(4), 500);
    });
  });

  describe("RateLimiter", () => {
    it("token bucket allows bursts up to capacity then blocks", () => {
      const limiter = new TokenBucketRateLimiter({ capacity: 3, windowMs: 60_000 });
      assert.ok(limiter.tryAcquire());
      assert.ok(limiter.tryAcquire());
      assert.ok(limiter.tryAcquire());
      assert.equal(limiter.tryAcquire(), false);
    });

    it("sliding window enforces limit within window", () => {
      const limiter = new SlidingWindowRateLimiter({ limit: 2, windowMs: 1000 });
      assert.ok(limiter.tryAcquire());
      assert.ok(limiter.tryAcquire());
      assert.equal(limiter.tryAcquire(), false);
      assert.equal(limiter.count(), 2);
    });

    it("ConnectorRateLimiterRegistry isolates limiters per connector", () => {
      const registry = new ConnectorRateLimiterRegistry();
      const a = registry.getOrCreate("conn-a", { capacity: 1, windowMs: 60_000 });
      const b = registry.getOrCreate("conn-b", { capacity: 5, windowMs: 60_000 });
      assert.ok(a.tryAcquire());
      assert.equal(a.tryAcquire(), false);
      assert.ok(b.tryAcquire());
    });
  });

  describe("SignalNormalizationPipeline", () => {
    it("normalizes raw product observations into ProductSignal envelopes", () => {
      const pipeline = new SignalNormalizationPipeline();
      const observation: EyeRawObservation = {
        observationId: "obs-1",
        providerId: "mock-eye",
        domain: "product",
        payload: {
          providerName: "Mock",
          productTitle: "USB Blender",
          category: "Kitchen",
          demandIndex: 80,
          competitionIndex: 40,
          marginEstimatePct: 35,
          trendDirection: "rising",
        },
        fetchedAt: new Date().toISOString(),
        mock: true,
      };

      const envelope = pipeline.normalizeProductObservation("ws-norm", observation);
      assert.equal(envelope.domain, "product");
      assert.equal(envelope.payload.productTitle, "USB Blender");
      assert.equal(envelope.payload.category, "Kitchen");
      assert.equal(envelope.payload.demandIndex, 80);
      assert.ok(envelope.payload.confidence <= 60);
      assert.equal(envelope.provenance.observationIds[0], "obs-1");
    });

    it("buildSubjectKey is deterministic for same inputs", () => {
      const a = buildSubjectKey("product", "mock", { productTitle: "A", category: "B" });
      const b = buildSubjectKey("product", "mock", { productTitle: "A", category: "B" });
      const c = buildSubjectKey("product", "mock", { productTitle: "X", category: "B" });
      assert.equal(a, b);
      assert.notEqual(a, c);
    });
  });

  describe("MockEyeConnector", () => {
    it("returns deterministic mock observations for product domain", async () => {
      const connector = new MockEyeConnector({ providerId: "mock-unit" });
      const ctx = { workspaceId: "ws-mock", correlationId: "c-1" };
      const obs = await connector.observe(ctx, {
        domain: "product",
        query: { productTitle: "Probe Item", category: "Gadgets" },
      });

      assert.equal(obs.length, 1);
      assert.equal(obs[0]?.mock, true);
      assert.equal(obs[0]?.domain, "product");
      assert.ok(typeof obs[0]?.payload.demandIndex === "number");
    });

    it("throws for configured failure attempts", async () => {
      const connector = new MockEyeConnector({ failForAttempts: 2 });
      const ctx = { workspaceId: "ws-fail", correlationId: "c-2" };
      const req = { domain: "product" as const, query: { productTitle: "X", category: "Y" } };

      await assert.rejects(() => connector.observe(ctx, req), /simulated failure/);
      await assert.rejects(() => connector.observe(ctx, req), /simulated failure/);
      const obs = await connector.observe(ctx, req);
      assert.equal(obs.length, 1);
    });

    it("returns empty array for unsupported domains", async () => {
      const connector = new MockEyeConnector({ supportedDomains: ["product"] });
      const obs = await connector.observe(
        { workspaceId: "ws", correlationId: "c" },
        { domain: "risk", query: {} },
      );
      assert.deepEqual(obs, []);
    });
  });
});
