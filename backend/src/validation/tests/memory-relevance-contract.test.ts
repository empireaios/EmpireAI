/**
 * Memory relevance contract — occurrence lesson must not surface unless obligated.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  packEstablishesOccurrenceThenLaterReversal,
  userAsksOccurrenceVsEconomic,
  repairHistoricalOccurrenceErasure,
  occurrencePreservationNote,
} from "../../orchestration/pillow-host/executive-event-state.js";
import {
  assessOccurrenceLessonRelevance,
  stripUnmappedVisibleDoctrine,
  validateVisibleBlockRelevance,
} from "../../orchestration/pillow-host/executive-memory-relevance.js";
import { polishFinalVisibleAnswer } from "../../orchestration/pillow-host/executive-response-polish.js";

const APEX_GENERIC =
  "A later refund or reversal changes economic treatment; it does not by itself erase that the earlier verified event historically occurred.";

const IRRELEVANT_DOCTRINE =
  /later refund[^\n]{0,100}does not by itself erase|refund, return, chargeback, compensation|\*\*Event-state reading:\*\*|later refund alone does not erase/i;

describe("memory relevance contract", () => {
  it("does not treat histor/current/SLA/process-return as economic reversal", () => {
    assert.equal(
      packEstablishesOccurrenceThenLaterReversal(
        "SyntheticFab — Line North completed a gate. Historical impairment cleared. Currently eligible. SLA failure alarm cleared. Lot returned for rework. No commercial refund.",
      ),
      false,
    );
    assert.equal(
      packEstablishesOccurrenceThenLaterReversal(
        "Stays completed; later full refund after service breach.",
      ),
      true,
    );
  });

  it("requires explicit occurrence-vs-economic ask", () => {
    assert.equal(
      userAsksOccurrenceVsEconomic("Reconcile historical vs current eligibility."),
      false,
    );
    assert.equal(
      userAsksOccurrenceVsEconomic(
        "Does a later refund erase that the stays historically occurred?",
      ),
      true,
    );
  });

  it("Apex-class semiconductor pack does not append generic refund doctrine", () => {
    const pack = [
      "SyntheticSemi — semiconductor eligibility analysis only. Do not mention Mini Fan or Birth.",
      "Line North currently satisfies every eligibility gate and is currently eligible.",
      "Earlier today Line North had a temporary process issue that has cleared.",
      "Workload was redirected from Line North to Line East after the earlier issue.",
      "Line East's current capacity constraint resulted from that redirected workload.",
      "Historical occurrence of the earlier issue is recorded; current state is clear.",
      'Assess: "Line East problem is unrelated to Line North because Line East has no process issue."',
    ].join("\n");
    const draft = [
      "### Conclusions",
      "Line North is currently eligible. Historical impairment cleared.",
      "Indirect causality: redirected workload caused Line East constraint.",
      "### Claim 1",
      "**Verdict:** Contradicted",
      "The claim denies the causal path established by the pack.",
    ].join("\n");
    const repaired = repairHistoricalOccurrenceErasure(draft, pack);
    const polished = polishFinalVisibleAnswer(draft, pack);
    assert.equal(repaired.lessonTextSurfaced, false);
    assert.ok(!polished.includes(APEX_GENERIC), polished.slice(-240));
    assert.ok(!IRRELEVANT_DOCTRINE.test(polished), polished.slice(-240));
  });

  it("relevant refund+erasure still gets domain-native preservation note", () => {
    const pack =
      "SyntheticStay — hospitality analysis only. Stays completed and recorded complete. Later full refund after service breach. Did stays historically occur?";
    const draft =
      "Because of the refund, the stays should not be counted as historically completed.";
    const repaired = repairHistoricalOccurrenceErasure(draft, pack);
    assert.equal(repaired.lessonTextSurfaced, true);
    assert.ok(/does not by itself erase/i.test(repaired.message));
    assert.ok(!/\*\*Event-state reading:\*\*/i.test(repaired.message));
    assert.ok(repaired.message.includes(occurrencePreservationNote("hospitality")));
  });

  it("stripUnmappedVisibleDoctrine removes post-answer irrelevant append", () => {
    const pack = "SyntheticOps — current scheduling only. Currently eligible. No refund.";
    const dirty = `### Answer\nEligible now.\n\n${APEX_GENERIC}`;
    const { message, blocksRemoved } = stripUnmappedVisibleDoctrine(dirty, pack);
    assert.ok(blocksRemoved >= 1);
    assert.ok(!message.includes(APEX_GENERIC));
    const gate = validateVisibleBlockRelevance(dirty, pack);
    assert.equal(gate.UNMAPPED_VISIBLE_DOCTRINE, 0);
    assert.ok(!gate.message.includes(APEX_GENERIC));
  });

  it("simple eligibility with 'No refund' does not surface refund arithmetic stubs", () => {
    const pack =
      "SyntheticMR-04 — energy ops only. Do not mention Mini Fan or Birth.\nNode Cedar is currently eligible. Summarize eligibility in two sentences. No refund.";
    const dirty = [
      "Node Cedar is currently eligible.",
      "",
      "What can be concluded: perform only the arithmetic the pack supports; otherwise mark the net figure locally unavailable.",
      "",
      "**Need:** the stated gross/realised figure, refund quantity or amount, and whether units or currency are the operand.",
    ].join("\n");
    const polished = polishFinalVisibleAnswer(dirty, pack);
    assert.doesNotMatch(polished, /refund quantity or amount|perform only the arithmetic the pack supports/i);
    assert.match(polished, /currently eligible/i);
  });

  it("assessment distinguishes retrieved/relevant/visible", () => {
    const a = assessOccurrenceLessonRelevance(
      "Line completed. Historical cleared. Currently eligible.",
      "Eligible.",
      true,
    );
    assert.equal(a.LESSON_RETRIEVED, true);
    assert.equal(a.LESSON_RELEVANT_TO_CURRENT_TASK, false);
    assert.equal(a.LESSON_VISIBLE_TEXT_REQUIRED, false);

    const b = assessOccurrenceLessonRelevance(
      "Stays completed; later refund. Does the refund erase historical occurrence?",
      "Refunds mean stays never occurred.",
      true,
    );
    assert.equal(b.LESSON_RELEVANT_TO_CURRENT_TASK, true);
    assert.equal(b.LESSON_VISIBLE_TEXT_REQUIRED, true);
  });
});
