/**
 * Memory ablation — MEMORY_ON vs MEMORY_OFF behavioral comparison.
 * Does not disable EKLS globally; compares relevance-gated surface vs ungated inject.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { polishFinalVisibleAnswer } from "../../orchestration/pillow-host/executive-response-polish.js";
import {
  repairHistoricalOccurrenceErasure,
  occurrencePreservationNote,
} from "../../orchestration/pillow-host/executive-event-state.js";
import { validateVisibleBlockRelevance } from "../../orchestration/pillow-host/executive-memory-relevance.js";

const APEX =
  /A later refund or reversal changes economic treatment; it does not by itself erase that the earlier verified event historically occurred/i;

describe("memory ablation", () => {
  it("MEMORY_ON gated path: irrelevant temptation does not increase doctrine leakage vs OFF", () => {
    const pack =
      "SyntheticAblate — energy ops only. Node Ridge currently eligible. Historical switchover completed. Lexical temptation: refund form exists but no economic reversal in pack.";
    const draft =
      "### Conclusions\nNode Ridge is currently eligible. Historical switchover completed.";

    const t0 = Date.now();
    const memoryOff = draft; // no lesson surface applied
    const memoryOn = polishFinalVisibleAnswer(draft, pack);
    const latencyMs = Date.now() - t0;

    const offLeak = APEX.test(memoryOff) ? 1 : 0;
    const onLeak = APEX.test(memoryOn) ? 1 : 0;

    assert.equal(offLeak, 0);
    assert.equal(onLeak, 0, "MEMORY_ON must not increase irrelevant visible doctrine");
    assert.ok(latencyMs < 30_000);

    // Honest report object (asserted for presence)
    const report = {
      MEMORY_ON_IRRELEVANT_LEAK: onLeak,
      MEMORY_OFF_IRRELEVANT_LEAK: offLeak,
      MEMORY_ON_LATENCY_MS: latencyMs,
      MEMORY_ON_REASONING_NEUTRAL_OR_POSITIVE: onLeak <= offLeak,
    };
    assert.equal(report.MEMORY_ON_REASONING_NEUTRAL_OR_POSITIVE, true);
  });

  it("MEMORY_ON relevant path still applies principle without Event-state dump", () => {
    const pack =
      "SyntheticAblateRel — hospitality. Stays completed. Later full refund after breach. Does refund erase historical occurrence?";
    const draft =
      "Refunds mean the stays should not be counted as historically completed.";
    const on = polishFinalVisibleAnswer(
      repairHistoricalOccurrenceErasure(draft, pack).message,
      pack,
    );
    assert.ok(/does not by itself erase|remains historically occurred/i.test(on));
    assert.ok(!/\*\*Event-state reading:\*\*/i.test(on));
    assert.ok(on.includes(occurrencePreservationNote("hospitality")) || /historically occurred/i.test(on));
  });

  it("forced inject stripped by relevance gate (ablation of ungated surface)", () => {
    const pack = "SyntheticAblateStrip — ops. Currently eligible. No refund.";
    const ungated = `${"Eligible now."}\n\n${"A later refund or reversal changes economic treatment; it does not by itself erase that the earlier verified event historically occurred."}`;
    const gated = validateVisibleBlockRelevance(ungated, pack).message;
    assert.equal(APEX.test(ungated), true);
    assert.equal(APEX.test(gated), false);
  });
});
