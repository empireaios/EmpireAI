/**
 * Narrow T2 closure — heterogeneous obligation identity / no sibling template cloning.
 * Does NOT encode sealed Wave 1 T2 content.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildContractAwareReconstruct,
  classifyLocalObligationKind,
  detectSiblingTemplateCloning,
  parseExecutiveTaskContract,
} from "../../orchestration/pillow-host/executive-task-contract.js";
import { releaseExecutiveAnswer } from "../../orchestration/pillow-host/executive-release-gate.js";
import type { ExecutiveTruthSnapshot } from "../../orchestration/pillow-host/executive-truth-types.js";

function synthTruth(): ExecutiveTruthSnapshot {
  return {
    computedAt: new Date().toISOString(),
    workspaceId: "ws_t2_narrow",
    provenance: "live_sqlite_commissioning_kpi_birth",
    product: {
      commissioningId: "opc_t2n",
      asin: "B0SYNT2NAR1",
      productName: "Synthetic Cascade Bottle Brush 19",
      supplier: "SupplierN",
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
      gitCommitSha: "t2narrow001",
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

const HETERO = [
  "A) Is the claim that we are still waiting to go live currently true?",
  "B) Is the claim that we already have realised revenue this month true?",
  "C) Is the bound product identity established in commissioning?",
  "D) Is the alleged external research report substantiated by retrieval this turn?",
  "E) Does product selection by itself imply likely commercial success?",
  "Which of these are dangerous to treat as established?",
  "What should I do next as a bounded recommendation?",
].join("\n");

describe("T2 narrow — heterogeneous obligation identity", () => {
  it("1 five heterogeneous siblings keep distinct kinds", () => {
    const c = parseExecutiveTaskContract(HETERO);
    assert.ok(c.multipart);
    assert.ok(c.tasks.length >= 5);
    const kinds = c.tasks.slice(0, 5).map((t) => t.kind);
    assert.ok(new Set(kinds).size >= 3, `kinds=${kinds.join(",")}`);
    assert.ok(kinds.some((k) => k === "temporal_reconciliation"));
    assert.ok(kinds.some((k) => k === "premise_audit"));
    assert.ok(kinds.some((k) => k === "evidence_explanation" || k === "inference"));
  });

  it("2 temporal sibling does not force all siblings temporal", () => {
    const c = parseExecutiveTaskContract(HETERO);
    const temporalCount = c.tasks.filter((t) => t.kind === "temporal_reconciliation").length;
    assert.ok(temporalCount <= 2, `temporalCount=${temporalCount}`);
  });

  it("3 source spans preserved per task", () => {
    const c = parseExecutiveTaskContract(HETERO);
    for (const t of c.tasks.slice(0, 5)) {
      assert.ok(t.sourceSpan.length >= 10);
      assert.equal(t.text, t.sourceSpan);
      assert.ok(t.subject.length >= 8);
      assert.ok(t.requiredOperation.length >= 4);
    }
    assert.match(c.tasks[0]!.sourceSpan, /waiting to go live|live/i);
    assert.match(c.tasks[1]!.sourceSpan, /revenue/i);
  });

  it("4 reconstruct answers are not cloned temporal templates", () => {
    const truth = synthTruth();
    const c = parseExecutiveTaskContract(HETERO);
    const out = buildContractAwareReconstruct(truth, c);
    const clone = detectSiblingTemplateCloning(out, c);
    assert.equal(clone.cloned, false, clone.reason ?? "");
    assert.match(out, /Claim audit|Financial reading|Entity reading|Provenance|Inference/i);
    assert.ok((out.match(/Temporal audit/gi) || []).length <= 2);
  });

  it("5 duplicate semantic detector flags cloned temporal spam", () => {
    const c = parseExecutiveTaskContract(HETERO);
    const spam = [
      "1) Temporal read: Historically waiting. Currently live.",
      "2) Temporal read: Historically waiting. Currently live.",
      "3) Temporal read: Historically waiting. Currently live.",
      "4) Temporal read: Historically waiting. Currently live.",
      "5) Temporal read: Historically waiting. Currently live.",
    ].join("\n");
    const hit = detectSiblingTemplateCloning(spam, c);
    assert.equal(hit.cloned, true);
  });

  it("6 release gate does not emit sibling template cloning", () => {
    const out = releaseExecutiveAnswer(
      "According to commercial position report this is verified fact. EmpireAI is offline.",
      synthTruth(),
      [],
      { userMessage: HETERO },
    );
    const c = parseExecutiveTaskContract(HETERO);
    const clone = detectSiblingTemplateCloning(out.message, c);
    assert.equal(clone.cloned, false, `${clone.reason} :: ${out.message.slice(0, 300)}`);
    assert.match(out.message, /recommend|should|I would|bounded/i);
  });

  it("7 original correct LLM answer preserved when already distinct", () => {
    const good = [
      "A) Waiting-to-go-live is superseded — we are live now.",
      "B) Realised revenue claim is false — orders and revenue are zero.",
      "C) Product identity is established in commissioning for Synthetic Cascade Bottle Brush 19.",
      "D) External research is not substantiated this turn — no retrieval.",
      "E) Selection does not imply likely success; that is an unsupported inference.",
      "Dangerous if treated as established: B, D, E.",
      "Recommendation: verify demand with a bounded check before spend.",
    ].join("\n");
    const out = releaseExecutiveAnswer(good, synthTruth(), [], { userMessage: HETERO });
    assert.match(out.message, /zero|false|not substantiat|inference|recommend/i);
    assert.doesNotMatch(out.message, /Temporal read: Historically, earlier pre-launch waiting language may have been true at the time[\s\S]*Temporal read: Historically/);
  });

  it("8 bullet-form heterogeneous request", () => {
    const user = [
      "- Is deployment still pending as current state?",
      "- Did we already make realised revenue?",
      "- Confirm bound product identity.",
      "- Is the market study retrieved this turn?",
      "- Does selection imply success?",
      "- Recommend next bounded step.",
    ].join("\n");
    const c = parseExecutiveTaskContract(user);
    assert.ok(c.tasks.length >= 5);
    assert.ok(new Set(c.tasks.map((t) => t.kind)).size >= 3);
  });

  it("9 table-like heterogeneous request", () => {
    const user = [
      "Claim | Audit needed",
      "Service offline | Is this currently true?",
      "Revenue this month | Is financial claim true?",
      "Product ASIN identity | Verify entity",
      "Partner research memo | Provenance?",
      "Selection = success | Valid inference?",
      "What should I do next?",
    ].join("\n");
    const c = parseExecutiveTaskContract(user);
    assert.ok(c.multipart || c.tasks.length >= 4);
  });

  it("10 local classifier ignores sibling contamination", () => {
    assert.equal(
      classifyLocalObligationKind("Is realised revenue already established this month?"),
      "premise_audit",
    );
    assert.equal(
      classifyLocalObligationKind("Is the alleged research report substantiated by retrieval?"),
      "evidence_explanation",
    );
    assert.ok(
      ["temporal_reconciliation", "operating_briefing"].includes(
        classifyLocalObligationKind("Are we still waiting to go live right now?"),
      ),
    );
  });

  it("11 one sibling unanswerable others answerable", () => {
    const user = [
      "1) Realised order count?",
      "2) Confirm unread supplier mailbox sentiment this week.",
      "3) Bound product focus?",
      "4) Recommend one next check.",
    ].join("\n");
    const out = releaseExecutiveAnswer("contaminated offline pending", synthTruth(), [], {
      userMessage: user,
    });
    assert.match(out.message, /orders|zero|0/i);
    assert.match(out.message, /recommend|should/i);
  });

  it("12 reordered heterogeneous list still classifies by semantics", () => {
    const reordered = [
      "1) Does selection imply likely success?",
      "2) Is realised revenue already true?",
      "3) Are we still waiting to go live?",
      "4) Is product identity established?",
      "5) Is external research substantiated?",
      "6) Recommend a bounded next move.",
    ].join("\n");
    const c = parseExecutiveTaskContract(reordered);
    assert.equal(c.tasks[0]!.kind, "inference");
    assert.equal(c.tasks[1]!.kind, "premise_audit");
    assert.ok(
      c.tasks[2]!.kind === "temporal_reconciliation" ||
        c.tasks[2]!.kind === "operating_briefing",
    );
  });
});
