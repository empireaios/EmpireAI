import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ProductSignal } from "../../eye/contract/product-signal.js";
import {
  DEFAULT_SCORING_WEIGHTS,
  SCORING_DIMENSIONS,
  aggregateReasons,
  computeEmpireScore,
  computeScoringConfidence,
  formatEmpireScoreExplanation,
  rankProducts,
  resolveWeightConfig,
  scoreAdvertisementPotential,
  scoreAllDimensions,
  scoreBrandability,
  scoreCompetition,
  scoreDemand,
  scoreMargin,
  scoreProductSignal,
  scoreRisk,
  scoreShipping,
  scoreSupplierTrust,
  scoreTrendMomentum,
  selectTopOpportunities,
} from "../../intelligence/product-scoring-engine/index.js";

function buildSignal(overrides: Partial<ProductSignal> = {}): ProductSignal {
  return {
    signalId: "sig-test-1",
    providerId: "amazon-product-intelligence",
    providerName: "Amazon Product Intelligence",
    workspaceId: "ws-scoring-unit",
    productTitle: "Portable USB Rechargeable Blender",
    category: "Kitchen & Dining",
    demandIndex: 78,
    competitionIndex: 32,
    marginEstimatePct: 42,
    estimatedSellingPriceCents: 4999,
    monthlyOrdersEstimate: 2400,
    trendDirection: "rising",
    listingCount: 120,
    avgRating: 4.4,
    confidence: 58,
    mock: true,
    fetchedAt: "2026-06-23T12:00:00.000Z",
    normalizedAt: "2026-06-23T12:00:01.000Z",
    observationIds: ["obs-1"],
    subjectKey: "product:amazon:usb-blender",
    ...overrides,
  };
}

