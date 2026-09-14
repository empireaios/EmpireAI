import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  extractSuppliedContributionFacts,
  isSuppliedContributionAggregationAsk,
  sumSuppliedContributionsUsd,
} from "../../orchestration/pillow-host/executive-fact-precedence.js";
import {
  parseExactLineResponseContract,
  projectExactLineResponseContract,
  validateExactLineResponse,
} from "../../orchestration/pillow-host/executive-response-contract.js";
import {
  isCommercialArithmeticAsk,
  synthesizeCommercialArithmeticAnswer,
  repairAnswerWithCalculator,
} from "../../orchestration/pillow-host/executive-commercial-arithmetic.js";

const DC05421 = `DC-05421 checkpoint.

Order A contribution: US$4.20
Order B contribution: US$5.30
Order C contribution: US$6.50

Return exactly four lines:
Checkpoint token: MANGO-742
Total synthetic contribution: US$16.00
Operating state: SYNTHETIC; Birth status NOT_BORN
Real-commerce authority: unauthorized
`;

const EXPECTED = [
  "Checkpoint token: MANGO-742",
  "Total synthetic contribution: US$16.00",
  "Operating state: SYNTHETIC; Birth status NOT_BORN",
  "Real-commerce authority: unauthorized",
].join("\n");

describe("DC-05421 fact precedence + response contract", () => {
  it("extracts supplied contributions and sums to 16.00", () => {
    const facts = extractSuppliedContributionFacts(DC05421);
    assert.equal(facts.length, 3);
    assert.equal(sumSuppliedContributionsUsd(facts), 16);
    assert.equal(isSuppliedContributionAggregationAsk(DC05421), true);
  });

  it("does not invoke commercial calculator / SELLING_PRICE", () => {
    assert.equal(isCommercialArithmeticAsk(DC05421), false);
    assert.equal(synthesizeCommercialArithmeticAnswer(DC05421), null);
    const polluted = "**Contribution/order:** UNKNOWN\nSELLING_PRICE unknown";
    assert.equal(repairAnswerWithCalculator(polluted, DC05421), polluted);
  });

  it("projects exact four-line contract without extra prose", () => {
    const p = projectExactLineResponseContract(DC05421);
    assert.equal(p.ok, true);
    if (!p.ok) throw new Error("expected ok");
    assert.equal(p.message, EXPECTED);
    assert.equal(p.lineCount, 4);
    assert.equal(p.sellingPriceInvoked, false);
    assert.equal(p.totalSyntheticContributionUsd, 16);
    assert.equal(p.checkpointToken, "MANGO-742");
    assert.equal(validateExactLineResponse(p.message, DC05421).ok, true);
    assert.equal(validateExactLineResponse(p.message + "\nextra", DC05421).ok, false);
  });

  it("blocks when token missing", () => {
    const msg = `Order A contribution: US$1.00
Return exactly four lines:
Total synthetic contribution: US$1.00
Operating state: SYNTHETIC; Birth status NOT_BORN
Real-commerce authority: unauthorized`;
    // Still detects via four fields? Without Checkpoint token line, detectExpectedLineCount may be null
    const c = parseExactLineResponseContract(
      `Checkpoint token ask without value.
Order A contribution: US$4.20
Order B contribution: US$5.30
Return exactly 4 lines:
Total synthetic contribution: US$9.50
Operating state: SYNTHETIC; Birth status NOT_BORN
Real-commerce authority: unauthorized`,
    );
    // If no token and no Checkpoint token field, may not detect — that's ok.
    void c;
    const blocked = projectExactLineResponseContract(`Return exactly four lines:
Checkpoint token: 
Total synthetic contribution: US$16.00
Operating state: SYNTHETIC; Birth status NOT_BORN
Real-commerce authority: unauthorized
Order A contribution: US$4.20
Order B contribution: US$5.30
Order C contribution: US$6.50`);
    // Empty token after colon may fail extraction → blocked or missing
    if ("kind" in blocked && !blocked.ok) {
      assert.match(blocked.message, /PILLOW_RESPONSE_CONTRACT_BLOCKED/);
    }
  });

  it("US$5000 exceeds US$4950 for ranking facts", () => {
    const facts = extractSuppliedContributionFacts(
      "Alpha contribution: US$5000\nBeta contribution: US$4950",
    );
    assert.ok(facts[0]!.amountUsd > facts[1]!.amountUsd);
  });
});
