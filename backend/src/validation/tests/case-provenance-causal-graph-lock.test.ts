/**
 * Case provenance + executable causal graph lock.
 * Does not encode sealed examination content.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyCaseMode,
  filterPriorTurnsForCaseProvenance,
  enforceCurrentCaseFactFirewall,
  extractCaseFingerprint,
} from "../../orchestration/pillow-host/executive-case-provenance.js";
import { buildCanonicalCaseState } from "../../orchestration/pillow-host/executive-canonical-state.js";
import { extractQuotedClaimsOnly } from "../../orchestration/pillow-host/executive-canonical-state.js";
import {
  assessClaimAgainstCanonical,
  decomposeClaimPropositions,
} from "../../orchestration/pillow-host/executive-claim-proposition.js";
import {
  causalPathLength,
  hasCausalPath,
  isDirectCause,
} from "../../orchestration/pillow-host/executive-causal-state.js";
import { polishFinalVisibleAnswer } from "../../orchestration/pillow-host/executive-response-polish.js";

describe("Case provenance + executable causal graph lock", () => {
  it("NEW_BOUNDED_CASE redacts foreign specimen facts from prior turns", () => {
    const priorUser =
      "SyntheticPrior — infra only. Tuesday 10:20 Cobalt power-control module failed. Memory was cleared. Clusters healthy.";
    const current = [
      "SyntheticCurrent — warehouse only. Do not mention Mini Fan or Birth.",
      "NorthHub printer power-board failed. Orders redirected to SouthHub. 500 delayed.",
      "Answer in exactly 4 numbered sections.",
    ].join("\n");
    const mode = classifyCaseMode(current, [priorUser]);
    assert.equal(mode, "NEW_BOUNDED_CASE");
    const filtered = filterPriorTurnsForCaseProvenance(
      [
        { role: "user", content: priorUser },
        {
          role: "assistant",
          content:
            "At Tuesday 10:20 the power-control module was replaced. Memory was cleared. Clusters restored.",
        },
      ],
      current,
      mode,
    );
    assert.ok((filtered.telemetry.FOREIGN_CASE_FACTS_REJECTED ?? 0) > 0);
    assert.ok(!/Tuesday 10:20/i.test(filtered.turns.map((t) => t.content).join("\n")));
    assert.ok(!/power-control module/i.test(filtered.turns.map((t) => t.content).join("\n")));
  });

  it("firewall strips foreign timestamps/mechanisms from visible answer", () => {
    const prior = extractCaseFingerprint(
      "SyntheticA — Tuesday 10:20 power-control module. Memory cleared. Clusters.",
      "prior",
    );
    const current =
      "SyntheticB — warehouse only. NorthHub power-board failed. SouthHub packing-capacity exhaustion. 500 delayed.";
    const dirty =
      "Tuesday 10:20 the power-control module was replaced and memory cleared on clusters. NorthHub redirected 500 orders.";
    const fw = enforceCurrentCaseFactFirewall(dirty, current, [prior], "NEW_BOUNDED_CASE");
    assert.equal(fw.ok, false);
    assert.ok(fw.FOREIGN_CASE_EVENT_LEAK + fw.FOREIGN_CASE_DOMAIN_SUBSTITUTION > 0);
    assert.ok(!/Tuesday 10:20/i.test(fw.cleaned));
    assert.ok(!/\[foreign-case-/i.test(fw.cleaned));
    const polished = polishFinalVisibleAnswer(dirty, current, undefined, {
      priorFingerprints: [prior],
      caseMode: "NEW_BOUNDED_CASE",
    });
    assert.ok(!/Tuesday 10:20/i.test(polished));
  });

  it("CONTINUATION preserves prior case facts", () => {
    const prior =
      "SyntheticCont — ops only. Mesa thermal failure redirected work to Quay. Quay overloaded.";
    const cont =
      "Continue the same case. Now reconsider if Quay capacity rises to 120. Do not mention Mini Fan.";
    assert.equal(classifyCaseMode(cont, [prior]), "CONTINUATION_OF_EXISTING_CASE");
  });

  it("multi-hop warehouse chain: PATH>1 ⇒ direct claim CONTRADICTED", () => {
    const pack = [
      "SyntheticCascadeOps — warehouse only. Do not mention Mini Fan or Birth.",
      "NorthHub printer power-board failed.",
      "That power-board failure caused dispatch failure.",
      "Dispatch failure caused orders to be redirected to SouthHub.",
      "SouthHub packing-capacity exhaustion resulted from that redirected workload.",
      "Audit: \"NorthHub's power-board failure directly caused SouthHub's packing-capacity exhaustion.\"",
    ].join("\n");
    const claim =
      "NorthHub's power-board failure directly caused SouthHub's packing-capacity exhaustion.";
    const can = buildCanonicalCaseState(pack);
    assert.ok(decomposeClaimPropositions(claim).some((p) => p.kind === "causal_direct_cause"));
    assert.equal(isDirectCause(can.causal, "NorthHub", "SouthHub"), false);
    assert.equal(hasCausalPath(can.causal, "NorthHub", "SouthHub"), true);
    const plen = causalPathLength(can.causal, "NorthHub", "SouthHub");
    assert.ok(plen != null && plen > 1, `pathLen=${plen}`);
    assert.equal(assessClaimAgainstCanonical(claim, can).overall, "contradicted");
  });

  it("connected claim SUPPORTED when PATH exists without common root", () => {
    const pack = [
      "SyntheticConn — ops only.",
      "Ridge directly caused FailureA. FailureA triggered failover to Harbor. Harbor then overloaded Quay.",
    ].join("\n");
    const can = buildCanonicalCaseState(pack);
    assert.equal(
      assessClaimAgainstCanonical("Ridge and Quay are causally connected.", can).overall,
      "supported",
    );
    assert.equal(
      assessClaimAgainstCanonical("Ridge and Quay share the same root cause.", can).overall,
      "contradicted",
    );
  });

  it("Audit:/Also: prefixed quotes extract as claims", () => {
    const msg = [
      "SyntheticAuditCue — warehouse only.",
      "NorthHub printer power-board failed.",
      "That power-board failure caused dispatch failure.",
      "Dispatch failure caused orders to be redirected to SouthHub.",
      "SouthHub packing-capacity exhaustion resulted from that redirected workload.",
      "3. Claim audit",
      'Audit: "NorthHub\'s power-board failure directly caused SouthHub\'s packing-capacity exhaustion."',
      'Also: "NorthHub and SouthHub are causally connected."',
    ].join("\n");
    const quotes = extractQuotedClaimsOnly(msg);
    assert.ok(quotes.length >= 2, `got ${quotes.length}`);
    const can = buildCanonicalCaseState(msg);
    assert.equal(assessClaimAgainstCanonical(quotes[0]!, can).overall, "contradicted");
    assert.equal(assessClaimAgainstCanonical(quotes[1]!, can).overall, "supported");
  });
});
