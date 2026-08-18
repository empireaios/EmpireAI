/**
 * Foundation reset Level A — compositional routing + birth lessons + corpus + streak.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  classifyLocalObligationKind,
  parseExecutiveTaskContract,
  synthesizeTaskUnitAnswer,
} from "../../orchestration/pillow-host/executive-task-contract.js";
import {
  hasAuthoritySemanticsMarker,
} from "../../orchestration/pillow-host/executive-authority-semantics.js";
import {
  CONSTITUTIONAL_SPECIMENS,
  gradeConstitutionalAnswer,
  runConstitutionalCorpus,
} from "../../orchestration/pillow-host/constitutional-regression-corpus.js";
import {
  capabilitiesInvalidatedByPaths,
  describeTenXGauntletFramework,
  getExecutiveCapabilityState,
  recordMaterialFailure,
  recordCleanPass,
} from "../../orchestration/pillow-host/certification-constitution.js";
import {
  birthExecutiveLessonSeeds,
  seedBirthExecutiveLessons,
} from "../../orchestration/executive-learning/birth-executive-lessons.js";
import { releaseExecutiveAnswer } from "../../orchestration/pillow-host/executive-release-gate.js";
import type { ExecutiveTruthSnapshot } from "../../orchestration/pillow-host/executive-truth-types.js";
import {
  listInstitutionalMemory,
  resetInstitutionalMemoryRepository,
} from "../../orchestration/executive-learning/institutional-memory-service.js";

function truth(): ExecutiveTruthSnapshot {
  return {
    computedAt: new Date().toISOString(),
    workspaceId: "ws_foundation",
    provenance: "live_sqlite_commissioning_kpi_birth",
    product: {
      commissioningId: "opc_f",
      asin: "B0FOUND001",
      productName: "High-Speed Handheld Mini Fan With Digital Display",
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
      gitCommitSha: "foundation01",
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
      requiresGrandKing: ["Spend", "Birth"],
      truthClass: "CURRENT_VERIFIED",
    },
    demandEvidence: "UNKNOWN",
    notes: [],
  };
}

describe("foundation reset — compositional routing", () => {
  it("1 pure evidence with up to $ does not mark authority", () => {
    const msg =
      "Synthetic analysis: historical forecast said revenue up to $42000. Classify the forecast. Do not mention products.";
    assert.equal(hasAuthoritySemanticsMarker(msg), false);
    assert.notEqual(classifyLocalObligationKind(msg), "delegation_analysis");
  });

  it("2 pure evidence release has no Delegation reading or Mini Fan", () => {
    const user = [
      "SyntheticCanaryEvidence — analysis only. Do not mention EmpireAI products, Birth, sales, or revenue.",
      "Historical note: ZX-Alpha was forecast to reach revenue up to $12500.",
      "1) Classify the forecast",
      "2) What remains unproven?",
    ].join("\n");
    const out = releaseExecutiveAnswer("", truth(), [], { userMessage: user }).message;
    assert.doesNotMatch(out, /### Delegation reading|### Authority reading/i);
    assert.doesNotMatch(out, /Mini Fan|realised revenue remain zero|Brief verified note/i);
  });

  it("3 real delegation still classified as authority family", () => {
    const msg =
      "I authorize Pillow standing discretion below $900. Do not ask again. Is capability present?";
    assert.equal(hasAuthoritySemanticsMarker(msg), true);
    const kind = classifyLocalObligationKind(msg);
    assert.ok(
      [
        "delegation_analysis",
        "authority_analysis",
        "capability_analysis",
        "approval_requirement",
      ].includes(kind),
      kind,
    );
  });

  it("4 mixed multipart keeps evidence sibling off delegation", () => {
    const user = [
      "SyntheticCanaryMixed:",
      "1) Audit forecast revenue up to $8000 — is it realised?",
      "2) Separately: I authorize discretion below $300 for reversible tests — is that authorization?",
    ].join("\n");
    const c = parseExecutiveTaskContract(user);
    assert.ok(c.tasks.length >= 2);
    const kinds = c.tasks.map((t) => t.kind);
    assert.ok(
      kinds.some((k) => k === "premise_audit" || k === "multipart_unit" || k === "evidence_explanation"),
      String(kinds),
    );
    assert.ok(
      kinds.some((k) =>
        /authority|delegation|approval|capability|execution/i.test(k),
      ),
      String(kinds),
    );
  });
});

describe("foundation reset — birth lessons + corpus + streak", () => {
  it("5 birth lessons seed idempotently into EKLS", () => {
    resetInstitutionalMemoryRepository();
    const first = seedBirthExecutiveLessons("ws_foundation_seed");
    assert.ok(first.seeded >= 10);
    assert.ok(first.created >= 10);
    const again = seedBirthExecutiveLessons("ws_foundation_seed");
    assert.equal(again.created, 0);
    const listed = listInstitutionalMemory("ws_foundation_seed");
    assert.ok(listed.some((m) => m.canonicalKey?.includes("birth.lesson")));
  });

  it("6 seeds have provenance and no sealed exam entities", () => {
    for (const s of birthExecutiveLessonSeeds("ws_x")) {
      assert.ok(s.evidenceRefs && s.evidenceRefs.length > 0);
      assert.doesNotMatch(s.statement, /\bOrion\b|\bNova\b|\bR-72\b|\bHelios\b/i);
      assert.doesNotMatch(s.canonicalKey, /orion|nova|helios/i);
    }
  });

  it("7 constitutional corpus grades evidence and authority specimens", () => {
    // Use the real release path — stub synthesizers miss hetero/governance oracles
    // (Foundation contradiction: weak stubs can PASS while live reconstruct fails).
    const run = runConstitutionalCorpus(
      (prompt) => releaseExecutiveAnswer("", truth(), [], { userMessage: prompt }).message,
      2,
    );
    assert.equal(run.fail, 0, JSON.stringify(run.results.filter((r) => !r.ok)));
  });

  it("8 corpus fails hijacked evidence answer", () => {
    const specimen = CONSTITUTIONAL_SPECIMENS.find((s) => s.id === "cr.evidence_ne_delegation")!;
    const bad = gradeConstitutionalAnswer(
      specimen,
      "### Delegation reading — forecast\nStanding delegation with bound $42000. Focus remains Mini Fan; realised revenue remain zero.",
    );
    assert.equal(bad.ok, false);
  });

  it("9 certification streak resets on material failure", () => {
    let s = getExecutiveCapabilityState().waves[0]!;
    s = recordCleanPass(s, "abc123");
    assert.equal(s.currentCertificationStreak, 1);
    s = recordMaterialFailure(s, "evidence_to_authority_hijack");
    assert.equal(s.currentCertificationStreak, 0);
    assert.equal(s.status, "RESET");
  });

  it("10 change-impact invalidates authority+evidence on task-contract touch", () => {
    const caps = capabilitiesInvalidatedByPaths([
      "backend/src/orchestration/pillow-host/executive-task-contract.ts",
    ]);
    assert.ok(caps.includes("compositional_routing"));
    assert.ok(caps.includes("evidence_discipline"));
  });

  it("11 10x gauntlet framework present", () => {
    const g = describeTenXGauntletFramework();
    assert.ok(g.dimensions.length >= 8);
  });

  it("12 synthesizeTaskUnitAnswer on synthetic evidence does not emit delegation", () => {
    const out = synthesizeTaskUnitAnswer(
      {
        id: "t1",
        kind: "premise_audit",
        text: "forecast revenue up to $9000",
        sourceSpan: "forecast revenue up to $9000",
        subject: "forecast revenue up to $9000",
        requiredOperation: "audit_claim_truth",
        required: true,
      },
      truth(),
      { scopeType: "SYNTHETIC_ANALYSIS" },
    );
    assert.doesNotMatch(out, /Delegation reading|Mini Fan/i);
  });
});
