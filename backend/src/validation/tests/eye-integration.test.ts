import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EyeConnectorRuntime,
  HealthMonitor,
  MockEyeConnector,
  wrapProductIntelligenceConnector,
  type ProductSignal,
} from "../../eye/index.js";
import { ProductIntelligenceConnectorRegistry } from "../../intelligence/connectors/index.js";

describe("Mission 018 Eye — integration tests", () => {
  describe("end-to-end poll pipeline", () => {
    it("registers MockConnector, polls, normalizes, and emits ProductSignal", async () => {
      const runtime = new EyeConnectorRuntime({
        retry: { maxAttempts: 1, initialDelayMs: 1, maxDelayMs: 5, backoffMultiplier: 2 },
      });
      const connector = new MockEyeConnector({ providerId: "mock-integration" });
      runtime.register(connector);

      const emittedSignals: ProductSignal[] = [];
      runtime.events.on("signal.emitted", () => {
        /* collected via poll result */
      });

      const schedule = runtime.scheduler.upsertSchedule({
        workspaceId: "ws-eye-int",
        providerId: "mock-integration",
        domain: "product",
        intervalSec: 3600,
        queryTemplate: {
          productTitle: "Portable USB Blender",
          category: "Kitchen & Dining",
        },
        enabled: false,
      });

      const result = await runtime.scheduler.triggerNow(schedule.id, "integration-corr-1");

      assert.equal(result.success, true);
      assert.equal(result.observations, 1);
      assert.ok(result.signals.length >= 1);

      const productSignals = runtime.scheduler.extractProductSignals(result.signals);
      assert.equal(productSignals.length, 1);
      const signal = productSignals[0]!;
      emittedSignals.push(signal);

      assert.equal(signal.productTitle, "Portable USB Blender");
      assert.equal(signal.category, "Kitchen & Dining");
      assert.equal(signal.workspaceId, "ws-eye-int");
      assert.equal(signal.providerId, "mock-integration");
      assert.ok(signal.demandIndex >= 0 && signal.demandIndex <= 100);
      assert.ok(signal.observationIds.length >= 1);
      assert.equal(signal.mock, true);

      assert.equal(runtime.health.getHealthState("ws-eye-int", "mock-integration"), "healthy");

      const events = runtime.events.getHistory({ workspaceId: "ws-eye-int" });
      assert.ok(events.some((e) => e.type === "poll.started"));
      assert.ok(events.some((e) => e.type === "poll.completed"));
      assert.ok(events.some((e) => e.type === "signal.emitted"));

      runtime.shutdown();
    });

    it("retries on failure then succeeds and normalizes", async () => {
      const runtime = new EyeConnectorRuntime({
        retry: {
          maxAttempts: 4,
          initialDelayMs: 1,
          maxDelayMs: 10,
          backoffMultiplier: 2,
          jitterRatio: 0,
        },
      });
      const connector = new MockEyeConnector({
        providerId: "mock-retry",
        failForAttempts: 2,
      });
      runtime.register(connector);

      const schedule = runtime.scheduler.upsertSchedule({
        workspaceId: "ws-retry",
        providerId: "mock-retry",
        domain: "product",
        intervalSec: 60,
        queryTemplate: { productTitle: "Retry Probe", category: "Test" },
        enabled: false,
      });

      const result = await runtime.scheduler.triggerNow(schedule.id);
      assert.equal(result.success, true);
      assert.equal(result.signals.length, 1);
      assert.equal(result.signals[0]?.payload.productTitle, "Retry Probe");
      assert.equal(connector.getAttemptCount(), 3);

      runtime.shutdown();
    });

    it("records unhealthy health after repeated poll failures", async () => {
      const runtime = new EyeConnectorRuntime({
        retry: { maxAttempts: 1, initialDelayMs: 1, maxDelayMs: 5, backoffMultiplier: 2 },
        health: new HealthMonitor({ degradedThreshold: 1, unhealthyThreshold: 2 }),
      });
      runtime.register(
        new MockEyeConnector({ providerId: "mock-fail-always", failForAttempts: 999 }),
      );

      const schedule = runtime.scheduler.upsertSchedule({
        workspaceId: "ws-unhealthy",
        providerId: "mock-fail-always",
        domain: "product",
        intervalSec: 60,
        queryTemplate: { productTitle: "Fail", category: "Test" },
        enabled: false,
      });

      await runtime.scheduler.triggerNow(schedule.id);
      await runtime.scheduler.triggerNow(schedule.id);

      assert.equal(runtime.health.getHealthState("ws-unhealthy", "mock-fail-always"), "unhealthy");

      const failedEvents = runtime.events.getHistory({ type: "poll.failed" });
      assert.ok(failedEvents.length >= 2);

      runtime.shutdown();
    });
  });

  describe("M012 adapter bridge", () => {
    it("wrapProductIntelligenceConnector produces normalizable observations", async () => {
      const legacyRegistry = new ProductIntelligenceConnectorRegistry();
      const legacy = legacyRegistry.require("amazon");
      const eyeConnector = wrapProductIntelligenceConnector(legacy);

      const runtime = new EyeConnectorRuntime();
      runtime.register(eyeConnector);

      const schedule = runtime.scheduler.upsertSchedule({
        workspaceId: "ws-bridge",
        providerId: "amazon",
        domain: "product",
        intervalSec: 3600,
        queryTemplate: {
          productTitle: "Wireless Earbuds",
          category: "Electronics",
        },
        enabled: false,
      });

      const result = await runtime.scheduler.triggerNow(schedule.id);
      assert.equal(result.success, true);
      const products = runtime.scheduler.extractProductSignals(result.signals);
      assert.equal(products.length, 1);
      assert.equal(products[0]?.providerId, "amazon");
      assert.equal(products[0]?.mock, true);

      runtime.shutdown();
    });
  });
});
