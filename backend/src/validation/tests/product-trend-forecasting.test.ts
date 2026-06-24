import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { ProductTrend } from "../../eye/product-trend-intelligence/models/product-trend.js";
import {
  createInMemoryForecastRepository,
  createProductTrendForecastModule,
  scoreProductTrendForecast,
} from "../../eye/product-trend-forecasting/index.js";

const WORKSPACE_ID = "ws-m034";
const PRODUCT_ID = "prod-m034-blender";
const TIMESTAMP = "2026-06-23T12:00:00.000Z";

function buildTrend(
  overrides: Partial<ProductTrend> & Pick<ProductTrend, "trendDirection" | "trendVelocity">,
): ProductTrend {
  return {
    id: overrides.id ?? `trend-${overrides.updatedAt ?? TIMESTAMP}`,
    workspaceId: WORKSPACE_ID,
    productId: PRODUCT_ID,
    trendDirection: overrides.trendDirection,
    trendVelocity: overrides.trendVelocity,
    trendStrength: overrides.trendStrength ?? 60,
    trendConfidence: overrides.trendConfidence ?? 75,
    momentumScore: overrides.momentumScore ?? 60,
    volatilityScore: overrides.volatilityScore ?? 20,
    snapshotCount: overrides.snapshotCount ?? 3,
    signals: overrides.signals ?? [],
    createdAt: overrides.createdAt ?? TIMESTAMP,
    updatedAt: overrides.updatedAt ?? TIMESTAMP,
  };
}

describe("Mission 034 Product Trend Forecasting Engine", () => {
  it("forecasts a rising product trend", () => {
    const forecast = scoreProductTrendForecast({
      history: [
        buildTrend({
          id: "trend-1",
          trendDirection: "RISING",
          trendVelocity: 6,
          momentumScore: 55,
          updatedAt: "2026-06-01T12:00:00.000Z",
        }),
        buildTrend({
          id: "trend-2",
          trendDirection: "RISING",
          trendVelocity: 10,
          momentumScore: 65,
          updatedAt: "2026-06-08T12:00:00.000Z",
        }),
      ],
      current: buildTrend({
        id: "trend-3",
        trendDirection: "RISING",
        trendVelocity: 14,
        momentumScore: 78,
        trendStrength: 72,
        updatedAt: "2026-06-15T12:00:00.000Z",
      }),
    });

    assert.ok(["RISING", "STRONGLY_RISING"].includes(forecast.forecastDirection));
    assert.ok(forecast.opportunityProjection >= 60);
    assert.ok(forecast.momentumProjection >= 70);
  });

  it("forecasts a stable product trend", () => {
    const forecast = scoreProductTrendForecast({
      history: [
        buildTrend({
          id: "trend-1",
          trendDirection: "STABLE",
          trendVelocity: 1,
          momentumScore: 52,
          updatedAt: "2026-06-01T12:00:00.000Z",
        }),
      ],
      current: buildTrend({
        id: "trend-2",
        trendDirection: "STABLE",
        trendVelocity: 2,
        momentumScore: 54,
        updatedAt: "2026-06-08T12:00:00.000Z",
      }),
    });

    assert.equal(forecast.forecastDirection, "STABLE");
    assert.equal(forecast.recommendedAction, "WATCH");
  });

  it("forecasts a declining product trend", () => {
    const forecast = scoreProductTrendForecast({
      history: [
        buildTrend({
          id: "trend-1",
          trendDirection: "DECLINING",
          trendVelocity: -6,
          momentumScore: 45,
          updatedAt: "2026-06-01T12:00:00.000Z",
        }),
        buildTrend({
          id: "trend-2",
          trendDirection: "DECLINING",
          trendVelocity: -10,
          momentumScore: 40,
          updatedAt: "2026-06-08T12:00:00.000Z",
        }),
      ],
      current: buildTrend({
        id: "trend-3",
        trendDirection: "DECLINING",
        trendVelocity: -14,
        momentumScore: 35,
        volatilityScore: 45,
        updatedAt: "2026-06-15T12:00:00.000Z",
      }),
    });

    assert.ok(["DECLINING", "STRONGLY_DECLINING"].includes(forecast.forecastDirection));
    assert.equal(forecast.recommendedAction, "AVOID");
    assert.ok(forecast.riskProjection >= 30);
  });

  it("projects opportunity from momentum and projected velocity", () => {
    const rising = scoreProductTrendForecast({
      history: [],
      current: buildTrend({
        trendDirection: "RISING",
        trendVelocity: 12,
        momentumScore: 80,
        trendStrength: 75,
      }),
    });
    const declining = scoreProductTrendForecast({
      history: [],
      current: buildTrend({
        trendDirection: "DECLINING",
        trendVelocity: -12,
        momentumScore: 35,
        trendStrength: 40,
      }),
    });

    assert.ok(rising.opportunityProjection > declining.opportunityProjection);
  });

  it("projects risk from volatility and declining movement", () => {
    const risky = scoreProductTrendForecast({
      history: [
        buildTrend({
          trendDirection: "DECLINING",
          trendVelocity: -8,
          volatilityScore: 55,
          updatedAt: "2026-06-01T12:00:00.000Z",
        }),
      ],
      current: buildTrend({
        trendDirection: "DECLINING",
        trendVelocity: -11,
        volatilityScore: 60,
        updatedAt: "2026-06-08T12:00:00.000Z",
      }),
    });
    const stable = scoreProductTrendForecast({
      history: [],
      current: buildTrend({
        trendDirection: "STABLE",
        trendVelocity: 1,
        volatilityScore: 15,
      }),
    });

    assert.ok(risky.riskProjection > stable.riskProjection);
  });

  it("persists forecasts via module", async () => {
    const repository = createInMemoryForecastRepository();
    const module = createProductTrendForecastModule(repository);
    const current = buildTrend({
      id: "trend-current",
      trendDirection: "RISING",
      trendVelocity: 13,
      momentumScore: 76,
    });

    const created = await module.forecastAndPersist(WORKSPACE_ID, current, []);
    const stored = await repository.getByProductId(WORKSPACE_ID, PRODUCT_ID);
    const listed = await module.listForecasts(WORKSPACE_ID, { productId: PRODUCT_ID });

    assert.ok(stored);
    assert.equal(created.id, stored!.id);
    assert.equal(stored!.productId, PRODUCT_ID);
    assert.equal(stored!.trendId, current.id);
    assert.equal(listed.length, 1);
  });
});
