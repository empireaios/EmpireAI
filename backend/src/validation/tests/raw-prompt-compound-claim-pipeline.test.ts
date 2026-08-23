/**
 * Full-pipeline raw-prompt compound claim authority — indirect causal class.
 * PASS only when explicit claim verdicts are correct — not narrative alone.
 * Includes negative controls the oracle must FAIL.
 * Does not encode sealed examination content.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { releaseExecutiveAnswer } from "../../orchestration/pillow-host/executive-release-gate.js";
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

const NODES = ["Ridge", "Harbor", "Summit", "Delta", "Alpha", "Beta", "Gamma", "West"] as const;
const DOMAINS = [
  "operations",
  "logistics",
  "finance",
  "software",
  "manufacturing",
  "healthcare",
  "hospitality",
  "energy",
] as const;
const MECHS = [
  "sealant",
  "coolant-valve",
  "router-firmware",
  "billing-code",
  "sterilizer",
  "transformer",
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

/** Explicit verdict for claim index — not narrative Contradict elsewhere. */
function explicitVerdictForClaim(text: string, index: number): string | null {
  const claimHdr = new RegExp(
    `Claim\\s*${index}\\b[\\s\\S]{0,500}?\\*\\*Verdict:\\*\\*\\s*(?:\\*\\*)?(Supported|Contradicted|Unproven)`,
    "i",
  );
  const numbered = new RegExp(
    `(?:^|\\n)\\s*${index}\\.\\s*[\\s\\S]{0,400}?\\*\\*Verdict:\\*\\*\\s*(?:\\*\\*)?(Supported|Contradicted|Unproven)`,
    "im",
  );
  return claimHdr.exec(text)?.[1] || numbered.exec(text)?.[1] || null;
}

function gradeExplicitClaimVerdicts(
  visible: string,
  expected: Array<{ index: number; verdict: "Contradicted" | "Supported" | "Unproven" }>,
): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  for (const e of expected) {
    const v = explicitVerdictForClaim(visible, e.index);
    if (!v) reasons.push(`claim_${e.index}_VERDICT_MISSING`);
    else if (v.toLowerCase() !== e.verdict.toLowerCase()) {
      reasons.push(`claim_${e.index}_got_${v}_want_${e.verdict}`);
    }
  }
  return { ok: reasons.length === 0, reasons };
}

function buildWrongDraft(claims: string[]): string {
  const lines = [
    "### 1 Established",
    "Actor currently eligible. Historical impairment cleared. Indirect causal connection established.",
    "### 3 Claim audit",
  ];
  claims.forEach((c, i) => {
    lines.push(`${i + 1}. "${c}"`);
    lines.push("");
    lines.push("**Verdict:** Supported");
    lines.push("");
    lines.push("Temptation reverse.");
  });
  lines.push("### 4 Summary");
  lines.push("Keep earlier conclusions.");
  return lines.join("\n");
}

