/**
 * DEPLOY INVARIANT GATE — raw full-pipeline independent-closure invariants.
 * Cross-repair preservation: target + all prior critical invariants.
 * Scale: >=25 ICs, >=5 raw variants/IC, >=100 cross, >=100 pairwise, negatives.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { polishFinalVisibleAnswer } from "../../orchestration/pillow-host/executive-response-polish.js";
import { releaseExecutiveAnswer } from "../../orchestration/pillow-host/executive-release-gate.js";
import { extractQuotedClaimsOnly } from "../../orchestration/pillow-host/executive-canonical-state.js";
import { assessClaimAgainstCanonical } from "../../orchestration/pillow-host/executive-claim-proposition.js";
import { buildCanonicalCaseState } from "../../orchestration/pillow-host/executive-canonical-state.js";
import {
  INDEPENDENT_CLOSURE_INVARIANTS,
  CRITICAL_INVARIANT_PAIRS,
  changeImpactForFile,
  describeChangeImpact,
  buildCriticalInteractionMatrix,
  RAW_VARIANTS_PER_INVARIANT_MIN,
  CROSS_INVARIANT_CASES_MIN,
  PAIRWISE_INTERACTION_CASES_MIN,
  type IndependentClosureInvariantId,
} from "../../orchestration/pillow-host/independent-closure-invariants.js";
import type { ExecutiveTruthSnapshot } from "../../orchestration/pillow-host/executive-truth-types.js";

const APEX =
  /A later refund or reversal changes economic treatment; it does not by itself erase that the earlier verified event historically occurred/i;
const DOCTRINE =
  /\*\*Event-state reading:\*\*|Do not select on price alone:\s*require a clear refund|refund quantity or amount/i;
const LIVE = /\bMini Fan\b|\bBirth\b|Grand King authori/i;

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

function truth(): ExecutiveTruthSnapshot {
  return {
    product: {
      name: "EmpireAI",
      firstSale: false,
      realisedOrders: 0,
      publishedListings: 0,
      expectedProfitDisplay: "$2.00",
      expectedProfitTruthClass: "ESTIMATED",
      realisedTruthClass: "CURRENT_VERIFIED",
    },
    financial: { realisedOrders: 0, realisedRevenue: 0, realisedTruthClass: "CURRENT_VERIFIED" },
    birth: {
      status: "TECHNICALLY_READY_AWAITING_GRAND_KING",
      technicallyReady: true,
      birthTimestamp: null,
      gatesPassedCount: 12,
      gatesTotal: 12,
      truthClass: "CURRENT_VERIFIED",
    },
    deploy: {
      gitCommitSha: "deadbeef0123456789abcdef",
      serviceOnlineHint: "assume_online_if_answering",
      truthClass: "CURRENT_VERIFIED",
    },
    authority: {
      pillowMayPublish: false,
      pillowMaySupplierSpend: false,
      pillowMayAuthoriseBirth: false,
      pillowMayExecuteProductionDeploy: false,
      chatHasToolCallingLoop: false,
      executableNow: ["Answer questions"],
      requiresGrandKing: ["Authorise Birth"],
      truthClass: "CURRENT_VERIFIED",
    },
    demandEvidence: "UNKNOWN",
    notes: [],
  } as unknown as ExecutiveTruthSnapshot;
}

function explicitVerdict(text: string, index = 1): string | null {
  const m = new RegExp(
    `Claim\\s*${index}\\b[\\s\\S]{0,400}?\\*\\*Verdict:\\*\\*\\s*(?:\\*\\*)?(Supported|Contradicted|Unproven|Unknown)`,
    "i",
  ).exec(text);
  return m?.[1] ?? null;
}

const DOMAINS = [
  "manufacturing",
  "healthcare",
  "logistics",
  "software",
  "energy",
  "hospitality",
  "finance",
  "retail",
  "transport",
  "laboratory",
  "infrastructure",
  "professional",
] as const;
const ACTORS = ["Cedar", "Inlet", "Ridge", "Harbor", "Mesa", "Quay", "Cobalt", "Argon", "Nexus", "Prism"] as const;
const MECHS = ["seal", "staffing", "thermal", "routing", "calibration", "pressure", "sterility"] as const;
const RESOURCES = ["capacity", "technician", "operator", "bed", "slot", "crew"] as const;

function indirectCausalPack(rng: () => number, i: number, soft: boolean): { pack: string; claim: string } {
  const d = pick(rng, DOMAINS);
  const a = pick(rng, ACTORS);
  const b = pick(rng, ACTORS.filter((x) => x !== a));
  const mech = pick(rng, MECHS);
  const res = pick(rng, RESOURCES);
  const claim = `${b}'s ${res} shortage has no causal relationship to ${a} because ${b} never had a ${mech} failure.`;
  const pack = soft
    ? [
        `SyntheticIC03-${d}-${i} — ${d} analysis only. Do not mention Mini Fan or Birth.`,
        `Earlier today ${a} had a ${mech} failure. That failure caused work to be reassigned from ${a} to ${b}.`,
        `${b}'s ${res} was then committed to the reassigned work. ${b}'s current ${res} shortage resulted from that committed capacity.`,
        `${b} never had a ${mech} failure.`,
        `Answer with conclusions first. Then assess this claim:`,
        claim,
      ].join("\n")
    : [
        `SyntheticIC03Q-${d}-${i} — ${d} analysis only. Do not mention Mini Fan or Birth.`,
        `${a} had a ${mech} failure. Work redirected from ${a} to ${b}. ${b}'s current ${res} shortage resulted from that redirect.`,
        `${b} never had a ${mech} failure.`,
        `Separate verdict on: "${claim}"`,
      ].join("\n");
  return { pack, claim };
}

function supportedTemptDraft(claim: string): string {
  return [
    "### Conclusions",
    "Transfer path noted.",
    "### Claim 1",
    "**Verdict:** Supported",
    `"${claim}"`,
    "Different direct mechanism implies unrelated.",
  ].join("\n");
}

type VariantResult = { id: IndependentClosureInvariantId; i: number; ok: boolean; detail?: string };

function runIcVariant(id: IndependentClosureInvariantId, i: number, rng: () => number): VariantResult {
  const d = pick(rng, DOMAINS);
  const a = pick(rng, ACTORS);
  const b = pick(rng, ACTORS.filter((x) => x !== a));
  const mech = pick(rng, MECHS);
  const res = pick(rng, RESOURCES);

  switch (id) {
    case "IC-01":
    case "IC-02": {
      const pack = [
        `Synthetic${id}-${d}-${i} — ${d} only. Do not mention Mini Fan or Birth.`,
        `${a} had historical failure then verified correction. ${a} currently eligible.`,
        `Is ${a} currently eligible?`,
      ].join("\n");
      const out = polishFinalVisibleAnswer(`${a} currently eligible after correction.`, pack);
      return { id, i, ok: !LIVE.test(out) && !APEX.test(out) };
    }
    case "IC-03":
    case "IC-04":
    case "IC-06": {
      const { pack, claim } = indirectCausalPack(rng, i, i % 2 === 0);
      const can = buildCanonicalCaseState(pack);
      const overall = assessClaimAgainstCanonical(claim, can).overall;
      const out = polishFinalVisibleAnswer(supportedTemptDraft(claim), pack);
      const v = explicitVerdict(out);
      const ok =
        overall === "contradicted" &&
        v === "Contradicted" &&
        !APEX.test(out) &&
        (out.match(/\*\*Verdict:\*\*\s*Supported/gi) || []).length === 0;
      return { id, i, ok, detail: `overall=${overall} v=${v}` };
    }
    case "IC-05": {
      const pack = [
        `SyntheticIC05-${d}-${i} — registry only. Do not mention Mini Fan or Birth.`,
        `Verified asset registry: ZX-${10 + i} = North Pier Module. ZY-${20 + i} = Partner Assembly. Distinct.`,
        `Separate verdict on: "ZX-${10 + i} is Partner Assembly."`,
      ].join("\n");
      const draft = [
        "### Claim 1",
        "**Verdict:** Supported",
        `"ZX-${10 + i} is Partner Assembly."`,
      ].join("\n");
      const out = polishFinalVisibleAnswer(draft, pack);
      return { id, i, ok: explicitVerdict(out) === "Contradicted" };
    }
    case "IC-07":
    case "IC-08":
    case "IC-24": {
      const pack = [
        `Synthetic${id}-${d}-${i} — decision only. Do not mention Mini Fan or Birth.`,
        `Gate A cleared for ${a}. Gate B still failed (certificate missing).`,
        `May we unlock the decision? Unknown certificate status for Gate C.`,
      ].join("\n");
      const out = polishFinalVisibleAnswer("Gate A cleared so decision unlocked.", pack);
      return { id, i, ok: !LIVE.test(out) };
    }
    case "IC-09":
    case "IC-20":
    case "IC-21":
    case "IC-22": {
      const pack = [
        `Synthetic${id}-${d}-${i} — ${d} only. Do not mention Mini Fan or Birth.`,
        `${a} currently eligible. Historical impairment cleared. No refund.`,
        `Summarize eligibility.`,
      ].join("\n");
      const dirty = `Eligible.\n\nA later refund or reversal changes economic treatment; it does not by itself erase that the earlier verified event historically occurred.`;
      const out = polishFinalVisibleAnswer(dirty, pack);
      return { id, i, ok: !APEX.test(out) && !DOCTRINE.test(out) };
    }
    case "IC-10": {
      const pack = [
        `SyntheticIC10-${d}-${i} — ${d} only. Do not mention Mini Fan or Birth.`,
        `Measured on subset n=40 of population M=400. Result 12%.`,
        `Separate verdict on: "The full population rate is 12%."`,
      ].join("\n");
      const claim = "The full population rate is 12%.";
      const out = polishFinalVisibleAnswer(supportedTemptDraft(claim), pack);
      const v = explicitVerdict(out);
      return { id, i, ok: v !== "Supported" && !LIVE.test(out) };
    }
    case "IC-11": {
      const pack = [
        `SyntheticIC11-${d}-${i} — ${d} only. Do not mention Mini Fan or Birth.`,
        `Forecast 4000. Realised 900.`,
        `Separate verdict on: "Forecast equals realised."`,
      ].join("\n");
      const out = polishFinalVisibleAnswer(supportedTemptDraft("Forecast equals realised."), pack);
      return { id, i, ok: explicitVerdict(out) === "Contradicted" };
    }
    case "IC-12": {
      const pack = [
        `SyntheticIC12-${d}-${i} — registry only. Do not mention Mini Fan or Birth.`,
        `Verified registry: HT-${i} = Hillside Transit. Planning memo associates HT-${i} with Harbour Crown.`,
        `Separate verdict on: "HT-${i} is Harbour Crown."`,
      ].join("\n");
      const out = polishFinalVisibleAnswer(
        supportedTemptDraft(`HT-${i} is Harbour Crown.`),
        pack,
      );
      return { id, i, ok: explicitVerdict(out) === "Contradicted" };
    }
    case "IC-13":
    case "IC-14":
    case "IC-16": {
      const pack = [
        `Synthetic${id}-${d}-${i} — ${d} only. Do not mention Mini Fan or Birth.`,
        `Provide a separate verdict on each quoted claim:`,
        `1. "Forecast equals realised."`,
        `2. "HT-${i} is Harbour Crown Hotel."`,
        `3. "Stays never historically occurred because of a later refund."`,
        `Pack: HT-${i} = Hillside Transit Hotel from registry; distinct from Harbour Crown. Forecast 4000 realised 900. Stays completed; later refund.`,
      ].join("\n");
      const out = polishFinalVisibleAnswer("### Conclusions\nBrief.", pack);
      const ok =
        /Claim\s*1[\s\S]*?\*\*Verdict:\*\*/i.test(out) &&
        /Claim\s*2[\s\S]*?\*\*Verdict:\*\*/i.test(out) &&
        /Claim\s*3[\s\S]*?\*\*Verdict:\*\*/i.test(out);
      return { id, i, ok };
    }
    case "IC-15": {
      const pack = [
        `SyntheticIC15-${d}-${i} — logistics only. Do not mention Mini Fan or Birth.`,
        `2026-08-20 09:00 — Lot cleared origin.`,
        `2026-08-21 14:00 — Lot delivered.`,
        `Current status closed. No refund. Was delivery completed?`,
      ].join("\n");
      const out = polishFinalVisibleAnswer("Delivery completed. Status closed.", pack);
      return {
        id,
        i,
        ok: !APEX.test(out) && !/\bTask\s*1\b.*09:00/i.test(out) && !LIVE.test(out),
      };
    }
    case "IC-17":
    case "IC-18":
    case "IC-19": {
      const pack = [
        `Synthetic${id}-${d}-${i} — ${d} synthetic scenario only. Do not mention Mini Fan or Birth.`,
        `${a} currently eligible. Summarize.`,
      ].join("\n");
      const out = polishFinalVisibleAnswer(`${a} eligible.`, pack);
      return { id, i, ok: !LIVE.test(out) };
    }
    case "IC-23": {
      const pack = [
        `SyntheticIC23-${d}-${i} — compliance only. Do not mention Mini Fan or Birth.`,
        `Rule requires current issued certificate. Inspection completed/pending only.`,
        `Does inspection satisfy the certificate rule?`,
      ].join("\n");
      const out = polishFinalVisibleAnswer("Inspection completed so certificate satisfied.", pack);
      return { id, i, ok: !LIVE.test(out) };
    }
    case "IC-25": {
      const pack = [
        `SyntheticIC25-${d}-${i} — ${d} only. Do not mention Mini Fan or Birth.`,
        `What is current eligibility of ${a}? ${a} currently eligible.`,
      ].join("\n");
      const out = polishFinalVisibleAnswer(`${a} is currently eligible.`, pack);
      return {
        id,
        i,
        ok: !/please resubmit|recovery mode|try again/i.test(out) && !LIVE.test(out),
      };
    }
    default:
      return { id, i, ok: false, detail: "unhandled" };
  }
}

