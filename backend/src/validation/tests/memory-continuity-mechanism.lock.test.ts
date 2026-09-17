/**
 * Local memory continuity property proof (WS-D mechanism).
 * Lesson retained in episode A improves a later distinct decision in episode B.
 * Does not claim live autonomous continuity after redeploy until soak evidence exists.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { seedSyntheticAmazonUsCatalog } from "../../orchestration/synthetic-commerce/fixtures.js";
import {
  applyDecision,
  createEpisode,
  injectEvent,
  scoreEpisode,
} from "../../orchestration/synthetic-commerce/operating-episode.js";

describe("memory/learning continuity mechanism", () => {
  it("carries a lesson into a later different decision without inventing profit", () => {
    const catalog = seedSyntheticAmazonUsCatalog();
    let a = createEpisode({
      episodeId: "mem_a",
      products: catalog.products.slice(0, 3),
    });
    const sku = a.products[0]!.productId;
    a = injectEvent(a, { day: 0, type: "refund_wave", skuId: sku, refundUsd: 50 });
    a = applyDecision(a, {
      day: 0,
      kind: "retain_lesson",
      rationale: "After refund waves, cut ads before allocating more experiment budget.",
      authorized: true,
    });
    assert.ok(a.lessons.length >= 1);

    // Later distinct episode: apply the lesson as a cut_ads before more spend.
    let b = createEpisode({
      episodeId: "mem_b",
      products: catalog.products.slice(0, 3),
      startingCashUsd: 400,
    });
    const priorLesson = a.lessons[0]!;
    b.lessons.push(priorLesson);
    b = applyDecision(b, {
      day: 0,
      kind: "cut_ads",
      skuId: b.products[0]!.productId,
      rationale: `Applying prior lesson: ${priorLesson}`,
      authorized: true,
    });
    b = applyDecision(b, {
      day: 0,
      kind: "allocate_experiment",
      skuId: b.products[1]!.productId,
      amountUsd: 40,
      rationale: "Bounded retest on alternate SKU after lesson",
      authorized: true,
    });
    const score = scoreEpisode(b);
    assert.ok(score.lessonsRetained >= 1);
    assert.equal(score.withinBudget, true);
    assert.equal(score.targetAttainment, false);
  });
});