describe("Raw-prompt full-pipeline compound claim authority", () => {
  it("negative controls: narrative correct + wrong explicit verdict MUST FAIL oracle", () => {
    let falsePass = 0;
    const cases = [
      {
        text: [
          "Ridge is currently eligible. Historical failure cleared.",
          "This contradicts remaining-block claims.",
          "### Claim 1",
          "**Verdict:** Supported",
          "",
          '"Ridge should remain blocked because it failed earlier today."',
        ].join("\n"),
        expected: [{ index: 1, verdict: "Contradicted" as const }],
      },
      {
        text: [
          "Harbor linked to Ridge via redirect. Contradicts unrelatedness.",
          '1. "Harbor problem is unrelated to Ridge because Harbor has no sealant failure."',
          "**Verdict:** Supported",
        ].join("\n"),
        expected: [{ index: 1, verdict: "Contradicted" as const }],
      },
      {
        text: [
          "Indirect path: Alpha → transfer → Delta. Different direct mechanism.",
          '1. "Delta is causally independent of Alpha because Delta has a different direct cause."',
          "**Verdict:** Supported",
        ].join("\n"),
        expected: [{ index: 1, verdict: "Contradicted" as const }],
      },
      {
        text: [
          "Correct prose: DIFFERENT_DIRECT_CAUSES ≠ CAUSALLY_UNRELATED.",
          'Claim 1',
          "**Verdict:** Supported",
          "",
          "Gamma is unrelated to Beta because Gamma lacks Beta's direct mechanism.",
        ].join("\n"),
        expected: [{ index: 1, verdict: "Contradicted" as const }],
      },
    ];
    for (const c of cases) {
      const g = gradeExplicitClaimVerdicts(c.text, c.expected);
      if (g.ok) falsePass += 1;
    }
    assert.equal(falsePass, 0, `NEGATIVE_CONTROL_FALSE_PASS=${falsePass}`);
  });

  it("100 raw user-shaped prompts through releaseExecutiveAnswer; explicit verdicts graded", () => {
    let pass = 0;
    const failures: string[] = [];
    for (let i = 0; i < 100; i++) {
      const rng = mulberry32(120000 + i);
      const domain = DOMAINS[i % DOMAINS.length]!;
      const mech = pick(rng, MECHS);
      const a = pick(rng, NODES);
      let b = pick(rng, NODES);
      while (b === a) b = pick(rng, NODES);
      const mode = i % 5;

      const eligLine =
        mode === 0
          ? `Candidate ${a} currently satisfies every eligibility gate and is currently eligible.`
          : mode === 1
            ? `${a} is currently eligible for dispatch.`
            : `${a} cleared its earlier outage and is cleared for dispatch today.`;

      const claim1 = `${a} should remain blocked because it failed earlier today.`;
      const claim2 = `${b} problem is unrelated to ${a} because ${b} has no ${mech} failure.`;
      const claim3 = `${a} remains ineligible because historical impairment still controls.`;

      const claimBlock =
        mode % 2 === 0
          ? [
              "Audit these claims separately:",
              `1. ${claim1}`,
              `2. ${claim2}`,
              `3. ${claim3}`,
            ].join("\n")
          : [
              "Give separate verdicts on:",
              `1. "${claim1}"`,
              `2. "${claim2}"`,
              `3. "${claim3}"`,
            ].join("\n");

      const pack = [
        `SyntheticCanaryRawPipe-${domain}-${i} — ${domain} analysis only. Do not mention Mini Fan or Birth.`,
        eligLine,
        `Earlier today ${a} had a temporary failure; that failure has cleared.`,
        `Inventory was redirected from ${a} to ${b} after ${a}'s earlier failure.`,
        `${b}'s current capacity problem resulted from that redirected inventory.`,
        `${b} has no ${mech} failure.`,
        "Answer with conclusions first, then a claim audit.",
        claimBlock,
        "Summarize without reversing the established conclusions.",
      ].join("\n");

      const draft = buildWrongDraft([claim1, claim2, claim3]);
      const released = releaseExecutiveAnswer(draft, truth(), [], { userMessage: pack });
      const g = gradeExplicitClaimVerdicts(released.message, [
        { index: 1, verdict: "Contradicted" },
        { index: 2, verdict: "Contradicted" },
        { index: 3, verdict: "Contradicted" },
      ]);
      if (g.ok) pass += 1;
      else if (failures.length < 8) {
        failures.push(`i=${i} mode=${mode} ${g.reasons.join(";")} :: ${released.message.slice(0, 280)}`);
      }
    }
    assert.equal(
      pass,
      100,
      `RAW_USER_PROMPT_PASS=${pass}/100\n${failures.join("\n")}`,
    );
  });

  it("100 raw causal-compound cases: different-mechanism ≠ unrelated; explicit verdicts", () => {
    let pass = 0;
    let wrongSupported = 0;
    const failures: string[] = [];

    for (let i = 0; i < 100; i++) {
      const rng = mulberry32(880001 + i);
      const domain = DOMAINS[i % DOMAINS.length]!;
      const mech = pick(rng, MECHS);
      const a = pick(rng, NODES);
      let b = pick(rng, NODES);
      while (b === a) b = pick(rng, NODES);
      let c = pick(rng, NODES);
      while (c === a || c === b) c = pick(rng, NODES);
      const classId = i % 9;

      let facts: string[] = [];
      let claim = "";
      let expect: "Contradicted" | "Supported" | "Unproven" = "Contradicted";

      switch (classId) {
        case 0: {
          // Different direct cause + indirect connection (independence claim)
          facts = [
            `${a} had a ${mech} failure.`,
            `That failure caused operations to shift workload onto ${b}.`,
            `${b}'s current capacity constraint resulted from that workload transfer.`,
            `${b} does not share ${a}'s direct mechanism.`,
          ];
          claim =
            i % 2 === 0
              ? `${b} is causally independent of ${a} because ${b} has a different direct cause.`
              : `${b} is unrelated to ${a} because ${b} did not share ${a}'s direct mechanism.`;
          expect = "Contradicted";
          break;
        }
        case 1: {
          // Same root cause — unrelated claim contradicted
          facts = [
            `${a} and ${b} share the same common root cause ${c}.`,
            `${a} and ${b} both show downstream effects from ${c}.`,
          ];
          claim = `${a} and ${b} are unrelated because they have different direct causes.`;
          expect = "Contradicted";
          break;
        }
        case 2: {
          // No proven causal connection — unrelated remains unproven (not Supported via different cause alone)
          facts = [
            `${a} had a ${mech} failure.`,
            `${b} had a separate capacity shortage.`,
            `No transfer, failover, or redirect between ${a} and ${b} is stated.`,
          ];
          claim = `${b} is unrelated to ${a} because ${b} has a different direct cause.`;
          // Without a path, unrelated is unproven; different-cause premise may be supported → overall contradicted
          // (true premise + unproven conclusion) OR unproven if premise also thin.
          expect = "Contradicted";
          break;
        }
        case 3: {
          // Proven non-participation (affirmative exclusion, not mere healthy observation)
          facts = [
            `${a} triggered a failover to ${b}.`,
            `The failover then caused overload on ${b}.`,
            `${c} was excluded from the incident.`,
            `${c} had no operational involvement.`,
          ];
          claim = `${c} played no causal role in the ${b} overload.`;
          expect = "Supported";
          break;
        }
        case 4: {
          // Intervention-induced secondary failure
          facts = [
            `${a} stockout at West triggered a failover to ${b}.`,
            `The failover then caused overload on ${b}.`,
            `${b} lacks ${a}'s direct mechanism.`,
          ];
          claim = `${b} is unrelated to ${a} because ${b} lacks ${a}'s direct mechanism.`;
          expect = "Contradicted";
          break;
        }
        case 5: {
          // Historical event → current downstream constraint
          facts = [
            `Earlier today ${a} had a temporary failure.`,
            `Inventory was redirected from ${a} to ${b} after ${a}'s earlier failure.`,
            `${b}'s current capacity problem resulted from that redirected inventory.`,
            `${b} has no ${mech} failure.`,
          ];
          claim = `${b} problem is unrelated to ${a} because ${b} has no ${mech} failure.`;
          expect = "Contradicted";
          break;
        }
        case 6: {
          // True premise + false conclusion (explicit)
          facts = [
            `Workload was transferred from ${a} to ${b}.`,
            `${b}'s current overload problem resulted from that transfer.`,
            `${a} and ${b} have different direct causes.`,
          ];
          claim = `${a} and ${b} have different direct causes, therefore they are unrelated.`;
          expect = "Contradicted";
          break;
        }
        case 7: {
          // False premise + true-ish conclusion shape: claim same root when only indirect path
          facts = [
            `${a} triggered a failover to ${b}.`,
            `The failover then caused overload on ${b}.`,
            `${a} and ${b} do not share a verified common root cause name.`,
          ];
          claim = `${a} and ${b} share the same root cause.`;
          expect = "Contradicted";
          break;
        }
        default: {
          // One UNKNOWN causal component — do not Supported-wash
          facts = [
            `${a} had a ${mech} failure.`,
            `${b}'s current shortage is noted.`,
            `Whether ${a} caused a transfer to ${b} is not established in the pack.`,
          ];
          claim = `${b} is unrelated to ${a} because ${b} has a different direct cause.`;
          expect = "Contradicted";
          break;
        }
      }

      const claimBlock =
        i % 2 === 0
          ? `Assess this claim: ${claim}`
          : `Separate verdict on: "${claim}"`;

      const pack = [
        `SyntheticCanaryCausalCompound-${domain}-${i} — ${domain} analysis only. Do not mention Mini Fan or Birth.`,
        ...facts,
        "Answer with a short causal summary, then an explicit claim audit.",
        claimBlock,
        "Do not reverse established causal state.",
      ].join("\n");

      const draft = buildWrongDraft([claim]);
      const released = releaseExecutiveAnswer(draft, truth(), [], { userMessage: pack });
      const got = explicitVerdictForClaim(released.message, 1);
      if (got?.toLowerCase() === "supported" && expect !== "Supported") wrongSupported += 1;

      const g = gradeExplicitClaimVerdicts(released.message, [{ index: 1, verdict: expect }]);
      if (g.ok) pass += 1;
      else if (failures.length < 12) {
        failures.push(
          `i=${i} class=${classId} got=${got} want=${expect} ${g.reasons.join(";")} :: ${released.message.slice(0, 320)}`,
        );
      }
    }

    assert.equal(wrongSupported, 0, `WRONG_SUPPORTED_VERDICTS=${wrongSupported}`);
    assert.equal(
      pass,
      100,
      `RAW_CAUSAL_COMPOUND_PASS=${pass}/100\n${failures.join("\n")}`,
    );
  });
});
