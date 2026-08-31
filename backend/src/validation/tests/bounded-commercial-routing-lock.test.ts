/**
 * Bounded commercial routing + epistemic fallback authority lock.
 * Does not encode Orion/Pioneer sealed content.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  detectReasoningScope,
  synthesizeEvidenceStructureAudit,
} from "../../orchestration/pillow-host/executive-scoped-reasoning.js";
import {
  parseExecutiveTaskContract,
  synthesizeTaskUnitAnswer,
  buildContractAwareReconstruct,
} from "../../orchestration/pillow-host/executive-task-contract.js";
import {
  detectRequestExecutionMode,
  isBoundedDecisionScenario,
  isLiveEmpireAiFactQuery,
  synthesizeBoundedDecisionObligation,
} from "../../orchestration/pillow-host/executive-request-execution-plan.js";
import { buildDecisionCaseState } from "../../orchestration/pillow-host/executive-decision-case-state.js";
import { extractQuotedClaimsOnly } from "../../orchestration/pillow-host/executive-canonical-state.js";

const NO_MAGIC_PACK = [
  "Acme has three suppliers. Choose one using these rules.",
  "Rule: eligible only if cost <= 400000 AND delivery >= 94% AND approval granted.",
  "If exactly one eligible, select that supplier.",
  "RIVER: cost 350000 PASS; delivery 96% PASS; approval granted PASS.",
  "STONE: cost 360000 PASS; delivery 95% PASS; approval PENDING FAIL.",
  "HILL: cost 340000 PASS; delivery 93% FAIL; approval granted PASS.",
  "Answer in exactly 5 numbered sections.",
  "1. Snapshot",
  "2. Gate detail",
  "3. Eligible set",
  "4. Recommendation",
  "5. Closing",
].join("\n");

const CLAIM_PACK = [
  "SyntheticBoundClaims — procurement only. Do not mention Mini Fan or Birth.",
  "Rule: eligible if approval granted.",
  "NORD: approval granted PASS.",
  "SUD: approval PENDING FAIL.",
  "Answer in exactly 4 numbered sections.",
  "1. Snapshot",
  "2. Eligible set",
  "3. Claim audit",
  "4. Closing",
  "Audit these claims with explicit Verdict each:",
  '"SUD is currently eligible."',
  '"NORD is currently eligible."',
].join("\n");

describe("Bounded commercial routing + fallback authority", () => {
  it("detects bounded decision without magic hypothetical wording", () => {
    assert.equal(isBoundedDecisionScenario(NO_MAGIC_PACK), true);
    assert.equal(detectRequestExecutionMode(NO_MAGIC_PACK), "BOUNDED_HYPOTHETICAL_ANALYSIS");
    assert.equal(detectReasoningScope(NO_MAGIC_PACK), "SYNTHETIC_ANALYSIS");
  });

  it("does not classify live order queries as bounded synthetic", () => {
    const live = "How many realised orders has EmpireAI received this month?";
    assert.equal(isLiveEmpireAiFactQuery(live), true);
    assert.equal(detectRequestExecutionMode(live), "LIVE_EMPIREAI_FACT_QUERY");
    assert.notEqual(detectReasoningScope(live), "SYNTHETIC_ANALYSIS");
  });

  it("section titles are not extracted as claims", () => {
    const claims = extractQuotedClaimsOnly(CLAIM_PACK);
    assert.equal(claims.length, 2);
    assert.ok(!claims.some((c) => /snapshot|eligible set|closing/i.test(c)));
    const contract = parseExecutiveTaskContract(CLAIM_PACK);
    assert.equal(contract.expectedTopLevelSections, 4);
    assert.ok(contract.tasks.some((t) => t.id.startsWith("claim_")));
    assert.ok(contract.tasks.some((t) => /^t\d+$/.test(t.id)));
  });

  it("decision-aware synthesis replaces Unsupported takeover for Snapshot", () => {
    const d = buildDecisionCaseState(NO_MAGIC_PACK)!;
    assert.deepEqual(d.eligibleSet, ["RIVER"]);
    const body = synthesizeBoundedDecisionObligation("Snapshot", d, NO_MAGIC_PACK)!;
    assert.ok(!/Unsupported as established fact/i.test(body));
    assert.ok(/SELECT RIVER|Eligible Suppliers:\s*RIVER/i.test(body));
    assert.ok(/scenario/i.test(body));
  });

  it("synthesizeTaskUnitAnswer uses decision path before epistemic stub", () => {
    const contract = parseExecutiveTaskContract(NO_MAGIC_PACK);
    const truth = {
      birth: { birthTimestamp: null as string | null },
      product: { productName: "Mini Fan", asin: null as string | null },
      financial: { orders: 0, revenue: 0 },
      deploy: { serviceOnlineHint: "assume_online_if_answering" as const },
    };
    const snap = contract.tasks.find((t) => /snapshot/i.test(t.subject || t.sourceSpan || ""));
    assert.ok(snap);
    const out = synthesizeTaskUnitAnswer(snap!, truth as never, {
      scopeType: contract.scopeType,
      userMessage: NO_MAGIC_PACK,
    });
    assert.ok(!/Unsupported as established fact/i.test(out));
    assert.ok(/RIVER/i.test(out));
    assert.ok(/SELECT RIVER|currently eligible/i.test(out));
  });

  it("reconstruct numbers sections 1..N without Unsupported clone takeover", () => {
    const contract = parseExecutiveTaskContract(NO_MAGIC_PACK);
    const truth = {
      birth: { birthTimestamp: null as string | null },
      product: { productName: "Mini Fan", asin: null as string | null },
      financial: { orders: 0, revenue: 0 },
      deploy: { serviceOnlineHint: "assume_online_if_answering" as const },
    };
    const rebuilt = buildContractAwareReconstruct(truth as never, contract);
    const unsupported = (rebuilt.match(/Unsupported as established fact/gi) || []).length;
    assert.ok(unsupported === 0, `unsupported count=${unsupported}`);
    assert.ok(/^1[.)]\s+/m.test(rebuilt) || /###\s*1\)/i.test(rebuilt));
    assert.ok(/^2[.)]\s+/m.test(rebuilt) || /###\s*2\)/i.test(rebuilt));
    assert.ok(/SELECT RIVER|Eligible Suppliers:\s*RIVER/i.test(rebuilt));
    const markers = [...rebuilt.matchAll(/^(?:#{1,3}\s*)?(\d+)[.)]/gm)].map((m) => Number(m[1]));
    if (markers.length >= 3) {
      assert.ok(new Set(markers).size > 1, `markers=${markers.join(",")}`);
    }
  });

  it("epistemic template alone does not treat Snapshot as Unsupported claim", () => {
    const audit = synthesizeEvidenceStructureAudit("Snapshot", "1. Snapshot");
    assert.ok(!/Unsupported as established fact/i.test(audit));
    assert.ok(/Task obligation|scenario pack/i.test(audit));
  });
});