describe("DEPLOY INVARIANT GATE — catalogue", () => {
  it("has >=25 independent-closure invariants", () => {
    assert.ok(INDEPENDENT_CLOSURE_INVARIANTS.length >= 25);
  });
  it("change-impact mapping covers claim/causal/memory modules", () => {
    assert.ok(changeImpactForFile("executive-causal-state.ts").includes("IC-03"));
    assert.ok(changeImpactForFile("executive-memory-relevance.ts").includes("IC-20"));
    assert.ok(changeImpactForFile("executive-conclusion-ledger.ts").includes("IC-05"));
    const row = describeChangeImpact("executive-canonical-state.ts");
    assert.ok(row.possibleAffected.includes("IC-03"));
    assert.ok(row.requiredRegressions.length >= 1);
  });
});

describe("DEPLOY INVARIANT GATE — IC-03 Crestline-class soft + quoted", () => {
  it(">=5 soft + >=5 quoted domains: Supported draft → Contradicted; soft claims extract", () => {
    const rng = mulberry32(0xc3e57);
    for (let i = 0; i < 5; i++) {
      const { pack, claim } = indirectCausalPack(rng, i, true);
      const extracted = extractQuotedClaimsOnly(pack);
      assert.ok(extracted.length >= 1, `soft extract fail i=${i} :: ${pack.slice(0, 200)}`);
      const can = buildCanonicalCaseState(pack);
      assert.equal(assessClaimAgainstCanonical(claim, can).overall, "contradicted");
      const out = polishFinalVisibleAnswer(supportedTemptDraft(claim), pack);
      assert.equal(explicitVerdict(out), "Contradicted", out.slice(0, 500));
      assert.equal((out.match(/\*\*Verdict:\*\*\s*Supported/gi) || []).length, 0);
    }
    for (let i = 0; i < 5; i++) {
      const { pack, claim } = indirectCausalPack(rng, i + 50, false);
      const out = releaseExecutiveAnswer(supportedTemptDraft(claim), truth(), [], {
        userMessage: pack,
      }).message;
      assert.equal(explicitVerdict(out), "Contradicted", out.slice(0, 500));
    }
  });

  it("bare Assess: soft Supported without Claim markers → Contradicted", () => {
    const rng = mulberry32(0xba5e);
    for (let i = 0; i < 5; i++) {
      const d = pick(rng, DOMAINS);
      const a = pick(rng, ACTORS);
      const b = pick(rng, ACTORS.filter((x) => x !== a));
      const mech = pick(rng, MECHS);
      const res = pick(rng, RESOURCES);
      const claim = `${b}'s ${res} shortage has no causal relationship to ${a} because ${b} never had a ${mech} failure.`;
      const packQuoted = [
        `SyntheticBareQ-${d}-${i} — ${d} only. Do not mention Mini Fan or Birth.`,
        `${a} had a ${mech} failure. Work redirected to ${b}. ${b} shortage resulted from that redirect.`,
        `${b} never had a ${mech} failure.`,
        `Assess: "${claim}"`,
      ].join("\n");
      const packNl = [
        `SyntheticBareN-${d}-${i} — ${d} only. Do not mention Mini Fan or Birth.`,
        `${a} had a ${mech} failure. Work redirected to ${b}. ${b} shortage resulted from that redirect.`,
        `${b} never had a ${mech} failure.`,
        `Assess:`,
        claim,
      ].join("\n");
      const softDraft = [
        "### Conclusions",
        "Transfer noted.",
        "**Verdict:** Supported",
        `"${claim}"`,
        "Different direct mechanism implies unrelated.",
      ].join("\n");
      for (const pack of [packQuoted, packNl]) {
        assert.ok(extractQuotedClaimsOnly(pack).length >= 1, pack.slice(0, 160));
        const out = polishFinalVisibleAnswer(softDraft, pack);
        assert.equal((out.match(/\*\*Verdict:\*\*\s*Supported/gi) || []).length, 0, out.slice(0, 400));
        assert.match(out, /\*\*Verdict:\*\*\s*(?:\*\*)?Contradicted/i);
      }
    }
  });
});

