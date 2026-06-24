import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  computeSignalConfidence,
  createGlobalProductSignalModule,
  createInMemoryProductSignalRegistry,
  normalizeProductSignalInput,
} from "../../eye/global-product-signals/index.js";

const WORKSPACE_ID = "ws-m031";

describe("Mission 031 Global Product Signal Registry", () => {
  it("registers a normalized product signal", async () => {
    const module = createGlobalProductSignalModule();
    const signal = await module.normalizeAndRegister(WORKSPACE_ID, {
      productId: "prod-m031-blender",
      source: "amazon",
      strength: 82,
      evidence: [
        {
          kind: "bestseller_rank",
          summary: "Amazon bestseller in kitchen appliances",
          value: "rank-42",
        },
      ],
      metadata: { region: "US" },
    });

    assert.ok(signal.signalId);
    assert.equal(signal.productId, "prod-m031-blender");
    assert.equal(signal.source, "AMAZON");
    assert.equal(signal.strength, 82);
    assert.ok(signal.confidence >= 60);
    assert.equal(signal.evidence.length, 1);
  });

  it("normalizes loose source strings and evidence payloads", () => {
    const normalized = normalizeProductSignalInput({
      productId: "prod-m031-trend",
      source: "google-trends",
      evidence: [
        {
          kind: "search_interest",
          summary: "Rising search interest",
          value: "78",
        },
        {
          kind: "query",
          summary: "Top query",
          value: "portable blender",
        },
      ],
    });

    assert.equal(normalized.source, "GOOGLE_TRENDS");
    assert.equal(normalized.evidence.length, 2);
    assert.ok(normalized.evidence[0]!.evidenceId);
    assert.ok(normalized.evidence[0]!.capturedAt);
    assert.ok(normalized.strength >= 50);
  });

  it("persists evidence with registered signals", async () => {
    const registry = createInMemoryProductSignalRegistry();
    const module = createGlobalProductSignalModule(registry);

    const signal = await module.normalizeAndRegister(WORKSPACE_ID, {
      productId: "prod-m031-reddit",
      source: "REDDIT",
      strength: 70,
      evidence: [
        {
          kind: "discussion_volume",
          summary: "Active subreddit discussion",
          value: "142 posts/week",
          sourceRef: "r/kitchen",
        },
      ],
    });

    const stored = await registry.getById(WORKSPACE_ID, signal.signalId);
    assert.ok(stored);
    assert.equal(stored!.evidence[0]!.sourceRef, "r/kitchen");
    assert.equal(stored!.evidence[0]!.summary, "Active subreddit discussion");
  });

  it("calculates confidence from source reliability, strength, and evidence count", () => {
    const high = computeSignalConfidence("AMAZON", 90, 3);
    const low = computeSignalConfidence("MANUAL", 40, 0);

    assert.ok(high > low);
    assert.ok(high >= 70);
    assert.ok(low <= 50);
  });

  it("filters signals by source in registry list queries", async () => {
    const module = createGlobalProductSignalModule();

    await module.normalizeAndRegister(WORKSPACE_ID, {
      productId: "prod-m031-a",
      source: "TIKTOK",
      strength: 75,
      evidence: [{ kind: "trend", summary: "Viral clip", value: "1.2M views" }],
    });
    await module.normalizeAndRegister(WORKSPACE_ID, {
      productId: "prod-m031-b",
      source: "PINTEREST",
      strength: 68,
      evidence: [{ kind: "pin_velocity", summary: "Pin saves rising", value: "540/day" }],
    });
    await module.normalizeAndRegister(WORKSPACE_ID, {
      productId: "prod-m031-c",
      source: "SUPPLIER",
      strength: 80,
      evidence: [{ kind: "availability", summary: "Supplier in stock", value: "500 units" }],
    });

    const tiktokSignals = await module.listSignals(WORKSPACE_ID, { source: "TIKTOK" });
    const supplierSignals = await module.listSignals(WORKSPACE_ID, { source: "SUPPLIER" });

    assert.equal(tiktokSignals.length, 1);
    assert.equal(tiktokSignals[0]!.source, "TIKTOK");
    assert.equal(supplierSignals.length, 1);
    assert.equal(supplierSignals[0]!.productId, "prod-m031-c");
  });
});
