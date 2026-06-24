import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AmazonConnector,
  EyeConnectorRuntime,
  AMAZON_PROVIDER_ID,
  MOCK_AMAZON_PRODUCTS,
  MOCK_PRICE_HISTORIES,
  MOCK_PRODUCT_RANKINGS,
  MOCK_REVIEW_STATISTICS,
  SAMPLE_ASINS,
  mapAmazonToObservationPayload,
  mapObservationPayloadToProductSignal,
  type ProductSignal,
} from "../../eye/index.js";
import {
  formatEmpireScoreExplanation,
  rankProducts,
  scoreProductSignal,
  selectTopOpportunities,
} from "../../intelligence/product-scoring-engine/index.js";

function amazonSignalForAsin(
  asin: string,
  workspaceId: string,
  signalSuffix: string,
): ProductSignal {
  const payload = mapAmazonToObservationPayload(
    MOCK_AMAZON_PRODUCTS[asin]!,
    MOCK_PRODUCT_RANKINGS[asin]!,
    MOCK_REVIEW_STATISTICS[asin]!,
    MOCK_PRICE_HISTORIES[asin]!,
  );
  return mapObservationPayloadToProductSignal(
    payload,
    workspaceId,
    `obs-${signalSuffix}`,
    new Date().toISOString(),
  );
}

describe("Mission 020 Product Scoring Engine — integration tests", () => {
  describe("Amazon fixture pipeline → Empire Score", () => {
    it("scores Amazon-mapped ProductSignals end-to-end", () => {
      const blender = amazonSignalForAsin(SAMPLE_ASINS.USB_BLENDER, "ws-pse-int", "blender");
      const earbuds = amazonSignalForAsin(SAMPLE_ASINS.WIRELESS_EARBUDS, "ws-pse-int", "earbuds");

      const blenderScore = scoreProductSignal(blender);
      const earbudsScore = scoreProductSignal(earbuds);

      assert.ok(blenderScore.empireScore >= 0 && blenderScore.empireScore <= 100);
      assert.ok(earbudsScore.empireScore >= 0 && earbudsScore.empireScore <= 100);
      assert.equal(blenderScore.signalReference.providerId, AMAZON_PROVIDER_ID);
      assert.equal(blenderScore.dimensions.length, 9);

      const explanation = formatEmpireScoreExplanation(blenderScore);
      assert.match(explanation, /^Empire Score:/);
      assert.ok(explanation.split("\n").length >= 4);
    });

    it("ranks and selects top opportunities from multiple Amazon signals", () => {
      const signals = [
        amazonSignalForAsin(SAMPLE_ASINS.USB_BLENDER, "ws-pse-rank", "1"),
        amazonSignalForAsin(SAMPLE_ASINS.WIRELESS_EARBUDS, "ws-pse-rank", "2"),
        amazonSignalForAsin(SAMPLE_ASINS.YOGA_MAT, "ws-pse-rank", "3"),
      ];

      const scores = signals.map((signal) => scoreProductSignal(signal));
      const ranked = rankProducts(scores);
      assert.equal(ranked.length, 3);
      assert.ok(ranked[0]!.empireScore >= ranked[1]!.empireScore);
      assert.ok(ranked[1]!.empireScore >= ranked[2]!.empireScore);

      const topTwo = selectTopOpportunities(scores, 2, { minEmpireScore: 0, minConfidence: 0 });
      assert.equal(topTwo.length, 2);
      assert.deepEqual(
        topTwo.map((s) => s.signalReference.signalId),
        ranked.slice(0, 2).map((s) => s.signalReference.signalId),
      );
    });
  });

  describe("Eye runtime poll → score → explain", () => {
    it("scores ProductSignals emitted by Amazon connector poll", async () => {
      const runtime = new EyeConnectorRuntime({
        retry: { maxAttempts: 1, initialDelayMs: 1, maxDelayMs: 5, backoffMultiplier: 2 },
      });
      runtime.register(new AmazonConnector());

      const schedule = runtime.scheduler.upsertSchedule({
        workspaceId: "ws-pse-eye",
        providerId: AMAZON_PROVIDER_ID,
        domain: "product",
        intervalSec: 3600,
        queryTemplate: {
          productTitle: "Portable USB Rechargeable Blender",
          category: "Kitchen & Dining",
        },
        enabled: false,
      });

      const result = await runtime.scheduler.triggerNow(schedule.id, "pse-int-corr");
      assert.equal(result.success, true);

      const productSignals = runtime.scheduler.extractProductSignals(result.signals);
      assert.ok(productSignals.length >= 1);

      const scores = productSignals.map((signal) => scoreProductSignal(signal));
      const top = selectTopOpportunities(scores, 1);

      assert.equal(top.length, 1);
      const explanation = formatEmpireScoreExplanation(top[0]!);
      assert.ok(explanation.includes("Empire Score:"));
      assert.ok(top[0]!.reasons.length >= 2);

      runtime.shutdown();
    });
  });
});