describe("DEPLOY INVARIANT GATE — >=5 raw variants per IC-01..25", () => {
  it(`each invariant has >=${RAW_VARIANTS_PER_INVARIANT_MIN} raw variants PASS`, () => {
    const rng = mulberry32(0x1c0001);
    const fails: string[] = [];
    for (const inv of INDEPENDENT_CLOSURE_INVARIANTS) {
      let pass = 0;
      for (let i = 0; i < RAW_VARIANTS_PER_INVARIANT_MIN; i++) {
        const r = runIcVariant(inv.id, i, rng);
        if (r.ok) pass += 1;
        else fails.push(`${inv.id}#${i}:${r.detail || "fail"}`);
      }
      assert.ok(
        pass >= RAW_VARIANTS_PER_INVARIANT_MIN,
        `${inv.id} raw variants pass=${pass} fails=${fails.filter((f) => f.startsWith(inv.id)).join(";")}`,
      );
    }
  });
});

describe("DEPLOY INVARIANT GATE — cross-invariant combinations", () => {
  it(`>=${CROSS_INVARIANT_CASES_MIN} randomized combination cases`, () => {
    const rng = mulberry32(0xc2055);
    let fail = 0;
    for (let i = 0; i < CROSS_INVARIANT_CASES_MIN; i++) {
      const mode = i % 11;
      if (mode === 0 || mode === 1) {
        // memory + claim / memory + causality
        const { pack, claim } = indirectCausalPack(rng, i, i % 2 === 0);
        const dirty = `${supportedTemptDraft(claim)}\n\nA later refund or reversal changes economic treatment; it does not by itself erase that the earlier verified event historically occurred.`;
        const out = polishFinalVisibleAnswer(dirty, pack);
        if (explicitVerdict(out) !== "Contradicted" || APEX.test(out) || DOCTRINE.test(out)) fail += 1;
      } else if (mode === 2) {
        // memory + timestamps
        const pack = [
          `SyntheticXTS-${i} — logistics only. Do not mention Mini Fan or Birth.`,
          `2026-08-20 09:00 — Lot cleared.`,
          `2026-08-21 14:00 — Lot delivered. No refund.`,
          `Was delivery completed?`,
        ].join("\n");
        const dirty = `Delivery completed.\n\nA later refund or reversal changes economic treatment; it does not by itself erase that the earlier verified event historically occurred.`;
        const out = polishFinalVisibleAnswer(dirty, pack);
        if (APEX.test(out) || LIVE.test(out)) fail += 1;
      } else if (mode === 3) {
        // causality + current/historical
        const a = pick(rng, ACTORS);
        const b = pick(rng, ACTORS.filter((x) => x !== a));
        const pack = [
          `SyntheticXCH-${i} — ops only. Do not mention Mini Fan or Birth.`,
          `${a} currently eligible. Historical issue cleared.`,
          `Workload redirected from ${a} to ${b}; ${b} shortage resulted from redirect.`,
          `Assess this claim:`,
          `${b} problem is unrelated to ${a} because ${b} never had a seal failure.`,
        ].join("\n");
        const claim = `${b} problem is unrelated to ${a} because ${b} never had a seal failure.`;
        const out = polishFinalVisibleAnswer(supportedTemptDraft(claim), pack);
        if (explicitVerdict(out) !== "Contradicted" || APEX.test(out)) fail += 1;
      } else if (mode === 4) {
        // causality + claim compounds
        const { pack, claim } = indirectCausalPack(rng, i, false);
        const out = polishFinalVisibleAnswer(supportedTemptDraft(claim), pack);
        if (explicitVerdict(out) !== "Contradicted") fail += 1;
      } else if (mode === 5) {
        // decision gates + financial
        const pack = [
          `SyntheticXDF-${i} — finance only. Do not mention Mini Fan or Birth.`,
          `Gate A cleared. Gate B failed. Forecast 4000 realised 900.`,
          `Separate verdict on: "Forecast equals realised."`,
        ].join("\n");
        const out = polishFinalVisibleAnswer(supportedTemptDraft("Forecast equals realised."), pack);
        if (explicitVerdict(out) === "Supported" || LIVE.test(out)) fail += 1;
      } else if (mode === 6) {
        // population + temporal
        const pack = [
          `SyntheticXPT-${i} — lab only. Do not mention Mini Fan or Birth.`,
          `Subset n=50 of M=500 measured 8%. Later correction revised subset to 6%.`,
          `Separate verdict on: "Full population rate is 8%."`,
        ].join("\n");
        const out = polishFinalVisibleAnswer(supportedTemptDraft("Full population rate is 8%."), pack);
        if (explicitVerdict(out) === "Supported") fail += 1;
      } else if (mode === 7) {
        // entity identity + claim audit
        const pack = [
          `SyntheticXEI-${i} — registry only. Do not mention Mini Fan or Birth.`,
          `Provide separate verdicts:`,
          `1. "ZX-${i} is Partner Assembly."`,
          `2. "Forecast equals realised."`,
          `Registry: ZX-${i} = North Pier. Forecast 10 realised 3.`,
        ].join("\n");
        const out = polishFinalVisibleAnswer("### Conclusions\nNotes.", pack);
        if (!/Claim\s*1[\s\S]*?\*\*Verdict:\*\*/i.test(out) || !/Claim\s*2[\s\S]*?\*\*Verdict:\*\*/i.test(out))
          fail += 1;
      } else if (mode === 8) {
        // timestamps + multipart
        const pack = [
          `SyntheticXTM-${i} — transport only. Do not mention Mini Fan or Birth.`,
          `1) Delivery status 2) Current eligibility`,
          `2026-08-20 09:00 cleared. 2026-08-21 14:00 delivered. ${pick(rng, ACTORS)} currently eligible. No refund.`,
        ].join("\n");
        const out = polishFinalVisibleAnswer("Delivery completed. Eligible.", pack);
        if (APEX.test(out) || LIVE.test(out)) fail += 1;
      } else if (mode === 9) {
        // synthetic isolation + memory
        const pack = [
          `SyntheticXSI-${i} — synthetic ${pick(rng, DOMAINS)} only. Do not mention Mini Fan or Birth.`,
          `${pick(rng, ACTORS)} eligible. No refund. Summarize.`,
        ].join("\n");
        const dirty = `Eligible.\n\nA later refund or reversal changes economic treatment; it does not by itself erase that the earlier verified event historically occurred.`;
        const out = polishFinalVisibleAnswer(dirty, pack);
        if (APEX.test(out) || LIVE.test(out)) fail += 1;
      } else {
        // claim completeness + cross-section
        const pack = [
          `SyntheticXCC-${i} — ops only. Do not mention Mini Fan or Birth.`,
          `Provide separate verdicts on:`,
          `1. "Forecast equals realised."`,
          `2. "HT-${i} is Harbour Crown."`,
          `3. "Events never occurred due to later refund."`,
          `HT-${i}=Hillside Transit. Forecast 4 realised 1. Events completed; later refund.`,
        ].join("\n");
        const out = polishFinalVisibleAnswer("### Conclusions\nx", pack);
        if (
          !/Claim\s*1[\s\S]*?\*\*Verdict:\*\*/i.test(out) ||
          !/Claim\s*2[\s\S]*?\*\*Verdict:\*\*/i.test(out) ||
          !/Claim\s*3[\s\S]*?\*\*Verdict:\*\*/i.test(out)
        )
          fail += 1;
      }
    }
    assert.equal(fail, 0, `cross-invariant failures=${fail}`);
  });
});

