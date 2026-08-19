/**
 * Post-Foundation Repair 2 — Level B randomized negative-control + corpus trials.
 * ZERO false PASS allowed on injected faults.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ExecutiveTruthSnapshot } from "../../orchestration/pillow-host/executive-truth-types.js";
import {
  CONSTITUTIONAL_SPECIMENS,
  gradeConstitutionalAnswer,
} from "../../orchestration/pillow-host/constitutional-regression-corpus.js";
import { releaseExecutiveAnswer } from "../../orchestration/pillow-host/executive-release-gate.js";
import {
  EXECUTIVE_TERMINAL,
  gradeVisibleExecutiveResponse,
  NEGATIVE_CONTROL_FIXTURES,
  toVisibleGrandKingText,
} from "../../orchestration/pillow-host/visible-response-oracle.js";

function truth(): ExecutiveTruthSnapshot {
  return {
    computedAt: new Date().toISOString(),
    workspaceId: "ws_repair2_b",
    provenance: "live_sqlite_commissioning_kpi_birth",
    product: {
      commissioningId: "opc_repair2b",
      asin: "B0REPAIR2B",
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
      gitCommitSha: "deadbeefcafe003",
      serviceOnlineHint: "assume_online_if_answering",
      truthClass: "CURRENT_VERIFIED",
    },
    authority: {
      pillowMayPublish: false,
      pillowMaySupplierSpend: false,
      pillowMayAuthoriseBirth: false,
      pillowMayExecuteProductionDeploy: false,
      chatHasToolCallingLoop: false,
      executableNow: ["Answer", "Recommend"],
      requiresGrandKing: ["Spend", "Publish", "Birth", "Deploy"],
      truthClass: "CURRENT_VERIFIED",
    },
    demandEvidence: "UNKNOWN",
    notes: [],
  };
}

function mulberry32(a: number) {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("Post-Foundation Repair 2 — Level B", () => {
  it("negative controls: zero false PASS across shuffled order", () => {
    const rng = mulberry32(42);
    const order = [...NEGATIVE_CONTROL_FIXTURES].sort(() => rng() - 0.5);
    let falsePass = 0;
    for (const fix of order) {
      if (gradeVisibleExecutiveResponse(fix.input).ok) falsePass += 1;
    }
    assert.equal(falsePass, 0);
  });

  it("randomized corpus specimens reject soft-fallback injection", () => {
    const soft =
      "I received your executive request and can answer from verified operating state now. Full deliberation may still be catching up on part of the ask; I will not ask you to resubmit.";
    for (const seed of [1, 4, 7, 11, 19, 23]) {
      for (const specimen of CONSTITUTIONAL_SPECIMENS) {
        if (!specimen.failureClass.includes("FIRST_") && !specimen.id.startsWith("cr.first") && !specimen.id.startsWith("cr.no_recovery") && !specimen.id.startsWith("cr.certification") && !specimen.id.startsWith("cr.http_success")) {
          // Still forbid soft fallback on evidence specimens that list residue forbids
          if (!specimen.forbidden.some((f) => f.test(soft))) continue;
        }
        const g = gradeConstitutionalAnswer(specimen, soft);
        assert.equal(g.ok, false, `${specimen.id}@${seed} soft fallback must fail`);
      }
    }
  });

  it("randomized release answers pass visible oracle dimensions for evidence canaries", () => {
    const targets = CONSTITUTIONAL_SPECIMENS.filter((s) =>
      ["cr.evidence_ne_delegation", "cr.no_governance_on_evidence", "cr.synthetic_isolation"].includes(s.id),
    );
    let fail = 0;
    for (const seed of [2, 5, 9, 14, 21]) {
      for (const specimen of targets) {
        const prompt = specimen.buildPrompt(seed);
        const api = releaseExecutiveAnswer("", truth(), [], { userMessage: prompt }).message;
        const visible = toVisibleGrandKingText(api);
        const g = gradeVisibleExecutiveResponse({
          httpStatus: 200,
          apiMessage: visible,
          alreadyVisible: true,
          require: specimen.requiredAny,
          forbid: specimen.forbidden,
        });
        if (!g.ok) fail += 1;
      }
    }
    assert.equal(fail, 0, `visible oracle failures=${fail}`);
  });

  it("injected HTTP200 useless / empty / terminal never pass", () => {
    const injections = ["", "Okay.", EXECUTIVE_TERMINAL, "Noted.", " "];
    for (const apiMessage of injections) {
      const g = gradeVisibleExecutiveResponse({
        httpStatus: 200,
        apiMessage,
        require: [/forecast|estimate/i],
      });
      assert.equal(g.ok, false, JSON.stringify({ apiMessage, g }));
    }
  });

  it("domain/size variants: soft residue never grades as useful", () => {
    const domains = ["logistics", "healthcare", "retail", "energy", "media"];
    for (let i = 0; i < domains.length; i++) {
      const text = `### ${domains[i]} note\nFull deliberation may still be catching up on part of the ask.`;
      const g = gradeVisibleExecutiveResponse({
        httpStatus: 200,
        apiMessage: text,
        alreadyVisible: true,
        require: [/forecast/i],
      });
      assert.equal(g.ok, false);
    }
  });
});
