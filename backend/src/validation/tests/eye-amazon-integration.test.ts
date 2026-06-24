import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  EyeConnectorRuntime,
  AmazonConnector,
  AMAZON_PROVIDER_ID,
  type ProductSignal,
} from "../../eye/index.js";

describe("Mission 019 Amazon — integration tests", () => {
  describe("end-to-end Amazon poll pipeline", () => {
    it("registers AmazonConnector, polls, normalizes, and emits ProductSignal", async () => {
      const runtime = new EyeConnectorRuntime({
        retry: { maxAttempts: 1, initialDelayMs: 1, maxDelayMs: 5, backoffMultiplier: 2 },
      });
      runtime.register(new AmazonConnector());

      const schedule = runtime.scheduler.upsertSchedule({
        workspaceId: "ws-amazon-int",
        providerId: AMAZON_PROVIDER_ID,
        domain: "product",
        intervalSec: 3600,
        queryTemplate: {
          productTitle: "Portable USB Rechargeable Blender",
          category: "Kitchen & Dining",
        },
        enabled: false,
      });

      const result = await runtime.scheduler.triggerNow(schedule.id, "amazon-int-corr-1");

      assert.equal(result.success, true);
      assert.equal(result.observations, 1);
      assert.ok(result.signals.length >= 1);

      const productSignals = runtime.scheduler.extractProductSignals(result.signals);
      assert.equal(productSignals.length, 1);

      const signal: ProductSignal = productSignals[0]!;
      assert.equal(signal.providerId, AMAZON_PROVIDER_ID);
      assert.equal(signal.workspaceId, "ws-amazon-int");
      assert.equal(signal.category, "Kitchen & Dining");
      assert.ok(signal.demandIndex >= 0 && signal.demandIndex <= 100);
      assert.ok(signal.competitionIndex >= 0 && signal.competitionIndex <= 100);
      assert.equal(signal.mock, true);
      assert.ok(signal.observationIds.length >= 1);

      assert.equal(runtime.health.getHealthState("ws-amazon-int", AMAZON_PROVIDER_ID), "healthy");

      const events = runtime.events.getHistory({ workspaceId: "ws-amazon-int" });
      assert.ok(events.some((e) => e.type === "poll.started"));
      assert.ok(events.some((e) => e.type === "poll.completed"));
      assert.ok(events.some((e) => e.type === "signal.emitted"));

      runtime.shutdown();
    });

    it("discover() returns observations for bestseller category seed", async () => {
      const connector = new AmazonConnector();
      const discovered = await connector.discover!(
        { workspaceId: "ws-discover", correlationId: "disc-1" },
        "product",
        { categoryId: "kitchen-blenders", workspaceId: "ws-discover" },
      );

      assert.ok(discovered.length >= 2);
      assert.ok(discovered.every((o) => o.providerId === AMAZON_PROVIDER_ID));
      assert.ok(discovered.every((o) => o.mock === true));
    });
  });
});
