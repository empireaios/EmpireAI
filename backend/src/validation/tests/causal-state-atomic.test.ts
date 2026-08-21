/**
 * Causal state extension — atomic (≥100) + paired/multi.
 * OBSERVED_UNAFFECTED ≠ PROVEN_NO_CAUSAL_ROLE
 * DIFFERENT_DIRECT_CAUSES ≠ CAUSALLY_UNRELATED
 * CAUSALLY_CONNECTED ≠ SAME_ROOT_CAUSE
 * Does not encode sealed examination content.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCanonicalCausalState,
  ensureCausalClaimConsistency,
  hasCausalPath,
  isDirectCause,
  shareCommonRootCause,
  synthesizeCausalRiskLesson,
  verdictCausalClaim,
} from "../../orchestration/pillow-host/executive-causal-state.js";
import {
  buildCanonicalCaseState,
  formatCanonicalStateBrief,
  verdictClaimAgainstCanonical,
} from "../../orchestration/pillow-host/executive-canonical-state.js";

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

describe("Causal state — atomic 100/100", () => {
  it("randomized causal matrix 100/100", () => {
    let pass = 0;
    for (let i = 0; i < 100; i++) {
      const rng = mulberry32(12000 + i);
      const mode = i % 10;
      let ok = false;
      const a = pick(rng, NODES);
      let b = pick(rng, NODES);
      while (b === a) b = pick(rng, NODES);
      let c = pick(rng, NODES);
      while (c === a || c === b) c = pick(rng, NODES);
      let d = pick(rng, NODES);
      while (d === a || d === b || d === c) d = pick(rng, NODES);

      if (mode === 0) {
        // direct cause
        const pack = `${a} directly caused ${b}.`;
        const s = buildCanonicalCausalState(pack);
        const v = verdictCausalClaim(`${a} is the direct cause of ${b}.`, s);
        ok = isDirectCause(s, a, b) && v.verdict === "supported";
      } else if (mode === 1) {
        // indirect cause via chain
        const pack = `${a} directly caused ${b}. ${b} triggered failover to ${c}. ${c} then overloaded ${d}.`;
        const s = buildCanonicalCausalState(pack);
        const vDirect = verdictCausalClaim(`${a} is the direct cause of ${d}.`, s);
        ok =
          hasCausalPath(s, a, d) &&
          !isDirectCause(s, a, d) &&
          vDirect.verdict === "contradicted";
      } else if (mode === 2) {
        // common root cause
        const pack = `Common root cause of ${b} and ${c} is ${a}.`;
        const s = buildCanonicalCausalState(pack);
        const v = verdictCausalClaim(`${b} and ${c} share the same root cause.`, s);
        ok = shareCommonRootCause(s, b, c) && v.verdict === "supported";
      } else if (mode === 3) {
        // different root causes but causal dependency
        const pack = `${a} directly caused ${b}. ${b} triggered failover to ${c}. ${c} then overloaded ${d}.`;
        const s = buildCanonicalCausalState(pack);
        const vUnrel = verdictCausalClaim(
          `${a} and ${d} are unrelated because they have different direct causes.`,
          s,
        );
        const vSame = verdictCausalClaim(`${a} and ${d} share the same root cause.`, s);
        ok =
          hasCausalPath(s, a, d) &&
          vUnrel.verdict === "contradicted" &&
          vSame.verdict === "contradicted";
      } else if (mode === 4) {
        // correlation only
        const pack = `${a} and ${b} are correlated. No causation established.`;
        const s = buildCanonicalCausalState(pack);
        ok =
          s.links.some((l) => l.kind === "CORRELATION_ONLY") &&
          !hasCausalPath(s, a, b);
      } else if (mode === 5) {
        // healthy / unknown causal role
        const pack = [
          `${a} directly caused ${b}. ${b} triggered failover to ${c}.`,
          `Entity ${d} remained healthy throughout.`,
        ].join(" ");
        const s = buildCanonicalCausalState(pack);
        const v = verdictCausalClaim(`${d} played no causal role in the incident.`, s);
        ok =
          s.roles.some((r) => r.entity === d && r.role === "UNAFFECTED_OBSERVED") &&
          v.verdict === "contradicted";
      } else if (mode === 6) {
        // affirmatively proven no causal role
        const pack = [
          `${a} directly caused ${b}.`,
          `${d} was offline and not invoked.`,
        ].join(" ");
        const s = buildCanonicalCausalState(pack);
        const v = verdictCausalClaim(`${d} played no causal role.`, s);
        ok =
          s.roles.some((r) => r.entity === d && r.role === "CAUSAL_NON_PARTICIPATION") &&
          v.verdict === "supported";
      } else if (mode === 7) {
        // intervention causing secondary failure + risk lesson
        const pack = [
          `${a} directly caused ${b}. ${b} triggered failover to ${c}.`,
          `Failover to ${c} then caused overload on ${d}.`,
          `Service restored. Continue monitoring.`,
        ].join(" ");
        const s = buildCanonicalCausalState(pack);
        const lesson = synthesizeCausalRiskLesson(s);
        ok =
          Boolean(s.demonstratedRiskMechanism) &&
          /failover|overload|demonstrated/i.test(lesson) &&
          !/^### Risk[\s\S]*continue monitoring\.?$/i.test(lesson);
      } else if (mode === 8) {
        // recovery vs unresolved causal risk
        const pack = [
          `${a} led to failover to ${c}. ${c} then overloaded ${d}.`,
          `Incident resolved. Service restored.`,
        ].join(" ");
        const s = buildCanonicalCausalState(pack);
        ok = s.recoveryOccurred && s.residualRiskOpen === true;
      } else {
        // unsupported causal hypothesis superseded / repair
        const pack = [
          `${a} directly caused ${b}. ${b} triggered failover to ${c}. ${c} then overloaded ${d}.`,
          `Entity ${pick(rng, NODES.filter((n) => ![a, b, c, d].includes(n)) || ["Zeta"])} remained healthy.`,
        ].join(" ");
        const healthyEnt =
          pack.match(/Entity\s+([A-Z][A-Za-z0-9_-]+)\s+remained healthy/i)?.[1] ?? "Zeta";
        const draft = `${healthyEnt} remained healthy; therefore ${healthyEnt} played no causal role. Also ${a} and ${d} are unrelated.`;
        const fixed = ensureCausalClaimConsistency(draft, pack);
        ok =
          fixed.repaired &&
          /OBSERVED_UNAFFECTED|PROVEN_NO_CAUSAL_ROLE|DIFFERENT_DIRECT_CAUSES|CAUSALLY_UNRELATED/i.test(
            fixed.message,
          );
      }

      if (ok) pass += 1;
      else assert.fail(`causal atomic seed=${i} mode=${mode} a=${a} b=${b} c=${c} d=${d}`);
    }
    assert.equal(pass, 100);
  });
});

describe("Causal state — paired / multi-variable", () => {
  it("paired: causal + entity identity", () => {
    const pack = [
      "Verified registry: ZX-11 = North Pier Module.",
      "North directly caused FailureA. FailureA triggered failover to East. East then overloaded PeerNode.",
      `Claim: "ZX-11 is Partner Assembly."`,
      `Claim: "North is the direct cause of PeerNode."`,
    ].join("\n");
    const state = buildCanonicalCaseState(pack);
    const id = verdictClaimAgainstCanonical("ZX-11 is Partner Assembly.", state);
    const causal = verdictClaimAgainstCanonical(
      "North is the direct cause of PeerNode.",
      state,
    );
    assert.equal(id.verdict, "contradicted");
    assert.equal(causal.verdict, "contradicted");
  });

  it("multi: causal + forecast + decision gate + healthy unknown role", () => {
    const pack = [
      "Forecast $3000; realised $700.",
      "North directly caused FailureA. FailureA triggered failover to East. East then overloaded PeerNode.",
      "Entity South remained healthy.",
      "Candidate B requires: performance >= threshold; expenditure <= approved ceiling. Both currently fail.",
      `Claims:`,
      `"Forecast equals realised."`,
      `"South played no causal role."`,
      `"North and PeerNode share the same root cause."`,
    ].join("\n");
    const state = buildCanonicalCaseState(pack);
    assert.equal(
      verdictClaimAgainstCanonical("Forecast equals realised.", state).verdict,
      "contradicted",
    );
    assert.equal(
      verdictClaimAgainstCanonical("South played no causal role.", state).verdict,
      "contradicted",
    );
    assert.equal(
      verdictClaimAgainstCanonical(
        "North and PeerNode share the same root cause.",
        state,
      ).verdict,
      "contradicted",
    );
    assert.ok(state.decisionActions.some((a) => a.requiredGates.length >= 2));
    assert.ok(
      state.causal.demonstratedRiskMechanism ||
        state.causal.links.some((l) => /overload/i.test(l.evidence)),
    );
  });

  it("canonical brief includes causal block", () => {
    const pack =
      "North directly caused FailureA. Entity South remained healthy. Failover to East then caused overload on PeerNode.";
    const state = buildCanonicalCaseState(pack);
    const brief = formatCanonicalStateBrief(state);
    assert.match(brief, /Canonical causal state|OBSERVED_UNAFFECTED|ROLE South/i);
  });
});
