import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  RetrievalAttestationLedger,
  attestExecutiveTruthSnapshotReads,
  classifyClaimOrigin,
  enforceEpistemicGrounding,
  formatEpistemicDisciplineBrief,
  validateEpistemicDraft,
} from "../../orchestration/pillow-host/executive-epistemic-grounding.js";
import type { ExecutiveTruthSnapshot } from "../../orchestration/pillow-host/executive-truth-types.js";
import { enforceExecutiveTruthGrounding } from "../../orchestration/pillow-host/executive-release-gate.js";
import { getPillowCapabilityRegistry } from "../../orchestration/pillow-host/pillow-capability-registry.js";

function synthTruth(over: Partial<ExecutiveTruthSnapshot> = {}): ExecutiveTruthSnapshot {
  const asin = `B0SYN${String(Math.floor(Math.random() * 1e6)).padStart(6, "0")}`.slice(0, 10);
  const base: ExecutiveTruthSnapshot = {
    computedAt: new Date().toISOString(),
    workspaceId: "ws_epistemic_test",
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

describe("executive epistemic grounding — Round A deterministic", () => {
  it("capability registry marks PM/email/audit tools unavailable", () => {
    const regs = getPillowCapabilityRegistry();
    const pm = regs.find((c) => c.id === "project_management_tool");
    const mail = regs.find((c) => c.id === "gmail_inbox");
    assert.equal(pm?.availability, "unavailable");
    assert.equal(mail?.availability, "unavailable");
    assert.ok(regs.some((c) => c.id === "live_sqlite_commissioning" && c.availability === "available"));
  });

  it("attestation ledger records snapshot reads separately from existence", () => {
    const truth = synthTruth();
    const ledger = new RetrievalAttestationLedger();
    assert.equal(ledger.has("live_sqlite_commissioning"), false);
    attestExecutiveTruthSnapshotReads(ledger, truth, "req_test_1");
    assert.equal(ledger.has("live_sqlite_commissioning"), true);
    assert.equal(ledger.has("project_management_tool"), false);
  });

  it("detects unattested personal retrieval of invented systems (no appendix)", () => {
    const truth = synthTruth();
    const answer =
      "I accessed this information directly from the project management tool and reviewed the latest audit reports. I participated in these discussions and reviewed the documents.";
    const violations = validateEpistemicDraft(answer, {
      truth,
      attestations: [],
      liveAnswerImpliesProductionOnline: true,
    });
    assert.ok(violations.includes("UNATTESTED_RETRIEVAL_CLAIM"));
    const result = enforceEpistemicGrounding(answer, {
      truth,
      attestations: [],
      liveAnswerImpliesProductionOnline: true,
    });
    assert.equal(result.adjusted, true);
    assert.doesNotMatch(result.message, /Epistemic corrections/i);
  });

  it("temporal precedence: live deploy SHA defeats not-in-production claims", () => {
    const truth = synthTruth();
    const answer =
      "EmpireAI is not serving the Grand King through a live production environment right now due to absence of live operational metrics.";
    const violations = validateEpistemicDraft(answer, {
      truth,
      attestations: [],
      liveAnswerImpliesProductionOnline: true,
    });
    assert.ok(violations.includes("STALE_OR_FALSE_PRODUCTION_OFFLINE_CLAIM"));
  });

  it("allows UNKNOWN without inventing systems", () => {
    const truth = synthTruth();
    const answer =
      "I cannot substantiate that I accessed those sources. Provenance is UNKNOWN. I infer only from runtime_verified commissioning KPI state.";
    const result = enforceEpistemicGrounding(answer, {
      truth,
      attestations: [],
      liveAnswerImpliesProductionOnline: true,
    });
    assert.equal(result.adjusted, false);
  });

  it("classifyClaimOrigin marks fabricated personal retrieval", () => {
    const origin = classifyClaimOrigin({
      text: "I retrieved the selection criteria from the market analysis tool.",
      attestedCapabilityIds: [],
      runtimeVerified: false,
    });
    assert.equal(origin, "fabricated");
  });

  it("integrated release gate catches commerce fabrication and provenance without appendix", () => {
    const truth = synthTruth();
    const answer =
      "According to operational audits and the project management tool I reviewed, last quarter sales declined. EmpireAI is not yet running in production.";
    const out = enforceExecutiveTruthGrounding(answer, truth, []);
    assert.equal(out.adjusted, true);
    assert.ok(
      out.violations.includes("FABRICATED_COMMERCE_OR_FINANCIAL_CLAIM") ||
        out.violations.includes("UNATTESTED_RETRIEVAL_CLAIM") ||
        out.violations.includes("STALE_OR_FALSE_PRODUCTION_OFFLINE_CLAIM"),
    );
    assert.doesNotMatch(out.message, /Epistemic corrections|Grounded corrections/i);
    assert.doesNotMatch(out.message, /last quarter sales declined/i);
  });

  it("brief includes epistemic discipline and capability registry", () => {
    const truth = synthTruth();
    const ledger = new RetrievalAttestationLedger();
    attestExecutiveTruthSnapshotReads(ledger, truth, "req_brief");
    const brief = formatEpistemicDisciplineBrief({
      truth,
      attestations: ledger.list(),
      liveAnswerImpliesProductionOnline: true,
    });
    assert.match(brief, /Epistemic discipline/);
    assert.match(brief, /capability registry/i);
    assert.match(brief, /Attested retrievals this turn/);
    assert.match(brief, /never invent/i);
  });

  it("partial correction with residual fabricated system labels is tightened", () => {
    const truth = synthTruth();
    const answer =
      "I cannot substantiate that I accessed this source. The Project Management Tool and Internal Audit System and Meeting Notes Repository remain my reference frames.";
    const result = enforceEpistemicGrounding(answer, {
      truth,
      attestations: [],
      liveAnswerImpliesProductionOnline: true,
    });
    assert.equal(result.adjusted, true);
    assert.ok(
      result.violations.includes("PARTIAL_CORRECTION_WITH_RESIDUAL_FABRICATION") ||
        result.violations.includes("INVENTED_SOURCE_SYSTEM") ||
        result.violations.includes("UNATTESTED_RETRIEVAL_CLAIM"),
    );
  });
});