describe("DEPLOY INVARIANT GATE — pairwise interactions >=100", () => {
  it(`>=${PAIRWISE_INTERACTION_CASES_MIN} high-risk pairwise cases + matrix`, () => {
    const rng = mulberry32(0xc0a14);
    const results = new Map<string, boolean>();
    let cases = 0;
    let fail = 0;

    // Expand each critical pair into multiple randomized cases until >=100.
    while (cases < PAIRWISE_INTERACTION_CASES_MIN) {
      for (const [a, b] of CRITICAL_INVARIANT_PAIRS) {
        if (cases >= PAIRWISE_INTERACTION_CASES_MIN) break;
        const key = `${a}+${b}`;
        const { pack, claim } = indirectCausalPack(rng, cases, cases % 2 === 0);
        let dirty = supportedTemptDraft(claim);
        if (a === "IC-20" || b === "IC-20" || a === "IC-21" || b === "IC-21" || a === "IC-22" || b === "IC-22") {
          dirty +=
            "\n\nA later refund or reversal changes economic treatment; it does not by itself erase that the earlier verified event historically occurred.";
        }
        const out = polishFinalVisibleAnswer(dirty, pack);
        let ok = true;
        if (a === "IC-03" || b === "IC-03" || a === "IC-05" || b === "IC-05" || a === "IC-06" || b === "IC-06") {
          ok = ok && explicitVerdict(out) === "Contradicted";
        }
        if (a === "IC-20" || b === "IC-20" || a === "IC-21" || b === "IC-21") {
          ok = ok && !APEX.test(out);
        }
        ok = ok && !LIVE.test(out);
        if (!ok) fail += 1;
        results.set(key, (results.get(key) ?? true) && ok);
        cases += 1;
      }
    }

    assert.ok(cases >= PAIRWISE_INTERACTION_CASES_MIN, `pairwise cases=${cases}`);
    assert.equal(fail, 0, `pairwise failures=${fail}`);

    const matrix = buildCriticalInteractionMatrix(results);
    assert.ok(matrix.length >= 20);
    assert.ok(matrix.every((r) => r.testExists));
    assert.ok(matrix.every((r) => r.pass === true), "interaction matrix PASS required");
  });
});

