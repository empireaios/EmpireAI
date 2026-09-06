/**
 * DEV lock: demote epistemic Unsupported as open/bounded full-answer writer.
 * Does not encode sealed Wave prompts.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseExecutiveTaskContract,
  synthesizeTaskUnitAnswer,
  buildContractAwareReconstruct,
} from "../../orchestration/pillow-host/executive-task-contract.js";
import {
  isOpenExecutiveReasoningAsk,
  isClaimEvidenceAuditAsk,
  isGenericEpistemicStubSurface,
  shouldAuthorWithEvidenceStructureAudit,
  synthesizeOpenExecutiveReasoning,
  isLiveEmpireAiFactQuery,
  isBoundedDecisionScenario,
} from "../../orchestration/pillow-host/executive-request-execution-plan.js";
import { synthesizeEvidenceStructureAudit } from "../../orchestration/pillow-host/executive-scoped-reasoning.js";
import { buildDecisionCaseState } from "../../orchestration/pillow-host/executive-decision-case-state.js";

function truth() {
  return {
    birth: { birthTimestamp: null as string | null },
    product: { productName: "Mini Fan", asin: null as string | null },
    financial: { orders: 0, revenue: 0 },
    deploy: { serviceOnlineHint: "assume_online_if_answering" as const },
  };
}

const OPEN_ASK =
  "Build a profitable synthetic Amazon-US business using supplier feeds. What would you do first? Do not claim live access you do not have.";

const WARM_BOUNDED =
  "Synthetic new case after live discussion. Eligible if approval granted. NEXO granted. PICO pending. Select the currently eligible supplier.";

const PRINCIPLE_CASE =
  "Synthetic principle case. Rule: pending approval is not currently eligible. MIST: approval granted. HAZE: approval PENDING. Apply the principle and select.";

describe("UNBLOCK epistemic open/bounded writer authority", () => {
  it("classifies open strategy as open reasoning, not claim audit", () => {
    assert.equal(isOpenExecutiveReasoningAsk(OPEN_ASK), true);
    assert.equal(isClaimEvidenceAuditAsk(OPEN_ASK), false);
    assert.equal(
      shouldAuthorWithEvidenceStructureAudit({
        taskKind: "general",
        subject: OPEN_ASK,
        userMessage: OPEN_ASK,
      }),
      false,
    );
  });

  it("EC18 reconstruct does not emit Unverified assertion stub", () => {
    const c = parseExecutiveTaskContract(OPEN_ASK);
    const unit = synthesizeTaskUnitAnswer(c.tasks[0]!, truth() as never, { userMessage: OPEN_ASK });
    assert.equal(isGenericEpistemicStubSurface(unit), false);
    assert.match(unit, /Recommended first moves|ASSUMPTIONS|EVIDENCE_NEEDED/i);
    assert.doesNotMatch(unit, /Unverified assertion/i);
    const rec = buildContractAwareReconstruct(truth() as never, c);
    assert.equal(isGenericEpistemicStubSurface(rec), false);
    assert.doesNotMatch(rec, /\*\*Verdict:\*\*\s*Unverified assertion/i);
  });

  it("warm light eligibility builds decision case and SELECT NEXO", () => {
    const d = buildDecisionCaseState(WARM_BOUNDED);
    assert.ok(d, "decision case expected");
    assert.ok(d!.eligibleSet.includes("NEXO"));
    assert.ok(!d!.eligibleSet.includes("PICO"));
    assert.equal(d!.recommendation.status, "SELECT");
    assert.equal(d!.recommendation.selectedId, "NEXO");
    assert.equal(isBoundedDecisionScenario(WARM_BOUNDED), true);
  });

  it("principle transfer case selects granted, not pending", () => {
    const d = buildDecisionCaseState(PRINCIPLE_CASE);
    assert.ok(d);
    assert.deepEqual(d!.eligibleSet, ["MIST"]);
  });

  it("claim audit still may use epistemic writer", () => {
    const ask =
      'Synthetic. Audit these claims with explicit Verdict each: "BETA is currently eligible." "ALPHA is currently eligible."';
    assert.equal(isClaimEvidenceAuditAsk(ask), true);
    assert.equal(
      shouldAuthorWithEvidenceStructureAudit({
        taskKind: "premise_audit",
        subject: "Claim 1",
        userMessage: ask,
      }),
      true,
    );
    const audit = synthesizeEvidenceStructureAudit(
      "supplier says demand is proven",
      "A supplier says corridor demand is already proven.",
    );
    assert.match(audit, /Unverified assertion/i);
  });

  it("open shell synthesizer stays non-stub", () => {
    const shell = synthesizeOpenExecutiveReasoning(OPEN_ASK, OPEN_ASK);
    assert.equal(isGenericEpistemicStubSurface(shell), false);
    assert.match(shell, /ASSUMPTIONS/);
  });

  it("live fact query remains live-classified", () => {
    const live = "How many realised orders has EmpireAI received this month?";
    assert.equal(isLiveEmpireAiFactQuery(live), true);
    assert.equal(isOpenExecutiveReasoningAsk(live), false);
  });

  it("mere mention of supplier feeds is not Unverified assertion branch", () => {
    const out = synthesizeEvidenceStructureAudit(
      "Build business using supplier feeds",
      "Build a profitable synthetic Amazon-US business using supplier feeds.",
    );
    assert.doesNotMatch(out, /Unverified assertion/i);
  });
});
