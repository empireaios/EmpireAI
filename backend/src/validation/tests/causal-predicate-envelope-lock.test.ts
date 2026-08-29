/**
 * Causal predicate precision + visible contract envelope lock.
 * Bluehaven-class: direct≠indirect, different-mechanism≠unrelated, exact-N envelope.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assessClaimAgainstCanonical,
  decomposeClaimPropositions,
  headCausalEntity,
} from "../../orchestration/pillow-host/executive-claim-proposition.js";
import { buildCanonicalCaseState } from "../../orchestration/pillow-host/executive-canonical-state.js";
import {
  enforceVisibleContractEnvelope,
  assessVisibleContractEnvelope,
  authorizeTransportRelease,
} from "../../orchestration/pillow-host/executive-final-visible-contract.js";
import { ensureCausalClaimConsistency } from "../../orchestration/pillow-host/executive-causal-state.js";
import { releaseExecutiveAnswer } from "../../orchestration/pillow-host/executive-release-gate.js";
import type { ExecutiveTruthSnapshot } from "../../orchestration/pillow-host/executive-truth-types.js";

function truth(): ExecutiveTruthSnapshot {
  return {
    computedAt: new Date().toISOString(),
    workspaceId: "ws_bh",
    provenance: "live_sqlite_commissioning_kpi_birth",
    product: {
      commissioningId: "opc",
      asin: "B0X",
      productName: "High-Speed Handheld Mini Fan With Digital Display",
      supplier: "S",
      marketplace: "Amazon US",
      selectionAuthority: "pillow",
      cursorSelected: false,
      stage: "COMMISSIONING",
      pillowRecommendation: "INVESTIGATE",
      truthClass: "CURRENT_VERIFIED",
    },
    financial: {
      orders: 0,
      realisedRevenueUsd: 0,
      buyableListings: 0,
      publishedListings: 0,
      expectedProfitDisplay: null,
      expectedProfitTruthClass: "UNKNOWN",
      realisedTruthClass: "CURRENT_VERIFIED",
    },
    birth: {
      status: "TECHNICALLY_READY_AWAITING_GRAND_KING",
      technicallyReady: true,
      birthTimestamp: null,
      gatesPassedCount: 12,
      gatesTotal: 12,
      truthClass: "CURRENT_VERIFIED",
    },
    deploy: {
      gitCommitSha: "bh01",
      serviceOnlineHint: "assume_online_if_answering",
      truthClass: "CURRENT_VERIFIED",
    },
    authority: {
      pillowMayPublish: false,
      pillowMaySupplierSpend: false,
      pillowMayAuthoriseBirth: false,
      pillowMayExecuteProductionDeploy: false,
      chatHasToolCallingLoop: false,
      executableNow: ["Answer"],
      requiresGrandKing: ["Spend", "Birth"],
      truthClass: "CURRENT_VERIFIED",
    },
    demandEvidence: "UNKNOWN",
    notes: [],
  };
}

const cascadePack = [
  "SyntheticCascade — infrastructure only. Do not mention Mini Fan or Birth.",
  "Alpha directly caused FailureA. FailureA triggered failover to Beta. Beta then overloaded PeerNode.",
  "Alpha's outage caused traffic to be redirected to Beta.",
  "Beta's memory exhaustion resulted after receiving the redirected workload.",
  "Beta did not suffer a power-module failure.",
  "Answer in exactly 6 numbered sections.",
  "1. Snapshot",
  "2. Direct causes",
  "3. Claim audit",
  "4. Indirect path",
  "5. Recommendation",
  "6. Closing",
  "Audit these claims with explicit Verdict each:",
  '1. "FailureA triggered failover to Beta."',
  '2. "Alpha\'s power-module failure directly caused Beta\'s memory exhaustion."',
  '3. "Alpha and Beta are causally connected."',
  '4. "Beta\'s outage had no causal relationship to Alpha because Beta did not suffer a power-module failure."',
  '5. "Alpha and Beta share the same root cause."',
].join("\n");

describe("Causal predicate + visible envelope lock", () => {
  it("headCausalEntity strips claim nouns", () => {
    assert.equal(headCausalEntity("East problem"), "East");
    assert.equal(headCausalEntity("Beta's outage"), "Beta");
    assert.equal(headCausalEntity("Beta's"), "Beta");
  });

  it("directly caused over multi-hop path is CONTRADICTED (not UNRESOLVED)", () => {
    const can = buildCanonicalCaseState(cascadePack);
    const claim =
      "Alpha's power-module failure directly caused Beta's memory exhaustion.";
    const parts = decomposeClaimPropositions(claim);
    assert.ok(
      parts.some((p) => p.kind === "causal_direct_cause"),
      `kinds=${parts.map((p) => p.kind).join(",")}`,
    );
    const a = assessClaimAgainstCanonical(claim, can);
    assert.equal(a.overall, "contradicted");
  });

  it("unrelated-because-different-mechanism with path is CONTRADICTED", () => {
    const can = buildCanonicalCaseState(cascadePack);
    const claim =
      "Beta's outage had no causal relationship to Alpha because Beta did not suffer a power-module failure.";
    const a = assessClaimAgainstCanonical(claim, can);
    assert.equal(a.overall, "contradicted", JSON.stringify(a.components.map((c) => `${c.proposition.kind}:${c.verdict}`)));
  });

  it("same root on cascade without common root is CONTRADICTED", () => {
    const can = buildCanonicalCaseState(cascadePack);
    const claim = "Alpha and Beta share the same root cause.";
    const a = assessClaimAgainstCanonical(claim, can);
    assert.equal(a.overall, "contradicted");
  });

  it("release rewrites Supported direct/unrelated leftovers to Contradicted", () => {
    const draft = [
      "1. Snapshot",
      "Cascade described.",
      "2. Direct causes",
      "Alpha power; Beta memory.",
      "3. Claim audit",
      "### Claim 1",
      "**Verdict:** Supported",
      '"Alpha outage redirected traffic to Beta."',
      "### Claim 2",
      "**Verdict:** Supported",
      "\"Alpha's power-module failure directly caused Beta's memory exhaustion.\"",
      "### Claim 3",
      "**Verdict:** Supported",
      '"Alpha and Beta are causally connected."',
      "### Claim 4",
      "**Verdict:** Supported",
      "\"Beta's outage had no causal relationship to Alpha because Beta did not suffer a power-module failure.\"",
      "### Claim 5",
      "**Verdict:** Supported",
      '"Alpha and Beta share the same root cause."',
      "4. Indirect path",
      "Path exists.",
      "5. Recommendation",
      "Investigate failover load.",
      "6. Closing",
      "Done.",
    ].join("\n\n");
    const out = releaseExecutiveAnswer(draft, truth(), [], { userMessage: cascadePack }).message;
    const verdictAt = (n: number) =>
      new RegExp(
        `###\\s*Claim\\s*${n}\\b[\\s\\S]*?\\*\\*Verdict:\\*\\*\\s*\\**([A-Za-z]+)`,
        "i",
      ).exec(out)?.[1];
    const c2 = verdictAt(2);
    const c3 = verdictAt(3);
    const c4 = verdictAt(4);
    const c5 = verdictAt(5);
    assert.ok(/Contradict/i.test(String(c2)), `c2=${c2}`);
    assert.ok(/Support/i.test(String(c3)), `c3 connected should stay Supported; got ${c3}`);
    assert.ok(/Contradict/i.test(String(c4)), `c4=${c4}`);
    assert.ok(/Contradict/i.test(String(c5)), `c5=${c5}`);
    // Wrong direct/unrelated/same-root leftovers must not remain Supported.
    for (const n of [2, 4, 5]) {
      assert.ok(!/Support/i.test(String(verdictAt(n))), `claim ${n} must not stay Supported`);
    }
  });

  it("envelope strips Recommendation lead and Risk/lesson trailing on exact-N", () => {
    const raw = [
      "Recommendation: Validate performance / evidence first, then scale only what clears constitutional and commercial thresholds.",
      "",
      "1. Snapshot",
      "Body.",
      "2. Evidence",
      "Body.",
      "3. Closing",
      "Body.",
      "",
      "### Risk / lesson",
      "Failover/mitigation can overload the receiving path.",
    ].join("\n");
    const env = enforceVisibleContractEnvelope(raw, 3, "Answer in exactly 3 numbered sections.");
    assert.equal(/Recommendation:/i.test(env.message), false);
    assert.equal(/Risk\s*\/\s*lesson/i.test(env.message), false);
    const assess = assessVisibleContractEnvelope(env.message, 3, "Answer in exactly 3 numbered sections.");
    assert.equal(assess.failures.length, 0);
  });

  it("ensureCausalClaimConsistency does not append Risk/lesson under exact sections", () => {
    const ask = cascadePack;
    const body = [
      "1. Snapshot\nOk.",
      "2. Direct causes\nOk.",
      "3. Claim audit\nOk.",
      "4. Indirect path\nOk.",
      "5. Recommendation\nOk.",
      "6. Closing\nOk. Continue monitoring.",
    ].join("\n\n");
    const fixed = ensureCausalClaimConsistency(body, ask);
    assert.equal(/###\s*Risk\s*\/\s*lesson/i.test(fixed.message), false);
  });

  it("transport authorize still requires complete verdicts", () => {
    const five = Array.from({ length: 5 }, (_, i) => {
      const k = i + 1;
      return `### Claim ${k}\n"c${k}"\n**Verdict:** Unproven\nReason ${k} present here.`;
    }).join("\n\n");
    const auth = authorizeTransportRelease({
      answer: five,
      userMessage: 'Audit these 5 director claims: "a" "b" "c" "d" "e"',
      expectedTopLevelSections: null,
      claims: [],
    });
    assert.equal(auth.authorized, true);
  });
});
