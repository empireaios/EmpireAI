import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isLiveCommerceEffectAsk,
  isOperatingAuthorityFactAsk,
  projectLiveCommerceRefusal,
  projectOperatingAuthorityFacts,
} from "../../orchestration/pillow-host/executive-authority-surface.js";
import { projectExactLineResponseContract } from "../../orchestration/pillow-host/executive-response-contract.js";
import { bindSuppliedProducts } from "../../orchestration/shadow-ceo-integration/candidate-evaluation-episode.js";
import { formatEligibleSelectedAnswer } from "../../orchestration/shadow-ceo-integration/candidate-evaluation-episode.js";

describe("exec-cap authority + compact candidate binding", () => {
  it("refuses live listing/ad asks while NOT_BORN", () => {
    assert.equal(
      isLiveCommerceEffectAsk(
        "Please create a live Amazon US listing for a USB cable and spend $50 on ads now.",
      ),
      true,
    );
    const r = projectLiveCommerceRefusal("x");
    assert.match(r.message, /Refused: live commerce effects are blocked/i);
    assert.match(r.message, /NOT_BORN/);
  });

  it("answers Birth/mode from canonical authority facts", () => {
    assert.equal(
      isOperatingAuthorityFactAsk(
        "In one short sentence: what is Birth status and operating mode right now?",
      ),
      true,
    );
    const f = projectOperatingAuthorityFacts("Birth status and operating mode?");
    assert.match(f.message, /NOT_BORN/);
    assert.match(f.message, /SYNTHETIC/);
  });

  it("does not hijack Eligible/Selected into checkpoint contracts", () => {
    const p = projectExactLineResponseContract(
      "Exactly 2 lines Eligible candidates / Candidate selected. Cedar contribution US$12 stock 1100 delivery 5d approval granted.",
    );
    assert.equal("detected" in p && p.detected === false, true);
  });

  it("binds compact Kestrel/Lumen/Morrow paragraph", () => {
    const msg = `Shadow CEO SYNTHETIC. Kestrel contribution US$11 stock 1200 delivery 5d approval granted. Lumen US$13 stock 1500 delivery 8d approval granted. Morrow US$15 stock 1300 delivery 4d approval pending. Need contribution≥8 stock≥1000 delivery≤6 approval granted. Highest contribution among eligible. Exactly 2 lines: Eligible candidates: ... / Candidate selected: ...`;
    const bound = bindSuppliedProducts(msg);
    assert.equal(bound.reason, null);
    assert.ok(bound.decision);
    const ans = formatEligibleSelectedAnswer(bound.decision!);
    assert.equal(ans, "Eligible candidates: Kestrel\nCandidate selected: Kestrel");
  });
});
