import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { ProductEvidenceSummary } from "../../eye/product-evidence-aggregation/models/product-evidence-summary.js";
import {
  createInMemoryTrendRepository,
  createProductTrendModule,
  scoreProductTrend,
} from "../../eye/product-trend-intelligence/index.js";

const WORKSPACE_ID = "ws-m033";
const PRODUCT_ID = "prod-m033-blender";

function buildSummary(
  evidenceScore: number,
  capturedAt: string,
  overrides: Partial<ProductEvidenceSummary> = {},
): ProductEvidenceSummary {
  return {
    id: overrides.id ?? `summary-${capturedAt}`,
    workspaceId: WORKSPACE_ID,
    productId: PRODUCT_ID,
    totalSignals: overrides.totalSignals ?? 3,
    sourceDiversity: overrides.sourceDiversity ?? 60,
    averageStrength: overrides.averageStrength ?? evidenceScore,
    averageConfidence: overrides.averageConfidence ?? 75,
    strongestSource: "AMAZON",
    weakestSource: "REDDIT",
    evidenceScore,
    trendDirection: "stable",
    riskFlags: [],
    sourceBreakdown: [],
    signals: [],
    createdAt: capturedAt,
    updatedAt: capturedAt,
    ...overrides,
  };
}

describe("Mission 033 Product Trend Intelligence Engine", () => {
  it("detects a rising trend from improving evidence snapshots", () => {
    const trend = scoreProductTrend({
      productId: PRODUCT_ID,
      history: [
        buildSummary(52, "2026-06-01T12:00:00.000Z"),
        buildSummary(61, "2026-06-08T12:00:00.000Z"),
        buildSummary(70, "2026-06-15T12:00:00.000Z"),
      ],
      current: buildSummary(82, "2026-06-22T12:00:00.000Z"),
    });

    assert.equal(trend.trendDirection, "RISING");
    assert.ok(trend.trendVelocity > 0);
    assert.ok(trend.trendStrength >= 20);
    assert.ok(trend.momentumScore >= 50);
  });

  it("detects a stable trend from flat evidence snapshots", () => {
    const trend = scoreProductTrend({
      productId: PRODUCT_ID,
      history: [
        buildSummary(68, "2026-06-01T12:00:00.000Z"),
        buildSummary(70, "2026-06-08T12:00:00.000Z"),
      ],
      current: buildSummary(69, "2026-06-15T12:00:00.000Z"),
    });

    assert.equal(trend.trendDirection, "STABLE");
    assert.ok(Math.abs(trend.trendVelocity) < 8);
  });

  it("detects a declining trend from weakening evidence snapshots", () => {
    const trend = scoreProductTrend({
      productId: PRODUCT_ID,
      history: [
        buildSummary(80, "2026-06-01T12:00:00.000Z"),
        buildSummary(72, "2026-06-08T12:00:00.000Z"),
        buildSummary(64, "2026-06-15T12:00:00.000Z"),
      ],
      current: buildSummary(52, "2026-06-22T12:00:00.000Z"),
    });

    assert.equal(trend.trendDirection, "DECLINING");
    assert.ok(trend.trendVelocity < 0);
    assert.ok(trend.trendStrength >= 20);
  });

  it("calculates momentum from recent acceleration", () => {
    const accelerating = scoreProductTrend({
      productId: PRODUCT_ID,
      history: [
        buildSummary(50, "2026-06-01T12:00:00.000Z"),
        buildSummary(55, "2026-06-08T12:00:00.000Z"),
        buildSummary(62, "2026-06-15T12:00:00.000Z"),
      ],
      current: buildSummary(78, "2026-06-22T12:00:00.000Z"),
    });
    const flat = scoreProductTrend({
      productId: PRODUCT_ID,
      history: [
        buildSummary(60, "2026-06-01T12:00:00.000Z"),
        buildSummary(61, "2026-06-08T12:00:00.000Z"),
      ],
      current: buildSummary(60, "2026-06-15T12:00:00.000Z"),
    });

    assert.ok(accelerating.momentumScore > flat.momentumScore);
  });

  it("calculates volatility from snapshot score spread", () => {
    const volatile = scoreProductTrend({
      productId: PRODUCT_ID,
      history: [
        buildSummary(40, "2026-06-01T12:00:00.000Z"),
        buildSummary(85, "2026-06-08T12:00:00.000Z"),
        buildSummary(45, "2026-06-15T12:00:00.000Z"),
      ],
      current: buildSummary(80, "2026-06-22T12:00:00.000Z"),
    });
    const steady = scoreProductTrend({
      productId: PRODUCT_ID,
      history: [
        buildSummary(70, "2026-06-01T12:00:00.000Z"),
        buildSummary(72, "2026-06-08T12:00:00.000Z"),
      ],
      current: buildSummary(71, "2026-06-15T12:00:00.000Z"),
    });

    assert.ok(volatile.volatilityScore > steady.volatilityScore);
  });

  it("persists product trends via module", async () => {
    const repository = createInMemoryTrendRepository();
    const module = createProductTrendModule(repository);
    const current = buildSummary(82, "2026-06-22T12:00:00.000Z");
    const history = [
      buildSummary(60, "2026-06-01T12:00:00.000Z"),
      buildSummary(70, "2026-06-08T12:00:00.000Z"),
    ];

    const created = await module.analyzeAndPersist(WORKSPACE_ID, PRODUCT_ID, current, history);
    const stored = await repository.getByProductId(WORKSPACE_ID, PRODUCT_ID);
    const listed = await module.listTrends(WORKSPACE_ID, { trendDirection: "RISING" });

    assert.ok(stored);
    assert.equal(created.id, stored!.id);
    assert.equal(stored!.productId, PRODUCT_ID);
    assert.equal(stored!.snapshotCount, 3);
    assert.equal(listed.length, 1);
  });
});
