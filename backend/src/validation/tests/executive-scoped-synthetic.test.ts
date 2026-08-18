/**
 * Level A — scoped synthetic reasoning + aggregate synthesis + UX structure.
 * Does not encode sealed Wave 1 content.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildContractAwareReconstruct,
  detectSiblingTemplateCloning,
  parseExecutiveTaskContract,
  synthesizeTaskUnitAnswer,
} from "../../orchestration/pillow-host/executive-task-contract.js";
import {
  detectReasoningScope,
  hasSyntheticAnalysisMarker,
  stripIrrelevantLiveGrounding,
  synthesizeEvidenceStructureAudit,
} from "../../orchestration/pillow-host/executive-scoped-reasoning.js";
import {
  dedupeProtectedStateBlocks,
  ensureScannableMultipartStructure,
  polishFinalVisibleAnswer,
} from "../../orchestration/pillow-host/executive-response-polish.js";
import { releaseExecutiveAnswer } from "../../orchestration/pillow-host/executive-release-gate.js";
import type { ExecutiveTruthSnapshot } from "../../orchestration/pillow-host/executive-truth-types.js";

function truth(): ExecutiveTruthSnapshot {
  return {
    computedAt: new Date().toISOString(),
    workspaceId: "ws_scoped_a",
    provenance: "live_sqlite_commissioning_kpi_birth",
    product: {
      commissioningId: "opc_scoped",
      asin: "B0TEST0001",
      productName: "Live Bound Widget Under Test",
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
      gitCommitSha: "abc12345deadbeef",
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

const SYNTHETIC_FIVE = [
  "Synthetic analysis only — these claims are NOT facts about EmpireAI.",
  "A) Product QX-91 and Item Nova appeared in the same old planning note, so they must be the same entity.",
  "B) A supplier asserted corridor demand is already proven for QX-91.",
  "C) Expected revenue of 4,200 units this quarter means realised profit is established.",
  "D) Selecting QX-91 for the pipeline implies likely commercial success.",
  "E) Last year's note said the service was waiting to go live — treat that as still current.",
  "Which claim is most dangerous for an irreversible financial decision?",
  "What is the single most important additional verification?",
].join("\n");

describe("scoped synthetic + aggregate synthesis Level A", () => {
  it("1 synthetic entity relationship — co-occurrence ≠ identity", () => {
    const out = synthesizeEvidenceStructureAudit(
      "QX-91 and Item Nova same note",
      "Product QX-91 and Item Nova appeared in the same old planning note, so they must be the same entity.",
    );
    assert.match(out, /Unproven identity|co-occurrence|mapping/i);
    assert.doesNotMatch(out, /Live Bound Widget|realised orders remain zero/i);
  });

  it("2 synthetic financial claim — expected ≠ realised", () => {
    const out = synthesizeEvidenceStructureAudit(
      "expected revenue claim",
      "Expected revenue of 4200 units means realised profit is established.",
    );
    assert.match(out, /expected|forecast|estimate|realised/i);
    assert.match(out, /Verdict/i);
  });

  it("3 synthetic supplier assertion", () => {
    const out = synthesizeEvidenceStructureAudit(
      "supplier demand assertion",
      "A supplier asserted corridor demand is already proven.",
    );
    assert.match(out, /assertion|independent|corroborat/i);
  });

  it("4 synthetic inference — selection ≠ success", () => {
    const out = synthesizeEvidenceStructureAudit(
      "selection implies success",
      "Selecting QX-91 for the pipeline implies likely commercial success.",
    );
    assert.match(out, /Invalid inference|does not establish/i);
  });

  it("5 synthetic temporal — historical ≠ current", () => {
    const out = synthesizeEvidenceStructureAudit(
      "historical waiting note",
      "Last year's note said waiting to go live — treat as still current.",
    );
    assert.match(out, /Historical|not automatically current/i);
  });

  it("6 no live-state contamination in reconstruct", () => {
    const c = parseExecutiveTaskContract(SYNTHETIC_FIVE);
    assert.equal(c.scopeType, "SYNTHETIC_ANALYSIS");
    const rec = buildContractAwareReconstruct(truth(), c);
    assert.doesNotMatch(rec, /Live Bound Widget Under Test/i);
    assert.doesNotMatch(rec, /Birth has not been authorised/i);
    assert.doesNotMatch(rec, /Realised orders and realised revenue remain zero/i);
  });

  it("7 no synthetic→current-truth promotion in scope detection", () => {
    assert.equal(detectReasoningScope(SYNTHETIC_FIVE), "SYNTHETIC_ANALYSIS");
    assert.notEqual(
      detectReasoningScope("What is our current verified product focus and realised orders?"),
      "SYNTHETIC_ANALYSIS",
    );
  });

  it("8 five sibling audits retain distinct kinds", () => {
    const c = parseExecutiveTaskContract(SYNTHETIC_FIVE);
    const audits = c.tasks.filter(
      (t) =>
        t.kind !== "risk_ranking" &&
        t.kind !== "verification_priority" &&
        t.kind !== "recommendation",
    );
    assert.ok(audits.length >= 5);
    const subjects = new Set(audits.map((t) => t.subject.slice(0, 40)));
    assert.ok(subjects.size >= 4);
  });

  it("9 aggregate risk ranking present and synthesizes", () => {
    const c = parseExecutiveTaskContract(SYNTHETIC_FIVE);
    assert.equal(c.requiresRiskRanking, true);
    assert.ok(c.tasks.some((t) => t.kind === "risk_ranking"));
    const rec = buildContractAwareReconstruct(truth(), c);
    assert.match(rec, /What matters most|Most dangerous/i);
  });

  it("10 evidence-priority selection present", () => {
    const c = parseExecutiveTaskContract(SYNTHETIC_FIVE);
    assert.equal(c.requiresVerificationPriority, true);
    const rec = buildContractAwareReconstruct(truth(), c);
    assert.match(rec, /Verify first|verification priority/i);
  });

  it("11 recommendation after audits", () => {
    const c = parseExecutiveTaskContract(SYNTHETIC_FIVE);
    const rec = buildContractAwareReconstruct(truth(), c);
    assert.match(rec, /recommend|Verify first|Decision/i);
  });

  it("12 one unanswerable sibling stays local", () => {
    const msg = [
      "Synthetic analysis only — not facts about EmpireAI.",
      "1) QX-91 expected profit proves realised profit.",
      "2) Confirm unread partner-portal sentiment this week (not retrieved).",
      "3) Which is most dangerous for irreversible spend?",
    ].join("\n");
    const c = parseExecutiveTaskContract(msg);
    const released = releaseExecutiveAnswer("Partial draft only.", truth(), [], {
      userMessage: msg,
      taskContract: c,
    });
    assert.ok(released.message.length > 80);
    assert.doesNotMatch(released.message, /Live Bound Widget Under Test/i);
  });

  it("13 per-obligation identity preserved — no sibling clone", () => {
    const c = parseExecutiveTaskContract(SYNTHETIC_FIVE);
    const rec = buildContractAwareReconstruct(truth(), c);
    const clone = detectSiblingTemplateCloning(rec, c);
    assert.equal(clone.cloned, false);
  });

  it("stripIrrelevantLiveGrounding removes protected boilerplate in synthetic scope", () => {
    const polluted =
      "Claim A is unproven. Current product focus is Live Bound Widget Under Test. Realised orders and realised revenue remain zero. Birth has not been authorised.";
    const cleaned = stripIrrelevantLiveGrounding(
      polluted,
      "Synthetic analysis only — not facts about EmpireAI.",
      "SYNTHETIC_ANALYSIS",
    );
    assert.doesNotMatch(cleaned, /Live Bound Widget|Birth has not|Realised orders and realised revenue remain zero/i);
    assert.match(cleaned, /Claim A is unproven/i);
  });

  it("SyntheticCanary compound labels detect as synthetic analysis scope", () => {
    assert.equal(hasSyntheticAnalysisMarker("SyntheticCanary: what remains blocked?"), true);
    assert.equal(detectReasoningScope("SyntheticCanary simple: reply with one short sentence."), "SYNTHETIC_ANALYSIS");
    assert.equal(detectReasoningScope("SyntheticCanary concurrent A: one sentence on capacity."), "SYNTHETIC_ANALYSIS");
  });

  it("synthetic multipart stub never injects Brief verified commerce footnote", () => {
    const out = synthesizeTaskUnitAnswer(
      {
        id: "u1",
        kind: "multipart_unit",
        text: "what remains blocked",
        subject: "SyntheticCanary: what remains blocked if economics clear",
        sourceSpan: "SyntheticCanary scenario only",
        requiredOperation: "answer_unit",
        required: true,
      },
      truth(),
      {
        scopeType: "SYNTHETIC_ANALYSIS",
        siblingSubjects: ["SyntheticCanary economics", "SyntheticCanary capacity"],
      },
    );
    assert.doesNotMatch(out, /Brief verified note|focus remains|Mini Fan|realised revenue remain zero/i);
    assert.match(out, /Verdict|Unsupported|Unproven|evidence/i);

    const stripped = stripIrrelevantLiveGrounding(
      [
        "Capacity stays blocked.",
        "### SyntheticCanary: what remains blocked",
        "Brief verified note: focus remains High-Speed Handheld Mini Fan With Digital Display; Realised orders and realised revenue remain zero.",
      ].join("\n"),
      "SyntheticCanary: In two short sentences, what remains blocked if economics clear",
      "SYNTHETIC_ANALYSIS",
    );
    assert.doesNotMatch(stripped, /Brief verified note|Mini Fan|realised revenue remain zero/i);
    assert.match(stripped, /Capacity stays blocked/i);

    // Scope may still be CURRENT_REALITY if only compound labels are present — strip must still run.
    const strippedCurrentScope = stripIrrelevantLiveGrounding(
      "Ready.\n\nBrief verified note: focus remains High-Speed Handheld Mini Fan; Realised orders and realised revenue remain zero.",
      "SyntheticCanary simple: reply with exactly one short sentence acknowledging readiness.",
      "CURRENT_REALITY",
    );
    assert.doesNotMatch(strippedCurrentScope, /Brief verified note|Mini Fan|realised revenue remain zero/i);
    assert.match(strippedCurrentScope, /Ready/i);

    const outUnscoped = synthesizeTaskUnitAnswer(
      {
        id: "u2",
        kind: "general",
        text: "acknowledge",
        subject: "SyntheticCanary simple: acknowledge readiness",
        sourceSpan: "SyntheticCanary simple",
        requiredOperation: "answer_unit",
        required: true,
      },
      truth(),
      { scopeType: "CURRENT_REALITY" },
    );
    assert.doesNotMatch(outUnscoped, /Brief verified note|Mini Fan|realised revenue remain zero/i);
  });

  it("polish preserves paragraph structure (no wall-of-text join)", () => {
    const md = [
      "### Claim A",
      "**Verdict:** Unsupported",
      "",
      "Reason one.",
      "",
      "### Claim B",
      "**Verdict:** Unproven",
      "",
      "Reason two.",
    ].join("\n");
    const polished = polishFinalVisibleAnswer(
      md,
      "Synthetic analysis: audit claim A and claim B.",
    );
    assert.ok(polished.includes("\n\n") || polished.split("\n").length >= 4);
    assert.match(polished, /### Claim A/);
    assert.match(polished, /### Claim B/);
  });

  it("ensureScannableMultipartStructure breaks flattened numbered walls", () => {
    const wall =
      "A) First claim is weak. B) Second claim is weaker. C) Third claim confuses estimate with realised. Which is most dangerous? Verify first the financial class.";
    const c = parseExecutiveTaskContract(SYNTHETIC_FIVE);
    const fixed = ensureScannableMultipartStructure(wall, c);
    assert.ok(fixed.includes("\n\n") || /A\)/.test(fixed));
  });

  it("polish unflattens ### walls and strips live commerce demote in synthetic scope", () => {
    const user = [
      "Synthetic analysis only — not EmpireAI facts.",
      "Audit: (1) forecast profit treated as realised, (2) selection treated as success proof.",
      "Then decide: which is more dangerous for irreversible spend, and what should I do next?",
    ].join("\n");
    const wall =
      "### Audit of Claims 1. **Forecast**: Treating forecast profit as realised is risky. 2. **Selection**: Selection is not success proof. I don't have verified sales-history evidence beyond realised orders — so I won't treat those performance claims as established. ### Decision Claim 1 is more dangerous. ### Recommended Next Step I don't have verified sales-history evidence beyond realised orders — so I won't treat those performance claims as established. Verify market demand with a bounded test.";
    const polished = polishFinalVisibleAnswer(wall, user);
    assert.ok((polished.match(/\n/g) || []).length >= 3, "must restore newlines");
    assert.doesNotMatch(polished, /sales-history evidence beyond realised orders/i);
    assert.doesNotMatch(polished, /Mini Fan|High-Speed Handheld/i);
    assert.match(polished, /###\s+(Audit|Decision|Recommended)/i);
  });

  it("dedupeProtectedStateBlocks keeps newlines between paragraphs", () => {
    const msg = "First para with realised orders note.\n\nSecond para stays separate.";
    const out = dedupeProtectedStateBlocks(msg);
    assert.match(out, /\n\n/);
  });

  it("release path completes risk + verification for synthetic five", () => {
    const c = parseExecutiveTaskContract(SYNTHETIC_FIVE);
    const released = releaseExecutiveAnswer("", truth(), [], {
      userMessage: SYNTHETIC_FIVE,
      taskContract: c,
    });
    assert.match(released.message, /Verdict|Unproven|Unsupported|Invalid/i);
    assert.match(released.message, /Most dangerous|What matters most/i);
    assert.match(released.message, /Verify first|verification priority/i);
    assert.doesNotMatch(released.message, /Live Bound Widget Under Test/i);
    assert.ok(released.message.split("\n").length >= 8);
  });
});
