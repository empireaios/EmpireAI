/**
 * Transport-boundary contract lock — Valence-class enforcement breaks.
 * No sealed exam content. Objective final-string gates only.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assessFinalVisibleContract,
  authorizeTransportRelease,
  countFinalTransportClaimVerdicts,
  resolveTransportClaimObligations,
} from "../../orchestration/pillow-host/executive-final-visible-contract.js";
import { extractQuotedClaimsOnly } from "../../orchestration/pillow-host/executive-canonical-state.js";

describe("Transport-boundary contract lock", () => {
  it("reproduces Valence-class: 5 claim texts / 1 verdict must FAIL authorize", () => {
    const userMessage = [
      "HarborOps synthetic audit only. Do not mention Mini Fan or Birth.",
      "Audit these 5 director claims separately with an explicit Verdict and reason each:",
      '1. "East lane delay equals shipment delay."',
      '2. "West shortage is independent of East."',
      '3. "North proves fleet-wide 9%."',
      '4. "Certificate CX is blocked."',
      '5. "Forecast equals realised for batch H1."',
    ].join("\n");
    const malformed = [
      'Claim 1: "East lane delay equals shipment delay."',
      'Claim 2: "West shortage is independent of East."',
      "**Verdict:** Not established",
      "The independence claim is not established from the supplied pack.",
      'Claim 3: "North proves fleet-wide 9%."',
      'Claim 4: "Certificate CX is blocked."',
      'Claim 5: "Forecast equals realised for batch H1."',
    ].join("\n\n");

    const quotes = extractQuotedClaimsOnly(userMessage);
    assert.ok(quotes.length >= 5, `expected >=5 quotes, got ${quotes.length}`);

    const claims = resolveTransportClaimObligations({
      userMessage,
      answer: malformed,
      contractClaims: [],
    });
    assert.ok(claims.length >= 5, `expected >=5 resolved claims, got ${claims.length}`);

    const surface = countFinalTransportClaimVerdicts(malformed);
    assert.ok(surface.claimCount >= 5 || claims.length >= 5);
    assert.ok(surface.verdictCount <= 1 || claims.length >= 5);

    const auth = authorizeTransportRelease({
      answer: malformed,
      userMessage,
      expectedTopLevelSections: null,
      claims: [],
    });
    assert.equal(auth.authorized, false);
    assert.ok(auth.assessment.failures.includes("EXPLICIT_VERDICT_OMISSION"));
    assert.equal(auth.assessment.provenance.releaseAuthorized, false);
    // Clean failure must not re-emit the malformed claim set as a successful audit.
    assert.equal(/\*\*Verdict:\*\*/i.test(auth.message), false);
    assert.match(auth.message, /cannot release/i);
  });

  it("5 claims / 5 verdicts AUTHORIZE", () => {
    const userMessage =
      'Audit 5 quoted claims separately:\n"A one."\n"B two."\n"C three."\n"D four."\n"E five."';
    const good = [1, 2, 3, 4, 5]
      .map(
        (i) =>
          `### Claim ${i}\n"Claim text ${i}."\n**Verdict:** Unproven\nThe supplied pack does not establish claim ${i}.`,
      )
      .join("\n\n");
    const auth = authorizeTransportRelease({
      answer: good,
      userMessage,
      expectedTopLevelSections: null,
      claims: [],
    });
    assert.equal(auth.authorized, true);
    assert.equal(auth.assessment.provenance.finalTransportVerdictCount, 5);
  });

  it("mutation-after-validation: stripping a verdict must fail re-authorize", () => {
    const userMessage = 'Audit claims separately:\n"Alpha claim text here."\n"Beta claim text here."';
    const good = [
      '### Claim 1\n"Alpha claim text here."\n**Verdict:** Unproven\nInsufficient evidence for alpha.',
      '### Claim 2\n"Beta claim text here."\n**Verdict:** Unproven\nInsufficient evidence for beta.',
    ].join("\n\n");
    const ok = authorizeTransportRelease({
      answer: good,
      userMessage,
      expectedTopLevelSections: null,
      claims: [],
    });
    assert.equal(ok.authorized, true);
    const mutated = good.replace(/\*\*Verdict:\*\*[^\n]*/i, "");
    const bad = authorizeTransportRelease({
      answer: mutated,
      userMessage,
      expectedTopLevelSections: null,
      claims: [],
    });
    assert.equal(bad.authorized, false);
  });

  it("diagnostic tail fails even with complete claims", () => {
    const userMessage = 'Audit:\n"Only claim text here."';
    const ans =
      '### Claim 1\n"Only claim text here."\n**Verdict:** Unproven\nNot enough evidence.\n\n**Section contract:** 0 of 6 requested top-level numbered sections are visible.';
    const r = assessFinalVisibleContract({
      answer: ans,
      userMessage,
      expectedTopLevelSections: null,
      claims: [],
    });
    assert.ok(r.failures.includes("INTERNAL_DIAGNOSTIC_LEAK"));
  });
});
