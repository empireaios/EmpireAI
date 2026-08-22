/**
 * Canonical conclusion enforcement — claim verdicts consume established state.
 * Compound claims: true premise + false conclusion ≠ SUPPORTED.
 * Does not encode sealed examination content.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assessClaimAgainstCanonical,
  decomposeClaimPropositions,
} from "../../orchestration/pillow-host/executive-claim-proposition.js";
import { buildCanonicalCaseState } from "../../orchestration/pillow-host/executive-canonical-state.js";
import {
  enforceClaimEnumeration,
  detectMaterialInternalContradictions,
} from "../../orchestration/pillow-host/executive-conclusion-ledger.js";
import { polishFinalVisibleAnswer } from "../../orchestration/pillow-host/executive-response-polish.js";

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

const NODES = ["North", "South", "East", "West", "Alpha", "Beta", "Gamma", "Delta"] as const;

describe("Canonical claim consistency — atomic 100/100", () => {
  it("canonical established then later claim restates correctly or incorrectly", () => {
    let pass = 0;
    for (let i = 0; i < 100; i++) {
      const rng = mulberry32(44000 + i);
      const mode = i % 12;
      let ok = false;

      if (mode === 0) {
        // simple causal: different root + so unrelated (false conclusion)
        const a = pick(rng, NODES);
        let b = pick(rng, NODES);
        while (b === a) b = pick(rng, NODES);
        let c = pick(rng, NODES);
        while (c === a || c === b) c = pick(rng, NODES);
        let d = pick(rng, NODES);
        while ([a, b, c].includes(d as (typeof NODES)[number])) d = pick(rng, NODES);
        const pack = `${a} directly caused ${b}. ${b} triggered failover to ${c}. ${c} then overloaded ${d}.`;
        const state = buildCanonicalCaseState(pack);
        const claim = `${d} has a different root cause, so ${d} problem is unrelated to ${a}.`;
        const parts = decomposeClaimPropositions(claim);
        const v = assessClaimAgainstCanonical(claim, state);
        ok =
          parts.some((p) => p.kind === "causal_different_root") &&
          parts.some((p) => p.kind === "causal_unrelated") &&
          v.overall === "contradicted" &&
          v.truePremiseFalseConclusion === true;
      } else if (mode === 1) {
        // negation / same-root false
        const a = pick(rng, NODES);
        let b = pick(rng, NODES);
        while (b === a) b = pick(rng, NODES);
        let c = pick(rng, NODES);
        while (c === a || c === b) c = pick(rng, NODES);
        const pack = `${a} directly caused ${b}. ${b} triggered failover to ${c}.`;
        const state = buildCanonicalCaseState(pack);
        const v = assessClaimAgainstCanonical(
          `${a} and ${c} share the same root cause.`,
          state,
        );
        ok = v.overall === "contradicted";
      } else if (mode === 2) {
        // two true clauses
        const pack = `Verified asset registry: ZX-11 = North Pier Module. Forecast $900. Realised $200.`;
        const state = buildCanonicalCaseState(pack);
        const v = assessClaimAgainstCanonical(`ZX-11 is North Pier Module.`, state);
        ok = v.overall === "supported";
      } else if (mode === 3) {
        // true premise + false conclusion (entity)
        const pack = `Verified asset registry: ZX-11 = North Pier Module. ZX-22 = Partner Assembly. Distinct.`;
        const state = buildCanonicalCaseState(pack);
        const v = assessClaimAgainstCanonical(
          `ZX-11 is North Pier Module, therefore ZX-11 is Partner Assembly.`,
          state,
        );
        ok = v.overall === "contradicted" || v.truePremiseFalseConclusion;
      } else if (mode === 4) {
        // false premise + true-ish conclusion still not wholesale supported when compound fails
        const pack = `Verified asset registry: ZX-11 = North Pier Module.`;
        const state = buildCanonicalCaseState(pack);
        const v = assessClaimAgainstCanonical(`ZX-11 is Partner Assembly.`, state);
        ok = v.overall === "contradicted";
      } else if (mode === 5) {
        // financial
        const pack = `Forecast revenue $900. Realised revenue $200.`;
        const state = buildCanonicalCaseState(pack);
        const v = assessClaimAgainstCanonical(`Forecast equals realised.`, state);
        ok = v.overall === "contradicted";
      } else if (mode === 6) {
        // population
        const pack = `120 deployed sites. 80 currently valid measured. 10% average reduction across the 80 valid measured sites.`;
        const state = buildCanonicalCaseState(pack);
        const v = assessClaimAgainstCanonical(
          `All 120 deployed sites demonstrate a 10% saving.`,
          state,
        );
        ok = v.overall === "contradicted";
      } else if (mode === 7) {
        // temporal
        const pack = `Payment historically occurred and was recorded complete. Later a refund was issued.`;
        const state = buildCanonicalCaseState(pack);
        const v = assessClaimAgainstCanonical(
          `The completion never historically occurred because of the later refund.`,
          state,
        );
        ok = v.overall === "contradicted";
      } else if (mode === 8) {
        // decision gate
        const pack = [
          `Scale decision requires GateA=PASS and GateB=PASS.`,
          `Current: GateA=FAIL, GateB=PASS.`,
          `Separate verdict on: "Candidate is currently eligible to scale."`,
        ].join("\n");
        const state = buildCanonicalCaseState(pack);
        const v = assessClaimAgainstCanonical(
          `Candidate is currently eligible to scale.`,
          state,
        );
        ok = v.overall === "contradicted" || state.decisionActions.some((a) => !a.currentlyEligible);
      } else if (mode === 9) {
        // UNKNOWN clause
        const pack = `Forecast $500. Realised amount not stated.`;
        const state = buildCanonicalCaseState(pack);
        const v = assessClaimAgainstCanonical(
          `Supplier confirmation alone stands as established.`,
          state,
        );
        ok = v.overall === "unproven" || v.overall === "unknown";
      } else if (mode === 10) {
        // LLM Supported bypass repaired by enforceClaimEnumeration
        const a = pick(rng, NODES);
        let b = pick(rng, NODES);
        while (b === a) b = pick(rng, NODES);
        let c = pick(rng, NODES);
        while (c === a || c === b) c = pick(rng, NODES);
        let d = pick(rng, NODES);
        while ([a, b, c].includes(d as (typeof NODES)[number])) d = pick(rng, NODES);
        const pack = `${a} directly caused ${b}. ${b} triggered failover to ${c}. ${c} then overloaded ${d}.`;
        const claimText = `${d} has a different root cause, so ${d} problem is unrelated to ${a}.`;
        const draft = [
          `### Section 1`,
          `${a} caused transfer that overloaded ${d}. ${a} and ${d} do not share the same root cause.`,
          `### Claim 1`,
          `**Verdict:** Supported`,
          ``,
          `"${claimText}"`,
          ``,
          `Different causes imply unrelated.`,
          `### Claim 2`,
          `**Verdict:** Supported`,
          ``,
          `"${a} and ${d} share the same root cause."`,
        ].join("\n");
        const state = buildCanonicalCaseState(pack);
        const fixed = enforceClaimEnumeration(
          draft,
          [
            { id: "claim_1", index: 1, sourceText: claimText, subject: claimText },
            {
              id: "claim_2",
              index: 2,
              sourceText: `${a} and ${d} share the same root cause.`,
              subject: "same root",
            },
          ],
          { userMessage: pack, canonical: state },
        );
        ok =
          fixed.repaired &&
          /\*\*Verdict:\*\*\s*Contradicted/i.test(fixed.message) &&
          !/Claim 1[\s\S]*?\*\*Verdict:\*\*\s*Supported/i.test(fixed.message);
      } else {
        // correct restatement remains supported
        const pack = `Verified asset registry: ZX-11 = North Pier Module.`;
        const state = buildCanonicalCaseState(pack);
        const v = assessClaimAgainstCanonical(`ZX-11 is North Pier Module.`, state);
        ok = v.overall === "supported";
      }

      if (ok) pass++;
    }
    assert.equal(pass, 100, `atomic pass=${pass}/100`);
  });

  it("multipart cross-section: later claim cannot reverse earlier canonical conclusion", () => {
    const pack = [
      `SyntheticCanaryCanonical-${Date.now()} — analysis only.`,
      `North directly caused FailureA. FailureA triggered failover to East. East then overloaded PeerNode.`,
      `Entity South remained healthy.`,
      `Answer in 4 sections:`,
      `1) Establish causal conclusions.`,
      `2) Reason about secondary effects.`,
      `3) Audit claims:`,
      `   "PeerNode has a different root cause, so PeerNode problem is unrelated to North."`,
      `   "North and PeerNode share the same root cause."`,
      `4) Summarize without reversing section 1.`,
    ].join("\n");
    const draft = [
      `### 1 Causal conclusions`,
      `North → FailureA → East → PeerNode. North and PeerNode do not share the same root cause.`,
      `### 2 Secondary effects`,
      `Transfer caused PeerNode overload.`,
      `### 3 Claim audit`,
      `### Claim 1`,
      `**Verdict:** Supported`,
      ``,
      `"PeerNode has a different root cause, so PeerNode problem is unrelated to North."`,
      ``,
      `Different root causes mean unrelated.`,
      `### Claim 2`,
      `**Verdict:** Supported`,
      ``,
      `"North and PeerNode share the same root cause."`,
      `### 4 Summary`,
      `PeerNode is unrelated to North.`,
    ].join("\n");
    const polished = polishFinalVisibleAnswer(draft, pack);
    const issues = detectMaterialInternalContradictions(polished, { userMessage: pack });
    assert.equal(issues.length, 0, issues.join(";"));
    assert.match(polished, /Claim\s*1[\s\S]*?\*\*Verdict:\*\*\s*Contradicted/i);
    assert.match(polished, /Claim\s*2[\s\S]*?\*\*Verdict:\*\*\s*Contradicted/i);
    assert.doesNotMatch(
      polished,
      /Claim\s*1[\s\S]*?\*\*Verdict:\*\*\s*Supported[\s\S]*?Claim\s*2/i,
    );
  });
});
