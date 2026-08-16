/**
 * Wave-1 R2 architectural repair — Level A (no sealed exam content).
 * Coverage non-interference, hypothetical conditional reasoning, relevance.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  appendMissingTaskCoverage,
  extractHypotheticalPremises,
  parseExecutiveTaskContract,
  synthesizeTaskUnitAnswer,
} from "../../orchestration/pillow-host/executive-task-contract.js";
import {
  countBirthMentions,
  countCannotCompleteAppendices,
  polishFinalVisibleAnswer,
} from "../../orchestration/pillow-host/executive-response-polish.js";
import {
  finalVisibleSemanticsFail,
  buildForcedObligationCompletion,
} from "../../orchestration/pillow-host/executive-final-release.js";
import { releaseExecutiveAnswer } from "../../orchestration/pillow-host/executive-release-gate.js";
import type { ExecutiveTruthSnapshot } from "../../orchestration/pillow-host/executive-truth-types.js";

function synthTruth(): ExecutiveTruthSnapshot {
  return {
    computedAt: new Date().toISOString(),
    workspaceId: "ws_w3_arch",
    provenance: "live_sqlite_commissioning_kpi_birth",
    product: {
      commissioningId: "opc_w3",
      asin: "B0SYNW3ARCH",
      productName: "Synthetic Harbor Desk Organizer 77",
      supplier: "SupplierH",
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
      gitCommitSha: "w3archrepair001",
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
      requiresGrandKing: ["Birth"],
      truthClass: "CURRENT_VERIFIED",
    },
    demandEvidence: "UNKNOWN",
    notes: [],
  };
}

describe("Wave3 architecture — Level A", () => {
  it("1 hypothetical used conditionally", () => {
    const user =
      "Suppose tomorrow reliable evidence shows strong customer demand for our bound product, but unit economics become strongly negative after variable selling costs. If that were true, how should the commercial decision change?";
    const contract = parseExecutiveTaskContract(user);
    assert.equal(contract.requiresConditionalReasoning, true);
    assert.ok(contract.hypotheticalPremises.length >= 1 || contract.tasks.some((t) => t.kind === "conditional_reasoning"));
    const truth = synthTruth();
    const out = releaseExecutiveAnswer(
      "I refuse because demand is not verified today.",
      truth,
      [],
      { userMessage: user, taskContract: contract },
    );
    assert.match(out.message, /under assumption|if that|scenario|would|conditional|binding|economics/i);
    assert.doesNotMatch(out.message, /demand is (?:now |currently )?verified fact/i);
  });

  it("2 hypothetical not promoted to current fact", () => {
    const user =
      "Assume supplier lead times drop to 3 days next month. How would operations change? Do not claim this is true today.";
    const out = releaseExecutiveAnswer("junk according to commercial position report", synthTruth(), [], {
      userMessage: user,
    });
    assert.match(out.message, /assumption|scenario|would|conditional|if/i);
    assert.doesNotMatch(
      out.message,
      /\b(?:lead times (?:are|have) (?:now )?3 days|this is currently verified)\b/i,
    );
  });

  it("3 hypothetical not persisted as truth (contract scoped to turn)", () => {
    const a = parseExecutiveTaskContract(
      "Suppose warehouse capacity doubles tomorrow. What changes?",
    );
    const b = parseExecutiveTaskContract("What are realised orders right now?");
    assert.ok(a.requiresConditionalReasoning);
    assert.equal(b.requiresConditionalReasoning, false);
    assert.equal(b.hypotheticalPremises.length, 0);
  });

  it("4 current fact contradicts owner assertion", () => {
    const user =
      "Audit this premise: we already have strong realised revenue this month. Recommend next step.";
    const out = releaseExecutiveAnswer(
      "Revenue is huge according to the commercial position report. This is verified fact.",
      synthTruth(),
      [],
      { userMessage: user },
    );
    assert.match(out.message, /zero|0|unestablished|not|contradict|unproven|orders/i);
  });

  it("5 historical fact superseded by current fact", () => {
    const user =
      "Reconcile historical waiting-to-go-live notes with current live answering evidence.";
    const out = releaseExecutiveAnswer("EmpireAI is offline pending deployment.", synthTruth(), [], {
      userMessage: user,
    });
    assert.match(out.message, /histor|current|live|supersed/i);
  });

  it("6 correct answer receives NO contradictory coverage appendix", () => {
    const truth = synthTruth();
    const user =
      "Evaluate whether the conclusion follows from the premises, reject unsupported prior-sales claims, and recommend a bounded next step.";
    const good = [
      "Premise audit: unsupported prior-sales claims are contradicted by verified realised orders of zero.",
      "The conclusion does not follow from those unsupported sales premises.",
      "Recommendation: I recommend a verification-first bounded check before irreversible spend.",
    ].join(" ");
    const contract = parseExecutiveTaskContract(user);
    const filled = appendMissingTaskCoverage(good, contract, truth);
    assert.equal(countCannotCompleteAppendices(filled.message), 0);
    const polished = polishFinalVisibleAnswer(
      `${good}\n\nFor “recommend”: I cannot complete that part from verified evidence this turn — it remains open rather than invented.`,
      user,
      contract,
    );
    assert.equal(countCannotCompleteAppendices(polished), 0);
  });

  it("7 irrelevant Birth not surfaced", () => {
    const user = "What are realised orders for the bound product?";
    const contract = parseExecutiveTaskContract(user);
    assert.equal(contract.birthRelevant, false);
    const stub = synthesizeTaskUnitAnswer(
      { id: "t1", kind: "operating_briefing", text: user, sourceSpan: user, subject: user.slice(0, 80), requiredOperation: "state_briefing", required: true },
      synthTruth(),
      { birthRelevant: false },
    );
    assert.equal(countBirthMentions(stub), 0);
    const polished = polishFinalVisibleAnswer(
      `${stub} Birth has not been authorised. Birth remains a Grand King decision.`,
      user,
      contract,
    );
    assert.equal(countBirthMentions(polished), 0);
  });

  it("8 recommendation obligation completed", () => {
    const user =
      "Compare two weak versions of a commercial story claim-by-claim, decide which is better supported, and make a commercial decision today.";
    const out = releaseExecutiveAnswer("contaminated commercial position report verified fact", synthTruth(), [], {
      userMessage: user,
    });
    assert.match(out.message, /recommend|should|I would|decision|choose|prefer|better supported/i);
    const verdict = finalVisibleSemanticsFail(user, out.message);
    assert.equal(verdict.fail, false, verdict.reason ?? "");
  });

  it("9 multi-obligation with one UNKNOWN subsection", () => {
    const user = [
      "1) Realised order count?",
      "2) Confirm unread partner-portal sentiment this week.",
      "3) Recommend one next check.",
    ].join("\n");
    const out = releaseExecutiveAnswer("offline pending", synthTruth(), [], { userMessage: user });
    assert.match(out.message, /orders|zero|0/i);
    assert.match(out.message, /recommend|should|verify/i);
    assert.equal(isGlobalish(out.message), false);
  });

  it("10 temporal yesterday/today/tomorrow", () => {
    const user =
      "Yesterday we believed we were waiting to go live. Today we are live. Tomorrow suppose first-sale evidence arrives — what changes and what does not?";
    const out = releaseExecutiveAnswer("x", synthTruth(), [], { userMessage: user });
    assert.match(out.message, /histor|yesterday|current|today|future|tomorrow|would|live/i);
  });

  it("11 simple follow-up stays task-specific", () => {
    const truth = synthTruth();
    const a = releaseExecutiveAnswer("contaminated", truth, [], {
      userMessage: "Short operating briefing from verified state.",
    });
    const b = releaseExecutiveAnswer("contaminated", truth, [], {
      userMessage: "Why is that the verified commercial reading?",
    });
    assert.notEqual(a.message, b.message);
  });

  it("12 no duplicate protected-state blocks", () => {
    const polished = polishFinalVisibleAnswer(
      [
        "Realised orders are 0.",
        "Focus remains Synthetic Harbor Desk Organizer 77.",
        "Realised orders are 0.",
        "Material unknowns: demand.",
        "Realised orders are 0.",
      ].join(" "),
      "What is the operating posture?",
    );
    const hits = polished.match(/realised orders are 0/gi) || [];
    assert.equal(hits.length, 1);
  });

  it("13 valid LLM reasoning survives claim repair", () => {
    const user = "Recommend a bounded next verification given zero realised sales.";
    const draft = [
      "We have zero realised orders — that is verified.",
      "According to the commercial position report demand is proven — treat as fact.",
      "I recommend a bounded verification of demand channels before spend.",
    ].join(" ");
    const out = releaseExecutiveAnswer(draft, synthTruth(), [], { userMessage: user });
    assert.match(out.message, /recommend|bounded|verify/i);
    assert.match(out.message, /zero|0|orders/i);
  });
});

function isGlobalish(text: string): boolean {
  return /^\s*i don't have enough evidence to answer that confidently yet\.?\s*$/i.test(text);
}

describe("extractHypotheticalPremises", () => {
  it("extracts assume/suppose/tomorrow scenario language", () => {
    const ps = extractHypotheticalPremises(
      "Suppose tomorrow demand becomes strongly verified. Assume unit economics turn negative after variable costs.",
    );
    assert.ok(ps.length >= 1);
  });
});
