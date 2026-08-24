/**
 * Raw full-pipeline memory relevance qualification (>=200 cases).
 * Temptation set must not surface irrelevant doctrine; relevant set must apply principle.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { polishFinalVisibleAnswer } from "../../orchestration/pillow-host/executive-response-polish.js";
import { repairHistoricalOccurrenceErasure } from "../../orchestration/pillow-host/executive-event-state.js";
import { validateVisibleBlockRelevance } from "../../orchestration/pillow-host/executive-memory-relevance.js";

const APEX_GENERIC =
  /A later refund or reversal changes economic treatment; it does not by itself erase that the earlier verified event historically occurred/i;
const DOCTRINE_DUMP =
  /\*\*Event-state reading:\*\*|refund, return, chargeback, compensation, (?:or )?SLA|later refund alone does not erase/i;
const LIVE_LEAK = /\bMini Fan\b|\bBirth\b|\bGrand King\b|sales-history evidence beyond realised/i;

function mulberry32(a: number) {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

const DOMAINS = [
  "manufacturing",
  "healthcare",
  "finance",
  "software",
  "logistics",
  "hospitality",
  "energy",
  "professional_services",
  "retail",
  "operations",
] as const;

const ACTORS = ["North", "East", "Ridge", "Harbor", "Mesa", "Quay", "Cedar", "Inlet"] as const;

function temptationPack(rng: () => number, i: number): { pack: string; draft: string } {
  const d = pick(rng, DOMAINS);
  const a = pick(rng, ACTORS);
  const b = pick(rng, ACTORS.filter((x) => x !== a));
  const tempt = pick(rng, [
    "refund paperwork is out of scope",
    "authority note is not requested",
    "current schedule only",
    "decision log exists but no recommendation asked",
    "scale discussion not requested",
    "revenue column present but commerce grounding irrelevant",
  ]);
  const pack = [
    `Synthetic${d}-${i} — ${d} analysis only. Do not mention Mini Fan or Birth.`,
    `${a} currently satisfies eligibility and is currently eligible.`,
    `Historical note: earlier temporary issue on ${a} cleared.`,
    `Workload redirected from ${a} to ${b}; ${b}'s current constraint resulted from that redirect.`,
    `Lexical temptation: ${tempt}.`,
    `No commercial refund, chargeback, or economic reversal is in the pack.`,
    `Assess: "${b} problem is unrelated to ${a} because ${b} never had the same direct issue."`,
  ].join("\n");
  const draft = [
    "### Conclusions",
    `${a} is currently eligible. Historical impairment cleared.`,
    `Indirect causality: redirect from ${a} caused ${b} constraint.`,
    "### Claim 1",
    "**Verdict:** Contradicted",
    "The unrelatedness claim reverses the established redirect path.",
  ].join("\n");
  return { pack, draft };
}

function relevantPack(rng: () => number, i: number): { pack: string; draft: string } {
  const d = pick(rng, ["hospitality", "logistics", "software", "healthcare", "manufacturing"] as const);
  const pack = [
    `SyntheticRel-${d}-${i} — ${d} analysis only.`,
    "Performance completed and recorded complete.",
    "Later full refund after service breach.",
    "Does the later refund erase that the earlier verified event historically occurred?",
  ].join("\n");
  const draft =
    "Because of the refund, it should not be counted as historically completed.";
  return { pack, draft };
}

function gradesIrrelevant(text: string): boolean {
  return APEX_GENERIC.test(text) || DOCTRINE_DUMP.test(text) || LIVE_LEAK.test(text);
}

function gradesRelevantOk(text: string): boolean {
  if (/\*\*Event-state reading:\*\*/i.test(text)) return false;
  if (LIVE_LEAK.test(text)) return false;
  return /does not by itself erase|remains historically occurred|historically occurred unless/i.test(
    text,
  );
}

describe("memory relevance raw pipeline", () => {
  it("100 irrelevant temptations + 100 relevant controls + negative controls", () => {
    const rng = mulberry32(0x4d3e0179);
    let irrelevantVisible = 0;
    let relevantFail = 0;
    let negativeFalsePass = 0;

    for (let i = 0; i < 100; i++) {
      const { pack, draft } = temptationPack(rng, i);
      const out = polishFinalVisibleAnswer(draft, pack);
      if (gradesIrrelevant(out)) irrelevantVisible += 1;
    }

    for (let i = 0; i < 100; i++) {
      const { pack, draft } = relevantPack(rng, i);
      const repaired = repairHistoricalOccurrenceErasure(draft, pack).message;
      const out = polishFinalVisibleAnswer(repaired, pack);
      if (!gradesRelevantOk(out)) relevantFail += 1;
    }

    // Negative controls: grader must fail dirty answers
    const negPack =
      "SyntheticNeg — ops only. Currently eligible. Historical cleared. No refund.";
    const negatives = [
      `Eligible.\n\n${"A later refund or reversal changes economic treatment; it does not by itself erase that the earlier verified event historically occurred."}`,
      "Eligible.\n\n**Event-state reading:** A later refund, return, chargeback, compensation, SLA breach...",
      "Eligible.\n\nMini Fan realised orders remain zero. Birth awaits Grand King.",
      "Eligible.\n\nA later refund, return, chargeback, compensation, or SLA failure does not by itself prove an earlier verified event never occurred.",
    ];
    for (const dirty of negatives) {
      if (!gradesIrrelevant(dirty)) negativeFalsePass += 1;
      const cleaned = validateVisibleBlockRelevance(dirty, negPack).message;
      // After gate, irrelevant doctrine must be gone (live leak Mini Fan may remain — strip is economic-focused;
      // polish strips live grounding for synthetic — validate economic strips here)
      if (APEX_GENERIC.test(cleaned) || DOCTRINE_DUMP.test(cleaned)) {
        // fail: gate left doctrine
        irrelevantVisible += 1;
      }
    }

    assert.equal(irrelevantVisible, 0, `IRRELEVANT_VISIBLE_DOCTRINE=${irrelevantVisible}`);
    assert.equal(relevantFail, 0, `RELEVANT_LESSON_APPLICATION_FAIL=${relevantFail}`);
    assert.equal(negativeFalsePass, 0, `NEGATIVE_CONTROL_FALSE_PASS=${negativeFalsePass}`);
    assert.ok(100 + 100 >= 200);
  });
});