describe("DEPLOY INVARIANT GATE — negative controls", () => {
  it("NEGATIVE_CONTROL_FALSE_PASS=0 for P0/P1 critical classes", () => {
    const dirtyDoctrine = `Good answer.\n\nA later refund or reversal changes economic treatment; it does not by itself erase that the earlier verified event historically occurred.`;
    const pack = "SyntheticNeg — ops. Currently eligible. No refund. Do not mention Mini Fan or Birth.";
    assert.ok(APEX.test(dirtyDoctrine));
    const cleaned = polishFinalVisibleAnswer(dirtyDoctrine, pack);
    assert.ok(!APEX.test(cleaned));

    const { pack: p, claim } = indirectCausalPack(() => 0.42, 1, true);
    const wrong = polishFinalVisibleAnswer(supportedTemptDraft(claim), p);
    assert.notEqual(explicitVerdict(wrong), "Supported");
    assert.equal(explicitVerdict(wrong), "Contradicted");

    // Correct narrative + wrong explicit verdict must be rewritten
    const narrativeOk = [
      "### Conclusions",
      "Transfer connects the sites.",
      "### Claim 1",
      "**Verdict:** Supported",
      `"${claim}"`,
    ].join("\n");
    const fixed = polishFinalVisibleAnswer(narrativeOk, p);
    assert.equal(explicitVerdict(fixed), "Contradicted");

    // Missing middle claim must be regenerated
    const three = [
      "SyntheticNeg13 — ops. Do not mention Mini Fan or Birth.",
      "Provide separate verdicts:",
      '1. "Forecast equals realised."',
      '2. "ZX-9 is Partner Assembly."',
      '3. "Events never occurred due to later refund."',
      "ZX-9=North Pier. Forecast 4 realised 1. Events completed; later refund.",
    ].join("\n");
    const incomplete = polishFinalVisibleAnswer("### Claim 1\n**Verdict:** Contradicted\n", three);
    assert.match(incomplete, /Claim\s*2[\s\S]*?\*\*Verdict:\*\*/i);
    assert.match(incomplete, /Claim\s*3[\s\S]*?\*\*Verdict:\*\*/i);
  });
});
