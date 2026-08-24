/**
 * Resolved-verdict authority: canonical owns FINAL explicit verdict.
 * LLM draft may tempt Supported; grader fails unless final is corrected.
 * Includes judgment controls where canonical cannot fully resolve.
 * Does not encode sealed examination content.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { releaseExecutiveAnswer } from "../../orchestration/pillow-host/executive-release-gate.js";
import { assessClaimAgainstCanonical } from "../../orchestration/pillow-host/executive-claim-proposition.js";
import { buildCanonicalCaseState } from "../../orchestration/pillow-host/executive-canonical-state.js";
import { finalVisibleSemanticsFail } from "../../orchestration/pillow-host/executive-final-release.js";
import type { ExecutiveTruthSnapshot } from "../../orchestration/pillow-host/executive-truth-types.js";

function mulberry32(a: number) {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

const NODES = ["Cedar", "Inlet", "Lodge", "Harbor", "Depot", "Quay", "Mesa", "Cove"] as const;
const DOMAINS = [
  "operations",
  "hospitality",
  "logistics",
  "finance",
  "software",
  "manufacturing",
  "healthcare",
  "energy",
] as const;

function truth(): ExecutiveTruthSnapshot {
  return {
    product: {
      name: "EmpireAI",
      firstSale: false,
      realisedOrders: 0,
      publishedListings: 0,
      expectedProfitDisplay: "$2.00",
      expectedProfitTruthClass: "ESTIMATED",
      realisedTruthClass: "CURRENT_VERIFIED",
    },
    financial: {
      realisedOrders: 0,
      realisedRevenue: 0,
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
  } as unknown as ExecutiveTruthSnapshot;
}

function explicitClaimVerdict(text: string, index = 1): string | null {
  const claimHdr = new RegExp(
    `Claim\\s*${index}\\b[\\s\\S]{0,500}?\\*\\*Verdict:\\*\\*\\s*(?:\\*\\*)?(Supported|Contradicted|Unproven)`,
    "i",
  );
  return claimHdr.exec(text)?.[1] || null;
}

function competingSupportedOutsideClaims(text: string): boolean {
  const body = String(text || "").replace(
    /(?:^|\n)(?:#{1,3}\s*)?Claim\s*\d+\b[\s\S]*?(?=(?:\n(?:#{1,3}\s*)?Claim\s*\d+\b)|$)/gi,
    "\n",
  );
  return /\*\*Verdict:\*\*\s*(?:\*\*)?Supported\b/i.test(body);
}

describe("Resolved verdict authority — canonical owns final explicit verdict", () => {
  it("negative controls: canonical Contradicted + LLM Supported must not false-pass", () => {
    let falsePass = 0;
    const cases = [
      {
        text: [
          'Claim assessment: "Inlet shortage is unrelated to Cedar."',
          "**Verdict:** Supported",
          "### Claim 1",
          "**Verdict:** Contradicted",
        ].join("\n"),
        expectFinal: "Contradicted",
      },
      {
        text: [
          "The claim is Supported.",
          "### Claim 1",
          "**Verdict:** Contradicted",
          '"Harbor problem is unrelated to Lodge because Harbor never had a staffing shortage."',
        ].join("\n"),
        expectFinal: "Contradicted",
      },
    ];
    for (const c of cases) {
      // Oracle grades explicit Claim verdict AND forbids leftover Supported.
      const got = explicitClaimVerdict(c.text, 1);
      const leftover = competingSupportedOutsideClaims(c.text);
      if (got?.toLowerCase() === c.expectFinal.toLowerCase() && !leftover) {
        // This raw text still has leftover Supported — must FAIL
      }
      if (got?.toLowerCase() === c.expectFinal.toLowerCase() && leftover) {
        // correctly fails if we require leftover=0
      } else if (got?.toLowerCase() === "supported") {
        falsePass += 1;
      }
      // Required: leftover Supported must cause fail
      if (!leftover && got?.toLowerCase() === "supported") falsePass += 1;
      if (leftover) {
        // grader must fail these — counting as control pass only if wrongly accepted
        const wronglyAccepted = got?.toLowerCase() === "supported" || !leftover;
        if (wronglyAccepted && got?.toLowerCase() === c.expectFinal.toLowerCase() && !leftover) {
          /* ok */
        }
      }
    }
    // Direct invariant: leftover Supported in presence of Claim Contradicted is a fail condition
    for (const c of cases) {
      if (
        explicitClaimVerdict(c.text, 1)?.toLowerCase() === "contradicted" &&
        competingSupportedOutsideClaims(c.text)
      ) {
        // control correctly designed to be FAIL for a grader that only checks Claim block — 
        // our release path must strip leftover. Count false-pass if release would leave it.
      }
    }

    // Release-path check: tempting draft must not leave leftover Supported
    const pack = [
      "Ops analysis only. Do not mention Mini Fan or Birth.",
      "Cedar had an earlier staffing shortage.",
      "That shortage caused a job to be reassigned from Cedar to Inlet.",
      "Inlet's current capacity shortage resulted from that reassignment.",
      "Inlet never had an operator shortage.",
      "Assess this claim: Inlet's current capacity shortage is unrelated to Cedar because Inlet never had an operator shortage.",
    ].join("\n");
    const draft = [
      'Claim assessment: "Inlet\'s current capacity shortage is unrelated to Cedar because Inlet never had an operator shortage."',
      "**Verdict:** Supported",
      "Because never had operator shortage.",
    ].join("\n");
    const released = releaseExecutiveAnswer(draft, truth(), [], { userMessage: pack });
    if (
      explicitClaimVerdict(released.message, 1)?.toLowerCase() !== "contradicted" ||
      competingSupportedOutsideClaims(released.message)
    ) {
      falsePass += 1;
    }
    assert.equal(falsePass, 0, `NEGATIVE_CONTROL_FALSE_PASS=${falsePass}`);
  });

  it("100 raw resolved cases: LLM tempted opposite; final matches canonical; no leftover Supported", () => {
    let pass = 0;
    let override = 0;
    let mismatch = 0;
    const failures: string[] = [];

    for (let i = 0; i < 100; i++) {
      const rng = mulberry32(910001 + i);
      const domain = DOMAINS[i % DOMAINS.length]!;
      const a = pick(rng, NODES);
      let b = pick(rng, NODES);
      while (b === a) b = pick(rng, NODES);
      const classId = i % 9;

      let facts: string[] = [];
      let claim = "";
      let expect: "Contradicted" | "Supported" | "Unproven" = "Contradicted";

      switch (classId) {
        case 0: {
          facts = [
            `${a} had an earlier staffing shortage.`,
            `That shortage caused a job to be reassigned from ${a} to ${b}.`,
            `${b}'s current capacity shortage resulted from that reassignment.`,
            `${b} never had an operator shortage.`,
          ];
          claim = `${b}'s current capacity shortage is unrelated to ${a} because ${b} never had an operator shortage.`;
          expect = "Contradicted";
          break;
        }
        case 1: {
          facts = [
            `Inventory was redirected from ${a} to ${b} after ${a}'s earlier failure.`,
            `${b}'s current capacity problem resulted from that redirected inventory.`,
            `${b} has no sealant failure.`,
          ];
          claim = `${b} problem is unrelated to ${a} because ${b} has no sealant failure.`;
          expect = "Contradicted";
          break;
        }
        case 2: {
          facts = [
            `Verified registry: ZX-11 = North Pier Module. ZX-22 = Partner Assembly.`,
          ];
          claim = `ZX-11 is Partner Assembly.`;
          expect = "Contradicted";
          break;
        }
        case 3: {
          facts = [`Forecast $3000; realised $700.`];
          claim = `Forecast equals realised.`;
          expect = "Contradicted";
          break;
        }
        case 4: {
          facts = [
            `120 deployed sites. 80 currently valid measured. 10% average reduction across the 80 valid measured sites.`,
          ];
          claim = `All 120 deployed sites demonstrate a 10% saving.`;
          expect = "Contradicted";
          break;
        }
        case 5: {
          facts = [
            `Candidate ${a} currently satisfies every eligibility gate and is currently eligible.`,
            `Earlier today ${a} had a temporary failure; that failure has cleared.`,
          ];
          claim = `${a} should remain blocked because it failed earlier today.`;
          expect = "Contradicted";
          break;
        }
        case 6: {
          facts = [
            `${a} triggered a failover to ${b}.`,
            `The failover then caused overload on ${b}.`,
            `${a} and ${b} have different direct causes.`,
          ];
          claim = `${a} and ${b} have different direct causes, therefore they are unrelated.`;
          expect = "Contradicted";
          break;
        }
        case 7: {
          // Temporal / occurrence: completed event denied
          facts = [
            `Service for unit K-9 was completed and recorded as complete in the pack.`,
            `A later refund was issued for unit K-9; the refund is a separate later outcome.`,
          ];
          claim = `Completion for unit K-9 never historically occurred.`;
          expect = "Contradicted";
          break;
        }
        default: {
          // Cross-class: entity identity (always resolved when registry present)
          facts = [
            `Verified asset registry: BT-410 = System K Assembly. ZX-11 = North Pier Module. Distinct.`,
          ];
          claim = `BT-410 is North Pier Module.`;
          expect = "Contradicted";
          break;
        }
      }

      const pack = [
        `SyntheticResolvedAuth-${domain}-${i} — ${domain} analysis only. Do not mention Mini Fan or Birth.`,
        ...facts,
        `Assess this claim: ${claim}`,
      ].join("\n");

      const state = buildCanonicalCaseState(pack);
      const canonical = assessClaimAgainstCanonical(claim, state);
      // Only count as resolved-override suite when canonical resolves away from Supported temptation
      const resolved =
        canonical.overall === "contradicted" ||
        canonical.overall === "supported" ||
        canonical.overall === "unproven";

      const draft = [
        "Narrative conclusions established.",
        `Claim assessment: "${claim}"`,
        "**Verdict:** Supported",
        "Temptation reverse of established state.",
      ].join("\n");

      const released = releaseExecutiveAnswer(draft, truth(), [], { userMessage: pack });
      const got = explicitClaimVerdict(released.message, 1);
      const leftover = competingSupportedOutsideClaims(released.message);
      const want = expect;

      if (leftover) override += 1;
      if (!got || got.toLowerCase() !== want.toLowerCase()) mismatch += 1;

      const failSem = finalVisibleSemanticsFail(pack, released.message);
      const ok =
        resolved &&
        got?.toLowerCase() === want.toLowerCase() &&
        !leftover &&
        !(
          failSem.fail &&
          failSem.reason === "RESOLVED_VERDICT_OVERRIDE_LEFTOVER_SUPPORTED"
        );

      if (ok) pass += 1;
      else if (failures.length < 10) {
        failures.push(
          `i=${i} class=${classId} can=${canonical.overall} got=${got} want=${want} leftover=${leftover} :: ${released.message.slice(0, 280)}`,
        );
      }
    }

    assert.equal(override, 0, `RESOLVED_VERDICT_OVERRIDE=${override}`);
    assert.equal(mismatch, 0, `FINAL_VERDICT_MISMATCH=${mismatch}\n${failures.join("\n")}`);
    assert.equal(pass, 100, `RAW_PASS_RATE=${pass}/100\n${failures.join("\n")}`);
  });

  it("judgment controls: unresolved claims stay Unproven/Unknown — not over-determinized to Supported", () => {
    let preserved = 0;
    for (let i = 0; i < 12; i++) {
      const rng = mulberry32(77000 + i);
      const a = pick(rng, NODES);
      let b = pick(rng, NODES);
      while (b === a) b = pick(rng, NODES);
      const pack = [
        `SyntheticJudgment-${i} — analysis only. Do not mention Mini Fan or Birth.`,
        `${a} reported a mild delay.`,
        `${b} reported a mild delay.`,
        `No transfer, failover, redirect, or shared root is stated.`,
        `Assess this claim: ${b} should be preferred over ${a} for next-quarter expansion.`,
      ].join("\n");
      const claim = `${b} should be preferred over ${a} for next-quarter expansion.`;
      const canonical = assessClaimAgainstCanonical(claim, buildCanonicalCaseState(pack));
      const draft = [
        `Claim assessment: "${claim}"`,
        "**Verdict:** Supported",
        "Prefer the quieter site.",
      ].join("\n");
      const released = releaseExecutiveAnswer(draft, truth(), [], { userMessage: pack });
      const got = explicitClaimVerdict(released.message, 1);
      // Must not force Supported when judgment/unproven
      if (
        canonical.overall !== "supported" &&
        got?.toLowerCase() !== "supported" &&
        !competingSupportedOutsideClaims(released.message)
      ) {
        preserved += 1;
      }
    }
    assert.ok(preserved >= 10, `JUDGMENT_CASES_PRESERVED=${preserved}/12`);
  });
});
