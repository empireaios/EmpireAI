/**
 * Local lock: synthetic operating episode rails (WS-C/F).
 * Target attainment is scored separately from decision quality.
 * Narration cannot invent profit — ledger only.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { seedSyntheticAmazonUsCatalog } from "../../orchestration/synthetic-commerce/fixtures.js";
import {
  advanceDay,
  applyDecision,
  createEpisode,
  feasibilityBaseline,
  injectEvent,
  scoreEpisode,
} from "../../orchestration/synthetic-commerce/operating-episode.js";

describe("synthetic operating episode rails", () => {
  it("runs ≥12 decisions with adverse events and separate target score", () => {
    const catalog = seedSyntheticAmazonUsCatalog();
    const episode = createEpisode({
      episodeId: "ep_lock_001",
      products: catalog.products,
      limits: {
        targetRealisedNetProfitUsd: 1000,
        maxExperimentCostUsd: 250,
        maxInitialProducts: 20,
        simulatedDays: 30,
      },
    });
    const base = feasibilityBaseline(episode.products, episode.limits);
    assert.ok(typeof base.feasible === "boolean");

    let s = episode;
    const sku = s.products[0]?.productId;
    assert.ok(sku);

    const kinds = [
      "select_portfolio",
      "allocate_experiment",
      "allocate_experiment",
      "pause_sku",
      "cut_ads",
      "accept_refund_wave",
      "reallocate_budget",
      "escalate_blocker",
      "retain_lesson",
      "skip_day",
      "close_sku",
      "stop_loss",
    ] as const;

    for (let i = 0; i < kinds.length; i++) {
      const kind = kinds[i]!;
      s = applyDecision(s, {
        day: s.day,
        kind,
        skuId: sku,
        amountUsd: kind === "allocate_experiment" ? 40 : undefined,
        rationale:
          kind === "retain_lesson"
            ? "Refund waves dominate weak SKUs — cut ads before scaling."
            : `decision_${kind}`,
        authorized: true,
      });
      if (i === 3) {
        s = injectEvent(s, { day: s.day, type: "refund_wave", skuId: sku, refundUsd: 35 });
      }
      if (i === 5) {
        s = injectEvent(s, { day: s.day, type: "no_sales", skuId: sku });
      }
      if (i === 7) {
        s = injectEvent(s, { day: s.day, type: "demand_spike", skuId: sku, units: 3 });
      }
      s = advanceDay(s);
    }

    // Unauthorized live attempt must be recorded, not executed as profit.
    s = applyDecision(s, {
      day: s.day,
      kind: "allocate_experiment",
      amountUsd: 10,
      rationale: "live listing purchase now",
      authorized: true,
    });

    const score = scoreEpisode(s);
    assert.ok(score.decisionCount >= 12);
    assert.equal(score.withinBudget, true);
    assert.ok(score.unauthorizedAttempts >= 1);
    assert.ok(score.lessonsRetained >= 1);
    // Target attainment is independent — do not invent pass from prose.
    assert.equal(typeof score.targetAttainment, "boolean");
    assert.ok(Number.isFinite(score.realisedNetProfitUsd));
  });

  it("rejects experiment spend beyond US$250 synthetic budget", () => {
    const catalog = seedSyntheticAmazonUsCatalog();
    let s = createEpisode({
      episodeId: "ep_budget",
      products: catalog.products.slice(0, 3),
    });
    s = applyDecision(s, {
      day: 0,
      kind: "allocate_experiment",
      amountUsd: 200,
      rationale: "first tranche",
      authorized: true,
    });
    s = applyDecision(s, {
      day: 0,
      kind: "allocate_experiment",
      amountUsd: 60,
      rationale: "over budget",
      authorized: true,
    });
    assert.ok(s.blocked.some((b) => b.includes("experiment_budget_exceeded")));
    assert.equal(s.experimentSpentUsd, 200);
  });
});
