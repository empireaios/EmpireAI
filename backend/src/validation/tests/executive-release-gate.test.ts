import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assessConversationalUx,
  buildNaturalExecutiveFallback,
  detectDisclosureLevel,
  detectExecutiveTaskIntent,
  renderForGrandKing,
} from "../../orchestration/pillow-host/executive-conversation-surface.js";
import {
  enforceExecutiveTruthGrounding,
  releaseExecutiveAnswer,
  surgicalRepairDraft,
  validateExecutiveDraft,
} from "../../orchestration/pillow-host/executive-release-gate.js";
import type { ExecutiveTruthSnapshot } from "../../orchestration/pillow-host/executive-truth-types.js";

function synthTruth(over: Partial<ExecutiveTruthSnapshot> = {}): ExecutiveTruthSnapshot {
  const asin = `B0SYN${String(Math.floor(Math.random() * 1e6)).padStart(6, "0")}`.slice(0, 10);
  const base: ExecutiveTruthSnapshot = {
    computedAt: new Date().toISOString(),
    workspaceId: "ws_r3",
    provenance: "live_sqlite_commissioning_kpi_birth",
    product: {
      commissioningId: `opc_syn_${asin.slice(-4).toLowerCase()}`,
      asin,
      productName: "Synthetic Ceramic Desk Organizer Set",
      supplier: "SupplierX",
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
      expectedProfitDisplay: "$2.00",
      expectedProfitTruthClass: "ESTIMATED",
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
  };
  return {
    ...base,
    ...over,
    product: { ...base.product, ...(over.product ?? {}) },
    financial: { ...base.financial, ...(over.financial ?? {}) },
    birth: { ...base.birth, ...(over.birth ?? {}) },
    deploy: { ...base.deploy, ...(over.deploy ?? {}) },
    authority: { ...base.authority, ...(over.authority ?? {}) },
  };
}

function assertNaturalUx(text: string) {
  const ux = assessConversationalUx(text);
  assert.equal(ux.ok, true, `UX failures: ${ux.failures.join(",")}; text=${text}`);
  assert.doesNotMatch(text, /CURRENT_VERIFIED|deployGitCommitSha|commissioningId=/i);
  assert.doesNotMatch(text, /I can only release claims/i);
  assert.doesNotMatch(text, /\n---\n(?:Grounded corrections|Epistemic corrections)/i);
}

describe("Round 3 — claim repair + natural executive surface", () => {
  it("1 verified fact only releases clean and natural", () => {
    const truth = synthTruth();
    const draft =
      "We haven't made a first sale yet. Realised orders are 0. EmpireAI is answering live in production.";
    const out = releaseExecutiveAnswer(draft, truth, [], { userMessage: "Where are we now?" });
    assert.equal(out.telemetry.releasePath, "clean");
    assertNaturalUx(out.message);
  });

  it("2 valid inference from verified evidence is allowed", () => {
    const truth = synthTruth();
    const draft =
      "Realised orders are 0. My best assessment is that demand is still unproven; I treat that as a hypothesis, not a proven fact. What would change my mind is realised sales traction. Next I'd gather demand signals before scaling spend.";
    const out = releaseExecutiveAnswer(draft, truth, [], {
      userMessage: "What do you infer from current commerce evidence?",
    });
    assert.equal(out.telemetry.draftValidationPass, true);
    assert.match(out.message, /hypothesis|assessment|unproven|infer/i);
    assertNaturalUx(out.message);
  });

  it("3 inference mislabeled as verified is demoted or blocked as fact", () => {
    const truth = synthTruth();
    const draft =
      "According to the commercial position report, last quarter sales declined. This is verified fact.";
    const out = releaseExecutiveAnswer(draft, truth, [], { userMessage: "What happened to sales?" });
    assert.ok(out.violations.length > 0);
    assert.doesNotMatch(out.message, /commercial position report/i);
    assert.doesNotMatch(out.message, /This is verified fact/i);
    assert.match(out.message, /unproven|established|realised orders|don't have verified|hypothesis|assessment/i);
    assertNaturalUx(out.message);
  });

  it("4 legitimate hypothesis with uncertainty survives", () => {
    const truth = synthTruth();
    const draft =
      "Hypothesis: the corridor may be weak on demand. Confidence is low. I could be wrong if early orders appear. I'd verify with marketplace demand checks we can actually run.";
    const out = releaseExecutiveAnswer(draft, truth, [], {
      userMessage: "Give me one hypothesis and what would falsify it.",
    });
    assert.equal(out.telemetry.releasePath, "clean");
    assert.match(out.message, /hypothesis|could be wrong|verify/i);
  });

  it("5 unsupported factual assertion does not reach GK as fact", () => {
    const truth = synthTruth();
    const draft = "I retrieved the project management tool and it proves we are ready to scale spend immediately.";
    const out = releaseExecutiveAnswer(draft, truth, [], { userMessage: "Are we ready to scale?" });
    assert.ok(out.violations.includes("UNATTESTED_RETRIEVAL_CLAIM") || out.violations.length > 0);
    assert.doesNotMatch(out.message, /I retrieved the project management tool/i);
    assertNaturalUx(out.message);
  });

  it("6 UNKNOWN with useful reasoning around it is allowed", () => {
    const truth = synthTruth();
    const draft =
      "True demand is still unproven. From zero realised sales I infer we should not assume high demand. Next verification: seek demand evidence before scaling.";
    const out = releaseExecutiveAnswer(draft, truth, [], {
      userMessage: "What don't we know, and what do you still think?",
    });
    assert.equal(out.telemetry.releasePath, "clean");
    assert.match(out.message, /infer|unproven|before scaling/i);
  });

  it("7 recommendation based on mixed verified+unknown evidence", () => {
    const truth = synthTruth();
    const draft =
      "We have zero realised sales. Demand strength is unproven. Recommendation: prioritise cheap verification before irreversible spend — that's judgment under uncertainty, not proven law.";
    const out = releaseExecutiveAnswer(draft, truth, [], {
      userMessage: "What should we do next?",
    });
    assert.equal(out.telemetry.releasePath, "clean");
    assert.match(out.message, /Recommendation|verification|spend/i);
  });

  it("8 high-risk action blocked despite valid hypothesis", () => {
    const truth = synthTruth();
    const draft =
      "Hypothesis: demand may be weak. I can execute production deployment under the operational playbook right now.";
    const out = releaseExecutiveAnswer(draft, truth, [], {
      userMessage: "Should we deploy and spend?",
    });
    assert.ok(out.violations.includes("FALSE_DEPLOY_AUTHORITY") || out.telemetry.releasePath !== "clean");
    assert.match(out.message, /can'?t execute production deploys|Grand King authority|hypothesis|weak/i);
    assert.doesNotMatch(out.message, /I can execute production deployment under the operational playbook/i);
  });

  it("9 claim-level invalidation preserves remaining answer", () => {
    const truth = synthTruth();
    const draft =
      "Realised orders are 0. I accessed the market analysis tool and it confirms dominance. My best assessment is that we still lack demand proof; treat that as a hypothesis.";
    const surgical = surgicalRepairDraft(draft, truth, []);
    assert.ok(surgical.kept >= 2);
    assert.match(surgical.message, /Realised orders are 0/i);
    assert.match(surgical.message, /hypothesis|assessment/i);
    assert.doesNotMatch(surgical.message, /I accessed the market analysis tool/i);
    const out = releaseExecutiveAnswer(draft, truth, [], {
      userMessage: "What do you infer from current evidence?",
    });
    assert.ok(
      out.telemetry.releasePath === "claim_repaired" ||
        out.telemetry.releasePath === "clean" ||
        out.telemetry.releasePath === "natural_reconstructed",
    );
    assert.match(out.message, /hypothesis|assessment|demand|orders/i);
    assertNaturalUx(out.message);
  });

  it("10 whole-answer fail-closed only when genuinely necessary", () => {
    const truth = synthTruth();
    const draft =
      "I reviewed internal discussions and planning documents and supplier communications and the commerce tracking system and I previously accessed all of them and they prove everything.";
    const out = releaseExecutiveAnswer(draft, truth, [], { userMessage: "Prove readiness." });
    assert.ok(["natural_reconstructed", "fail_closed", "claim_repaired"].includes(out.telemetry.releasePath));
    assertNaturalUx(out.message);
  });

  it("task-sensitive natural fallbacks differ by intent", () => {
    const base = {
      productName: "Synthetic Widget",
      asin: "B0SYNTH001",
      orders: 0,
      realisedRevenueUsd: 0,
      birthTimestamp: null as string | null,
      live: true,
      level: "normal" as const,
      hadProvenanceViolation: false,
      hadTemporalViolation: false,
    };
    const a = buildNaturalExecutiveFallback({ ...base, intent: "state" });
    const b = buildNaturalExecutiveFallback({ ...base, intent: "inference" });
    const c = buildNaturalExecutiveFallback({ ...base, intent: "strategy" });
    assert.notEqual(a, b);
    assert.notEqual(b, c);
    assert.match(b, /hypothesis|assessment/i);
    assert.match(c, /Recommendation|spend/i);
    assertNaturalUx(a);
    assertNaturalUx(b);
    assertNaturalUx(c);
  });

  it("progressive disclosure: technical level can include identifiers when asked", () => {
    assert.equal(detectDisclosureLevel("Give me the technical evidence and deploy SHA"), "technical");
    assert.equal(detectExecutiveTaskIntent("How do you know?"), "evidence_request");
    const rendered = renderForGrandKing(
      "Product identity (CURRENT_VERIFIED): Widget. deployGitCommitSha=abc123.",
      "normal",
    );
    assert.doesNotMatch(rendered, /CURRENT_VERIFIED|deployGitCommitSha/i);
    const tech = renderForGrandKing(
      "Bound ASIN B0X. deployGitCommitSha=abc123.",
      "technical",
    );
    assert.match(tech, /deployGitCommitSha=abc123/);
  });

  it("compatibility enforcer never appends Epistemic corrections and avoids dump UX", () => {
    const truth = synthTruth();
    const out = enforceExecutiveTruthGrounding(
      "According to the commercial position report I reviewed, last quarter sales declined. EmpireAI is not yet running in production.",
      truth,
      [],
      { userMessage: "Where are we and what happened to sales?" },
    );
    assert.equal(out.adjusted, true);
    assert.doesNotMatch(out.message, /Epistemic corrections|Grounded corrections/i);
    assert.doesNotMatch(out.message, /I can only release claims|CURRENT_VERIFIED|deployGitCommitSha=/i);
    assert.match(out.message, /live|production|sale|hypothesis|assessment|orders/i);
  });

  it("round-2 safety: offline claim still blocked from primary release", () => {
    const truth = synthTruth();
    const v = validateExecutiveDraft(
      "EmpireAI is not yet running in production; deployment remains pending.",
      truth,
      [],
    );
    assert.equal(v.ok, false);
    const out = releaseExecutiveAnswer(
      "EmpireAI is not yet running in production; deployment remains pending.",
      truth,
      [],
      { userMessage: "Are we live?" },
    );
    assert.doesNotMatch(out.message, /not yet running in production/i);
    assert.match(out.message, /live|production/i);
  });

  it("paraphrase: not-yet-live + pending deployment blocked after naturalization", () => {
    const truth = synthTruth();
    const draft =
      "EmpireAI is not yet live in production. Deployment is pending Grand King approval. We should wait.";
    const out = releaseExecutiveAnswer(draft, truth, [], { userMessage: "Where are we?" });
    assert.ok(out.violations.includes("STALE_OR_FALSE_PRODUCTION_OFFLINE_CLAIM"));
    assert.equal(out.telemetry.finalRevalidationPass, true);
    assert.doesNotMatch(out.message, /not yet live in production/i);
    assert.doesNotMatch(out.message, /deployment is pending Grand King approval/i);
    assert.match(out.message, /live|answering/i);
    assertNaturalUx(out.message);
  });

  it("unsupported market-demand analysis semantics blocked", () => {
    const truth = synthTruth();
    const draft =
      "The product was selected based on market-demand analysis and passed initial market evaluation as a strategic opportunity.";
    const out = releaseExecutiveAnswer(draft, truth, [], {
      userMessage: "Why was this product chosen?",
    });
    assert.ok(
      out.violations.includes("UNSUPPORTED_STATE_SEMANTICS") ||
        out.violations.includes("INVENTED_SOURCE_SYSTEM") ||
        out.violations.includes("UNSUPPORTED_PROVENANCE_CLAIM"),
    );
    assert.doesNotMatch(out.message, /selected based on market-demand analysis/i);
    assert.doesNotMatch(out.message, /passed initial market evaluation/i);
    assert.equal(out.telemetry.finalRevalidationPass, true);
    assertNaturalUx(out.message);
  });

  it("allowed recommendation from verified zero-sales premise", () => {
    const truth = synthTruth();
    const draft =
      "We have zero realised sales, so my priority would be getting to the first real transaction. That is a recommendation under uncertainty, not a proven forecast.";
    const out = releaseExecutiveAnswer(draft, truth, [], {
      userMessage: "What should we prioritise?",
    });
    assert.equal(out.telemetry.releasePath, "clean");
    assert.equal(out.telemetry.finalRevalidationPass, true);
    assert.match(out.message, /zero realised sales|first real transaction|priority/i);
  });

  it("final revalidation rejects if naturalization would leave stale offline text", () => {
    const truth = synthTruth();
    const draft =
      "SynEntity is awaiting production deployment and is not yet live in production according to operational status reports.";
    const out = releaseExecutiveAnswer(draft, truth, [], { userMessage: "Status?" });
    assert.equal(out.telemetry.finalRevalidationPass, true);
    assert.doesNotMatch(out.message, /not yet live|awaiting production deployment/i);
  });
});