describe("Mission 020 Product Scoring Engine — unit tests", () => {
  describe("weight configuration", () => {
    it("provides default weights for all nine dimensions", () => {
      for (const dimension of SCORING_DIMENSIONS) {
        assert.ok(DEFAULT_SCORING_WEIGHTS[dimension] > 0);
      }
      const total = Object.values(DEFAULT_SCORING_WEIGHTS).reduce((sum, w) => sum + w, 0);
      assert.equal(total, 100);
    });

    it("merges workspace-level weight overrides", () => {
      const resolved = resolveWeightConfig({ demand: 30, risk: 20 });
      assert.equal(resolved.demand, 30);
      assert.equal(resolved.risk, 20);
      assert.equal(resolved.margin, DEFAULT_SCORING_WEIGHTS.margin);
    });
  });

  describe("dimension scorers", () => {
    it("scores demand from demand index and order volume", () => {
      const high = scoreDemand(buildSignal({ demandIndex: 85, monthlyOrdersEstimate: 3000 }), 18);
      const low = scoreDemand(buildSignal({ demandIndex: 25, monthlyOrdersEstimate: 50 }), 18);
      assert.ok(high.score > low.score);
      assert.ok(high.reasons.some((r) => r.includes("High demand")));
      assert.ok(low.reasons.some((r) => r.includes("Weak demand")));
    });

    it("inverts competition index for opportunity scoring", () => {
      const lowCompetition = scoreCompetition(buildSignal({ competitionIndex: 20 }), 14);
      const highCompetition = scoreCompetition(buildSignal({ competitionIndex: 80 }), 14);
      assert.ok(lowCompetition.score > highCompetition.score);
      assert.ok(lowCompetition.reasons.some((r) => r.includes("Low competition")));
    });

    it("scores margin tiers with readable reasons", () => {
      const strong = scoreMargin(buildSignal({ marginEstimatePct: 50 }), 16);
      const weak = scoreMargin(buildSignal({ marginEstimatePct: 12 }), 16);
      assert.ok(strong.score > weak.score);
      assert.ok(strong.reasons.some((r) => r.includes("Strong gross margin")));
      assert.ok(weak.reasons.some((r) => r.includes("thin margin")));
    });

    it("scores supplier trust with mock and confidence penalties", () => {
      const trusted = scoreSupplierTrust(
        buildSignal({ mock: false, confidence: 75, avgRating: 4.5 }),
        12,
      );
      const untrusted = scoreSupplierTrust(
        buildSignal({ mock: true, confidence: 30, avgRating: 3.2 }),
        12,
      );
      assert.ok(trusted.score > untrusted.score);
      assert.ok(untrusted.reasons.some((r) => r.includes("Mock supplier data")));
    });

    it("scores shipping from category and price profile", () => {
      const favorable = scoreShipping(
        buildSignal({
          category: "Electronics Accessories",
          estimatedSellingPriceCents: 8900,
        }),
        10,
      );
      const unfavorable = scoreShipping(
        buildSignal({
          category: "Outdoor Furniture",
          estimatedSellingPriceCents: 1500,
          marginEstimatePct: 18,
        }),
        10,
      );
      assert.ok(favorable.score > unfavorable.score);
    });

    it("scores brandability from title and category signals", () => {
      const brandable = scoreBrandability(
        buildSignal({
          productTitle: "BlendGo Pro",
          category: "Beauty & Wellness",
          avgRating: 4.6,
        }),
        10,
      );
      const generic = scoreBrandability(
        buildSignal({
          productTitle: "Generic Universal Multi-Purpose Standard Gadget Tool",
          category: "Miscellaneous",
        }),
        10,
      );
      assert.ok(brandable.score > generic.score);
    });

    it("scores advertisement potential from demand, margin, and trend", () => {
      const strong = scoreAdvertisementPotential(
        buildSignal({ demandIndex: 80, marginEstimatePct: 45, trendDirection: "rising" }),
        10,
      );
      const weak = scoreAdvertisementPotential(
        buildSignal({ demandIndex: 30, marginEstimatePct: 15, trendDirection: "falling" }),
        10,
      );
      assert.ok(strong.score > weak.score);
    });

    it("scores trend momentum by direction", () => {
      const rising = scoreTrendMomentum(buildSignal({ trendDirection: "rising" }), 8);
      const falling = scoreTrendMomentum(buildSignal({ trendDirection: "falling" }), 8);
      assert.ok(rising.score > falling.score);
      assert.ok(falling.reasons.some((r) => r.includes("Declining trend momentum")));
    });

    it("scores risk inversely — lower risk yields higher score", () => {
      const safe = scoreRisk(
        buildSignal({
          competitionIndex: 25,
          marginEstimatePct: 45,
          trendDirection: "rising",
          mock: false,
          confidence: 70,
        }),
        12,
      );
      const risky = scoreRisk(
        buildSignal({
          competitionIndex: 85,
          marginEstimatePct: 12,
          trendDirection: "falling",
          mock: true,
          confidence: 25,
        }),
        12,
      );
      assert.ok(safe.score > risky.score);
      assert.ok(risky.reasons.some((r) => r.includes("Elevated risk")));
    });
  });

  describe("score calculator", () => {
    it("computes weighted empire score from all dimensions", () => {
      const signal = buildSignal();
      const dimensions = scoreAllDimensions(signal, DEFAULT_SCORING_WEIGHTS);
      assert.equal(dimensions.length, 9);
      const empireScore = computeEmpireScore(dimensions);
      assert.ok(empireScore >= 0 && empireScore <= 100);
    });

    it("scoreProductSignal returns complete ProductScore model", () => {
      const result = scoreProductSignal(buildSignal());
      assert.ok(result.empireScore >= 0 && result.empireScore <= 100);
      assert.equal(result.dimensions.length, 9);
      assert.ok(result.confidence >= 0 && result.confidence <= 100);
      assert.ok(result.scoredAt.length > 0);
      assert.equal(result.signalReference.signalId, "sig-test-1");
      assert.ok(result.reasons.length >= 3);
    });

    it("handles sparse ProductSignal without crashing", () => {
      const sparse = buildSignal({
        estimatedSellingPriceCents: undefined,
        monthlyOrdersEstimate: undefined,
        listingCount: undefined,
        avgRating: undefined,
        demandIndex: 0,
        marginEstimatePct: 0,
        confidence: 0,
      });
      const result = scoreProductSignal(sparse);
      assert.ok(result.empireScore >= 0);
      assert.ok(result.confidence < 50);
    });
  });

  describe("confidence scorer", () => {
    it("returns higher confidence for complete signals", () => {
      const complete = buildSignal();
      const sparse = buildSignal({
        estimatedSellingPriceCents: undefined,
        monthlyOrdersEstimate: undefined,
        listingCount: undefined,
        avgRating: undefined,
      });
      const completeConfidence = computeScoringConfidence(
        complete,
        scoreAllDimensions(complete, DEFAULT_SCORING_WEIGHTS),
      );
      const sparseConfidence = computeScoringConfidence(
        sparse,
        scoreAllDimensions(sparse, DEFAULT_SCORING_WEIGHTS),
      );
      assert.ok(completeConfidence > sparseConfidence);
    });
  });

  describe("explanation formatter", () => {
    it("formats empire score with prefixed reason lines", () => {
      const score = scoreProductSignal(buildSignal());
      const explanation = formatEmpireScoreExplanation(score);
      assert.match(explanation, /^Empire Score: \d+\.\d$/m);
      assert.match(explanation, /^Reasons:$/m);
      assert.ok(explanation.includes("+"));
      assert.ok(aggregateReasons(score.dimensions).every((r) => score.reasons.includes(r)));
    });
  });

  describe("ranking and top opportunity selection", () => {
    it("ranks products by empire score descending", () => {
      const high = scoreProductSignal(buildSignal({ signalId: "high", demandIndex: 90 }));
      const low = scoreProductSignal(buildSignal({ signalId: "low", demandIndex: 20 }));
      const ranked = rankProducts([low, high]);
      assert.equal(ranked[0]?.signalReference.signalId, "high");
    });

    it("uses confidence as tie-breaker when empire scores match", () => {
      const baseScore = scoreProductSignal(buildSignal({ signalId: "base" }));
      const a: typeof baseScore = {
        ...baseScore,
        signalReference: { ...baseScore.signalReference, signalId: "a", productTitle: "Alpha Product" },
        confidence: 40,
      };
      const b: typeof baseScore = {
        ...baseScore,
        signalReference: { ...baseScore.signalReference, signalId: "b", productTitle: "Beta Product" },
        confidence: 80,
      };
      const ranked = rankProducts([a, b]);
      assert.equal(ranked[0]?.signalReference.signalId, "b");
    });

    it("selects top N with minimum score and confidence thresholds", () => {
      const scores = [
        scoreProductSignal(buildSignal({ signalId: "top", demandIndex: 90, confidence: 70 })),
        scoreProductSignal(buildSignal({ signalId: "mid", demandIndex: 55, confidence: 55 })),
        scoreProductSignal(buildSignal({ signalId: "low", demandIndex: 15, confidence: 20 })),
      ];
      const top = selectTopOpportunities(scores, 2, { minEmpireScore: 50, minConfidence: 50 });
      assert.equal(top.length, 2);
      assert.ok(top.every((s) => s.empireScore >= 50 && s.confidence >= 50));
      assert.equal(top[0]?.signalReference.signalId, "top");
    });
  });
});
