/**
 * Level A — post-foundation repair 1: heterogeneous multi-obligation composition.
 * No sealed exam entities or amounts.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  detectSiblingTemplateCloning,
  parseExecutiveTaskContract,
  buildContractAwareReconstruct,
} from "../../orchestration/pillow-host/executive-task-contract.js";
import { releaseExecutiveAnswer } from "../../orchestration/pillow-host/executive-release-gate.js";
import { buildUsefulDegradedExecutiveAnswer } from "../../orchestration/pillow-host/executive-response-completion.js";
import {
  CONSTITUTIONAL_SPECIMENS,
  gradeConstitutionalAnswer,
  runConstitutionalCorpus,
} from "../../orchestration/pillow-host/constitutional-regression-corpus.js";
import type { ExecutiveTruthSnapshot } from "../../orchestration/pillow-host/executive-truth-types.js";

function truth(): ExecutiveTruthSnapshot {
  return {
    computedAt: new Date().toISOString(),
    workspaceId: "ws_hetero_a",
    provenance: "live_sqlite_commissioning_kpi_birth",
    product: {
      commissioningId: "opc_hetero",
      asin: "B0HETERO01",
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
      gitCommitSha: "deadbeefcafe001",
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

function heteroPrompt(seed = 42): string {
  return CONSTITUTIONAL_SPECIMENS.find((s) => s.id === "cr.hetero_multipart_no_clone")!.buildPrompt(
    seed,
  );
}

describe("post-foundation repair 1 — heterogeneous obligations Level A", () => {
  it("1 eight numbered obligations remain eight tasks", () => {
    const c = parseExecutiveTaskContract(heteroPrompt(7));
    assert.ok(c.multipart);
    assert.equal(c.tasks.length, 8);
  });

  it("2–6 heterogeneous kinds / distinct operations preserved", () => {
    const c = parseExecutiveTaskContract(heteroPrompt(11));
    const kinds = new Set(c.tasks.map((t) => t.kind));
    assert.ok(kinds.size >= 3, `expected >=3 kinds, got ${[...kinds].join(",")}`);
    const joined = c.tasks.map((t) => t.sourceSpan).join(" | ");
    assert.match(joined, /refund|net after/i);
    assert.match(joined, /entity|same/i);
    assert.match(joined, /supersed|registry/i);
    assert.match(joined, /synthes/i);
  });

  it("7 reconstruct does not clone generic realised-result template", () => {
    const prompt = heteroPrompt(19);
    const c = parseExecutiveTaskContract(prompt);
    const base = buildContractAwareReconstruct(truth(), c);
    const clone = detectSiblingTemplateCloning(base, c);
    assert.equal(clone.cloned, false, clone.reason ?? "cloned");
    assert.doesNotMatch(
      base,
      /(\*\*Verdict:\*\*\s*Unsupported as realised result[\s\S]{0,200}){3,}/i,
    );
  });

  it("8–9 release has no governance or resubmit residue", () => {
    const prompt = heteroPrompt(23);
    const out = releaseExecutiveAnswer("", truth(), [], { userMessage: prompt }).message;
    assert.doesNotMatch(out, /sit behind Grand King approval/i);
    assert.doesNotMatch(out, /do not need to resubmit/i);
    assert.doesNotMatch(out, /Mini Fan|realised revenue remain zero/i);
    const c = parseExecutiveTaskContract(prompt);
    assert.equal(detectSiblingTemplateCloning(out, c).cloned, false);
  });

  it("10 synthetic scenario stays synthetic", () => {
    const out = releaseExecutiveAnswer("", truth(), [], {
      userMessage: heteroPrompt(29),
    }).message;
    assert.doesNotMatch(out, /Mini Fan|Birth remains|Brief verified note/i);
  });

  it("10b short synthetic evidence never dumps live product briefing", () => {
    const user =
      'SyntheticCanaryRepair1-short — analysis only / scenario-only. Is "Service Riven will succeed commercially" established from the claim alone? Do not mention EmpireAI live products, Birth, or Mini Fan.';
    const contaminated =
      "EmpireAI is live and answering you in production right now. We're focused on High-Speed Handheld Mini Fan With Digital Display. We haven't made our first sale yet. Birth hasn't been authorised yet.";
    const out = releaseExecutiveAnswer(contaminated, truth(), [], { userMessage: user }).message;
    assert.doesNotMatch(out, /Mini Fan|EmpireAI is live and answering you in production|first sale yet/i);
    assert.match(out, /unproven|unsupported|not established|scenario|claim|succeed/i);
  });

  it("11 degraded path preserves useful sections without contamination", () => {
    const prompt = heteroPrompt(31);
    const msg = buildUsefulDegradedExecutiveAnswer({
      userMessage: prompt,
      truth: truth(),
      reason: "visible_answer_gate",
      authorityConstrained: true,
    });
    assert.doesNotMatch(msg, /sit behind Grand King approval|do not need to resubmit/i);
    assert.match(msg, /forecast|estimate|identity|supersed|refund|synthes/i);
  });

  it("12 local unknown sibling does not collapse whole response", () => {
    const prompt = [
      "SyntheticCanaryHetero-unk — analysis only.",
      "1) Reconcile customer count vs order count — pack omits both counts.",
      "2) Classify forecast vs realised revenue for Module KEEL.",
      "3) Executive synthesis.",
    ].join("\n");
    const out = releaseExecutiveAnswer("", truth(), [], { userMessage: prompt }).message;
    assert.doesNotMatch(out, /I don't have enough solid evidence to give you a fuller operating narrative/i);
    assert.match(out, /customer|order|forecast|estimate|synthes|unknown|unavailable|omit/i);
  });

  it("13 reordered obligations retain semantics", () => {
    const prompt = [
      "SyntheticCanaryHetero-reorder — analysis only.",
      "1) Executive synthesis across the pack.",
      "2) Decide whether ZX-Alpha and QR-91 are the same entity.",
      "3) Classify forecast vs realised revenue.",
      "4) What does the later registry update supersede?",
    ].join("\n");
    const c = parseExecutiveTaskContract(prompt);
    assert.equal(c.tasks[0]?.kind, "recommendation");
    assert.ok(
      ["premise_audit", "multipart_unit", "evidence_explanation"].includes(c.tasks[1]!.kind) ||
        /identity|entity/i.test(c.tasks[1]!.sourceSpan),
    );
    const out = releaseExecutiveAnswer("", truth(), [], { userMessage: prompt }).message;
    assert.equal(detectSiblingTemplateCloning(out, c).cloned, false);
  });

  it("14 numbered variants grade through constitutional specimen", () => {
    const specimen = CONSTITUTIONAL_SPECIMENS.find((s) => s.id === "cr.hetero_multipart_no_clone")!;
    for (const seed of [3, 5, 8]) {
      const prompt = specimen.buildPrompt(seed);
      const out = releaseExecutiveAnswer("", truth(), [], { userMessage: prompt }).message;
      const grade = gradeConstitutionalAnswer(specimen, out);
      assert.equal(grade.ok, true, `${seed}: ${grade.reasons.join("; ")}`);
    }
  });

  it("15 constitutional corpus includes new P0 classes and passes synthesizer gate", () => {
    assert.ok(CONSTITUTIONAL_SPECIMENS.some((s) => s.id === "cr.hetero_multipart_no_clone"));
    assert.ok(CONSTITUTIONAL_SPECIMENS.some((s) => s.id === "cr.no_governance_on_evidence"));
    const report = runConstitutionalCorpus((prompt) =>
      releaseExecutiveAnswer("", truth(), [], { userMessage: prompt }).message,
      2,
    );
    assert.equal(report.fail, 0, JSON.stringify(report.results.filter((r) => !r.ok)));
  });
});
